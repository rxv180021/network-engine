import Nav from "@/components/Nav";
import AdminClient from "@/components/AdminClient";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  await requireAdmin();

  const [applications, goldCount] = await Promise.all([
    prisma.application.findMany({
      where: { status: "PENDING" },
      orderBy: { createdAt: "desc" },
      include: { user: { select: { name: true, avatarColor: true } } },
    }),
    prisma.user.count({ where: { tier: "GOLD" } }),
  ]);

  const pending = applications.map((a) => ({
    id: a.id,
    name: a.user.name,
    company: a.company,
    role: a.role,
    industry: a.industry,
    refersFor: a.refersFor,
    linkedinUrl: a.linkedinUrl,
    proofName: a.proofName,
    avatarColor: a.user.avatarColor,
  }));

  return (
    <>
      <Nav active="admin" />
      <main className="container" style={{ padding: "clamp(1.6rem,4vw,2.6rem) 0" }}>
        <p className="eyebrow" style={{ marginBottom: "0.7rem" }}>
          Admin
        </p>
        <h1 className="page-title">Review &amp; verify.</h1>
        <p className="muted" style={{ marginBottom: "1.6rem" }}>
          Approve real proof to promote members to Gold. Nothing is auto-approved.
        </p>
        <AdminClient pending={pending} goldCount={goldCount} />
      </main>
    </>
  );
}
