const asyncHandler = require("express-async-handler");
const Section = require("../models/Section");
const { assertHodOwnsBranch, branchIdsForDepartment } = require("../utils/scope");
const { logActivity } = require("../utils/activity");

// @desc  List sections, optionally filtered. HOD only sees their own department.
const getSections = asyncHandler(async (req, res) => {
  const { branch, year, semester } = req.query;
  const filter = {};
  if (req.user.role === "hod") {
    if (!req.user.department) { res.status(403); throw new Error("Your account has no department assigned"); }
    const branchIds = await branchIdsForDepartment(req.user.department);
    filter.branch = branch && branchIds.some((b) => String(b) === branch) ? branch : { $in: branchIds };
  } else if (branch) filter.branch = branch;
  if (year) filter.year = Number(year);
  if (semester) filter.semester = Number(semester);

  const sections = await Section.find(filter).populate("branch").sort({ year: 1, semester: 1, name: 1 });
  res.json({ success: true, message: "Sections fetched", data: sections });
});

const createSection = asyncHandler(async (req, res) => {
  const { branch, year, semester, name } = req.body;
  if (!branch || !year || !semester || !name) { res.status(400); throw new Error("branch, year, semester and name are required"); }
  await assertHodOwnsBranch(req, branch);
  const section = await Section.create({ branch, year, semester, name });
  await logActivity(req, { action: `Created section "${name}"`, module: "sections" });
  const populated = await Section.findById(section._id).populate("branch");
  res.status(201).json({ success: true, message: "Section created", data: populated });
});

const deleteSection = asyncHandler(async (req, res) => {
  const section = await Section.findById(req.params.id);
  if (!section) { res.status(404); throw new Error("Section not found"); }
  await assertHodOwnsBranch(req, section.branch);
  await section.deleteOne();
  res.json({ success: true, message: "Section deleted", data: {} });
});

module.exports = { getSections, createSection, deleteSection };
