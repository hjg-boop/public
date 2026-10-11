const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    rollNumber: { type: String, required: true, trim: true, uppercase: true, unique: true },
    branch: { type: mongoose.Schema.Types.ObjectId, ref: "Branch", required: true },
    year: { type: Number, required: true, min: 1, max: 5 },
    semester: { type: Number, required: true, min: 1, max: 10 },
    section: { type: String, trim: true, default: "A" },
    admissionYear: { type: Number },
    studentStatus: {
      type: String,
      enum: ["active", "alumni", "detained", "discontinued"],
      default: "active",
    },
  },
  { timestamps: true }
);

studentSchema.index({ branch: 1, semester: 1, section: 1 });

module.exports = mongoose.model("Student", studentSchema);
