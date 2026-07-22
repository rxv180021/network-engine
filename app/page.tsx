import Link from "next/link";
import Nav from "@/components/Nav";

export default function Home() {
  return (
    <>
      <Nav />
      <main>
        {/* hero */}
        <section className="grid-bg" style={{ borderBottom: "1px solid var(--line)" }}>
          <div className="container" style={{ padding: "clamp(3rem,9vw,7rem) 0" }}>
            <p className="eyebrow" style={{ marginBottom: "1.4rem" }}>
              The no-ghost referral network
            </p>
            <h1 className="display" style={{ maxWidth: "17ch" }}>
              LinkedIn collects your contacts. None of them are <span className="gold">networking for you.</span>
            </h1>
            <p className="lede" style={{ maxWidth: "54ch", marginTop: "1.6rem" }}>
              Network Engine earns you in by proof, not promises — then an agent predicts who needs a warm
              intro, drafts it, and holds it for your approval. A referral only counts when the recipient
              confirms. Reputation compounds into real access; Gold is earned, never bought.
            </p>
            <div className="row" style={{ gap: "0.8rem", marginTop: "2rem", flexWrap: "wrap" }}>
              <Link href="/apply" className="btn">
                Apply for Gold status →
              </Link>
              <Link href="/directory" className="btn neutral">
                Browse the directory
              </Link>
            </div>
            <p className="footnote" style={{ marginTop: "1.6rem" }}>
              Demo: sign in with <span className="gold">amara@demo.networkengine.app</span> ·
              password <span className="gold">demo1234</span> (or any seeded member).
            </p>
          </div>
        </section>

        {/* how it works */}
        <section className="container" style={{ padding: "clamp(2.5rem,6vw,4.5rem) 0" }}>
          <p className="eyebrow" style={{ marginBottom: "1.4rem" }}>
            How the engine works
          </p>
          <h2 className="head" style={{ maxWidth: "22ch", marginBottom: "2rem" }}>
            An agent that predicts the intro, drafts it, and <span className="serif-em">holds it for you.</span>
          </h2>
          <div className="tiles">
            {[
              ["01 · Predict", "The need, before they ask", "Opt-in signals — open-to-work, tenure, layoffs — surface who needs a warm intro now."],
              ["02 · Match", "Who actually lands it", "Ranks insiders by who converts, not just who's connected. It learns from every outcome."],
              ["03 · Draft", "AI writes, human approves", "The agent drafts the intro grounded in real facts — and holds it. It never sends on its own."],
              ["04 · Confirm", "No ghost, no self-report", "The referral only counts when the recipient confirms it. Peer-verified, or it doesn't exist."],
              ["05 · Prove", "Outcome → reputation → Gold", "Landed outcomes feed the SROI ledger, raise reputation, and earn Gold — never bought."],
            ].map(([i, t, d]) => (
              <div className="tile" key={i}>
                <div className="mono" style={{ color: "var(--gold)", fontSize: "0.7rem", letterSpacing: "0.1em" }}>
                  {i}
                </div>
                <div style={{ fontWeight: 600, marginTop: "0.5rem", fontSize: "1.05rem" }}>{t}</div>
                <div style={{ color: "var(--muted)", fontSize: "0.86rem", marginTop: "0.35rem", lineHeight: 1.4 }}>{d}</div>
              </div>
            ))}
          </div>
        </section>

        {/* moat strip */}
        <section style={{ borderTop: "1px solid var(--line)", background: "var(--ink-2)" }}>
          <div className="container" style={{ padding: "clamp(2rem,5vw,3.5rem) 0" }}>
            <div className="row" style={{ gap: "2rem", flexWrap: "wrap", justifyContent: "space-between" }}>
              <div style={{ maxWidth: "40ch" }}>
                <h2 className="head" style={{ fontSize: "1.6rem" }}>
                  The moat is the <span className="gold">verified data</span> no one else can collect.
                </h2>
                <p className="lede" style={{ fontSize: "1rem", marginTop: "0.8rem" }}>
                  Every referral → outcome is proprietary — competitors have no proof layer. It
                  compounds into predictions only we can make.
                </p>
              </div>
              <div className="tiles" style={{ flex: "1 1 380px" }}>
                <div className="tile lead">
                  <div className="v">
                    30<span className="u">%</span>
                  </div>
                  <div className="k">of hires come from referrals</div>
                </div>
                <div className="tile">
                  <div className="v">
                    10<span className="u">×</span>
                  </div>
                  <div className="k">more likely to be hired</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <footer style={{ borderTop: "1px solid var(--line)" }}>
          <div
            className="container"
            style={{ padding: "2rem 0", display: "flex", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}
          >
            <span className="footnote">Network Engine — the no-ghost referral network.</span>
            <span className="footnote">Built for professional communities that run on warm intros.</span>
          </div>
        </footer>
      </main>
    </>
  );
}
