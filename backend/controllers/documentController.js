const asyncHandler = require("express-async-handler");
const Document = require("../models/Document");
const { storeFile, deleteStoredFile } = require("../services/fileStorage");
const { isAdminRole } = require("../utils/roles");
const { logActivity } = require("../utils/activity");

const populateOpts = [
  { path: "subject" },
  { path: "branch" },
  { path: "uploadedBy", select: "name role" },
];

// @desc  Get documents, with search + filters
// @route GET /api/documents
const getDocuments = asyncHandler(async (req, res) => {
  const { search, subject, branch, year, semester, category, unit } = req.query;
  const filter = {};
  if (subject) filter.subject = subject;
  if (branch) filter.branch = branch;
  if (year) filter.year = Number(year);
  if (semester) filter.semester = Number(semester);
  if (category) filter.category = category;
  if (unit) filter.unit = Number(unit);
  if (search) filter.$text = { $search: search };

  const documents = await Document.find(filter).populate(populateOpts).sort({ createdAt: -1 });
  res.json({ success: true, message: "Documents fetched", data: documents });
});

const getDocumentById = asyncHandler(async (req, res) => {
  const document = await Document.findById(req.params.id).populate(populateOpts);
  if (!document) {
    res.status(404);
    throw new Error("Document not found");
  }
  res.json({ success: true, message: "Document fetched", data: document });
});

// @desc  Upload a new document (multipart/form-data, field name "file")
// @route POST /api/documents
// @access Private (faculty, admin)
const createDocument = asyncHandler(async (req, res) => {
  if (!req.file) {
    res.status(400);
    throw new Error("A file is required");
  }

  const { title, description, category, subject, branch, year, semester, unit } = req.body;
  if (!title || !category || !subject || !branch || !year || !semester) {
    res.status(400);
    throw new Error("Missing required document fields");
  }

  const stored = await storeFile(req, {
    buffer: req.file.buffer,
    originalName: req.file.originalname,
    mimeType: req.file.mimetype,
    folder: "documents",
  });

  const document = await Document.create({
    title,
    description,
    category,
    subject,
    branch,
    year,
    semester,
    unit: unit || undefined,
    fileUrl: stored.url,
    publicId: stored.publicId,
    resourceType: stored.resourceType,
    fileType: req.file.mimetype,
    fileName: req.file.originalname,
    fileSize: req.file.size,
    uploadedBy: req.user._id,
  });

  await logActivity(req, { action: `Uploaded document "${title}"`, module: "documents" });

  const populated = await Document.findById(document._id).populate(populateOpts);
  res.status(201).json({ success: true, message: "Document uploaded", data: populated });
});

// @desc  Update document metadata (not the file itself)
// @route PUT /api/documents/:id
// @access Private (owner faculty or admin)
const updateDocument = asyncHandler(async (req, res) => {
  const document = await Document.findById(req.params.id);
  if (!document) {
    res.status(404);
    throw new Error("Document not found");
  }
  const isOwner = String(document.uploadedBy) === String(req.user._id);
  if (!isAdminRole(req.user.role) && !isOwner) {
    res.status(403);
    throw new Error("Not authorized to edit this document");
  }

  const { title, description, category, subject, branch, year, semester, unit } = req.body;
  if (title !== undefined) document.title = title;
  if (description !== undefined) document.description = description;
  if (category !== undefined) document.category = category;
  if (subject !== undefined) document.subject = subject;
  if (branch !== undefined) document.branch = branch;
  if (year !== undefined) document.year = year;
  if (semester !== undefined) document.semester = semester;
  if (unit !== undefined) document.unit = unit;

  await document.save();
  const populated = await Document.findById(document._id).populate(populateOpts);
  res.json({ success: true, message: "Document updated", data: populated });
});

// @desc  Delete a document (and its stored file)
// @route DELETE /api/documents/:id
// @access Private (owner faculty or admin)
const deleteDocument = asyncHandler(async (req, res) => {
  const document = await Document.findById(req.params.id);
  if (!document) {
    res.status(404);
    throw new Error("Document not found");
  }
  const isOwner = String(document.uploadedBy) === String(req.user._id);
  if (!isAdminRole(req.user.role) && !isOwner) {
    res.status(403);
    throw new Error("Not authorized to delete this document");
  }

  // Delete the DB record only after the file is confirmed gone, so a storage
  // failure never leaves us with a record pointing at nothing (or vice versa).
  await deleteStoredFile({ fileUrl: document.fileUrl, publicId: document.publicId, resourceType: document.resourceType });
  await document.deleteOne();
  await logActivity(req, { action: `Deleted document "${document.title}"`, module: "documents" });
  res.json({ success: true, message: "Document deleted", data: {} });
});

// @desc  Track a download and hand back the file url
// @route GET /api/documents/:id/download
const trackDownload = asyncHandler(async (req, res) => {
  const document = await Document.findById(req.params.id);
  if (!document) {
    res.status(404);
    throw new Error("Document not found");
  }
  document.downloadCount += 1;
  await document.save();
  res.json({ success: true, message: "Download tracked", data: { fileUrl: document.fileUrl } });
});

module.exports = {
  getDocuments,
  getDocumentById,
  createDocument,
  updateDocument,
  deleteDocument,
  trackDownload,
};
