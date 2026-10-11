const express = require("express");
const router = express.Router();
const { getBuses, createBus, updateBus, deleteBus, allocateStudent, getMyAllocation } = require("../controllers/transportController");
const { protect, authorize } = require("../middleware/authMiddleware");

router.use(protect);
router.get("/mine", authorize("student"), getMyAllocation);
router.get("/buses", authorize("admin"), getBuses);
router.post("/buses", authorize("admin"), createBus);
router.put("/buses/:id", authorize("admin"), updateBus);
router.delete("/buses/:id", authorize("admin"), deleteBus);
router.post("/allocate", authorize("admin"), allocateStudent);

module.exports = router;
