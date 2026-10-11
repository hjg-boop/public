const mongoose = require("mongoose");

// Singleton: college-wide identity + a couple of operational settings
// (Admin's "Settings" page). Certificates and ID cards read collegeName/
// address/logo from here (falling back to the COLLEGE_NAME/COLLEGE_ADDRESS
// env vars if this hasn't been configured yet).
const collegeSettingsSchema = new mongoose.Schema(
  {
    singleton: { type: String, default: "main", unique: true },
    collegeName: { type: String, trim: true },
    address: { type: String, trim: true },
    email: { type: String, trim: true },
    phone: { type: String, trim: true },
    logo: { url: String, publicId: String },
    currentAcademicYear: { type: String, trim: true }, // "2026-27"
    lowAttendanceThreshold: { type: Number, default: 75, min: 0, max: 100 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("CollegeSettings", collegeSettingsSchema);
