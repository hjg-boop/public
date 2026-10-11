const asyncHandler = require("express-async-handler");
const OnlineExam = require("../models/OnlineExam");
const OnlineExamSubmission = require("../models/OnlineExamSubmission");
const Student = require("../models/Student");
const { logActivity } = require("../utils/activity");

const getExams = asyncHandler(async (req, res) => {
  const { branch, year, semester, subject } = req.query;
  const filter = {};
  if (branch) filter.branch = branch;
  if (year) filter.year = Number(year);
  if (semester) filter.semester = Number(semester);
  if (subject) filter.subject = subject;
  const exams = await OnlineExam.find(filter).populate("subject branch").sort({ startTime: -1 });
  res.json({ success: true, message: "Online exams fetched", data: exams });
});

// @desc  Exams available to the student right now, WITHOUT correct answers.
const getAvailableExams = asyncHandler(async (req, res) => {
  const student = await Student.findOne({ user: req.user._id });
  if (!student) return res.json({ success: true, message: "Exams fetched", data: [] });
  const now = new Date();
  const exams = await OnlineExam.find({ branch: student.branch, year: student.year, semester: student.semester, endTime: { $gte: now } })
    .populate("subject", "subjectName subjectCode")
    .select("-questions.correctOption")
    .sort({ startTime: 1 });

  const submitted = await OnlineExamSubmission.find({ student: student._id, exam: { $in: exams.map((e) => e._id) } }).select("exam score maxScore");
  const submittedMap = Object.fromEntries(submitted.map((s) => [String(s.exam), s]));

  const data = exams.map((e) => ({ ...e.toObject(), mySubmission: submittedMap[String(e._id)] || null }));
  res.json({ success: true, message: "Exams fetched", data });
});

const createExam = asyncHandler(async (req, res) => {
  const { title, subject, branch, year, semester, questions, durationMinutes, startTime, endTime } = req.body;
  if (!title || !subject || !branch || !year || !semester || !questions?.length || !startTime || !endTime) {
    res.status(400);
    throw new Error("Missing required online exam fields");
  }
  const exam = await OnlineExam.create({ title, subject, branch, year, semester, questions, durationMinutes, startTime, endTime, createdBy: req.user._id });
  await logActivity(req, { action: `Created online exam "${title}"`, module: "online-exams" });
  res.status(201).json({ success: true, message: "Online exam created", data: exam });
});

const deleteExam = asyncHandler(async (req, res) => {
  const exam = await OnlineExam.findById(req.params.id);
  if (!exam) { res.status(404); throw new Error("Exam not found"); }
  await exam.deleteOne();
  await OnlineExamSubmission.deleteMany({ exam: exam._id });
  res.json({ success: true, message: "Exam deleted", data: {} });
});

// @desc  Student submits answers; objective questions are auto-graded server-side
//        (correct answers never leave the server before this point).
const submitExam = asyncHandler(async (req, res) => {
  const exam = await OnlineExam.findById(req.params.id);
  if (!exam) { res.status(404); throw new Error("Exam not found"); }
  const student = await Student.findOne({ user: req.user._id });
  if (!student) { res.status(403); throw new Error("Only students can submit"); }

  const existing = await OnlineExamSubmission.findOne({ exam: exam._id, student: student._id });
  if (existing) { res.status(400); throw new Error("You have already submitted this exam"); }
  if (new Date() > exam.endTime) { res.status(400); throw new Error("This exam has closed"); }

  const { answers } = req.body; // [{ question, selectedOption, textAnswer }]
  let score = 0;
  let maxScore = 0;
  const answerMap = Object.fromEntries((answers || []).map((a) => [String(a.question), a]));

  for (const q of exam.questions) {
    if (q.type === "short_answer") continue; // manually graded, not auto-scored
    maxScore += q.marks;
    const given = answerMap[String(q._id)];
    if (given && given.selectedOption === q.correctOption) score += q.marks;
  }

  const submission = await OnlineExamSubmission.create({
    exam: exam._id,
    student: student._id,
    answers: answers || [],
    score,
    maxScore,
  });
  res.status(201).json({ success: true, message: "Exam submitted", data: submission });
});

// @desc  Faculty/admin analytics: score distribution + per-question stats.
const getExamAnalytics = asyncHandler(async (req, res) => {
  const exam = await OnlineExam.findById(req.params.id);
  if (!exam) { res.status(404); throw new Error("Exam not found"); }
  const submissions = await OnlineExamSubmission.find({ exam: exam._id }).populate({ path: "student", populate: { path: "user", select: "name" } });

  const questionStats = exam.questions.map((q) => {
    if (q.type === "short_answer") return { question: q.text, type: q.type };
    let correct = 0;
    for (const sub of submissions) {
      const ans = sub.answers.find((a) => String(a.question) === String(q._id));
      if (ans && ans.selectedOption === q.correctOption) correct += 1;
    }
    return { question: q.text, type: q.type, correctCount: correct, totalAttempts: submissions.length };
  });

  res.json({
    success: true,
    message: "Analytics fetched",
    data: { submissions, questionStats, avgScore: submissions.length ? submissions.reduce((s, x) => s + x.score, 0) / submissions.length : 0 },
  });
});

module.exports = { getExams, getAvailableExams, createExam, deleteExam, submitExam, getExamAnalytics };
