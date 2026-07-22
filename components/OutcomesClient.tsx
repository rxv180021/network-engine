"use client";
import { useMemo, useState } from "react";
import { OUTCOME_TYPES, OUTCOME_KEYS, DEFAULT_PROGRAM_COST } from "@/lib/constants";
import { computeLedger, standardizedValue, money } from "@/lib/sroi";
import { comma } from "@/lib/ui";

type Outcome = { id: string; type: string; who: string; rawValue: number; attribution: number; memberName: string };

export default function OutcomesClient({ initial }: { initial: Outcome[] }) {
  const [outcomes, setOutcomes] = useState<Outcome[]>(initial);
  const [programCost, setProgramCost] = useState(DEFAULT_PROGRAM_COST);
  const [type, setType] = useState<string>("JOB");
  const [raw, setRaw] = useState<number>(90000);
  const [attr, setAttr] = useState<number>(OUTCOME_TYPES.JOB.attr);
  const [who, setWho] = useState("");
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const ledger = useMemo(() => computeLedger(outcomes, programCost), [outcomes, programCost]);

  function onType(t: string) {
    setType(t);
    setAttr((OUTCOME_TYPES as Record<string, { attr: number }>)[t].attr);
  }
  function flash(m: string) {
    setToast(m);
    setTimeout(() => setToast(null), 2400);
  }

  async function add() {
    if (!(raw > 0)) return flash("Enter a positive value.");
    setBusy(true);
    const res = await fetch("/api/outcomes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, who: who || "Member", rawValue: raw, attribution: attr }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) return flash(data.error || "Failed.");
    setOutcomes((o) => [{ id: data.id, type, who: who || "Member", rawValue: raw, attribution: attr, memberName: "You" }, ...o]);
    setWho("");
    flash("Verified outcome added.");
  }

  const cfg = (t: string) => (OUTCOME_TYPES as Record<string, { label: string; icon: string; rawLabel: string; iris: string }>)[t];

  return (
    <>
      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: "1.2rem", marginBottom: "1.4rem" }} className="okpi-grid">
        <div className="tile lead" style={{ padding: "1.6rem 1.8rem" }}>
          <div className="tag gold" style={{ color: "var(--gold)" }}>
            ◆ SROI · $1 invested returns
          </div>
          <div className="serif tnum" style={{ fontSize: "clamp(2.4rem,6vw,3.6rem)", fontWeight: 600, color: "var(--gold)", lineHeight: 1, marginTop: "0.4rem" }}>
            ${Math.round(ledger.sroi)}
          </div>
          <div className="muted" style={{ fontSize: "0.9rem", marginTop: "0.5rem" }}>
            The verified return an org hands its sponsors — proof, not belonging.
          </div>
        </div>
        <div className="stack" style={{ gap: "1.2rem" }}>
          <div className="tile">
            <div className="v verify">{money(ledger.totalValue)}</div>
            <div className="k">Economic value created</div>
          </div>
          <div className="tile">
            <div className="v">${comma(Math.round(ledger.costPerOutcome || 0))}</div>
            <div className="k">Cost per verified outcome · {ledger.count} total</div>
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "0.85fr 1.15fr", gap: "1.2rem", alignItems: "start" }} className="olog-grid">
        {/* log form */}
        <div className="panel">
          <div className="panel-head">
            <h3>Log an outcome</h3>
            <span className="tag">Verified</span>
          </div>
          <p className="muted" style={{ fontSize: "0.86rem", marginBottom: "1rem" }}>
            Different outcomes, one unit. Attribution defaults are conservative (SROI deadweight) and editable.
          </p>
          <label className="fld">Outcome type</label>
          <select className="input" value={type} onChange={(e) => onType(e.target.value)} style={{ marginBottom: "1rem" }}>
            {OUTCOME_KEYS.map((k) => (
              <option key={k} value={k}>
                {cfg(k).icon}  {cfg(k).label}
              </option>
            ))}
          </select>
          <label className="fld">Recipient (name/label)</label>
          <input className="input" value={who} onChange={(e) => setWho(e.target.value)} placeholder="e.g. Priya" style={{ marginBottom: "1rem" }} />
          <label className="fld">{cfg(type).rawLabel}</label>
          <input className="input" type="number" min={0} step={1000} value={raw} onChange={(e) => setRaw(Number(e.target.value))} style={{ marginBottom: "1rem" }} />
          <label className="fld">Attribution — how much the community caused it</label>
          <div className="row" style={{ gap: "0.6rem", marginBottom: "0.6rem" }}>
            <input type="range" min={5} max={100} step={5} value={attr} onChange={(e) => setAttr(Number(e.target.value))} style={{ flex: 1, accentColor: "var(--gold)" }} />
            <span className="mono gold" style={{ minWidth: "3em", textAlign: "right" }}>
              {attr}%
            </span>
          </div>
          <p className="footnote" style={{ marginBottom: "1rem" }}>
            Standardized = ${comma(raw)} × {attr}% = <span className="verify">{money((raw * attr) / 100)}</span>
          </p>
          <button className="btn block" onClick={add} disabled={busy}>
            {busy ? "Adding…" : "Add verified outcome →"}
          </button>
          <div className="row" style={{ gap: "0.5rem", marginTop: "1rem", fontSize: "0.85rem", color: "var(--muted)" }}>
            Program cost / yr: $
            <input
              className="input"
              type="number"
              value={programCost}
              onChange={(e) => setProgramCost(Number(e.target.value))}
              style={{ width: 110, padding: "0.35rem 0.5rem" }}
            />
          </div>
        </div>

        {/* ledger */}
        <div className="panel">
          <div className="panel-head">
            <h3>The ledger</h3>
            <span className="tag">{ledger.count} outcomes</span>
          </div>
          <div className="chips" style={{ marginBottom: "0.9rem" }}>
            {Object.entries(ledger.byType).map(([k, n]) => (
              <span className="chip" key={k} style={{ cursor: "default" }}>
                {cfg(k).icon} {cfg(k).label} <b className="gold">{n}</b>
              </span>
            ))}
          </div>
          <div className="stack" style={{ gap: "0.6rem", maxHeight: 440, overflowY: "auto" }}>
            {outcomes.map((o) => (
              <div className="row" key={o.id} style={{ gap: "0.8rem", background: "var(--ink-3)", border: "1px solid var(--line)", borderRadius: 11, padding: "0.7rem 0.9rem" }}>
                <span style={{ width: 34, height: 34, display: "grid", placeItems: "center", background: "var(--ink-2)", border: "1px solid var(--line-2)", borderRadius: 9, fontSize: "1.05rem" }}>
                  {cfg(o.type).icon}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>
                    {cfg(o.type).label} · {o.who}
                  </div>
                  <div className="muted" style={{ fontSize: "0.76rem" }}>
                    {money(o.rawValue)} raw · via {o.memberName} · IRIS+ {cfg(o.type).iris}
                  </div>
                </div>
                <span className="pill verify">✓</span>
                <div style={{ textAlign: "right" }}>
                  <div className="serif tnum verify" style={{ fontWeight: 600, fontSize: "1.05rem" }}>
                    {money(standardizedValue(o))}
                  </div>
                  <div className="mono muted" style={{ fontSize: "0.62rem" }}>
                    {o.attribution}% attr
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: "1rem", background: "linear-gradient(120deg,var(--verify-dim),transparent)", border: "1px solid rgba(92,192,140,0.25)", borderRadius: 11, padding: "0.9rem 1.1rem", fontSize: "0.9rem", color: "var(--fg-soft)" }}>
            📄 <b className="verify">Sponsor-ready.</b> Belonging can&apos;t be measured — verified outcomes can. That&apos;s why the org pays.
          </div>
        </div>
      </div>

      {toast && <div className="toast show">{toast}</div>}
      <style>{`@media (max-width: 860px){ .okpi-grid, .olog-grid{ grid-template-columns: 1fr !important; } }`}</style>
    </>
  );
}
