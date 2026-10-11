const asyncHandler = require("express-async-handler");
const FacultyAssignment = require("../models/FacultyAssignment");
const Faculty = require("../models/Faculty");
const Branch = require("../models/Branch");
const { assertHodOwnsBranch, branchIdsForDepartment } = require("../utils/scope");
const { logActivity } = require("../utils/activity");

const populateOpts = [
  { path: "faculty", populate: { path: "user", select: "name" } },
  { path: "branch" },
  { path: "subject" },
];

// @desc  List assignments. HOD only sees their own department's assignments.
const getAssignments = asyncHandler(async (req, res) => {
  const { branch, faculty } = req.query;
  const filter = {};
  if (req.user.role === "hod") {
    if (!req.user.department) { res.status(403); throw new Error("Your account has no department assigned"); }
    const branchIds = await branchIdsForDepartment(req.user.department);
    filter.branch = { $in: branchIds };
  } else if (branch) filter.branch = branch;
  if (faculty) filter.faculty = faculty;

  const assignments = await FacultyAssignment.find(filter).populate(populateOpts).sort({ createdAt: -1 });
  res.json({ success: true, message: "Assignments fetched", data: assignments });
});

// @desc  Assign a faculty member to teach a subject for one branch/year/semester/section.
// @route POST /api/faculty-assignments
// @access Admin (any branch), HOD (own department only)
const createAssignment = asyncHandler(async (req, res) => {
  const { faculty, branch, year, semester, section, subject } = req.body;
  if (!faculty || !branch || !year || !semester || !section || !subject) {
    res.status(400);
    throw new Error("faculty, branch, year, semester, section and subject are all required");
  }
  await assertHodOwnsBranch(req, branch);

  const branchDoc = await Branch.findById(branch);
  if (!branchDoc) { res.status(400); throw new Error("Invalid branch"); }

  const facultyDoc = await Faculty.findById(faculty);
  if (!facultyDoc) { res.status(400); throw new Error("Invalid faculty"); }
  // A faculty member can only be assigned within their own department - this
  // keeps "my classes" meaningful and matches how real departments operate.
  if (String(facultyDoc.department) !== String(branchDoc.department)) {
    res.status(400);
    throw new Error("This faculty member belongs to a different department than the selected branch");
  }

  const assignment = await FacultyAssignment.create({
    faculty, department: branchDoc.department, branch, year, semester, section: section.toUpperCase(), subject, assignedBy: req.user._id,
  });
  await logActivity(req, { action: "Assigned a faculty member to a class", module: "faculty-assignments" });
  const populated = await FacultyAssignment.findById(assignment._id).populate(populateOpts);
  res.status(201).json({ success: true, message: "Faculty assigned", data: populated });
});

const deleteAssignment = asyncHandler(async (req, res) => {
  const assignment = await FacultyAssignment.findById(req.params.id);
  if (!assignment) { res.status(404); throw new Error("Assignment not found"); }
  await assertHodOwnsBranch(req, assignment.branch);
  await assignment.deleteOne();
  await logActivity(req, { action: "Removed a faculty class assignment", module: "faculty-assignments" });
  res.json({ success: true, message: "Assignment removed", data: {} });
});

// @desc  My own teaching assignments, for the faculty dashboard ("My Classes").
const getMyAssignments = asyncHandler(async (req, res) => {
  const faculty = await Faculty.findOne({ user: req.user._id });
  if (!faculty) return res.json({ success: true, message: "Assignments fetched", data: [] });
  const assignments = await FacultyAssignment.find({ faculty: faculty._id }).populate(populateOpts).sort({ createdAt: -1 });
  res.json({ success: true, message: "Assignments fetched", data: assignments });
});

module.exports = { getAssignments, createAssignment, deleteAssignment, getMyAssignments };
