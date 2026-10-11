const asyncHandler = require("express-async-handler");
const Notice = require("../models/Notice");
const Student = require("../models/Student");
const { isAdminRole } = require("../utils/roles");

const populateOpts = [
  { path: "department" },
  { path: "branch" },
  { path: "createdBy", select: "name role" },
];

// @desc  Get notices. For students, auto-filters to what's relevant to
//        them (their branch/year/semester).
// @route GET /api/notices
const getNotices = asyncHandler(async (req, res) => {
  const now = new Date();
  const filter = {
    $and: [
      { $or: [{ expiryDate: { $exists: false } }, { expiryDate: null }, { expiryDate: { $gte: now } }] },
    ],
  };

  if (req.user.role === "student") {
    const student = await Student.findOne({ user: req.user._id });
    if (student) {
      filter.$and.push({
        $or: [
          { targetScope: "college" },
          { targetScope: "branch", branch: student.branch },
          { targetScope: "year", branch: student.branch, year: student.year },
          {
            targetScope: "semester",
            branch: student.branch,
            year: student.year,
            semester: student.semester,
          },
        ],
      });
    }
  }

  const { search, priority } = req.query;
  if (priority) filter.priority = priority;

  let notices = await Notice.find(filter).populate(populateOpts).sort({ createdAt: -1 });

  if (search) {
    const term = search.toLowerCase();
    notices = notices.filter(
      (n) => n.title.toLowerCase().includes(term) || n.description.toLowerCase().includes(term)
    );
  }

  res.json({ success: true, message: "Notices fetched", data: notices });
});

const getNoticeById = asyncHandler(async (req, res) => {
  const notice = await Notice.findById(req.params.id).populate(populateOpts);
  if (!notice) {
    res.status(404);
    throw new Error("Notice not found");
  }
  res.json({ success: true, message: "Notice fetched", data: notice });
});

// @desc  Create a notice
// @route POST /api/notices
// @access Private (faculty, admin)
const createNotice = asyncHandler(async (req, res) => {
  const {
    title,
    description,
    targetScope,
    department,
    branch,
    year,
    semester,
    priority,
    publishDate,
    expiryDate,
  } = req.body;

  if (!title || !description) {
    res.status(400);
    throw new Error("Title and description are required");
  }

  const notice = await Notice.create({
    title,
    description,
    targetScope: targetScope || "college",
    department: department || undefined,
    branch: branch || undefined,
    year: year || undefined,
    semester: semester || undefined,
    priority: priority || "normal",
    publishDate: publishDate || Date.now(),
    expiryDate: expiryDate || undefined,
    createdBy: req.user._id,
  });

  const populated = await Notice.findById(notice._id).populate(populateOpts);
  res.status(201).json({ success: true, message: "Notice created", data: populated });
});

const updateNotice = asyncHandler(async (req, res) => {
  const notice = await Notice.findById(req.params.id);
  if (!notice) {
    res.status(404);
    throw new Error("Notice not found");
  }

  const isOwner = String(notice.createdBy) === String(req.user._id);
  if (!isAdminRole(req.user.role) && !isOwner) {
    res.status(403);
    throw new Error("Not authorized to edit this notice");
  }

  Object.assign(notice, req.body);
  await notice.save();
  const populated = await Notice.findById(notice._id).populate(populateOpts);
  res.json({ success: true, message: "Notice updated", data: populated });
});

const deleteNotice = asyncHandler(async (req, res) => {
  const notice = await Notice.findById(req.params.id);
  if (!notice) {
    res.status(404);
    throw new Error("Notice not found");
  }

  const isOwner = String(notice.createdBy) === String(req.user._id);
  if (!isAdminRole(req.user.role) && !isOwner) {
    res.status(403);
    throw new Error("Not authorized to delete this notice");
  }

  await notice.deleteOne();
  res.json({ success: true, message: "Notice deleted", data: {} });
});

// @desc  Public, unauthenticated feed of college-wide notices for the
//        marketing homepage.
// @route GET /api/notices/public
const getPublicNotices = asyncHandler(async (req, res) => {
  const now = new Date();
  const notices = await Notice.find({
    targetScope: "college",
    $or: [{ expiryDate: { $exists: false } }, { expiryDate: null }, { expiryDate: { $gte: now } }],
  })
    .populate({ path: "createdBy", select: "name role" })
    .sort({ createdAt: -1 })
    .limit(6);

  res.json({ success: true, message: "Public notices fetched", data: notices });
});

module.exports = {
  getNotices,
  getNoticeById,
  createNotice,
  updateNotice,
  deleteNotice,
  getPublicNotices,
};
