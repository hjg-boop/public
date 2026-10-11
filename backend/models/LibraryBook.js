const mongoose = require("mongoose");

const libraryBookSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    author: { type: String, trim: true },
    isbn: { type: String, trim: true },
    category: { type: String, trim: true },
    shelfLocation: { type: String, trim: true },
    totalCopies: { type: Number, default: 1, min: 0 },
    availableCopies: { type: Number, default: 1, min: 0 },
  },
  { timestamps: true }
);

libraryBookSchema.index({ title: "text", author: "text", isbn: "text" });
module.exports = mongoose.model("LibraryBook", libraryBookSchema);
