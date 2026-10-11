const asyncHandler = require("express-async-handler");
const Student = require("../models/Student");
const Faculty = require("../models/Faculty");
const Subject = require("../models/Subject");
const Department = require("../models/Department");
const Branch = require("../models/Branch");
const Section = require("../models/Section");
const User = require("../models/User");
const Payment = require("../models/Payment");
const StudentFeeAccount = require("../models/StudentFeeAccount");
const { getCurrentAcademicYear } = require("../utils/feeService");
const { branchIdsForDepartment } = require("../utils/scope");

// @desc  Admin dashboard - deliberately simple: just the high-level counts
//        the spec asks for, nothing operational (no "today's classes" etc,
//        that belongs on the role dashboards that actually do that work).
// @route GET /api/dashboard/admin-stats
// @access Admin
const getAdminStats = asyncHandler(async (req, res) => {
  const [totalStudents, totalFaculty, totalDepartments, totalBranches, totalActiveSubjects, totalHods, totalSections] = await Promise.all([
    Student.countDocuments({}),
    Faculty.countDocuments({}),
    Department.countDocuments({}),
    Branch.countDocuments({}),
    Subject.countDocuments({}),
    User.countDocuments({ role: "hod" }),
    Section.countDocuments({}),
  ]);

  // Year-level financial metrics (Admin only - the accountant dashboard
  // deliberately has no equivalent).
  const { buildAdminFeeSummary } = require("./feeController");
  const academicYear = await getCurrentAcademicYear();
  const fees = await buildAdminFeeSummary(academicYear);

  res.json({
    success: true,
    message: "Stats fetched",
    data: {
      totalStudents, totalFaculty, totalDepartments, totalBranches, totalActiveSubjects, totalHods, totalSections,
      fees: {
        academicYear,
        totalCollected: fees.totalCollected,
        totalPending: fees.totalPending,
        totalExpected: fees.totalExpected,
      },
    },
  });
});

// @desc  HOD dashboard - their department only.
// @route GET /api/dashboard/hod-stats
// @access HOD
const getHodStats = asyncHandler(async (req, res) => {
  if (!req.user.department) { res.status(403); throw new Error("Your account has no department assigned"); }
  const branchIds = await branchIdsForDepartment(req.user.department);

  const [totalStudents, totalFaculty, totalSubjects, totalSections] = await Promise.all([
    Student.countDocuments({ branch: { $in: branchIds } }),
    Faculty.countDocuments({ department: req.user.department }),
    Subject.countDocuments({ department: req.user.department }),
    Section.countDocuments({ branch: { $in: branchIds } }),
  ]);

  res.json({ success: true, message: "Stats fetched", data: { totalStudents, totalFaculty, totalSubjects, totalSections } });
});

// @desc  Accountant dashboard - activity counts only. No collected/pending
//        money totals: those are Admin-only analytics.
// @route GET /api/dashboard/accountant-stats
// @access Accountant
const getAccountantStats = asyncHandler(async (req, res) => {
  const todayStart = new Date(new Date().setHours(0, 0, 0, 0));
  const todayEnd = new Date(new Date().setHours(23, 59, 59, 999));
  const academicYear = await getCurrentAcademicYear();

  const [receiptsToday, totalStudents, hostelStudents, transportStudents] = await Promise.all([
    Payment.countDocuments({ paymentDate: { $gte: todayStart, $lte: todayEnd } }),
    Student.countDocuments({}),
    StudentFeeAccount.countDocuments({ academicYear, hostelOpted: true }),
    StudentFeeAccount.countDocuments({ academicYear, transportOpted: true }),
  ]);

  res.json({
    success: true,
    message: "Stats fetched",
    data: { academicYear, receiptsToday, totalStudents, hostelStudents, transportStudents },
  });
});

module.exports = { getAdminStats, getHodStats, getAccountantStats };
