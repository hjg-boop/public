const express = require("express");
const router = express.Router();
const { getBooks, createBook, updateBook, deleteBook, issueBook, returnBook, getIssues, getMyIssues } = require("../controllers/libraryController");
const { protect, authorize } = require("../middleware/authMiddleware");

router.use(protect);
router.get("/books", getBooks); // any logged-in role can search the catalog
router.post("/books", authorize("admin"), createBook);
router.put("/books/:id", authorize("admin"), updateBook);
router.delete("/books/:id", authorize("admin"), deleteBook);

router.get("/issues/mine", authorize("student"), getMyIssues);
router.get("/issues", authorize("admin"), getIssues);
router.post("/issues", authorize("admin"), issueBook);
router.put("/issues/:id/return", authorize("admin"), returnBook);

module.exports = router;
