const asyncHandler = require("express-async-handler");
const Assignment = require("../models/Assignment");
const AssignmentSubmission = require("../models/AssignmentSubmission");
const Student = require("../models/Student");
const { storeFile, deleteStoredFile } = require("../services/fileStorage");
const { isAdminRole } = require("../utils/roles");
const { logActivity } = require("../utils/activity");
const { getMyFacultyProfile, facultyOwnsClass } = require("../utils/scope");

const populateOpts = [{ path: "subject" }, { path: "branch" }, { path: "createdBy", select: "name" }];

const getAssignments = asyncHandler(async (req, res) => {
  const { subject, branch, year, semester, section } = req.query;
  const filter = {};
  if (subject) filter.subject = subject;
  if (branch) filter.branch = branch;
  if (year) filter.year = Number(year);
  if (semester) filter.semester = Number(semester);
  if (section) filter.section = section;

  const assignments = await Assignment.find(filter).populate(populateOpts).sort({ createdAt: -1 });
  res.json({ success: true, message: "Assignments fetched", data: assignments });
});

// @desc  Assignments relevant to the logged-in student (their own class).
const getMyAssignments = asyncHandler(async (req, res) => {
  const student = await Student.findOne({ user: req.user._id });
  if (!student) return res.json({ success: true, message: "Assignments fetched", data: [] });
  const assignments = await Assignment.find({ branch: student.branch, year: student.year, semester: student.semester, section: student.section })
    .populate(populateOpts)
    .sort({ createdAt: -1 });

  const submissions = await AssignmentSubmission.find({ student: student._id, assignment: { $in: assignments.map((a) => a._id) } });
  const byAssignment = Object.fromEntries(submissions.map((s) => [String(s.assignment), s]));
  const data = assignments.map((a) => ({ ...a.toObject(), mySubmission: byAssignment[String(a._id)] || null }));
  res.json({ success: true, message: "Assignments fetched", data });
});

const createAssignment = asyncHandler(async (req, res) => {
  const { title, description, subject, branch, year, semester, section, dueDate } = req.body;
  if (!title || !subject || !branch || !year || !semester) {
    res.status(400);
    throw new Error("Missing required assignment fields");
  }

  const faculty = await getMyFacultyProfile(req);
  if (faculty) {
    const owns = await facultyOwnsClass(faculty._id, { subject, branch, year, semester, section: section || "A" });
    if (!owns) { res.status(403); throw new Error("You are not assigned to teach this subject for this class"); }
  }

  let stored = null;
  if (req.file) {
    stored = await storeFile(req, {
      buffer: req.file.buffer,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      folder: "assignments",
    });
  }

  const assignment = await Assignment.create({
    title,
    description,
    subject,
    branch,
    year,
    semester,
    section: section || "A",
    dueDate,
    fileUrl: stored?.url,
    publicId: stored?.publicId,
    resourceType: stored?.resourceType,
    createdBy: req.user._id,
  });

  await logActivity(req, { action: `Posted assignment "${title}"`, module: "assignments" });

  const populated = await Assignment.findById(assignment._id).populate(populateOpts);
  res.status(201).json({ success: true, message: "Assignment created", data: populated });
});

const deleteAssignment = asyncHandler(async (req, res) => {
  const assignment = await Assignment.findById(req.params.id);
  if (!assignment) {
    res.status(404);
    throw new Error("Assignment not found");
  }
  const isOwner = String(assignment.createdBy) === String(req.user._id);
  if (!isAdminRole(req.user.role) && !isOwner) {
    res.status(403);
    throw new Error("Not authorized to delete this assignment");
  }

  if (assignment.fileUrl) {
    await deleteStoredFile({ fileUrl: assignment.fileUrl, publicId: assignment.publicId, resourceType: assignment.resourceType });
  }
  await AssignmentSubmission.deleteMany({ assignment: assignment._id });
  await assignment.deleteOne();
  await logActivity(req, { action: `Deleted assignment "${assignment.title}"`, module: "assignments" });
  res.json({ success: true, message: "Assignment deleted", data: {} });
});

// @desc  Student uploads their submission for an assignment (multipart, field "file").
const submitAssignment = asyncHandler(async (req, res) => {
  if (!req.file) { res.status(400); throw new Error("A file is required"); }
  const assignment = await Assignment.findById(req.params.id);
  if (!assignment) { res.status(404); throw new Error("Assignment not found"); }

  const student = await Student.findOne({ user: req.user._id });
  if (!student) { res.status(403); throw new Error("Student profile not found"); }
  if (
    String(student.branch) !== String(assignment.branch) ||
    student.year !== assignment.year ||
    student.semester !== assignment.semester ||
    student.section !== assignment.section
  ) {
    res.status(403);
    throw new Error("This assignment is not for your class");
  }

  const existing = await AssignmentSubmission.findOne({ assignment: assignment._id, student: student._id });
  if (existing) { res.status(400); throw new Error("You have already submitted this assignment"); }

  const stored = await storeFile(req, { buffer: req.file.buffer, originalName: req.file.originalname, mimeType: req.file.mimetype, folder: "submissions" });
  const isLate = assignment.dueDate && new Date() > new Date(assignment.dueDate);

  const submission = await AssignmentSubmission.create({
    assignment: assignment._id,
    student: student._id,
    fileUrl: stored.url,
    publicId: stored.publicId,
    resourceType: stored.resourceType,
    status: isLate ? "late" : "submitted",
  });
  res.status(201).json({ success: true, message: "Assignment submitted", data: submission });
});

// @desc  Faculty views submissions for one of their assignments.
const getSubmissions = asyncHandler(async (req, res) => {
  const assignment = await Assignment.findById(req.params.id);
  if (!assignment) { res.status(404); throw new Error("Assignment not found"); }
  if (!isAdminRole(req.user.role) && String(assignment.createdBy) !== String(req.user._id)) {
    res.status(403);
    throw new Error("Not authorized to view these submissions");
  }
  const submissions = await AssignmentSubmission.find({ assignment: assignment._id })
    .populate({ path: "student", populate: { path: "user", select: "name" } })
    .sort({ submittedAt: -1 });
  res.json({ success: true, message: "Submissions fetched", data: submissions });
});

// @desc  Faculty grades one submission.
const gradeSubmission = asyncHandler(async (req, res) => {
  const submission = await AssignmentSubmission.findById(req.params.id).populate("assignment");
  if (!submission) { res.status(404); throw new Error("Submission not found"); }
  if (!isAdminRole(req.user.role) && String(submission.assignment.createdBy) !== String(req.user._id)) {
    res.status(403);
    throw new Error("Not authorized to grade this submission");
  }
  const { grade, feedback } = req.body;
  if (grade !== undefined) submission.grade = grade;
  if (feedback !== undefined) submission.feedback = feedback;
  await submission.save();
  res.json({ success: true, message: "Submission graded", data: submission });
});

module.exports = { getAssignments, getMyAssignments, createAssignment, deleteAssignment, submitAssignment, getSubmissions, gradeSubmission };
