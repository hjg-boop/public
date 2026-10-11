import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import DashboardLayout from "../../layouts/DashboardLayout";
import api, { apiErrorMessage, openReceipt } from "../../services/api";
import { useToast } from "../../context/ToastContext";

const money = (n) => `\u20B9${Number(n || 0).toLocaleString("en-IN")}`;
const MODES = ["Cash", "Card", "UPI", "Bank Transfer", "Cheque", "Other"];

// Pick a student, pick one of THEIR fees, enter an amount. The server rejects
// anything above that fee's remaining balance.
const AccountantCollectFees = () => {
  const [params] = useSearchParams();
  const [search, setSearch] = useState("");
  const [results, setResults] = useState([]);
  const [student, setStudent] = useState(null);
  const [account, setAccount] = useState(null);
  const [form, setForm] = useState({ headId: "", amount: "", paymentMode: "Cash", transactionId: "" });
  const [submitting, setSubmitting] = useState(false);
  const [receipt, setReceipt] = useState(null);
  const { showToast } = useToast();

  const openStudent = async (id) => {
    try {
      const res = await api.get(`/fees/accounts/student/${id}`);
      setStudent(res.data.data.student);
      setAccount(res.data.data.account);
      setResults([]);
      setSearch(`${res.data.data.student.rollNumber} - ${res.data.data.student.user?.name}`);
      setForm({ headId: "", amount: "", paymentMode: "Cash", transactionId: "" });
    } catch (err) { showToast(apiErrorMessage(err), "error"); }
  };

  useEffect(() => {
    const id = params.get("student");
    if (id) openStudent(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (search.length < 2 || student) { if (!student) setResults([]); return undefined; }
    const t = setTimeout(async () => {
      try {
        const res = await api.get("/fees/students", { params: { search, limit: 8 } });
        setResults(res.data.data.rows.map((r) => r.student));
      } catch (err) { showToast(apiErrorMessage(err), "error"); }
    }, 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, student]);

  const unpaid = (account?.heads || []).filter((h) => h.amount - h.paid > 0);
  const selected = unpaid.find((h) => h._id === form.headId);

  const submit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await api.post("/fees/payments", { ...form, student: student._id });
      setReceipt(res.data.data.payment);
      setAccount(res.data.data.account);
      setForm({ headId: "", amount: "", paymentMode: "Cash", transactionId: "" });
      showToast("Payment collected", "success");
    } catch (err) { showToast(apiErrorMessage(err), "error"); } finally { setSubmitting(false); }
  };

  return (
    <DashboardLayout title="Collect Fees">
      <div className="page-header"><div><h2>Collect Fees</h2></div></div>

      <div className="card" style={{ padding: 20, marginBottom: 20, maxWidth: 520 }}>
        <div className="field">
          <label>Find student (name or roll number)</label>
          <input value={search} onChange={(e) => { setSearch(e.target.value); setStudent(null); setAccount(null); setReceipt(null); }} placeholder="e.g. 21CSE045 or Rahul" />
        </div>
        {results.length > 0 && (
          <div className="card" style={{ padding: 6 }}>
            {results.map((s) => (
              <div key={s._id} style={{ padding: 8, cursor: "pointer" }} onClick={() => openStudent(s._id)}>
                {s.rollNumber} - {s.user?.name} ({s.branch?.code})
              </div>
            ))}
          </div>
        )}
      </div>

      {student && account && (
        <div className="card" style={{ padding: 20, maxWidth: 520 }}>
          <p style={{ marginTop: 0 }}><strong>{student.user?.name}</strong> ({student.rollNumber}) - {student.branch?.code}</p>
          <p style={{ fontSize: 13.5 }}>Total {money(account.totalAmount)} - Paid {money(account.paidAmount)} - Balance <strong>{money(account.totalAmount - account.paidAmount)}</strong></p>

          {unpaid.length === 0 ? (
            <p style={{ color: "var(--grey-700)" }}>Nothing is due on this account.</p>
          ) : (
            <form onSubmit={submit}>
              <div className="field">
                <label>Fee to pay *</label>
                <select required value={form.headId} onChange={(e) => setForm({ ...form, headId: e.target.value, amount: "" })}>
                  <option value="">Select...</option>
                  {unpaid.map((h) => <option key={h._id} value={h._id}>{h.label} - balance {money(h.amount - h.paid)}</option>)}
                </select>
              </div>
              <div className="field">
                <label>Amount *</label>
                <input type="number" required min={1} max={selected ? selected.amount - selected.paid : undefined} value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
                {selected && <button type="button" className="btn btn-ghost btn-sm" style={{ marginTop: 6 }} onClick={() => setForm({ ...form, amount: selected.amount - selected.paid })}>Pay full balance ({money(selected.amount - selected.paid)})</button>}
              </div>
              <div className="field"><label>Payment mode</label><select value={form.paymentMode} onChange={(e) => setForm({ ...form, paymentMode: e.target.value })}>{MODES.map((m) => <option key={m}>{m}</option>)}</select></div>
              <div className="field"><label>Transaction / reference no.</label><input value={form.transactionId} onChange={(e) => setForm({ ...form, transactionId: e.target.value })} /></div>
              <button className="btn btn-primary" disabled={submitting}>{submitting ? "Collecting..." : "Collect payment"}</button>
            </form>
          )}

          {receipt && (
            <div style={{ marginTop: 16, padding: 12, background: "var(--grey-100)", borderRadius: 8, fontSize: 13.5 }}>
              Payment recorded - receipt {receipt.receiptNumber}.{" "}
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => openReceipt(receipt._id).catch((err) => showToast(apiErrorMessage(err), "error"))}>View / print receipt</button>
            </div>
          )}
        </div>
      )}
    </DashboardLayout>
  );
};

export default AccountantCollectFees;
