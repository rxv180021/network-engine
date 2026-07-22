import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { rankInsiders, draftIntro } from "@/lib/matching";

export async function POST(req: Request) {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const b = await req.json().catch(() => ({}));
  const role = String(b.role || "");
  const companies: string[] = Array.isArray(b.companies) ? b.companies.map(String) : [];
  if (!role || companies.length === 0) {
    return NextResponse.json({ error: "Pick a role and at least one company." }, { status: 400 });
  }

  const insiders = await prisma.user.findMany({
    where: { tier: "GOLD", NOT: { id: me.id } },
    select: { id: true, name: true, title: true, company: true, industry: true, refersFor: true, referralScore: true, avatarColor: true },
  });

  const ranked = rankInsiders(insiders, { role, companies, industry: me.industry }).slice(0, 4);
  return NextResponse.json({
    results: ranked.map((r) => ({
      id: r.id,
      name: r.name,
      title: r.title,
      company: r.company,
      referralScore: r.referralScore,
      avatarColor: r.avatarColor,
      breakdown: r.breakdown,
      intro: draftIntro(r.name, role, r.company ?? ""),
    })),
    role,
  });
}
