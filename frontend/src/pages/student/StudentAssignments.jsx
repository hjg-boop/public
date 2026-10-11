import React, { useEffect, useState } from "react";
import DashboardLayout from "../../layouts/DashboardLayout";
import api, { apiErrorMessage } from "../../services/api";
import { useToast } from "../../context/ToastContext";

const StudentAssignments = () => {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploadingId, setUploadingId] = useState(null);
  const { showToast } = useToast();

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get("/assignments/mine");
      setAssignments(res.data.data);
    } catch (err) { showToast(apiErrorMessage(err), "error"); } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleUpload = async (assignmentId, file) => {
    if (!file) return;
    setUploadingId(assignmentId);
    try {
      const fd = new FormData();
      fd.append("file", file);
      await api.post(`/assignments/${assignmentId}/submit`, fd, { headers: { "Content-Type": "multipart/form-data" } });
      showToast("Submitted", "success");
      load();
    } catch (err) { showToast(apiErrorMessage(err), "error"); } finally { setUploadingId(null); }
  };

  if (loading) return <DashboardLayout title="Assignments"><div className="loading-state"><span className="spinner" /></div></DashboardLayout>;

  return (
    <DashboardLayout title="Assignments">
      <div className="page-header"><div><h2>Assignments</h2></div></div>

      {assignments.length === 0 ? <p>No assignments posted yet.</p> : (
        <div style={{ display: "grid", gap: 14 }}>
          {assignments.map((a) => (
            <div key={a._id} className="card" style={{ padding: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
                <div>
                  <strong>{a.title}</strong>
                  <div style={{ fontSize: 13, color: "var(--grey-700)" }}>
                    {a.subject?.subjectCode} {a.dueDate && `· Due ${new Date(a.dueDate).toLocaleDateString()}`}
                  </div>
                  {a.description && <p style={{ margin: "8px 0 0", fontSize: 13.5 }}>{a.description}</p>}
                  {a.fileUrl && <a href={a.fileUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13 }}>View attachment</a>}
                </div>
                <div style={{ textAlign: "right" }}>
                  {a.mySubmission ? (
                    <>
                      <span className="badge badge-success">{a.mySubmission.status}</span>
                      {a.mySubmission.grade !== undefined && a.mySubmission.grade !== null && <div style={{ fontSize: 13, marginTop: 6 }}>Grade: {a.mySubmission.grade}</div>}
                    </>
                  ) : (
                    <label className="btn btn-secondary btn-sm" style={{ cursor: "pointer" }}>
                      {uploadingId === a._id ? "Uploading..." : "Submit"}
                      <input type="file" style={{ display: "none" }} onChange={(e) => handleUpload(a._id, e.target.files[0])} />
                    </label>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
};

export default StudentAssignments;
