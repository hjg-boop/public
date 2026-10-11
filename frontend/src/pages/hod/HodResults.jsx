import React, { useEffect, useState } from "react";
import DashboardLayout from "../../layouts/DashboardLayout";
import api, { apiErrorMessage } from "../../services/api";
import { useToast } from "../../context/ToastContext";

const HodResults = () => {
  const [summary, setSummary] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    api.get("/marks/department-summary").then((res) => setSummary(res.data.data)).catch((err) => showToast(apiErrorMessage(err), "error")).finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <DashboardLayout title="Results">
      <div className="page-header"><div><h2>Department Results</h2><p>Average marks per subject across your department.</p></div></div>
      {loading ? <div className="loading-state"><span className="spinner" /></div> : (
        <table className="data-table">
          <thead><tr><th>Subject</th><th>Average Marks</th><th>Students Graded</th></tr></thead>
          <tbody>
            {summary.map((s) => (
              <tr key={s.subject._id}><td>{s.subject.subjectCode} - {s.subject.subjectName}</td><td>{s.averageMarks}</td><td>{s.studentsGraded}</td></tr>
            ))}
            {summary.length === 0 && <tr><td colSpan={3} style={{ textAlign: "center", padding: 20 }}>No marks entered yet.</td></tr>}
          </tbody>
        </table>
      )}
    </DashboardLayout>
  );
};

export default HodResults;
