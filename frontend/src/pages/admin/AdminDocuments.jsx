import React, { useEffect, useState } from "react";
import DashboardLayout from "../../layouts/DashboardLayout";
import DataTable from "../../components/DataTable";
import ConfirmDialog from "../../components/ConfirmDialog";
import api, { apiErrorMessage } from "../../services/api";
import { useToast } from "../../context/ToastContext";

const CATEGORIES = ["Notes", "Important Questions", "Previous Papers", "Lab Manuals", "Assignments", "Syllabus"];

const AdminDocuments = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const { showToast } = useToast();

  const loadDocuments = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (category) params.category = category;
      const res = await api.get("/documents", { params });
      setDocuments(res.data.data);
    } catch (err) {
      showToast(apiErrorMessage(err), "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(loadDocuments, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, category]);

  const handleDelete = async () => {
    try {
      await api.delete(`/documents/${deleteTarget._id}`);
      showToast("Document deleted", "success");
      setDeleteTarget(null);
      loadDocuments();
    } catch (err) {
      showToast(apiErrorMessage(err), "error");
    }
  };

  const columns = [
    { key: "title", label: "Title" },
    { key: "category", label: "Category", render: (row) => <span className="badge badge-info">{row.category}</span> },
    { key: "subject", label: "Subject", render: (row) => row.subject?.subjectCode },
    { key: "branch", label: "Branch", render: (row) => row.branch?.code },
    { key: "semester", label: "Sem" },
    { key: "uploadedBy", label: "Uploaded by", render: (row) => row.uploadedBy?.name },
    { key: "downloadCount", label: "Downloads" },
    {
      key: "actions",
      label: "Actions",
      render: (row) => (
        <div style={{ display: "flex", gap: 8 }}>
          <a href={row.fileUrl} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm">
            View
          </a>
          <button className="btn btn-danger btn-sm" onClick={() => setDeleteTarget(row)}>
            Delete
          </button>
        </div>
      ),
    },
  ];

  return (
    <DashboardLayout title="Notes & PDFs">
      <div className="page-header">
        <div>
          <h2>Notes & PDFs</h2>
          <p>Complete control over every document uploaded by faculty.</p>
        </div>
      </div>

      <div className="toolbar">
        <input placeholder="Search by title..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ minWidth: 240 }} />
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">All types</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      <DataTable columns={columns} rows={documents} loading={loading} />

      {deleteTarget && (
        <ConfirmDialog
          message={`Delete "${deleteTarget.title}"? The file will be permanently removed.`}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </DashboardLayout>
  );
};

export default AdminDocuments;
