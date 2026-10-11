import React, { useEffect, useState } from "react";
import DashboardLayout from "../../layouts/DashboardLayout";
import DataTable from "../../components/DataTable";
import Modal from "../../components/Modal";
import api, { apiErrorMessage } from "../../services/api";
import { useToast } from "../../context/ToastContext";
import { useAuth } from "../../context/AuthContext";

const emptyForm = { title: "", description: "", subject: "", branch: "", year: 1, semester: 1, section: "A", dueDate: "" };

const FacultyAssignments = () => {
  const [assignments, setAssignments] = useState([]);
  const [myClasses, setMyClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [file, setFile] = useState(null);
  const [submissionsFor, setSubmissionsFor] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const { showToast } = useToast();
  const { user } = useAuth();

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get("/assignments");
      setAssignments(res.data.data.filter((a) => a.createdBy?._id === user.id));
    } catch (err) { showToast(apiErrorMessage(err), "error"); } finally { setLoading(false); }
  };

  useEffect(() => {
    api.get("/faculty-assignments/mine").then((res) => setMyClasses(res.data.data)).catch(() => {});
  }, []);
  useEffect(() => { load(); }, [myClasses]); // eslint-disable-line react-hooks/exhaustive-deps

  const onClassChange = (key, val) => {
    const next = { ...form, [key]: val };
    const match = myClasses.find((c) => c.subject?._id === next.subject);
    if (match) {
      next.branch = match.branch._id;
      next.year = match.year;
      next.semester = match.semester;
      next.section = match.section;
    }
    setForm(next);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      if (file) fd.append("file", file);
      await api.post("/assignments", fd, { headers: { "Content-Type": "multipart/form-data" } });
      showToast("Assignment created", "success");
      setShowForm(false);
      setForm(emptyForm);
      setFile(null);
      load();
    } catch (err) { showToast(apiErrorMessage(err), "error"); }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/assignments/${id}`);
      showToast("Deleted", "success");
      load();
    } catch (err) { showToast(apiErrorMessage(err), "error"); }
  };

  const viewSubmissions = async (assignment) => {
    setSubmissionsFor(assignment);
    try {
      const res = await api.get(`/assignments/${assignment._id}/submissions`);
      setSubmissions(res.data.data);
    } catch (err) { showToast(apiErrorMessage(err), "error"); }
  };

  const gradeSubmission = async (id, grade) => {
    try {
      await api.put(`/assignments/submissions/${id}`, { grade });
      showToast("Grade saved", "success");
    } catch (err) { showToast(apiErrorMessage(err), "error"); }
  };

  const columns = [
    { key: "title", label: "Title" },
    { key: "subject", label: "Subject", render: (r) => r.subject?.subjectCode },
    { key: "dueDate", label: "Due Date", render: (r) => r.dueDate ? new Date(r.dueDate).toLocaleDateString() : "-" },
    { key: "actions", label: "Actions", render: (r) => (
      <div style={{ display: "flex", gap: 8 }}>
        <button className="btn btn-secondary btn-sm" onClick={() => viewSubmissions(r)}>Submissions</button>
        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(r._id)}>Delete</button>
      </div>
    ) },
  ];

  return (
    <DashboardLayout title="Assignments">
      <div className="page-header">
        <div><h2>Assignments</h2></div>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>+ Create assignment</button>
      </div>
      <DataTable columns={columns} rows={assignments} loading={loading} />

      {showForm && (
        <Modal title="Create assignment" onClose={() => setShowForm(false)} width="520px">
          <form onSubmit={handleSubmit}>
            <div className="field"><label>Title *</label><input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
            <div className="field"><label>Description</label><textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
            <div className="field">
              <label>Class (subject) *</label>
              <select required value={form.subject} onChange={(e) => onClassChange("subject", e.target.value)}>
                <option value="">Select one of your classes...</option>
                {myClasses.map((c) => <option key={c._id} value={c.subject._id}>{c.subject.subjectCode} - {c.branch.code} Y{c.year} S{c.semester} {c.section}</option>)}
              </select>
            </div>
            <div className="field"><label>Due date</label><input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} /></div>
            <div className="field"><label>Attachment (optional)</label><input type="file" onChange={(e) => setFile(e.target.files[0])} /></div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 16 }}>
              <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary">Create</button>
            </div>
          </form>
        </Modal>
      )}

      {submissionsFor && (
        <Modal title={`Submissions - ${submissionsFor.title}`} onClose={() => setSubmissionsFor(null)} width="520px">
          <table className="data-table">
            <thead><tr><th>Student</th><th>Status</th><th>File</th><th>Grade</th></tr></thead>
            <tbody>
              {submissions.map((s) => (
                <tr key={s._id}>
                  <td>{s.student?.user?.name}</td>
                  <td>{s.status}</td>
                  <td><a href={s.fileUrl} target="_blank" rel="noopener noreferrer">View</a></td>
                  <td>
                    <input type="number" style={{ width: 60 }} defaultValue={s.grade ?? ""} onBlur={(e) => gradeSubmission(s._id, e.target.value)} />
                  </td>
                </tr>
              ))}
              {submissions.length === 0 && <tr><td colSpan={4} style={{ textAlign: "center", padding: 20 }}>No submissions yet.</td></tr>}
            </tbody>
          </table>
        </Modal>
      )}
    </DashboardLayout>
  );
};

export default FacultyAssignments;
