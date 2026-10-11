import React, { useEffect, useState } from "react";
import DashboardLayout from "../../layouts/DashboardLayout";
import api, { apiErrorMessage } from "../../services/api";
import { useToast } from "../../context/ToastContext";

const AdminResults = () => {
  const [departments, setDepartments] = useState([]);
  const [department, setDepartment] = useState("");
  const [summary, setSummary] = useState([]);
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    api.get("/departments").then((res) => setDepartments(res.data.data)).catch(() => {});
  }, []);

  const load = async (deptId) => {
    setLoading(true);
    try {
      const res = await api.get("/marks/department-summary", { params: { department: deptId } });
      setSummary(res.data.data);
    } catch (err) { showToast(apiErrorMessage(err), "error"); } finally { setLoading(false); }
  };

  return (
    <DashboardLayout title="Results">
      <div className="page-header"><div><h2>Results</h2><p>Average marks per subject, by department.</p></div></div>
      <div className="field" style={{ maxWidth: 320, marginBottom: 20 }}>
        <label>Department</label>
        <select value={department} onChange={(e) => { setDepartment(e.target.value); if (e.target.value) load(e.target.value); }}>
          <option value="">Select a department...</option>
          {departments.map((d) => <option key={d._id} value={d._id}>{d.name}</option>)}
        </select>
      </div>

      {loading ? <div className="loading-state"><span className="spinner" /></div> : department && (
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

export default AdminResults;
