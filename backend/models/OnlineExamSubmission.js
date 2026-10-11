const mongoose = require("mongoose");

const onlineExamSubmissionSchema = new mongoose.Schema(
  {
    exam: { type: mongoose.Schema.Types.ObjectId, ref: "OnlineExam", required: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true },
    answers: [
      {
        question: { type: mongoose.Schema.Types.ObjectId, required: true },
        selectedOption: { type: Number }, // for mcq/true_false
        textAnswer: { type: String }, // for short_answer (manually graded, not counted in auto score)
      },
    ],
    score: { type: Number, default: 0 }, // auto-graded objective marks only
    maxScore: { type: Number, default: 0 },
    submittedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

onlineExamSubmissionSchema.index({ exam: 1, student: 1 }, { unique: true });
module.exports = mongoose.model("OnlineExamSubmission", onlineExamSubmissionSchema);
