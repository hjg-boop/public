const asyncHandler = require("express-async-handler");
const Hostel = require("../models/Hostel");
const HostelComplaint = require("../models/HostelComplaint");
const Student = require("../models/Student");

const getHostels = asyncHandler(async (req, res) => {
  const hostels = await Hostel.find({}).populate("rooms.occupants", "rollNumber");
  res.json({ success: true, message: "Hostels fetched", data: hostels });
});

const createHostel = asyncHandler(async (req, res) => {
  const hostel = await Hostel.create({ name: req.body.name, type: req.body.type, warden: req.body.warden, wardenPhone: req.body.wardenPhone, rooms: [] });
  res.status(201).json({ success: true, message: "Hostel added", data: hostel });
});

const addRoom = asyncHandler(async (req, res) => {
  const hostel = await Hostel.findById(req.params.id);
  if (!hostel) { res.status(404); throw new Error("Hostel not found"); }
  hostel.rooms.push({ roomNumber: req.body.roomNumber, capacity: req.body.capacity || 2, occupants: [] });
  await hostel.save();
  res.status(201).json({ success: true, message: "Room added", data: hostel });
});

const allocateRoom = asyncHandler(async (req, res) => {
  const hostel = await Hostel.findById(req.params.id);
  if (!hostel) { res.status(404); throw new Error("Hostel not found"); }
  const room = hostel.rooms.id(req.params.roomId);
  if (!room) { res.status(404); throw new Error("Room not found"); }
  if (room.occupants.length >= room.capacity) { res.status(400); throw new Error("Room is at full capacity"); }
  if (room.occupants.some((o) => String(o) === req.body.studentId)) { res.status(400); throw new Error("Student already allocated to this room"); }
  room.occupants.push(req.body.studentId);
  await hostel.save();
  res.json({ success: true, message: "Student allocated", data: hostel });
});

const getMyHostel = asyncHandler(async (req, res) => {
  const student = await Student.findOne({ user: req.user._id });
  if (!student) return res.json({ success: true, message: "Hostel fetched", data: null });
  const hostel = await Hostel.findOne({ "rooms.occupants": student._id });
  if (!hostel) return res.json({ success: true, message: "Hostel fetched", data: null });
  const room = hostel.rooms.find((r) => r.occupants.some((o) => String(o) === String(student._id)));
  res.json({ success: true, message: "Hostel fetched", data: { hostel: { _id: hostel._id, name: hostel.name, type: hostel.type, warden: hostel.warden, wardenPhone: hostel.wardenPhone }, room: { roomNumber: room.roomNumber, _id: room._id } } });
});

const getComplaints = asyncHandler(async (req, res) => {
  const complaints = await HostelComplaint.find({}).populate({ path: "student", populate: { path: "user", select: "name" } }).populate("hostel", "name").sort({ createdAt: -1 });
  res.json({ success: true, message: "Complaints fetched", data: complaints });
});

const getMyComplaints = asyncHandler(async (req, res) => {
  const student = await Student.findOne({ user: req.user._id });
  if (!student) return res.json({ success: true, message: "Complaints fetched", data: [] });
  const complaints = await HostelComplaint.find({ student: student._id }).sort({ createdAt: -1 });
  res.json({ success: true, message: "Complaints fetched", data: complaints });
});

const createComplaint = asyncHandler(async (req, res) => {
  const student = await Student.findOne({ user: req.user._id });
  if (!student) { res.status(400); throw new Error("Student profile not found"); }
  const hostel = await Hostel.findOne({ "rooms.occupants": student._id });
  if (!hostel) { res.status(400); throw new Error("You are not currently allocated to a hostel"); }
  const complaint = await HostelComplaint.create({ student: student._id, hostel: hostel._id, subject: req.body.subject, description: req.body.description });
  res.status(201).json({ success: true, message: "Complaint submitted", data: complaint });
});

const updateComplaintStatus = asyncHandler(async (req, res) => {
  const complaint = await HostelComplaint.findById(req.params.id);
  if (!complaint) { res.status(404); throw new Error("Complaint not found"); }
  complaint.status = req.body.status;
  await complaint.save();
  res.json({ success: true, message: "Complaint updated", data: complaint });
});

module.exports = { getHostels, createHostel, addRoom, allocateRoom, getMyHostel, getComplaints, getMyComplaints, createComplaint, updateComplaintStatus };
