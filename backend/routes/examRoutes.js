const express = require("express");
const router = express.Router();
const { getExams, getMyExams, createExam, updateExam, deleteExam } = require("../controllers/examController");
const { protect, authorize } = require("../middleware/authMiddleware");

router.use(protect);
router.get("/mine", authorize("student"), getMyExams);
router.get("/", authorize("admin", "hod", "faculty"), getExams);
router.post("/", authorize("admin", "hod"), createExam);
router.put("/:id", authorize("admin", "hod"), updateExam);
router.delete("/:id", authorize("admin", "hod"), deleteExam);

module.exports = router;
