import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import PublicLayout from "../components/PublicLayout";
import api from "../services/api";
import { SITE } from "../config/siteConfig";

const DEPT_BLURBS = {
  CSE: "Programming, software development, algorithms, data structures, computer systems, databases, and web technologies.",
  AI: "Artificial intelligence, machine learning, intelligent systems, natural language processing, and AI-based problem solving.",
  ECE: "Electronic devices, circuits, communication systems, signal processing, and embedded technologies.",
  EEE: "Electrical systems, power systems, electrical machines, electronics, and control systems.",
  AIDS: "Artificial intelligence, machine learning, data analysis, statistics, programming, and data-driven technologies.",
};

const DEPT_FULL_NAMES = {
  CSE: "Computer Science and Engineering",
  AI: "Artificial Intelligence",
  ECE: "Electronics and Communication Engineering",
  EEE: "Electrical and Electronics Engineering",
  AIDS: "Artificial Intelligence and Data Science",
};

const Home = () => {
  const navigate = useNavigate();
  const [departments, setDepartments] = useState([]);
  const [notices, setNotices] = useState([]);
  const [loadErr, setLoadErr] = useState(false);

  useEffect(() => {
    Promise.all([api.get("/departments/public"), api.get("/notices/public")])
      .then(([d, n]) => { setDepartments(d.data.data); setNotices(n.data.data); })
      .catch(() => setLoadErr(true));
  }, []);

  const displayDepartments = departments.length
    ? departments
    : Object.keys(DEPT_BLURBS).map((code) => ({ code, name: DEPT_FULL_NAMES[code] }));

  return (
    <PublicLayout>
      {/* HERO */}
      <section style={{ background: "var(--ink)", position: "relative", overflow: "hidden", padding: "88px 0 96px" }}>
        <div className="container" style={{ position: "relative" }}>
          <div style={{ maxWidth: 640 }}>
            <div style={{ color: "var(--brass)", fontSize: 14, fontWeight: 600, marginBottom: 14 }}>{SITE.tagline}</div>
            <h1 style={{ color: "#fff", fontSize: "clamp(32px, 5vw, 48px)", marginBottom: 18 }}>
              Shape Your Future With Quality Engineering Education
            </h1>
            <p style={{ color: "rgba(255,255,255,0.8)", fontSize: 17, marginBottom: 32, maxWidth: 520 }}>{SITE.heroDescription}</p>
            <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
              <button className="btn btn-primary" onClick={() => navigate("/about#contact")}>Apply Now</button>
              <button className="btn" style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.4)", color: "#fff" }} onClick={() => navigate("/about#courses")}>
                Explore Courses
              </button>
              <button className="btn" style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.4)", color: "#fff" }} onClick={() => navigate("/about#contact")}>
                Contact Us
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ADMISSIONS BANNER */}
      <section style={{ background: "var(--brass)", padding: "14px 0" }}>
        <div className="container" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
          <strong style={{ color: "#fff" }}>Admissions Open for 2026–2027</strong>
          <Link to="/fee-details" className="btn btn-sm" style={{ background: "#fff", color: "var(--ink)" }}>View fee details</Link>
        </div>
      </section>

      {/* QUICK LINKS */}
      <section className="container" style={{ padding: "64px 0 24px" }}>
        <div className="grid-cards">
          <Link to="/about" className="card card-pad">
            <h4 style={{ marginTop: 0 }}>About {SITE.shortName}</h4>
            <p style={{ margin: 0, fontSize: 13.5 }}>Our vision, mission, approvals and programs.</p>
          </Link>
          <Link to="/fee-details" className="card card-pad">
            <h4 style={{ marginTop: 0 }}>Fee Details</h4>
            <p style={{ margin: 0, fontSize: 13.5 }}>College fee, optional hostel and transport fees - all in one place.</p>
          </Link>
          <Link to="/login" className="card card-pad">
            <h4 style={{ marginTop: 0 }}>Student &amp; Staff Portal</h4>
            <p style={{ margin: 0, fontSize: 13.5 }}>Attendance, results, fees and receipts after you log in.</p>
          </Link>
        </div>
      </section>

      {/* DEPARTMENTS */}
      <section style={{ padding: "48px 0 72px" }}>
        <div className="container">
          <h2 style={{ marginBottom: 8 }}>Departments</h2>
          <p style={{ marginBottom: 28 }}>Five B.Tech disciplines, each with its own faculty and subject library.</p>
          <div className="grid-cards">
            {displayDepartments.map((dept) => (
              <div key={dept.code} className="card card-pad">
                <div style={{ color: "var(--brass)", fontSize: 12.5, fontWeight: 700, letterSpacing: "0.03em" }}>{dept.code}</div>
                <h4 style={{ margin: "6px 0 8px", fontSize: 17 }}>{dept.name}</h4>
                <p style={{ fontSize: 13.5, margin: 0 }}>{DEPT_BLURBS[dept.code] || "Core and elective coursework across four years."}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* NOTICES */}
      <section style={{ background: "var(--grey-100)", padding: "64px 0" }}>
        <div className="container">
          <h2 style={{ marginBottom: 8 }}>Latest notices</h2>
          <p style={{ marginBottom: 24 }}>College-wide announcements, most recent first.</p>
          {loadErr && <p>Notices are temporarily unavailable - the API server may not be running.</p>}
          {!loadErr && notices.length === 0 && <p>No notices posted yet.</p>}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {notices.map((n) => (
              <div key={n._id} className="card card-pad" style={{ display: "flex", justifyContent: "space-between", gap: 16 }}>
                <div>
                  <h4 style={{ margin: "0 0 4px", fontSize: 15.5 }}>{n.title}</h4>
                  <p style={{ margin: 0, fontSize: 13.5 }}>{n.description}</p>
                </div>
                <span style={{ fontSize: 12.5, color: "var(--grey-500)", whiteSpace: "nowrap" }}>{new Date(n.createdAt).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </PublicLayout>
  );
};

export default Home;
