import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { draftIntro, aiConfigured } from "@/lib/ai";

export const dynamic = "force-dynamic";

const REP_VERIFIED = 40;
const REP_OUTCOME = 60;
const GOLD_AT = 3;

// A stable pseudo-value so outcomes are deterministic (no Math.random on the server path).
function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

async function buildState() {
  const [members, refs, signals, outcomes] = await Promise.all([
    prisma.user.findMany({ orderBy: { name: "asc" } }),
    prisma.referral.findMany({ orderBy: { createdAt: "asc" }, include: { intro: true } }),
    prisma.signal.findMany({ where: { active: true } }),
    prisma.outcome.findMany(),
  ]);

  const byId = new Map(members.map((m) => [m.id, m]));
  // Derive reputation/tier from the referral ledger — single source of truth.
  const stat = new Map<string, { verified: number; outcomes: number }>();
  members.forEach((m) => stat.set(m.id, { verified: 0, outcomes: 0 }));
  refs.forEach((r) => {
    const s = stat.get(r.insiderId);
    if (!s) return;
    if (r.status === "VERIFIED" || r.status === "OUTCOME") s.verified += 1;
    if (r.status === "OUTCOME") s.outcomes += 1;
  });

  const memberOut = members.map((m) => {
    const s = stat.get(m.id)!;
    const rep = s.verified * REP_VERIFIED + s.outcomes * REP_OUTCOME;
    return {
      id: m.id,
      name: m.name,
      color: m.avatarColor,
      title: m.title,
      rep,
      credits: s.verified,
      verified: s.verified,
      outcomes: s.outcomes,
      tier: s.verified >= GOLD_AT ? "GOLD" : "SILVER",
    };
  });

  const sroi = outcomes.reduce((a, o) => a + o.rawValue, 0);
  const verifiedTotal = refs.filter((r) => r.status !== "PENDING_CONFIRM").length;
  const outcomeTotal = refs.filter((r) => r.status === "OUTCOME").length;
  const confidence = Math.min(97, 52 + outcomeTotal * 7 + verifiedTotal * 2);

  const referralsOut = refs.map((r) => {
    const g = byId.get(r.insiderId);
    const t = byId.get(r.requesterId);
    return {
      id: r.id,
      giverId: r.insiderId,
      giverName: g?.name || "?",
      giverColor: g?.avatarColor || "#888",
      takerId: r.requesterId,
      takerName: t?.name || "?",
      opportunity: r.role,
      status: r.status,
      intro: r.intro
        ? { id: r.intro.id, body: r.intro.body, grounded: r.intro.grounded, status: r.intro.status, source: r.intro.source }
        : null,
    };
  });

  return {
    aiConfigured: aiConfigured(),
    members: memberOut,
    signals: signals.map((s) => ({ id: s.id, memberId: s.memberId, kind: s.kind, detail: s.detail })),
    referrals: referralsOut,
    sroi,
    confidence,
  };
}

export async function GET() {
  return NextResponse.json(await buildState());
}

export async function POST(req: Request) {
  const b = await req.json().catch(() => ({}));
  const action = String(b.action || "");

  try {
    if (action === "create") {
      const giver = await prisma.user.findUnique({ where: { id: String(b.giverId) } });
      const taker = await prisma.user.findUnique({ where: { id: String(b.takerId) } });
      if (!giver || !taker) return NextResponse.json({ error: "Unknown member." }, { status: 400 });
      if (giver.id === taker.id) return NextResponse.json({ error: "An insider can't refer themselves." }, { status: 400 });
      const opportunity = String(b.opportunity || "").trim() || "an opportunity";

      const referral = await prisma.referral.create({
        data: {
          requesterId: taker.id, // the candidate who benefits
          insiderId: giver.id, // the referrer who vouches
          role: opportunity,
          company: giver.company || "",
          status: "PENDING_CONFIRM",
          stage: "REFERRED",
        },
      });

      // Agentic step: draft the intro, held for approval. Grounded or "needs a person".
      const intro = await draftIntro({
        giver: { name: giver.name, title: giver.title, company: giver.company },
        taker: { name: taker.name },
        opportunity,
      });
      await prisma.introDraft.create({
        data: {
          referralId: referral.id,
          body: intro.body,
          grounded: intro.grounded,
          source: intro.source,
          status: "HELD",
        },
      });

      // The predicted need is now being actioned — retire the member's active signals.
      await prisma.signal.updateMany({ where: { memberId: taker.id, active: true }, data: { active: false } });
    } else if (action === "approve") {
      await prisma.introDraft.update({ where: { referralId: String(b.referralId) }, data: { status: "APPROVED" } });
    } else if (action === "confirm") {
      const ref = await prisma.referral.update({ where: { id: String(b.referralId) }, data: { status: "VERIFIED" } });
      // Persist earned Gold so the Gold directory reflects it (3+ peer-verified referrals).
      const verified = await prisma.referral.count({
        where: { insiderId: ref.insiderId, status: { in: ["VERIFIED", "OUTCOME"] } },
      });
      if (verified >= GOLD_AT) {
        const insider = await prisma.user.findUnique({ where: { id: ref.insiderId } });
        if (insider && insider.tier !== "GOLD") {
          await prisma.user.update({ where: { id: ref.insiderId }, data: { tier: "GOLD", goldSince: new Date() } });
        }
      }
    } else if (action === "outcome") {
      const r = await prisma.referral.findUnique({ where: { id: String(b.referralId) } });
      if (!r) return NextResponse.json({ error: "Unknown referral." }, { status: 400 });
      const value = 45000 + (hash("out" + r.id) % 75000);
      await prisma.$transaction([
        prisma.referral.update({ where: { id: r.id }, data: { status: "OUTCOME" } }),
        prisma.outcome.create({
          data: { memberId: r.insiderId, type: "JOB", who: r.requesterId, rawValue: value, attribution: 100, verified: true },
        }),
      ]);
    } else if (action === "reset") {
      await prisma.$transaction([
        prisma.introDraft.deleteMany(),
        prisma.outcome.deleteMany(),
        prisma.referral.deleteMany(),
        prisma.signal.updateMany({ data: { active: true } }),
        prisma.user.updateMany({ data: { tier: "SILVER", goldSince: null } }), // Gold is re-earned
      ]);
    } else {
      return NextResponse.json({ error: "Unknown action." }, { status: 400 });
    }
    return NextResponse.json(await buildState());
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
