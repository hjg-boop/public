const path = require("path");

// Allowlist approach: anything not listed here (exe, bat, sh, js, svg, html ...) is rejected.
// We check extension + declared MIME type + the file's real "magic bytes".
const startsWith = (buf, bytes) => bytes.every((b, i) => buf[i] === b);
const isZip = (b) => startsWith(b, [0x50, 0x4b, 0x03, 0x04]);
const isOle = (b) => startsWith(b, [0xd0, 0xcf, 0x11, 0xe0]);

const TYPES = {
  ".pdf": { mimes: ["application/pdf"], magic: (b) => startsWith(b, [0x25, 0x50, 0x44, 0x46]) },
  ".doc": { mimes: ["application/msword"], magic: isOle },
  ".docx": { mimes: ["application/vnd.openxmlformats-officedocument.wordprocessingml.document"], magic: isZip },
  ".ppt": { mimes: ["application/vnd.ms-powerpoint"], magic: isOle },
  ".pptx": { mimes: ["application/vnd.openxmlformats-officedocument.presentationml.presentation"], magic: isZip },
  ".jpg": { mimes: ["image/jpeg"], magic: (b) => startsWith(b, [0xff, 0xd8, 0xff]) },
  ".jpeg": { mimes: ["image/jpeg"], magic: (b) => startsWith(b, [0xff, 0xd8, 0xff]) },
  ".png": { mimes: ["image/png"], magic: (b) => startsWith(b, [0x89, 0x50, 0x4e, 0x47]) },
  ".gif": { mimes: ["image/gif"], magic: (b) => startsWith(b, [0x47, 0x49, 0x46, 0x38]) },
  ".webp": {
    mimes: ["image/webp"],
    magic: (b) => b.slice(0, 4).toString() === "RIFF" && b.slice(8, 12).toString() === "WEBP",
  },
  ".xlsx": { mimes: ["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"], magic: isZip },
  ".xls": { mimes: ["application/vnd.ms-excel"], magic: isOle },
  ".csv": { mimes: ["text/csv", "application/vnd.ms-excel", "text/plain"], magic: () => true },
};

const KINDS = {
  document: { exts: [".pdf", ".doc", ".docx", ".ppt", ".pptx"], maxMB: 25 },
  image: { exts: [".jpg", ".jpeg", ".png", ".webp", ".gif"], maxMB: 5 },
  spreadsheet: { exts: [".xlsx", ".xls", ".csv"], maxMB: 5 },
};

const kindLabel = (kind) => KINDS[kind].exts.map((e) => e.slice(1).toUpperCase()).join(", ");

// Cheap pre-check used by multer's fileFilter (before the file is read).
const checkNameAndMime = (file, kind) => {
  const cfg = KINDS[kind];
  const ext = path.extname(file.originalname || "").toLowerCase();
  if (!cfg.exts.includes(ext) || !TYPES[ext].mimes.includes(file.mimetype)) {
    return `Invalid file type. Allowed: ${kindLabel(kind)}.`;
  }
  return null;
};

// Full check once the bytes are in memory. Returns an error string or null.
const checkContent = (file, kind) => {
  const cfg = KINDS[kind];
  const ext = path.extname(file.originalname || "").toLowerCase();
  if (!cfg.exts.includes(ext)) return `Invalid file type. Allowed: ${kindLabel(kind)}.`;
  if (file.size > cfg.maxMB * 1024 * 1024) return `File too large. Maximum size is ${cfg.maxMB}MB.`;
  if (!file.buffer || file.buffer.length < 4 || !TYPES[ext].magic(file.buffer)) {
    return "File content does not match its type. The file may be corrupted or renamed.";
  }
  return null;
};

module.exports = { KINDS, checkNameAndMime, checkContent };
