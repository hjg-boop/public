import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import PublicLayout from "../components/PublicLayout";
import api from "../services/api";
import { SITE } from "../config/siteConfig";

const DEPT_FULL_NAMES = {
  CSE: "Computer Science and Engineering",
  AI: "Artificial Intelligence",
  ECE: "Electronics and Communication Engineering",
  EEE: "Electrical and Electronics Engineering",
  AIDS: "Artificial Intelligence and Data Science",
};

const About = () => {
  const { hash } = useLocation();
  const [departments, setDepartments] = useState([]);

  useEffect(() => {
    api.get("/departments/public").then((res) => setDepartments(res.data.data)).catch(() => {});
  }, []);

  // /about#courses and /about#contact jump to that section.
  useEffect(() => {
    if (!hash) { window.scrollTo(0, 0); return; }
    const t = setTimeout(() => document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: "smooth" }), 80);
    return () => clearTimeout(t);
  }, [hash, departments.length]);

  const programs = departments.length
    ? departments
    : Object.keys(DEPT_FULL_NAMES).map((code) => ({ code, name: DEPT_FULL_NAMES[code] }));

  return (
    <PublicLayout>
      <section style={{ background: "var(--ink)", padding: "56px 0" }}>
        <div className="container">
          <h1 style={{ color: "#fff", margin: 0 }}>About {SITE.shortName}</h1>
        </div>
      </section>

      <section className="container" style={{ padding: "64px 0" }}>
        <div className="grid-2">
          <div>
            <h2>Who we are</h2>
            <p>{SITE.aboutParagraph}</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            {SITE.stats.map((stat) => (
              <div key={stat.label} className="stat-card">
                <div className="stat-value">{stat.value}</div>
                <div className="stat-label">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={{ background: "var(--grey-100)", padding: "64px 0" }}>
        <div className="container">
          <div className="grid-2">
            <div>
              <h2>Vision</h2>
              <p>{SITE.vision}</p>
            </div>
            <div>
              <h2>Mission</h2>
              <ul style={{ paddingLeft: 18, color: "var(--grey-700)", lineHeight: 1.9 }}>
                {SITE.mission.map((point) => <li key={point}>{point}</li>)}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="container" style={{ padding: "56px 0", textAlign: "center" }}>
        <h2 style={{ marginBottom: 20 }}>Affiliation &amp; Approvals</h2>
        <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
          {SITE.approvals.map((item) => (
            <span key={item} className="card" style={{ padding: "12px 20px", fontWeight: 600, fontSize: 14.5, color: "var(--ink)" }}>{item}</span>
          ))}
        </div>
      </section>

      <section id="courses" style={{ background: "var(--grey-100)", padding: "64px 0" }}>
        <div className="container">
          <h2 style={{ marginBottom: 8 }}>Courses</h2>
          <p style={{ marginBottom: 24 }}>Every B.Tech branch runs a 4-year, 8-semester program.</p>
          <div className="table-wrap">
            <table className="data-table">
              <thead><tr><th>Program</th><th>Duration</th></tr></thead>
              <tbody>
                {programs.map((d) => (
                  <tr key={d.code}><td>B.Tech in {d.name}</td><td>{SITE.courseDuration}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
          <h3 style={{ marginTop: 36, marginBottom: 12 }}>Diploma Programs</h3>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            {SITE.diplomaPrograms.map((name) => <span key={name} className="card card-pad" style={{ fontWeight: 600, fontSize: 14 }}>{name}</span>)}
          </div>
        </div>
      </section>

      <section id="contact" className="container" style={{ padding: "64px 0" }}>
        <div className="grid-2">
          <div>
            <h2>Contact &amp; Admissions</h2>
            <p style={{ marginBottom: 6 }}>{SITE.collegeName}</p>
            <p style={{ marginBottom: 6 }}>{SITE.address}</p>
            <p style={{ marginBottom: 6 }}>{SITE.contactEmail}</p>
            <p style={{ marginBottom: 6 }}>{SITE.contactPhone} &middot; {SITE.contactPhoneAlt}</p>
          </div>
          <div>
            <h2>Important links</h2>
            <ul style={{ paddingLeft: 18, color: "var(--grey-700)", lineHeight: 2 }}>
              {SITE.importantLinks.map((link) => <li key={link}>{link}</li>)}
            </ul>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
};

export default About;
