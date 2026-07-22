import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

// Approve or reject a Gold-status application. Approval promotes the member to Gold.
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const me = await getCurrentUser();
  if (!me || me.role !== "ADMIN") return NextResponse.json({ error: "Admins only." }, { status: 403 });

  const { id } = await params;
  const b = await req.json().catch(() => ({}));
  const action = String(b.action || "");
  if (!["approve", "reject"].includes(action)) {
    return NextResponse.json({ error: "Invalid action." }, { status: 400 });
  }

  const application = await prisma.application.findUnique({ where: { id } });
  if (!application) return NextResponse.json({ error: "Not found." }, { status: 404 });

  if (action === "approve") {
    await prisma.$transaction([
      prisma.application.update({ where: { id }, data: { status: "APPROVED", reviewedAt: new Date() } }),
      prisma.user.update({
        where: { id: application.userId },
        data: {
          tier: "GOLD",
          goldSince: new Date(),
          credits: { increment: 3 },
          company: application.company,
          title: application.role,
          industry: application.industry,
          refersFor: application.refersFor,
        },
      }),
    ]);
  } else {
    await prisma.application.update({ where: { id }, data: { status: "REJECTED", reviewedAt: new Date() } });
  }

  return NextResponse.json({ ok: true, status: action === "approve" ? "APPROVED" : "REJECTED" });
}
