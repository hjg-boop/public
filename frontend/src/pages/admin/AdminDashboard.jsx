import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import DashboardLayout from "../../layouts/DashboardLayout";
import api, { apiErrorMessage } from "../../services/api";

const money = (n) => `\u20B9${Number(n || 0).toLocaleString("en-IN")}`;

const CARD_LABELS = {
  totalStudents: "Total Students",
  totalFaculty: "Total Faculty",
  totalDepartments: "Total Departments",
  totalBranches: "Total Branches",
  totalActiveSubjects: "Total Active Subjects",
  totalHods: "Total HODs",
  totalSections: "Total Sections",
};

const CARD_ICONS = {
  totalStudents: "users",
  totalFaculty: "faculty",
  totalDepartments: "building",
  totalBranches: "branches",
  totalActiveSubjects: "book",
  totalHods: "verified-user",
  totalSections: "sections",
};

const DashboardIcon = ({ name }) => {
  const common = {
    fill: "none",
    stroke: "currentColor",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    strokeWidth: 1.8,
  };

  const shapes = {
    users: <><circle cx="9" cy="8" r="3" /><path d="M3.5 19v-1.5a5.5 5.5 0 0 1 11 0V19M16 5.3a3 3 0 0 1 0 5.8M17 14a4.5 4.5 0 0 1 3.5 4.4V19" /></>,
    faculty: <><rect x="3" y="4" width="18" height="13" rx="2" /><path d="M8 21h8M12 17v4M8 10l2.5 2.5L16 7" /></>,
    building: <><path d="M4 21V5l8-3 8 3v16M2 21h20M8 8h1M15 8h1M8 12h1M15 12h1M10 21v-5h4v5" /></>,
    branches: <><circle cx="6" cy="5" r="2" /><circle cx="18" cy="19" r="2" /><circle cx="6" cy="19" r="2" /><path d="M6 7v10M8 5h5a5 5 0 0 1 5 5v7" /></>,
    book: <><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21zM4 5.5v13A2.5 2.5 0 0 1 6.5 16H20M8 7h8M8 10h7" /></>,
    "verified-user": <><circle cx="10" cy="8" r="3" /><path d="M4 20v-1a6 6 0 0 1 11.2-3M17 17l2 2 3-4" /></>,
    sections: <><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M3 9h18M9 9v11M15 9v11" /></>,
    wallet: <><rect x="3" y="5" width="18" height="15" rx="2" /><path d="M3 9h18M16 14h2M7 5V3h11" /></>,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
    chart: <><path d="M4 19V5M4 19h17M8 15l4-4 3 2 5-6" /><path d="M16 7h4v4" /></>,
    exam: <><path d="M7 3h8l4 4v14H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zM15 3v5h5M9 13l2 2 4-4" /></>,
    notice: <><path d="M4 11v2a2 2 0 0 0 2 2h2l8 4V5l-8 4H6a2 2 0 0 0-2 2zM8 15l2 6h4l-2-4M18 9a4 4 0 0 1 0 6" /></>,
  };

  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" width="20" height="20" {...common}>
      {shapes[name] || shapes.building}
    </svg>
  );
};

// College overview plus the year's headline financial numbers. The financial
// figures are Admin-only: accountants work student by student and can't see them.
const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/dashboard/admin-stats")
      .then((res) => setStats(res.data.data))
      .catch((err) => setError(apiErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  const { fees, ...counts } = stats || {};
  const collectionPercent = fees?.totalExpected
    ? Math.min(100, Math.max(0, (fees.totalCollected / fees.totalExpected) * 100))
    : 0;

  return (
    <DashboardLayout title="Admin Dashboard">
      <section className="portal-welcome">
        <div>
          <span className="portal-eyebrow">Administration portal</span>
          <h2>College at a glance</h2>
          <p>Live overview of students, staff, academics, and fee collection.</p>
        </div>
        <Link to="/admin/reports" className="btn btn-primary admin-report-button">View reports</Link>
      </section>

      {loading && <div className="loading-state"><span className="spinner" /></div>}
      {error && <div className="form-error">{error}</div>}

      {fees && (
        <section className="portal-section">
          <div className="portal-section-heading">
            <h3>Fee collection</h3>
            <span className="portal-period">{fees.academicYear}</span>
          </div>
          <div className="admin-fee-card card">
            <div className="admin-fee-summary">
              <div>
                <span className="admin-fee-caption">Collected this academic year</span>
                <strong>{money(fees.totalCollected)}</strong>
              </div>
              <Link to="/admin/reports" className="admin-fee-link">Details <span aria-hidden="true">›</span></Link>
            </div>
            <div className="admin-progress-track" role="progressbar" aria-label="Fee collection progress" aria-valuenow={Math.round(collectionPercent)} aria-valuemin="0" aria-valuemax="100">
              <span style={{ width: `${collectionPercent}%` }} />
            </div>
            <div className="admin-fee-foot">
              <span>{Math.round(collectionPercent)}% collected</span>
              <span>{money(fees.totalPending)} pending</span>
            </div>
          </div>
          <div className="portal-stats admin-fee-stats">
            <div className="portal-stat-card">
            <span className="portal-stat-icon green"><DashboardIcon name="wallet" /></span>
              <span className="portal-stat-value">{money(fees.totalCollected)}</span>
              <span className="portal-stat-label">Fees collected</span>
            </div>
            <div className="portal-stat-card">
            <span className="portal-stat-icon orange"><DashboardIcon name="clock" /></span>
              <span className="portal-stat-value">{money(fees.totalPending)}</span>
              <span className="portal-stat-label">Pending dues</span>
            </div>
            <div className="portal-stat-card">
            <span className="portal-stat-icon blue"><DashboardIcon name="chart" /></span>
              <span className="portal-stat-value">{money(fees.totalExpected)}</span>
              <span className="portal-stat-label">Expected total</span>
            </div>
          </div>
        </section>
      )}

      {stats && (
        <section className="portal-section">
          <div className="portal-section-heading"><h3>College overview</h3></div>
          <div className="portal-stats admin-overview-stats">
            {Object.entries(counts).map(([key, value]) => (
              <div key={key} className="portal-stat-card">
                <span className={`portal-stat-icon ${key === "totalActiveSubjects" ? "purple" : key === "totalSections" ? "orange" : "blue"}`}>
                  <DashboardIcon name={CARD_ICONS[key] || "building"} />
                </span>
                <span className="portal-stat-value">{value}</span>
                <span className="portal-stat-label">{CARD_LABELS[key] || key}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="portal-section">
        <div className="portal-section-heading"><h3>Quick actions</h3></div>
        <div className="portal-quick-grid">
          <Link to="/admin/students" className="portal-quick-card"><span className="portal-stat-icon blue"><DashboardIcon name="users" /></span><span>Manage students</span></Link>
          <Link to="/admin/faculty" className="portal-quick-card"><span className="portal-stat-icon green"><DashboardIcon name="faculty" /></span><span>Manage faculty</span></Link>
          <Link to="/admin/departments" className="portal-quick-card"><span className="portal-stat-icon purple"><DashboardIcon name="building" /></span><span>Departments</span></Link>
          <Link to="/admin/subjects" className="portal-quick-card"><span className="portal-stat-icon orange"><DashboardIcon name="book" /></span><span>Subjects</span></Link>
          <Link to="/admin/exams" className="portal-quick-card"><span className="portal-stat-icon red"><DashboardIcon name="exam" /></span><span>Exams</span></Link>
          <Link to="/admin/notices" className="portal-quick-card"><span className="portal-stat-icon blue"><DashboardIcon name="notice" /></span><span>Notices</span></Link>
        </div>
      </section>
    </DashboardLayout>
  );
};

export default AdminDashboard;
