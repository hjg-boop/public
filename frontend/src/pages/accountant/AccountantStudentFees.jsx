import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import DashboardLayout from "../../layouts/DashboardLayout";
import ConfirmDialog from "../../components/ConfirmDialog";
import api, { apiErrorMessage, openReceipt } from "../../services/api";
import { useToast } from "../../context/ToastContext";
import { useAuth } from "../../context/AuthContext";

const money = (n) => `\u20B9${Number(n || 0).toLocaleString("en-IN")}`;
const CATEGORY_LABEL = { college: "College (mandatory)", hostel: "Hostel", transport: "Transport", other: "Other" };

// One student's fee account: the mandatory college fee, the hostel/transport
// toggles, miscellaneous fees, and a shortcut to collect a payment.
const AccountantStudentFees = () => {
  const { studentId } = useParams();
  const { user } = useAuth();
  const collectPath = user.role === "admin" ? "/admin/collect-fees" : "/accountant/collect-fees";
  const backPath = user.role === "admin" ? "/admin/fees" : "/accountant/students";

  const [student, setStudent] = useState(null);
  const [account, setAccount] = useState(null);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [other, setOther] = useState({ label: "", amount: "" });
  const [removeTarget, setRemoveTarget] = useState(null);
  const { showToast } = useToast();

  const load = async () => {
    try {
      const res = await api.get(`/fees/accounts/student/${studentId}`);
      setStudent(res.data.data.student);
      setAccount(res.data.data.account);
      const p = await api.get(`/fees/payments/student/${studentId}`);
      setPayments(p.data.data);
    } catch (err) { showToast(apiErrorMessage(err), "error"); } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [studentId]); // eslint-disable-line react-hooks/exhaustive-deps

  const run = async (fn, okMessage) => {
    setBusy(true);
    try {
      const res = await fn();
      setAccount(res.data.data);
      showToast(okMessage, "success");
    } catch (err) { showToast(apiErrorMessage(err), "error"); } finally { setBusy(false); }
  };

  const toggle = (field, value) => run(() => api.put(`/fees/accounts/${account._id}/services`, { [field]: value }), "Updated");
  const addOther = (e) => {
    e.preventDefault();
    run(() => api.post(`/fees/accounts/${account._id}/other-fees`, other), "Fee added").then(() => setOther({ label: "", amount: "" }));
  };
  const removeOther = () => {
    const id = removeTarget._id;
    setRemoveTarget(null);
    run(() => api.delete(`/fees/accounts/${account._id}/heads/${id}`), "Fee removed");
  };

  if (loading) return <DashboardLayout title="Student Fees"><div className="loading-state"><span className="spinner" /></div></DashboardLayout>;
  if (!account) return <DashboardLayout title="Student Fees"><p>Fee account not available.</p></DashboardLayout>;

  const balance = account.totalAmount - account.paidAmount;

  return (
    <DashboardLayout title="Student Fees">
      <div className="page-header">
        <div>
          <h2>{student?.user?.name}</h2>
          <p>{student?.rollNumber} - {student?.branch?.code} - Academic year {account.academicYear}</p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <Link to={backPath} className="btn btn-ghost btn-sm">&larr; All students</Link>
          <Link to={`${collectPath}?student=${studentId}`} className="btn btn-primary btn-sm">Collect payment</Link>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 14, marginBottom: 24 }}>
        <div className="card" style={{ padding: 16 }}><div style={{ fontSize: 22, fontWeight: 700 }}>{money(account.totalAmount)}</div><div style={{ fontSize: 13, color: "var(--grey-700)" }}>Total fees</div></div>
        <div className="card" style={{ padding: 16 }}><div style={{ fontSize: 22, fontWeight: 700 }}>{money(account.paidAmount)}</div><div style={{ fontSize: 13, color: "var(--grey-700)" }}>Paid</div></div>
        <div className="card" style={{ padding: 16 }}><div style={{ fontSize: 22, fontWeight: 700, color: balance > 0 ? "var(--danger, #c0392b)" : "inherit" }}>{money(balance)}</div><div style={{ fontSize: 13, color: "var(--grey-700)" }}>Balance</div></div>
      </div>

      <div className="card" style={{ padding: 20, marginBottom: 24 }}>
        <h3 style={{ marginTop: 0 }}>Services</h3>
        <div style={{ display: "flex", gap: 32, flexWrap: "wrap" }}>
          <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
            <input type="checkbox" disabled={busy} checked={account.hostelOpted} onChange={(e) => toggle("hostel", e.target.checked)} />
            <span>Stays in the hostel <span style={{ color: "var(--grey-500)", fontSize: 12.5 }}>(adds the hostel fee)</span></span>
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
            <input type="checkbox" disabled={busy} checked={account.transportOpted} onChange={(e) => toggle("transport", e.target.checked)} />
            <span>Uses college transport <span style={{ color: "var(--grey-500)", fontSize: 12.5 }}>(adds the transport fee)</span></span>
          </label>
        </div>
        <p style={{ fontSize: 12.5, color: "var(--grey-500)", marginBottom: 0 }}>A service can't be switched off once a payment has been made toward it.</p>
      </div>

      <h3>Fee breakdown</h3>
      <div className="table-wrap" style={{ marginBottom: 24 }}>
        <table className="data-table">
          <thead><tr><th>Fee</th><th>Type</th><th>Amount</th><th>Paid</th><th>Balance</th><th></th></tr></thead>
          <tbody>
            {account.heads.map((h) => (
              <tr key={h._id}>
                <td>{h.label}</td>
                <td>{CATEGORY_LABEL[h.category]}</td>
                <td>{money(h.amount)}</td>
                <td>{money(h.paid)}</td>
                <td>{money(h.amount - h.paid)}</td>
                <td>{h.category === "other" && h.paid === 0 && <button className="btn btn-ghost btn-sm" onClick={() => setRemoveTarget(h)}>Remove</button>}</td>
              </tr>
            ))}
            {account.heads.length === 0 && (
              <tr><td colSpan={6} style={{ textAlign: "center", padding: 20 }}>
                No fees on this account yet. The mandatory college fee is added as soon as the admin sets it under Academic Management.
              </td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="card" style={{ padding: 20, marginBottom: 24 }}>
        <h3 style={{ marginTop: 0 }}>Add another fee</h3>
        <form onSubmit={addOther} style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end" }}>
          <div className="field" style={{ minWidth: 220 }}><label>Description</label><input required value={other.label} onChange={(e) => setOther({ ...other, label: e.target.value })} placeholder="e.g. Lab fine, Fest registration" /></div>
          <div className="field" style={{ width: 140 }}><label>Amount</label><input required type="number" min={1} value={other.amount} onChange={(e) => setOther({ ...other, amount: e.target.value })} /></div>
          <button className="btn btn-secondary" disabled={busy}>Add fee</button>
        </form>
      </div>

      <h3>Payment history</h3>
      <table className="data-table">
        <thead><tr><th>Receipt</th><th>Fee</th><th>Amount</th><th>Mode</th><th>Date</th><th>Collected by</th><th></th></tr></thead>
        <tbody>
          {payments.map((p) => (
            <tr key={p._id}>
              <td>{p.receiptNumber}</td><td>{p.feeHeadLabel}</td><td>{money(p.amount)}</td><td>{p.paymentMode}</td>
              <td>{new Date(p.paymentDate).toLocaleDateString()}</td><td>{p.collectedBy?.name}</td>
              <td><button type="button" className="btn btn-secondary btn-sm" onClick={() => openReceipt(p._id).catch((err) => showToast(apiErrorMessage(err), "error"))}>Receipt</button></td>
            </tr>
          ))}
          {payments.length === 0 && <tr><td colSpan={7} style={{ textAlign: "center", padding: 20 }}>No payments yet.</td></tr>}
        </tbody>
      </table>

      {removeTarget && <ConfirmDialog message={`Remove "${removeTarget.label}" from this student?`} onConfirm={removeOther} onCancel={() => setRemoveTarget(null)} />}
    </DashboardLayout>
  );
};

export default AccountantStudentFees;
