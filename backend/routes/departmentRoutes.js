const express = require("express");
const router = express.Router();
const {
  getDepartments,
  getPublicDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
} = require("../controllers/departmentController");
const { protect, authorize } = require("../middleware/authMiddleware");

// Public — used on a college's marketing homepage, before login.
router.get("/public", getPublicDepartments);

// Everything else requires a logged-in user and is scoped to their college.
router.get("/", protect, getDepartments);
router.post("/", protect, authorize("admin"), createDepartment);
router.put("/:id", protect, authorize("admin"), updateDepartment);
router.delete("/:id", protect, authorize("admin"), deleteDepartment);

module.exports = router;
