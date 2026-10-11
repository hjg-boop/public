const express = require("express");
const router = express.Router();
const {
  getNotices,
  getNoticeById,
  createNotice,
  updateNotice,
  deleteNotice,
  getPublicNotices,
} = require("../controllers/noticeController");
const { protect, authorize } = require("../middleware/authMiddleware");

// Public, unauthenticated - must be declared before router.use(protect)
router.get("/public", getPublicNotices);

router.use(protect);

router.get("/", getNotices);
router.post("/", authorize("faculty", "admin"), createNotice);
router.get("/:id", getNoticeById);
router.put("/:id", authorize("faculty", "admin"), updateNotice);
router.delete("/:id", authorize("faculty", "admin"), deleteNotice);

module.exports = router;
