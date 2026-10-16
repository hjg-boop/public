import React, { useEffect, useState } from "react";
import DashboardLayout from "../../layouts/DashboardLayout";
import api, { apiErrorMessage, openReceipt } from "../../services/api";
import { useToast } from "../../context/ToastContext";
import ReceiptCard from "../../components/ReceiptCard";

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
        <div className="receipt-list">
          {payments.map((p) => (
            <ReceiptCard
              key={p._id}
              payment={p}
              showStudent
              onOpen={() => openReceipt(p._id).catch((err) => showToast(apiErrorMessage(err), "error"))}
            />
          ))}
          {payments.length === 0 && <p>No receipts found.</p>}
        </div>
      )}
    </DashboardLayout>
  );
};

export default AccountantReceipts;
