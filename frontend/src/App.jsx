import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";

import Home from "./pages/Home";
import About from "./pages/About";
import FeeDetails from "./pages/FeeDetails";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import VerifyCertificate from "./pages/VerifyCertificate";
import VerifyId from "./pages/VerifyId";

// Shared (used by more than one role)
import MyTimetable from "./pages/shared/MyTimetable";
import MyIdCard from "./pages/shared/MyIdCard";

// Student
import StudentDashboard from "./pages/student/StudentDashboard";
import StudentProfile from "./pages/student/StudentProfile";
import StudentSubjects from "./pages/student/StudentSubjects";
import StudentDocuments from "./pages/student/StudentDocuments";
import StudentAttendance from "./pages/student/StudentAttendance";
import StudentAssignments from "./pages/student/StudentAssignments";
import StudentExams from "./pages/student/StudentExams";
import StudentOnlineExams from "./pages/student/StudentOnlineExams";
import StudentResults from "./pages/student/StudentResults";
import StudentFees from "./pages/student/StudentFees";
import StudentReceipts from "./pages/student/StudentReceipts";
import StudentCertificates from "./pages/student/StudentCertificates";
import StudentNotices from "./pages/student/StudentNotices";
import StudentFaculty from "./pages/student/StudentFaculty";

// Faculty
import FacultyDashboard from "./pages/faculty/FacultyDashboard";
import FacultyMyClasses from "./pages/faculty/FacultyMyClasses";
import FacultySubjects from "./pages/faculty/FacultySubjects";
import FacultyAttendance from "./pages/faculty/FacultyAttendance";
import FacultyDocuments from "./pages/faculty/FacultyDocuments";
import FacultyAssignments from "./pages/faculty/FacultyAssignments";
import FacultyOnlineExams from "./pages/faculty/FacultyOnlineExams";
import FacultyMarks from "./pages/faculty/FacultyMarks";
import FacultyProfile from "./pages/faculty/FacultyProfile";
import FacultyNotices from "./pages/faculty/FacultyNotices";
import FacultyStudents from "./pages/faculty/FacultyStudents";

// HOD
import HodDashboard from "./pages/hod/HodDashboard";
import HodStudents from "./pages/hod/HodStudents";
import HodFaculty from "./pages/hod/HodFaculty";
import HodSubjects from "./pages/hod/HodSubjects";
import HodAttendance from "./pages/hod/HodAttendance";
import HodResults from "./pages/hod/HodResults";
import HodReports from "./pages/hod/HodReports";

// Accountant
import AccountantDashboard from "./pages/accountant/AccountantDashboard";
import AccountantStudents from "./pages/accountant/AccountantStudents";
import AccountantFeeStructure from "./pages/accountant/AccountantFeeStructure";
import AccountantCollectFees from "./pages/accountant/AccountantCollectFees";
import AccountantPaymentHistory from "./pages/accountant/AccountantPaymentHistory";
import AccountantReceipts from "./pages/accountant/AccountantReceipts";
import AccountantStudentFees from "./pages/accountant/AccountantStudentFees";

// Admin
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminStudents from "./pages/admin/AdminStudents";
import AdminFaculty from "./pages/admin/AdminFaculty";
import AdminDepartments from "./pages/admin/AdminDepartments";
import AdminYearsSemesters from "./pages/admin/AdminYearsSemesters";
import AdminSections from "./pages/admin/AdminSections";
import AdminSubjects from "./pages/admin/AdminSubjects";
import AdminHodManagement from "./pages/admin/AdminHodManagement";
import AdminAcademicManagement from "./pages/admin/AdminAcademicManagement";
import AdminExams from "./pages/admin/AdminExams";
import AdminResults from "./pages/admin/AdminResults";
import AdminTimetable from "./pages/admin/AdminTimetable";
import AdminNotices from "./pages/admin/AdminNotices";
import AdminReports from "./pages/admin/AdminReports";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminDocuments from "./pages/admin/AdminDocuments";
import AdminCertificates from "./pages/admin/AdminCertificates";

function App() {
  return (
    <Routes>
      {/* Public pages - each is its own route */}
      <Route path="/" element={<Home />} />
      <Route path="/about" element={<About />} />
      <Route path="/fee-details" element={<FeeDetails />} />
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password/:token" element={<ResetPassword />} />
      <Route path="/verify/:code" element={<VerifyCertificate />} />
      <Route path="/verify-id/:kind/:id/:code" element={<VerifyId />} />

      {/* Student */}
      <Route path="/student" element={<ProtectedRoute roles={["student"]}><StudentDashboard /></ProtectedRoute>} />
      <Route path="/student/profile" element={<ProtectedRoute roles={["student"]}><StudentProfile /></ProtectedRoute>} />
      <Route path="/student/subjects" element={<ProtectedRoute roles={["student"]}><StudentSubjects /></ProtectedRoute>} />
      <Route path="/student/timetable" element={<ProtectedRoute roles={["student"]}><MyTimetable /></ProtectedRoute>} />
      <Route path="/student/attendance" element={<ProtectedRoute roles={["student"]}><StudentAttendance /></ProtectedRoute>} />
      <Route path="/student/materials" element={<ProtectedRoute roles={["student"]}><StudentDocuments /></ProtectedRoute>} />
      <Route path="/student/assignments" element={<ProtectedRoute roles={["student"]}><StudentAssignments /></ProtectedRoute>} />
      <Route path="/student/exams" element={<ProtectedRoute roles={["student"]}><StudentExams /></ProtectedRoute>} />
      <Route path="/student/online-exams" element={<ProtectedRoute roles={["student"]}><StudentOnlineExams /></ProtectedRoute>} />
      <Route path="/student/results" element={<ProtectedRoute roles={["student"]}><StudentResults /></ProtectedRoute>} />
      <Route path="/student/fees" element={<ProtectedRoute roles={["student"]}><StudentFees /></ProtectedRoute>} />
      <Route path="/student/receipts" element={<ProtectedRoute roles={["student"]}><StudentReceipts /></ProtectedRoute>} />
      <Route path="/student/id-card" element={<ProtectedRoute roles={["student"]}><MyIdCard /></ProtectedRoute>} />
      <Route path="/student/certificates" element={<ProtectedRoute roles={["student"]}><StudentCertificates /></ProtectedRoute>} />
      <Route path="/student/notices" element={<ProtectedRoute roles={["student"]}><StudentNotices /></ProtectedRoute>} />
      <Route path="/student/faculty" element={<ProtectedRoute roles={["student"]}><StudentFaculty /></ProtectedRoute>} />

      {/* Faculty */}
      <Route path="/faculty" element={<ProtectedRoute roles={["faculty"]}><FacultyDashboard /></ProtectedRoute>} />
      <Route path="/faculty/classes" element={<ProtectedRoute roles={["faculty"]}><FacultyMyClasses /></ProtectedRoute>} />
      <Route path="/faculty/subjects" element={<ProtectedRoute roles={["faculty"]}><FacultySubjects /></ProtectedRoute>} />
      <Route path="/faculty/timetable" element={<ProtectedRoute roles={["faculty"]}><MyTimetable /></ProtectedRoute>} />
      <Route path="/faculty/attendance" element={<ProtectedRoute roles={["faculty"]}><FacultyAttendance /></ProtectedRoute>} />
      <Route path="/faculty/materials" element={<ProtectedRoute roles={["faculty"]}><FacultyDocuments /></ProtectedRoute>} />
      <Route path="/faculty/assignments" element={<ProtectedRoute roles={["faculty"]}><FacultyAssignments /></ProtectedRoute>} />
      <Route path="/faculty/online-exams" element={<ProtectedRoute roles={["faculty"]}><FacultyOnlineExams /></ProtectedRoute>} />
      <Route path="/faculty/marks" element={<ProtectedRoute roles={["faculty"]}><FacultyMarks /></ProtectedRoute>} />
      <Route path="/faculty/profile" element={<ProtectedRoute roles={["faculty"]}><FacultyProfile /></ProtectedRoute>} />
      <Route path="/faculty/notices" element={<ProtectedRoute roles={["faculty"]}><FacultyNotices /></ProtectedRoute>} />
      <Route path="/faculty/students" element={<ProtectedRoute roles={["faculty"]}><FacultyStudents /></ProtectedRoute>} />

      {/* HOD - department-scoped, enforced server-side */}
      <Route path="/hod" element={<ProtectedRoute roles={["hod"]}><HodDashboard /></ProtectedRoute>} />
      <Route path="/hod/students" element={<ProtectedRoute roles={["hod"]}><HodStudents /></ProtectedRoute>} />
      <Route path="/hod/faculty" element={<ProtectedRoute roles={["hod"]}><HodFaculty /></ProtectedRoute>} />
      <Route path="/hod/subjects" element={<ProtectedRoute roles={["hod"]}><HodSubjects /></ProtectedRoute>} />
      <Route path="/hod/sections" element={<ProtectedRoute roles={["hod"]}><AdminSections /></ProtectedRoute>} />
      <Route path="/hod/attendance" element={<ProtectedRoute roles={["hod"]}><HodAttendance /></ProtectedRoute>} />
      <Route path="/hod/timetable" element={<ProtectedRoute roles={["hod"]}><AdminTimetable /></ProtectedRoute>} />
      <Route path="/hod/exams" element={<ProtectedRoute roles={["hod"]}><AdminExams /></ProtectedRoute>} />
      <Route path="/hod/results" element={<ProtectedRoute roles={["hod"]}><HodResults /></ProtectedRoute>} />
      <Route path="/hod/reports" element={<ProtectedRoute roles={["hod"]}><HodReports /></ProtectedRoute>} />

      {/* Accountant */}
      <Route path="/accountant" element={<ProtectedRoute roles={["accountant"]}><AccountantDashboard /></ProtectedRoute>} />
      <Route path="/accountant/students" element={<ProtectedRoute roles={["accountant"]}><AccountantStudents /></ProtectedRoute>} />
      <Route path="/accountant/fee-structure" element={<ProtectedRoute roles={["accountant"]}><AccountantFeeStructure /></ProtectedRoute>} />
      <Route path="/accountant/collect-fees" element={<ProtectedRoute roles={["accountant"]}><AccountantCollectFees /></ProtectedRoute>} />
      <Route path="/accountant/payment-history" element={<ProtectedRoute roles={["accountant"]}><AccountantPaymentHistory /></ProtectedRoute>} />
      <Route path="/accountant/receipts" element={<ProtectedRoute roles={["accountant"]}><AccountantReceipts /></ProtectedRoute>} />
      <Route path="/accountant/students/:studentId" element={<ProtectedRoute roles={["accountant"]}><AccountantStudentFees /></ProtectedRoute>} />

      {/* Admin */}
      <Route path="/admin" element={<ProtectedRoute roles={["admin"]}><AdminDashboard /></ProtectedRoute>} />
      <Route path="/admin/students" element={<ProtectedRoute roles={["admin"]}><AdminStudents /></ProtectedRoute>} />
      <Route path="/admin/faculty" element={<ProtectedRoute roles={["admin"]}><AdminFaculty /></ProtectedRoute>} />
      <Route path="/admin/departments" element={<ProtectedRoute roles={["admin"]}><AdminDepartments /></ProtectedRoute>} />
      <Route path="/admin/years-semesters" element={<ProtectedRoute roles={["admin"]}><AdminYearsSemesters /></ProtectedRoute>} />
      <Route path="/admin/sections" element={<ProtectedRoute roles={["admin"]}><AdminSections /></ProtectedRoute>} />
      <Route path="/admin/subjects" element={<ProtectedRoute roles={["admin"]}><AdminSubjects /></ProtectedRoute>} />
      <Route path="/admin/hod-management" element={<ProtectedRoute roles={["admin"]}><AdminHodManagement /></ProtectedRoute>} />
      <Route path="/admin/academic-management" element={<ProtectedRoute roles={["admin"]}><AdminAcademicManagement /></ProtectedRoute>} />
      <Route path="/admin/exams" element={<ProtectedRoute roles={["admin"]}><AdminExams /></ProtectedRoute>} />
      <Route path="/admin/results" element={<ProtectedRoute roles={["admin"]}><AdminResults /></ProtectedRoute>} />
      <Route path="/admin/timetable" element={<ProtectedRoute roles={["admin"]}><AdminTimetable /></ProtectedRoute>} />
      <Route path="/admin/notices" element={<ProtectedRoute roles={["admin"]}><AdminNotices /></ProtectedRoute>} />
      <Route path="/admin/reports" element={<ProtectedRoute roles={["admin"]}><AdminReports /></ProtectedRoute>} />
      <Route path="/admin/settings" element={<ProtectedRoute roles={["admin"]}><AdminSettings /></ProtectedRoute>} />
      {/* Not in the sidebar (Admin's list is deliberately short per spec) but
          kept reachable - materials/certificates still need somewhere to live. */}
      <Route path="/admin/materials" element={<ProtectedRoute roles={["admin"]}><AdminDocuments /></ProtectedRoute>} />
      <Route path="/admin/fees" element={<ProtectedRoute roles={["admin"]}><AccountantStudents /></ProtectedRoute>} />
      <Route path="/admin/fees/:studentId" element={<ProtectedRoute roles={["admin"]}><AccountantStudentFees /></ProtectedRoute>} />
      <Route path="/admin/collect-fees" element={<ProtectedRoute roles={["admin"]}><AccountantCollectFees /></ProtectedRoute>} />
      <Route path="/admin/certificates" element={<ProtectedRoute roles={["admin"]}><AdminCertificates /></ProtectedRoute>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
