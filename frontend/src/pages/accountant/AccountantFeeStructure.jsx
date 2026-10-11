import React, { useEffect, useState } from "react";
import DashboardLayout from "../../layouts/DashboardLayout";
import api, { apiErrorMessage } from "../../services/api";
import { useToast } from "../../context/ToastContext";

// Read-only: the fee structure (heads + default amounts) is configured by
// Admin under Academic Management. Accountant just needs to see it here.
const AccountantFeeStructure = () => {
  const [heads, setHeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    api.get("/fee-heads").then((res) => setHeads(res.data.data)).catch((err) => showToast(apiErrorMessage(err), "error")).finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) return <DashboardLayout title="Fee Structure"><div className="loading-state"><span className="spinner" /></div></DashboardLayout>;

  return (
    <DashboardLayout title="Fee Structure">
      <div className="page-header"><div><h2>Fee Structure</h2><p>Configured by Admin under Academic Management.</p></div></div>
      <table className="data-table">
        <thead><tr><th>Fee Head</th><th>Academic Year</th><th>Default Amount</th></tr></thead>
        <tbody>
          {heads.map((h) => <tr key={h._id}><td>{h.name}</td><td>{h.academicYear}</td><td>₹{h.defaultAmount}</td></tr>)}
          {heads.length === 0 && <tr><td colSpan={3} style={{ textAlign: "center", padding: 20 }}>No fee heads configured yet.</td></tr>}
        </tbody>
      </table>
    </DashboardLayout>
  );
};

export default AccountantFeeStructure;
