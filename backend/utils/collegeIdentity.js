const CollegeSettings = require("../models/CollegeSettings");

// Shared by certificates, ID cards and fee receipts. Prefers what Admin has
// set in Settings; falls back to the COLLEGE_NAME/COLLEGE_ADDRESS env vars
// so PDFs still look reasonable before Settings has been configured.
const collegeIdentity = async () => {
  const settings = await CollegeSettings.findOne({ singleton: "main" });
  return {
    name: settings?.collegeName || process.env.COLLEGE_NAME || "Your College Name",
    address: settings?.address || process.env.COLLEGE_ADDRESS || "",
    email: settings?.email || process.env.COLLEGE_EMAIL || "",
    phone: settings?.phone || process.env.COLLEGE_PHONE || "",
    logo: settings?.logo || null, // { url, publicId } uploaded in Admin > Settings
  };
};

module.exports = { collegeIdentity };
