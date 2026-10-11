const mongoose = require("mongoose");

// The actual "who teaches what, to whom" record. Admin or HOD assigns a
// faculty member to a subject for one branch/year/semester/section. This is
// the ownership record that attendance, marks and materials permissions are
// checked against - a faculty member can only act on classes they are
// assigned to here.
const facultyAssignmentSchema = new mongoose.Schema(
  {
    faculty: { type: mongoose.Schema.Types.ObjectId, ref: "Faculty", required: true },
    department: { type: mongoose.Schema.Types.ObjectId, ref: "Department", required: true },
    branch: { type: mongoose.Schema.Types.ObjectId, ref: "Branch", required: true },
    year: { type: Number, required: true },
    semester: { type: Number, required: true },
    section: { type: String, required: true, trim: true, uppercase: true },
    subject: { type: mongoose.Schema.Types.ObjectId, ref: "Subject", required: true },
    assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

facultyAssignmentSchema.index({ faculty: 1, subject: 1, branch: 1, year: 1, semester: 1, section: 1 }, { unique: true });
facultyAssignmentSchema.index({ branch: 1, year: 1, semester: 1, section: 1, subject: 1 });

module.exports = mongoose.model("FacultyAssignment", facultyAssignmentSchema);
