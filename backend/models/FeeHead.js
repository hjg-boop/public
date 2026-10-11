const mongoose = require("mongoose");

// Admin-configured fee rates for an academic year.
//   college   -> mandatory base fee, auto-assigned to every student on admission
//   hostel    -> added only when the student opts into the hostel
//   transport -> added only when the student uses college transport
//   other     -> misc/special fees (admin-defined templates; accountants can
//                also add one-off "other" fees per student without a template)
// Changing a rate later never silently alters students already assigned a
// fee - their account keeps the amount it was given.
const feeHeadSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    category: { type: String, enum: ["college", "hostel", "transport", "other"], default: "other" },
    academicYear: { type: String, required: true, trim: true },
    defaultAmount: { type: Number, required: true, min: 0 },
  },
  { timestamps: true }
);

feeHeadSchema.index({ name: 1, academicYear: 1 }, { unique: true });
feeHeadSchema.index({ category: 1, academicYear: 1 });

module.exports = mongoose.model("FeeHead", feeHeadSchema);
