# College Student Portal

A full-stack college portal with public homepage, and three role-based panels:
Student, Faculty, and Admin.

**Stack:** React (Vite) · Node.js/Express · MongoDB/Mongoose · JWT auth · bcrypt ·
Multer file uploads (local disk out of the box, swappable for a cloud provider).

```
college-portal/
├── backend/     Express API, models, auth, file uploads, seed script
├── frontend/    React app (public site + student/faculty/admin dashboards)
└── .env.example
```

---

## 1. Prerequisites

> **Want to change the college name, colors, or homepage content?**
> See [`README-CUSTOMIZATION.md`](./README-CUSTOMIZATION.md) — it's all in a
> couple of files, no component code needs touching.

- Node.js 18+ and npm
- A MongoDB database — either:
  - **MongoDB Atlas** (recommended, free tier works), or
  - a local `mongod` instance

---

## 2. Installation

From the project root:

```bash
npm run install:all
```

This runs `npm install` inside both `backend/` and `frontend/`. (Equivalent to
running `npm install` in each folder separately.)

---

## 3. Environment variables

### Backend

```bash
cp .env.example .env
```

Edit `.env` at the project root (the backend reads it from there) and fill in:

```
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb+srv://<username>:<password>@<cluster-url>/college-portal?retryWrites=true&w=majority
JWT_SECRET=some_long_random_string
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
FILE_STORAGE_PROVIDER=local
ADMIN_NAME=College Admin
ADMIN_EMAIL=admin@college.edu
ADMIN_PASSWORD=Admin@12345
```

Generate a strong `JWT_SECRET`, e.g.:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

### Frontend

```bash
cp frontend/.env.example frontend/.env
```

```
VITE_API_URL=http://localhost:5000/api
```

---

## 4. MongoDB Atlas setup (if you don't already have a database)

1. Create a free account at https://www.mongodb.com/cloud/atlas.
2. Create a free (M0) cluster.
3. Under **Database Access**, create a database user with a username/password.
4. Under **Network Access**, add your current IP (or `0.0.0.0/0` for quick testing —
   restrict this before going to production).
5. Click **Connect → Drivers**, copy the connection string, and paste it into
   `MONGO_URI` in your `.env`, replacing `<username>`, `<password>`, and adding
   a database name (e.g. `/college-portal`) before the `?`.

---

## 5. Run the backend

```bash
npm run dev:backend
```

The API starts on `http://localhost:5000`. Check `http://localhost:5000/api/health`
to confirm it's running and connected to MongoDB.

## 6. Run the frontend

In a separate terminal:

```bash
npm run dev:frontend
```

The app opens on `http://localhost:5173`.

---

## 7. Create the admin account & seed sample data

The seed script is **safe to re-run** — it skips any record that already exists.

```bash
npm run seed
```

This creates:

- One **Admin** account using `ADMIN_EMAIL` / `ADMIN_PASSWORD` from your `.env`
- 6 sample departments and matching branches, plus two demo sections (CSE Year 2, Sem 3 - A & B)
- Sample CSE subjects across semesters 1–4
- One demo **HOD** login: `hod.cse@college.edu` / `Hod@12345` (scoped to the CSE department)
- One demo **Accountant** login: `accounts@college.edu` / `Accounts@123`
- One demo **Faculty** login: `faculty.demo@college.edu` / `Faculty@123` (assigned to teach DBMS to CSE Year 2 Sem 3 Section A)
- One demo **Student** login: roll number `21CSE045` / `Student@123`
- A sample fee structure (Tuition/Exam/Library/Hostel/Transport/Other) for the current academic year, applied to the demo student

After seeding, log in at `http://localhost:5173/login` with any of these
accounts — there is no role selector; the backend reads the role from the
account itself (students sign in with their roll number, everyone else with
their email).

---

## 8. File storage

By default, uploaded PDFs/notes are stored on local disk under `backend/uploads/`
and served at `/uploads/<filename>` — this needs zero external setup and works
immediately for development and small deployments.

To use a real cloud file-storage service (recommended for production, since
platforms like Render/Vercel don't guarantee persistent disks), open
`backend/services/fileStorage.js` and implement the `local` branch's
alternative using your provider's SDK (Cloudinary, AWS S3, Firebase Storage,
etc.) — the rest of the app (routes, controllers, frontend) doesn't need to
change, since it only calls `buildFileUrl()` / `deleteStoredFile()`.

---

## 9. Deployment

### Frontend → Vercel

1. Push this repo to GitHub.
2. In Vercel, import the repo and set the **root directory** to `frontend`.
3. Build command: `npm run build`, output directory: `dist`.
4. Add an environment variable `VITE_API_URL` pointing to your deployed backend,
   e.g. `https://your-backend.onrender.com/api`.

### Backend → Render (or any Node host)

1. Create a new **Web Service** in Render, pointing at this repo with root
   directory `backend`.
2. Build command: `npm install`. Start command: `npm start`.
3. Add environment variables from your `.env` (`MONGO_URI`, `JWT_SECRET`,
   `CLIENT_URL` set to your deployed frontend URL, etc.) in Render's dashboard
   — never commit `.env` to git.
4. If you're staying on local disk storage in production, note that Render's
   filesystem is ephemeral on redeploys — switch to a cloud storage provider
   (see step 8) before going live with real user uploads.

### Database → MongoDB Atlas

Use the same Atlas cluster from step 4. Under **Network Access**, allow your
Render service's IP (or `0.0.0.0/0` if Render's IPs aren't static on your plan).

### Connecting the production database

Set `MONGO_URI` in Render's environment variables to your Atlas connection
string — the same one from `.env`, but pointing at your production database
name if you're keeping it separate from your dev data.

---

## 10. API overview

All responses follow `{ success, message, data }`. Protected routes require
`Authorization: Bearer <token>` header, obtained from `POST /api/auth/login`.

| Method | Route                          | Access                  |
|--------|--------------------------------|--------------------------|
| POST   | `/api/auth/login`              | Public (`identifier` = roll number for students, or email for faculty/admin) |
| POST   | `/api/students/bulk-import`     | Admin — upload .xlsx/.xls/.csv of students |
| GET    | `/api/auth/me`                 | Authenticated            |
| GET    | `/api/students`                | Admin, Faculty           |
| GET    | `/api/students/me`             | Student                 |
| POST   | `/api/students`                | Admin                    |
| PUT    | `/api/students/:id`            | Admin, self (limited)    |
| DELETE | `/api/students/:id`            | Admin                    |
| GET    | `/api/faculty`                 | Admin, Faculty, Student  |
| GET    | `/api/faculty/me`              | Faculty                  |
| POST   | `/api/faculty`                 | Admin                    |
| PUT    | `/api/faculty/:id`              | Admin, self (limited)    |
| DELETE | `/api/faculty/:id`              | Admin                    |
| GET    | `/api/departments`              | Public                  |
| POST/PUT/DELETE `/api/departments` | Admin        |
| GET    | `/api/branches`                 | Public                  |
| POST/PUT/DELETE `/api/branches`     | Admin        |
| GET    | `/api/subjects`                 | Authenticated            |
| GET    | `/api/subjects/mine`            | Faculty                  |
| POST/PUT/DELETE `/api/subjects`     | Admin        |
| GET    | `/api/documents`                | Authenticated            |
| POST   | `/api/documents` (multipart)    | Faculty, Admin           |
| PUT/DELETE `/api/documents/:id`     | Owner or Admin |
| GET    | `/api/documents/:id/download`   | Authenticated (tracks count) |
| GET    | `/api/notices/public`           | Public |
| GET    | `/api/notices`                  | Authenticated (auto-scoped for students) |
| POST   | `/api/notices`                  | Faculty, Admin           |
| PUT/DELETE `/api/notices/:id`        | Owner or Admin |
| GET    | `/api/dashboard/stats`          | Admin                    |

---

## 11. Security notes

- Passwords are hashed with bcrypt before storage; plaintext passwords are
  never persisted or logged.
- JWTs are required on every protected route via `middleware/authMiddleware.js`;
  role checks (`authorize(...)`) prevent students/faculty from calling
  admin-only endpoints even if they guess the URL.
- Ownership checks on documents/notices prevent one faculty member from
  editing or deleting another's uploads (admin can manage everything).
- Uploaded file types are restricted to PDF/DOC/DOCX/PPT/PPTX and capped at 25MB.
- CORS is restricted to `CLIENT_URL`; update this for your deployed frontend origin.
- `.env` is git-ignored — never commit real credentials.

---

## 12. Known limitations / next steps

- Local disk file storage is the default; swap in a cloud provider before a
  real production launch (see section 8).
- Password reset / "forgot password" flow is not implemented.
- Rate limiting on the login endpoint is not implemented — consider adding
  `express-rate-limit` if this goes public.
