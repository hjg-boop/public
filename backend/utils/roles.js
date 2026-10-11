// admin is the sole top-level role now (no super_admin tier above it).
const isAdminRole = (role) => role === "admin";

// HOD and Admin are the two roles that manage a department's data, but HOD
// is always scoped to their own department - callers must still apply that
// scope (see utils/scope.js) even when this returns true.
const isAdminOrHod = (role) => role === "admin" || role === "hod";

module.exports = { isAdminRole, isAdminOrHod };
