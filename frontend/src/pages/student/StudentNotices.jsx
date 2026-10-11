import React, { useEffect, useState } from "react";
import DashboardLayout from "../../layouts/DashboardLayout";
import api, { apiErrorMessage } from "../../services/api";

const StudentNotices = () => {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await api.get("/notices", { params: search ? { search } : {} });
        setNotices(res.data.data);
      } catch (err) {
        setError(apiErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [search]);

  const priorityBadge = (p) => {
    if (p === "high") return "badge-danger";
    if (p === "low") return "badge-info";
    return "badge-warning";
  };

  return (
    <DashboardLayout title="Notices">
      <div className="page-header">
        <div>
          <h2>Notices</h2>
          <p>Announcements for the college, your department, branch, and semester.</p>
        </div>
      </div>

      <div className="toolbar">
        <input placeholder="Search notices..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ minWidth: 240 }} />
      </div>

      {loading && (
        <div className="loading-state">
          <span className="spinner" />
        </div>
      )}
      {error && <div className="form-error">{error}</div>}
      {!loading && !error && notices.length === 0 && (
        <div className="empty-state">
          <h4>No notices</h4>
          <p>Nothing has been posted for you yet.</p>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {notices.map((n) => (
          <div key={n._id} className="card card-pad">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
              <h4 style={{ margin: "0 0 6px", fontSize: 15.5 }}>{n.title}</h4>
              <span className={`badge ${priorityBadge(n.priority)}`}>{n.priority}</span>
            </div>
            <p style={{ fontSize: 14, margin: "0 0 10px" }}>{n.description}</p>
            <p style={{ fontSize: 12.5, color: "var(--grey-500)", margin: 0 }}>
              Posted by {n.createdBy?.name} &middot; {new Date(n.createdAt).toLocaleDateString()}
            </p>
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
};

export default StudentNotices;
