const express = require("express");
const router = express.Router();
const { getExams, getAvailableExams, createExam, deleteExam, submitExam, getExamAnalytics } = require("../controllers/onlineExamController");
const { protect, authorize } = require("../middleware/authMiddleware");

router.use(protect);
router.get("/available", authorize("student"), getAvailableExams);
router.post("/:id/submit", authorize("student"), submitExam);
router.get("/:id/analytics", authorize("faculty"), getExamAnalytics);
router.get("/", authorize("faculty"), getExams);
router.post("/", authorize("faculty"), createExam);
router.delete("/:id", authorize("faculty"), deleteExam);

module.exports = router;
