import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { SIDEBAR_LINKS } from "../utils/sidebarLinks";
import { SITE } from "../config/siteConfig";

const DashboardLayout = ({ children, title }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (!user) return null;
  const links = SIDEBAR_LINKS[user.role] || [];

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="dashboard-shell">
      <aside
        className="dashboard-sidebar"
        style={
          mobileOpen
            ? { display: "block", position: "fixed", zIndex: 50, height: "100%" }
            : undefined
        }
      >
        <div className="brand">
          <div className="brand-name">{SITE.shortName}</div>
          <div className="brand-role">{`${user.role.replace("_", " ")} portal`}</div>
        </div>
        {links.map((link) => (
          <NavLink
            key={link.label}
            to={link.to}
            end={link.end}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) => `sidebar-link${isActive ? " active" : ""}`}
          >
            {link.label}
          </NavLink>
        ))}
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.1)", marginTop: 12, paddingTop: 12 }}>
          <div className="sidebar-link" onClick={handleLogout}>
            Logout
          </div>
        </div>
      </aside>

      <div className="dashboard-main">
        <div className="dashboard-topbar">
          <button
            className="btn btn-ghost btn-sm"
            style={{ display: "none" }}
            id="mobile-menu-btn"
            onClick={() => setMobileOpen((v) => !v)}
          >
            Menu
          </button>
          <strong style={{ fontFamily: "var(--font-display)", color: "var(--ink)" }}>
            {title}
          </strong>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 14, color: "var(--grey-700)" }}>{user.name}</span>
            <button className="btn btn-secondary btn-sm" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </div>
        <div className="dashboard-content">{children}</div>
      </div>
    </div>
  );
};

export default DashboardLayout;
