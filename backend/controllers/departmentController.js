const asyncHandler = require("express-async-handler");
const Department = require("../models/Department");
const Branch = require("../models/Branch");

// @desc  All departments
// @route GET /api/departments
// @access Private (any authenticated role)
const getDepartments = asyncHandler(async (req, res) => {
  const departments = await Department.find({}).sort({ name: 1 });
  res.json({ success: true, message: "Departments fetched", data: departments });
});

// @desc  Public department directory for the marketing homepage.
// @route GET /api/departments/public
// @access Public
const getPublicDepartments = asyncHandler(async (req, res) => {
  const departments = await Department.find({}).sort({ name: 1 });
  res.json({ success: true, message: "Departments fetched", data: departments });
});

const createDepartment = asyncHandler(async (req, res) => {
  const { name, code, description } = req.body;
  if (!name || !code) {
    res.status(400);
    throw new Error("Name and code are required");
  }
  const department = await Department.create({ name, code, description });
  res.status(201).json({ success: true, message: "Department created", data: department });
});

const updateDepartment = asyncHandler(async (req, res) => {
  const department = await Department.findById(req.params.id);
  if (!department) {
    res.status(404);
    throw new Error("Department not found");
  }

  const { name, code, description } = req.body;
  if (name !== undefined) department.name = name;
  if (code !== undefined) department.code = code;
  if (description !== undefined) department.description = description;
  await department.save();
  res.json({ success: true, message: "Department updated", data: department });
});

const deleteDepartment = asyncHandler(async (req, res) => {
  const department = await Department.findById(req.params.id);
  if (!department) {
    res.status(404);
    throw new Error("Department not found");
  }
  await department.deleteOne();
  res.json({ success: true, message: "Department deleted", data: {} });
});

// ----- Branches -----

const getBranches = asyncHandler(async (req, res) => {
  const { department } = req.query;
  const filter = {};
  if (department) filter.department = department;
  const branches = await Branch.find(filter).populate("department").sort({ name: 1 });
  res.json({ success: true, message: "Branches fetched", data: branches });
});

// @desc  Public branch/course directory for the marketing homepage.
// @route GET /api/branches/public
// @access Public
const getPublicBranches = asyncHandler(async (req, res) => {
  const branches = await Branch.find({}).populate("department").sort({ name: 1 });
  res.json({ success: true, message: "Branches fetched", data: branches });
});

const createBranch = asyncHandler(async (req, res) => {
  const { name, code, department, totalYears } = req.body;
  if (!name || !code || !department) {
    res.status(400);
    throw new Error("Name, code and department are required");
  }
  const departmentDoc = await Department.findById(department);
  if (!departmentDoc) {
    res.status(400);
    throw new Error("Invalid department");
  }
  const branch = await Branch.create({ name, code, department, totalYears });
  const populated = await Branch.findById(branch._id).populate("department");
  res.status(201).json({ success: true, message: "Branch created", data: populated });
});

const updateBranch = asyncHandler(async (req, res) => {
  const branch = await Branch.findById(req.params.id);
  if (!branch) {
    res.status(404);
    throw new Error("Branch not found");
  }

  const { name, code, department, totalYears } = req.body;
  if (department !== undefined) {
    const departmentDoc = await Department.findById(department);
    if (!departmentDoc) {
      res.status(400);
      throw new Error("Invalid department");
    }
    branch.department = department;
  }
  if (name !== undefined) branch.name = name;
  if (code !== undefined) branch.code = code;
  if (totalYears !== undefined) branch.totalYears = totalYears;
  await branch.save();
  const populated = await Branch.findById(branch._id).populate("department");
  res.json({ success: true, message: "Branch updated", data: populated });
});

const deleteBranch = asyncHandler(async (req, res) => {
  const branch = await Branch.findById(req.params.id);
  if (!branch) {
    res.status(404);
    throw new Error("Branch not found");
  }
  await branch.deleteOne();
  res.json({ success: true, message: "Branch deleted", data: {} });
});

module.exports = {
  getDepartments,
  getPublicDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  getBranches,
  getPublicBranches,
  createBranch,
  updateBranch,
  deleteBranch,
};
