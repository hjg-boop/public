const express = require("express");
const router = express.Router();
const { getCurrentClass, getRoster, markAttendance, getStudentAttendance, getDepartmentOverview } = require("../controllers/attendanceController");
const { protect, authorize } = require("../middleware/authMiddleware");

router.use(protect);
router.get("/current-class", authorize("faculty"), getCurrentClass);
router.get("/roster", authorize("faculty"), getRoster);
router.post("/mark", authorize("faculty"), markAttendance);
router.get("/department-overview", authorize("admin", "hod"), getDepartmentOverview);
router.get("/student/:studentId", authorize("admin", "hod", "faculty"), getStudentAttendance);
router.get("/mine", authorize("student"), getStudentAttendance);

module.exports = router;
