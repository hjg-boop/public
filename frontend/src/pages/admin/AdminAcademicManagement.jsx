import React, { useEffect, useState } from "react";
import DashboardLayout from "../../layouts/DashboardLayout";
import ConfirmDialog from "../../components/ConfirmDialog";
import api, { apiErrorMessage } from "../../services/api";
import { useToast } from "../../context/ToastContext";

const AdminAcademicManagement = () => {
  const [years, setYears] = useState([]);
  const [yearForm, setYearForm] = useState({ label: "", startDate: "", endDate: "" });
  const [heads, setHeads] = useState([]);
  const [headForm, setHeadForm] = useState({ name: "", category: "college", academicYear: "", defaultAmount: "" });
  const [deleteTarget, setDeleteTarget] = useState(null); // { type: "year"|"head", id }
  const { showToast } = useToast();

  const load = async () => {
    try {
      const [y, h] = await Promise.all([api.get("/academic-years"), api.get("/fee-heads")]);
      setYears(y.data.data);
      setHeads(h.data.data);
      if (!headForm.academicYear && y.data.data[0]) setHeadForm((f) => ({ ...f, academicYear: y.data.data[0].label }));
    } catch (err) { showToast(apiErrorMessage(err), "error"); }
  };
  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const addYear = async (e) => {
    e.preventDefault();
    try {
      await api.post("/academic-years", yearForm);
      showToast("Academic year added", "success");
      setYearForm({ label: "", startDate: "", endDate: "" });
      load();
    } catch (err) { showToast(apiErrorMessage(err), "error"); }
  };

  const setCurrent = async (id) => {
    try {
      await api.put(`/academic-years/${id}/set-current`);
      showToast("Current academic year updated", "success");
      load();
    } catch (err) { showToast(apiErrorMessage(err), "error"); }
  };

  const addHead = async (e) => {
    e.preventDefault();
    try {
      await api.post("/fee-heads", headForm);
      showToast("Fee head added", "success");
      setHeadForm({ ...headForm, name: "", defaultAmount: "" });
      load();
    } catch (err) { showToast(apiErrorMessage(err), "error"); }
  };

  const confirmDelete = async () => {
    try {
      if (deleteTarget.type === "year") await api.delete(`/academic-years/${deleteTarget.id}`);
      else await api.delete(`/fee-heads/${deleteTarget.id}`);
      showToast("Deleted", "success");
      setDeleteTarget(null);
      load();
    } catch (err) { showToast(apiErrorMessage(err), "error"); }
  };

  return (
    <DashboardLayout title="Academic Management">
      <div className="page-header"><div><h2>Academic Management</h2><p>Academic years and the college's fee structure configuration.</p></div></div>

      <div className="card" style={{ padding: 20, marginBottom: 24 }}>
        <h3 style={{ marginTop: 0 }}>Academic Years</h3>
        <form onSubmit={addYear} style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
          <input required placeholder="2026-27" value={yearForm.label} onChange={(e) => setYearForm({ ...yearForm, label: e.target.value })} />
          <input type="date" value={yearForm.startDate} onChange={(e) => setYearForm({ ...yearForm, startDate: e.target.value })} />
          <input type="date" value={yearForm.endDate} onChange={(e) => setYearForm({ ...yearForm, endDate: e.target.value })} />
          <button type="submit" className="btn btn-primary btn-sm">Add</button>
        </form>
        <table className="data-table">
          <thead><tr><th>Year</th><th>Current</th><th></th></tr></thead>
          <tbody>
            {years.map((y) => (
              <tr key={y._id}>
                <td>{y.label}</td>
                <td>{y.isCurrent ? <span className="badge badge-success">Current</span> : "-"}</td>
                <td style={{ display: "flex", gap: 8 }}>
                  {!y.isCurrent && <button className="btn btn-secondary btn-sm" onClick={() => setCurrent(y._id)}>Set current</button>}
                  <button className="btn btn-danger btn-sm" onClick={() => setDeleteTarget({ type: "year", id: y._id })}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card" style={{ padding: 20 }}>
        <h3 style={{ marginTop: 0 }}>Fee Structure (Fee Heads)</h3>
        <p style={{ fontSize: 13, color: "var(--grey-700)" }}>The College fee is added automatically to every student. Hostel and transport fees are added only when the accountant switches them on for a student. Amounts can still be adjusted per student.</p>
        <form onSubmit={addHead} style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
          <input required placeholder="Fee name (e.g. College Fee)" value={headForm.name} onChange={(e) => setHeadForm({ ...headForm, name: e.target.value })} />
          <select value={headForm.category} onChange={(e) => setHeadForm({ ...headForm, category: e.target.value })}>
            <option value="college">College fee (mandatory for every student)</option>
            <option value="hostel">Hostel fee (only if student opts in)</option>
            <option value="transport">Transport fee (only if student uses transport)</option>
            <option value="other">Other / special</option>
          </select>
          <select required value={headForm.academicYear} onChange={(e) => setHeadForm({ ...headForm, academicYear: e.target.value })}>
            <option value="">Academic year...</option>
            {years.map((y) => <option key={y._id} value={y.label}>{y.label}</option>)}
          </select>
          <input required type="number" placeholder="Default amount" value={headForm.defaultAmount} onChange={(e) => setHeadForm({ ...headForm, defaultAmount: e.target.value })} />
          <button type="submit" className="btn btn-primary btn-sm">Add</button>
        </form>
        <table className="data-table">
          <thead><tr><th>Name</th><th>Type</th><th>Academic Year</th><th>Default Amount</th><th></th></tr></thead>
          <tbody>
            {heads.map((h) => (
              <tr key={h._id}>
                <td>{h.name}</td><td>{h.category}</td><td>{h.academicYear}</td><td>₹{h.defaultAmount}</td>
                <td><button className="btn btn-danger btn-sm" onClick={() => setDeleteTarget({ type: "head", id: h._id })}>Delete</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {deleteTarget && <ConfirmDialog message="Delete this item?" onConfirm={confirmDelete} onCancel={() => setDeleteTarget(null)} />}
    </DashboardLayout>
  );
};

export default AdminAcademicManagement;
