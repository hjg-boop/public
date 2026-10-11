const CollegeSettings = require("../models/CollegeSettings");
const AcademicYear = require("../models/AcademicYear");
const FeeHead = require("../models/FeeHead");
const StudentFeeAccount = require("../models/StudentFeeAccount");

const httpError = (message, statusCode = 400) => {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
};

// "2026-27" style label for today's date if nothing has been configured.
const fallbackYearLabel = () => {
  const now = new Date();
  const start = now.getMonth() >= 5 ? now.getFullYear() : now.getFullYear() - 1; // academic year starts ~June
  return `${start}-${String(start + 1).slice(-2)}`;
};

const getCurrentAcademicYear = async () => {
  const settings = await CollegeSettings.findOne({ singleton: "main" });
  if (settings?.currentAcademicYear) return settings.currentAcademicYear;
  const current = await AcademicYear.findOne({ isCurrent: true });
  return current?.label || fallbackYearLabel();
};

// Mandatory base fee for the year. If several "college" heads exist, they
// are all mandatory; each is added.
const collegeHeads = (academicYear) => FeeHead.find({ academicYear, category: "college" });

const headEntryFrom = (feeHead, addedBy) => ({
  category: feeHead.category,
  label: feeHead.name,
  amount: feeHead.defaultAmount,
  paid: 0,
  feeHead: feeHead._id,
  addedBy,
});

/**
 * Returns the student's fee account for the year, creating it if needed and
 * making sure the mandatory college fee is on it. Safe to call repeatedly:
 * it only ever ADDS a missing mandatory fee, it never changes amounts that
 * are already assigned.
 */
const ensureFeeAccount = async (studentId, academicYear, addedBy) => {
  const year = academicYear || (await getCurrentAcademicYear());
  let account = await StudentFeeAccount.findOne({ student: studentId, academicYear: year });
  if (!account) account = new StudentFeeAccount({ student: studentId, academicYear: year, heads: [] });

  const mandatory = await collegeHeads(year);
  let changed = account.isNew;
  for (const head of mandatory) {
    const alreadyThere = account.heads.some((h) => h.category === "college" && String(h.feeHead) === String(head._id));
    if (!alreadyThere) {
      account.heads.push(headEntryFrom(head, addedBy));
      changed = true;
    }
  }
  if (changed) await account.save();
  return account;
};

// Turn the hostel or transport charge on/off. Turning ON uses the year's
// configured rate unless an explicit amount is given; turning OFF is blocked
// once money has been paid toward it (refunds are a manual accounting matter).
const setService = async (account, category, enabled, { amount, addedBy } = {}) => {
  const flag = category === "hostel" ? "hostelOpted" : "transportOpted";
  const existing = account.heads.find((h) => h.category === category);

  if (enabled) {
    if (!existing) {
      let rate = amount;
      let template = await FeeHead.findOne({ academicYear: account.academicYear, category });
      if (rate === undefined || rate === null || rate === "") {
        if (!template) throw httpError(`No ${category} fee has been configured for ${account.academicYear}. Ask the admin to add it under Academic Management.`);
        rate = template.defaultAmount;
      }
      rate = Number(rate);
      if (!Number.isFinite(rate) || rate < 0) throw httpError("Invalid amount");
      account.heads.push({
        category,
        label: template?.name || (category === "hostel" ? "Hostel Fee" : "Transport Fee"),
        amount: rate,
        paid: 0,
        feeHead: template?._id,
        addedBy,
      });
    } else if (amount !== undefined && amount !== null && amount !== "") {
      const rate = Number(amount);
      if (!Number.isFinite(rate) || rate < existing.paid) throw httpError("Amount cannot be lower than what has already been paid");
      existing.amount = rate;
    }
    account[flag] = true;
  } else {
    if (existing) {
      if (existing.paid > 0) {
        throw httpError(`Cannot remove the ${category} fee - Rs. ${existing.paid} has already been paid toward it.`);
      }
      existing.deleteOne();
    }
    account[flag] = false;
  }
  await account.save();
  return account;
};

const addOtherFee = async (account, { label, amount, addedBy }) => {
  const rate = Number(amount);
  if (!label || !String(label).trim()) throw httpError("A label is required for the fee");
  if (!Number.isFinite(rate) || rate <= 0) throw httpError("Amount must be greater than 0");
  account.heads.push({ category: "other", label: String(label).trim(), amount: rate, paid: 0, addedBy });
  await account.save();
  return account;
};

const summarize = (account) => ({
  _id: account._id,
  student: account.student,
  academicYear: account.academicYear,
  hostelOpted: account.hostelOpted,
  transportOpted: account.transportOpted,
  totalAmount: account.totalAmount,
  paidAmount: account.paidAmount,
  balance: account.totalAmount - account.paidAmount,
});

module.exports = { httpError, getCurrentAcademicYear, ensureFeeAccount, setService, addOtherFee, summarize };
