const express = require("express");
const router = express.Router();
const {
  getDocuments,
  getDocumentById,
  createDocument,
  updateDocument,
  deleteDocument,
  trackDownload,
} = require("../controllers/documentController");
const { protect, authorize } = require("../middleware/authMiddleware");
const { singleFileUpload } = require("../middleware/uploadMiddleware");

router.use(protect);

router.get("/", getDocuments);
router.post("/", authorize("faculty", "admin"), singleFileUpload("file"), createDocument);
router.get("/:id", getDocumentById);
router.get("/:id/download", trackDownload);
router.put("/:id", authorize("faculty", "admin"), updateDocument);
router.delete("/:id", authorize("faculty", "admin"), deleteDocument);

module.exports = router;
