const express = require("express");
const router = express.Router();
const { getTimetable, getMyTimetable, upsertSlot, deleteSlot } = require("../controllers/timetableController");
const { protect, authorize } = require("../middleware/authMiddleware");

router.use(protect);
router.get("/mine", getMyTimetable);
router.get("/", authorize("admin", "hod"), getTimetable);
router.post("/", authorize("admin", "hod"), upsertSlot);
router.delete("/:id", authorize("admin", "hod"), deleteSlot);

module.exports = router;
