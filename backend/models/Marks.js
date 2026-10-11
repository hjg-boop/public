const mongoose = require("mongoose");

// One record per (student, subject) per semester, holding every component.
// "total" and "grade" are computed on save so the UI never has to duplicate
// the formula.
const GRADE_BANDS = [
  { min: 90, grade: "O", points: 10 },
  { min: 80, grade: "A+", points: 9 },
  { min: 70, grade: "A", points: 8 },
  { min: 60, grade: "B+", points: 7 },
  { min: 50, grade: "B", points: 6 },
  { min: 40, grade: "C", points: 5 },
  { min: 0, grade: "F", points: 0 },
];

const marksSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true },
    subject: { type: mongoose.Schema.Types.ObjectId, ref: "Subject", required: true },
    semester: { type: Number, required: true },
    internal: { type: Number, default: 0, min: 0 },
    assignment: { type: Number, default: 0, min: 0 },
    lab: { type: Number, default: 0, min: 0 },
    examMarks: { type: Number, default: 0, min: 0 },
    maxMarks: { type: Number, default: 100 },
    total: { type: Number, default: 0 },
    grade: { type: String },
    gradePoints: { type: Number },
    enteredBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

marksSchema.index({ student: 1, subject: 1, semester: 1 }, { unique: true });

marksSchema.pre("save", function (next) {
  this.total = (this.internal || 0) + (this.assignment || 0) + (this.lab || 0) + (this.examMarks || 0);
  const pct = this.maxMarks ? (this.total / this.maxMarks) * 100 : 0;
  const band = GRADE_BANDS.find((b) => pct >= b.min) || GRADE_BANDS[GRADE_BANDS.length - 1];
  this.grade = band.grade;
  this.gradePoints = band.points;
  next();
});

module.exports = mongoose.model("Marks", marksSchema);
