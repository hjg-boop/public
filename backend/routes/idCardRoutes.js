const express = require("express");
const router = express.Router();
const { getMyIdCard, verifyId, getMyIdCardPdf } = require("../controllers/idCardController");
const { protect } = require("../middleware/authMiddleware");

router.get("/verify/:kind/:id/:code", verifyId); // public
router.get("/mine", protect, getMyIdCard);
router.get("/mine/pdf", protect, getMyIdCardPdf);

module.exports = router;
