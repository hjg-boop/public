const express = require("express");
const router = express.Router();
const {
  getFaculty,
  getFacultyById,
  getMyFacultyProfile,
  createFaculty,
  updateFaculty,
  deleteFaculty,
  assignSubject,
} = require("../controllers/facultyController");
const { protect, authorize } = require("../middleware/authMiddleware");

router.use(protect);

router.get("/me", authorize("faculty"), getMyFacultyProfile);
router.get("/", authorize("admin", "hod", "student", "faculty"), getFaculty);
router.post("/", authorize("admin"), createFaculty);
router.get("/:id", authorize("admin", "hod", "faculty", "student"), getFacultyById);
router.put("/:id", authorize("admin", "faculty"), updateFaculty);
router.delete("/:id", authorize("admin"), deleteFaculty);
router.put("/:id/assign-subject", authorize("admin"), assignSubject);

module.exports = router;
