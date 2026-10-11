import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import DashboardLayout from "../../layouts/DashboardLayout";
import api, { apiErrorMessage } from "../../services/api";
import { useAuth } from "../../context/AuthContext";

const StudentDashboard = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [notices, setNotices] = useState([]);
  const [fee, setFee] = useState(null); // { total, paid, balance } for the latest academic year
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const [profileRes, noticesRes] = await Promise.all([
          api.get("/students/me"),
          api.get("/notices"),
        ]);
        setProfile(profileRes.data.data);
        setNotices(noticesRes.data.data.slice(0, 5));
        try {
          const feeRes = await api.get("/fees/mine");
          const latest = feeRes.data.data[0];
          if (latest) setFee({ total: latest.totalAmount, paid: latest.paidAmount, balance: latest.totalAmount - latest.paidAmount });
        } catch { /* fee card is optional; the rest of the dashboard still loads */ }
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
          <h2>Welcome back, {user.name.split(" ")[0]}</h2>
          <p>Here's what's happening in your branch this week.</p>
        </div>
      </div>

      {loading && (
        <div className="loading-state">
          <span className="spinner" />
        </div>
      )}
      {error && <div className="form-error">{error}</div>}

      {profile && (
        <div className="grid-cards">
          <div className="stat-card">
            <div className="stat-value">{profile.rollNumber}</div>
            <div className="stat-label">Roll number</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{profile.branch?.code}</div>
            <div className="stat-label">Branch</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">Year {profile.year}</div>
            <div className="stat-label">Semester {profile.semester}</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{profile.section}</div>
            <div className="stat-label">Section</div>
          </div>
          {fee && (
            <Link to="/student/fees" className="stat-card">
              <div className="stat-value" style={{ color: fee.balance > 0 ? "var(--danger, #c0392b)" : "inherit" }}>
                {"\u20B9"}{fee.balance.toLocaleString("en-IN")}
              </div>
              <div className="stat-label">Fee balance</div>
            </Link>
          )}
        </div>
      )}

      <div className="grid-2">
        <div className="card card-pad">
          <h3 style={{ fontSize: 16, marginBottom: 14 }}>Latest notices</h3>
          {notices.length === 0 && <p style={{ fontSize: 14 }}>No notices yet.</p>}
          {notices.map((n) => (
            <div key={n._id} style={{ padding: "10px 0", borderBottom: "1px solid var(--paper-line)" }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)" }}>{n.title}</div>
              <div style={{ fontSize: 12.5, color: "var(--grey-500)" }}>
                {new Date(n.createdAt).toLocaleDateString()}
              </div>
            </div>
          ))}
          <Link to="/student/notices" style={{ fontSize: 13.5, display: "inline-block", marginTop: 10 }}>
            View all notices &rarr;
          </Link>
        </div>

        <div className="card card-pad">
          <h3 style={{ fontSize: 16, marginBottom: 14 }}>Quick links</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <Link to="/student/materials" className="btn btn-secondary" style={{ justifyContent: "flex-start" }}>
              Browse notes & PDFs
            </Link>
            <Link to="/student/subjects" className="btn btn-secondary" style={{ justifyContent: "flex-start" }}>
              View my subjects
            </Link>
            <Link to="/student/faculty" className="btn btn-secondary" style={{ justifyContent: "flex-start" }}>
              Find faculty contacts
            </Link>
            <Link to="/student/fees" className="btn btn-secondary" style={{ justifyContent: "flex-start" }}>
              Fees &amp; receipts
            </Link>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default StudentDashboard;
