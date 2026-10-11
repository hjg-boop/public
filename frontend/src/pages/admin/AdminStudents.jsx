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
  rollNumber: "",
  branch: "",
  year: 1,
  semester: 1,
  section: "A",
  status: "active",
};

const AdminStudents = () => {
  const [students, setStudents] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [branchFilter, setBranchFilter] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [resetTarget, setResetTarget] = useState(null);
  const [newPassword, setNewPassword] = useState("");
  const [resetting, setResetting] = useState(false);
  const { showToast } = useToast();

  const [showImport, setShowImport] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [importResults, setImportResults] = useState(null);

  const loadBranches = async () => {
    try {
      const res = await api.get("/branches");
      setBranches(res.data.data);
    } catch {
      /* ignore, dropdown just stays empty */
    }
  };

  const loadStudents = async () => {
    setLoading(true);
    setError("");
    try {
      const params = {};
      if (search) params.search = search;
      if (branchFilter) params.branch = branchFilter;
      const res = await api.get("/students", { params });
      setStudents(res.data.data);
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBranches();
  }, []);

  useEffect(() => {
    const t = setTimeout(loadStudents, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, branchFilter]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEdit = (student) => {
    setEditing(student);
    setForm({
      name: student.user?.name || "",
      email: student.user?.email || "",
      phone: student.user?.phone || "",
      password: "",
      rollNumber: student.rollNumber,
      branch: student.branch?._id || "",
      year: student.year,
      semester: student.semester,
      section: student.section,
      status: student.user?.status || "active",
    });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editing) {
        const { password, ...rest } = form;
        await api.put(`/students/${editing._id}`, rest);
        showToast("Student updated", "success");
      } else {
        await api.post("/students", form);
        showToast("Student created", "success");
      }
      setShowForm(false);
      loadStudents();
    } catch (err) {
      showToast(apiErrorMessage(err), "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/students/${deleteTarget._id}`);
      showToast("Student deleted", "success");
      setDeleteTarget(null);
      loadStudents();
    } catch (err) {
      showToast(apiErrorMessage(err), "error");
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setResetting(true);
    try {
      await api.put(`/students/${resetTarget._id}/reset-password`, { newPassword });
      showToast("Password reset", "success");
      setResetTarget(null);
      setNewPassword("");
    } catch (err) {
      showToast(apiErrorMessage(err), "error");
    } finally {
      setResetting(false);
    }
  };

  const openImport = () => {
    setImportFile(null);
    setImportResults(null);
    setShowImport(true);
  };

  const downloadTemplate = () => {
    const header = "Name,Email,Phone,Password,RollNumber,BranchCode,Year,Semester,Section";
    const example = "Priya Kumar,priya.kumar@example.com,9876543210,Passw0rd!,21CSE046,CSE,2,3,A";
    // Password/RollNumber are intentionally NOT purely numeric in this
    // example - see the warning in the import dialog below.
    const csvContent = `${header}\n${example}\n`;
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "student_import_template.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async (e) => {
    e.preventDefault();
    if (!importFile) {
      showToast("Please choose a file first", "error");
      return;
    }
    const fd = new FormData();
    fd.append("file", importFile);
    setImporting(true);
    setImportResults(null);
    try {
      const res = await api.post("/students/bulk-import", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setImportResults(res.data.data);
      showToast(res.data.message, "success");
      loadStudents();
    } catch (err) {
      showToast(apiErrorMessage(err), "error");
    } finally {
      setImporting(false);
    }
  };

  const columns = [
    { key: "name", label: "Name", render: (row) => row.user?.name },
    { key: "rollNumber", label: "Roll number" },
    { key: "branch", label: "Branch", render: (row) => row.branch?.code },
    { key: "year", label: "Year" },
    { key: "semester", label: "Sem" },
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
          <button className="btn btn-secondary btn-sm" onClick={() => openEdit(row)}>
            Edit
          </button>
          <button className="btn btn-secondary btn-sm" onClick={() => setResetTarget(row)}>
            Reset Password
          </button>
          <button className="btn btn-danger btn-sm" onClick={() => setDeleteTarget(row)}>
            Delete
          </button>
        </div>
      ),
    },
  ];

  return (
    <DashboardLayout title="Students">
      <div className="page-header">
        <div>
          <h2>Students</h2>
          <p>Add, edit, and manage every student account.</p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn btn-secondary" onClick={openImport}>
            Import from Excel
          </button>
          <button className="btn btn-primary" onClick={openCreate}>
            + Add student
          </button>
        </div>
      </div>

      <div className="toolbar">
        <input placeholder="Search by name, email, roll no..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ minWidth: 240 }} />
        <select value={branchFilter} onChange={(e) => setBranchFilter(e.target.value)}>
          <option value="">All branches</option>
          {branches.map((b) => (
            <option key={b._id} value={b._id}>
              {b.code}
            </option>
          ))}
        </select>
      </div>

      <DataTable columns={columns} rows={students} loading={loading} error={error} />

      {showForm && (
        <Modal title={editing ? "Edit student" : "Add student"} onClose={() => setShowForm(false)}>
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
                <label>Roll number</label>
                <input
                  required
                  value={form.rollNumber}
                  onChange={(e) => setForm({ ...form, rollNumber: e.target.value })}
                />
              </div>
              <div className="field">
                <label>Branch</label>
                <select required value={form.branch} onChange={(e) => setForm({ ...form, branch: e.target.value })}>
                  <option value="">Select branch</option>
                  {branches.map((b) => (
                    <option key={b._id} value={b._id}>
                      {b.code} — {b.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label>Year</label>
                <input
                  type="number"
                  min="1"
                  max="4"
                  required
                  value={form.year}
                  onChange={(e) => setForm({ ...form, year: Number(e.target.value) })}
                />
              </div>
              <div className="field">
                <label>Semester</label>
                <input
                  type="number"
                  min="1"
                  max="8"
                  required
                  value={form.semester}
                  onChange={(e) => setForm({ ...form, semester: Number(e.target.value) })}
                />
              </div>
              <div className="field">
                <label>Section</label>
                <input value={form.section} onChange={(e) => setForm({ ...form, section: e.target.value })} />
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
                {submitting ? "Saving..." : editing ? "Save changes" : "Create student"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {showImport && (
        <Modal title="Import students from Excel" onClose={() => setShowImport(false)} width="560px">
          <p style={{ fontSize: 13.5, marginTop: 0 }}>
            Upload a .xlsx, .xls, or .csv file with one row per student. The first row must be
            exactly these column headers:
          </p>
          <pre
            style={{
              background: "var(--grey-100)",
              padding: "10px 12px",
              borderRadius: 6,
              fontSize: 12.5,
              overflowX: "auto",
            }}
          >
            Name, Email, Phone, Password, RollNumber, BranchCode, Year, Semester, Section
          </pre>
          <button type="button" className="btn btn-secondary btn-sm" onClick={downloadTemplate} style={{ marginBottom: 16 }}>
            Download CSV template
          </button>

          <div style={{ background: "var(--grey-100)", padding: "10px 12px", borderRadius: 6, fontSize: 12.5, marginBottom: 16 }}>
            <strong>Important:</strong> before typing values into Password or RollNumber, format
            those columns as <strong>Text</strong> in Excel (right-click the column → Format Cells → Text).
            Otherwise Excel can silently turn a value like <code>000456</code> into the number
            <code> 456</code> and drop the leading zeros — the import will catch and reject rows
            like this, but it's easier to avoid it up front. Mixing letters into passwords
            (e.g. <code>Pass0456</code>) sidesteps the issue entirely.
          </div>

          <form onSubmit={handleImport}>
            <div className="field">
              <label>File</label>
              <input
                type="file"
                required
                accept=".xlsx,.xls,.csv"
                onChange={(e) => setImportFile(e.target.files[0])}
              />
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <button type="button" className="btn btn-ghost" onClick={() => setShowImport(false)}>
                Close
              </button>
              <button type="submit" className="btn btn-primary" disabled={importing}>
                {importing ? "Importing..." : "Import"}
              </button>
            </div>
          </form>

          {importResults && (
            <div style={{ marginTop: 20, borderTop: "1px solid var(--paper-line)", paddingTop: 16 }}>
              <p style={{ fontSize: 14, fontWeight: 600, margin: "0 0 8px" }}>
                {importResults.successCount} of {importResults.total} imported successfully
              </p>
              {importResults.errors.length > 0 && (
                <div style={{ maxHeight: 200, overflowY: "auto" }}>
                  {importResults.errors.map((e, idx) => (
                    <div
                      key={idx}
                      style={{
                        fontSize: 12.5,
                        padding: "6px 0",
                        borderBottom: "1px solid var(--paper-line)",
                        color: "var(--danger)",
                      }}
                    >
                      Row {e.row} ({e.rollNumber}): {e.message}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </Modal>
      )}

      {resetTarget && (
        <Modal title={`Reset password - ${resetTarget.user?.name} (${resetTarget.rollNumber})`} onClose={() => setResetTarget(null)} width="400px">
          <p style={{ fontSize: 13.5, marginTop: 0 }}>
            Use this if a bulk-imported password doesn't work (a common cause: Excel silently
            turned a numeric password into a number and dropped leading zeros).
          </p>
          <form onSubmit={handleResetPassword}>
            <div className="field">
              <label>New password</label>
              <input type="password" required minLength={6} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 16 }}>
              <button type="button" className="btn btn-ghost" onClick={() => setResetTarget(null)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={resetting}>{resetting ? "Resetting..." : "Reset"}</button>
            </div>
          </form>
        </Modal>
      )}

      {deleteTarget && (
        <ConfirmDialog
          message={`Delete ${deleteTarget.user?.name} (${deleteTarget.rollNumber})? This removes their login too.`}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </DashboardLayout>
  );
};

export default AdminStudents;
