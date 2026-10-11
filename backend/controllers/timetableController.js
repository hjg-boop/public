const asyncHandler = require("express-async-handler");
const TimetableSlot = require("../models/TimetableSlot");
const Faculty = require("../models/Faculty");
const Student = require("../models/Student");
const { assertHodOwnsBranch } = require("../utils/scope");
const { logActivity } = require("../utils/activity");

const populateOpts = [{ path: "subject" }, { path: "branch" }, { path: "faculty", populate: { path: "user", select: "name" } }];

// @desc  Timetable for a branch/year/semester/section (admin/hod building it).
const getTimetable = asyncHandler(async (req, res) => {
  const { branch, year, semester, section } = req.query;
  if (branch) await assertHodOwnsBranch(req, branch);
  const filter = {};
  if (branch) filter.branch = branch;
  if (year) filter.year = Number(year);
  if (semester) filter.semester = Number(semester);
  if (section) filter.section = section;
  const slots = await TimetableSlot.find(filter).populate(populateOpts).sort({ day: 1, periodNumber: 1 });
  res.json({ success: true, message: "Timetable fetched", data: slots });
});

// @desc  My timetable - auto-resolved from the logged in student/faculty profile.
const getMyTimetable = asyncHandler(async (req, res) => {
  let filter = {};
  if (req.user.role === "student") {
    const student = await Student.findOne({ user: req.user._id });
    if (!student) return res.json({ success: true, message: "Timetable fetched", data: [] });
    filter = { branch: student.branch, year: student.year, semester: student.semester, section: student.section };
  } else if (req.user.role === "faculty") {
    const faculty = await Faculty.findOne({ user: req.user._id });
    if (!faculty) return res.json({ success: true, message: "Timetable fetched", data: [] });
    filter = { faculty: faculty._id };
  }
  const slots = await TimetableSlot.find(filter).populate(populateOpts).sort({ day: 1, periodNumber: 1 });
  res.json({ success: true, message: "Timetable fetched", data: slots });
});

const upsertSlot = asyncHandler(async (req, res) => {
  const { branch, year, semester, section, day, periodNumber, startTime, endTime, subject, faculty, room } = req.body;
  if (!branch || !year || !semester || !day || !periodNumber || !startTime || !endTime || !subject || !faculty) {
    res.status(400);
    throw new Error("Missing required timetable fields");
  }
  await assertHodOwnsBranch(req, branch);

  const key = { branch, year, semester, section: section || "A", day, periodNumber };
  const slot = await TimetableSlot.findOneAndUpdate(
    key,
    { ...key, startTime, endTime, subject, faculty, room },
    { new: true, upsert: true, runValidators: true }
  ).populate(populateOpts);
  await logActivity(req, { action: `Set timetable slot for ${day} period ${periodNumber}`, module: "timetable" });
  res.status(201).json({ success: true, message: "Timetable slot saved", data: slot });
});

const deleteSlot = asyncHandler(async (req, res) => {
  const slot = await TimetableSlot.findById(req.params.id);
  if (!slot) { res.status(404); throw new Error("Slot not found"); }
  await assertHodOwnsBranch(req, slot.branch);
  await slot.deleteOne();
  res.json({ success: true, message: "Slot removed", data: {} });
});

module.exports = { getTimetable, getMyTimetable, upsertSlot, deleteSlot };
