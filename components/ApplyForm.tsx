"use client";
import { useState } from "react";
import { ROLES } from "@/lib/constants";

export default function ApplyForm() {
  const [form, setForm] = useState({ name: "", email: "", linkedinUrl: "", company: "", role: "Data Analyst", industry: "Technology" });
  const [refersFor, setRefersFor] = useState<string[]>([]);
  const [proofName, setProofName] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm({ ...form, [k]: e.target.value });

  function toggle(role: string) {
    setRefersFor((r) => (r.includes(role) ? r.filter((x) => x !== role) : [...r, role]));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await fetch("/api/apply", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, refersFor: refersFor.join(","), proofName }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) return setError(data.error || "Something went wrong.");
    setDone(true);
  }

  if (done) {
    return (
      <div className="panel pad-lg" style={{ maxWidth: 560, margin: "0 auto", textAlign: "center" }}>
        <div className="pill verify" style={{ margin: "0 auto 1rem" }}>
          ✓ Application received
        </div>
        <h2 className="head" style={{ marginBottom: "0.8rem" }}>
          You&apos;re in the review queue.
        </h2>
        <p className="muted">
          An admin will verify your proof and promote you to Gold. You can sign in now with{" "}
          <span className="gold mono">{form.email}</span> · <span className="gold mono">demo1234</span>.
        </p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 640, margin: "0 auto" }}>
      <p className="eyebrow" style={{ marginBottom: "1rem" }}>
        Apply for Gold status
      </p>
      <h1 className="page-title">Prove you&apos;re a real referrer.</h1>
      <p className="muted" style={{ marginBottom: "1.6rem", fontSize: "0.95rem" }}>
        Gold status = verified proof you submitted a referral in the last 12 months. No promises — evidence.
      </p>

      <form onSubmit={submit} className="panel stack" style={{ gap: "1.1rem" }}>
        <div className="row" style={{ gap: "1rem", flexWrap: "wrap" }}>
          <div style={{ flex: "1 1 220px" }}>
            <label className="fld">Full name *</label>
            <input className="input" value={form.name} onChange={set("name")} required />
          </div>
          <div style={{ flex: "1 1 220px" }}>
            <label className="fld">Email *</label>
            <input className="input" type="email" value={form.email} onChange={set("email")} required />
          </div>
        </div>
        <div>
          <label className="fld">LinkedIn URL</label>
          <input className="input" placeholder="https://linkedin.com/in/you" value={form.linkedinUrl} onChange={set("linkedinUrl")} />
        </div>
        <div className="row" style={{ gap: "1rem", flexWrap: "wrap" }}>
          <div style={{ flex: "1 1 220px" }}>
            <label className="fld">Current company *</label>
            <input className="input" value={form.company} onChange={set("company")} required />
          </div>
          <div style={{ flex: "1 1 220px" }}>
            <label className="fld">Your role</label>
            <input className="input" value={form.role} onChange={set("role")} />
          </div>
        </div>
        <div>
          <label className="fld">Roles you can refer for</label>
          <div className="chips">
            {ROLES.map((r) => (
              <button type="button" key={r} className="chip" aria-pressed={refersFor.includes(r)} onClick={() => toggle(r)}>
                {r}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="fld">Proof of referral (redacted)</label>
          <input
            type="file"
            className="input"
            onChange={(e) => setProofName(e.target.files?.[0]?.name || "")}
            style={{ padding: "0.5rem" }}
          />
          <p className="footnote" style={{ marginTop: "0.5rem" }}>
            Redact PII, keep the proof. Redaction protects you and the platform — trust is the feature.
          </p>
        </div>
        {error && (
          <div className="pill" style={{ color: "var(--danger)", background: "var(--danger-dim)" }}>
            {error}
          </div>
        )}
        <button className="btn block" disabled={loading}>
          {loading ? "Submitting…" : "Submit application →"}
        </button>
      </form>
    </div>
  );
}
