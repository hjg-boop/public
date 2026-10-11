const express = require("express");
const router = express.Router();
const { getSections, createSection, deleteSection } = require("../controllers/sectionController");
const { protect, authorize } = require("../middleware/authMiddleware");

router.use(protect);
router.get("/", getSections); // any authenticated role may read (needed for dropdowns)
router.post("/", authorize("admin", "hod"), createSection);
router.delete("/:id", authorize("admin", "hod"), deleteSection);

module.exports = router;
