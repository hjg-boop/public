import React, { useEffect, useState } from "react";
import DashboardLayout from "../../layouts/DashboardLayout";
import api, { apiErrorMessage, openReceipt } from "../../services/api";
import { useToast } from "../../context/ToastContext";
import ReceiptCard from "../../components/ReceiptCard";

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
        <div className="receipt-list">
          {payments.map((p) => (
            <ReceiptCard
              key={p._id}
              payment={p}
              onOpen={() => openReceipt(p._id).catch((err) => showToast(apiErrorMessage(err), "error"))}
            />
          ))}
        </div>
      )}
    </DashboardLayout>
  );
};

export default StudentReceipts;
