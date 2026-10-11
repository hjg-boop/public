const express = require("express");
const router = express.Router();
const {
  getStudents,
  getStudentById,
  getMyStudentProfile,
  createStudent,
  updateStudent,
  resetStudentPassword,
  deleteStudent,
  bulkImportStudents,
} = require("../controllers/studentController");
const { protect, authorize } = require("../middleware/authMiddleware");
const { singleSpreadsheetUpload } = require("../middleware/uploadMiddleware");

router.use(protect);

router.get("/me", authorize("student"), getMyStudentProfile);
router.get("/", authorize("admin", "hod", "faculty", "accountant"), getStudents);
router.post("/", authorize("admin"), createStudent);
router.post("/bulk-import", authorize("admin"), singleSpreadsheetUpload("file"), bulkImportStudents);
router.get("/:id", authorize("admin", "hod", "faculty", "accountant", "student"), getStudentById);
router.put("/:id", authorize("admin", "student"), updateStudent);
router.put("/:id/reset-password", authorize("admin"), resetStudentPassword);
router.delete("/:id", authorize("admin"), deleteStudent);

module.exports = router;
