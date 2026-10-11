const asyncHandler = require("express-async-handler");
const crypto = require("crypto");
const StudentFeeAccount = require("../models/StudentFeeAccount");
const Payment = require("../models/Payment");
const Student = require("../models/Student");
const User = require("../models/User");
const { storeFile } = require("../services/fileStorage");
const { buildReceiptPdf, loadLogo } = require("../utils/receiptPdf");
const { logActivity } = require("../utils/activity");
const { collegeIdentity } = require("../utils/collegeIdentity");
const { branchIdsForDepartment } = require("../utils/scope");
const { httpError, getCurrentAcademicYear, ensureFeeAccount, setService, addOtherFee, summarize } = require("../utils/feeService");

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// ---------------------------------------------------------------------------
// Student fee records (Accountant + Admin). Per-student figures only - there
// is deliberately no endpoint here that totals money across students; those
// college-level analytics live in getFeeReport, which is Admin-only.
// ---------------------------------------------------------------------------

// @desc  Paged list of students with a one-line fee summary each.
// @route GET /api/fees/students?search=&page=&limit=&academicYear=
const listStudentFees = asyncHandler(async (req, res) => {
  const academicYear = req.query.academicYear || (await getCurrentAcademicYear());
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 25));

  const filter = {};
  if (req.query.search) {
    const rx = new RegExp(escapeRegex(req.query.search.trim()), "i");
    const users = await User.find({ role: "student", $or: [{ name: rx }, { email: rx }] }).select("_id");
    filter.$or = [{ rollNumber: rx }, { user: { $in: users.map((u) => u._id) } }];
  }

  const [students, total] = await Promise.all([
    Student.find(filter).populate("user", "name").populate("branch", "code").sort({ rollNumber: 1 }).skip((page - 1) * limit).limit(limit),
    Student.countDocuments(filter),
  ]);

  const accounts = await StudentFeeAccount.find({ student: { $in: students.map((s) => s._id) }, academicYear });
  const byStudent = Object.fromEntries(accounts.map((a) => [String(a.student), a]));

  const rows = students.map((s) => {
    const acc = byStudent[String(s._id)];
    return {
      student: s,
      account: acc ? { ...summarize(acc) } : null, // null => no fee account yet; opening it creates one
    };
  });

  res.json({ success: true, message: "Student fees fetched", data: { rows, total, page, pages: Math.ceil(total / limit), academicYear } });
});

// @desc  One student's full fee account (creating it, with the mandatory
//        college fee, if it doesn't exist yet).
// @route GET /api/fees/accounts/student/:studentId
const getStudentAccount = asyncHandler(async (req, res) => {
  const student = await Student.findById(req.params.studentId).populate("user", "name email").populate("branch", "code name");
  if (!student) { res.status(404); throw new Error("Student not found"); }
  const account = await ensureFeeAccount(student._id, req.query.academicYear, req.user._id);
  res.json({ success: true, message: "Fee account fetched", data: { student, account } });
});

// @desc  Toggle hostel and/or transport for a student.
// @route PUT /api/fees/accounts/:id/services   body: { hostel?: bool, transport?: bool, hostelAmount?, transportAmount? }
const updateServices = asyncHandler(async (req, res) => {
  const account = await StudentFeeAccount.findById(req.params.id);
  if (!account) { res.status(404); throw new Error("Fee account not found"); }
  const { hostel, transport, hostelAmount, transportAmount } = req.body;
  if (hostel === undefined && transport === undefined) { res.status(400); throw new Error("Nothing to update"); }

  if (hostel !== undefined) await setService(account, "hostel", !!hostel, { amount: hostelAmount, addedBy: req.user._id });
  if (transport !== undefined) await setService(account, "transport", !!transport, { amount: transportAmount, addedBy: req.user._id });

  await logActivity(req, {
    action: `Updated fee services (hostel: ${account.hostelOpted ? "yes" : "no"}, transport: ${account.transportOpted ? "yes" : "no"})`,
    module: "fees",
  });
  res.json({ success: true, message: "Fee services updated", data: account });
});

// @desc  Add a one-off miscellaneous/special fee.
// @route POST /api/fees/accounts/:id/other-fees   body: { label, amount }
const addOtherFeeToAccount = asyncHandler(async (req, res) => {
  const account = await StudentFeeAccount.findById(req.params.id);
  if (!account) { res.status(404); throw new Error("Fee account not found"); }
  await addOtherFee(account, { label: req.body.label, amount: req.body.amount, addedBy: req.user._id });
  await logActivity(req, { action: `Added other fee "${req.body.label}" (Rs. ${req.body.amount})`, module: "fees" });
  res.status(201).json({ success: true, message: "Fee added", data: account });
});

// @desc  Change the amount of one charge (e.g. a waiver/adjustment). Never below what's already paid.
// @route PUT /api/fees/accounts/:id/heads/:headId   body: { amount }
const updateHeadAmount = asyncHandler(async (req, res) => {
  const account = await StudentFeeAccount.findById(req.params.id);
  if (!account) { res.status(404); throw new Error("Fee account not found"); }
  const head = account.heads.id(req.params.headId);
  if (!head) { res.status(404); throw new Error("Fee item not found"); }
  const amount = Number(req.body.amount);
  if (!Number.isFinite(amount) || amount < 0) throw httpError("Invalid amount");
  if (amount < head.paid) throw httpError(`Amount cannot be lower than the Rs. ${head.paid} already paid`);
  head.amount = amount;
  await account.save();
  await logActivity(req, { action: `Adjusted "${head.label}" to Rs. ${amount}`, module: "fees" });
  res.json({ success: true, message: "Fee updated", data: account });
});

// @desc  Remove an "other" fee that has no payments against it.
// @route DELETE /api/fees/accounts/:id/heads/:headId
const removeOtherFee = asyncHandler(async (req, res) => {
  const account = await StudentFeeAccount.findById(req.params.id);
  if (!account) { res.status(404); throw new Error("Fee account not found"); }
  const head = account.heads.id(req.params.headId);
  if (!head) { res.status(404); throw new Error("Fee item not found"); }
  if (head.category !== "other") throw httpError("Only miscellaneous fees can be removed here. Use the hostel/transport toggles for those; the college fee is mandatory.");
  if (head.paid > 0) throw httpError("Payments have already been made toward this fee, so it cannot be removed");
  head.deleteOne();
  await account.save();
  res.json({ success: true, message: "Fee removed", data: account });
});

// ---------------------------------------------------------------------------
// Student's own view
// ---------------------------------------------------------------------------

const getMyFeeAccounts = asyncHandler(async (req, res) => {
  const student = await Student.findOne({ user: req.user._id });
  if (!student) return res.json({ success: true, message: "Fee accounts fetched", data: [] });
  await ensureFeeAccount(student._id); // guarantees the mandatory college fee shows up
  const accounts = await StudentFeeAccount.find({ student: student._id }).sort({ academicYear: -1 });
  res.json({ success: true, message: "Fee accounts fetched", data: accounts });
});

// ---------------------------------------------------------------------------
// Collecting payments
// ---------------------------------------------------------------------------

// Builds the receipt PDF for a stored Payment. Used when a payment is first
// collected and again for every re-print, so both always look the same.
// Older payments have no fee/balance snapshot; the receipt then shows only
// the amount paid.
const buildReceiptBuffer = async (payment) => {
  const [student, college, collector] = await Promise.all([
    Student.findById(payment.student).populate("user", "name").populate("branch", "name"),
    collegeIdentity(),
    User.findById(payment.collectedBy).select("name"),
  ]);
  return buildReceiptPdf({
    college: { name: college.name, email: college.email, phone: college.phone, address: college.address, logo: await loadLogo(college.logo) },
    student: {
      name: student?.user?.name,
      rollNumber: student?.rollNumber,
      branch: student?.branch?.name,
      year: student?.year,
      semester: student?.semester,
      section: student?.section,
    },
    receipt: {
      number: payment.receiptNumber,
      date: payment.paymentDate,
      mode: payment.paymentMode,
      transactionId: payment.transactionId,
      academicYear: payment.academicYear,
    },
    item: {
      label: payment.feeHeadLabel,
      feeAmount: payment.feeAmount ?? null,
      paid: payment.amount,
      balance: payment.balanceAfter ?? null,
    },
    collectedBy: collector?.name,
  });
};

// @desc  Collect a payment toward ONE charge on the student's account.
//        Creates a new immutable Payment, bumps that charge's paid amount,
//        and generates a PDF receipt. Overpaying a charge is rejected.
// @route POST /api/fees/payments   body: { student, headId, amount, paymentMode, transactionId, academicYear? }
const collectPayment = asyncHandler(async (req, res) => {
  const { student, headId, paymentMode, transactionId } = req.body;
  const amount = Number(req.body.amount);
  if (!student || !headId || !Number.isFinite(amount) || amount <= 0) {
    res.status(400);
    throw new Error("student, headId and a positive amount are required");
  }

  // Checked up front: an invalid mode used to fail only AFTER the charge's paid amount was saved.
  if (paymentMode && !Payment.schema.path("paymentMode").enumValues.includes(paymentMode)) {
    res.status(400);
    throw new Error("Invalid payment mode");
  }

  const studentDoc = await Student.findById(student).populate("user", "name").populate("branch");
  if (!studentDoc) { res.status(404); throw new Error("Student not found"); }

  const account = await ensureFeeAccount(student, req.body.academicYear, req.user._id);
  const head = account.heads.id(headId);
  if (!head) { res.status(404); throw new Error("That fee item is not on this student's account"); }

  const balance = head.amount - head.paid;
  if (balance <= 0) throw httpError(`${head.label} is already fully paid`);
  if (amount > balance) throw httpError(`Amount exceeds the balance for ${head.label} (balance is Rs. ${balance})`);

  const receiptNumber = `REC-${new Date().getFullYear()}-${crypto.randomBytes(5).toString("hex").toUpperCase()}`;

  head.paid += amount;
  await account.save();

  const payment = await Payment.create({
    student,
    account: account._id,
    headId: head._id,
    category: head.category,
    feeHeadLabel: head.label,
    feeAmount: head.amount,
    balanceAfter: head.amount - head.paid,
    amount,
    paymentMode: paymentMode || "Cash",
    transactionId,
    receiptNumber,
    academicYear: account.academicYear,
    collectedBy: req.user._id,
  });

  // The payment is already recorded at this point, so a receipt problem must not
  // fail the request (the cashier would retry). The PDF can be re-generated later.
  try {
    const pdfBuffer = await buildReceiptBuffer(payment);
    const stored = await storeFile(req, { buffer: pdfBuffer, originalName: `${receiptNumber}.pdf`, mimeType: "application/pdf", folder: "receipts" });
    payment.receiptUrl = stored.url;
    payment.receiptPublicId = stored.publicId;
    await payment.save();
  } catch (err) {
    console.error(`Receipt PDF failed for ${receiptNumber}:`, err.message);
  }

  await logActivity(req, { action: `Collected Rs. ${amount} from ${studentDoc.user.name} (${head.label})`, module: "fees" });
  res.status(201).json({ success: true, message: "Payment recorded", data: { payment, account } });
});

// @desc  Receipt PDF for one payment, generated on demand (view / print / download).
//        Staff: any payment. Student: only their own.
// @route GET /api/fees/payments/:id/receipt
const getReceiptPdf = asyncHandler(async (req, res) => {
  const payment = await Payment.findById(req.params.id);
  if (!payment) { res.status(404); throw new Error("Receipt not found"); }
  if (req.user.role === "student") {
    const me = await Student.findOne({ user: req.user._id });
    if (!me || String(me._id) !== String(payment.student)) { res.status(403); throw new Error("Not authorized to view this receipt"); }
  }
  const buffer = await buildReceiptBuffer(payment);
  res.set({ "Content-Type": "application/pdf", "Content-Disposition": `inline; filename="${payment.receiptNumber}.pdf"` });
  res.send(buffer);
});

// @desc  Payment history for one student (staff), or self (student).
const getPaymentHistory = asyncHandler(async (req, res) => {
  let studentId = req.params.studentId;
  if (req.user.role === "student") {
    const me = await Student.findOne({ user: req.user._id });
    if (!me) return res.json({ success: true, message: "Payments fetched", data: [] });
    studentId = String(me._id);
  }
  if (!studentId) { res.status(400); throw new Error("studentId is required"); }
  const payments = await Payment.find({ student: studentId }).populate("collectedBy", "name").sort({ createdAt: -1 });
  res.json({ success: true, message: "Payments fetched", data: payments });
});

// @desc  Payment records (paged). A list of transactions - not totals.
// @route GET /api/fees/payments?academicYear=&category=&search=&page=&limit=
const getAllPayments = asyncHandler(async (req, res) => {
  const { academicYear, category, search } = req.query;
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 25));

  const filter = {};
  if (academicYear) filter.academicYear = academicYear;
  if (category) filter.category = category;
  if (search) {
    const rx = new RegExp(escapeRegex(search.trim()), "i");
    const users = await User.find({ role: "student", name: rx }).select("_id");
    const students = await Student.find({ $or: [{ rollNumber: rx }, { user: { $in: users.map((u) => u._id) } }] }).select("_id");
    filter.$or = [{ receiptNumber: rx }, { student: { $in: students.map((s) => s._id) } }];
  }

  const [payments, total] = await Promise.all([
    Payment.find(filter)
      .populate({ path: "student", populate: [{ path: "user", select: "name" }, { path: "branch", select: "code" }] })
      .populate("collectedBy", "name")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Payment.countDocuments(filter),
  ]);
  res.json({ success: true, message: "Payments fetched", data: { payments, total, page, pages: Math.ceil(total / limit) } });
});

// ---------------------------------------------------------------------------
// College-level financial analytics - ADMIN ONLY (HOD gets a counts-only
// view of their own department). Accountants are intentionally excluded:
// they work student by student and never see college totals.
// ---------------------------------------------------------------------------

const getFeeReport = asyncHandler(async (req, res) => {
  if (req.user.role === "hod") {
    if (!req.user.department) { res.status(403); throw new Error("Your account has no department assigned"); }
    const branchIds = await branchIdsForDepartment(req.user.department);
    const students = await Student.find({ branch: { $in: branchIds } }).select("_id");
    const accounts = await StudentFeeAccount.find({ student: { $in: students.map((s) => s._id) }, academicYear: await getCurrentAcademicYear() });
    const studentsWithPending = accounts.filter((a) => a.paidAmount < a.totalAmount).length;
    return res.json({ success: true, message: "Fee summary fetched", data: { studentsWithPendingFees: studentsWithPending, totalStudents: students.length } });
  }

  const academicYear = req.query.academicYear || (await getCurrentAcademicYear());
  const data = await buildAdminFeeSummary(academicYear);
  res.json({ success: true, message: "Fee report fetched", data });
});

// Shared by the Admin dashboard and the Admin report page.
const buildAdminFeeSummary = async (academicYear) => {
  const [totals] = await StudentFeeAccount.aggregate([
    { $match: { academicYear } },
    { $group: { _id: null, totalExpected: { $sum: "$totalAmount" }, totalCollected: { $sum: "$paidAmount" }, accounts: { $sum: 1 } } },
  ]);
  const expected = totals?.totalExpected || 0;
  const collected = totals?.totalCollected || 0;

  const byCategory = await Payment.aggregate([
    { $match: { academicYear } },
    { $group: { _id: "$category", amount: { $sum: "$amount" } } },
  ]);
  const byHead = await Payment.aggregate([
    { $match: { academicYear } },
    { $group: { _id: "$feeHeadLabel", amount: { $sum: "$amount" } } },
    { $sort: { amount: -1 } },
  ]);

  const pendingAccounts = await StudentFeeAccount.countDocuments({ academicYear, $expr: { $lt: ["$paidAmount", "$totalAmount"] } });

  return {
    academicYear,
    totalExpected: expected,
    totalCollected: collected,
    totalPending: expected - collected,
    totalOutstanding: expected - collected, // alias kept for the existing report page
    studentsWithPendingFees: pendingAccounts,
    collectionByCategory: byCategory.map((r) => ({ category: r._id, amount: r.amount })),
    collectionByHead: byHead.map((r) => ({ label: r._id, amount: r.amount })),
  };
};

module.exports = {
  listStudentFees, getStudentAccount, updateServices, addOtherFeeToAccount, updateHeadAmount, removeOtherFee,
  getMyFeeAccounts, collectPayment, getReceiptPdf, getPaymentHistory, getAllPayments, getFeeReport, buildAdminFeeSummary,
};
