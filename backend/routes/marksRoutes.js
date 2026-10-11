const express = require("express");
const router = express.Router();
const { getMarksSheet, upsertMarks, getStudentResult, getDepartmentResults } = require("../controllers/marksController");
const { protect, authorize } = require("../middleware/authMiddleware");

router.use(protect);
router.get("/sheet", authorize("faculty"), getMarksSheet);
router.post("/", authorize("faculty"), upsertMarks);
router.get("/result/mine", authorize("student"), getStudentResult);
router.get("/result/:studentId", authorize("admin", "hod", "faculty"), getStudentResult);
router.get("/department-summary", authorize("admin", "hod"), getDepartmentResults);

module.exports = router;
