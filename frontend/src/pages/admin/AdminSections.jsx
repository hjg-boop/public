import React, { useEffect, useState } from "react";
import DashboardLayout from "../../layouts/DashboardLayout";
import DataTable from "../../components/DataTable";
import ConfirmDialog from "../../components/ConfirmDialog";
import api, { apiErrorMessage } from "../../services/api";
import { useToast } from "../../context/ToastContext";

const AdminSections = () => {
  const [sections, setSections] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ branch: "", year: 1, semester: 1, name: "" });
  const [deleteTarget, setDeleteTarget] = useState(null);
  const { showToast } = useToast();

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get("/sections");
      setSections(res.data.data);
    } catch (err) { showToast(apiErrorMessage(err), "error"); } finally { setLoading(false); }
  };
  useEffect(() => {
    load();
    api.get("/branches").then((res) => setBranches(res.data.data)).catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post("/sections", form);
      showToast("Section created", "success");
      setForm({ branch: form.branch, year: form.year, semester: form.semester, name: "" });
      load();
    } catch (err) { showToast(apiErrorMessage(err), "error"); }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/sections/${deleteTarget._id}`);
      showToast("Section deleted", "success");
      setDeleteTarget(null);
      load();
    } catch (err) { showToast(apiErrorMessage(err), "error"); }
  };

  const columns = [
    { key: "branch", label: "Branch", render: (r) => r.branch?.code },
    { key: "year", label: "Year" },
    { key: "semester", label: "Semester" },
    { key: "name", label: "Section" },
    { key: "actions", label: "Actions", render: (r) => <button className="btn btn-danger btn-sm" onClick={() => setDeleteTarget(r)}>Delete</button> },
  ];

  return (
    <DashboardLayout title="Sections">
      <div className="page-header"><div><h2>Sections</h2><p>Sections within each branch/year/semester (e.g. CSE Year 2 Sem 3 - A, B, C).</p></div></div>

      <div className="card" style={{ padding: 20, marginBottom: 20 }}>
        <form onSubmit={handleSubmit} style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end" }}>
          <div className="field">
            <label>Branch *</label>
            <select required value={form.branch} onChange={(e) => setForm({ ...form, branch: e.target.value })}>
              <option value="">Select...</option>{branches.map((b) => <option key={b._id} value={b._id}>{b.code}</option>)}
            </select>
          </div>
          <div className="field" style={{ width: 100 }}><label>Year</label><input type="number" min={1} max={5} value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} /></div>
          <div className="field" style={{ width: 120 }}><label>Semester</label><input type="number" min={1} max={10} value={form.semester} onChange={(e) => setForm({ ...form, semester: e.target.value })} /></div>
          <div className="field" style={{ width: 120 }}><label>Name *</label><input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="A" /></div>
          <button type="submit" className="btn btn-primary">Add Section</button>
        </form>
      </div>

      <DataTable columns={columns} rows={sections} loading={loading} />
      {deleteTarget && <ConfirmDialog message="Delete this section?" onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} />}
    </DashboardLayout>
  );
};

export default AdminSections;
