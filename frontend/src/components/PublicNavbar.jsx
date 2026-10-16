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
    <header className="site-header" style={{ background: "var(--ink)", position: "sticky", top: 0, zIndex: 100 }}>
      <div className="container site-header-inner">
        <NavLink to="/" className="brand-link" style={{ display: "flex", alignItems: "center", gap: 10 }}>
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

        <nav style={{ alignItems: "center", gap: 26 }} className="desktop-nav">
          {NAV_ITEMS.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end} style={linkStyle}>{item.label}</NavLink>
          ))}
          {accountButton}
        </nav>

        <div className="mobile-header-actions mobile-only">
          {accountButton}
          <button
            className="mobile-menu-button"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            aria-controls="mobile-public-navigation"
          >
            {open ? "×" : "☰"}
          </button>
        </div>
      </div>

      {open && (
        <nav id="mobile-public-navigation" className="mobile-menu-panel">
          {NAV_ITEMS.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end} onClick={() => setOpen(false)}>
              {item.label}
            </NavLink>
          ))}
        </nav>
      )}

      <style>{`
        .mobile-only { display: none; }
        .desktop-nav { display: flex; }
        .site-header-inner {
          display: flex;
          min-width: 0;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
        }
        .brand-link { min-width: 0; }
        .brand-link > div { flex: 0 0 34px; }
        .brand-link > span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .mobile-header-actions { flex-shrink: 0; }
        .mobile-menu-panel { display: none; }
        @media (max-width: 820px) {
          .desktop-nav { display: none; }
          .mobile-only { display: flex; }
          .site-header-inner { height: 60px; }
          .brand-link { flex: 1 1 auto; gap: 8px !important; }
          .brand-link span { font-size: 15px !important; }
          .mobile-header-actions { align-items: center; gap: 8px; }
          .mobile-menu-panel {
            display: flex;
            flex-direction: column;
            gap: 2px;
            padding: 8px 16px 14px;
            border-top: 1px solid rgba(255,255,255,0.1);
            background: var(--ink-2);
          }
          .mobile-menu-panel a {
            padding: 11px 4px;
            color: rgba(255,255,255,0.86);
            font-size: 14px;
          }
          .mobile-menu-panel a.active { color: #fff; font-weight: 650; }
          .mobile-menu-button {
            width: 38px;
            height: 38px;
            flex: 0 0 38px;
            border-radius: 10px;
            border: 1px solid rgba(255,255,255,0.18);
            background: rgba(255,255,255,0.05);
            color: #fff;
            font-size: 20px;
            line-height: 1;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
          }
        }
        @media (max-width: 360px) {
          .site-header-inner { gap: 8px; }
          .mobile-header-actions { gap: 6px; }
          .mobile-header-actions .btn { padding: 6px 10px; }
          .brand-link > span { font-size: 13px !important; }
        }
      `}</style>
    </header>
  );
};

export default PublicNavbar;
