import React from "react";
import { Link } from "react-router-dom";
import PublicNavbar from "./PublicNavbar";
import { SITE } from "../config/siteConfig";

// Shared chrome for every public page: navbar on top, footer at the bottom.
const PublicLayout = ({ children }) => (
  <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
    <PublicNavbar />
    <main style={{ flex: 1 }}>{children}</main>
    <footer style={{ background: "var(--ink)", color: "rgba(255,255,255,0.7)", padding: "32px 0" }}>
      <div className="container" style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 18 }}>
        <div>
          <div style={{ color: "#fff", fontWeight: 600, marginBottom: 6 }}>{SITE.collegeName}</div>
          <div style={{ fontSize: 13.5, maxWidth: 360 }}>{SITE.address}</div>
        </div>
        <div style={{ fontSize: 13.5, display: "flex", flexDirection: "column", gap: 6 }}>
          <Link to="/" style={{ color: "inherit" }}>Home</Link>
          <Link to="/about" style={{ color: "inherit" }}>About</Link>
          <Link to="/fee-details" style={{ color: "inherit" }}>Fee Details</Link>
          <Link to="/login" style={{ color: "inherit" }}>Portal Login</Link>
        </div>
        <div style={{ fontSize: 13.5 }}>
          <div>{SITE.contactEmail}</div>
          <div>{SITE.contactPhone}</div>
          <div style={{ marginTop: 10, opacity: 0.7 }}>&copy; {new Date().getFullYear()} {SITE.collegeName}</div>
        </div>
      </div>
    </footer>
  </div>
);

export default PublicLayout;
