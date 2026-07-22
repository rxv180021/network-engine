import Nav from "@/components/Nav";
import OutcomesClient from "@/components/OutcomesClient";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function OutcomesPage() {
  await requireUser();
  const rows = await prisma.outcome.findMany({
    orderBy: { createdAt: "desc" },
    include: { member: { select: { name: true } } },
  });
  const initial = rows.map((o) => ({
    id: o.id,
    type: o.type,
    who: o.who,
    rawValue: o.rawValue,
    attribution: o.attribution,
    memberName: o.member.name.split(" ")[0],
  }));

  return (
    <>
      <Nav active="outcomes" />
      <main className="container" style={{ padding: "clamp(1.6rem,4vw,2.6rem) 0" }}>
        <p className="eyebrow" style={{ marginBottom: "0.7rem" }}>
          Outcome Ledger
        </p>
        <h1 className="page-title">The number sponsors renew on.</h1>
        <p className="muted" style={{ marginBottom: "1.6rem", maxWidth: "62ch" }}>
          We standardize every verified outcome — jobs, clients, founders, capital — into one unit
          with SROI (financial proxy × attribution). Add one and watch the return update live.
        </p>
        <OutcomesClient initial={initial} />
      </main>
    </>
  );
}
