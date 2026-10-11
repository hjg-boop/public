import React, { useEffect, useState } from "react";
import DashboardLayout from "../../layouts/DashboardLayout";
import DataTable from "../../components/DataTable";
import Modal from "../../components/Modal";
import ConfirmDialog from "../../components/ConfirmDialog";
import api, { apiErrorMessage } from "../../services/api";
import { useToast } from "../../context/ToastContext";

const TYPES = ["Mid 1", "Mid 2", "Internal", "Semester", "Practical"];
const emptyForm = { name: "", examType: "Mid 1", subject: "", branch: "", year: 1, semester: 1, date: "", time: "", room: "", durationMinutes: 180, maxMarks: 100 };

const AdminExams = () => {
  const [exams, setExams] = useState([]);
  const [branches, setBranches] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const { showToast } = useToast();

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get("/exams");
      setExams(res.data.data);
    } catch (err) { showToast(apiErrorMessage(err), "error"); } finally { setLoading(false); }
  };

  useEffect(() => {
    load();
    api.get("/branches").then((res) => setBranches(res.data.data)).catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (form.branch) api.get("/subjects", { params: { branch: form.branch, semester: form.semester } }).then((res) => setSubjects(res.data.data)).catch(() => {});
  }, [form.branch, form.semester]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post("/exams", form);
      showToast("Exam scheduled", "success");
      setShowForm(false);
      setForm(emptyForm);
      load();
    } catch (err) { showToast(apiErrorMessage(err), "error"); }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/exams/${deleteTarget._id}`);
      showToast("Exam removed", "success");
      setDeleteTarget(null);
      load();
    } catch (err) { showToast(apiErrorMessage(err), "error"); }
  };

  const columns = [
    { key: "name", label: "Name" },
    { key: "examType", label: "Type" },
    { key: "subject", label: "Subject", render: (r) => r.subject?.subjectCode },
    { key: "branch", label: "Branch", render: (r) => r.branch?.code },
    { key: "date", label: "Date", render: (r) => new Date(r.date).toLocaleDateString() },
    { key: "room", label: "Room" },
    { key: "actions", label: "Actions", render: (r) => <button className="btn btn-danger btn-sm" onClick={() => setDeleteTarget(r)}>Delete</button> },
  ];

  return (
    <DashboardLayout title="Exams">
      <div className="page-header">
        <div><h2>Exams</h2><p>Internal, mid and semester exam schedule.</p></div>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>+ Schedule exam</button>
      </div>
      <DataTable columns={columns} rows={exams} loading={loading} />

      {showForm && (
        <Modal title="Schedule exam" onClose={() => setShowForm(false)} width="560px">
          <form onSubmit={handleSubmit}>
            <div className="field"><label>Name *</label><input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div className="field"><label>Type</label><select value={form.examType} onChange={(e) => setForm({ ...form, examType: e.target.value })}>{TYPES.map((t) => <option key={t}>{t}</option>)}</select></div>
            <div className="field">
              <label>Branch *</label>
              <select required value={form.branch} onChange={(e) => setForm({ ...form, branch: e.target.value, subject: "" })}>
                <option value="">Select...</option>{branches.map((b) => <option key={b._id} value={b._id}>{b.code}</option>)}
              </select>
            </div>
            <div className="field" style={{ display: "flex", gap: 10 }}>
              <div style={{ flex: 1 }}><label>Year</label><input type="number" min={1} max={5} value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} /></div>
              <div style={{ flex: 1 }}><label>Semester</label><input type="number" min={1} max={10} value={form.semester} onChange={(e) => setForm({ ...form, semester: e.target.value })} /></div>
            </div>
            <div className="field">
              <label>Subject *</label>
              <select required value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })}>
                <option value="">Select...</option>{subjects.map((s) => <option key={s._id} value={s._id}>{s.subjectCode}</option>)}
              </select>
            </div>
            <div className="field"><label>Date *</label><input type="date" required value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></div>
            <div className="field"><label>Time</label><input value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} placeholder="10:00 AM" /></div>
            <div className="field"><label>Room</label><input value={form.room} onChange={(e) => setForm({ ...form, room: e.target.value })} /></div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 16 }}>
              <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary">Save</button>
            </div>
          </form>
        </Modal>
      )}
      {deleteTarget && <ConfirmDialog message="Delete this exam?" onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} />}
    </DashboardLayout>
  );
};

export default AdminExams;
