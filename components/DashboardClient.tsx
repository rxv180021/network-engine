"use client";
import { useState } from "react";
import { initials } from "@/lib/ui";
import { ROLES } from "@/lib/constants";

const PIPE = ["REFERRED", "INTERVIEWING", "OFFER", "HIRED"];

type Thread = { id: string; role: string; company: string; stage: string; insiderName: string; insiderColor: string };
type MatchResult = {
  id: string; name: string; title: string | null; company: string | null;
  referralScore: number; avatarColor: string; intro: string;
  breakdown: { company: number; roleFit: number; rep: number; warm: number; total: number };
};

export default function DashboardClient({
  user,
  companies,
  initialThreads,
}: {
  user: { name: string; tier: string; referralScore: number; credits: number };
  companies: string[];
  initialThreads: Thread[];
}) {
  const [credits, setCredits] = useState(user.credits);
  const [threads, setThreads] = useState<Thread[]>(initialThreads);
  const [role, setRole] = useState<string>(ROLES[0]);
  const [picked, setPicked] = useState<string[]>(companies.slice(0, 2));
  const [results, setResults] = useState<MatchResult[] | null>(null);
  const [openIntro, setOpenIntro] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<{ msg: string; warn?: boolean } | null>(null);

  function flash(msg: string, warn = false) {
    setToast({ msg, warn });
    setTimeout(() => setToast(null), 2600);
  }
  const toggleCo = (c: string) => setPicked((p) => (p.includes(c) ? p.filter((x) => x !== c) : [...p, c]));

  async function findInsiders() {
    if (picked.length === 0) return flash("Pick at least one company.", true);
    setBusy(true);
    const res = await fetch("/api/match", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role, companies: picked }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) return flash(data.error || "Match failed.", true);
    setResults(data.results);
  }

  async function requestReferral(m: MatchResult) {
    const res = await fetch("/api/referrals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ insiderId: m.id, role, company: m.company, matchScore: m.breakdown.total }),
    });
    const data = await res.json();
    if (!res.ok) return flash(data.error || "Could not request.", true);
    setCredits(data.credits);
    setThreads((t) => [
      { id: data.referralId, role, company: m.company ?? "", stage: "REFERRED", insiderName: m.name, insiderColor: m.avatarColor },
      ...t,
    ]);
    flash(`Referral requested via ${m.name} · −1 credit.`);
  }

  async function advance(t: Thread) {
    const res = await fetch(`/api/referrals/${t.id}/advance`, { method: "POST" });
    const data = await res.json();
    if (!res.ok) return flash(data.error || "Failed.", true);
    setThreads((ts) => ts.map((x) => (x.id === t.id ? { ...x, stage: data.stage } : x)));
    if (data.hired) flash(`🎉 Hired at ${t.company}! Logged to the outcome ledger.`);
  }

  return (
    <>
      {/* header KPIs */}
      <div className="row" style={{ gap: "1rem", flexWrap: "wrap", marginBottom: "1.6rem" }}>
        <div className="tile" style={{ flex: "1 1 160px" }}>
          <div className="v verify">{user.referralScore}</div>
          <div className="k">Referral Score</div>
        </div>
        <div className="tile lead" style={{ flex: "1 1 160px" }}>
          <div className="v">{credits}</div>
          <div className="k">Reciprocity credits</div>
        </div>
        <div className="tile" style={{ flex: "1 1 160px" }}>
          <div className="v" style={{ fontSize: "1.4rem" }}>
            {user.tier === "GOLD" ? "◆ Gold" : "○ Silver"}
          </div>
          <div className="k">Status</div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: "1.2rem", alignItems: "start" }} className="dash-grid">
        {/* request */}
        <div className="panel">
          <div className="panel-head">
            <h3>Request a referral</h3>
            <span className="tag">Matching engine</span>
          </div>
          <p className="muted" style={{ fontSize: "0.88rem", marginBottom: "1rem" }}>
            Company match beats everything — a referral needs an insider.
          </p>
          <label className="fld">Role you want</label>
          <select className="input" value={role} onChange={(e) => setRole(e.target.value)} style={{ marginBottom: "1rem" }}>
            {ROLES.map((r) => (
              <option key={r}>{r}</option>
            ))}
          </select>
          <label className="fld">Target companies</label>
          <div className="chips" style={{ marginBottom: "1rem" }}>
            {companies.map((c) => (
              <button key={c} className="chip" aria-pressed={picked.includes(c)} onClick={() => toggleCo(c)}>
                {c}
              </button>
            ))}
          </div>
          <button className="btn" onClick={findInsiders} disabled={busy}>
            {busy ? "Matching…" : "Find my insider →"}
          </button>

          {results && (
            <div style={{ marginTop: "1rem" }}>
              {results.length === 0 && <p className="empty">No proven insiders match — try another company.</p>}
              {results.map((m, i) => (
                <div className="panel" key={m.id} style={{ marginTop: "0.8rem", background: i === 0 ? "linear-gradient(160deg,var(--gold-dim),var(--ink-3))" : "var(--ink-3)", borderColor: i === 0 ? "rgba(227,178,90,0.45)" : "var(--line)" }}>
                  <div className="row" style={{ gap: "0.6rem" }}>
                    <span className="avatar" style={{ width: 32, height: 32, fontSize: "0.75rem", background: m.avatarColor }}>
                      {initials(m.name)}
                    </span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: "0.95rem" }}>{m.name}</div>
                      <div className="muted" style={{ fontSize: "0.8rem" }}>
                        {m.title} @ {m.company}
                      </div>
                    </div>
                    {i === 0 && <span className="pill gold">Best match</span>}
                    <div style={{ textAlign: "right" }}>
                      <div className="serif tnum" style={{ fontSize: "1.3rem", fontWeight: 600, color: i === 0 ? "var(--gold)" : "var(--fg)" }}>
                        {m.breakdown.total}
                      </div>
                      <div className="tag">match</div>
                    </div>
                  </div>
                  <div className="chips" style={{ marginTop: "0.7rem" }}>
                    <span className="pill" style={{ color: m.breakdown.company ? "var(--verify)" : "var(--muted)", border: "1px solid var(--line)" }}>
                      {m.breakdown.company ? "✓" : "·"} at target +{m.breakdown.company}
                    </span>
                    <span className="pill" style={{ color: m.breakdown.roleFit ? "var(--verify)" : "var(--muted)", border: "1px solid var(--line)" }}>
                      {m.breakdown.roleFit ? "✓" : "·"} refers role +{m.breakdown.roleFit}
                    </span>
                    <span className="pill" style={{ color: "var(--verify)", border: "1px solid var(--line)" }}>◆ score +{m.breakdown.rep}</span>
                    {m.breakdown.warm > 0 && <span className="pill verify">✓ warm +{m.breakdown.warm}</span>}
                  </div>
                  <div className="row" style={{ gap: "0.6rem", marginTop: "0.8rem" }}>
                    <button className="btn sm" onClick={() => requestReferral(m)}>
                      Request · 1 credit
                    </button>
                    <button className="btn ghost sm" onClick={() => setOpenIntro(openIntro === m.id ? null : m.id)}>
                      See AI intro
                    </button>
                  </div>
                  {openIntro === m.id && (
                    <div style={{ marginTop: "0.7rem", fontStyle: "italic", fontSize: "0.86rem", color: "var(--fg-soft)", borderLeft: "2px solid var(--verify)", paddingLeft: "0.8rem" }}>
                      {m.intro}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* tracker */}
        <div className="panel">
          <div className="panel-head">
            <h3>Your referral threads</h3>
            <span className="tag">{threads.length} active</span>
          </div>
          <p className="muted" style={{ fontSize: "0.88rem", marginBottom: "0.6rem" }}>
            Every request tracked to its outcome. Advance one to watch it reach the ledger.
          </p>
          {threads.length === 0 && <p className="empty">No threads yet — request a referral to start one.</p>}
          {threads.map((t) => {
            const idx = PIPE.indexOf(t.stage);
            return (
              <div key={t.id} style={{ borderTop: "1px solid var(--line)", padding: "0.9rem 0" }}>
                <div className="row" style={{ gap: "0.5rem" }}>
                  <span className="avatar" style={{ width: 26, height: 26, fontSize: "0.68rem", background: t.insiderColor }}>
                    {initials(t.insiderName)}
                  </span>
                  <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>
                    {t.role} @ {t.company}
                  </div>
                  <span className="pill verify" style={{ marginLeft: "auto" }}>
                    ✓ verified
                  </span>
                </div>
                <div className="pipe">
                  {PIPE.map((s, si) => (
                    <span key={s} style={{ display: "contents" }}>
                      <span className={`pnode ${si < idx ? "done" : si === idx ? "now" : ""}`}>
                        <span className="dot" />
                        {s[0] + s.slice(1).toLowerCase()}
                      </span>
                      {si < PIPE.length - 1 && <span className={`pbar ${si < idx ? "done" : ""}`} />}
                    </span>
                  ))}
                </div>
                <div className="row" style={{ justifyContent: "space-between", marginTop: "0.6rem" }}>
                  <span className="muted" style={{ fontSize: "0.8rem" }}>
                    {t.stage === "HIRED" ? "🎉 Landed — logged to the ledger" : `Stage: ${t.stage[0] + t.stage.slice(1).toLowerCase()}`}
                  </span>
                  {t.stage !== "HIRED" && (
                    <button className="btn ghost sm" onClick={() => advance(t)}>
                      Advance →
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {toast && <div className={`toast show ${toast.warn ? "warn" : ""}`}>{toast.msg}</div>}
      <style>{`@media (max-width: 860px){ .dash-grid{ grid-template-columns: 1fr !important; } }`}</style>
    </>
  );
}
