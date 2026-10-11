const asyncHandler = require("express-async-handler");
const Bus = require("../models/Bus");
const TransportAllocation = require("../models/TransportAllocation");
const Student = require("../models/Student");

const getBuses = asyncHandler(async (req, res) => {
  const buses = await Bus.find({}).sort({ busNumber: 1 });
  res.json({ success: true, message: "Buses fetched", data: buses });
});

const createBus = asyncHandler(async (req, res) => {
  const bus = await Bus.create(req.body);
  res.status(201).json({ success: true, message: "Bus added", data: bus });
});

const updateBus = asyncHandler(async (req, res) => {
  const bus = await Bus.findById(req.params.id);
  if (!bus) { res.status(404); throw new Error("Bus not found"); }
  Object.assign(bus, req.body);
  await bus.save();
  res.json({ success: true, message: "Bus updated", data: bus });
});

const deleteBus = asyncHandler(async (req, res) => {
  const bus = await Bus.findById(req.params.id);
  if (!bus) { res.status(404); throw new Error("Bus not found"); }
  await TransportAllocation.deleteMany({ bus: bus._id });
  await bus.deleteOne();
  res.json({ success: true, message: "Bus removed", data: {} });
});

const allocateStudent = asyncHandler(async (req, res) => {
  const { student, bus, stop } = req.body;
  if (!student || !bus) { res.status(400); throw new Error("student and bus are required"); }
  const allocation = await TransportAllocation.findOneAndUpdate({ student }, { student, bus, stop }, { new: true, upsert: true });
  res.status(201).json({ success: true, message: "Student allocated", data: allocation });
});

const getMyAllocation = asyncHandler(async (req, res) => {
  const student = await Student.findOne({ user: req.user._id });
  if (!student) return res.json({ success: true, message: "Allocation fetched", data: null });
  const allocation = await TransportAllocation.findOne({ student: student._id }).populate("bus");
  res.json({ success: true, message: "Allocation fetched", data: allocation });
});

module.exports = { getBuses, createBus, updateBus, deleteBus, allocateStudent, getMyAllocation };
