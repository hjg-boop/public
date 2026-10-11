const express = require("express");
const router = express.Router();
const { getSettings, updateSettings, uploadLogo } = require("../controllers/collegeSettingsController");
const { protect, authorize } = require("../middleware/authMiddleware");
const { singleImageUpload } = require("../middleware/uploadMiddleware");

router.get("/", protect, getSettings); // read is harmless for any authenticated role (college name/logo)
router.put("/", protect, authorize("admin"), updateSettings);
router.post("/logo", protect, authorize("admin"), singleImageUpload("logo"), uploadLogo);

module.exports = router;
