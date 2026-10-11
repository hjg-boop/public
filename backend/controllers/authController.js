const asyncHandler = require("express-async-handler");
const crypto = require("crypto");
const User = require("../models/User");
const Student = require("../models/Student");
const Faculty = require("../models/Faculty");
const generateToken = require("../utils/generateToken");
const { logActivity } = require("../utils/activity");

// @desc    Login. The user does NOT choose a role - we look up the identifier
//          (roll number OR email) and read the role from the database.
// @route   POST /api/auth/login
// @access  Public
const login = asyncHandler(async (req, res) => {
  const { identifier, password } = req.body;

  if (!identifier || !password) {
    res.status(400);
    throw new Error("Please enter your email/roll number and password");
  }

  const raw = identifier.trim();
  let user;

  // Roll numbers don't contain "@"; email addresses always do. This lets one
  // field serve both students (roll number) and staff (email) with zero
  // role selection, while the backend still decides who "identifier" is.
  if (!raw.includes("@")) {
    const student = await Student.findOne({ rollNumber: raw.toUpperCase() });
    user = student ? await User.findById(student.user).select("+password") : null;
  } else {
    user = await User.findOne({ email: raw.toLowerCase() }).select("+password");
  }

  if (!user) {
    res.status(401);
    throw new Error("Invalid credentials");
  }
  if (user.status === "inactive") {
    res.status(403);
    throw new Error("This account has been deactivated. Contact the administrator.");
  }

  const isMatch = await user.matchPassword(password);
  if (!isMatch) {
    res.status(401);
    throw new Error("Invalid credentials");
  }

  user.lastLoginAt = new Date();
  await user.save();

  let profile = null;
  if (user.role === "student") {
    profile = await Student.findOne({ user: user._id }).populate("branch");
  } else if (user.role === "faculty") {
    profile = await Faculty.findOne({ user: user._id }).populate("department");
  }

  await logActivity(req, { user, action: "Logged in", module: "auth" });

  res.json({
    success: true,
    message: "Login successful",
    data: {
      token: generateToken(user._id, user.role),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        photo: user.photo,
      },
      profile,
    },
  });
});

// @desc    Get currently logged in user
// @route   GET /api/auth/me
const getMe = asyncHandler(async (req, res) => {
  const user = req.user;
  let profile = null;
  if (user.role === "student") {
    profile = await Student.findOne({ user: user._id }).populate("branch");
  } else if (user.role === "faculty") {
    profile = await Faculty.findOne({ user: user._id }).populate("department");
  }

  res.json({
    success: true,
    message: "OK",
    data: {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        photo: user.photo,
      },
      profile,
    },
  });
});

// @desc    Change my own password (any logged-in role)
// @route   PUT /api/auth/change-password
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    res.status(400);
    throw new Error("Current and new password are required");
  }
  if (newPassword.length < 6) {
    res.status(400);
    throw new Error("New password must be at least 6 characters");
  }
  const user = await User.findById(req.user._id).select("+password");
  const ok = await user.matchPassword(currentPassword);
  if (!ok) {
    res.status(401);
    throw new Error("Current password is incorrect");
  }
  user.password = newPassword;
  await user.save();
  await logActivity(req, { action: "Changed password", module: "auth" });
  res.json({ success: true, message: "Password updated", data: {} });
});

// @desc    Request a password reset. Always responds the same way whether or
//          not the email exists, so login emails can't be enumerated.
// @route   POST /api/auth/forgot-password
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const generic = { success: true, message: "If that account exists, a reset link has been generated.", data: {} };
  if (!email) return res.json(generic);

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) return res.json(generic);

  const token = crypto.randomBytes(32).toString("hex");
  user.resetTokenHash = crypto.createHash("sha256").update(token).digest("hex");
  user.resetTokenExpires = new Date(Date.now() + 30 * 60 * 1000); // 30 min
  await user.save();

  // No email service is wired up yet, so the reset link is returned directly
  // in non-production so the flow is usable end-to-end during development.
  const resetUrl = `${process.env.CLIENT_URL?.split(",")[0] || "http://localhost:5173"}/reset-password/${token}`;
  if (process.env.NODE_ENV !== "production") {
    console.log(`Password reset link for ${user.email}: ${resetUrl}`);
    return res.json({ ...generic, data: { devResetUrl: resetUrl } });
  }
  res.json(generic);
});

// @desc    Complete a password reset with the token from the email/link.
// @route   POST /api/auth/reset-password/:token
const resetPassword = asyncHandler(async (req, res) => {
  const { password } = req.body;
  if (!password || password.length < 6) {
    res.status(400);
    throw new Error("Password must be at least 6 characters");
  }
  const tokenHash = crypto.createHash("sha256").update(req.params.token).digest("hex");
  const user = await User.findOne({ resetTokenHash: tokenHash, resetTokenExpires: { $gt: new Date() } }).select(
    "+resetTokenHash +resetTokenExpires"
  );
  if (!user) {
    res.status(400);
    throw new Error("This reset link is invalid or has expired");
  }
  user.password = password;
  user.resetTokenHash = undefined;
  user.resetTokenExpires = undefined;
  await user.save();
  res.json({ success: true, message: "Password reset. You can now log in.", data: {} });
});

// @desc    Upload/replace my own profile photo (multipart, field "photo")
// @route   POST /api/auth/photo
const uploadMyPhoto = asyncHandler(async (req, res) => {
  if (!req.file) {
    res.status(400);
    throw new Error("An image file is required");
  }
  const { storeFile, deleteStoredFile } = require("../services/fileStorage");
  const user = await User.findById(req.user._id);
  if (user.photo?.publicId) await deleteStoredFile(user.photo);
  const stored = await storeFile(req, {
    buffer: req.file.buffer,
    originalName: req.file.originalname,
    mimeType: req.file.mimetype,
    folder: "profile-photos",
  });
  user.photo = { url: stored.url, publicId: stored.publicId };
  await user.save();
  res.json({ success: true, message: "Profile photo updated", data: user.photo });
});

module.exports = { login, getMe, changePassword, forgotPassword, resetPassword, uploadMyPhoto };
