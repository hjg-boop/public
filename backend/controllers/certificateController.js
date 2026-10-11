const asyncHandler = require("express-async-handler");
const crypto = require("crypto");
const PDFDocument = require("pdfkit");
const Certificate = require("../models/Certificate");
const Student = require("../models/Student");
const { storeFile } = require("../services/fileStorage");
const { renderToBuffer, generateQrBuffer } = require("../utils/pdfHelpers");
const { logActivity } = require("../utils/activity");
const { collegeIdentity } = require("../utils/collegeIdentity");

const populateOpts = [{ path: "student", populate: [{ path: "user", select: "name" }, { path: "branch" }] }];

const getCertificates = asyncHandler(async (req, res) => {
  const certificates = await Certificate.find({}).populate(populateOpts).sort({ createdAt: -1 });
  res.json({ success: true, message: "Certificates fetched", data: certificates });
});

const getMyCertificates = asyncHandler(async (req, res) => {
  const student = await Student.findOne({ user: req.user._id });
  if (!student) return res.json({ success: true, message: "Certificates fetched", data: [] });
  const certificates = await Certificate.find({ student: student._id }).sort({ createdAt: -1 });
  res.json({ success: true, message: "Certificates fetched", data: certificates });
});

// @desc  Generate a certificate PDF for a student and store it.
// @route POST /api/certificates
// @access Admin
const createCertificate = asyncHandler(async (req, res) => {
  const { studentId, type, purpose } = req.body;
  if (!studentId || !type) { res.status(400); throw new Error("studentId and type are required"); }

  const student = await Student.findById(studentId).populate("user", "name").populate("branch");
  if (!student) { res.status(404); throw new Error("Student not found"); }

  const certificateNumber = `CERT-${new Date().getFullYear()}-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
  const verificationCode = crypto.randomBytes(12).toString("hex");
  const verifyUrl = `${process.env.CLIENT_URL?.split(",")[0] || "http://localhost:5173"}/verify/${verificationCode}`;

  const qrBuffer = await generateQrBuffer(verifyUrl);

  const doc = new PDFDocument({ size: "A4", margin: 60 });
  const college = await collegeIdentity();
  doc.fontSize(20).text(college.name, { align: "center" });
  doc.moveDown(0.3).fontSize(12).fillColor("#555").text(college.address || "", { align: "center" });
  doc.moveDown(2).fillColor("#000").fontSize(22).text(type.toUpperCase(), { align: "center", underline: true });
  doc.moveDown(2).fontSize(13);
  doc.text(
    `This is to certify that ${student.user.name}, bearing roll number ${student.rollNumber}, ` +
      `is/was a bona fide student of the ${student.branch?.name || "college"} branch, currently in Year ${student.year}, Semester ${student.semester}.`,
    { align: "left", lineGap: 6 }
  );
  if (purpose) doc.moveDown(1).text(`Purpose: ${purpose}`);
  doc.moveDown(1).text(`Certificate No: ${certificateNumber}`);
  doc.text(`Issue Date: ${new Date().toLocaleDateString()}`);

  doc.moveDown(3);
  const qrY = doc.y;
  doc.image(qrBuffer, 60, qrY, { width: 90 });
  doc.fontSize(9).text("Scan to verify", 60, qrY + 92);
  doc.fontSize(13).text("Authorized Signature", 400, qrY + 50, { align: "left" });
  doc.moveTo(400, qrY + 45).lineTo(530, qrY + 45).stroke();

  const pdfBuffer = await renderToBuffer(doc);
  const stored = await storeFile(req, {
    buffer: pdfBuffer,
    originalName: `${certificateNumber}.pdf`,
    mimeType: "application/pdf",
    folder: "certificates",
  });

  const certificate = await Certificate.create({
    student: student._id,
    type,
    certificateNumber,
    purpose,
    fileUrl: stored.url,
    publicId: stored.publicId,
    verificationCode,
    issuedBy: req.user._id,
  });

  await logActivity(req, { action: `Issued ${type} certificate for ${student.user.name}`, module: "certificates" });
  res.status(201).json({ success: true, message: "Certificate generated", data: certificate });
});

// @desc  Public verification - only shows that a certificate is genuine, not
//        marks/attendance/other private student data.
const verifyCertificate = asyncHandler(async (req, res) => {
  const certificate = await Certificate.findOne({ verificationCode: req.params.code }).populate({
    path: "student",
    populate: [{ path: "user", select: "name" }, { path: "branch" }],
  });
  if (!certificate) {
    return res.json({ success: true, message: "Not found", data: { valid: false } });
  }
  res.json({
    success: true,
    message: "Certificate verified",
    data: {
      valid: true,
      type: certificate.type,
      certificateNumber: certificate.certificateNumber,
      issueDate: certificate.issueDate,
      studentName: certificate.student.user.name,
      branch: certificate.student.branch?.name,
    },
  });
});

module.exports = { getCertificates, getMyCertificates, createCertificate, verifyCertificate };
