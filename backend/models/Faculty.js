const mongoose = require("mongoose");

const facultySchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    employeeId: { type: String, required: true, trim: true, unique: true },
    department: { type: mongoose.Schema.Types.ObjectId, ref: "Department", required: true },
    designation: { type: String, trim: true, default: "Assistant Professor" },
    qualification: { type: String, trim: true },
    experienceYears: { type: Number, min: 0 },
    bio: { type: String, trim: true },
  },
  { timestamps: true }
);

facultySchema.index({ department: 1 });

module.exports = mongoose.model("Faculty", facultySchema);
