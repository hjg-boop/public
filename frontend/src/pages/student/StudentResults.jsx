import React, { useEffect, useState } from "react";
import DashboardLayout from "../../layouts/DashboardLayout";
import api, { apiErrorMessage } from "../../services/api";
import { useToast } from "../../context/ToastContext";

const StudentResults = () => {
  const [semesters, setSemesters] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    api.get("/marks/result/mine").then((res) => setSemesters(res.data.data)).catch((err) => showToast(apiErrorMessage(err), "error")).finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) return <DashboardLayout title="Results"><div className="loading-state"><span className="spinner" /></div></DashboardLayout>;

  return (
    <DashboardLayout title="Marks & Results">
      <div className="page-header"><div><h2>Marks & Results</h2><p>Your marks by semester, with SGPA calculated from subject credits.</p></div></div>

      {semesters.length === 0 && <p>No results published yet.</p>}

      {semesters.map((sem) => (
        <div key={sem.semester} className="card" style={{ padding: 0, marginBottom: 24 }}>
          <div style={{ padding: "14px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 style={{ margin: 0 }}>Semester {sem.semester}</h3>
            <span className="badge badge-info">SGPA: {sem.sgpa}</span>
          </div>
          <table className="data-table">
            <thead><tr><th>Subject</th><th>Internal</th><th>Assignment</th><th>Exam</th><th>Total</th><th>Grade</th></tr></thead>
            <tbody>
              {sem.subjects.map((m) => (
                <tr key={m._id}>
                  <td>{m.subject?.subjectCode} - {m.subject?.subjectName}</td>
                  <td>{m.internal}</td>
                  <td>{m.assignment}</td>
                  <td>{m.examMarks}</td>
                  <td>{m.total}</td>
                  <td>{m.grade}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </DashboardLayout>
  );
};

export default StudentResults;
