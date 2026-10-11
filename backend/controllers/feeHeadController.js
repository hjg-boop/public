const asyncHandler = require("express-async-handler");
const FeeHead = require("../models/FeeHead");
const { logActivity } = require("../utils/activity");
const { getCurrentAcademicYear } = require("../utils/feeService");

// @desc  Admin's fee structure configuration: the fee heads + default amounts
//        for an academic year (Tuition, Exam, Library, Hostel, Transport...).
const getFeeHeads = asyncHandler(async (req, res) => {
  const { academicYear } = req.query;
  const filter = {};
  if (academicYear) filter.academicYear = academicYear;
  const heads = await FeeHead.find(filter).sort({ academicYear: -1, name: 1 });
  res.json({ success: true, message: "Fee heads fetched", data: heads });
});

const createFeeHead = asyncHandler(async (req, res) => {
  const { name, academicYear, defaultAmount, category } = req.body;
  if (!name || !academicYear || defaultAmount === undefined) {
    res.status(400);
    throw new Error("name, academicYear and defaultAmount are required");
  }
  if (category && !["college", "hostel", "transport", "other"].includes(category)) {
    res.status(400);
    throw new Error("category must be college, hostel, transport or other");
  }
  const head = await FeeHead.create({ name, academicYear, defaultAmount, category: category || "other" });
  await logActivity(req, { action: `Added fee head "${name}" for ${academicYear}`, module: "fee-structure" });
  res.status(201).json({ success: true, message: "Fee head created", data: head });
});

const updateFeeHead = asyncHandler(async (req, res) => {
  const head = await FeeHead.findById(req.params.id);
  if (!head) { res.status(404); throw new Error("Fee head not found"); }
  const { defaultAmount } = req.body;
  if (defaultAmount !== undefined) head.defaultAmount = defaultAmount;
  await head.save();
  res.json({ success: true, message: "Fee head updated", data: head });
});

// @desc  Public fee structure for the current academic year (Fee Details page).
// @route GET /api/fee-heads/public
const getPublicFeeStructure = asyncHandler(async (req, res) => {
  const academicYear = await getCurrentAcademicYear();
  const heads = await FeeHead.find({ academicYear }).select("name category defaultAmount").sort({ category: 1, name: 1 });
  res.json({ success: true, message: "Fee structure fetched", data: { academicYear, heads } });
});

const deleteFeeHead = asyncHandler(async (req, res) => {
  const head = await FeeHead.findById(req.params.id);
  if (!head) { res.status(404); throw new Error("Fee head not found"); }
  await head.deleteOne();
  res.json({ success: true, message: "Fee head deleted", data: {} });
});

module.exports = { getFeeHeads, getPublicFeeStructure, createFeeHead, updateFeeHead, deleteFeeHead };
