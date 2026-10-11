import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import DashboardLayout from "../../layouts/DashboardLayout";
import api, { apiErrorMessage } from "../../services/api";
import { useToast } from "../../context/ToastContext";

const money = (n) => `\u20B9${Number(n || 0).toLocaleString("en-IN")}`;
const CATEGORY_LABEL = { college: "College fee", hostel: "Hostel", transport: "Transport", other: "Other" };

const StudentFees = () => {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    api.get("/fees/mine").then((res) => setAccounts(res.data.data)).catch((err) => showToast(apiErrorMessage(err), "error")).finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) return <DashboardLayout title="Fees"><div className="loading-state"><span className="spinner" /></div></DashboardLayout>;

  return (
    <DashboardLayout title="Fees">
      <div className="page-header">
        <div><h2>My Fees</h2><p>Your fee breakdown. Hostel and transport appear only if the accounts office has enabled them for you.</p></div>
        <Link to="/student/receipts" className="btn btn-secondary btn-sm">My receipts</Link>
      </div>

      {accounts.length === 0 && <p>No fee record yet.</p>}
      {accounts.map((a) => (
        <div key={a._id} className="card" style={{ padding: 20, marginBottom: 20 }}>
          <h3 style={{ marginTop: 0 }}>Academic year {a.academicYear}</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12, marginBottom: 16 }}>
            <div><div style={{ fontSize: 20, fontWeight: 700 }}>{money(a.totalAmount)}</div><div style={{ fontSize: 13, color: "var(--grey-700)" }}>Total</div></div>
            <div><div style={{ fontSize: 20, fontWeight: 700 }}>{money(a.paidAmount)}</div><div style={{ fontSize: 13, color: "var(--grey-700)" }}>Paid</div></div>
            <div><div style={{ fontSize: 20, fontWeight: 700, color: a.totalAmount - a.paidAmount > 0 ? "var(--danger, #c0392b)" : "inherit" }}>{money(a.totalAmount - a.paidAmount)}</div><div style={{ fontSize: 13, color: "var(--grey-700)" }}>Balance</div></div>
          </div>
          <table className="data-table">
            <thead><tr><th>Fee</th><th>Type</th><th>Amount</th><th>Paid</th><th>Balance</th></tr></thead>
            <tbody>
              {a.heads.map((h) => (
                <tr key={h._id}><td>{h.label}</td><td>{CATEGORY_LABEL[h.category]}</td><td>{money(h.amount)}</td><td>{money(h.paid)}</td><td>{money(h.amount - h.paid)}</td></tr>
              ))}
              {a.heads.length === 0 && <tr><td colSpan={5} style={{ textAlign: "center", padding: 16 }}>Fees have not been published yet.</td></tr>}
            </tbody>
          </table>
        </div>
      ))}
    </DashboardLayout>
  );
};

export default StudentFees;
