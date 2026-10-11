const mongoose = require("mongoose");

// Admin-managed catalog of sections within a branch/year/semester
// (e.g. CSE / Year 2 / Sem 3 / Section A, B, C). Student.section and every
// other section-bearing record store the section NAME (a short string) so
// existing branch+year+semester+section filters don't need restructuring;
// this catalog is what Admin edits and what dropdowns are populated from.
const sectionSchema = new mongoose.Schema(
  {
    branch: { type: mongoose.Schema.Types.ObjectId, ref: "Branch", required: true },
    year: { type: Number, required: true, min: 1, max: 5 },
    semester: { type: Number, required: true, min: 1, max: 10 },
    name: { type: String, required: true, trim: true, uppercase: true }, // "A", "B", "C"
  },
  { timestamps: true }
);

sectionSchema.index({ branch: 1, year: 1, semester: 1, name: 1 }, { unique: true });

module.exports = mongoose.model("Section", sectionSchema);
