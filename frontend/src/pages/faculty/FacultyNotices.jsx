import React, { useEffect, useState } from "react";
import DashboardLayout from "../../layouts/DashboardLayout";
import Modal from "../../components/Modal";
import ConfirmDialog from "../../components/ConfirmDialog";
import api, { apiErrorMessage } from "../../services/api";
import { useToast } from "../../context/ToastContext";
import { useAuth } from "../../context/AuthContext";

const emptyForm = {
  title: "",
  description: "",
  targetScope: "college",
  branch: "",
  year: "",
  semester: "",
  priority: "normal",
  expiryDate: "",
};

const FacultyNotices = () => {
  const [notices, setNotices] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const { showToast } = useToast();
  const { user } = useAuth();

  const loadAll = async () => {
    setLoading(true);
    try {
      const [noticesRes, branchesRes] = await Promise.all([api.get("/notices"), api.get("/branches")]);
      setNotices(noticesRes.data.data.filter((n) => n.createdBy?._id === user.id));
      setBranches(branchesRes.data.data);
    } catch (err) {
      showToast(apiErrorMessage(err), "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = { ...form };
      if (payload.targetScope === "college") {
        delete payload.branch;
        delete payload.year;
        delete payload.semester;
      }
      if (!payload.year) delete payload.year;
      if (!payload.semester) delete payload.semester;
      if (!payload.expiryDate) delete payload.expiryDate;

      await api.post("/notices", payload);
      showToast("Notice posted", "success");
      setShowForm(false);
      setForm(emptyForm);
      loadAll();
    } catch (err) {
      showToast(apiErrorMessage(err), "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/notices/${deleteTarget._id}`);
      showToast("Notice deleted", "success");
      setDeleteTarget(null);
      loadAll();
    } catch (err) {
      showToast(apiErrorMessage(err), "error");
    }
  };

  return (
    <DashboardLayout title="Post Notices">
      <div className="page-header">
        <div>
          <h2>Notices</h2>
          <p>Post announcements for the college, a branch, year, or semester.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>
          + New notice
        </button>
      </div>

      {loading && (
        <div className="loading-state">
          <span className="spinner" />
        </div>
      )}
      {!loading && notices.length === 0 && (
        <div className="empty-state">
          <h4>No notices posted</h4>
          <p>Use "New notice" to announce something to your students.</p>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {notices.map((n) => (
          <div key={n._id} className="card card-pad">
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
              <div>
                <h4 style={{ margin: "0 0 6px", fontSize: 15.5 }}>{n.title}</h4>
                <p style={{ fontSize: 14, margin: "0 0 8px" }}>{n.description}</p>
                <span className="badge badge-info">{n.targetScope}</span>
              </div>
              <button className="btn btn-danger btn-sm" onClick={() => setDeleteTarget(n)} style={{ height: 32 }}>
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <Modal title="Post a notice" onClose={() => setShowForm(false)}>
          <form onSubmit={handleSubmit}>
            <div className="field">
              <label>Title</label>
              <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div className="field">
              <label>Description</label>
              <textarea
                required
                rows={3}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
            <div className="form-grid">
              <div className="field">
                <label>Audience</label>
                <select value={form.targetScope} onChange={(e) => setForm({ ...form, targetScope: e.target.value })}>
                  <option value="college">Entire college</option>
                  <option value="branch">Specific branch</option>
                  <option value="year">Branch + year</option>
                  <option value="semester">Branch + year + semester</option>
                </select>
              </div>
              <div className="field">
                <label>Priority</label>
                <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
                  <option value="low">Low</option>
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>

            {form.targetScope !== "college" && (
              <div className="form-grid">
                <div className="field">
                  <label>Branch</label>
                  <select required value={form.branch} onChange={(e) => setForm({ ...form, branch: e.target.value })}>
                    <option value="">Select branch</option>
                    {branches.map((b) => (
                      <option key={b._id} value={b._id}>
                        {b.code}
                      </option>
                    ))}
                  </select>
                </div>
                {(form.targetScope === "year" || form.targetScope === "semester") && (
                  <div className="field">
                    <label>Year</label>
                    <input
                      type="number"
                      min="1"
                      max="4"
                      required
                      value={form.year}
                      onChange={(e) => setForm({ ...form, year: e.target.value })}
                    />
                  </div>
                )}
                {form.targetScope === "semester" && (
                  <div className="field">
                    <label>Semester</label>
                    <input
                      type="number"
                      min="1"
                      max="8"
                      required
                      value={form.semester}
                      onChange={(e) => setForm({ ...form, semester: e.target.value })}
                    />
                  </div>
                )}
              </div>
            )}

            <div className="field" style={{ maxWidth: 220 }}>
              <label>Expiry date (optional)</label>
              <input type="date" value={form.expiryDate} onChange={(e) => setForm({ ...form, expiryDate: e.target.value })} />
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 12 }}>
              <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? "Posting..." : "Post notice"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {deleteTarget && (
        <ConfirmDialog
          message={`Delete "${deleteTarget.title}"?`}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </DashboardLayout>
  );
};

export default FacultyNotices;
