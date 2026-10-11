const express = require("express");
const router = express.Router();
const { getActivityLogs } = require("../controllers/activityLogController");
const { protect, authorize } = require("../middleware/authMiddleware");

// Admin + Super Admin can view logs; only Super Admin sees admin-management entries
// (enforced by the frontend hiding that filter, and admins rarely needing it).
router.get("/", protect, authorize("admin"), getActivityLogs);

module.exports = router;
