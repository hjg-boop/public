const mongoose = require("mongoose");

const assignmentSubmissionSchema = new mongoose.Schema(
  {
    assignment: { type: mongoose.Schema.Types.ObjectId, ref: "Assignment", required: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true },
    fileUrl: { type: String, required: true },
    publicId: { type: String },
    resourceType: { type: String },
    submittedAt: { type: Date, default: Date.now },
    status: { type: String, enum: ["submitted", "late"], default: "submitted" },
    grade: { type: Number },
    feedback: { type: String, trim: true },
  },
  { timestamps: true }
);

assignmentSubmissionSchema.index({ assignment: 1, student: 1 }, { unique: true });

module.exports = mongoose.model("AssignmentSubmission", assignmentSubmissionSchema);
