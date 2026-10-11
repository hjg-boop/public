import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import DashboardLayout from "../../layouts/DashboardLayout";
import api, { apiErrorMessage } from "../../services/api";
import { useAuth } from "../../context/AuthContext";

const FacultyDashboard = () => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get("/faculty/me");
        setData(res.data.data);
      } catch (err) {
        setError(apiErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <DashboardLayout title="Dashboard">
      <div className="page-header">
        <div>
          <h2>Welcome, {user.name.split(" ")[0]}</h2>
          <p>{data?.faculty?.department?.name}</p>
        </div>
      </div>

      {loading && (
        <div className="loading-state">
          <span className="spinner" />
        </div>
      )}
      {error && <div className="form-error">{error}</div>}

      {data && (
        <>
          <div className="grid-cards">
            <div className="stat-card">
              <div className="stat-value">{data.assignedSubjects.length}</div>
              <div className="stat-label">Assigned subjects</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{data.uploadedDocsCount}</div>
              <div className="stat-label">PDFs uploaded</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{data.faculty.employeeId}</div>
              <div className="stat-label">Employee ID</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{data.faculty.designation}</div>
              <div className="stat-label">Designation</div>
            </div>
          </div>

          <div className="grid-2">
            <div className="card card-pad">
              <h3 style={{ fontSize: 16, marginBottom: 14 }}>My subjects</h3>
              {data.assignedSubjects.length === 0 && <p style={{ fontSize: 14 }}>No subjects assigned yet.</p>}
              {data.assignedSubjects.map((s) => (
                <div key={s._id} style={{ padding: "8px 0", borderBottom: "1px solid var(--paper-line)" }}>
                  <strong style={{ fontSize: 14 }}>{s.subjectCode}</strong>{" "}
                  <span style={{ fontSize: 14 }}>{s.subjectName}</span>
                  <div style={{ fontSize: 12.5, color: "var(--grey-500)" }}>
                    {s.branch?.code} &middot; Semester {s.semester}
                  </div>
                </div>
              ))}
              <Link to="/faculty/subjects" style={{ fontSize: 13.5, display: "inline-block", marginTop: 10 }}>
                View all &rarr;
              </Link>
            </div>

            <div className="card card-pad">
              <h3 style={{ fontSize: 16, marginBottom: 14 }}>Recent notices you posted</h3>
              {data.recentNotices.length === 0 && <p style={{ fontSize: 14 }}>You haven't posted any notices yet.</p>}
              {data.recentNotices.map((n) => (
                <div key={n._id} style={{ padding: "8px 0", borderBottom: "1px solid var(--paper-line)" }}>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{n.title}</div>
                  <div style={{ fontSize: 12.5, color: "var(--grey-500)" }}>
                    {new Date(n.createdAt).toLocaleDateString()}
                  </div>
                </div>
              ))}
              <Link to="/faculty/notices" style={{ fontSize: 13.5, display: "inline-block", marginTop: 10 }}>
                Post a notice &rarr;
              </Link>
            </div>
          </div>
        </>
      )}
    </DashboardLayout>
  );
};

export default FacultyDashboard;
