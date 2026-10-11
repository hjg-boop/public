import React, { useEffect, useState } from "react";
import DashboardLayout from "../../layouts/DashboardLayout";
import DataTable from "../../components/DataTable";
import Modal from "../../components/Modal";
import ConfirmDialog from "../../components/ConfirmDialog";
import api, { apiErrorMessage } from "../../services/api";
import { useToast } from "../../context/ToastContext";

const emptyForm = {
  subjectName: "",
  subjectCode: "",
  department: "",
  branch: "",
  year: 1,
  semester: 1,
  credits: 3,
  faculty: "",
};

const AdminSubjects = () => {
  const [subjects, setSubjects] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [branches, setBranches] = useState([]);
  const [facultyList, setFacultyList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [branchFilter, setBranchFilter] = useState("");
  const [semesterFilter, setSemesterFilter] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const { showToast } = useToast();

  const loadLookups = async () => {
    try {
      const [deptRes, branchRes, facRes] = await Promise.all([
        api.get("/departments"),
        api.get("/branches"),
        api.get("/faculty"),
      ]);
      setDepartments(deptRes.data.data);
      setBranches(branchRes.data.data);
      setFacultyList(facRes.data.data);
    } catch {
      /* ignore */
    }
  };

  const loadSubjects = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (branchFilter) params.branch = branchFilter;
      if (semesterFilter) params.semester = semesterFilter;
      const res = await api.get("/subjects", { params });
      setSubjects(res.data.data);
    } catch (err) {
      showToast(apiErrorMessage(err), "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLookups();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const t = setTimeout(loadSubjects, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, branchFilter, semesterFilter]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEdit = (s) => {
    setEditing(s);
    setForm({
      subjectName: s.subjectName,
      subjectCode: s.subjectCode,
      department: s.department?._id || "",
      branch: s.branch?._id || "",
      year: s.year,
      semester: s.semester,
      credits: s.credits,
      faculty: s.faculty?._id || "",
    });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = { ...form };
    if (!payload.faculty) delete payload.faculty;
    try {
      if (editing) {
        await api.put(`/subjects/${editing._id}`, payload);
        showToast("Subject updated", "success");
      } else {
        await api.post("/subjects", payload);
        showToast("Subject created", "success");
      }
      setShowForm(false);
      loadSubjects();
    } catch (err) {
      showToast(apiErrorMessage(err), "error");
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/subjects/${deleteTarget._id}`);
      showToast("Subject deleted", "success");
      setDeleteTarget(null);
      loadSubjects();
    } catch (err) {
      showToast(apiErrorMessage(err), "error");
    }
  };

  const columns = [
    { key: "subjectCode", label: "Code" },
    { key: "subjectName", label: "Subject" },
    { key: "branch", label: "Branch", render: (row) => row.branch?.code },
    { key: "semester", label: "Sem" },
    { key: "credits", label: "Credits" },
    { key: "faculty", label: "Faculty", render: (row) => row.faculty?.user?.name || "Unassigned" },
    {
      key: "actions",
      label: "Actions",
      render: (row) => (
        <div style={{ display: "flex", gap: 8 }}>
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
    <DashboardLayout title="Subjects">
      <div className="page-header">
        <div>
          <h2>Subjects</h2>
          <p>Create subjects and assign the faculty who teaches each one.</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          + Add subject
        </button>
      </div>

      <div className="toolbar">
        <input placeholder="Search by name or code..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ minWidth: 220 }} />
        <select value={branchFilter} onChange={(e) => setBranchFilter(e.target.value)}>
          <option value="">All branches</option>
          {branches.map((b) => (
            <option key={b._id} value={b._id}>
              {b.code}
            </option>
          ))}
        </select>
        <select value={semesterFilter} onChange={(e) => setSemesterFilter(e.target.value)}>
          <option value="">All semesters</option>
          {Array.from({ length: 8 }, (_, i) => i + 1).map((s) => (
            <option key={s} value={s}>
              Semester {s}
            </option>
          ))}
        </select>
      </div>

      <DataTable columns={columns} rows={subjects} loading={loading} />

      {showForm && (
        <Modal title={editing ? "Edit subject" : "Add subject"} onClose={() => setShowForm(false)}>
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="field">
                <label>Subject name</label>
                <input
                  required
                  value={form.subjectName}
                  onChange={(e) => setForm({ ...form, subjectName: e.target.value })}
                />
              </div>
              <div className="field">
                <label>Subject code</label>
                <input
                  required
                  value={form.subjectCode}
                  onChange={(e) => setForm({ ...form, subjectCode: e.target.value })}
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
                      {d.code}
                    </option>
                  ))}
                </select>
              </div>
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
                <label>Credits</label>
                <input
                  type="number"
                  min="1"
                  max="6"
                  value={form.credits}
                  onChange={(e) => setForm({ ...form, credits: Number(e.target.value) })}
                />
              </div>
              <div className="field">
                <label>Assign faculty</label>
                <select value={form.faculty} onChange={(e) => setForm({ ...form, faculty: e.target.value })}>
                  <option value="">Unassigned</option>
                  {facultyList.map((f) => (
                    <option key={f._id} value={f._id}>
                      {f.user?.name} ({f.employeeId})
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 12 }}>
              <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                {editing ? "Save changes" : "Create subject"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {deleteTarget && (
        <ConfirmDialog
          message={`Delete "${deleteTarget.subjectName}"?`}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </DashboardLayout>
  );
};

export default AdminSubjects;
