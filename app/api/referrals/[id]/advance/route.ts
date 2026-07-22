import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { ACTIVE_PIPELINE } from "@/lib/constants";

// Advance a referral thread one stage. Landing on HIRED logs a verified JOB outcome
// for the insider and bumps their Referral Score — closing the loop to the ledger.
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const { id } = await params;
  const referral = await prisma.referral.findUnique({ where: { id }, include: { requester: true } });
  if (!referral) return NextResponse.json({ error: "Not found." }, { status: 404 });
  if (referral.requesterId !== me.id && me.role !== "ADMIN") {
    return NextResponse.json({ error: "Not allowed." }, { status: 403 });
  }

  const idx = ACTIVE_PIPELINE.indexOf(referral.stage as (typeof ACTIVE_PIPELINE)[number]);
  if (idx < 0 || idx >= ACTIVE_PIPELINE.length - 1) {
    return NextResponse.json({ ok: true, stage: referral.stage, done: true });
  }
  const nextStage = ACTIVE_PIPELINE[idx + 1];

  await prisma.referral.update({ where: { id }, data: { stage: nextStage } });

  if (nextStage === "HIRED") {
    await prisma.$transaction([
      prisma.outcome.create({
        data: {
          memberId: referral.insiderId,
          type: "JOB",
          who: referral.requester.name,
          rawValue: 90000,
          attribution: 30,
          verified: true,
          note: `Hired at ${referral.company} via verified referral`,
        },
      }),
      prisma.user.update({ where: { id: referral.insiderId }, data: { referralScore: { increment: 15 } } }),
    ]);
  }

  return NextResponse.json({ ok: true, stage: nextStage, hired: nextStage === "HIRED" });
}
