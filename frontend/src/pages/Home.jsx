import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import PublicLayout from "../components/PublicLayout";
import api from "../services/api";
import { SITE } from "../config/siteConfig";

const DEPT_BLURBS = {
  CSE: "Build a strong foundation in software, systems, and the technologies shaping our world.",
  AI: "Explore intelligent systems, machine learning, and the ideas behind modern AI.",
  ECE: "Connect electronics, communication, and embedded technology through engineering.",
  EEE: "Learn how electrical power, machines, and control systems work together.",
  AIDS: "Turn data into insight with computing, statistics, and artificial intelligence.",
};

const DEPT_FULL_NAMES = {
  CSE: "Computer Science & Engineering",
  AI: "Artificial Intelligence",
  ECE: "Electronics & Communication",
  EEE: "Electrical & Electronics",
  AIDS: "AI & Data Science",
};

const Home = () => {
  const [departments, setDepartments] = useState([]);
  const [notices, setNotices] = useState([]);
  const [loadErr, setLoadErr] = useState(false);

  useEffect(() => {
    Promise.all([api.get("/departments/public"), api.get("/notices/public")])
      .then(([departmentResponse, noticeResponse]) => {
        setDepartments(departmentResponse.data.data);
        setNotices(noticeResponse.data.data);
      })
      .catch(() => setLoadErr(true));
  }, []);

  const displayDepartments = departments.length
    ? departments
    : Object.keys(DEPT_BLURBS).map((code) => ({ code, name: DEPT_FULL_NAMES[code] }));

  return (
    <PublicLayout>
      <section className="home-hero">
        <div className="container home-hero-inner">
          <div className="hero-panel">
            <div className="home-eyebrow">
              <span className="home-eyebrow-dot" />
              {SITE.tagline}
            </div>
            <h1>Make your curiosity <span>your career.</span></h1>
            <p>
              {SITE.heroDescription}
            </p>
            <div className="hero-actions">
              <Link to="/about#courses" className="btn home-primary-btn">Find your program <span aria-hidden="true">↗</span></Link>
              <Link to="/about#contact" className="btn home-outline-btn">Talk to our team</Link>
            </div>
            <div className="home-hero-note">
              <span aria-hidden="true">✳</span>
              A place to learn, make, and move forward.
            </div>
          </div>

          <div className="home-hero-art" aria-label="Discover your path at BITS Rayachoty" role="img">
            <div className="hero-art-orbit hero-art-orbit-one" />
            <div className="hero-art-orbit hero-art-orbit-two" />
            <div className="hero-art-sun" />
            <div className="hero-art-grid">
              {Array.from({ length: 25 }, (_, index) => <span key={index} />)}
            </div>
            <div className="hero-art-card">
              <span className="hero-art-mark">{SITE.logoMark}</span>
              <span className="hero-art-label">YOUR NEXT CHAPTER</span>
              <strong>Learn.<br />Build.<br /><em>Become.</em></strong>
              <span className="hero-art-school">{SITE.shortName} <span aria-hidden="true">↗</span></span>
            </div>
            <div className="hero-art-badge hero-art-badge-top"><span>01</span> Find your spark</div>
            <div className="hero-art-badge hero-art-badge-bottom"><span>02</span> Make it real</div>
          </div>
        </div>
        <div className="home-hero-bottom">
          <div className="container home-hero-bottom-inner">
            <span>BHASKAR INSTITUTE OF TECHNOLOGY AND SCIENCE</span>
            <span className="home-hero-bottom-location">BANDLAPALLE · RAYACHOTI, ANDHRA PRADESH</span>
          </div>
        </div>
      </section>

      <section className="home-admissions">
        <div className="container home-admissions-inner">
          <div className="home-admissions-copy">
            <span className="home-section-kicker">A NEW JOURNEY STARTS HERE</span>
            <h2>Admissions open for 2026–27</h2>
            <p>Explore programs, understand the fees, and get in touch with the college.</p>
          </div>
          <div className="home-admissions-actions">
            <Link to="/fee-details" className="home-text-link">View fee details <span aria-hidden="true">↗</span></Link>
            <Link to="/about#contact" className="btn home-admissions-btn">Enquire now</Link>
          </div>
        </div>
      </section>

      <section className="home-section home-pathways-section">
        <div className="container">
          <div className="home-section-heading">
            <div>
              <span className="home-section-kicker">HERE FOR EVERY STEP</span>
              <h2>Whatever brings you here,<br />there’s a place to start.</h2>
            </div>
            <p>Explore the college, find your course, or get straight to the tools you use every day.</p>
          </div>
          <div className="home-pathways">
            <Link to="/about" className="home-pathway-card home-pathway-warm">
              <span className="home-pathway-number">01 / DISCOVER</span>
              <span className="home-pathway-icon" aria-hidden="true">✳</span>
              <h3>Considering BITS?</h3>
              <p>Get to know our college, programs, campus, and what student life can look like.</p>
              <span className="home-pathway-link">Get to know us <span aria-hidden="true">↗</span></span>
            </Link>
            <Link to="/about#courses" className="home-pathway-card home-pathway-blue">
              <span className="home-pathway-number">02 / FIND YOUR FIELD</span>
              <span className="home-pathway-icon" aria-hidden="true">⌘</span>
              <h3>Ready to explore?</h3>
              <p>Compare engineering and diploma programs and find a subject that sparks your interest.</p>
              <span className="home-pathway-link">Explore programs <span aria-hidden="true">↗</span></span>
            </Link>
            <Link to="/login" className="home-pathway-card home-pathway-green">
              <span className="home-pathway-number">03 / GET CONNECTED</span>
              <span className="home-pathway-icon" aria-hidden="true">↗</span>
              <h3>Already part of BITS?</h3>
              <p>Students and staff can access classes, attendance, results, fees, and more.</p>
              <span className="home-pathway-link">Open the portal <span aria-hidden="true">↗</span></span>
            </Link>
          </div>
        </div>
      </section>

      <section className="home-programs-section">
        <div className="container">
          <div className="home-section-heading">
            <div>
              <span className="home-section-kicker">ROOM TO FIND YOUR THING</span>
              <h2>Curiosity has many directions.</h2>
            </div>
            <Link to="/about#courses" className="home-text-link">All programs <span aria-hidden="true">↗</span></Link>
          </div>
          <div className="home-programs-grid">
            {displayDepartments.map((dept, index) => (
              <article key={dept.code} className="home-program-card">
                <div className="home-program-topline">
                  <span className="home-program-index">0{index + 1}</span>
                  <span className="home-program-code">{dept.code}</span>
                </div>
                <h3>{DEPT_FULL_NAMES[dept.code] || dept.name}</h3>
                <p>{DEPT_BLURBS[dept.code] || "Discover core and elective coursework across four years of engineering."}</p>
                <Link to="/about#courses" aria-label={`Learn about ${dept.name}`} className="home-program-arrow">↗</Link>
              </article>
            ))}
          </div>
          <div className="home-program-note">
            <span className="home-program-note-icon" aria-hidden="true">＋</span>
            <div><strong>Looking for a diploma?</strong><span>Explore our diploma programs and find your starting point.</span></div>
            <Link to="/about#courses" className="home-text-link">See diploma courses <span aria-hidden="true">↗</span></Link>
          </div>
        </div>
      </section>

      <section className="home-about-strip">
        <div className="container home-about-inner">
          <div className="home-about-copy">
            <span className="home-section-kicker">ROOTED IN RAYACHOTI</span>
            <h2>Big ideas begin<br />with a place to grow.</h2>
            <p>
              At {SITE.shortName}, education is about more than what’s on the syllabus. It’s a
              chance to build skills, ask better questions, and find the confidence to shape
              what comes next.
            </p>
            <Link to="/about" className="home-about-link">More about our college <span aria-hidden="true">↗</span></Link>
          </div>
          <div className="home-facts" aria-label="About the college">
            {SITE.stats.map((stat) => (
              <div key={stat.label} className="home-fact">
                <strong>{stat.value}</strong>
                <span>{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="home-notices-section">
        <div className="container">
          <div className="home-section-heading home-notices-heading">
            <div>
              <span className="home-section-kicker">FROM AROUND CAMPUS</span>
              <h2>What’s happening</h2>
            </div>
            <span className="home-notices-caption">Updates and announcements from BITS</span>
          </div>
          {loadErr && <p className="home-notice-message">Campus updates are temporarily unavailable. Please check back soon.</p>}
          {!loadErr && notices.length === 0 && (
            <div className="home-notice-empty">
              <span aria-hidden="true">✳</span>
              <p>There are no new announcements right now. Check back for updates from campus.</p>
            </div>
          )}
          {notices.length > 0 && (
            <div className="home-notice-list">
              {notices.map((notice) => (
                <article key={notice._id} className="home-notice-item">
                  <span className="home-notice-date">{new Date(notice.createdAt).toLocaleDateString()}</span>
                  <div>
                    <h3>{notice.title}</h3>
                    <p>{notice.description}</p>
                  </div>
                  <span className="home-notice-arrow" aria-hidden="true">↗</span>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </PublicLayout>
  );
};

export default Home;
