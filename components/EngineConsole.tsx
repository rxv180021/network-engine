"use client";
import { useCallback, useEffect, useRef, useState } from "react";

type Member = { id: string; name: string; color: string; title: string | null; rep: number; credits: number; verified: number; outcomes: number; tier: string };
type Signal = { id: string; memberId: string; kind: string; detail: string };
type Intro = { id: string; body: string; grounded: boolean; status: string; source: string };
type Referral = { id: string; giverId: string; giverName: string; giverColor: string; takerId: string; takerName: string; opportunity: string; status: string; intro: Intro | null };
type State = { aiConfigured: boolean; members: Member[]; signals: Signal[]; referrals: Referral[]; sroi: number; confidence: number };

const initials = (n: string) => { const p = n.trim().split(/\s+/); return (p[0][0] + (p[1] ? p[1][0] : "")).toUpperCase(); };
const fmt = (n: number) => Math.round(n).toLocaleString("en-US");
const hash = (s: string) => { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return Math.abs(h); };
const first = (n: string) => n.split(" ")[0];

export default function EngineConsole() {
  const [st, setSt] = useState<State | null>(null);
  const [busy, setBusy] = useState(false);
  const [takerId, setTakerId] = useState("");
  const [opp, setOpp] = useState("Research role at Anthropic");
  const [giverId, setGiverId] = useState<string | null>(null);
  const [toast, setToast] = useState("");
  const toastT = useRef<ReturnType<typeof setTimeout> | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const flash = useCallback((msg: string) => {
    setToast(msg);
    if (toastT.current) clearTimeout(toastT.current);
    toastT.current = setTimeout(() => setToast(""), 3400);
  }, []);

  const load = useCallback(async () => {
    const r = await fetch("/api/engine", { cache: "no-store" });
    const data = await r.json();
    setSt(data);
    setTakerId((t) => t || (data.signals[0]?.memberId ?? data.members[0]?.id ?? ""));
  }, []);

  useEffect(() => { load(); }, [load]);

  const post = useCallback(async (body: Record<string, unknown>, note?: string) => {
    setBusy(true);
    const r = await fetch("/api/engine", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const data = await r.json();
    setBusy(false);
    if (!r.ok) { flash(data.error || "Something went wrong."); return null; }
    setSt(data);
    if (note) flash(note);
    return data as State;
  }, [flash]);

  // ---- predictive match (client-side, learns from outcomes) ----
  const conv = (m: Member) => {
    if (m.id === takerId) return -1;
    const rate = m.verified > 0 ? m.outcomes / m.verified : 0;
    const aff = hash(m.name + "|" + opp) % 13;
    return Math.max(8, Math.min(97, Math.round(46 + m.rep * 0.05 + rate * 34 + aff + Math.min(m.verified, 4) * 2)));
  };
  const ranked = (st?.members ?? []).filter((m) => m.id !== takerId).map((m) => ({ m, s: conv(m) })).sort((a, b) => b.s - a.s || b.m.rep - a.m.rep);
  const topGiver = giverId && ranked.some((r) => r.m.id === giverId) ? giverId : ranked[0]?.m.id ?? null;

  // ---- canvas vouch graph ----
  useEffect(() => {
    const cv = canvasRef.current; if (!cv || !st) return;
    const ctx = cv.getContext("2d"); if (!ctx) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const rect = cv.getBoundingClientRect();
    if (rect.width) { cv.width = Math.round(rect.width * dpr); cv.height = Math.round(rect.width * 0.44 * dpr); ctx.setTransform(dpr, 0, 0, dpr, 0, 0); }
    const W = cv.width / dpr, H = cv.height / dpr, cx = W / 2, cy = H / 2, R = Math.min(W, H) / 2 - 30;
    const idx = new Map(st.members.map((m, i) => [m.id, i]));
    const pos = st.members.map((m, i) => { const a = (i / st.members.length) * Math.PI * 2 - Math.PI / 2; return { x: cx + Math.cos(a) * R, y: cy + Math.sin(a) * R, m }; });
    ctx.clearRect(0, 0, W, H);
    st.referrals.forEach((r) => {
      const a = pos[idx.get(r.giverId) ?? 0], b = pos[idx.get(r.takerId) ?? 0];
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y);
      if (r.status === "PENDING_CONFIRM") { ctx.strokeStyle = "#D9A441"; ctx.setLineDash([4, 4]); ctx.lineWidth = 1.2; }
      else if (r.status === "VERIFIED") { ctx.strokeStyle = "#5CC08C"; ctx.setLineDash([]); ctx.lineWidth = 1.7; }
      else { ctx.strokeStyle = "#E9B84C"; ctx.setLineDash([]); ctx.lineWidth = 2.6; }
      ctx.globalAlpha = 0.85; ctx.stroke(); ctx.globalAlpha = 1; ctx.setLineDash([]);
    });
    pos.forEach((p) => {
      const rad = p.m.tier === "GOLD" ? 9 : 6;
      if (p.m.tier === "GOLD") { ctx.beginPath(); ctx.arc(p.x, p.y, rad + 4, 0, Math.PI * 2); ctx.strokeStyle = "#E9B84C"; ctx.lineWidth = 1.4; ctx.globalAlpha = 0.6; ctx.stroke(); ctx.globalAlpha = 1; }
      ctx.beginPath(); ctx.arc(p.x, p.y, rad, 0, Math.PI * 2); ctx.fillStyle = p.m.color; ctx.fill();
      ctx.fillStyle = "#828b99"; ctx.font = "9px ui-monospace,monospace"; ctx.textAlign = "center";
      ctx.fillText(first(p.m.name), p.x, p.y + rad + 11);
    });
  }, [st]);

  if (!st) return <div className="ec-empty" style={{ padding: "3rem", textAlign: "center", color: "#828b99" }}>Loading the engine…</div>;

  const memberById = (id: string) => st.members.find((m) => m.id === id);
  const verifiedTotal = st.referrals.filter((r) => r.status !== "PENDING_CONFIRM").length;
  const golds = st.members.filter((m) => m.tier === "GOLD").length;
  const board = st.members.slice().sort((a, b) => b.rep - a.rep || b.verified - a.verified || a.name.localeCompare(b.name)).slice(0, 6);

  async function makeReferral() {
    if (!topGiver) return;
    const t = memberById(takerId);
    await post({ action: "create", giverId: topGiver, takerId, opportunity: opp }, `Routed via ${first(memberById(topGiver)?.name || "")} — AI drafted the intro and held it for approval. ${first(t?.name || "")} must confirm before it counts.`);
    setGiverId(null);
  }

  return (
    <div className="ec">
      <style>{ECSTYLE}</style>

      <div className="ec-kpis">
        <div className="ec-kpi"><div className="n">{st.referrals.length}</div><div className="k">Referrals</div></div>
        <div className="ec-kpi green"><div className="n">{verifiedTotal}</div><div className="k">Peer-verified</div></div>
        <div className="ec-kpi gold"><div className="n">{golds}</div><div className="k">Gold members</div></div>
        <div className="ec-kpi blue"><div className="n">${fmt(st.sroi)}</div><div className="k">Outcome value</div></div>
      </div>

      <div className="ec-grid">
        {/* LEFT: act */}
        <div className="ec-col">
          <div className="ec-h"><span><b>1 ·</b> Predictive need — the intro before they ask</span></div>
          <div className="ec-signals">
            {st.signals.length === 0 && <div className="ec-empty2">All flagged needs actioned — queue clear.</div>}
            {st.signals.map((s) => {
              const m = memberById(s.memberId); if (!m) return null;
              const label = s.kind === "open" ? "OPEN TO WORK" : s.kind === "layoff" ? "AT-RISK" : "TENURE";
              return (
                <button key={s.id} className={`ec-signal ${s.kind}`} onClick={() => { setTakerId(s.memberId); setGiverId(null); flash("Loaded the flagged need — pick the opportunity, and the engine ranks who'll land it."); }}>
                  <span className="ava" style={{ background: m.color }}>{initials(m.name)}</span>
                  <span className="mid"><span className="s1">{m.name}</span><span className="s2">{s.detail}</span></span>
                  <span className="go">{label} →</span>
                </button>
              );
            })}
          </div>

          <div className="ec-h"><span><b>2 ·</b> Predictive match — who actually lands it</span></div>
          <label className="ec-lab" htmlFor="ec-taker">Who needs the intro</label>
          <select id="ec-taker" value={takerId} onChange={(e) => { setTakerId(e.target.value); setGiverId(null); }}>
            {st.members.map((m) => <option key={m.id} value={m.id}>{m.name}{m.tier === "GOLD" ? " ◆" : ""}</option>)}
          </select>
          <label className="ec-lab" htmlFor="ec-opp" style={{ marginTop: ".6rem" }}>Opportunity (type real data)</label>
          <input id="ec-opp" type="text" value={opp} onChange={(e) => setOpp(e.target.value)} placeholder="e.g. Research role at Anthropic" />

          <div className="ec-match">
            <div className="mh">◈ predicted best insider — ranked by who converts, not who&apos;s connected</div>
            {ranked.slice(0, 3).map(({ m, s }) => {
              const sel = m.id === topGiver;
              const rate = m.verified > 0 ? Math.round((m.outcomes / m.verified) * 100) + "% land rate" : "new insider";
              return (
                <div key={m.id} className={`mrow${sel ? " sel" : ""}`} onClick={() => setGiverId(m.id)}>
                  <span className="ava" style={{ background: m.color }}>{initials(m.name)}</span>
                  <span style={{ minWidth: 0 }}><div className="mn">{m.name}{sel ? " ◈ routing" : ""}</div><div className="mmeta">{rate} · {m.rep} rep</div></span>
                  <span className="barwrap"><span className="bar"><i style={{ width: s + "%" }} /></span><span className="pct">{s}%</span></span>
                </div>
              );
            })}
          </div>
          <button className="ec-btn block" disabled={busy || !topGiver} onClick={makeReferral}>
            {busy ? "Working…" : "Route referral → AI drafts + holds the intro"}
          </button>
        </div>

        {/* RIGHT: proof */}
        <div className="ec-col">
          <div className="ec-fly">
            <div className="fh"><span className="ft">◷ Data flywheel · prediction confidence</span><span className="fv">{st.confidence}%</span></div>
            <div className="fbar"><i style={{ width: st.confidence + "%" }} /></div>
            <div className="fnote">{st.referrals.filter((r) => r.status === "OUTCOME").length === 0 ? "Log an outcome to train the model — watch confidence climb." : `${st.referrals.filter((r) => r.status === "OUTCOME").length} outcome(s) · $${fmt(st.sroi)} tracked → predictions sharpen each round.`}</div>
          </div>

          <div className="ec-h">The vouch graph <span className="mono2">verified solid · pending dashed</span></div>
          <canvas ref={canvasRef} className="ec-canvas" />

          <div className="ec-h" style={{ marginTop: "1.1rem" }}><span><b>3 ·</b> Referral ledger — AI draft, held for approval → confirm → outcome</span></div>
          <div className="ec-ledger">
            {st.referrals.length === 0 && <div className="ec-empty2">No referrals yet — action a signal, then route one.</div>}
            {st.referrals.slice().reverse().map((r) => {
              const g = memberById(r.giverId), t = memberById(r.takerId);
              return (
                <div key={r.id} className="ec-item">
                  <div className="row1">
                    <span className="ava" style={{ background: g?.color }}>{initials(g?.name || "")}</span>
                    <div className="mid"><div className="l1"><b>{first(g?.name || "")}</b> → <b>{first(t?.name || "")}</b></div><div className="l2">{r.opportunity}</div></div>
                    {r.status === "PENDING_CONFIRM" && <span className="badge pending">pending</span>}
                    {r.status === "VERIFIED" && <span className="badge verified">✓ verified</span>}
                    {r.status === "OUTCOME" && <span className="badge outcome">◆ landed</span>}
                  </div>

                  {r.intro && r.status === "PENDING_CONFIRM" && (
                    <div className={`ec-intro${r.intro.grounded ? "" : " held"}`}>
                      <div className="ih">
                        {r.intro.grounded
                          ? <span className="tag ok">✎ AI draft · {r.intro.source} · {r.intro.status === "APPROVED" ? "approved" : "held for approval"}</span>
                          : <span className="tag warn">✋ held — needs a person</span>}
                      </div>
                      <div className="ib">{r.intro.body}</div>
                      {r.intro.grounded && r.intro.status === "HELD" &&
                        <button className="ec-btn tiny" disabled={busy} onClick={() => post({ action: "approve", referralId: r.id }, "Approved — the human is in the loop. Nothing sent without this click.")}>Approve &amp; send</button>}
                    </div>
                  )}

                  <div className="acts">
                    {r.status === "PENDING_CONFIRM" && <button className="ec-btn green tiny" disabled={busy} onClick={() => post({ action: "confirm", referralId: r.id }, `Verified ✓ ${first(g?.name || "")} +40 rep. Only peer-confirmed referrals count — no self-report.`)}>Confirm as {first(t?.name || "")}</button>}
                    {r.status === "VERIFIED" && <button className="ec-btn ghost tiny" disabled={busy} onClick={() => post({ action: "outcome", referralId: r.id }, `Outcome logged — the model just learned. $ into SROI, confidence climbs.`)}>Log outcome</button>}
                    {r.status === "OUTCOME" && <span className="landed">◆ landed · added to SROI ledger</span>}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="ec-h" style={{ marginTop: "1.1rem" }}><span><b>4 ·</b> Reputation leaderboard — who gets routed to first</span></div>
          <div className="ec-lb">
            {board.map((m, i) => (
              <div key={m.id} className={`lrow${i === 0 && m.rep > 0 ? " leader" : ""}`}>
                <span className="rk">{i + 1}</span>
                <span className="nm"><span className="ava" style={{ background: m.color }}>{initials(m.name)}</span>
                  <span style={{ minWidth: 0 }}><div className="nn">{m.name}</div><div className="rr">{m.verified} verified · {m.outcomes} landed</div></span></span>
                <span className={`tier ${m.tier === "GOLD" ? "gold" : "silver"}`}>{m.tier === "GOLD" ? "◆ GOLD" : "SILVER"}</span>
                <span className="rep">{m.rep}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="ec-bar">
        <span className="ec-note">{st.aiConfigured ? "● live Claude — intros drafted by the model" : "● mock mode — add ANTHROPIC_API_KEY for live drafting (stage-safe fallback active)"}</span>
        <button className="ec-btn ghost tiny" disabled={busy} onClick={() => post({ action: "reset" }, "Sandbox reset — clean graph, signals restored.")}>Reset sandbox</button>
      </div>

      <div className={`ec-toast${toast ? " show" : ""}`} role="status" aria-live="polite">{toast}</div>
    </div>
  );
}

const ECSTYLE = `
.ec{--g:#E9B84C;--gd:rgba(233,184,76,.13);--grn:#5CC08C;--grnd:rgba(92,192,140,.15);--blue:#6AA8E6;--blued:rgba(106,168,230,.14);--amb:#D9A441;--ambd:rgba(217,164,65,.14);--pan:#141821;--pan2:#1B2029;--ln:#282f3b;--ln2:#3a4350;--fg:#EDEFF4;--fgs:#C4CAD6;--mut:#828b99;color:var(--fg);font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;}
.ec select,.ec input{width:100%;background:var(--pan2);border:1px solid var(--ln2);color:var(--fg);border-radius:9px;padding:.56rem .7rem;font-size:.9rem;font-family:inherit;}
.ec :focus-visible{outline:2px solid var(--g);outline-offset:2px;}
.ec-lab{display:block;font-family:ui-monospace,monospace;font-size:.63rem;letter-spacing:.05em;text-transform:uppercase;color:var(--mut);margin-bottom:.32rem;}
.ec-kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:.6rem;margin-bottom:1.1rem;}
.ec-kpi{background:var(--pan2);border:1px solid var(--ln);border-radius:12px;padding:.8rem .75rem;}
.ec-kpi .n{font-family:ui-serif,Georgia,serif;font-size:1.55rem;font-weight:600;line-height:1;font-variant-numeric:tabular-nums;}
.ec-kpi.gold .n{color:var(--g);}.ec-kpi.green .n{color:var(--grn);}.ec-kpi.blue .n{color:var(--blue);}
.ec-kpi .k{font-family:ui-monospace,monospace;font-size:.57rem;letter-spacing:.05em;text-transform:uppercase;color:var(--mut);margin-top:.4rem;}
.ec-grid{display:grid;grid-template-columns:1fr 1.28fr;gap:1.1rem;align-items:start;}
@media(max-width:940px){.ec-grid{grid-template-columns:1fr;}}
.ec-col{background:var(--pan);border:1px solid var(--ln);border-radius:14px;padding:1.1rem;}
.ec-h{font-family:ui-monospace,monospace;font-size:.67rem;letter-spacing:.06em;text-transform:uppercase;color:var(--mut);margin:0 0 .8rem;display:flex;justify-content:space-between;gap:.5rem;}
.ec-h b{color:var(--g);}
.mono2{font-family:ui-monospace,monospace;font-size:.6rem;color:var(--mut);text-transform:none;letter-spacing:0;}
.ec-signals{display:flex;flex-direction:column;gap:.5rem;margin-bottom:1.2rem;}
.ec-signal{display:flex;align-items:center;gap:.6rem;background:var(--pan2);border:1px solid var(--ln);border-left:3px solid var(--blue);border-radius:10px;padding:.55rem .7rem;cursor:pointer;text-align:left;width:100%;color:var(--fg);}
.ec-signal.open{border-left-color:var(--grn);}.ec-signal.layoff{border-left-color:var(--amb);}
.ec-signal:hover{border-color:var(--blue);}
.ec-signal .ava,.mrow .ava,.ec-item .ava,.lrow .ava{border-radius:7px;display:flex;align-items:center;justify-content:center;font-family:ui-monospace,monospace;font-weight:600;color:#0c0e13;flex-shrink:0;}
.ec-signal .ava{width:28px;height:28px;font-size:.62rem;}
.ec-signal .mid{flex:1;min-width:0;}
.ec-signal .s1{display:block;font-size:.85rem;font-weight:550;}
.ec-signal .s2{display:block;font-family:ui-monospace,monospace;font-size:.62rem;color:var(--mut);margin-top:.1rem;}
.ec-signal .go{font-family:ui-monospace,monospace;font-size:.6rem;color:var(--blue);letter-spacing:.04em;white-space:nowrap;}
.ec-signal.open .go{color:var(--grn);}.ec-signal.layoff .go{color:var(--amb);}
.ec-match{background:var(--pan2);border:1px solid var(--ln);border-radius:12px;padding:.8rem;margin:.7rem 0 .9rem;}
.ec-match .mh{font-family:ui-monospace,monospace;font-size:.61rem;letter-spacing:.04em;text-transform:uppercase;color:var(--blue);margin-bottom:.55rem;}
.mrow{display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:.6rem;padding:.4rem;border-radius:8px;cursor:pointer;}
.mrow:hover{background:var(--pan);}
.mrow.sel{background:var(--blued);outline:1px solid var(--blue);}
.mrow .ava{width:24px;height:24px;font-size:.57rem;}
.mrow .mn{font-size:.83rem;font-weight:550;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.mrow .mmeta{font-family:ui-monospace,monospace;font-size:.6rem;color:var(--mut);}
.barwrap{display:flex;align-items:center;gap:.45rem;}
.bar{width:50px;height:6px;border-radius:3px;background:var(--ln);overflow:hidden;}
.bar i{display:block;height:100%;background:linear-gradient(90deg,var(--blue),var(--grn));}
.pct{font-family:ui-monospace,monospace;font-size:.78rem;font-weight:600;color:var(--fg);min-width:2.6em;text-align:right;font-variant-numeric:tabular-nums;}
.ec-btn{background:var(--g);color:#1b1405;border:1px solid var(--g);border-radius:9px;padding:.56rem .95rem;font-weight:650;font-size:.85rem;cursor:pointer;font-family:inherit;}
.ec-btn:hover{filter:brightness(1.06);}.ec-btn:disabled{opacity:.45;cursor:not-allowed;}
.ec-btn.block{width:100%;margin-top:.2rem;}
.ec-btn.tiny{padding:.34rem .6rem;font-size:.72rem;}
.ec-btn.ghost{background:transparent;color:var(--fgs);border-color:var(--ln2);font-weight:500;}
.ec-btn.green{background:var(--grn);border-color:var(--grn);color:#04120b;}
.ec-fly{background:var(--pan2);border:1px solid var(--ln);border-radius:12px;padding:.9rem 1rem;margin-bottom:1.1rem;}
.ec-fly .fh{display:flex;justify-content:space-between;align-items:baseline;margin-bottom:.5rem;}
.ec-fly .ft{font-family:ui-monospace,monospace;font-size:.63rem;letter-spacing:.04em;text-transform:uppercase;color:var(--blue);}
.ec-fly .fv{font-family:ui-serif,Georgia,serif;font-size:1.45rem;font-weight:600;color:var(--blue);font-variant-numeric:tabular-nums;}
.fbar{height:8px;border-radius:4px;background:var(--ln);overflow:hidden;}
.fbar i{display:block;height:100%;background:linear-gradient(90deg,var(--blue),var(--grn));transition:width .6s cubic-bezier(.2,.8,.2,1);}
.ec-fly .fnote{font-family:ui-monospace,monospace;font-size:.61rem;color:var(--mut);margin-top:.5rem;line-height:1.5;}
.ec-canvas{display:block;width:100%;height:auto;border-radius:12px;background:var(--pan2);border:1px solid var(--ln);}
.ec-ledger{display:flex;flex-direction:column;gap:.55rem;}
.ec-item{border:1px solid var(--ln);border-radius:11px;padding:.7rem .75rem;background:var(--pan2);}
.ec-item .row1{display:flex;align-items:center;gap:.6rem;}
.ec-item .ava{width:29px;height:29px;font-size:.62rem;}
.ec-item .mid{flex:1;min-width:0;}
.ec-item .l1{font-size:.85rem;}
.ec-item .l2{font-family:ui-monospace,monospace;font-size:.63rem;color:var(--mut);margin-top:.12rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.badge{font-family:ui-monospace,monospace;font-size:.6rem;letter-spacing:.04em;text-transform:uppercase;padding:.2rem .5rem;border-radius:999px;white-space:nowrap;}
.badge.pending{color:var(--amb);background:var(--ambd);border:1px solid var(--amb);}
.badge.verified{color:var(--grn);background:var(--grnd);border:1px solid var(--grn);}
.badge.outcome{color:var(--g);background:var(--gd);border:1px solid var(--g);}
.ec-intro{margin-top:.6rem;background:var(--pan);border:1px solid var(--ln2);border-radius:9px;padding:.6rem .7rem;}
.ec-intro.held{border-color:var(--amb);background:var(--ambd);}
.ec-intro .ih{margin-bottom:.4rem;}
.ec-intro .tag{font-family:ui-monospace,monospace;font-size:.6rem;letter-spacing:.03em;}
.ec-intro .tag.ok{color:var(--grn);}
.ec-intro .tag.warn{color:var(--amb);}
.ec-intro .ib{font-size:.82rem;color:var(--fgs);line-height:1.5;white-space:pre-wrap;}
.ec-intro .ec-btn.tiny{margin-top:.55rem;}
.ec-item .acts{margin-top:.6rem;display:flex;gap:.4rem;flex-wrap:wrap;}
.landed{font-family:ui-monospace,monospace;font-size:.66rem;color:var(--g);}
.ec-lb{display:flex;flex-direction:column;gap:.35rem;}
.lrow{display:grid;grid-template-columns:auto 1fr auto auto;align-items:center;gap:.6rem;padding:.45rem .3rem;border-bottom:1px solid var(--ln);}
.lrow:last-child{border-bottom:0;}
.lrow.leader{background:var(--gd);border-radius:8px;}
.lrow .rk{font-family:ui-monospace,monospace;font-size:.72rem;color:var(--mut);width:1.4em;text-align:right;}
.lrow .nm{display:flex;align-items:center;gap:.5rem;min-width:0;}
.lrow .nm .ava{width:25px;height:25px;font-size:.57rem;}
.lrow .nn{font-size:.85rem;font-weight:550;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.lrow .rr{font-family:ui-monospace,monospace;font-size:.6rem;color:var(--mut);}
.tier{font-family:ui-monospace,monospace;font-size:.58rem;padding:.16rem .43rem;border-radius:6px;}
.tier.gold{color:var(--g);background:var(--gd);border:1px solid var(--g);}
.tier.silver{color:var(--mut);border:1px solid var(--ln2);}
.rep{font-family:ui-monospace,monospace;font-size:.87rem;font-weight:600;color:var(--fg);min-width:2.6em;text-align:right;font-variant-numeric:tabular-nums;}
.ec-empty2{color:var(--mut);font-size:.83rem;font-style:italic;padding:.6rem 0;}
.ec-bar{display:flex;justify-content:space-between;align-items:center;gap:1rem;margin-top:1rem;flex-wrap:wrap;}
.ec-note{font-family:ui-monospace,monospace;font-size:.66rem;color:var(--mut);}
.ec-toast{position:fixed;left:50%;bottom:1.4rem;transform:translateX(-50%) translateY(160%);z-index:100;background:var(--pan);border:1px solid var(--ln2);border-radius:12px;padding:.75rem 1.05rem;box-shadow:0 12px 34px rgba(0,0,0,.45);font-size:.85rem;max-width:90vw;transition:transform .3s cubic-bezier(.2,.8,.2,1);color:var(--fg);}
.ec-toast.show{transform:translateX(-50%) translateY(0);}
@media(prefers-reduced-motion:reduce){.ec-toast,.fbar i{transition:none;}}
`;
