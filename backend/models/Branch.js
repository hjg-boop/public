const mongoose = require("mongoose");

const branchSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true }, // e.g. "Computer Science & Engineering"
    code: { type: String, required: true, trim: true, uppercase: true }, // e.g. "CSE"
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      required: true,
    },
    totalYears: { type: Number, default: 4 },
  },
  { timestamps: true }
);

// Branch codes only need to be unique within a department.
branchSchema.index({ code: 1, department: 1 }, { unique: true });

module.exports = mongoose.model("Branch", branchSchema);
