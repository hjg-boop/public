const mongoose = require("mongoose");

const examSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true }, // e.g. "Mid 1", "Semester End"
    examType: { type: String, enum: ["Mid 1", "Mid 2", "Internal", "Semester", "Practical"], required: true },
    subject: { type: mongoose.Schema.Types.ObjectId, ref: "Subject", required: true },
    branch: { type: mongoose.Schema.Types.ObjectId, ref: "Branch", required: true },
    year: { type: Number, required: true },
    semester: { type: Number, required: true },
    date: { type: Date, required: true },
    time: { type: String, trim: true },
    room: { type: String, trim: true },
    durationMinutes: { type: Number, default: 180 },
    maxMarks: { type: Number, default: 100 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

examSchema.index({ branch: 1, year: 1, semester: 1, date: 1 });
module.exports = mongoose.model("Exam", examSchema);
