import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/auth";

export async function POST(req: Request) {
  const b = await req.json().catch(() => ({}));
  const email = String(b.email || "").toLowerCase().trim();
  const name = String(b.name || "").trim();
  if (!email || !name || !b.company || !b.role) {
    return NextResponse.json({ error: "Name, email, company and role are required." }, { status: 400 });
  }

  let user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    user = await prisma.user.create({
      data: {
        email,
        name,
        passwordHash: hashPassword("demo1234"),
        tier: "SILVER",
        title: String(b.role),
        company: String(b.company),
        industry: String(b.industry || "Technology"),
        refersFor: String(b.refersFor || ""),
        linkedinUrl: b.linkedinUrl ? String(b.linkedinUrl) : null,
        credits: 0,
      },
    });
  }

  await prisma.application.create({
    data: {
      userId: user.id,
      company: String(b.company),
      role: String(b.role),
      industry: String(b.industry || "Technology"),
      refersFor: String(b.refersFor || ""),
      linkedinUrl: b.linkedinUrl ? String(b.linkedinUrl) : null,
      proofName: b.proofName ? String(b.proofName) : null,
      status: "PENDING",
    },
  });

  return NextResponse.json({ ok: true, email, tempPassword: "demo1234" });
}
