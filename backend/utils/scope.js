const Branch = require("../models/Branch");
const Faculty = require("../models/Faculty");
const FacultyAssignment = require("../models/FacultyAssignment");

/**
 * Department/branch/assignment scoping helpers. These are the actual
 * authorization boundary - routes gate by ROLE (authorize("admin","hod")),
 * these functions gate by DATA (which department/branch/class that role is
 * allowed to touch). Every controller that serves HOD or Faculty data must
 * use one of these rather than trusting a department/branch id from the
 * query string or body.
 */

// Every branch id belonging to a department. HOD-scoped queries filter by
// `branch: { $in: branchIds }` since most records (Student, Attendance,
// Timetable, Exam...) key off branch, not department directly.
const branchIdsForDepartment = async (departmentId) => {
  const branches = await Branch.find({ department: departmentId }).select("_id");
  return branches.map((b) => b._id);
};

// Throws (via Express error handling) if the given branchId does not belong
// to the HOD's own department. Call this whenever a HOD-facing endpoint
// receives a branch id from the client.
const assertHodOwnsBranch = async (req, branchId) => {
  if (req.user.role !== "hod") return; // only applies to HOD
  if (!req.user.department) {
    const err = new Error("Your account has no department assigned. Contact the admin.");
    err.statusCode = 403;
    throw err;
  }
  const branch = await Branch.findById(branchId);
  if (!branch || String(branch.department) !== String(req.user.department)) {
    const err = new Error("You can only access your own department's data");
    err.statusCode = 403;
    throw err;
  }
};

// The Faculty profile document for the logged-in faculty user, or null.
const getMyFacultyProfile = async (req) => {
  if (req.user.role !== "faculty") return null;
  return Faculty.findOne({ user: req.user._id });
};

// True if this faculty member is actually assigned to teach the given
// subject for this exact branch/year/semester/section. This is the
// ownership check behind "Faculty requests another faculty's class -> DENY".
const facultyOwnsClass = async (facultyId, { subject, branch, year, semester, section }) => {
  const assignment = await FacultyAssignment.findOne({ faculty: facultyId, subject, branch, year: Number(year), semester: Number(semester), section });
  return !!assignment;
};

// Every (branch, year, semester, section, subject) combination this faculty
// member actually teaches - used to build "my classes" / "my students" views
// without trusting any class identifiers the client might send.
const getMyAssignments = async (facultyId) => FacultyAssignment.find({ faculty: facultyId }).populate("subject branch department");

module.exports = { branchIdsForDepartment, assertHodOwnsBranch, getMyFacultyProfile, facultyOwnsClass, getMyAssignments };
