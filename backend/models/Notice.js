const mongoose = require("mongoose");

const noticeSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    targetScope: {
      type: String,
      enum: ["college", "department", "branch", "year", "semester"],
      default: "college",
    },
    department: { type: mongoose.Schema.Types.ObjectId, ref: "Department" },
    branch: { type: mongoose.Schema.Types.ObjectId, ref: "Branch" },
    year: { type: Number },
    semester: { type: Number },
    priority: {
      type: String,
      enum: ["low", "normal", "high"],
      default: "normal",
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    publishDate: { type: Date, default: Date.now },
    expiryDate: { type: Date },
  },
  { timestamps: true }
);

noticeSchema.index({ publishDate: -1, targetScope: 1 });

module.exports = mongoose.model("Notice", noticeSchema);
