import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { initials } from "@/lib/ui";
import Logo from "./Logo";
import LogoutButton from "./LogoutButton";

export default async function Nav({ active }: { active?: string }) {
  const user = await getCurrentUser();
  const link = (href: string, label: string, key: string) => (
    <Link href={href} className={active === key ? "active" : ""}>
      {label}
    </Link>
  );

  return (
    <nav className="nav">
      <div className="container nav-inner">
        <Link href="/" className="brand">
          <Logo />
          <span>Network&nbsp;Engine</span>
        </Link>
        <div className="nav-links">
          {user && link("/dashboard", "Console", "dashboard")}
          {link("/directory", "Members", "directory")}
          {user && link("/outcomes", "Outcomes", "outcomes")}
          {user?.role === "ADMIN" && link("/admin", "Admin", "admin")}
        </div>
        <div className="nav-right">
          {user ? (
            <>
              <div className="row" style={{ gap: "0.5rem" }}>
                <span
                  className="avatar"
                  style={{ width: 30, height: 30, fontSize: "0.72rem", background: user.avatarColor }}
                >
                  {initials(user.name)}
                </span>
                <span style={{ fontSize: "0.85rem" }} className="mono">
                  {user.tier === "GOLD" ? "◆" : "○"} {user.name.split(" ")[0]}
                </span>
              </div>
              <LogoutButton />
            </>
          ) : (
            <>
              <Link href="/apply" className="btn ghost sm">
                Apply
              </Link>
              <Link href="/login" className="btn sm">
                Sign in
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
