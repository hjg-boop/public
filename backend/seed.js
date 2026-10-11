
const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');
dns.setServers(['8.8.8.8', '8.8.4.4']);

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const mongoose = require("mongoose");
const connectDB = require("./config/db");

const User = require("./models/User");
const Department = require("./models/Department");
const Branch = require("./models/Branch");
const Subject = require("./models/Subject");
const Student = require("./models/Student");
const Faculty = require("./models/Faculty");
const Section = require("./models/Section");
const FacultyAssignment = require("./models/FacultyAssignment");
const FeeHead = require("./models/FeeHead");
const { ensureFeeAccount } = require("./utils/feeService");
const CollegeSettings = require("./models/CollegeSettings");
const AcademicYear = require("./models/AcademicYear");

// BITS Rayachoty's actual B.Tech departments. (Diploma programs - DCME,
// DECE, DEEE, DAI & ML - run alongside these but aren't modeled as
// Department/Branch records here since they follow a different academic
// structure; they're shown on the public homepage as informational text.)
const DEPARTMENTS = [
  { name: "Computer Science and Engineering", code: "CSE" },
  { name: "Artificial Intelligence", code: "AI" },
  { name: "Electronics and Communication Engineering", code: "ECE" },
  { name: "Electrical and Electronics Engineering", code: "EEE" },
  { name: "Artificial Intelligence and Data Science", code: "AIDS" },
];

const SUBJECTS_BY_SEM = {
  1: [
    { name: "Engineering Mathematics I", code: "MA101", credits: 4 },
    { name: "Engineering Physics", code: "PH101", credits: 3 },
    { name: "Basic Electrical Engineering", code: "EE101", credits: 3 },
  ],
  2: [
    { name: "Engineering Mathematics II", code: "MA102", credits: 4 },
    { name: "Programming for Problem Solving", code: "CS102", credits: 4 },
    { name: "Engineering Chemistry", code: "CH102", credits: 3 },
  ],
  3: [
    { name: "Data Structures", code: "CS201", credits: 4 },
    { name: "Digital Logic Design", code: "CS202", credits: 3 },
    { name: "Discrete Mathematics", code: "MA201", credits: 3 },
  ],
  4: [
    { name: "Database Management Systems", code: "CS203", credits: 4 },
    { name: "Computer Organization", code: "CS204", credits: 3 },
    { name: "Operating Systems", code: "CS205", credits: 4 },
  ],
};

const ACADEMIC_YEAR = "2026-27";

// Sample rates only - the admin sets the real ones under Academic Management.
//   college   = mandatory, auto-assigned to every student
//   hostel    = added only for students who opt into the hostel
//   transport = added only for students who use college transport
const FEE_HEADS = [
  { name: "College Fee", category: "college", defaultAmount: 60000 },
  { name: "Hostel Fee", category: "hostel", defaultAmount: 40000 },
  { name: "Transport Fee", category: "transport", defaultAmount: 12000 },
];

async function seed() {
  await connectDB();
  console.log("Seeding database (safe to re-run, skips existing records)...");

  // 0. College settings + academic year
  if (!(await CollegeSettings.findOne({ singleton: "main" }))) {
    await CollegeSettings.create({
      singleton: "main",
      collegeName: process.env.COLLEGE_NAME || "Your College Name",
      address: process.env.COLLEGE_ADDRESS || "",
      currentAcademicYear: ACADEMIC_YEAR,
      lowAttendanceThreshold: 75,
    });
    console.log("Created college settings");
  }
  if (!(await AcademicYear.findOne({ label: ACADEMIC_YEAR }))) {
    await AcademicYear.create({ label: ACADEMIC_YEAR, isCurrent: true });
    console.log(`Created academic year ${ACADEMIC_YEAR}`);
  }

  // 1. Admin account (top-level college management - no Super Admin tier)
  const adminEmail = (process.env.ADMIN_EMAIL || "admin@college.edu").toLowerCase();
  let admin = await User.findOne({ email: adminEmail });
  if (!admin) {
    admin = await User.create({
      name: process.env.ADMIN_NAME || "College Admin",
      email: adminEmail,
      password: process.env.ADMIN_PASSWORD || "Admin@12345",
      role: "admin",
      status: "active",
    });
    console.log(`Created admin account: ${adminEmail}`);
  } else {
    console.log(`Admin account already exists: ${adminEmail}`);
  }

  // 2. Departments
  const departmentDocs = {};
  for (const dept of DEPARTMENTS) {
    let doc = await Department.findOne({ code: dept.code });
    if (!doc) {
      doc = await Department.create({ ...dept });
      console.log(`Created department: ${dept.code}`);
    }
    departmentDocs[dept.code] = doc;
  }

  // 3. Branches (1:1 with departments)
  const branchDocs = {};
  for (const dept of DEPARTMENTS) {
    let branch = await Branch.findOne({ code: dept.code, department: departmentDocs[dept.code]._id });
    if (!branch) {
      branch = await Branch.create({
        name: dept.name,
        code: dept.code,
        department: departmentDocs[dept.code]._id,
        totalYears: 4,
      });
      console.log(`Created branch: ${dept.code}`);
    }
    branchDocs[dept.code] = branch;
  }

  // 4. Sample subjects for CSE across semesters 1-4
  const cseDept = departmentDocs["CSE"];
  const cseBranch = branchDocs["CSE"];
  const subjectDocs = {};
  for (const [sem, subjects] of Object.entries(SUBJECTS_BY_SEM)) {
    const semester = Number(sem);
    const year = Math.ceil(semester / 2);
    for (const subj of subjects) {
      let doc = await Subject.findOne({ subjectCode: subj.code, branch: cseBranch._id, semester });
      if (!doc) {
        doc = await Subject.create({
          subjectName: subj.name,
          subjectCode: subj.code,
          department: cseDept._id,
          branch: cseBranch._id,
          year,
          semester,
          credits: subj.credits,
        });
        console.log(`Created subject: ${subj.code} (CSE sem ${semester})`);
      }
      subjectDocs[subj.code] = doc;
    }
  }

  // 5. Sections for CSE Year 2 / Semester 3
  const sectionNames = ["A", "B"];
  for (const name of sectionNames) {
    const exists = await Section.findOne({ branch: cseBranch._id, year: 2, semester: 3, name });
    if (!exists) {
      await Section.create({ branch: cseBranch._id, year: 2, semester: 3, name });
      console.log(`Created section: CSE Year 2 Sem 3 - ${name}`);
    }
  }

  // 6. HOD account for CSE
  const hodEmail = "hod.cse@college.edu";
  let hodUser = await User.findOne({ email: hodEmail });
  if (!hodUser) {
    hodUser = await User.create({
      name: "Dr. Suresh Babu",
      email: hodEmail,
      password: "Hod@12345",
      role: "hod",
      department: cseDept._id,
      status: "active",
    });
    console.log(`Created HOD account: ${hodEmail} / Hod@12345 (CSE)`);
  }

  // 7. Accountant account
  const accountantEmail = "accounts@college.edu";
  let accountantUser = await User.findOne({ email: accountantEmail });
  if (!accountantUser) {
    accountantUser = await User.create({
      name: "Lakshmi Narayana",
      email: accountantEmail,
      password: "Accounts@123",
      role: "accountant",
      status: "active",
    });
    console.log(`Created accountant account: ${accountantEmail} / Accounts@123`);
  }

  // 8. Sample faculty account (CSE)
  const facultyEmail = "faculty.demo@college.edu";
  let facultyUser = await User.findOne({ email: facultyEmail });
  let facultyDoc = await Faculty.findOne({ employeeId: "FAC-1001" });
  if (!facultyUser) {
    facultyUser = await User.create({
      name: "Dr. Ananya Rao",
      email: facultyEmail,
      password: "Faculty@123",
      role: "faculty",
      status: "active",
    });
    facultyDoc = await Faculty.create({
      user: facultyUser._id,
      employeeId: "FAC-1001",
      department: cseDept._id,
      designation: "Associate Professor",
    });
    console.log(`Created sample faculty account: ${facultyEmail} / Faculty@123`);
  }

  // 9. Sample student account (CSE, 2nd year, sem 3, Section A)
  const studentEmail = "student.demo@college.edu";
  let studentUser = await User.findOne({ email: studentEmail });
  let studentDoc = await Student.findOne({ rollNumber: "21CSE045" });
  if (!studentUser) {
    studentUser = await User.create({
      name: "Rahul Sharma",
      email: studentEmail,
      password: "Student@123",
      role: "student",
      status: "active",
    });
    studentDoc = await Student.create({
      user: studentUser._id,
      rollNumber: "21CSE045",
      branch: cseBranch._id,
      year: 2,
      semester: 3,
      section: "A",
      admissionYear: 2024,
    });
    console.log(`Created sample student account: ${studentEmail} / Student@123`);
  }

  // 10. Faculty assignment: demo faculty teaches DBMS to CSE Year 2 Sem 3 Section A
  if (facultyDoc && subjectDocs["CS203"]) {
    const exists = await FacultyAssignment.findOne({
      faculty: facultyDoc._id, subject: subjectDocs["CS203"]._id, branch: cseBranch._id, year: 2, semester: 3, section: "A",
    });
    if (!exists) {
      await FacultyAssignment.create({
        faculty: facultyDoc._id,
        department: cseDept._id,
        branch: cseBranch._id,
        year: 2,
        semester: 3,
        section: "A",
        subject: subjectDocs["CS203"]._id,
      });
      console.log("Assigned demo faculty to teach DBMS - CSE Year 2 Sem 3 Section A");
    }
  }

  // 11. Fee rates, then open the demo student's fee account. Opening it
  //     attaches the mandatory college fee automatically (same code path
  //     that runs when a new student is registered). Hostel/transport are
  //     left OFF - an accountant switches those on per student.
  for (const head of FEE_HEADS) {
    let doc = await FeeHead.findOne({ name: head.name, academicYear: ACADEMIC_YEAR });
    if (!doc) {
      doc = await FeeHead.create({ name: head.name, category: head.category, academicYear: ACADEMIC_YEAR, defaultAmount: head.defaultAmount });
      console.log(`Created fee head: ${head.name} (${head.category})`);
    }
  }

  if (studentDoc) {
    await ensureFeeAccount(studentDoc._id, ACADEMIC_YEAR, admin._id);
    console.log("Opened fee account for demo student (mandatory college fee attached)");
  }

  console.log("\nSeed complete.");
  console.log("----------------------------------------------------");
  console.log(`Admin login:      ${adminEmail} / ${process.env.ADMIN_PASSWORD || "Admin@12345"}`);
  console.log(`HOD login:        ${hodEmail} / Hod@12345 (CSE department)`);
  console.log(`Faculty login:    ${facultyEmail} / Faculty@123`);
  console.log(`Accountant login: ${accountantEmail} / Accounts@123`);
  console.log(`Student login:    roll number 21CSE045 / Student@123`);
  console.log("(No role selection needed - the backend detects the role from the account.)");
  console.log("----------------------------------------------------");

  await mongoose.connection.close();
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});
