import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { isOutcomeType } from "@/lib/sroi";

// Log a verified outcome into the ledger.
export async function POST(req: Request) {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const b = await req.json().catch(() => ({}));
  const type = String(b.type || "");
  const who = String(b.who || "").trim() || "Member";
  const rawValue = Number(b.rawValue);
  const attribution = Math.max(0, Math.min(100, Number(b.attribution)));

  if (!isOutcomeType(type)) return NextResponse.json({ error: "Unknown outcome type." }, { status: 400 });
  if (!Number.isFinite(rawValue) || rawValue <= 0) {
    return NextResponse.json({ error: "Enter a positive value." }, { status: 400 });
  }

  const outcome = await prisma.outcome.create({
    data: { memberId: me.id, type, who, rawValue, attribution, verified: true },
  });
  return NextResponse.json({ ok: true, id: outcome.id });
}
