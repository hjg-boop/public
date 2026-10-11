const asyncHandler = require("express-async-handler");
const User = require("../models/User");
const Faculty = require("../models/Faculty");
const Department = require("../models/Department");
const Subject = require("../models/Subject");
const Document = require("../models/Document");
const Notice = require("../models/Notice");
const { isAdminRole } = require("../utils/roles");

const populateOpts = [{ path: "user", select: "name email phone status" }, { path: "department" }];

// @desc    Get all faculty. HOD only ever sees their own department.
// @route   GET /api/faculty
// @access  Private (any authenticated role)
const getFaculty = asyncHandler(async (req, res) => {
  const { search, department } = req.query;
  const filter = {};
  if (req.user.role === "hod") {
    if (!req.user.department) { res.status(403); throw new Error("Your account has no department assigned"); }
    filter.department = req.user.department;
  } else if (department) filter.department = department;

  let faculty = await Faculty.find(filter).populate(populateOpts).sort({ createdAt: -1 });

  if (search) {
    const term = search.toLowerCase();
    faculty = faculty.filter(
      (f) =>
        f.user?.name?.toLowerCase().includes(term) ||
        f.user?.email?.toLowerCase().includes(term) ||
        f.employeeId?.toLowerCase().includes(term)
    );
  }

  res.json({ success: true, message: "Faculty fetched", data: faculty });
});

const getFacultyById = asyncHandler(async (req, res) => {
  const faculty = await Faculty.findById(req.params.id).populate(populateOpts);
  if (!faculty) {
    res.status(404);
    throw new Error("Faculty not found");
  }
  res.json({ success: true, message: "Faculty fetched", data: faculty });
});

// @desc    Get logged-in faculty's own profile + stats
// @route   GET /api/faculty/me
// @access  Private (faculty)
const getMyFacultyProfile = asyncHandler(async (req, res) => {
  const faculty = await Faculty.findOne({ user: req.user._id }).populate(populateOpts);
  if (!faculty) {
    res.status(404);
    throw new Error("Faculty profile not found");
  }

  const assignedSubjects = await Subject.find({ faculty: faculty._id }).populate("branch");
  const uploadedDocsCount = await Document.countDocuments({ uploadedBy: req.user._id });
  const recentNotices = await Notice.find({ createdBy: req.user._id })
    .sort({ createdAt: -1 })
    .limit(5);

  res.json({
    success: true,
    message: "Profile fetched",
    data: { faculty, assignedSubjects, uploadedDocsCount, recentNotices },
  });
});

// @desc    Create a faculty (creates User + Faculty together) in the

// @route   POST /api/faculty
// @access  Private (admin)
const createFaculty = asyncHandler(async (req, res) => {
  const { name, email, phone, password, employeeId, department, designation, status } = req.body;

  if (!name || !email || !password || !employeeId || !department) {
    res.status(400);
    throw new Error("Missing required faculty fields");
  }

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    res.status(400);
    throw new Error("A user with this email already exists");
  }

  const departmentDoc = await Department.findById(department);
  if (!departmentDoc) {
    res.status(400);
    throw new Error("Invalid department");
  }

  const user = await User.create({
    name,
    email: email.toLowerCase(),
    phone,
    password,
    role: "faculty",
    status: status || "active",
  });

  const faculty = await Faculty.create({
    user: user._id,
    employeeId,
    department,
    designation,
  });

  const populated = await Faculty.findById(faculty._id).populate(populateOpts);
  res.status(201).json({ success: true, message: "Faculty created", data: populated });
});

// @desc    Update a faculty
// @route   PUT /api/faculty/:id
// @access  Private (admin) or self (limited)
const updateFaculty = asyncHandler(async (req, res) => {
  const faculty = await Faculty.findById(req.params.id);
  if (!faculty) {
    res.status(404);
    throw new Error("Faculty not found");
  }
  const isSelf = req.user.role === "faculty" && String(faculty.user) === String(req.user._id);
  const isAdmin = isAdminRole(req.user.role);

  if (!isSelf && !isAdmin) {
    res.status(403);
    throw new Error("Not authorized to update this faculty");
  }

  if (isSelf && !isAdmin) {
    const { phone } = req.body;
    if (phone !== undefined) await User.findByIdAndUpdate(faculty.user, { phone });
  }

  if (isAdmin) {
    const { employeeId, department, designation, name, email, phone, status } = req.body;
    if (department !== undefined) {
      const departmentDoc = await Department.findById(department);
      if (!departmentDoc) {
        res.status(400);
        throw new Error("Invalid department");
      }
      faculty.department = department;
    }
    if (employeeId !== undefined) faculty.employeeId = employeeId;
    if (designation !== undefined) faculty.designation = designation;
    await faculty.save();

    const userUpdates = {};
    if (name !== undefined) userUpdates.name = name;
    if (email !== undefined) userUpdates.email = email.toLowerCase();
    if (phone !== undefined) userUpdates.phone = phone;
    if (status !== undefined) userUpdates.status = status;
    if (Object.keys(userUpdates).length > 0) {
      await User.findByIdAndUpdate(faculty.user, userUpdates);
    }
  }

  const updated = await Faculty.findById(faculty._id).populate(populateOpts);
  res.json({ success: true, message: "Faculty updated", data: updated });
});

// @desc    Delete a faculty
// @route   DELETE /api/faculty/:id
// @access  Private (admin)
const deleteFaculty = asyncHandler(async (req, res) => {
  const faculty = await Faculty.findById(req.params.id);
  if (!faculty) {
    res.status(404);
    throw new Error("Faculty not found");
  }
  await User.findByIdAndDelete(faculty.user);
  await faculty.deleteOne();
  res.json({ success: true, message: "Faculty deleted", data: {} });
});

// @desc    Assign a subject to a faculty member.
// @route   PUT /api/faculty/:id/assign-subject
// @access  Private (admin)
const assignSubject = asyncHandler(async (req, res) => {
  const { subjectId } = req.body;
  const faculty = await Faculty.findById(req.params.id);
  if (!faculty) {
    res.status(404);
    throw new Error("Faculty not found");
  }
  const subject = await Subject.findById(subjectId);
  if (!subject) {
    res.status(404);
    throw new Error("Subject not found");
  }
  subject.faculty = req.params.id;
  await subject.save();
  res.json({ success: true, message: "Subject assigned", data: subject });
});

module.exports = {
  getFaculty,
  getFacultyById,
  getMyFacultyProfile,
  createFaculty,
  updateFaculty,
  deleteFaculty,
  assignSubject,
};
