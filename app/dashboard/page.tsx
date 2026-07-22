import Nav from "@/components/Nav";
import EngineConsole from "@/components/EngineConsole";
import { requireUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await requireUser();
  return (
    <>
      <Nav active="dashboard" />
      <main className="container" style={{ padding: "clamp(1.4rem,4vw,2.4rem) 0" }}>
        <p className="eyebrow" style={{ marginBottom: "0.6rem" }}>
          The referral engine · live console
        </p>
        <h1 className="page-title">Hi {user.name.split(" ")[0]} — here&apos;s who needs an intro, and who&apos;ll land it.</h1>
        <p className="muted" style={{ marginBottom: "1.4rem", maxWidth: "64ch" }}>
          The engine reads opt-in signals, predicts the best insider, and drafts the intro — held for your
          approval. Confirm it, log the outcome, and the whole network gets smarter. Nothing sends without a human.
        </p>
        <EngineConsole />
      </main>
    </>
  );
}
