import React, { useEffect, useState } from "react";
import DashboardLayout from "../../layouts/DashboardLayout";
import DataTable from "../../components/DataTable";
import Modal from "../../components/Modal";
import ConfirmDialog from "../../components/ConfirmDialog";
import api, { apiErrorMessage } from "../../services/api";
import { useToast } from "../../context/ToastContext";

const AdminDepartments = () => {
  const [departments, setDepartments] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  const [deptForm, setDeptForm] = useState({ name: "", code: "", description: "" });
  const [showDeptForm, setShowDeptForm] = useState(false);
  const [editingDept, setEditingDept] = useState(null);
  const [deleteDeptTarget, setDeleteDeptTarget] = useState(null);

  const [branchForm, setBranchForm] = useState({ name: "", code: "", department: "", totalYears: 4 });
  const [showBranchForm, setShowBranchForm] = useState(false);
  const [editingBranch, setEditingBranch] = useState(null);
  const [deleteBranchTarget, setDeleteBranchTarget] = useState(null);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [deptRes, branchRes] = await Promise.all([api.get("/departments"), api.get("/branches")]);
      setDepartments(deptRes.data.data);
      setBranches(branchRes.data.data);
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

  // ---- Department handlers ----
  const openCreateDept = () => {
    setEditingDept(null);
    setDeptForm({ name: "", code: "", description: "" });
    setShowDeptForm(true);
  };
  const openEditDept = (d) => {
    setEditingDept(d);
    setDeptForm({ name: d.name, code: d.code, description: d.description || "" });
    setShowDeptForm(true);
  };
  const submitDept = async (e) => {
    e.preventDefault();
    try {
      if (editingDept) {
        await api.put(`/departments/${editingDept._id}`, deptForm);
        showToast("Department updated", "success");
      } else {
        await api.post("/departments", deptForm);
        showToast("Department created", "success");
      }
      setShowDeptForm(false);
      loadAll();
    } catch (err) {
      showToast(apiErrorMessage(err), "error");
    }
  };
  const deleteDept = async () => {
    try {
      await api.delete(`/departments/${deleteDeptTarget._id}`);
      showToast("Department deleted", "success");
      setDeleteDeptTarget(null);
      loadAll();
    } catch (err) {
      showToast(apiErrorMessage(err), "error");
    }
  };

  // ---- Branch handlers ----
  const openCreateBranch = () => {
    setEditingBranch(null);
    setBranchForm({ name: "", code: "", department: "", totalYears: 4 });
    setShowBranchForm(true);
  };
  const openEditBranch = (b) => {
    setEditingBranch(b);
    setBranchForm({ name: b.name, code: b.code, department: b.department?._id || "", totalYears: b.totalYears });
    setShowBranchForm(true);
  };
  const submitBranch = async (e) => {
    e.preventDefault();
    try {
      if (editingBranch) {
        await api.put(`/branches/${editingBranch._id}`, branchForm);
        showToast("Branch updated", "success");
      } else {
        await api.post("/branches", branchForm);
        showToast("Branch created", "success");
      }
      setShowBranchForm(false);
      loadAll();
    } catch (err) {
      showToast(apiErrorMessage(err), "error");
    }
  };
  const deleteBranch = async () => {
    try {
      await api.delete(`/branches/${deleteBranchTarget._id}`);
      showToast("Branch deleted", "success");
      setDeleteBranchTarget(null);
      loadAll();
    } catch (err) {
      showToast(apiErrorMessage(err), "error");
    }
  };

  const deptColumns = [
    { key: "code", label: "Code" },
    { key: "name", label: "Name" },
    { key: "description", label: "Description" },
    {
      key: "actions",
      label: "Actions",
      render: (row) => (
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn btn-secondary btn-sm" onClick={() => openEditDept(row)}>
            Edit
          </button>
          <button className="btn btn-danger btn-sm" onClick={() => setDeleteDeptTarget(row)}>
            Delete
          </button>
        </div>
      ),
    },
  ];

  const branchColumns = [
    { key: "code", label: "Code" },
    { key: "name", label: "Name" },
    { key: "department", label: "Department", render: (row) => row.department?.code },
    { key: "totalYears", label: "Years" },
    {
      key: "actions",
      label: "Actions",
      render: (row) => (
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn btn-secondary btn-sm" onClick={() => openEditBranch(row)}>
            Edit
          </button>
          <button className="btn btn-danger btn-sm" onClick={() => setDeleteBranchTarget(row)}>
            Delete
          </button>
        </div>
      ),
    },
  ];

  return (
    <DashboardLayout title="Departments & Branches">
      <div className="page-header">
        <div>
          <h2>Departments</h2>
          <p>The academic departments offered by the college.</p>
        </div>
        <button className="btn btn-primary" onClick={openCreateDept}>
          + Add department
        </button>
      </div>
      <DataTable columns={deptColumns} rows={departments} loading={loading} />

      <div className="page-header" style={{ marginTop: 36 }}>
        <div>
          <h2>Branches</h2>
          <p>Branches map to departments and define how many years students study.</p>
        </div>
        <button className="btn btn-primary" onClick={openCreateBranch}>
          + Add branch
        </button>
      </div>
      <DataTable columns={branchColumns} rows={branches} loading={loading} />

      {showDeptForm && (
        <Modal title={editingDept ? "Edit department" : "Add department"} onClose={() => setShowDeptForm(false)}>
          <form onSubmit={submitDept}>
            <div className="field">
              <label>Name</label>
              <input required value={deptForm.name} onChange={(e) => setDeptForm({ ...deptForm, name: e.target.value })} />
            </div>
            <div className="field">
              <label>Code</label>
              <input required value={deptForm.code} onChange={(e) => setDeptForm({ ...deptForm, code: e.target.value })} />
            </div>
            <div className="field">
              <label>Description</label>
              <textarea
                rows={2}
                value={deptForm.description}
                onChange={(e) => setDeptForm({ ...deptForm, description: e.target.value })}
              />
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 12 }}>
              <button type="button" className="btn btn-ghost" onClick={() => setShowDeptForm(false)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                {editingDept ? "Save changes" : "Create department"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {showBranchForm && (
        <Modal title={editingBranch ? "Edit branch" : "Add branch"} onClose={() => setShowBranchForm(false)}>
          <form onSubmit={submitBranch}>
            <div className="field">
              <label>Name</label>
              <input required value={branchForm.name} onChange={(e) => setBranchForm({ ...branchForm, name: e.target.value })} />
            </div>
            <div className="field">
              <label>Code</label>
              <input required value={branchForm.code} onChange={(e) => setBranchForm({ ...branchForm, code: e.target.value })} />
            </div>
            <div className="field">
              <label>Department</label>
              <select
                required
                value={branchForm.department}
                onChange={(e) => setBranchForm({ ...branchForm, department: e.target.value })}
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
              <label>Total years</label>
              <input
                type="number"
                min="1"
                max="6"
                value={branchForm.totalYears}
                onChange={(e) => setBranchForm({ ...branchForm, totalYears: Number(e.target.value) })}
              />
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 12 }}>
              <button type="button" className="btn btn-ghost" onClick={() => setShowBranchForm(false)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                {editingBranch ? "Save changes" : "Create branch"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {deleteDeptTarget && (
        <ConfirmDialog
          message={`Delete department "${deleteDeptTarget.name}"? Branches under it will not be deleted automatically.`}
          onConfirm={deleteDept}
          onCancel={() => setDeleteDeptTarget(null)}
        />
      )}
      {deleteBranchTarget && (
        <ConfirmDialog
          message={`Delete branch "${deleteBranchTarget.name}"?`}
          onConfirm={deleteBranch}
          onCancel={() => setDeleteBranchTarget(null)}
        />
      )}
    </DashboardLayout>
  );
};

export default AdminDepartments;
