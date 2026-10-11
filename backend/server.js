require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });
// also support a backend-local .env for convenience
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const path = require("path");
const cookieParser = require("cookie-parser");

const connectDB = require("./config/db");
const { notFound, errorHandler } = require("./middleware/errorMiddleware");

const authRoutes = require("./routes/authRoutes");
const studentRoutes = require("./routes/studentRoutes");
const facultyRoutes = require("./routes/facultyRoutes");
const departmentRoutes = require("./routes/departmentRoutes");
const branchRoutes = require("./routes/branchRoutes");
const subjectRoutes = require("./routes/subjectRoutes");
const documentRoutes = require("./routes/documentRoutes");
const noticeRoutes = require("./routes/noticeRoutes");
const assignmentRoutes = require("./routes/assignmentRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const userRoutes = require("./routes/userRoutes");
const searchRoutes = require("./routes/searchRoutes");
const activityLogRoutes = require("./routes/activityLogRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const sectionRoutes = require("./routes/sectionRoutes");
const facultyAssignmentRoutes = require("./routes/facultyAssignmentRoutes");
const feeHeadRoutes = require("./routes/feeHeadRoutes");
const settingsRoutes = require("./routes/settingsRoutes");
const academicYearRoutes = require("./routes/academicYearRoutes");
const timetableRoutes = require("./routes/timetableRoutes");
const attendanceRoutes = require("./routes/attendanceRoutes");
const examRoutes = require("./routes/examRoutes");
const marksRoutes = require("./routes/marksRoutes");
const onlineExamRoutes = require("./routes/onlineExamRoutes");
const certificateRoutes = require("./routes/certificateRoutes");
const idCardRoutes = require("./routes/idCardRoutes");
const feeRoutes = require("./routes/feeRoutes");
const transportRoutes = require("./routes/transportRoutes");
const hostelRoutes = require("./routes/hostelRoutes");
const libraryRoutes = require("./routes/libraryRoutes");
const securityHeaders = require("./middleware/securityHeaders");

connectDB();

const app = express();

// ---- Core middleware ----
const allowedOrigins = (process.env.CLIENT_URL || "http://localhost:5173").split(",");
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);
app.use(securityHeaders);
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));
app.use(cookieParser());
if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
}

// Serve uploaded files statically (local storage mode)
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ---- Health check ----
app.get("/api/health", (req, res) => {
  res.json({ success: true, message: "College Portal API is running", data: {} });
});

// ---- API routes ----
app.use("/api/auth", authRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/faculty", facultyRoutes);
app.use("/api/departments", departmentRoutes);
app.use("/api/branches", branchRoutes);
app.use("/api/subjects", subjectRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api/notices", noticeRoutes);
app.use("/api/assignments", assignmentRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/users", userRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/activity-logs", activityLogRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/sections", sectionRoutes);
app.use("/api/faculty-assignments", facultyAssignmentRoutes);
app.use("/api/fee-heads", feeHeadRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/academic-years", academicYearRoutes);
app.use("/api/timetable", timetableRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/exams", examRoutes);
app.use("/api/marks", marksRoutes);
app.use("/api/online-exams", onlineExamRoutes);
app.use("/api/certificates", certificateRoutes);
app.use("/api/id-card", idCardRoutes);
app.use("/api/fees", feeRoutes);
app.use("/api/transport", transportRoutes);
app.use("/api/hostel", hostelRoutes);
app.use("/api/library", libraryRoutes);

// ---- Error handling (must be last) ----
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || "development"} mode on port ${PORT}`);
});
