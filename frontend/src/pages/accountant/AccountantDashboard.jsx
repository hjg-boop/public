import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import DashboardLayout from "../../layouts/DashboardLayout";
import api, { apiErrorMessage } from "../../services/api";
import { useToast } from "../../context/ToastContext";

const Card = ({ label, value }) => (
  <div className="card" style={{ padding: 20 }}>
    <div style={{ fontSize: 26, fontWeight: 700, fontFamily: "var(--font-display)" }}>{value}</div>
    <div style={{ color: "var(--grey-700)", fontSize: 13.5 }}>{label}</div>
  </div>
);

// Activity counts only. College-wide collected/pending money totals are
// Admin-only analytics and are intentionally not available here.
const AccountantDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    api.get("/dashboard/accountant-stats").then((res) => setStats(res.data.data)).catch((err) => showToast(apiErrorMessage(err), "error")).finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) return <DashboardLayout title="Accountant Panel"><div className="loading-state"><span className="spinner" /></div></DashboardLayout>;

  return (
    <DashboardLayout title="Accountant Panel">
      <div className="page-header"><div><h2>Accountant Panel</h2><p>Academic year {stats?.academicYear}</p></div></div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16, marginBottom: 28 }}>
        <Card label="Receipts issued today" value={stats?.receiptsToday ?? 0} />
        <Card label="Students" value={stats?.totalStudents ?? 0} />
        <Card label="Hostel students" value={stats?.hostelStudents ?? 0} />
        <Card label="Transport users" value={stats?.transportStudents ?? 0} />
      </div>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <Link to="/accountant/collect-fees" className="btn btn-primary">Collect a payment</Link>
        <Link to="/accountant/students" className="btn btn-secondary">Student fee records</Link>
      </div>
    </DashboardLayout>
  );
};

export default AccountantDashboard;
