const express = require("express");
const router = express.Router();
const {
  listStudentFees, getStudentAccount, updateServices, addOtherFeeToAccount, updateHeadAmount, removeOtherFee,
  getMyFeeAccounts, collectPayment, getReceiptPdf, getPaymentHistory, getAllPayments, getFeeReport,
} = require("../controllers/feeController");
const { protect, authorize } = require("../middleware/authMiddleware");

router.use(protect);

// Student: own fees + own payment history only.
router.get("/mine", authorize("student"), getMyFeeAccounts);
router.get("/mine/payments", authorize("student"), getPaymentHistory);

// Accountant + Admin: manage student fee records and collect payments.
// (None of these return college-wide totals.)
router.get("/students", authorize("accountant", "admin"), listStudentFees);
router.get("/accounts/student/:studentId", authorize("accountant", "admin"), getStudentAccount);
router.put("/accounts/:id/services", authorize("accountant", "admin"), updateServices);
router.post("/accounts/:id/other-fees", authorize("accountant", "admin"), addOtherFeeToAccount);
router.put("/accounts/:id/heads/:headId", authorize("accountant", "admin"), updateHeadAmount);
router.delete("/accounts/:id/heads/:headId", authorize("accountant", "admin"), removeOtherFee);

router.post("/payments", authorize("accountant", "admin"), collectPayment);
router.get("/payments", authorize("accountant", "admin"), getAllPayments);
router.get("/payments/:id/receipt", authorize("student", "accountant", "admin"), getReceiptPdf);
router.get("/payments/student/:studentId", authorize("accountant", "admin"), getPaymentHistory);

// Financial analytics: ADMIN ONLY (HOD gets a counts-only department view).
// Accountants are deliberately not listed - they can't see totals.
router.get("/reports", authorize("admin", "hod"), getFeeReport);

module.exports = router;
