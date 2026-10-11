import React, { useEffect, useState } from "react";
import DashboardLayout from "../../layouts/DashboardLayout";
import api, { apiErrorMessage } from "../../services/api";
import { useToast } from "../../context/ToastContext";

// HOD gets only a limited financial view - counts, not amounts or payment
// records (that stays with Accountant/Admin).
const HodReports = () => {
  const [feeSummary, setFeeSummary] = useState(null);
  const [resultSummary, setResultSummary] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    Promise.all([api.get("/fees/reports"), api.get("/marks/department-summary")])
      .then(([f, r]) => { setFeeSummary(f.data.data); setResultSummary(r.data.data); })
      .catch((err) => showToast(apiErrorMessage(err), "error"))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) return <DashboardLayout title="Reports"><div className="loading-state"><span className="spinner" /></div></DashboardLayout>;

  return (
    <DashboardLayout title="Reports">
      <div className="page-header"><div><h2>Department Reports</h2></div></div>

      <div className="card" style={{ padding: 20, maxWidth: 420, marginBottom: 24 }}>
        <h3 style={{ marginTop: 0 }}>Fee Summary</h3>
        <p>{feeSummary?.studentsWithPendingFees ?? 0} of {feeSummary?.totalStudents ?? 0} students have pending fees.</p>
      </div>

      <h3>Average Marks by Subject</h3>
      <table className="data-table">
        <thead><tr><th>Subject</th><th>Average Marks</th><th>Students Graded</th></tr></thead>
        <tbody>
          {resultSummary.map((s) => (
            <tr key={s.subject._id}><td>{s.subject.subjectCode} - {s.subject.subjectName}</td><td>{s.averageMarks}</td><td>{s.studentsGraded}</td></tr>
          ))}
          {resultSummary.length === 0 && <tr><td colSpan={3} style={{ textAlign: "center", padding: 20 }}>No marks entered yet.</td></tr>}
        </tbody>
      </table>
    </DashboardLayout>
  );
};

export default HodReports;
