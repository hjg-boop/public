const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema(
  {
    text: { type: String, required: true },
    type: { type: String, enum: ["mcq", "true_false", "short_answer"], default: "mcq" },
    options: [{ type: String }], // used for mcq / true_false
    correctOption: { type: Number }, // index into options, for mcq/true_false (auto-graded)
    marks: { type: Number, default: 1 },
  },
  { _id: true }
);

const onlineExamSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    subject: { type: mongoose.Schema.Types.ObjectId, ref: "Subject", required: true },
    branch: { type: mongoose.Schema.Types.ObjectId, ref: "Branch", required: true },
    year: { type: Number, required: true },
    semester: { type: Number, required: true },
    questions: [questionSchema],
    durationMinutes: { type: Number, default: 30 },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("OnlineExam", onlineExamSchema);
