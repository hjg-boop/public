import React, { useEffect, useState } from "react";
import DashboardLayout from "../../layouts/DashboardLayout";
import api, { apiErrorMessage } from "../../services/api";
import { useToast } from "../../context/ToastContext";

const Card = ({ label, value }) => (
  <div className="card" style={{ padding: 20 }}>
    <div style={{ fontSize: 26, fontWeight: 700, fontFamily: "var(--font-display)" }}>{value}</div>
    <div style={{ color: "var(--grey-700)", fontSize: 13.5 }}>{label}</div>
  </div>
);

const HodAttendance = () => {
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    api.get("/attendance/department-overview").then((res) => setOverview(res.data.data)).catch((err) => showToast(apiErrorMessage(err), "error")).finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const downloadLowAttendanceCsv = () => {
    const rows = overview?.lowAttendanceStudents || [];
    const header = ["Roll Number", "Name", "Branch", "Year", "Semester", "Section", "Attendance %"];
    const lines = rows.map((row) => [
      row.student.rollNumber,
      row.student.user?.name || "",
      row.student.branch?.code || "",
      row.student.year,
      row.student.semester,
      row.student.section,
      row.percentage,
    ]);
    // Simple CSV-safe quoting: wrap every field in quotes and escape embedded quotes,
    // so names/branches with commas never break the column alignment.
    const escape = (val) => `"${String(val ?? "").replace(/"/g, '""')}"`;
    const csvContent = [header, ...lines].map((r) => r.map(escape).join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `low-attendance-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (loading) return <DashboardLayout title="Attendance"><div className="loading-state"><span className="spinner" /></div></DashboardLayout>;

  return (
    <DashboardLayout title="Attendance">
      <div className="page-header">
        <div><h2>Department Attendance</h2><p>Today's snapshot and students below the attendance threshold.</p></div>
        <button
          className="btn btn-secondary"
          onClick={downloadLowAttendanceCsv}
          disabled={!overview?.lowAttendanceStudents?.length}
        >
          Download CSV
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 16, marginBottom: 32 }}>
        <Card label="Present Today" value={overview?.presentToday ?? 0} />
        <Card label="Absent Today" value={overview?.absentToday ?? 0} />
        <Card label="Attendance Threshold" value={`${overview?.threshold ?? 75}%`} />
        <Card label="Below Threshold" value={overview?.lowAttendanceStudents?.length ?? 0} />
      </div>

      <h3>Students below threshold</h3>
      <table className="data-table">
        <thead><tr><th>Roll No</th><th>Name</th><th>Branch</th><th>Year</th><th>Sem</th><th>Section</th><th>Attendance</th></tr></thead>
        <tbody>
          {(overview?.lowAttendanceStudents || []).map((row) => (
            <tr key={row.student._id}>
              <td>{row.student.rollNumber}</td>
              <td>{row.student.user?.name}</td>
              <td>{row.student.branch?.code}</td>
              <td>{row.student.year}</td>
              <td>{row.student.semester}</td>
              <td>{row.student.section}</td>
              <td style={{ color: "var(--danger, #c0392b)" }}>{row.percentage}%</td>
            </tr>
          ))}
          {(!overview?.lowAttendanceStudents || overview.lowAttendanceStudents.length === 0) && (
            <tr><td colSpan={7} style={{ textAlign: "center", padding: 20 }}>No students below the threshold.</td></tr>
          )}
        </tbody>
      </table>
    </DashboardLayout>
  );
};

export default HodAttendance;
