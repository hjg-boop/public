import React, { useEffect, useState } from "react";
import DashboardLayout from "../../layouts/DashboardLayout";
import api, { apiErrorMessage } from "../../services/api";
import { useToast } from "../../context/ToastContext";

const Card = ({ label, value }) => (
  <div className="card" style={{ padding: 20 }}>
    <div style={{ fontSize: 26, fontWeight: 700, fontFamily: "var(--font-display)" }}>{value}</div>
    <div style={{ color: "var(--grey-700)", fontSize: 13.5 }}>{label}</div>
  </div>
);

const AdminReports = () => {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    api.get("/fees/reports").then((res) => setReport(res.data.data)).catch((err) => showToast(apiErrorMessage(err), "error")).finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) return <DashboardLayout title="Reports"><div className="loading-state"><span className="spinner" /></div></DashboardLayout>;

  return (
    <DashboardLayout title="Reports">
      <div className="page-header"><div><h2>College Financial Report</h2><p>Fees expected vs. collected across the whole college.</p></div></div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16, marginBottom: 32 }}>
        <Card label="Total Expected" value={`₹${report?.totalExpected ?? 0}`} />
        <Card label="Total Collected" value={`₹${report?.totalCollected ?? 0}`} />
        <Card label="Total Outstanding" value={`₹${report?.totalOutstanding ?? 0}`} />
      </div>

      <h3>Collection by Fee Head</h3>
      <table className="data-table">
        <thead><tr><th>Fee Head</th><th>Amount Collected</th></tr></thead>
        <tbody>
          {(report?.collectionByHead || []).map((row) => <tr key={row.label}><td>{row.label}</td><td>₹{row.amount}</td></tr>)}
          {(!report?.collectionByHead || report.collectionByHead.length === 0) && <tr><td colSpan={2} style={{ textAlign: "center", padding: 20 }}>No payments recorded yet.</td></tr>}
        </tbody>
      </table>
    </DashboardLayout>
  );
};

export default AdminReports;
