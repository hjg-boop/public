import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import DashboardLayout from "../../layouts/DashboardLayout";
import api, { apiErrorMessage } from "../../services/api";
import { useToast } from "../../context/ToastContext";

const Card = ({ label, value }) => (
  <div className="card" style={{ padding: 20 }}>
    <div style={{ fontSize: 26, fontWeight: 700, fontFamily: "var(--font-display)" }}>{value}</div>
    <div style={{ color: "var(--grey-700)", fontSize: 13.5 }}>{label}</div>
  </div>
);

const HodDashboard = () => {
  const [stats, setStats] = useState(null);
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    Promise.all([api.get("/dashboard/hod-stats"), api.get("/attendance/department-overview")])
      .then(([s, o]) => { setStats(s.data.data); setOverview(o.data.data); })
      .catch((err) => showToast(apiErrorMessage(err), "error"))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) return <DashboardLayout title="Dashboard"><div className="loading-state"><span className="spinner" /></div></DashboardLayout>;

  return (
    <DashboardLayout title="Dashboard">
      <div className="page-header"><div><h2>Department Overview</h2><p>Your department only.</p></div></div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 16, marginBottom: 32 }}>
        <Card label="Total Students" value={stats?.totalStudents ?? 0} />
        <Card label="Total Faculty" value={stats?.totalFaculty ?? 0} />
        <Card label="Total Subjects" value={stats?.totalSubjects ?? 0} />
        <Card label="Total Sections" value={stats?.totalSections ?? 0} />
        <Card label="Present Today" value={overview?.presentToday ?? 0} />
        <Card label="Absent Today" value={overview?.absentToday ?? 0} />
      </div>

      <div className="page-header">
        <h3 style={{ margin: 0 }}>Students below {overview?.threshold ?? 75}% attendance</h3>
        <Link to="/hod/attendance" className="btn btn-secondary btn-sm">View full list & download</Link>
      </div>
      <table className="data-table">
        <thead><tr><th>Roll No</th><th>Name</th><th>Attendance</th></tr></thead>
        <tbody>
          {(overview?.lowAttendanceStudents || []).slice(0, 5).map((row) => (
            <tr key={row.student._id}>
              <td>{row.student.rollNumber}</td>
              <td>{row.student.user?.name}</td>
              <td style={{ color: "var(--danger, #c0392b)" }}>{row.percentage}%</td>
            </tr>
          ))}
          {(!overview?.lowAttendanceStudents || overview.lowAttendanceStudents.length === 0) && (
            <tr><td colSpan={3} style={{ textAlign: "center", padding: 20 }}>No students below the threshold.</td></tr>
          )}
        </tbody>
      </table>
      {overview?.lowAttendanceStudents?.length > 5 && (
        <p style={{ fontSize: 13, color: "var(--grey-700)", marginTop: 8 }}>
          Showing 5 of {overview.lowAttendanceStudents.length} — see the full list on the Attendance page.
        </p>
      )}
    </DashboardLayout>
  );
};

export default HodDashboard;
