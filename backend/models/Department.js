const mongoose = require("mongoose");

const departmentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, uppercase: true, trim: true },
    description: { type: String, trim: true },
  },
  { timestamps: true }
);

// Department codes are unique platform-wide (there's only one college here).
departmentSchema.index({ code: 1 }, { unique: true });

module.exports = mongoose.model("Department", departmentSchema);
