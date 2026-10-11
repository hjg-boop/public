const asyncHandler = require("express-async-handler");
const Attendance = require("../models/Attendance");
const Student = require("../models/Student");
const Branch = require("../models/Branch");
const CollegeSettings = require("../models/CollegeSettings");
const TimetableSlot = require("../models/TimetableSlot");
const { logActivity } = require("../utils/activity");
const { getMyFacultyProfile, facultyOwnsClass, branchIdsForDepartment, assertHodOwnsBranch } = require("../utils/scope");

const lowAttendanceThreshold = async () => {
  const settings = await CollegeSettings.findOne({ singleton: "main" });
  return settings?.lowAttendanceThreshold ?? 75;
};

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const pad2 = (n) => String(n).padStart(2, "0");

// @desc  Auto-detect the class the faculty should be taking attendance for
//        RIGHT NOW, purely from their timetable - no subject/semester picker.
//        Matches today's day-of-week + the current clock time against the
//        faculty's own TimetableSlot entries; each slot's startTime/endTime
//        defines its period boundary (typically ~55 minutes apart, but
//        whatever the timetable actually says). The moment the clock crosses
//        into the next slot, re-calling this returns that next class
//        automatically - nothing needs to be manually switched.
// @route GET /api/attendance/current-class
// @access Faculty
const getCurrentClass = asyncHandler(async (req, res) => {
  const faculty = await getMyFacultyProfile(req);
  if (!faculty) {
    res.status(403);
    throw new Error("Only faculty can take attendance");
  }

  const now = new Date();
  const dayName = DAY_NAMES[now.getDay()];
  const currentTime = `${pad2(now.getHours())}:${pad2(now.getMinutes())}`;

  const todaySlots = await TimetableSlot.find({ faculty: faculty._id, day: dayName })
    .populate("subject branch")
    .sort({ periodNumber: 1 });

  // Lexicographic string comparison matches chronological order here because
  // every startTime/endTime is stored zero-padded 24-hour ("09:05", "14:30").
  const activeSlot = todaySlots.find((s) => s.startTime <= currentTime && currentTime <= s.endTime);

  if (!activeSlot) {
    return res.json({
      success: true,
      message: "No active class right now",
      data: { active: false, todaySlots, serverTime: currentTime },
    });
  }

  const students = await Student.find({
    branch: activeSlot.branch._id,
    year: activeSlot.year,
    semester: activeSlot.semester,
    section: activeSlot.section,
  }).populate("user", "name").sort({ rollNumber: 1 });

  const todayStart = new Date(new Date().setHours(0, 0, 0, 0));
  const todayEnd = new Date(new Date().setHours(23, 59, 59, 999));
  const existing = await Attendance.findOne({
    subject: activeSlot.subject._id,
    date: { $gte: todayStart, $lte: todayEnd },
    periodNumber: activeSlot.periodNumber,
  });
  const existingMap = existing ? Object.fromEntries(existing.records.map((r) => [String(r.student), r.status])) : {};

  res.json({
    success: true,
    message: "Active class fetched",
    data: {
      active: true,
      slot: activeSlot,
      alreadyMarked: !!existing,
      students: students.map((s) => ({ ...s.toObject(), existingStatus: existingMap[String(s._id)] || null })),
      todaySlots,
    },
  });
});

// @desc  Roster to take attendance for: all students in a branch/year/sem/section.
//        Faculty must actually teach that class (any subject) - a faculty
//        member can't browse a roster for a class they have no assignment to.
const getRoster = asyncHandler(async (req, res) => {
  const { branch, year, semester, section } = req.query;
  if (!branch || !year || !semester) { res.status(400); throw new Error("branch, year and semester are required"); }

  const faculty = await getMyFacultyProfile(req);
  if (faculty) {
    const FacultyAssignment = require("../models/FacultyAssignment");
    const owns = await FacultyAssignment.exists({ faculty: faculty._id, branch, year: Number(year), semester: Number(semester), ...(section ? { section } : {}) });
    if (!owns) { res.status(403); throw new Error("You are not assigned to this class"); }
  }

  const filter = { branch, year: Number(year), semester: Number(semester) };
  if (section) filter.section = section;
  const students = await Student.find(filter).populate("user", "name").sort({ rollNumber: 1 });
  res.json({ success: true, message: "Roster fetched", data: students });
});

// @desc  Mark/replace attendance for one class session. Faculty must be the
//        assigned teacher for this exact subject+class.
const markAttendance = asyncHandler(async (req, res) => {
  const { subject, branch, year, semester, section, date, periodNumber, records } = req.body;
  if (!subject || !branch || !year || !semester || !date || !records?.length) {
    res.status(400);
    throw new Error("subject, branch, year, semester, date and records are required");
  }

  // Attendance can only be taken/edited for TODAY. Since editing re-submits
  // the same `date` the session was created with, this same check also
  // enforces "faculty can change attendance within the same day" - once the
  // calendar date rolls over, that date no longer equals "today" and any
  // further edit attempt is rejected here.
  if (new Date(date).toDateString() !== new Date().toDateString()) {
    res.status(403);
    throw new Error("Attendance can only be marked or edited on the same day it was taken");
  }

  const faculty = await getMyFacultyProfile(req);
  if (faculty) {
    const owns = await facultyOwnsClass(faculty._id, { subject, branch, year, semester, section: section || "A" });
    if (!owns) { res.status(403); throw new Error("You are not assigned to teach this subject for this class"); }
  }

  const key = { subject, date: new Date(date), periodNumber: periodNumber || 1 };
  const attendance = await Attendance.findOneAndUpdate(
    key,
    { ...key, branch, year, semester, section: section || "A", records, markedBy: req.user._id },
    { new: true, upsert: true, runValidators: true }
  );
  await logActivity(req, { action: "Marked attendance", module: "attendance" });
  res.status(201).json({ success: true, message: "Attendance saved", data: attendance });
});

// @desc  A student's attendance, overall and per-subject.
//        student -> self only. admin -> anyone. hod -> only their department.
//        faculty -> only a student in a class they teach.
const getStudentAttendance = asyncHandler(async (req, res) => {
  let studentId = req.params.studentId;
  if (req.user.role === "student") {
    const me = await Student.findOne({ user: req.user._id });
    if (!me) return res.json({ success: true, message: "Attendance fetched", data: { overall: 0, subjects: [] } });
    studentId = String(me._id);
  }
  if (!studentId) { res.status(400); throw new Error("studentId is required"); }

  const student = await Student.findById(studentId);
  if (!student) { res.status(404); throw new Error("Student not found"); }

  if (req.user.role === "hod") await assertHodOwnsBranch(req, student.branch);
  if (req.user.role === "faculty") {
    const faculty = await getMyFacultyProfile(req);
    const FacultyAssignment = require("../models/FacultyAssignment");
    const owns = await FacultyAssignment.exists({ faculty: faculty._id, branch: student.branch, year: student.year, semester: student.semester, section: student.section });
    if (!owns) { res.status(403); throw new Error("You do not teach this student"); }
  }

  const sessions = await Attendance.find({ "records.student": studentId }).populate("subject", "subjectName subjectCode");
  const bySubject = {};
  for (const session of sessions) {
    const rec = session.records.find((r) => String(r.student) === String(studentId));
    if (!rec) continue;
    const key = String(session.subject._id);
    if (!bySubject[key]) bySubject[key] = { subject: session.subject, total: 0, present: 0 };
    bySubject[key].total += 1;
    if (rec.status === "present") bySubject[key].present += 1;
  }
  const subjects = Object.values(bySubject).map((s) => ({
    subject: s.subject,
    total: s.total,
    present: s.present,
    percentage: s.total ? Math.round((s.present / s.total) * 1000) / 10 : 0,
  }));
  const totalAll = subjects.reduce((sum, s) => sum + s.total, 0);
  const presentAll = subjects.reduce((sum, s) => sum + s.present, 0);
  const overall = totalAll ? Math.round((presentAll / totalAll) * 1000) / 10 : 0;

  res.json({ success: true, message: "Attendance fetched", data: { overall, subjects } });
});

// @desc  HOD department attendance overview: today's present/absent and a
//        list of students below the configured attendance threshold.
// @route GET /api/attendance/department-overview
// @access HOD (own department), Admin (any department via ?branch=)
const getDepartmentOverview = asyncHandler(async (req, res) => {
  let branchIds;
  if (req.user.role === "hod") {
    if (!req.user.department) { res.status(403); throw new Error("Your account has no department assigned"); }
    branchIds = await branchIdsForDepartment(req.user.department);
  } else if (req.query.department) {
    branchIds = await branchIdsForDepartment(req.query.department);
  } else {
    const branches = await Branch.find({}).select("_id");
    branchIds = branches.map((b) => b._id);
  }

  const todayStart = new Date(new Date().setHours(0, 0, 0, 0));
  const todayEnd = new Date(new Date().setHours(23, 59, 59, 999));
  const todaySessions = await Attendance.find({ branch: { $in: branchIds }, date: { $gte: todayStart, $lte: todayEnd } });

  let presentToday = 0;
  let absentToday = 0;
  for (const s of todaySessions) {
    for (const r of s.records) {
      if (r.status === "present") presentToday += 1;
      else absentToday += 1;
    }
  }

  // Overall percentage per student, to flag anyone below threshold.
  const threshold = await lowAttendanceThreshold();
  const allSessions = await Attendance.find({ branch: { $in: branchIds } });
  const perStudent = {};
  for (const s of allSessions) {
    for (const r of s.records) {
      const key = String(r.student);
      if (!perStudent[key]) perStudent[key] = { total: 0, present: 0 };
      perStudent[key].total += 1;
      if (r.status === "present") perStudent[key].present += 1;
    }
  }
  const lowIds = Object.entries(perStudent)
    .filter(([, v]) => v.total > 0 && (v.present / v.total) * 100 < threshold)
    .map(([id, v]) => ({ id, percentage: Math.round((v.present / v.total) * 1000) / 10 }));

  const lowStudents = await Student.find({ _id: { $in: lowIds.map((l) => l.id) } }).populate("user", "name").populate("branch", "code");
  const lowStudentsWithPct = lowStudents.map((s) => ({
    student: s,
    percentage: lowIds.find((l) => l.id === String(s._id))?.percentage ?? 0,
  }));

  res.json({
    success: true,
    message: "Attendance overview fetched",
    data: { presentToday, absentToday, threshold, lowAttendanceStudents: lowStudentsWithPct },
  });
});

module.exports = { getCurrentClass, getRoster, markAttendance, getStudentAttendance, getDepartmentOverview };
