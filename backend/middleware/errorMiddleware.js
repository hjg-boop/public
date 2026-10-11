const notFound = (req, res, next) => {
  res.status(404);
  next(new Error("Route not found"));
};

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  const isProd = process.env.NODE_ENV === "production";
  let statusCode = err.statusCode || (res.statusCode && res.statusCode !== 200 ? res.statusCode : 500);
  let message = err.message || "Server error";

  if (err.name === "CastError") {
    statusCode = 404;
    message = "Resource not found";
  } else if (err.code === 11000) {
    statusCode = 400;
    const field = Object.keys(err.keyValue || {})[0];
    message = field === "email" ? "Email already exists"
      : field === "rollNumber" ? "Roll number already exists"
      : `Duplicate value for ${field || "a unique field"}`;
  } else if (err.name === "ValidationError") {
    statusCode = 400;
    message = Object.values(err.errors).map((v) => v.message).join(", ");
  } else if (err.type === "entity.parse.failed") {
    statusCode = 400;
    message = "Invalid request body";
  }

  // Never leak internals (DB errors, stack traces) for unexpected server errors in production.
  if (statusCode >= 500) {
    console.error(err);
    if (isProd) message = "Something went wrong. Please try again.";
  }

  res.status(statusCode).json({
    success: false,
    message,
    stack: isProd ? undefined : err.stack,
  });
};

module.exports = { notFound, errorHandler };
