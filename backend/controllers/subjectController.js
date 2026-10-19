const asyncHandler = require("express-async-handler");
const Subject = require("../models/Subject");
const Faculty = require("../models/Faculty");
const FacultyAssignment = require("../models/FacultyAssignment");
const { branchIdsForDepartment, assertHodOwnsBranch } = require("../utils/scope");
const idOf = (value) => String(value?._id || value || "");

const populateOpts = [
  { path: "department" },
  { path: "branch" },
  { path: "faculty", populate: { path: "user", select: "name email" } },
];

// @desc  Get subjects, with filters. HOD only ever sees their own department.
// @route GET /api/subjects
const getSubjects = asyncHandler(async (req, res) => {
  const { branch, year, semester, department, search } = req.query;
  const filter = {};
  let hodBranchIds;
  if (req.user.role === "hod") {
    if (!req.user.department) { res.status(403); throw new Error("Your account has no department assigned"); }
    filter.department = req.user.department;
    hodBranchIds = await branchIdsForDepartment(req.user.department);
    filter.branch = { $in: hodBranchIds };
  } else if (department) filter.department = department;
  if (branch) {
    filter.branch = req.user.role === "hod"
      ? { $in: hodBranchIds.filter((id) => idOf(id) === String(branch)) }
      : branch;
  }
  if (year) filter.year = Number(year);
  if (semester) filter.semester = Number(semester);

  let subjects = await Subject.find(filter).populate(populateOpts).sort({ semester: 1, subjectName: 1 });

  if (search) {
    const term = search.toLowerCase();
    subjects = subjects.filter(
      (s) =>
        s.subjectName.toLowerCase().includes(term) || s.subjectCode.toLowerCase().includes(term)
    );
  }

  res.json({ success: true, message: "Subjects fetched", data: subjects });
});

const getSubjectById = asyncHandler(async (req, res) => {
  const subject = await Subject.findById(req.params.id).populate(populateOpts);
  if (!subject) {
    res.status(404);
    throw new Error("Subject not found");
  }
  if (req.user.role === "hod") {
    if (!req.user.department || idOf(subject.department) !== idOf(req.user.department)) {
      res.status(403);
      throw new Error("You can only access your own department's subjects");
    }
    await assertHodOwnsBranch(req, idOf(subject.branch));
  }
  res.json({ success: true, message: "Subject fetched", data: subject });
});

// @desc  Get subjects assigned to the logged-in faculty (already implicitly

// @route GET /api/subjects/mine
const getMySubjects = asyncHandler(async (req, res) => {
  const faculty = await Faculty.findOne({ user: req.user._id });
  if (!faculty) {
    return res.json({ success: true, message: "No faculty profile", data: [] });
  }

  const assigned = await FacultyAssignment.find({ faculty: faculty._id }).populate("subject branch department");
  const subjects = [];
  const seen = new Set();

  for (const assignment of assigned) {
    if (!assignment.subject) continue;
    const subject = assignment.subject.toObject();
    const key = String(subject._id);
    if (seen.has(key)) continue;
    seen.add(key);
    subject.branch = subject.branch || assignment.branch;
    subject.department = subject.department || assignment.department;
    subjects.push(subject);
  }

  const fallback = await Subject.find({ faculty: faculty._id }).populate(populateOpts);
  for (const subject of fallback) {
    const key = String(subject._id);
    if (seen.has(key)) continue;
    seen.add(key);
    subjects.push(subject.toObject());
  }

  res.json({ success: true, message: "Subjects fetched", data: subjects });
});

const createSubject = asyncHandler(async (req, res) => {
  const { subjectName, subjectCode, department, branch, year, semester, credits, faculty } =
    req.body;

  if (!subjectName || !subjectCode || !department || !branch || !year || !semester) {
    res.status(400);
    throw new Error("Missing required subject fields");
  }

  // If a faculty member is being assigned at creation time, make sure they
  // actually exists.
  if (faculty) {
    const facultyDoc = await Faculty.findById(faculty);
    if (!facultyDoc) {
      res.status(400);
      throw new Error("Invalid faculty");
    }
  }

  const subject = await Subject.create({
    subjectName,
    subjectCode,
    department,
    branch,
    year,
    semester,
    credits,
    faculty: faculty || undefined,
  });

  const populated = await Subject.findById(subject._id).populate(populateOpts);
  res.status(201).json({ success: true, message: "Subject created", data: populated });
});

const updateSubject = asyncHandler(async (req, res) => {
  const subject = await Subject.findById(req.params.id);
  if (!subject) {
    res.status(404);
    throw new Error("Subject not found");
  }
  if (req.body.faculty) {
    const facultyDoc = await Faculty.findById(req.body.faculty);
    if (!facultyDoc) {
      res.status(400);
      throw new Error("Invalid faculty");
    }
  }

  Object.assign(subject, req.body);
  await subject.save();
  const populated = await Subject.findById(subject._id).populate(populateOpts);
  res.json({ success: true, message: "Subject updated", data: populated });
});

const deleteSubject = asyncHandler(async (req, res) => {
  const subject = await Subject.findById(req.params.id);
  if (!subject) {
    res.status(404);
    throw new Error("Subject not found");
  }
  await subject.deleteOne();
  res.json({ success: true, message: "Subject deleted", data: {} });
});

module.exports = {
  getSubjects,
  getSubjectById,
  getMySubjects,
  createSubject,
  updateSubject,
  deleteSubject,
};
