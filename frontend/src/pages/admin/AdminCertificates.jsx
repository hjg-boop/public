import React, { useEffect, useState } from "react";
import DashboardLayout from "../../layouts/DashboardLayout";
import DataTable from "../../components/DataTable";
import Modal from "../../components/Modal";
import api, { apiErrorMessage } from "../../services/api";
import { useToast } from "../../context/ToastContext";

const TYPES = ["Bonafide", "Study Certificate", "Course Completion", "Other"];

const AdminCertificates = () => {
  const [certificates, setCertificates] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ studentId: "", type: "Bonafide", purpose: "" });
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get("/certificates");
      setCertificates(res.data.data);
    } catch (err) { showToast(apiErrorMessage(err), "error"); } finally { setLoading(false); }
  };
  useEffect(() => {
    load();
    api.get("/students").then((res) => setStudents(res.data.data)).catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post("/certificates", form);
      showToast("Certificate generated", "success");
      setShowForm(false);
      load();
    } catch (err) { showToast(apiErrorMessage(err), "error"); } finally { setSaving(false); }
  };

  const columns = [
    { key: "certificateNumber", label: "Cert No." },
    { key: "type", label: "Type" },
    { key: "student", label: "Student", render: (r) => r.student?.user?.name },
    { key: "issueDate", label: "Issued", render: (r) => new Date(r.issueDate).toLocaleDateString() },
    { key: "fileUrl", label: "File", render: (r) => r.fileUrl ? <a href={r.fileUrl} target="_blank" rel="noopener noreferrer">View PDF</a> : "-" },
  ];

  return (
    <DashboardLayout title="Certificates">
      <div className="page-header">
        <div><h2>Certificates</h2><p>Generate bonafide / study certificates with a QR verification code.</p></div>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>+ Generate certificate</button>
      </div>
      <DataTable columns={columns} rows={certificates} loading={loading} />

      {showForm && (
        <Modal title="Generate certificate" onClose={() => setShowForm(false)} width="480px">
          <form onSubmit={handleSubmit}>
            <div className="field">
              <label>Student *</label>
              <select required value={form.studentId} onChange={(e) => setForm({ ...form, studentId: e.target.value })}>
                <option value="">Select...</option>
                {students.map((s) => <option key={s._id} value={s._id}>{s.rollNumber} - {s.user?.name}</option>)}
              </select>
            </div>
            <div className="field"><label>Type</label><select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>{TYPES.map((t) => <option key={t}>{t}</option>)}</select></div>
            <div className="field"><label>Purpose</label><input value={form.purpose} onChange={(e) => setForm({ ...form, purpose: e.target.value })} placeholder="e.g. Passport application" /></div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 16 }}>
              <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? "Generating..." : "Generate"}</button>
            </div>
          </form>
        </Modal>
      )}
    </DashboardLayout>
  );
};

export default AdminCertificates;
