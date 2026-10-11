const asyncHandler = require("express-async-handler");
const Exam = require("../models/Exam");
const Student = require("../models/Student");
const { assertHodOwnsBranch } = require("../utils/scope");
const { logActivity } = require("../utils/activity");

const populateOpts = [{ path: "subject" }, { path: "branch" }];

const getExams = asyncHandler(async (req, res) => {
  const { branch, year, semester, subject } = req.query;
  if (branch) await assertHodOwnsBranch(req, branch);
  const filter = {};
  if (branch) filter.branch = branch;
  if (year) filter.year = Number(year);
  if (semester) filter.semester = Number(semester);
  if (subject) filter.subject = subject;
  const exams = await Exam.find(filter).populate(populateOpts).sort({ date: 1 });
  res.json({ success: true, message: "Exams fetched", data: exams });
});

// @desc  Upcoming exams for the logged-in student
const getMyExams = asyncHandler(async (req, res) => {
  const student = await Student.findOne({ user: req.user._id });
  if (!student) return res.json({ success: true, message: "Exams fetched", data: [] });
  const exams = await Exam.find({
    branch: student.branch,
    year: student.year,
    semester: student.semester,
    date: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) },
  }).populate(populateOpts).sort({ date: 1 });
  res.json({ success: true, message: "Exams fetched", data: exams });
});

const createExam = asyncHandler(async (req, res) => {
  const { name, examType, subject, branch, year, semester, date, time, room, durationMinutes, maxMarks } = req.body;
  if (!name || !examType || !subject || !branch || !year || !semester || !date) {
    res.status(400);
    throw new Error("Missing required exam fields");
  }
  await assertHodOwnsBranch(req, branch);
  const exam = await Exam.create({ name, examType, subject, branch, year, semester, date, time, room, durationMinutes, maxMarks, createdBy: req.user._id });
  await logActivity(req, { action: `Scheduled exam "${name}"`, module: "exams" });
  const populated = await Exam.findById(exam._id).populate(populateOpts);
  res.status(201).json({ success: true, message: "Exam scheduled", data: populated });
});

const updateExam = asyncHandler(async (req, res) => {
  const exam = await Exam.findById(req.params.id);
  if (!exam) { res.status(404); throw new Error("Exam not found"); }
  await assertHodOwnsBranch(req, exam.branch);
  Object.assign(exam, req.body);
  await exam.save();
  const populated = await Exam.findById(exam._id).populate(populateOpts);
  res.json({ success: true, message: "Exam updated", data: populated });
});

const deleteExam = asyncHandler(async (req, res) => {
  const exam = await Exam.findById(req.params.id);
  if (!exam) { res.status(404); throw new Error("Exam not found"); }
  await assertHodOwnsBranch(req, exam.branch);
  await exam.deleteOne();
  res.json({ success: true, message: "Exam deleted", data: {} });
});

module.exports = { getExams, getMyExams, createExam, updateExam, deleteExam };
