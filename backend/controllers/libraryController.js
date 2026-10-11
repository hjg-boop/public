const asyncHandler = require("express-async-handler");
const LibraryBook = require("../models/LibraryBook");
const LibraryIssue = require("../models/LibraryIssue");
const Student = require("../models/Student");

const getBooks = asyncHandler(async (req, res) => {
  const { search } = req.query;
  const filter = search ? { $text: { $search: search } } : {};
  const books = await LibraryBook.find(filter).sort({ title: 1 });
  res.json({ success: true, message: "Books fetched", data: books });
});

const createBook = asyncHandler(async (req, res) => {
  const { title, author, isbn, category, shelfLocation, totalCopies } = req.body;
  if (!title) { res.status(400); throw new Error("Title is required"); }
  const copies = totalCopies || 1;
  const book = await LibraryBook.create({ title, author, isbn, category, shelfLocation, totalCopies: copies, availableCopies: copies });
  res.status(201).json({ success: true, message: "Book added", data: book });
});

const updateBook = asyncHandler(async (req, res) => {
  const book = await LibraryBook.findById(req.params.id);
  if (!book) { res.status(404); throw new Error("Book not found"); }
  const wasTotal = book.totalCopies;
  Object.assign(book, req.body);
  if (req.body.totalCopies !== undefined) {
    // keep availableCopies consistent when the total changes
    book.availableCopies = Math.max(0, book.availableCopies + (book.totalCopies - wasTotal));
  }
  await book.save();
  res.json({ success: true, message: "Book updated", data: book });
});

const deleteBook = asyncHandler(async (req, res) => {
  const book = await LibraryBook.findById(req.params.id);
  if (!book) { res.status(404); throw new Error("Book not found"); }
  await book.deleteOne();
  res.json({ success: true, message: "Book deleted", data: {} });
});

const issueBook = asyncHandler(async (req, res) => {
  const { bookId, studentId, dueDate } = req.body;
  const book = await LibraryBook.findById(bookId);
  if (!book) { res.status(404); throw new Error("Book not found"); }
  if (book.availableCopies < 1) { res.status(400); throw new Error("No copies available"); }
  book.availableCopies -= 1;
  await book.save();
  const issue = await LibraryIssue.create({ book: bookId, student: studentId, dueDate: dueDate || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) });
  res.status(201).json({ success: true, message: "Book issued", data: issue });
});

const returnBook = asyncHandler(async (req, res) => {
  const issue = await LibraryIssue.findById(req.params.id);
  if (!issue) { res.status(404); throw new Error("Issue record not found"); }
  if (issue.status === "returned") { res.status(400); throw new Error("Already returned"); }
  issue.status = "returned";
  issue.returnDate = new Date();
  await issue.save();
  await LibraryBook.findByIdAndUpdate(issue.book, { $inc: { availableCopies: 1 } });
  res.json({ success: true, message: "Book returned", data: issue });
});

const getIssues = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const filter = {};
  if (status) filter.status = status;
  const issues = await LibraryIssue.find(filter).populate("book").populate({ path: "student", populate: { path: "user", select: "name" } }).sort({ createdAt: -1 });
  res.json({ success: true, message: "Issues fetched", data: issues });
});

const getMyIssues = asyncHandler(async (req, res) => {
  const student = await Student.findOne({ user: req.user._id });
  if (!student) return res.json({ success: true, message: "Issues fetched", data: [] });
  const issues = await LibraryIssue.find({ student: student._id }).populate("book").sort({ createdAt: -1 });
  res.json({ success: true, message: "Issues fetched", data: issues });
});

module.exports = { getBooks, createBook, updateBook, deleteBook, issueBook, returnBook, getIssues, getMyIssues };
