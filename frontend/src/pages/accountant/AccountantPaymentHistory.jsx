import React, { useEffect, useState } from "react";
import DashboardLayout from "../../layouts/DashboardLayout";
import api, { apiErrorMessage, openReceipt } from "../../services/api";
import { useToast } from "../../context/ToastContext";

const money = (n) => `\u20B9${Number(n || 0).toLocaleString("en-IN")}`;

// A list of transactions (newest first). It shows records, not totals.
const AccountantPaymentHistory = () => {
  const [payments, setPayments] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await api.get("/fees/payments", { params: { search: search || undefined, category: category || undefined, page } });
        setPayments(res.data.data.payments);
        setPages(res.data.data.pages || 1);
      } catch (err) { showToast(apiErrorMessage(err), "error"); } finally { setLoading(false); }
    }, 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, category, page]);

  return (
    <DashboardLayout title="Payment History">
      <div className="page-header"><div><h2>Payment History</h2></div></div>
      <div className="toolbar" style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <input placeholder="Search receipt no, student name or roll number..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        <select value={category} onChange={(e) => { setCategory(e.target.value); setPage(1); }}>
          <option value="">All fee types</option>
          <option value="college">College</option><option value="hostel">Hostel</option>
          <option value="transport">Transport</option><option value="other">Other</option>
        </select>
      </div>
      {loading ? <div className="loading-state"><span className="spinner" /></div> : (
        <div className="table-wrap">
          <table className="data-table">
            <thead><tr><th>Receipt No.</th><th>Student</th><th>Fee</th><th>Amount</th><th>Mode</th><th>Date</th><th>Collected by</th><th>Receipt</th></tr></thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p._id}>
                  <td>{p.receiptNumber}</td>
                  <td>{p.student?.user?.name} ({p.student?.rollNumber})</td>
                  <td>{p.feeHeadLabel}</td><td>{money(p.amount)}</td><td>{p.paymentMode}</td>
                  <td>{new Date(p.paymentDate).toLocaleDateString()}</td><td>{p.collectedBy?.name}</td>
                  <td><button type="button" className="btn btn-secondary btn-sm" onClick={() => openReceipt(p._id).catch((err) => showToast(apiErrorMessage(err), "error"))}>View</button></td>
                </tr>
              ))}
              {payments.length === 0 && <tr><td colSpan={8} style={{ textAlign: "center", padding: 20 }}>No payments found.</td></tr>}
            </tbody>
          </table>
        </div>
      )}
      <div style={{ display: "flex", justifyContent: "center", gap: 10, marginTop: 16 }}>
        <button className="btn btn-secondary btn-sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</button>
        <span style={{ alignSelf: "center", fontSize: 13 }}>Page {page} of {pages}</span>
        <button className="btn btn-secondary btn-sm" disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>Next</button>
      </div>
    </DashboardLayout>
  );
};

export default AccountantPaymentHistory;
