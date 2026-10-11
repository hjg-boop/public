const mongoose = require("mongoose");

// One document per (subject, date, period) - each holding the whole class's
// present/absent list, so marking a class is a single write instead of one
// document per student.
const attendanceSchema = new mongoose.Schema(
  {
    subject: { type: mongoose.Schema.Types.ObjectId, ref: "Subject", required: true },
    branch: { type: mongoose.Schema.Types.ObjectId, ref: "Branch", required: true },
    year: { type: Number, required: true },
    semester: { type: Number, required: true },
    section: { type: String, trim: true, default: "A" },
    date: { type: Date, required: true },
    periodNumber: { type: Number },
    markedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    records: [
      {
        student: { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true },
        status: { type: String, enum: ["present", "absent"], required: true },
      },
    ],
  },
  { timestamps: true }
);

attendanceSchema.index({ subject: 1, date: 1, periodNumber: 1 }, { unique: true });
attendanceSchema.index({ branch: 1, year: 1, semester: 1, section: 1, date: 1 });

module.exports = mongoose.model("Attendance", attendanceSchema);
