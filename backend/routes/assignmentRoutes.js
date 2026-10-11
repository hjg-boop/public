const express = require("express");
const router = express.Router();
const {
  getAssignments, getMyAssignments, createAssignment, deleteAssignment,
  submitAssignment, getSubmissions, gradeSubmission,
} = require("../controllers/assignmentController");
const { protect, authorize } = require("../middleware/authMiddleware");
const { singleFileUpload } = require("../middleware/uploadMiddleware");

router.use(protect);

router.get("/mine", authorize("student"), getMyAssignments);
router.post("/:id/submit", authorize("student"), singleFileUpload("file"), submitAssignment);
router.get("/:id/submissions", authorize("faculty", "admin"), getSubmissions);
router.put("/submissions/:id", authorize("faculty", "admin"), gradeSubmission);

router.get("/", getAssignments);
router.post("/", authorize("faculty", "admin"), singleFileUpload("file"), createAssignment);
router.delete("/:id", authorize("faculty", "admin"), deleteAssignment);

module.exports = router;
