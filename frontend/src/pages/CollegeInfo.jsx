import React from "react";
import { Link } from "react-router-dom";
import PublicLayout from "../components/PublicLayout";
import { SITE } from "../config/siteConfig";

const PAGE_CONTENT = {
  academics: {
    eyebrow: "ACADEMICS",
    title: "Build the knowledge to shape what comes next.",
    description: "Explore engineering and diploma programs with a focus on strong fundamentals, practical learning, and professional growth.",
    cards: [
      { icon: "01", title: "B.Tech programs", text: `${SITE.stats[0].value} engineering programs across computing, electronics, electrical, and related fields.` },
      { icon: "02", title: "Diploma pathways", text: `${SITE.stats[1].value} diploma programs offer additional routes into technical education.` },
      { icon: "03", title: "Learning beyond lectures", text: "The college mission emphasizes practical learning, laboratories, projects, workshops, and technical activities." },
    ],
    sectionTitle: "Explore your options",
    sectionText: `B.Tech programs are structured over ${SITE.courseDuration}. Review the available courses, fees, and admission information before choosing a path.`,
    action: { to: "/about#courses", label: "View programs and courses" },
    secondary: { to: "/fee-details", label: "Check fee details" },
  },
  placements: {
    eyebrow: "CAREER READINESS",
    title: "Prepare for the opportunities ahead.",
    description: "Build the technical, communication, and professional skills that help you take the next step after college.",
    cards: [
      { icon: "01", title: "Career preparation", text: "Develop professional confidence, communication, teamwork, and problem-solving skills alongside your studies." },
      { icon: "02", title: "Practical experience", text: "Projects, workshops, internships, and industry interaction are part of the college's stated career-development mission." },
      { icon: "03", title: "A stronger next step", text: "Explore your interests early, build a portfolio of work, and seek guidance as you plan for employment or further study." },
    ],
    sectionTitle: "Make a plan for your future",
    sectionText: "Placement schedules, recruiter details, and verified outcome reports are maintained by the college. Contact the college for the latest information.",
    action: { to: `mailto:${SITE.contactEmail}`, label: "Ask about placement information", external: true },
    secondary: { to: "/academics", label: "Explore academics" },
  },
  "campus-life": {
    eyebrow: "CAMPUS LIFE",
    title: "Find your community. Make room to grow.",
    description: "College life is shaped by the people you meet, the ideas you explore, and the experiences you build beyond the classroom.",
    cards: [
      { icon: "01", title: "Learn together", text: "Teamwork, communication, and collaboration help students grow alongside their academic work." },
      { icon: "02", title: "Explore interests", text: "Technical and extracurricular activities give students opportunities to discover what motivates them." },
      { icon: "03", title: "Build confidence", text: "Seminars, workshops, projects, and student participation help develop skills for life beyond college." },
    ],
    sectionTitle: "A place to take part",
    sectionText: "Get in touch with the college for current campus activities, facilities, student services, and event information.",
    action: { to: `mailto:${SITE.contactEmail}`, label: "Ask about campus life", external: true },
    secondary: { to: "/about#contact", label: "Contact the college" },
  },
  achievements: {
    eyebrow: "ACHIEVEMENTS",
    title: "Every milestone starts with a chance to learn.",
    description: "We want this page to celebrate verified student, faculty, research, sports, and campus achievements from BITS.",
    cards: [
      { icon: "01", title: "Academic milestones", text: "Recognize student progress, academic distinctions, and accomplishments backed by college records." },
      { icon: "02", title: "Ideas made real", text: "Highlight projects, technical events, research, and innovations with verified participants and outcomes." },
      { icon: "03", title: "Beyond the classroom", text: "Celebrate sports, cultural activities, service, leadership, and other student contributions." },
    ],
    sectionTitle: "Verified stories belong here",
    sectionText: "To keep public information accurate, award names, dates, student details, and placement figures should be confirmed by the college before publication. Contact the college to share an official achievement.",
    action: { to: `mailto:${SITE.contactEmail}`, label: "Share an achievement", external: true },
    secondary: { to: "/about", label: "Learn about BITS" },
  },
};

const CollegeInfo = ({ page }) => {
  const content = PAGE_CONTENT[page] || PAGE_CONTENT.academics;

  return (
    <PublicLayout>
      <div className="public-info-page">
        <section className="public-info-hero">
          <div className="container">
            <span className="public-info-eyebrow">{content.eyebrow} · {SITE.shortName}</span>
            <h1>{content.title}</h1>
            <p>{content.description}</p>
            <div className="public-info-actions">
              {content.action.external ? (
                <a className="btn public-info-primary" href={content.action.to}>{content.action.label}<span aria-hidden="true">↗</span></a>
              ) : (
                <Link className="btn public-info-primary" to={content.action.to}>{content.action.label}<span aria-hidden="true">↗</span></Link>
              )}
              <Link className="public-info-secondary" to={content.secondary.to}>{content.secondary.label}</Link>
            </div>
          </div>
        </section>

        <section className="container public-info-content">
          <div className="public-info-heading">
            <span className="public-info-label">DISCOVER BITS</span>
            <h2>{page === "achievements" ? "Progress worth celebrating" : page === "placements" ? "Skills for the world beyond college" : page === "campus-life" ? "More than a classroom" : "A foundation for your future"}</h2>
          </div>
          <div className="public-info-cards">
            {content.cards.map((card) => (
              <article className="public-info-card" key={card.title}>
                <span className="public-info-card-icon">{card.icon}</span>
                <h3>{card.title}</h3>
                <p>{card.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="public-info-next">
          <div className="container public-info-next-inner">
            <div>
              <span className="public-info-label">{SITE.collegeName.toUpperCase()}</span>
              <h2>{content.sectionTitle}</h2>
              <p>{content.sectionText}</p>
            </div>
            <a className="public-info-contact" href={`mailto:${SITE.contactEmail}`}>{SITE.contactEmail}</a>
          </div>
        </section>
      </div>
    </PublicLayout>
  );
};

export default CollegeInfo;
