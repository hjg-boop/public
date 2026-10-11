import React, { useEffect, useState } from "react";
import DashboardLayout from "../../layouts/DashboardLayout";
import DataTable from "../../components/DataTable";
import Modal from "../../components/Modal";
import ConfirmDialog from "../../components/ConfirmDialog";
import api, { apiErrorMessage } from "../../services/api";
import { useToast } from "../../context/ToastContext";

const emptyForm = { name: "", email: "", phone: "", password: "", department: "" };

const AdminHodManagement = () => {
  const [hods, setHods] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const { showToast } = useToast();

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get("/users/hods");
      setHods(res.data.data);
    } catch (err) { showToast(apiErrorMessage(err), "error"); } finally { setLoading(false); }
  };
  useEffect(() => {
    load();
    api.get("/departments").then((res) => setDepartments(res.data.data)).catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const openCreate = () => { setEditing(null); setForm(emptyForm); setShowForm(true); };
  const openEdit = (row) => { setEditing(row); setForm({ name: row.name, email: row.email, phone: row.phone || "", password: "", department: row.department?._id || row.department || "" }); setShowForm(true); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await api.put(`/users/hods/${editing._id}`, { name: form.name, phone: form.phone, department: form.department });
        showToast("HOD updated", "success");
      } else {
        await api.post("/users/hods", form);
        showToast("HOD created", "success");
      }
      setShowForm(false);
      load();
    } catch (err) { showToast(apiErrorMessage(err), "error"); }
  };

  const toggleStatus = async (row) => {
    try {
      await api.put(`/users/hods/${row._id}/status`, { status: row.status === "active" ? "inactive" : "active" });
      load();
    } catch (err) { showToast(apiErrorMessage(err), "error"); }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/users/hods/${deleteTarget._id}`);
      showToast("HOD removed", "success");
      setDeleteTarget(null);
      load();
    } catch (err) { showToast(apiErrorMessage(err), "error"); }
  };

  const columns = [
    { key: "name", label: "Name" },
    { key: "email", label: "Email" },
    { key: "department", label: "Department", render: (r) => r.department?.name || "-" },
    { key: "status", label: "Status", render: (r) => <span className={`badge ${r.status === "active" ? "badge-success" : "badge-danger"}`}>{r.status}</span> },
    { key: "actions", label: "Actions", render: (r) => (
      <div style={{ display: "flex", gap: 8 }}>
        <button className="btn btn-secondary btn-sm" onClick={() => openEdit(r)}>Edit</button>
        <button className="btn btn-secondary btn-sm" onClick={() => toggleStatus(r)}>{r.status === "active" ? "Deactivate" : "Activate"}</button>
        <button className="btn btn-danger btn-sm" onClick={() => setDeleteTarget(r)}>Delete</button>
      </div>
    ) },
  ];

  return (
    <DashboardLayout title="HOD Management">
      <div className="page-header">
        <div><h2>HOD Management</h2><p>Assign a Head of Department for each branch - a HOD only ever sees their own department's data.</p></div>
        <button className="btn btn-primary" onClick={openCreate}>+ Assign HOD</button>
      </div>
      <DataTable columns={columns} rows={hods} loading={loading} />

      {showForm && (
        <Modal title={editing ? "Edit HOD" : "Assign a new HOD"} onClose={() => setShowForm(false)} width="480px">
          <form onSubmit={handleSubmit}>
            <div className="field"><label>Name *</label><input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div className="field">
              <label>Email *</label>
              <input type="email" required disabled={!!editing} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div className="field"><label>Phone</label><input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
            <div className="field">
              <label>Department *</label>
              <select required value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })}>
                <option value="">Select...</option>{departments.map((d) => <option key={d._id} value={d._id}>{d.name}</option>)}
              </select>
            </div>
            {!editing && (
              <div className="field"><label>Password *</label><input type="password" required minLength={6} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></div>
            )}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 16 }}>
              <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary">Save</button>
            </div>
          </form>
        </Modal>
      )}

      {deleteTarget && <ConfirmDialog message={`Remove HOD "${deleteTarget.name}"?`} onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} />}

      <AccountantAccounts />
    </DashboardLayout>
  );
};

// Accountant accounts are managed from this same page - there's no separate
// sidebar entry for it, since (like HOD) it's a one-off special account type
// rather than a day-to-day CRUD list like Students/Faculty.
const AccountantAccounts = () => {
  const [accountants, setAccountants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });
  const [deleteTarget, setDeleteTarget] = useState(null);
  const { showToast } = useToast();

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get("/users/accountants");
      setAccountants(res.data.data);
    } catch (err) { showToast(apiErrorMessage(err), "error"); } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post("/users/accountants", form);
      showToast("Accountant created", "success");
      setShowForm(false);
      setForm({ name: "", email: "", phone: "", password: "" });
      load();
    } catch (err) { showToast(apiErrorMessage(err), "error"); }
  };

  const toggleStatus = async (row) => {
    try {
      await api.put(`/users/accountants/${row._id}/status`, { status: row.status === "active" ? "inactive" : "active" });
      load();
    } catch (err) { showToast(apiErrorMessage(err), "error"); }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/users/accountants/${deleteTarget._id}`);
      showToast("Accountant removed", "success");
      setDeleteTarget(null);
      load();
    } catch (err) { showToast(apiErrorMessage(err), "error"); }
  };

  const columns = [
    { key: "name", label: "Name" },
    { key: "email", label: "Email" },
    { key: "status", label: "Status", render: (r) => <span className={`badge ${r.status === "active" ? "badge-success" : "badge-danger"}`}>{r.status}</span> },
    { key: "actions", label: "Actions", render: (r) => (
      <div style={{ display: "flex", gap: 8 }}>
        <button className="btn btn-secondary btn-sm" onClick={() => toggleStatus(r)}>{r.status === "active" ? "Deactivate" : "Activate"}</button>
        <button className="btn btn-danger btn-sm" onClick={() => setDeleteTarget(r)}>Delete</button>
      </div>
    ) },
  ];

  return (
    <div style={{ marginTop: 40 }}>
      <div className="page-header">
        <div><h2>Accountant Accounts</h2><p>Accounts for fee collection - they can only access Students and Fee information.</p></div>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>+ Create Accountant</button>
      </div>
      <DataTable columns={columns} rows={accountants} loading={loading} />

      {showForm && (
        <Modal title="Create accountant" onClose={() => setShowForm(false)} width="420px">
          <form onSubmit={handleSubmit}>
            <div className="field"><label>Name *</label><input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div className="field"><label>Email *</label><input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
            <div className="field"><label>Phone</label><input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
            <div className="field"><label>Password *</label><input type="password" required minLength={6} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 16 }}>
              <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary">Save</button>
            </div>
          </form>
        </Modal>
      )}
      {deleteTarget && <ConfirmDialog message={`Remove accountant "${deleteTarget.name}"?`} onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} />}
    </div>
  );
};

export default AdminHodManagement;
