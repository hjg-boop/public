const express = require("express");
const router = express.Router();
const { getCertificates, getMyCertificates, createCertificate, verifyCertificate } = require("../controllers/certificateController");
const { protect, authorize } = require("../middleware/authMiddleware");

router.get("/verify/:code", verifyCertificate); // public
router.use(protect);
router.get("/mine", authorize("student"), getMyCertificates);
router.get("/", authorize("admin"), getCertificates);
router.post("/", authorize("admin"), createCertificate);

module.exports = router;
