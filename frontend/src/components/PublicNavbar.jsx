import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { SITE } from "../config/siteConfig";
import { useAuth } from "../context/AuthContext";

// Each public page is its own route (not a scroll anchor on one long page).
const NAV_ITEMS = [
  { to: "/", label: "Home", end: true },
  { to: "/about", label: "About" },
  { to: "/fee-details", label: "Fee Details" },
];

const linkStyle = ({ isActive }) => ({
  color: isActive ? "#fff" : "rgba(255,255,255,0.78)",
  fontSize: 14.5,
  fontWeight: isActive ? 600 : 400,
  borderBottom: isActive ? "2px solid var(--brass)" : "2px solid transparent",
  paddingBottom: 4,
});

const PublicNavbar = () => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  const accountButton = user ? (
    <button className="btn btn-primary btn-sm" onClick={() => navigate(`/${user.role}`)}>
      My Dashboard
    </button>
  ) : (
    <button className="btn btn-primary btn-sm" onClick={() => navigate("/login")}>
      Login
    </button>
  );

  return (
    <header style={{ background: "var(--ink)", position: "sticky", top: 0, zIndex: 100 }}>
      <div className="container" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: 68 }}>
        <NavLink to="/" style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 34, height: 34, border: "2px solid var(--brass)", borderRadius: 4,
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "var(--brass)", fontFamily: "var(--font-display)", fontWeight: 700,
            }}
          >
            {SITE.logoMark}
          </div>
          <span style={{ color: "#fff", fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 600 }}>{SITE.shortName}</span>
        </NavLink>

        <nav style={{ display: "flex", alignItems: "center", gap: 26 }} className="desktop-nav">
          {NAV_ITEMS.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end} style={linkStyle}>{item.label}</NavLink>
          ))}
          {accountButton}
        </nav>

        <button className="btn btn-ghost btn-sm mobile-only" style={{ color: "#fff" }} onClick={() => setOpen((v) => !v)}>
          Menu
        </button>
      </div>

      {open && (
        <div style={{ background: "var(--ink-2)", padding: "12px 24px" }} className="mobile-only">
          {NAV_ITEMS.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end} onClick={() => setOpen(false)} style={{ display: "block", padding: "10px 0", color: "#fff", fontSize: 14.5 }}>
              {item.label}
            </NavLink>
          ))}
          <div style={{ marginTop: 8 }}>{accountButton}</div>
        </div>
      )}

      <style>{`
        .mobile-only { display: none; }
        @media (max-width: 820px) {
          .desktop-nav { display: none; }
          .mobile-only { display: block; }
        }
      `}</style>
    </header>
  );
};

export default PublicNavbar;
