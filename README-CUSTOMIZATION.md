# Customizing the site — change the college name, branding, and content

Everything specific to *this* college — its name, homepage copy, contact info,
colors, and sample data — is deliberately kept in a small number of files so
you can re-skin the whole portal without touching component logic.

---

## 1. College name, homepage copy, and contact info (the big one)

Open:

```
frontend/src/config/siteConfig.js
```

This single file drives the navbar, sidebar, login screen, and every section
of the public homepage. Change any of these fields and it updates everywhere
that value is used:

| Field | Where it shows up |
|---|---|
| `collegeName` | Homepage hero, navbar, footer |
| `shortName` | Sidebar header, login card subtitle |
| `logoMark` | The letter shown in the little logo badge (navbar/sidebar/login) |
| `tagline` | Small text above the homepage headline (e.g. accreditation) |
| `heroDescription` | Paragraph under the headline on the homepage |
| `stats` | The 4 number tiles in the "About" section (edit values/labels or add more) |
| `aboutParagraph` | The "About the college" body text |
| `importantLinks` | The bullet list in the "Important links" section |
| `address`, `contactEmail`, `contactPhone` | Contact section + footer |
| `courseDuration`, `courseIntake` | Values shown in the homepage "Courses" table |

After editing, just save — Vite hot-reloads it instantly in dev.

### Browser tab title

`siteConfig.js` can't reach `<title>` (that's plain HTML, not React), so update
it separately in:

```
frontend/index.html   →  <title>Your College Name | Student Portal</title>
```

### Department blurbs on the homepage

The one-line description shown under each department card (e.g. "Software
systems, algorithms, and computing theory.") is in:

```
frontend/src/pages/Home.jsx   →  const DEPT_BLURBS = { ... }
```

Keyed by department **code** (e.g. `CSE`, `ECE`). If a department's code
isn't in this object, a generic fallback line is shown instead — so you can
leave this alone if you don't need custom blurbs.

---

## 2. Colors, fonts, and overall look

```
frontend/src/index.css   →  the :root { ... } block at the top
```

Everything is a CSS variable, so changing one line changes it everywhere:

```css
:root {
  --ink: #0f2942;      /* primary dark color (navbar, sidebar, headings) */
  --brass: #b8763e;    /* accent color (buttons, links, highlights) */
  --teal: #2c5f5c;     /* secondary accent */
  --paper: #faf9f6;    /* page background */
  --font-display: "Source Serif 4", Georgia, serif;  /* headings */
  --font-body: "Inter", ...;                          /* body text/UI */
}
```

To change fonts entirely, swap the Google Fonts `<link>` in
`frontend/index.html` for the fonts you want, then update `--font-display`
and `--font-body` in `index.css` to match the new font names.

---

## 3. Departments, branches, and subjects (real data, not just homepage text)

The actual departments/branches/subjects your college offers are database
records, managed two ways:

- **Day-to-day**: log in as admin → **Departments & Branches** / **Subjects**
  in the sidebar and add/edit/delete them there. No code changes needed.
- **Initial seed data** (what gets created the first time you run
  `npm run seed`): edit the arrays at the top of `backend/seed.js`
  (`DEPARTMENTS`, `SUBJECTS_BY_SEM`) before seeding a fresh database.

---

## 4. Admin / demo accounts

The first admin account's name/email/password come from your `.env` file
(`ADMIN_NAME`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`) — change those before running
`npm run seed` on a real deployment, and definitely change the password.

The demo faculty/student accounts created by the seed script are for testing
only — edit or remove them in `backend/seed.js` (search for
`faculty.demo@college.edu` and `21CSE045`) once you're ready to add real users
through the admin panel instead.

---

## 5. Logging in

- **Admin & Faculty** sign in with **email + password**.
- **Students** sign in with their **allotted roll number + password**
  (not email) — this matches how roll numbers work in real colleges. Roll
  numbers are matched case-insensitively (stored uppercase internally), so
  `21cse045` and `21CSE045` both work.

Students' email addresses are still stored on their record (visible to
admin/faculty as contact info), they're just not used to log in.
