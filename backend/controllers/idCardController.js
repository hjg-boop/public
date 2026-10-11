const asyncHandler = require("express-async-handler");
const crypto = require("crypto");
const PDFDocument = require("pdfkit");
const Student = require("../models/Student");
const Faculty = require("../models/Faculty");
const { renderToBuffer, generateQrBuffer } = require("../utils/pdfHelpers");
const { collegeIdentity } = require("../utils/collegeIdentity");

// Deterministic, non-expiring verification code for an ID card - no separate
// DB record needed, and it can't be forged without JWT_SECRET.
const codeFor = (kind, id) => crypto.createHmac("sha256", process.env.JWT_SECRET).update(`${kind}:${id}`).digest("hex").slice(0, 24);

const buildStudentCard = async (student) => {
  const college = await collegeIdentity();
  const verifyUrl = `${process.env.CLIENT_URL?.split(",")[0] || "http://localhost:5173"}/verify-id/student/${student._id}/${codeFor("student", student._id)}`;
  return {
    kind: "student",
    name: student.user.name,
    photo: student.user.photo?.url,
    rollNumber: student.rollNumber,
    branch: student.branch?.name,
    year: student.year,
    semester: student.semester,
    section: student.section,
    collegeName: college.name,
    verifyUrl,
  };
};

const buildFacultyCard = async (faculty) => {
  const college = await collegeIdentity();
  const verifyUrl = `${process.env.CLIENT_URL?.split(",")[0] || "http://localhost:5173"}/verify-id/faculty/${faculty._id}/${codeFor("faculty", faculty._id)}`;
  return {
    kind: "faculty",
    name: faculty.user.name,
    photo: faculty.user.photo?.url,
    employeeId: faculty.employeeId,
    department: faculty.department?.name,
    designation: faculty.designation,
    collegeName: college.name,
    verifyUrl,
  };
};

// @desc  My own ID card data (student or faculty)
const getMyIdCard = asyncHandler(async (req, res) => {
  if (req.user.role === "student") {
    const student = await Student.findOne({ user: req.user._id }).populate("user", "name photo").populate("branch");
    if (!student) { res.status(404); throw new Error("Student profile not found"); }
    return res.json({ success: true, message: "ID card fetched", data: await buildStudentCard(student) });
  }
  if (req.user.role === "faculty") {
    const faculty = await Faculty.findOne({ user: req.user._id }).populate("user", "name photo").populate("department");
    if (!faculty) { res.status(404); throw new Error("Faculty profile not found"); }
    return res.json({ success: true, message: "ID card fetched", data: await buildFacultyCard(faculty) });
  }
  res.status(400);
  throw new Error("ID cards are only available for students and faculty");
});

// @desc  Public verification page data - name/roll/branch only, nothing private.
const verifyId = asyncHandler(async (req, res) => {
  const { kind, id, code } = req.params;
  if (code !== codeFor(kind, id)) {
    return res.json({ success: true, message: "Invalid", data: { valid: false } });
  }
  if (kind === "student") {
    const student = await Student.findById(id).populate("user", "name").populate("branch");
    if (!student) return res.json({ success: true, message: "Not found", data: { valid: false } });
    return res.json({ success: true, message: "Verified", data: { valid: true, kind, name: student.user.name, rollNumber: student.rollNumber, branch: student.branch?.name } });
  }
  if (kind === "faculty") {
    const faculty = await Faculty.findById(id).populate("user", "name").populate("department");
    if (!faculty) return res.json({ success: true, message: "Not found", data: { valid: false } });
    return res.json({ success: true, message: "Verified", data: { valid: true, kind, name: faculty.user.name, employeeId: faculty.employeeId, department: faculty.department?.name } });
  }
  res.status(400);
  throw new Error("Invalid ID kind");
});

// @desc  Downloadable PDF version of my ID card
const getMyIdCardPdf = asyncHandler(async (req, res) => {
  let card;
  if (req.user.role === "student") {
    const student = await Student.findOne({ user: req.user._id }).populate("user", "name photo").populate("branch");
    if (!student) { res.status(404); throw new Error("Student profile not found"); }
    card = await buildStudentCard(student);
  } else if (req.user.role === "faculty") {
    const faculty = await Faculty.findOne({ user: req.user._id }).populate("user", "name photo").populate("department");
    if (!faculty) { res.status(404); throw new Error("Faculty profile not found"); }
    card = await buildFacultyCard(faculty);
  } else {
    res.status(400);
    throw new Error("ID cards are only available for students and faculty");
  }

  const qrBuffer = await generateQrBuffer(card.verifyUrl);
  const doc = new PDFDocument({ size: [242, 380], margin: 14 }); // roughly credit-card-ish proportions, portrait
  doc.rect(0, 0, 242, 380).fill("#101828");
  doc.fillColor("#fff").fontSize(12).text(card.collegeName, 14, 16, { width: 214, align: "center" });
  doc.fontSize(8).fillColor("#bbb").text(card.kind === "student" ? "STUDENT ID" : "FACULTY ID", { align: "center" });
  doc.moveDown(1);
  doc.fillColor("#fff").fontSize(13).text(card.name, { align: "center" });
  doc.fontSize(9).fillColor("#ccc");
  if (card.kind === "student") {
    doc.text(`Roll No: ${card.rollNumber}`, { align: "center" });
    doc.text(`${card.branch || ""} - Year ${card.year}, Sem ${card.semester}`, { align: "center" });
  } else {
    doc.text(`Employee ID: ${card.employeeId}`, { align: "center" });
    doc.text(`${card.department || ""} - ${card.designation || ""}`, { align: "center" });
  }
  doc.image(qrBuffer, 71, 260, { width: 100 });

  const buffer = await renderToBuffer(doc);
  res.set({ "Content-Type": "application/pdf", "Content-Disposition": "inline; filename=id-card.pdf" });
  res.send(buffer);
});

module.exports = { getMyIdCard, verifyId, getMyIdCardPdf };
