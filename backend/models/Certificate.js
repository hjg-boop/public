const mongoose = require("mongoose");

const certificateSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true },
    type: { type: String, enum: ["Bonafide", "Study Certificate", "Course Completion", "Other"], required: true },
    certificateNumber: { type: String, required: true, unique: true },
    purpose: { type: String, trim: true },
    issueDate: { type: Date, default: Date.now },
    fileUrl: { type: String }, // generated PDF
    publicId: { type: String },
    verificationCode: { type: String, required: true, unique: true },
    issuedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Certificate", certificateSchema);
