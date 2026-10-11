import React, { useEffect, useState } from "react";
import DashboardLayout from "../../layouts/DashboardLayout";
import api, { apiErrorMessage } from "../../services/api";
import { useToast } from "../../context/ToastContext";

const CATEGORIES = ["Notes", "Important Questions", "Previous Papers", "Lab Manuals", "Assignments", "Syllabus"];

const StudentDocuments = () => {
  const [documents, setDocuments] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("");
  const { showToast } = useToast();

  const loadDocuments = async () => {
    setLoading(true);
    setError("");
    try {
      const params = {};
      if (search) params.search = search;
      if (category) params.category = category;
      if (subjectFilter) params.subject = subjectFilter;
      const res = await api.get("/documents", { params });
      setDocuments(res.data.data);
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      try {
        const profileRes = await api.get("/students/me");
        const { branch, semester } = profileRes.data.data;
        const subjectsRes = await api.get("/subjects", { params: { branch: branch._id, semester } });
        setSubjects(subjectsRes.data.data);
      } catch {
        // non-fatal - filter dropdown just stays empty
      }
      loadDocuments();
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const t = setTimeout(loadDocuments, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, category, subjectFilter]);

  const handleDownload = async (doc) => {
    try {
      const res = await api.get(`/documents/${doc._id}/download`);
      window.open(res.data.data.fileUrl, "_blank", "noopener");
    } catch (err) {
      showToast(apiErrorMessage(err), "error");
    }
  };

  return (
    <DashboardLayout title="Notes & PDFs">
      <div className="page-header">
        <div>
          <h2>Notes & PDFs</h2>
          <p>Search and filter study material uploaded by your faculty.</p>
        </div>
      </div>

      <div className="toolbar">
        <input
          placeholder="Search by title..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ minWidth: 220 }}
        />
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">All types</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select value={subjectFilter} onChange={(e) => setSubjectFilter(e.target.value)}>
          <option value="">All subjects</option>
          {subjects.map((s) => (
            <option key={s._id} value={s._id}>
              {s.subjectCode} — {s.subjectName}
            </option>
          ))}
        </select>
      </div>

      {loading && (
        <div className="loading-state">
          <span className="spinner" />
        </div>
      )}
      {error && <div className="form-error">{error}</div>}

      {!loading && !error && documents.length === 0 && (
        <div className="empty-state">
          <h4>No documents found</h4>
          <p>Try a different search term or clear your filters.</p>
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
              Semester {doc.semester} &middot; Uploaded {new Date(doc.createdAt).toLocaleDateString()} by{" "}
              {doc.uploadedBy?.name}
            </p>
            <div style={{ display: "flex", gap: 8 }}>
              <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm">
                View
              </a>
              <button className="btn btn-primary btn-sm" onClick={() => handleDownload(doc)}>
                Download
              </button>
            </div>
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
};

export default StudentDocuments;
