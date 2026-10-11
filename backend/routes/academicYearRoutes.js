const express = require("express");
const router = express.Router();
const { getAcademicYears, createAcademicYear, setCurrent, deleteAcademicYear } = require("../controllers/academicYearController");
const { protect, authorize } = require("../middleware/authMiddleware");

router.get("/", protect, getAcademicYears);
router.post("/", protect, authorize("admin"), createAcademicYear);
router.put("/:id/set-current", protect, authorize("admin"), setCurrent);
router.delete("/:id", protect, authorize("admin"), deleteAcademicYear);

module.exports = router;
