const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

// No "super_admin" - admin is the top of the hierarchy. hod is scoped to one
// department (see `department` below); faculty/accountant/student are scoped
// to their own assignments/records.
const ROLES = ["admin", "hod", "faculty", "accountant", "student"];

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6, select: false },
    role: { type: String, enum: ROLES, required: true },
    // Only set (and only meaningful) when role === "hod": the one department
    // this HOD is responsible for. Every HOD-scoped query filters through this.
    department: { type: mongoose.Schema.Types.ObjectId, ref: "Department" },
    phone: { type: String, trim: true },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
    photo: { url: String, publicId: String },
    lastLoginAt: { type: Date },
    resetTokenHash: { type: String, select: false },
    resetTokenExpires: { type: Date, select: false },
  },
  { timestamps: true }
);

userSchema.index({ role: 1, status: 1 });
userSchema.index({ name: 1 });
userSchema.index({ department: 1 });

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model("User", userSchema);
User.ROLES = ROLES;
module.exports = User;
