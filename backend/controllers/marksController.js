const asyncHandler = require("express-async-handler");
const Marks = require("../models/Marks");
const Student = require("../models/Student");
const { getMyFacultyProfile, facultyOwnsClass, assertHodOwnsBranch, branchIdsForDepartment } = require("../utils/scope");
const { logActivity } = require("../utils/activity");

// @desc  Class marks sheet: all students in a branch/year/section for one subject+semester.
//        Faculty must be the assigned teacher for that exact class.
const getMarksSheet = asyncHandler(async (req, res) => {
  const { subject, branch, year, semester, section } = req.query;
  if (!subject || !branch || !year || !semester) { res.status(400); throw new Error("subject, branch, year and semester are required"); }

  const faculty = await getMyFacultyProfile(req);
  if (faculty) {
    const owns = await facultyOwnsClass(faculty._id, { subject, branch, year, semester, section: section || undefined });
    if (!owns) { res.status(403); throw new Error("You are not assigned to teach this subject for this class"); }
  }

  const studentFilter = { branch, year: Number(year), semester: Number(semester) };
  if (section) studentFilter.section = section;
  const students = await Student.find(studentFilter).populate("user", "name").sort({ rollNumber: 1 });

  const marks = await Marks.find({ subject, semester: Number(semester), student: { $in: students.map((s) => s._id) } });
  const marksByStudent = Object.fromEntries(marks.map((m) => [String(m.student), m]));

  const rows = students.map((s) => ({ student: s, marks: marksByStudent[String(s._id)] || null }));
  res.json({ success: true, message: "Marks sheet fetched", data: rows });
});

// @desc  Upsert marks for one student+subject+semester - faculty must own that class.
const upsertMarks = asyncHandler(async (req, res) => {
  const { student, subject, semester, internal, assignment, lab, examMarks, maxMarks } = req.body;
  if (!student || !subject || !semester) { res.status(400); throw new Error("student, subject and semester are required"); }

  const studentDoc = await Student.findById(student);
  if (!studentDoc) { res.status(404); throw new Error("Student not found"); }

  const faculty = await getMyFacultyProfile(req);
  if (faculty) {
    const owns = await facultyOwnsClass(faculty._id, { subject, branch: studentDoc.branch, year: studentDoc.year, semester, section: studentDoc.section });
    if (!owns) { res.status(403); throw new Error("You are not assigned to teach this subject for this student's class"); }
  }

  const key = { student, subject, semester };
  let record = await Marks.findOne(key);
  if (!record) record = new Marks(key);
  if (internal !== undefined) record.internal = internal;
  if (assignment !== undefined) record.assignment = assignment;
  if (lab !== undefined) record.lab = lab;
  if (examMarks !== undefined) record.examMarks = examMarks;
  if (maxMarks !== undefined) record.maxMarks = maxMarks;
  record.enteredBy = req.user._id;
  await record.save();
  await logActivity(req, { action: "Entered/updated marks", module: "marks" });
  res.status(201).json({ success: true, message: "Marks saved", data: record });
});

// @desc  A student's full result across subjects for one semester (+ simple SGPA).
//        student -> self. admin -> anyone. hod -> own department only.
const getStudentResult = asyncHandler(async (req, res) => {
  let studentId = req.params.studentId;
  if (req.user.role === "student") {
    const me = await Student.findOne({ user: req.user._id });
    if (!me) return res.json({ success: true, message: "Result fetched", data: [] });
    studentId = String(me._id);
  }
  const studentDoc = await Student.findById(studentId);
  if (!studentDoc) { res.status(404); throw new Error("Student not found"); }
  if (req.user.role === "hod") await assertHodOwnsBranch(req, studentDoc.branch);

  const { semester } = req.query;
  const filter = { student: studentId };
  if (semester) filter.semester = Number(semester);

  const marks = await Marks.find(filter).populate("subject", "subjectName subjectCode credits").sort({ semester: 1 });

  const bySemester = {};
  for (const m of marks) {
    if (!bySemester[m.semester]) bySemester[m.semester] = { semester: m.semester, subjects: [], totalCredits: 0, totalPoints: 0 };
    const credits = m.subject?.credits || 3;
    bySemester[m.semester].subjects.push(m);
    bySemester[m.semester].totalCredits += credits;
    bySemester[m.semester].totalPoints += credits * (m.gradePoints || 0);
  }
  const result = Object.values(bySemester).map((s) => ({
    ...s,
    sgpa: s.totalCredits ? Number((s.totalPoints / s.totalCredits).toFixed(2)) : 0,
  }));

  res.json({ success: true, message: "Result fetched", data: result });
});

// @desc  Department-wide results summary for HOD/Admin: average marks per subject.
const getDepartmentResults = asyncHandler(async (req, res) => {
  let branchIds;
  if (req.user.role === "hod") {
    if (!req.user.department) { res.status(403); throw new Error("Your account has no department assigned"); }
    branchIds = await branchIdsForDepartment(req.user.department);
  } else if (req.query.department) {
    branchIds = await branchIdsForDepartment(req.query.department);
  } else {
    res.status(400);
    throw new Error("department is required");
  }

  const students = await Student.find({ branch: { $in: branchIds } }).select("_id");
  const marks = await Marks.find({ student: { $in: students.map((s) => s._id) } }).populate("subject", "subjectName subjectCode");

  const bySubject = {};
  for (const m of marks) {
    const key = String(m.subject._id);
    if (!bySubject[key]) bySubject[key] = { subject: m.subject, totalMarks: 0, count: 0 };
    bySubject[key].totalMarks += m.total;
    bySubject[key].count += 1;
  }
  const summary = Object.values(bySubject).map((s) => ({ subject: s.subject, averageMarks: s.count ? Number((s.totalMarks / s.count).toFixed(1)) : 0, studentsGraded: s.count }));

  res.json({ success: true, message: "Department results fetched", data: summary });
});

module.exports = { getMarksSheet, upsertMarks, getStudentResult, getDepartmentResults };
