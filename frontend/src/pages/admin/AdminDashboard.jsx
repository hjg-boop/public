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

  return (
    <DashboardLayout title="Admin Dashboard">
      <div className="page-header"><div><h2>Admin Dashboard</h2><p>College overview, updated live.</p></div></div>

      {loading && <div className="loading-state"><span className="spinner" /></div>}
      {error && <div className="form-error">{error}</div>}

      {fees && (
        <>
          <h3 style={{ marginBottom: 12 }}>Fees - academic year {fees.academicYear}</h3>
          <div className="grid-cards" style={{ marginBottom: 12 }}>
            <div className="stat-card">
              <div className="stat-value" style={{ color: "var(--success, #2e7d32)" }}>{money(fees.totalCollected)}</div>
              <div className="stat-label">Total fees collected</div>
            </div>
            <div className="stat-card">
              <div className="stat-value" style={{ color: fees.totalPending > 0 ? "var(--danger, #c0392b)" : "inherit" }}>{money(fees.totalPending)}</div>
              <div className="stat-label">Total pending dues</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{money(fees.totalExpected)}</div>
              <div className="stat-label">Total fees expected</div>
            </div>
          </div>
          <p style={{ marginBottom: 32 }}><Link to="/admin/reports">Full financial report &rarr;</Link></p>
        </>
      )}

      {stats && (
        <>
          <h3 style={{ marginBottom: 12 }}>College</h3>
          <div className="grid-cards">
            {Object.entries(counts).map(([key, value]) => (
              <div key={key} className="stat-card">
                <div className="stat-value">{value}</div>
                <div className="stat-label">{CARD_LABELS[key] || key}</div>
              </div>
            ))}
          </div>
        </>
      )}
    </DashboardLayout>
  );
};

export default AdminDashboard;
