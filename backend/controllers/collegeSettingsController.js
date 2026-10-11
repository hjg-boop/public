const asyncHandler = require("express-async-handler");
const CollegeSettings = require("../models/CollegeSettings");
const { storeFile } = require("../services/fileStorage");
const { logActivity } = require("../utils/activity");

const getOrCreate = async () => {
  let settings = await CollegeSettings.findOne({ singleton: "main" });
  if (!settings) settings = await CollegeSettings.create({ singleton: "main" });
  return settings;
};

const getSettings = asyncHandler(async (req, res) => {
  const settings = await getOrCreate();
  res.json({ success: true, message: "Settings fetched", data: settings });
});

const updateSettings = asyncHandler(async (req, res) => {
  const settings = await getOrCreate();
  const { collegeName, address, email, phone, currentAcademicYear, lowAttendanceThreshold } = req.body;
  if (collegeName !== undefined) settings.collegeName = collegeName;
  if (address !== undefined) settings.address = address;
  if (email !== undefined) settings.email = email;
  if (phone !== undefined) settings.phone = phone;
  if (currentAcademicYear !== undefined) settings.currentAcademicYear = currentAcademicYear;
  if (lowAttendanceThreshold !== undefined) settings.lowAttendanceThreshold = lowAttendanceThreshold;
  await settings.save();
  await logActivity(req, { action: "Updated college settings", module: "settings" });
  res.json({ success: true, message: "Settings updated", data: settings });
});

const uploadLogo = asyncHandler(async (req, res) => {
  if (!req.file) { res.status(400); throw new Error("A logo image is required"); }
  const settings = await getOrCreate();
  const stored = await storeFile(req, { buffer: req.file.buffer, originalName: req.file.originalname, mimeType: req.file.mimetype, folder: "college-logo" });
  settings.logo = { url: stored.url, publicId: stored.publicId };
  await settings.save();
  res.json({ success: true, message: "Logo updated", data: settings.logo });
});

module.exports = { getSettings, updateSettings, uploadLogo };
