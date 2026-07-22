"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { initials, comma } from "@/lib/ui";
import { splitList } from "@/lib/constants";

export type DirMember = {
  id: string;
  name: string;
  title: string | null;
  company: string | null;
  industry: string | null;
  refersFor: string;
  referralScore: number;
  avatarColor: string;
  linkedinUrl: string | null;
  goldSince: string | null;
};

export default function DirectoryClient({ members, signedIn }: { members: DirMember[]; signedIn: boolean }) {
  const [q, setQ] = useState("");
  const [industry, setIndustry] = useState("All");
  const industries = useMemo(() => ["All", ...Array.from(new Set(members.map((m) => m.industry).filter(Boolean) as string[]))], [members]);

  const filtered = members.filter((m) => {
    const hay = `${m.name} ${m.company} ${m.title} ${m.refersFor}`.toLowerCase();
    return (industry === "All" || m.industry === industry) && hay.includes(q.toLowerCase());
  });

  return (
    <>
      <div className="panel row" style={{ gap: "0.8rem", flexWrap: "wrap", marginBottom: "1.4rem" }}>
        <input
          className="input"
          placeholder="Search by name, company, or role…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          style={{ flex: "2 1 260px" }}
        />
        <select className="input" value={industry} onChange={(e) => setIndustry(e.target.value)} style={{ flex: "1 1 160px" }}>
          {industries.map((i) => (
            <option key={i}>{i}</option>
          ))}
        </select>
        <span className="pill gold" style={{ alignSelf: "center" }}>
          {filtered.length} Gold members
        </span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: "1rem" }}>
        {filtered.map((m) => (
          <div className="panel" key={m.id}>
            <div className="row" style={{ gap: "0.7rem" }}>
              <span className="avatar" style={{ width: 42, height: 42, background: m.avatarColor }}>
                {initials(m.name)}
              </span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600 }}>{m.name}</div>
                <div className="muted" style={{ fontSize: "0.82rem" }}>
                  {m.title} @ {m.company}
                </div>
              </div>
              <span className="pill gold">◆ Gold</span>
            </div>

            <div className="row" style={{ gap: "0.5rem", margin: "0.9rem 0 0.2rem", justifyContent: "space-between" }}>
              <span className="mono verify" style={{ fontSize: "0.72rem" }}>
                ◆ Referral Score {comma(m.referralScore)}
              </span>
              {m.industry && <span className="tag">{m.industry}</span>}
            </div>

            <div className="tag" style={{ marginTop: "0.9rem" }}>
              Can refer for
            </div>
            <div className="chips" style={{ marginTop: "0.4rem" }}>
              {splitList(m.refersFor).map((r) => (
                <span className="chip" key={r} style={{ cursor: "default" }}>
                  {r}
                </span>
              ))}
              {splitList(m.refersFor).length === 0 && <span className="muted" style={{ fontSize: "0.82rem" }}>—</span>}
            </div>

            <Link href={signedIn ? "/dashboard" : "/login"} className="btn block sm" style={{ marginTop: "1rem" }}>
              {signedIn ? "Request a referral →" : "Sign in to request"}
            </Link>
          </div>
        ))}
      </div>
      {filtered.length === 0 && <p className="empty">No members match your search.</p>}
    </>
  );
}
