const express = require("express");
const router = express.Router();
const {
  getHods, createHod, updateHod, setHodStatus, deleteHod,
  getAccountants, createAccountant, updateAccountant, setAccountantStatus, deleteAccountant,
} = require("../controllers/staffAccountController");
const { protect, authorize } = require("../middleware/authMiddleware");

router.use(protect, authorize("admin"));

router.get("/hods", getHods);
router.post("/hods", createHod);
router.put("/hods/:id", updateHod);
router.put("/hods/:id/status", setHodStatus);
router.delete("/hods/:id", deleteHod);

router.get("/accountants", getAccountants);
router.post("/accountants", createAccountant);
router.put("/accountants/:id", updateAccountant);
router.put("/accountants/:id/status", setAccountantStatus);
router.delete("/accountants/:id", deleteAccountant);

module.exports = router;
