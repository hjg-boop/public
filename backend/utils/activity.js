const ActivityLog = require("../models/ActivityLog");

const parseDevice = (ua = "") => {
  const browser = /Edg\//.test(ua) ? "Edge" : /Chrome\//.test(ua) ? "Chrome" : /Firefox\//.test(ua)
    ? "Firefox" : /Safari\//.test(ua) ? "Safari" : "Unknown browser";
  const os = /Windows/.test(ua) ? "Windows" : /Android/.test(ua) ? "Android" : /iPhone|iPad/.test(ua)
    ? "iOS" : /Mac OS/.test(ua) ? "macOS" : /Linux/.test(ua) ? "Linux" : "Unknown OS";
  return `${browser} on ${os}`;
};

// Never throws: logging must not break the request that triggered it.
const logActivity = async (req, { user, action, module }) => {
  try {
    const actor = user || req.user;
    if (!actor) return;
    await ActivityLog.create({
      user: actor._id,
      userName: actor.name,
      role: actor.role,
      action,
      module,
      method: req.method,
      path: (req.originalUrl || "").split("?")[0].slice(0, 200), // no query strings (may hold tokens)
      ip: req.ip,
      device: parseDevice(req.headers["user-agent"]),
    });
  } catch (err) {
    console.error("Activity log failed:", err.message);
  }
};

// Route middleware: records the action only if the request succeeded.
//   router.post("/", audit("students", "Created a student"), createStudent)
const audit = (module, action) => (req, res, next) => {
  res.on("finish", () => {
    if (res.statusCode < 400 && req.user) logActivity(req, { action, module });
  });
  next();
};

module.exports = { logActivity, audit };
