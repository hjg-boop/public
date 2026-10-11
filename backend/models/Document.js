const mongoose = require("mongoose");

const documentSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    fileUrl: { type: String, required: true },
    publicId: { type: String }, // Cloudinary public id (or local filename)
    resourceType: { type: String }, // Cloudinary resource type, needed for deletion
    fileType: { type: String }, // MIME type
    unit: { type: Number, min: 1 },
    fileName: { type: String, required: true },
    fileSize: { type: Number },
    category: {
      type: String,
      enum: [
        "Notes",
        "Important Questions",
        "Previous Papers",
        "Lab Manuals",
        "Assignments",
        "Syllabus",
      ],
      required: true,
    },
    subject: { type: mongoose.Schema.Types.ObjectId, ref: "Subject", required: true },
    branch: { type: mongoose.Schema.Types.ObjectId, ref: "Branch", required: true },
    year: { type: Number, required: true },
    semester: { type: Number, required: true },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    downloadCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

documentSchema.index({ title: "text", fileName: "text" });
documentSchema.index({ subject: 1, semester: 1, unit: 1 });

module.exports = mongoose.model("Document", documentSchema);
