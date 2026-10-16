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
  const mobileLinks = {
    student: [
      { to: "/student", label: "Home", icon: "⌂", end: true },
      { to: "/student/subjects", label: "Subjects", icon: "▦" },
      { to: "/student/exams", label: "Exams", icon: "✓" },
      { to: "/student/notices", label: "Notices", icon: "▤" },
      { to: "/student/profile", label: "Profile", icon: "○" },
    ],
    admin: [
      { to: "/admin", label: "Home", icon: "⌂", end: true },
      { to: "/admin/students", label: "Students", icon: "♙" },
      { to: "/admin/faculty", label: "Faculty", icon: "♧" },
      { to: "/admin/reports", label: "Reports", icon: "▥" },
    ],
    hod: [
      { to: "/hod", label: "Home", icon: "⌂", end: true },
      { to: "/hod/students", label: "Students", icon: "♙" },
      { to: "/hod/attendance", label: "Attendance", icon: "✓" },
      { to: "/hod/faculty", label: "Faculty", icon: "♧" },
    ],
  }[user.role] || [];

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="dashboard-shell">
      {mobileOpen && (
        <button
          className="dashboard-drawer-backdrop"
          aria-label="Close navigation menu"
          onClick={() => setMobileOpen(false)}
        />
      )}
      <aside
        className={`dashboard-sidebar${mobileOpen ? " is-open" : ""}`}
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
            aria-label={mobileOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={mobileOpen}
            id="mobile-menu-btn"
            onClick={() => setMobileOpen((v) => !v)}
          >
            <span aria-hidden="true">{mobileOpen ? "×" : "☰"}</span>
          </button>
          <strong className="dashboard-topbar-title" style={{ fontFamily: "var(--font-display)", color: "var(--ink)" }}>
            {title}
          </strong>
          <div className="dashboard-user-actions" style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span className="dashboard-user-name">{user.name}</span>
            <button className="btn btn-secondary btn-sm" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </div>
        <div className="dashboard-content">{children}</div>
      </div>
      {mobileLinks.length > 0 && (
        <nav className="mobile-bottom-nav" aria-label="Main navigation">
          {mobileLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) => `mobile-bottom-link${isActive ? " active" : ""}`}
            >
              <span className="mobile-bottom-icon" aria-hidden="true">{link.icon}</span>
              <span>{link.label}</span>
            </NavLink>
          ))}
          <button className="mobile-bottom-link" onClick={() => setMobileOpen(true)} aria-label="Open more navigation options">
            <span className="mobile-bottom-icon" aria-hidden="true">•••</span>
            <span>More</span>
          </button>
        </nav>
      )}
    </div>
  );
};

export default DashboardLayout;
