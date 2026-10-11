const multer = require("multer");
const { KINDS, checkNameAndMime, checkContent } = require("../utils/fileValidation");

// All uploads are held in memory, validated (type, size, magic bytes), then handed to
// services/fileStorage (Cloudinary or local disk). Nothing reaches disk unvalidated.
const buildUploader = (kind) =>
  multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: KINDS[kind].maxMB * 1024 * 1024, files: 1 },
    fileFilter: (req, file, cb) => {
      const err = checkNameAndMime(file, kind);
      cb(err ? new Error(err) : null, !err);
    },
  });

const uploaders = {
  document: buildUploader("document"),
  image: buildUploader("image"),
  spreadsheet: buildUploader("spreadsheet"),
};

const singleUpload = (kind) => (fieldName) => (req, res, next) => {
  uploaders[kind].single(fieldName)(req, res, (err) => {
    if (err) {
      const message =
        err.code === "LIMIT_FILE_SIZE"
          ? `File too large. Maximum size is ${KINDS[kind].maxMB}MB.`
          : err.message || "File upload failed";
      return res.status(400).json({ success: false, message });
    }
    if (req.file) {
      const problem = checkContent(req.file, kind);
      if (problem) return res.status(400).json({ success: false, message: problem });
    }
    next();
  });
};

module.exports = {
  singleFileUpload: singleUpload("document"),
  singleImageUpload: singleUpload("image"),
  singleSpreadsheetUpload: singleUpload("spreadsheet"),
};
