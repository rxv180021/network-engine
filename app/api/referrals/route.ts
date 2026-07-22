import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

// Request a referral: spends 1 reciprocity credit, opens a tracked thread.
export async function POST(req: Request) {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const b = await req.json().catch(() => ({}));
  const insiderId = String(b.insiderId || "");
  const role = String(b.role || "");
  const company = String(b.company || "");
  const matchScore = Number(b.matchScore || 0);
  if (!insiderId || !role || !company) {
    return NextResponse.json({ error: "Missing referral details." }, { status: 400 });
  }
  if (me.credits < 1) {
    return NextResponse.json(
      { error: "You're out of credits — refer someone first to earn one.", code: "NO_CREDITS" },
      { status: 402 }
    );
  }

  const [, referral] = await prisma.$transaction([
    prisma.user.update({ where: { id: me.id }, data: { credits: { decrement: 1 } } }),
    prisma.referral.create({
      data: { requesterId: me.id, insiderId, role, company, stage: "REFERRED", matchScore },
    }),
    prisma.creditEntry.create({
      data: { userId: me.id, delta: -1, reason: `Requested ${role} @ ${company}` },
    }),
  ]);

  return NextResponse.json({ ok: true, referralId: referral.id, credits: me.credits - 1 });
}
