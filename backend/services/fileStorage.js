/**
 * File storage abstraction.
 *
 * Files never go into MongoDB - only metadata (url, publicId, name, size, type).
 *
 *   FILE_STORAGE_PROVIDER=local        -> backend/uploads (development / fallback)
 *   FILE_STORAGE_PROVIDER=cloudinary   -> Cloudinary (signed REST upload, no SDK needed)
 *
 * Old documents uploaded in "local" mode keep working after you switch to Cloudinary:
 * deleteStoredFile() recognises legacy /uploads/ URLs and removes them from disk.
 */
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const UPLOAD_DIR = path.join(__dirname, "..", "uploads");
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const provider = () => (process.env.FILE_STORAGE_PROVIDER || "local").toLowerCase();

// ---- Cloudinary helpers -----------------------------------------------------
const cloudCfg = () => {
  const { CLOUDINARY_CLOUD_NAME: cloud, CLOUDINARY_API_KEY: key, CLOUDINARY_API_SECRET: secret } = process.env;
  if (!cloud || !key || !secret) {
    throw new Error("Cloudinary is not configured (CLOUDINARY_CLOUD_NAME / API_KEY / API_SECRET).");
  }
  return { cloud, key, secret };
};

// Cloudinary signature: sha1 of "k1=v1&k2=v2" (sorted, excluding file/api_key/resource_type) + api_secret
const signParams = (params, secret) => {
  const toSign = Object.keys(params)
    .filter((k) => params[k] !== undefined && params[k] !== "")
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join("&");
  return crypto.createHash("sha1").update(toSign + secret).digest("hex");
};

const cloudinaryUpload = async ({ buffer, originalName, mimeType, folder }) => {
  const { cloud, key, secret } = cloudCfg();
  const timestamp = Math.floor(Date.now() / 1000);
  const rootFolder = process.env.CLOUDINARY_FOLDER || "college";
  const fullFolder = `${rootFolder}/${folder}`;
  const signature = signParams({ folder: fullFolder, timestamp }, secret);

  const form = new FormData();
  form.append("file", new Blob([buffer], { type: mimeType }), originalName);
  form.append("api_key", key);
  form.append("timestamp", String(timestamp));
  form.append("folder", fullFolder);
  form.append("signature", signature);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloud}/auto/upload`, { method: "POST", body: form });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`Cloudinary upload failed: ${data?.error?.message || res.statusText}`);
  return {
    url: data.secure_url,
    publicId: data.public_id,
    resourceType: data.resource_type,
    provider: "cloudinary",
  };
};

const cloudinaryDestroy = async ({ publicId, resourceType }) => {
  const { cloud, key, secret } = cloudCfg();
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = signParams({ public_id: publicId, timestamp }, secret);
  const body = new URLSearchParams({ public_id: publicId, timestamp: String(timestamp), api_key: key, signature });
  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloud}/${resourceType || "image"}/destroy`, {
    method: "POST",
    body,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`Cloudinary delete failed: ${data?.error?.message || res.statusText}`);
  return data.result === "ok" || data.result === "not found";
};

// ---- Local helpers ----------------------------------------------------------
const publicBase = (req) => process.env.PUBLIC_API_URL || `${req.protocol}://${req.get("host")}`;

const localStore = async (req, { buffer, originalName }) => {
  const ext = path.extname(originalName).toLowerCase();
  const safeBase = path.basename(originalName, ext).replace(/[^a-zA-Z0-9-_]/g, "_").slice(0, 60);
  const fileName = `${Date.now()}-${crypto.randomBytes(8).toString("hex")}-${safeBase}${ext}`;
  await fs.promises.writeFile(path.join(UPLOAD_DIR, fileName), buffer);
  return { url: `${publicBase(req)}/uploads/${fileName}`, publicId: fileName, resourceType: "local", provider: "local" };
};

// ---- Public API -------------------------------------------------------------
/** Store a validated in-memory file. Returns { url, publicId, resourceType, provider }. */
const storeFile = async (req, { buffer, originalName, mimeType, folder = "misc" }) => {
  if (provider() === "cloudinary") return cloudinaryUpload({ buffer, originalName, mimeType, folder });
  return localStore(req, { buffer, originalName });
};

/**
 * Delete a stored file. Accepts either a stored record ({ fileUrl|url, publicId, resourceType })
 * or a legacy URL string. Resolves true when the file is gone; THROWS if the storage provider
 * fails, so callers can keep the DB record instead of leaving an orphaned file.
 */
const deleteStoredFile = async (ref) => {
  if (!ref) return true;
  const url = typeof ref === "string" ? ref : ref.fileUrl || ref.url;
  const publicId = typeof ref === "string" ? undefined : ref.publicId;
  const resourceType = typeof ref === "string" ? undefined : ref.resourceType;

  if (url && url.includes("/uploads/")) {
    const fileName = path.basename(url.split("/uploads/")[1]);
    const full = path.join(UPLOAD_DIR, fileName);
    if (fs.existsSync(full)) await fs.promises.unlink(full);
    return true;
  }
  if (publicId && url && url.includes("res.cloudinary.com")) {
    return cloudinaryDestroy({ publicId, resourceType });
  }
  return true; // external / unknown URL: nothing we manage
};

module.exports = { storeFile, deleteStoredFile, signParams, UPLOAD_DIR };
