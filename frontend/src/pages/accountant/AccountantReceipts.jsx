import React, { useEffect, useState } from "react";
import DashboardLayout from "../../layouts/DashboardLayout";
import api, { apiErrorMessage, openReceipt } from "../../services/api";
import { useToast } from "../../context/ToastContext";

const money = (n) => `\u20B9${Number(n || 0).toLocaleString("en-IN")}`;

// Same records as Payment History, laid out as receipts to re-open or print.
const AccountantReceipts = () => {
  const [payments, setPayments] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await api.get("/fees/payments", { params: { search: search || undefined, limit: 48 } });
        setPayments(res.data.data.payments);
      } catch (err) { showToast(apiErrorMessage(err), "error"); } finally { setLoading(false); }
    }, 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  return (
    <DashboardLayout title="Receipts">
      <div className="page-header"><div><h2>Receipts</h2></div></div>
      <div className="toolbar"><input placeholder="Search by receipt no, student name or roll number..." value={search} onChange={(e) => setSearch(e.target.value)} /></div>
      {loading ? <div className="loading-state"><span className="spinner" /></div> : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 14 }}>
          {payments.map((p) => (
            <div key={p._id} className="card" style={{ padding: 16 }}>
              <div style={{ fontWeight: 600 }}>{p.receiptNumber}</div>
              <div style={{ fontSize: 13.5 }}>{p.student?.user?.name} ({p.student?.rollNumber})</div>
              <div style={{ fontSize: 13.5, color: "var(--grey-700)" }}>{p.feeHeadLabel} - {money(p.amount)}</div>
              <div style={{ fontSize: 12, color: "var(--grey-700)" }}>{new Date(p.paymentDate).toLocaleDateString()}</div>
              <button type="button" className="btn btn-secondary btn-sm" style={{ marginTop: 8 }} onClick={() => openReceipt(p._id).catch((err) => showToast(apiErrorMessage(err), "error"))}>View / Print</button>
            </div>
          ))}
          {payments.length === 0 && <p>No receipts found.</p>}
        </div>
      )}
    </DashboardLayout>
  );
};

export default AccountantReceipts;
