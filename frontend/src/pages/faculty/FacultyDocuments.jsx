import React, { useEffect, useState } from "react";
import DashboardLayout from "../../layouts/DashboardLayout";
import Modal from "../../components/Modal";
import ConfirmDialog from "../../components/ConfirmDialog";
import api, { apiErrorMessage } from "../../services/api";
import { useToast } from "../../context/ToastContext";
import { useAuth } from "../../context/AuthContext";

const CATEGORIES = ["Notes", "Important Questions", "Previous Papers", "Lab Manuals", "Assignments", "Syllabus"];
const emptyForm = { title: "", description: "", category: "Notes", subject: "" };

const FacultyDocuments = () => {
  const [documents, setDocuments] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [file, setFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const { showToast } = useToast();
  const { user } = useAuth();

  const loadAll = async () => {
    setLoading(true);
    try {
      const [subjectsRes, docsRes] = await Promise.all([api.get("/subjects/mine"), api.get("/documents")]);
      setSubjects(subjectsRes.data.data);
      // This page manages only the material this faculty member uploaded
      setDocuments(docsRes.data.data.filter((d) => d.uploadedBy?._id === user.id));
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

  const handleOpenUpload = () => {
    setForm(emptyForm);
    setFile(null);
    setShowUpload(true);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      showToast("Please choose a file to upload", "error");
      return;
    }
    const subject = subjects.find((s) => s._id === form.subject);
    if (!subject) {
      showToast("Please select a subject", "error");
      return;
    }

    const fd = new FormData();
    fd.append("title", form.title);
    fd.append("description", form.description);
    fd.append("category", form.category);
    fd.append("subject", subject._id);
    fd.append("branch", subject.branch._id);
    fd.append("year", subject.year);
    fd.append("semester", subject.semester);
    fd.append("file", file);

    setSubmitting(true);
    try {
      await api.post("/documents", fd, { headers: { "Content-Type": "multipart/form-data" } });
      showToast("Document uploaded", "success");
      setShowUpload(false);
      loadAll();
    } catch (err) {
      showToast(apiErrorMessage(err), "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/documents/${deleteTarget._id}`);
      showToast("Document deleted", "success");
      setDeleteTarget(null);
      loadAll();
    } catch (err) {
      showToast(apiErrorMessage(err), "error");
    }
  };

  return (
    <DashboardLayout title="Upload Materials">
      <div className="page-header">
        <div>
          <h2>Notes, papers & assignments</h2>
          <p>Upload study material for your assigned subjects. You can edit or delete your own uploads.</p>
        </div>
        <button className="btn btn-primary" onClick={handleOpenUpload}>
          + Upload file
        </button>
      </div>

      {loading && (
        <div className="loading-state">
          <span className="spinner" />
        </div>
      )}

      {!loading && documents.length === 0 && (
        <div className="empty-state">
          <h4>No uploads yet</h4>
          <p>Use "Upload file" to add your first note or question paper.</p>
        </div>
      )}

      <div className="grid-cards">
        {documents.map((doc) => (
          <div key={doc._id} className="card card-pad">
            <span className="badge badge-info" style={{ marginBottom: 10 }}>
              {doc.category}
            </span>
            <h4 style={{ fontSize: 15.5, marginBottom: 6 }}>{doc.title}</h4>
            <p style={{ fontSize: 13, margin: "0 0 4px" }}>{doc.subject?.subjectName}</p>
            <p style={{ fontSize: 12.5, color: "var(--grey-500)", margin: "0 0 12px" }}>
              Semester {doc.semester} &middot; {new Date(doc.createdAt).toLocaleDateString()} &middot; by{" "}
              {doc.uploadedBy?.name}
            </p>
            <div style={{ display: "flex", gap: 8 }}>
              <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm">
                View
              </a>
              <button className="btn btn-danger btn-sm" onClick={() => setDeleteTarget(doc)}>
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {showUpload && (
        <Modal title="Upload material" onClose={() => setShowUpload(false)}>
          <form onSubmit={handleUpload}>
            <div className="field">
              <label>Title</label>
              <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div className="field">
              <label>Description</label>
              <textarea
                rows={3}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
            <div className="form-grid">
              <div className="field">
                <label>Category</label>
                <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label>Subject</label>
                <select required value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })}>
                  <option value="">Select subject</option>
                  {subjects.map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.subjectCode} — {s.subjectName}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="field">
              <label>File (PDF, DOC, DOCX, PPT, PPTX — max 25MB)</label>
              <input
                type="file"
                required
                accept=".pdf,.doc,.docx,.ppt,.pptx"
                onChange={(e) => setFile(e.target.files[0])}
              />
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 12 }}>
              <button type="button" className="btn btn-ghost" onClick={() => setShowUpload(false)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? "Uploading..." : "Upload"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {deleteTarget && (
        <ConfirmDialog
          message={`Delete "${deleteTarget.title}"? This cannot be undone.`}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </DashboardLayout>
  );
};

export default FacultyDocuments;
