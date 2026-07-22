"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

const DEMO = [
  { label: "Chapter Lead (Amara)", email: "amara@demo.networkengine.app" },
  { label: "Member (Priya)", email: "priya@demo.networkengine.app" },
  { label: "Member (Grace)", email: "grace@demo.networkengine.app" },
];

export default function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("amara@demo.networkengine.app");
  const [password, setPassword] = useState("demo1234");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "Sign in failed.");
      return;
    }
    router.push(data.role === "ADMIN" ? "/admin" : "/dashboard");
    router.refresh();
  }

  return (
    <div style={{ maxWidth: 440, margin: "0 auto" }}>
      <p className="eyebrow" style={{ marginBottom: "1rem" }}>
        Sign in
      </p>
      <h1 className="page-title">Welcome back.</h1>
      <p className="muted" style={{ marginBottom: "1.6rem", fontSize: "0.95rem" }}>
        Every seeded account uses the password <span className="gold mono">demo1234</span>.
      </p>

      <form onSubmit={submit} className="panel stack" style={{ gap: "1rem" }}>
        <div>
          <label className="fld" htmlFor="email">
            Email
          </label>
          <input id="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" />
        </div>
        <div>
          <label className="fld" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            className="input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
        </div>
        {error && (
          <div className="pill" style={{ color: "var(--danger)", background: "var(--danger-dim)" }}>
            {error}
          </div>
        )}
        <button className="btn block" disabled={loading}>
          {loading ? "Signing in…" : "Sign in →"}
        </button>
      </form>

      <div style={{ marginTop: "1.4rem" }}>
        <div className="tag" style={{ marginBottom: "0.6rem" }}>
          Quick demo accounts
        </div>
        <div className="stack" style={{ gap: "0.5rem" }}>
          {DEMO.map((d) => (
            <button
              key={d.email}
              className="btn neutral sm"
              style={{ justifyContent: "space-between" }}
              onClick={() => {
                setEmail(d.email);
                setPassword("demo1234");
              }}
            >
              <span>{d.label}</span>
              <span className="mono muted" style={{ fontSize: "0.7rem" }}>
                {d.email}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
