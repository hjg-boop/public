const asyncHandler = require("express-async-handler");
const AcademicYear = require("../models/AcademicYear");
const { logActivity } = require("../utils/activity");

const getAcademicYears = asyncHandler(async (req, res) => {
  const years = await AcademicYear.find({}).sort({ label: -1 });
  res.json({ success: true, message: "Academic years fetched", data: years });
});

const createAcademicYear = asyncHandler(async (req, res) => {
  const { label, startDate, endDate } = req.body;
  if (!label) { res.status(400); throw new Error("label is required"); }
  const year = await AcademicYear.create({ label, startDate, endDate });
  await logActivity(req, { action: `Added academic year "${label}"`, module: "academic-management" });
  res.status(201).json({ success: true, message: "Academic year created", data: year });
});

// @desc  Mark one academic year as current (and un-mark every other one).
const setCurrent = asyncHandler(async (req, res) => {
  await AcademicYear.updateMany({}, { isCurrent: false });
  const year = await AcademicYear.findByIdAndUpdate(req.params.id, { isCurrent: true }, { new: true });
  if (!year) { res.status(404); throw new Error("Academic year not found"); }
  await logActivity(req, { action: `Set "${year.label}" as the current academic year`, module: "academic-management" });
  res.json({ success: true, message: "Current academic year updated", data: year });
});

const deleteAcademicYear = asyncHandler(async (req, res) => {
  const year = await AcademicYear.findById(req.params.id);
  if (!year) { res.status(404); throw new Error("Academic year not found"); }
  await year.deleteOne();
  res.json({ success: true, message: "Academic year deleted", data: {} });
});

module.exports = { getAcademicYears, createAcademicYear, setCurrent, deleteAcademicYear };
