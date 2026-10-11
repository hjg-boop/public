const mongoose = require("mongoose");

// Admin's "Academic Management": the list of academic years the college has
// configured, and which one is current. Fee accounts, payments and reports
// reference this by label (e.g. "2026-27").
const academicYearSchema = new mongoose.Schema(
  {
    label: { type: String, required: true, unique: true, trim: true }, // "2026-27"
    startDate: { type: Date },
    endDate: { type: Date },
    isCurrent: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("AcademicYear", academicYearSchema);
