/**
 * SITE CONFIGURATION
 * -------------------
 * Everything about *this specific college* — its name, contact info,
 * homepage copy, and stats — lives here. Change values in this file to
 * rebrand the entire site; you should not need to touch any component code.
 *
 * See README-CUSTOMIZATION.md at the project root for a full walkthrough.
 */

export const SITE = {
  // Shown in the navbar, sidebar, login card, and browser tab (update
  // index.html's <title> separately for the browser tab — see README).
  collegeName: "Bhaskar Institute of Technology and Science",
  shortName: "BITS Rayachoty",

  // Single letter or short mark shown in the little logo badge in the
  // navbar/sidebar/login screen.
  logoMark: "B",

  // Hero section on the public homepage.
  tagline: "Admissions Open for 2026–2027 · EAPCET Code: BITS",
  heroDescription:
    "Build your knowledge, develop practical skills, and prepare for a successful career with quality engineering education at Bhaskar Institute of Technology and Science.",

  vision:
    "To become a leading engineering institution recognized for quality education, research, innovation, creativity, critical thinking, ethical responsibility, and the development of future-ready professionals.",

  mission: [
    "Provide quality and industry-oriented engineering education.",
    "Develop technically skilled and responsible engineers.",
    "Encourage practical learning, research, and innovation.",
    "Provide modern educational facilities and learning resources.",
    "Develop communication, teamwork, leadership, and professional skills.",
    "Encourage student participation in technical and extracurricular activities.",
    "Create opportunities for internships, training, and career development.",
    "Prepare students to address real-world technological and social challenges.",
  ],

  approvals: ["AICTE Approved", "Affiliated to Jawaharlal Nehru Technological University Anantapur (JNTUA)"],

  // Diploma programs run alongside the B.Tech branches but aren't modeled as
  // Department/Branch records in this system (different duration/structure) —
  // they're shown on the homepage as informational listings only.
  diplomaPrograms: ["DCME", "DECE", "DEEE", "DAI & ML"],

  // "About" stat tiles on the homepage.
  stats: [
    { value: "5", label: "B.Tech Programs" },
    { value: "4", label: "Diploma Programs" },
    { value: "2024", label: "Established" },
    { value: "JNTUA", label: "Affiliated To" },
  ],

  aboutParagraph:
    "Bhaskar Institute of Technology and Science (BITS) is an engineering institution located at Bandlapalle, Rayachoty, Andhra Pradesh. The institution is committed to providing quality technical and professional education while developing students' technical knowledge, practical skills, creativity, innovation, communication abilities, and professional confidence. BITS focuses on creating an environment where students can learn through academics, practical laboratory work, projects, workshops, seminars, extracurricular activities, industry interaction, and career-development programs. The institution aims to develop technically skilled and responsible professionals who can contribute positively to society and the nation.",

  // "Important links" list on the homepage (display text only — not live links).
  importantLinks: [
    "Academic calendar",
    "Examination cell",
    "Scholarship portal",
    "Anti-ragging policy",
    "Placement cell",
  ],

  // Contact section + footer.
  address: "Bhaskar Institute of Technology and Science (BITS), Bandlapalle, Rayachoti - 516270, Andhra Pradesh, India",
  contactEmail: "bhaskarinstituteoftechnology@gmail.com",
  contactPhone: "+91 97010 30321",
  contactPhoneAlt: "+91 79817 02122, +91 99630 05134",

  // Course table blurb on the homepage.
  courseDuration: "4 years / 8 semesters",
  courseIntake: "60",
};

export default SITE;
