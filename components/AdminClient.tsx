"use client";
import { useState } from "react";
import { initials } from "@/lib/ui";
import { splitList } from "@/lib/constants";

type App = {
  id: string;
  name: string;
  company: string;
  role: string;
  industry: string;
  refersFor: string;
  linkedinUrl: string | null;
  proofName: string | null;
  avatarColor: string;
};

export default function AdminClient({ pending, goldCount }: { pending: App[]; goldCount: number }) {
  const [apps, setApps] = useState<App[]>(pending);
  const [gold, setGold] = useState(goldCount);
  const [toast, setToast] = useState<string | null>(null);

  function flash(m: string) {
    setToast(m);
    setTimeout(() => setToast(null), 2400);
  }

  async function review(app: App, action: "approve" | "reject") {
    const res = await fetch(`/api/admin/applications/${app.id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    const data = await res.json();
    if (!res.ok) return flash(data.error || "Failed.");
    setApps((a) => a.filter((x) => x.id !== app.id));
    if (action === "approve") {
      setGold((g) => g + 1);
      flash(`${app.name} promoted to Gold ✓`);
    } else {
      flash(`${app.name}'s application rejected.`);
    }
  }

  return (
    <>
      <div className="tiles" style={{ marginBottom: "1.6rem" }}>
        <div className="tile" style={{ maxWidth: 220 }}>
          <div className="v" style={{ color: "var(--gold)" }}>
            {apps.length}
          </div>
          <div className="k">Pending review</div>
        </div>
        <div className="tile" style={{ maxWidth: 220 }}>
          <div className="v verify">{gold}</div>
          <div className="k">Gold members</div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-head">
          <h3>Application queue</h3>
          <span className="tag">Verify the proof</span>
        </div>
        {apps.length === 0 && <p className="empty">No pending applications — all caught up.</p>}
        <div className="stack" style={{ gap: "0.8rem", marginTop: "0.6rem" }}>
          {apps.map((a) => (
            <div key={a.id} style={{ borderTop: "1px solid var(--line)", paddingTop: "0.9rem" }}>
              <div className="row" style={{ gap: "0.7rem", flexWrap: "wrap" }}>
                <span className="avatar" style={{ width: 40, height: 40, background: a.avatarColor }}>
                  {initials(a.name)}
                </span>
                <div style={{ flex: "1 1 200px" }}>
                  <div style={{ fontWeight: 600 }}>{a.name}</div>
                  <div className="muted" style={{ fontSize: "0.82rem" }}>
                    {a.role} @ {a.company} · {a.industry}
                  </div>
                </div>
                <div className="row" style={{ gap: "0.5rem" }}>
                  <button className="btn sm" onClick={() => review(a, "approve")}>
                    Approve → Gold
                  </button>
                  <button className="btn danger sm" onClick={() => review(a, "reject")}>
                    Reject
                  </button>
                </div>
              </div>
              <div className="row" style={{ gap: "0.5rem", marginTop: "0.7rem", flexWrap: "wrap" }}>
                <span className="pill" style={{ color: a.proofName ? "var(--verify)" : "var(--muted)", border: "1px solid var(--line)" }}>
                  {a.proofName ? `📎 ${a.proofName}` : "no proof attached"}
                </span>
                {splitList(a.refersFor).map((r) => (
                  <span className="chip" key={r} style={{ cursor: "default" }}>
                    {r}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
      {toast && <div className="toast show">{toast}</div>}
    </>
  );
}
