const mongoose = require("mongoose");

// One immutable record per payment. Never updated or overwritten - a
// correction is a new record, not an edit.
const paymentSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true },
    account: { type: mongoose.Schema.Types.ObjectId, ref: "StudentFeeAccount", required: true },
    headId: { type: mongoose.Schema.Types.ObjectId, required: true }, // the charge (account.heads._id) this paid toward
    category: { type: String, enum: ["college", "hostel", "transport", "other"], required: true },
    feeHeadLabel: { type: String, required: true }, // snapshot, survives later edits
    feeAmount: { type: Number }, // snapshot: the charge's total when this was paid (absent on older payments)
    balanceAfter: { type: Number }, // snapshot: what was still owed on that charge after this payment
    amount: { type: Number, required: true, min: 1 },
    paymentDate: { type: Date, default: Date.now },
    paymentMode: { type: String, enum: ["Cash", "Card", "UPI", "Bank Transfer", "Cheque", "Other"], default: "Cash" },
    transactionId: { type: String, trim: true },
    receiptNumber: { type: String, required: true, unique: true },
    academicYear: { type: String, required: true, trim: true },
    collectedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    receiptUrl: { type: String },
    receiptPublicId: { type: String },
  },
  { timestamps: true }
);

paymentSchema.index({ student: 1, createdAt: -1 });
paymentSchema.index({ academicYear: 1, category: 1 });
paymentSchema.index({ paymentDate: -1 });

module.exports = mongoose.model("Payment", paymentSchema);
