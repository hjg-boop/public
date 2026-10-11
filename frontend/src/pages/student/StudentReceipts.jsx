import React, { useEffect, useState } from "react";
import DashboardLayout from "../../layouts/DashboardLayout";
import api, { apiErrorMessage, openReceipt } from "../../services/api";
import { useToast } from "../../context/ToastContext";

const StudentReceipts = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    api.get("/fees/mine/payments").then((res) => setPayments(res.data.data)).catch((err) => showToast(apiErrorMessage(err), "error")).finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) return <DashboardLayout title="Receipts"><div className="loading-state"><span className="spinner" /></div></DashboardLayout>;

  return (
    <DashboardLayout title="Receipts">
      <div className="page-header"><div><h2>My Receipts</h2></div></div>
      {payments.length === 0 ? <p>No payments recorded yet.</p> : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 14 }}>
          {payments.map((p) => (
            <div key={p._id} className="card" style={{ padding: 16 }}>
              <div style={{ fontWeight: 600 }}>{p.receiptNumber}</div>
              <div style={{ fontSize: 13.5 }}>{p.feeHeadLabel} - ₹{p.amount}</div>
              <div style={{ fontSize: 12, color: "var(--grey-700)" }}>{new Date(p.paymentDate).toLocaleDateString()} · {p.paymentMode}</div>
              <button type="button" className="btn btn-secondary btn-sm" style={{ marginTop: 8 }} onClick={() => openReceipt(p._id).catch((err) => showToast(apiErrorMessage(err), "error"))}>
                View / Print
              </button>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
};

export default StudentReceipts;
