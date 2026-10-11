const express = require("express");
const router = express.Router();
const { getAssignments, createAssignment, deleteAssignment, getMyAssignments } = require("../controllers/facultyAssignmentController");
const { protect, authorize } = require("../middleware/authMiddleware");

router.use(protect);
router.get("/mine", authorize("faculty"), getMyAssignments);
router.get("/", authorize("admin", "hod"), getAssignments);
router.post("/", authorize("admin", "hod"), createAssignment);
router.delete("/:id", authorize("admin", "hod"), deleteAssignment);

module.exports = router;
