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
      <section className="portal-welcome student-welcome">
        <div>
          <span className="portal-eyebrow">Student portal</span>
          <h2>Hi, {user.name.split(" ")[0]} <span aria-hidden="true">👋</span></h2>
          <p>Here’s your academic snapshot and quick access to college services.</p>
        </div>
        {profile && (
          <div className="welcome-profile">
            <span className="welcome-avatar">{user.name.slice(0, 1).toUpperCase()}</span>
            <span>
              <strong>{profile.rollNumber}</strong>
              <small>{profile.branch?.code || "Student"} · Year {profile.year}</small>
            </span>
          </div>
        )}
      </section>

      {loading && (
        <div className="loading-state">
          <span className="spinner" />
        </div>
      )}
      {error && <div className="form-error">{error}</div>}

      {profile && (
        <section className="portal-section">
          <div className="portal-section-heading">
            <h3>Academic overview</h3>
          </div>
          <div className="portal-stats student-stats">
            <div className="portal-stat-card">
              <span className="portal-stat-icon blue">♙</span>
              <span className="portal-stat-value">{profile.rollNumber}</span>
              <span className="portal-stat-label">Roll number</span>
            </div>
            <div className="portal-stat-card">
              <span className="portal-stat-icon green">▦</span>
              <span className="portal-stat-value">{profile.branch?.code || "—"}</span>
              <span className="portal-stat-label">Program</span>
            </div>
            <div className="portal-stat-card">
              <span className="portal-stat-icon purple">⌂</span>
              <span className="portal-stat-value">Year {profile.year}</span>
              <span className="portal-stat-label">Semester {profile.semester}</span>
            </div>
            {fee && (
              <Link to="/student/fees" className="portal-stat-card">
                <span className="portal-stat-icon orange">₹</span>
                <span className="portal-stat-value">{`\u20B9${fee.balance.toLocaleString("en-IN")}`}</span>
                <span className="portal-stat-label">Fee balance</span>
              </Link>
            )}
          </div>
        </section>
      )}

      <section className="portal-section">
        <div className="portal-section-heading">
          <h3>Quick access</h3>
        </div>
        <div className="portal-quick-grid">
          <Link to="/student/attendance" className="portal-quick-card"><span className="portal-stat-icon blue">✓</span><span>Attendance</span></Link>
          <Link to="/student/timetable" className="portal-quick-card"><span className="portal-stat-icon green">▦</span><span>Timetable</span></Link>
          <Link to="/student/subjects" className="portal-quick-card"><span className="portal-stat-icon purple">▤</span><span>Subjects</span></Link>
          <Link to="/student/assignments" className="portal-quick-card"><span className="portal-stat-icon orange">✎</span><span>Assignments</span></Link>
          <Link to="/student/exams" className="portal-quick-card"><span className="portal-stat-icon red">✓</span><span>Exams</span></Link>
          <Link to="/student/results" className="portal-quick-card"><span className="portal-stat-icon blue">▥</span><span>Results</span></Link>
          <Link to="/student/fees" className="portal-quick-card"><span className="portal-stat-icon green">₹</span><span>Fee details</span></Link>
          <Link to="/student/materials" className="portal-quick-card"><span className="portal-stat-icon purple">▣</span><span>Study materials</span></Link>
        </div>
      </section>

      <section className="portal-section">
        <div className="portal-section-heading">
          <h3>Latest notices</h3>
          <Link to="/student/notices">View all</Link>
        </div>
        <div className="card notice-card">
          {notices.length === 0 && <p className="portal-empty">No notices yet.</p>}
          {notices.map((n) => (
            <div key={n._id} className="portal-notice-row">
              <span className="portal-notice-icon">▤</span>
              <div className="portal-notice-content">
                <strong>{n.title}</strong>
                <small>{new Date(n.createdAt).toLocaleDateString()}</small>
              </div>
              <span className="portal-notice-arrow" aria-hidden="true">›</span>
            </div>
          ))}
        </div>
      </section>
    </DashboardLayout>
  );
};

export default StudentDashboard;
