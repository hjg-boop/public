const mongoose = require("mongoose");

// One account per student per academic year. Each entry in `heads` is a
// charge assigned to that student, with its own running `paid` amount so
// balances can be shown (and enforced) per charge, not just in total.
//   category "college"   - mandatory, created automatically with the account
//   category "hostel"    - present only while hostelOpted is true
//   category "transport" - present only while transportOpted is true
//   category "other"     - miscellaneous / special, added one by one
const studentFeeAccountSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true },
    academicYear: { type: String, required: true, trim: true },
    hostelOpted: { type: Boolean, default: false },
    transportOpted: { type: Boolean, default: false },
    heads: [
      {
        category: { type: String, enum: ["college", "hostel", "transport", "other"], required: true },
        label: { type: String, required: true, trim: true },
        amount: { type: Number, required: true, min: 0 },
        paid: { type: Number, default: 0, min: 0 },
        feeHead: { type: mongoose.Schema.Types.ObjectId, ref: "FeeHead" }, // template this came from, if any
        addedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      },
    ],
    totalAmount: { type: Number, default: 0 },
    paidAmount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

studentFeeAccountSchema.index({ student: 1, academicYear: 1 }, { unique: true });
studentFeeAccountSchema.index({ academicYear: 1 });

studentFeeAccountSchema.pre("save", function (next) {
  this.totalAmount = this.heads.reduce((sum, h) => sum + (h.amount || 0), 0);
  this.paidAmount = this.heads.reduce((sum, h) => sum + (h.paid || 0), 0);
  next();
});

module.exports = mongoose.model("StudentFeeAccount", studentFeeAccountSchema);
