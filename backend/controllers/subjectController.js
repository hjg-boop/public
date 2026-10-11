const asyncHandler = require("express-async-handler");
const Subject = require("../models/Subject");
const Faculty = require("../models/Faculty");

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
  if (req.user.role === "hod") {
    if (!req.user.department) { res.status(403); throw new Error("Your account has no department assigned"); }
    filter.department = req.user.department;
  } else if (department) filter.department = department;
  if (branch) filter.branch = branch;
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
  res.json({ success: true, message: "Subject fetched", data: subject });
});

// @desc  Get subjects assigned to the logged-in faculty (already implicitly

// @route GET /api/subjects/mine
const getMySubjects = asyncHandler(async (req, res) => {
  const faculty = await Faculty.findOne({ user: req.user._id });
  if (!faculty) {
    return res.json({ success: true, message: "No faculty profile", data: [] });
  }
  const subjects = await Subject.find({ faculty: faculty._id }).populate(populateOpts);
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
