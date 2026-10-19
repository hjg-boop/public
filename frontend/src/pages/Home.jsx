import React from "react";
import { Link } from "react-router-dom";
import PublicLayout from "../components/PublicLayout";
import { SITE } from "../config/siteConfig";

const CAMPUS_STATS = [
  { value: SITE.stats[0].value, label: SITE.stats[0].label, icon: "cap", color: "blue" },
  { value: SITE.stats[1].value, label: SITE.stats[1].label, icon: "building", color: "green" },
  { value: SITE.stats[2].value, label: SITE.stats[2].label, icon: "calendar", color: "purple" },
  { value: SITE.stats[3].value, label: SITE.stats[3].label, icon: "award", color: "orange" },
];

const CAMPUS_FEATURES = [
  { title: "Academic Programs", icon: "cap", color: "purple", description: "Find a program that fits your ambition.", to: "/academics" },
  { title: "Modern Facilities", icon: "building", color: "green", description: "Learn in spaces built for hands-on work.", to: "/campus-life" },
  { title: "Experienced Faculty", icon: "faculty", color: "orange", description: "Get guidance from dedicated educators.", to: "/academics" },
  { title: "Research & Innovation", icon: "bulb", color: "red", description: "Explore practical learning and new ideas.", to: "/academics" },
  { title: "Placement Support", icon: "briefcase", color: "blue", description: "Build skills and prepare for your next step.", to: "/placements" },
  { title: "Student Life", icon: "people", color: "pink", description: "Grow through activities and campus community.", to: "/campus-life" },
];

const Icon = ({ name, ...props }) => {
  const paths = {
    cap: <><path d="m2 9 10-5 10 5-10 5L2 9Z" /><path d="M6 11v5c3 2 9 2 12 0v-5M22 9v6" /></>,
    building: <><path d="M3 21h18M5 21V8l7-4 7 4v13M9 10h.01M15 10h.01M9 14h.01M15 14h.01M10 21v-4h4v4" /></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 10h18M8 14h.01M12 14h.01M16 14h.01M8 17h.01M12 17h.01" /></>,
    award: <><circle cx="12" cy="8" r="6" /><path d="m8.2 13-1 8 4.8-2.5 4.8 2.5-1-8" /></>,
    faculty: <><circle cx="12" cy="8" r="4" /><path d="M5 21v-2a7 7 0 0 1 14 0v2M19 8h3M20.5 6.5v3" /></>,
    bulb: <><path d="M9 18h6M10 22h4M8 14a7 7 0 1 1 8 0c-1 .8-1 2-1 2h-6s0-1.2-1-2Z" /><path d="M12 2v1M3.5 5.5l1 1M20.5 5.5l-1 1" /></>,
    briefcase: <><rect x="3" y="7" width="18" height="14" rx="2" /><path d="M8 7V4h8v3M3 12h18M10 12v2h4v-2" /></>,
    people: <><circle cx="9" cy="8" r="3" /><circle cx="17" cy="9" r="2.5" /><path d="M3 20v-1a6 6 0 0 1 12 0v1M16 15a5 5 0 0 1 5 5" /></>,
  };

  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      {paths[name]}
    </svg>
  );
};

const CampusIllustration = () => (
  <svg className="landing-campus-art" viewBox="0 0 720 430" role="img" aria-label="Illustration of the BITS Rayachoty campus">
    <defs>
      <linearGradient id="campus-sky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#9ed1f0" />
        <stop offset="1" stopColor="#e5f1e6" />
      </linearGradient>
      <linearGradient id="campus-building" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#fff5dc" />
        <stop offset="1" stopColor="#e6d5b9" />
      </linearGradient>
    </defs>
    <rect width="720" height="430" fill="url(#campus-sky)" />
    <circle cx="595" cy="83" r="42" fill="#ffe6a4" opacity=".9" />
    <path d="M0 229 130 151l123 94 143-112 152 94 102-66 70 37v93H0Z" fill="#789f9b" opacity=".5" />
    <path d="M0 266 130 203l123 61 143-77 152 73 102-52 70 31v83H0Z" fill="#4f8071" opacity=".64" />
    <path d="M0 315h720v115H0z" fill="#42744f" />
    <path d="M44 307V184h153v123Z" fill="url(#campus-building)" />
    <path d="M28 187h184l-19-24H49Z" fill="#b64c35" />
    <path d="M255 307V141h207v166Z" fill="url(#campus-building)" />
    <path d="M239 144h239l-22-27H260Z" fill="#a94432" />
    <path d="M500 307V190h164v117Z" fill="url(#campus-building)" />
    <path d="M485 193h195l-20-24H506Z" fill="#b64c35" />
    {[0, 1, 2, 3].map((column) => <g key={`left-${column}`} fill="#52829a">
      {[0, 1, 2].map((row) => <rect key={row} x={62 + column * 34} y={204 + row * 34} width="18" height="21" rx="1" />)}
    </g>)}
    {[0, 1, 2, 3, 4].map((column) => <g key={`center-${column}`} fill="#50819b">
      {[0, 1, 2, 3].map((row) => <rect key={row} x={276 + column * 35} y={160 + row * 34} width="19" height="21" rx="1" />)}
    </g>)}
    {[0, 1, 2, 3].map((column) => <g key={`right-${column}`} fill="#52829a">
      {[0, 1, 2].map((row) => <rect key={row} x={522 + column * 33} y={208 + row * 31} width="17" height="19" rx="1" />)}
    </g>)}
    <path d="M0 329q110-30 227 0t239 0 254 0v101H0Z" fill="#477c50" />
    {[36, 218, 472, 682].map((x) => <g key={x}>
      <path d={`M${x} 326v-48`} stroke="#694c37" strokeWidth="9" />
      <circle cx={x} cy="270" r="29" fill="#357447" />
      <circle cx={x - 17} cy="285" r="20" fill="#468853" />
      <circle cx={x + 17} cy="285" r="19" fill="#3b7d4b" />
    </g>)}
    <path d="M300 430 346 306h42l50 124" fill="#cfb896" opacity=".88" />
    <path d="M344 430 364 314h12l28 116" fill="#e5d6bb" opacity=".9" />
  </svg>
);

const Home = () => (
  <PublicLayout>
    <div className="landing-home">
      <section className="landing-hero" aria-labelledby="landing-title">
        <CampusIllustration />
        <div className="landing-hero-shade" />
        <div className="container landing-hero-content">
          <div className="landing-hero-copy">
            <span className="landing-kicker"><span /> Admissions open · 2026–27</span>
            <h1 id="landing-title">Empowering <span>Future Engineers</span></h1>
            <p>Quality education, skilled faculty, and bright futures start here at Bhaskar Institute of Technology and Science.</p>
            <div className="landing-hero-actions">
              <Link to="/about#courses" className="btn landing-explore-btn">Explore programs <span aria-hidden="true">↗</span></Link>
              <Link to="/about" className="landing-video-link"><span aria-hidden="true">▶</span> About our college</Link>
            </div>
          </div>
          <div className="landing-hero-caption">
            <span>{SITE.shortName}</span>
            <span>Bandlapalle · Rayachoti, Andhra Pradesh</span>
          </div>
        </div>
      </section>

      <section className="landing-stats" aria-label="College at a glance">
        <div className="container landing-stats-grid">
          {CAMPUS_STATS.map((stat) => (
            <div className="landing-stat" key={stat.label}>
              <span className={`landing-icon landing-icon-${stat.color}`}><Icon name={stat.icon} /></span>
              <span className="landing-stat-copy"><strong>{stat.value}</strong><small>{stat.label}</small></span>
            </div>
          ))}
        </div>
      </section>

      <section className="landing-features" aria-label="Explore life at BITS">
        <div className="container landing-feature-grid">
          {CAMPUS_FEATURES.map((feature) => (
            <Link
              to={feature.to}
              className={`landing-feature landing-feature-${feature.color}`}
              key={feature.title}
            >
              <span className="landing-feature-icon"><Icon name={feature.icon} /></span>
              <strong>{feature.title}</strong>
              <small>{feature.description}</small>
            </Link>
          ))}
        </div>
      </section>

      <section className="landing-promo">
        <div className="container landing-promo-inner">
          <div>
            <span className="landing-promo-kicker">LEARN · CREATE · ACHIEVE</span>
            <h2>Take the first step toward your future.</h2>
            <p>
              Discover engineering programs, practical learning opportunities, campus life, and
              the achievements that make every student journey unique.
            </p>
          </div>
          <div className="landing-promo-actions">
            <Link to="/academics" className="btn landing-promo-primary">Explore academics <span aria-hidden="true">↗</span></Link>
            <Link to="/achievements" className="landing-promo-link">See achievements</Link>
          </div>
        </div>
      </section>
    </div>
  </PublicLayout>
);

export default Home;
