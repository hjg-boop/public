const asyncHandler = require("express-async-handler");
const User = require("../models/User");
const { logActivity } = require("../utils/activity");

// Admin-only management of the two "special" account types that sit above
// ordinary Faculty/Student records: HOD (department-scoped) and Accountant
// (fee collection). Both are plain Users with role="hod"/"accountant" - HOD
// additionally carries a `department` reference that every HOD-scoped query
// in the app checks against.

const getByRole = (role) => asyncHandler(async (req, res) => {
  const users = await User.find({ role }).populate("department", "name").sort({ createdAt: -1 });
  res.json({ success: true, message: `${role}s fetched`, data: users });
});

const createByRole = (role) => asyncHandler(async (req, res) => {
  const { name, email, phone, password, department } = req.body;
  if (!name || !email || !password) { res.status(400); throw new Error("Name, email and password are required"); }
  if (role === "hod" && !department) { res.status(400); throw new Error("A department is required for a HOD account"); }

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) { res.status(400); throw new Error("A user with this email already exists"); }

  const user = await User.create({ name, email: email.toLowerCase(), password, phone, role, status: "active", ...(role === "hod" ? { department } : {}) });
  await logActivity(req, { action: `Created ${role} account "${name}"`, module: `${role}-management` });
  const populated = await User.findById(user._id).populate("department", "name");
  res.status(201).json({ success: true, message: `${role} created`, data: populated });
});

const updateByRole = (role) => asyncHandler(async (req, res) => {
  const user = await User.findOne({ _id: req.params.id, role });
  if (!user) { res.status(404); throw new Error(`${role} not found`); }
  const { name, phone, department } = req.body;
  if (name !== undefined) user.name = name;
  if (phone !== undefined) user.phone = phone;
  if (role === "hod" && department !== undefined) user.department = department;
  await user.save();
  await logActivity(req, { action: `Updated ${role} "${user.name}"`, module: `${role}-management` });
  const populated = await User.findById(user._id).populate("department", "name");
  res.json({ success: true, message: `${role} updated`, data: populated });
});

const setStatusByRole = (role) => asyncHandler(async (req, res) => {
  const user = await User.findOne({ _id: req.params.id, role });
  if (!user) { res.status(404); throw new Error(`${role} not found`); }
  user.status = req.body.status === "active" ? "active" : "inactive";
  await user.save();
  res.json({ success: true, message: `${role} ${user.status === "active" ? "activated" : "deactivated"}`, data: user });
});

const deleteByRole = (role) => asyncHandler(async (req, res) => {
  const user = await User.findOne({ _id: req.params.id, role });
  if (!user) { res.status(404); throw new Error(`${role} not found`); }
  await user.deleteOne();
  await logActivity(req, { action: `Deleted ${role} "${user.name}"`, module: `${role}-management` });
  res.json({ success: true, message: `${role} deleted`, data: {} });
});

module.exports = {
  getHods: getByRole("hod"), createHod: createByRole("hod"), updateHod: updateByRole("hod"), setHodStatus: setStatusByRole("hod"), deleteHod: deleteByRole("hod"),
  getAccountants: getByRole("accountant"), createAccountant: createByRole("accountant"), updateAccountant: updateByRole("accountant"), setAccountantStatus: setStatusByRole("accountant"), deleteAccountant: deleteByRole("accountant"),
};
