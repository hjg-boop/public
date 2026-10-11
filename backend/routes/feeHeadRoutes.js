const express = require("express");
const router = express.Router();
const { getFeeHeads, getPublicFeeStructure, createFeeHead, updateFeeHead, deleteFeeHead } = require("../controllers/feeHeadController");
const { protect, authorize } = require("../middleware/authMiddleware");

router.get("/public", getPublicFeeStructure); // no login - powers the public Fee Details page

router.use(protect);
router.get("/", authorize("admin", "accountant"), getFeeHeads);
router.post("/", authorize("admin"), createFeeHead);
router.put("/:id", authorize("admin"), updateFeeHead);
router.delete("/:id", authorize("admin"), deleteFeeHead);

module.exports = router;
