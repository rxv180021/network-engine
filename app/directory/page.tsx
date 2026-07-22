import Nav from "@/components/Nav";
import DirectoryClient from "@/components/DirectoryClient";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function DirectoryPage() {
  const [members, user] = await Promise.all([
    prisma.user.findMany({
      where: { tier: "GOLD" },
      orderBy: { referralScore: "desc" },
      select: {
        id: true, name: true, title: true, company: true, industry: true,
        refersFor: true, referralScore: true, avatarColor: true, linkedinUrl: true, goldSince: true,
      },
    }),
    getCurrentUser(),
  ]);

  const data = members.map((m) => ({ ...m, goldSince: m.goldSince ? m.goldSince.toISOString() : null }));

  return (
    <>
      <Nav active="directory" />
      <main className="container" style={{ padding: "clamp(2rem,5vw,3.5rem) 0" }}>
        <p className="eyebrow" style={{ marginBottom: "0.8rem" }}>
          Gold Status Directory
        </p>
        <h1 className="page-title">Proven referrers — verified, not promised.</h1>
        <p className="muted" style={{ marginBottom: "1.8rem" }}>
          Everyone here cleared the proof bar: a real referral in the last 12 months.
        </p>
        <DirectoryClient members={data} signedIn={!!user} />
      </main>
    </>
  );
}
