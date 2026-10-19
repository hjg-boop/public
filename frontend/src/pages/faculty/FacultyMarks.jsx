import React, { useEffect, useState } from "react";
import DashboardLayout from "../../layouts/DashboardLayout";
import api, { apiErrorMessage } from "../../services/api";
import { useToast } from "../../context/ToastContext";

const FacultyMarks = () => {
  const [subjects, setSubjects] = useState([]);
  const [subject, setSubject] = useState("");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState(null);
  const { showToast } = useToast();

  useEffect(() => {
    api.get("/subjects/mine").then((res) => setSubjects(res.data.data)).catch((err) => showToast(apiErrorMessage(err), "error"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedSubject = subjects.find((s) => s._id === subject);

  const loadSheet = async (subjectId) => {
    const sel = subjects.find((s) => s._id === subjectId);
    if (!sel) return;
    setLoading(true);
    try {
      const res = await api.get("/marks/sheet", { params: { subject: subjectId, branch: sel.branch._id, year: sel.year, semester: sel.semester } });
      setRows(res.data.data.map((r) => ({
        student: r.student,
        internal: r.marks?.internal ?? 0,
        assignment: r.marks?.assignment ?? 0,
        lab: r.marks?.lab ?? 0,
        examMarks: r.marks?.examMarks ?? 0,
        maxMarks: r.marks?.maxMarks ?? 100,
        total: r.marks?.total ?? 0,
        grade: r.marks?.grade ?? "-",
      })));
    } catch (err) {
      showToast(apiErrorMessage(err), "error");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (studentId, field, value) => {
    setRows((prev) => prev.map((r) => (r.student._id === studentId ? { ...r, [field]: value } : r)));
  };

  const saveRow = async (row) => {
    setSavingId(row.student._id);
    try {
      const res = await api.post("/marks", {
        student: row.student._id,
        subject,
        semester: selectedSubject.semester,
        internal: row.internal, assignment: row.assignment, lab: row.lab, examMarks: row.examMarks, maxMarks: row.maxMarks,
      });
      handleChange(row.student._id, "total", res.data.data.total);
      handleChange(row.student._id, "grade", res.data.data.grade);
      showToast(`Saved for ${row.student.user?.name}`, "success");
    } catch (err) {
      showToast(apiErrorMessage(err), "error");
    } finally {
      setSavingId(null);
    }
  };

  return (
    <DashboardLayout title="Marks">
      <div className="page-header"><div><h2>Enter Marks</h2><p>Internal, assignment, lab and exam marks per subject.</p></div></div>

      <div className="field" style={{ maxWidth: 360, marginBottom: 20 }}>
        <label>Subject</label>
        <select value={subject} onChange={(e) => { setSubject(e.target.value); loadSheet(e.target.value); }}>
          <option value="">Select subject...</option>
          {subjects.map((s) => <option key={s._id} value={s._id}>{s.subjectCode} - {s.subjectName} (Sem {s.semester})</option>)}
        </select>
      </div>

      {loading ? (
        <div className="loading-state"><span className="spinner" /></div>
      ) : rows.length > 0 ? (
        <div className="table-wrap">
          <table className="data-table">
            <thead><tr><th>Roll No</th><th>Name</th><th>Internal</th><th>Assignment</th><th>Lab</th><th>Exam</th><th>Total</th><th>Grade</th><th></th></tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.student._id}>
                  <td>{r.student.rollNumber}</td>
                  <td>{r.student.user?.name}</td>
                  {["internal", "assignment", "lab", "examMarks"].map((f) => (
                    <td key={f}>
                      <input type="number" min={0} style={{ width: 70 }} value={r[f]} onChange={(e) => handleChange(r.student._id, f, e.target.value)} />
                    </td>
                  ))}
                  <td>{r.total}</td>
                  <td>{r.grade}</td>
                  <td>
                    <button
                      className={`btn btn-secondary btn-sm${savingId === r.student._id ? " is-loading" : ""}`}
                      onClick={() => saveRow(r)}
                      disabled={savingId === r.student._id}
                      aria-busy={savingId === r.student._id}
                    >
                      {savingId === r.student._id ? "Saving..." : "Save"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : subject ? (
        <p>No students found for this subject's branch/year/semester.</p>
      ) : null}
    </DashboardLayout>
  );
};

export default FacultyMarks;
