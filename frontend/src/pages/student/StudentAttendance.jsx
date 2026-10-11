import React, { useEffect, useState } from "react";
import DashboardLayout from "../../layouts/DashboardLayout";
import api, { apiErrorMessage } from "../../services/api";
import { useToast } from "../../context/ToastContext";

const StudentAttendance = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    api.get("/attendance/mine").then((res) => setData(res.data.data)).catch((err) => showToast(apiErrorMessage(err), "error")).finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) return <DashboardLayout title="Attendance"><div className="loading-state"><span className="spinner" /></div></DashboardLayout>;

  const low = data?.overall < 75;

  return (
    <DashboardLayout title="Attendance">
      <div className="page-header"><div><h2>My Attendance</h2><p>Attendance recorded by your faculty, subject by subject.</p></div></div>

      <div className="card" style={{ padding: 24, marginBottom: 20, maxWidth: 320 }}>
        <div style={{ fontSize: 36, fontWeight: 700, fontFamily: "var(--font-display)", color: low ? "var(--danger, #c0392b)" : "inherit" }}>{data?.overall ?? 0}%</div>
        <div style={{ color: "var(--grey-700)" }}>Overall attendance</div>
        {low && <p style={{ color: "var(--danger, #c0392b)", fontSize: 13, marginTop: 8 }}>This is below the usual 75% requirement.</p>}
      </div>

      <div className="card" style={{ padding: 0 }}>
        <table className="data-table">
          <thead><tr><th>Subject</th><th>Present</th><th>Total</th><th>%</th></tr></thead>
          <tbody>
            {(data?.subjects || []).map((s) => (
              <tr key={s.subject._id}>
                <td>{s.subject.subjectCode} - {s.subject.subjectName}</td>
                <td>{s.present}</td>
                <td>{s.total}</td>
                <td style={{ color: s.percentage < 75 ? "var(--danger, #c0392b)" : "inherit" }}>{s.percentage}%</td>
              </tr>
            ))}
            {(!data?.subjects || data.subjects.length === 0) && (
              <tr><td colSpan={4} style={{ textAlign: "center", padding: 20 }}>No attendance recorded yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </DashboardLayout>
  );
};

export default StudentAttendance;
