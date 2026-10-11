const mongoose = require("mongoose");

const libraryIssueSchema = new mongoose.Schema(
  {
    book: { type: mongoose.Schema.Types.ObjectId, ref: "LibraryBook", required: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true },
    issueDate: { type: Date, default: Date.now },
    dueDate: { type: Date, required: true },
    returnDate: { type: Date },
    status: { type: String, enum: ["issued", "returned", "overdue"], default: "issued" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("LibraryIssue", libraryIssueSchema);
