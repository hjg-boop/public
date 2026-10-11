const express = require("express");
const router = express.Router();
const { login, getMe, changePassword, forgotPassword, resetPassword, uploadMyPhoto } = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");
const { createLimiter } = require("../middleware/rateLimit");
const { singleImageUpload } = require("../middleware/uploadMiddleware");

// Counts only FAILED attempts, so a legitimate user retyping a password
// doesn't get locked out by their own successful login.
const loginLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  keyFn: (req) => `${req.ip}:${(req.body?.identifier || "").toLowerCase()}`,
  countFailuresOnly: true,
  message: "Too many failed login attempts. Please try again in 15 minutes.",
});
const forgotLimiter = createLimiter({ windowMs: 15 * 60 * 1000, max: 5 });

router.post("/login", loginLimiter, login);
router.post("/forgot-password", forgotLimiter, forgotPassword);
router.post("/reset-password/:token", resetPassword);
router.get("/me", protect, getMe);
router.put("/change-password", protect, changePassword);
router.post("/photo", protect, singleImageUpload("photo"), uploadMyPhoto);

module.exports = router;
