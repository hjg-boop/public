const express = require("express");
const router = express.Router();
const {
  getBranches,
  getPublicBranches,
  createBranch,
  updateBranch,
  deleteBranch,
} = require("../controllers/departmentController");
const { protect, authorize } = require("../middleware/authMiddleware");

// Public — used on a college's marketing homepage, before login.
router.get("/public", getPublicBranches);

router.get("/", protect, getBranches);
router.post("/", protect, authorize("admin"), createBranch);
router.put("/:id", protect, authorize("admin"), updateBranch);
router.delete("/:id", protect, authorize("admin"), deleteBranch);

module.exports = router;
