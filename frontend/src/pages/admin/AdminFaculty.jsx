import React, { useEffect, useState } from "react";
import DashboardLayout from "../../layouts/DashboardLayout";
import DataTable from "../../components/DataTable";
import Modal from "../../components/Modal";
import ConfirmDialog from "../../components/ConfirmDialog";
import api, { apiErrorMessage } from "../../services/api";
import { useToast } from "../../context/ToastContext";

const emptyForm = {
  name: "",
  email: "",
  phone: "",
  password: "",
  employeeId: "",
  department: "",
  designation: "Assistant Professor",
  status: "active",
};

const AdminFaculty = () => {
  const [faculty, setFaculty] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const [assignTarget, setAssignTarget] = useState(null); // faculty being assigned subjects
  const [assignBusyId, setAssignBusyId] = useState(null); // subject _id currently saving

  const { showToast } = useToast();

  const loadDepartments = async () => {
    try {
      const res = await api.get("/departments");
      setDepartments(res.data.data);
    } catch {
      /* ignore */
    }
  };

  const loadSubjects = async () => {
    try {
      const res = await api.get("/subjects");
      setSubjects(res.data.data);
    } catch {
      /* ignore */
    }
  };

  const loadFaculty = async () => {
    setLoading(true);
    try {
      const res = await api.get("/faculty", { params: search ? { search } : {} });
      setFaculty(res.data.data);
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDepartments();
    loadSubjects();
  }, []);

  useEffect(() => {
    const t = setTimeout(loadFaculty, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEdit = (f) => {
    setEditing(f);
    setForm({
      name: f.user?.name || "",
      email: f.user?.email || "",
      phone: f.user?.phone || "",
      password: "",
      employeeId: f.employeeId,
      department: f.department?._id || "",
      designation: f.designation,
      status: f.user?.status || "active",
    });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editing) {
        const { password, ...rest } = form;
        await api.put(`/faculty/${editing._id}`, rest);
        showToast("Faculty updated", "success");
      } else {
        await api.post("/faculty", form);
        showToast("Faculty created", "success");
      }
      setShowForm(false);
      loadFaculty();
    } catch (err) {
      showToast(apiErrorMessage(err), "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/faculty/${deleteTarget._id}`);
      showToast("Faculty deleted", "success");
      setDeleteTarget(null);
      loadFaculty();
    } catch (err) {
      showToast(apiErrorMessage(err), "error");
    }
  };

  // Toggle whether `subject` is taught by `assignTarget` (the faculty member
  // currently open in the "Manage subjects" modal). This is the admin's
  // single source of truth for what shows up in that faculty's "My Subjects"
  // and upload-material dropdowns.
  const toggleSubjectAssignment = async (subject) => {
    const isAssignedToThisFaculty = subject.faculty?._id === assignTarget._id;
    setAssignBusyId(subject._id);
    try {
      await api.put(`/subjects/${subject._id}`, {
        faculty: isAssignedToThisFaculty ? null : assignTarget._id,
      });
      await loadSubjects();
      showToast(isAssignedToThisFaculty ? "Subject unassigned" : "Subject assigned", "success");
    } catch (err) {
      showToast(apiErrorMessage(err), "error");
    } finally {
      setAssignBusyId(null);
    }
  };

  const columns = [
    { key: "name", label: "Name", render: (row) => row.user?.name },
    { key: "employeeId", label: "Employee ID" },
    { key: "department", label: "Department", render: (row) => row.department?.code },
    { key: "designation", label: "Designation" },
    {
      key: "status",
      label: "Status",
      render: (row) => (
        <span className={`badge ${row.user?.status === "active" ? "badge-success" : "badge-danger"}`}>
          {row.user?.status}
        </span>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      render: (row) => (
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn btn-secondary btn-sm" onClick={() => setAssignTarget(row)}>
            Subjects
          </button>
          <button className="btn btn-secondary btn-sm" onClick={() => openEdit(row)}>
            Edit
          </button>
          <button className="btn btn-danger btn-sm" onClick={() => setDeleteTarget(row)}>
            Delete
          </button>
        </div>
      ),
    },
  ];

  return (
    <DashboardLayout title="Faculty">
      <div className="page-header">
        <div>
          <h2>Faculty</h2>
          <p>Add, edit, and manage faculty accounts.</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          + Add faculty
        </button>
      </div>

      <div className="toolbar">
        <input placeholder="Search by name, email, employee ID..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ minWidth: 260 }} />
      </div>

      <DataTable columns={columns} rows={faculty} loading={loading} error={error} />

      {showForm && (
        <Modal title={editing ? "Edit faculty" : "Add faculty"} onClose={() => setShowForm(false)}>
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="field">
                <label>Full name</label>
                <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="field">
                <label>Email</label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
              <div className="field">
                <label>Phone</label>
                <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
              {!editing && (
                <div className="field">
                  <label>Password</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                  />
                </div>
              )}
              <div className="field">
                <label>Employee ID</label>
                <input
                  required
                  value={form.employeeId}
                  onChange={(e) => setForm({ ...form, employeeId: e.target.value })}
                />
              </div>
              <div className="field">
                <label>Department</label>
                <select
                  required
                  value={form.department}
                  onChange={(e) => setForm({ ...form, department: e.target.value })}
                >
                  <option value="">Select department</option>
                  {departments.map((d) => (
                    <option key={d._id} value={d._id}>
                      {d.code} — {d.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label>Designation</label>
                <input value={form.designation} onChange={(e) => setForm({ ...form, designation: e.target.value })} />
              </div>
              <div className="field">
                <label>Status</label>
                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 12 }}>
              <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? "Saving..." : editing ? "Save changes" : "Create faculty"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {deleteTarget && (
        <ConfirmDialog
          message={`Delete ${deleteTarget.user?.name} (${deleteTarget.employeeId})? This removes their login too.`}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      {assignTarget && (
        <Modal
          title={`Subjects taught by ${assignTarget.user?.name}`}
          onClose={() => setAssignTarget(null)}
          width="560px"
        >
          <p style={{ fontSize: 13.5, marginTop: 0 }}>
            Check the subjects this faculty member should teach. This decides what appears in
            their "My Subjects" list and their upload-material dropdown — students never see
            unassigned subjects attributed to them.
          </p>
          <div style={{ maxHeight: 360, overflowY: "auto", border: "1px solid var(--paper-line)", borderRadius: 6 }}>
            {subjects.length === 0 && (
              <div style={{ padding: 16, fontSize: 14, color: "var(--grey-500)" }}>
                No subjects exist yet — create some under Admin &rarr; Subjects first.
              </div>
            )}
            {subjects.map((s) => {
              const assignedToThis = s.faculty?._id === assignTarget._id;
              const assignedToSomeoneElse = s.faculty && !assignedToThis;
              return (
                <label
                  key={s._id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "10px 14px",
                    borderBottom: "1px solid var(--paper-line)",
                    fontSize: 13.5,
                    cursor: assignBusyId ? "wait" : "pointer",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={assignedToThis}
                    disabled={assignBusyId === s._id}
                    onChange={() => toggleSubjectAssignment(s)}
                  />
                  <div style={{ flex: 1 }}>
                    <strong>{s.subjectCode}</strong> — {s.subjectName}
                    <div style={{ fontSize: 12, color: "var(--grey-500)" }}>
                      {s.branch?.code} &middot; Semester {s.semester}
                    </div>
                  </div>
                  {assignedToSomeoneElse && (
                    <span className="badge badge-warning" style={{ fontSize: 11 }}>
                      taught by {s.faculty.user?.name}
                    </span>
                  )}
                </label>
              );
            })}
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 16 }}>
            <button className="btn btn-secondary" onClick={() => setAssignTarget(null)}>
              Done
            </button>
          </div>
        </Modal>
      )}
    </DashboardLayout>
  );
};

export default AdminFaculty;
