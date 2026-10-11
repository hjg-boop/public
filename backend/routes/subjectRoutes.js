const express = require("express");
const router = express.Router();
const {
  getSubjects,
  getSubjectById,
  getMySubjects,
  createSubject,
  updateSubject,
  deleteSubject,
} = require("../controllers/subjectController");
const { protect, authorize } = require("../middleware/authMiddleware");

router.use(protect);

router.get("/mine", authorize("faculty"), getMySubjects);
router.get("/", getSubjects);
router.post("/", authorize("admin"), createSubject);
router.get("/:id", getSubjectById);
router.put("/:id", authorize("admin"), updateSubject);
router.delete("/:id", authorize("admin"), deleteSubject);

module.exports = router;
