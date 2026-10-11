const express = require("express");
const router = express.Router();
const { getAdminStats, getHodStats, getAccountantStats } = require("../controllers/dashboardController");
const { protect, authorize } = require("../middleware/authMiddleware");

router.get("/admin-stats", protect, authorize("admin"), getAdminStats);
router.get("/hod-stats", protect, authorize("hod"), getHodStats);
router.get("/accountant-stats", protect, authorize("accountant"), getAccountantStats);

module.exports = router;
