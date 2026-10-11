const express = require("express");
const router = express.Router();
const {
  getHostels, createHostel, addRoom, allocateRoom, getMyHostel,
  getComplaints, getMyComplaints, createComplaint, updateComplaintStatus,
} = require("../controllers/hostelController");
const { protect, authorize } = require("../middleware/authMiddleware");

router.use(protect);
router.get("/mine", authorize("student"), getMyHostel);
router.get("/complaints/mine", authorize("student"), getMyComplaints);
router.post("/complaints", authorize("student"), createComplaint);

router.get("/", authorize("admin"), getHostels);
router.post("/", authorize("admin"), createHostel);
router.post("/:id/rooms", authorize("admin"), addRoom);
router.post("/:id/rooms/:roomId/allocate", authorize("admin"), allocateRoom);
router.get("/complaints", authorize("admin"), getComplaints);
router.put("/complaints/:id", authorize("admin"), updateComplaintStatus);

module.exports = router;
