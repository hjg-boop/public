const jwt = require("jsonwebtoken");
const asyncHandler = require("express-async-handler");
const User = require("../models/User");

// Verifies the JWT and attaches the authenticated user to req.user.
// The role always comes from the database, never from the token or the client.
const protect = asyncHandler(async (req, res, next) => {
  let token;
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.split(" ")[1];
  }

  if (!token) {
    res.status(401);
    throw new Error("Unauthorized");
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    res.status(401);
    throw new Error("Session expired. Please log in again.");
  }

  const user = await User.findById(decoded.id);
  if (!user) {
    res.status(401);
    throw new Error("Unauthorized");
  }
  if (user.status === "inactive") {
    res.status(403);
    throw new Error("This account has been deactivated. Contact the administrator.");
  }

  req.user = user;
  next();
});

// Exact role-list match. There is no role hierarchy any more: admin is a
// plain role like any other, so a route that should allow both admin and hod
// lists both explicitly - authorize("admin", "hod") - rather than relying on
// one role silently including another. Department/ownership scoping within
// that is each controller's job (see utils/scope.js).
const authorize = (...roles) => {
  const allowed = new Set(roles);
  return (req, res, next) => {
    if (!req.user || !allowed.has(req.user.role)) {
      res.status(403);
      throw new Error("Access denied");
    }
    next();
  };
};

module.exports = { protect, authorize };
