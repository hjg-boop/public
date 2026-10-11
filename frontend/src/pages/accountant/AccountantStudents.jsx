import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../layouts/DashboardLayout";
import api, { apiErrorMessage } from "../../services/api";
import { useToast } from "../../context/ToastContext";
import { useAuth } from "../../context/AuthContext";

const money = (n) => `\u20B9${Number(n || 0).toLocaleString("en-IN")}`;

// Student fee records: one row per student with their own balance. Shared by
// Accountant (/accountant/students) and Admin (/admin/fees).
const AccountantStudents = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const base = user.role === "admin" ? "/admin/fees" : "/accountant/students";
  const [rows, setRows] = useState([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await api.get("/fees/students", { params: { search: search || undefined, page } });
        setRows(res.data.data.rows);
        setPages(res.data.data.pages || 1);
      } catch (err) { showToast(apiErrorMessage(err), "error"); } finally { setLoading(false); }
    }, 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, page]);

  return (
    <DashboardLayout title="Student Fee Records">
      <div className="page-header"><div><h2>Student Fee Records</h2><p>Open a student to manage hostel/transport, add other fees, or collect a payment.</p></div></div>
      <div className="toolbar"><input placeholder="Search name or roll number..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} /></div>

      {loading ? <div className="loading-state"><span className="spinner" /></div> : (
        <div className="table-wrap">
          <table className="data-table">
            <thead><tr><th>Roll No.</th><th>Name</th><th>Branch</th><th>Hostel</th><th>Transport</th><th>Total</th><th>Paid</th><th>Balance</th><th></th></tr></thead>
            <tbody>
              {rows.map(({ student, account }) => (
                <tr key={student._id}>
                  <td>{student.rollNumber}</td>
                  <td>{student.user?.name}</td>
                  <td>{student.branch?.code}</td>
                  <td>{account ? (account.hostelOpted ? "Yes" : "No") : "-"}</td>
                  <td>{account ? (account.transportOpted ? "Yes" : "No") : "-"}</td>
                  <td>{account ? money(account.totalAmount) : "-"}</td>
                  <td>{account ? money(account.paidAmount) : "-"}</td>
                  <td style={{ fontWeight: 600, color: account && account.balance > 0 ? "var(--danger, #c0392b)" : "inherit" }}>{account ? money(account.balance) : "No account yet"}</td>
                  <td><button className="btn btn-secondary btn-sm" onClick={() => navigate(`${base}/${student._id}`)}>Manage</button></td>
                </tr>
              ))}
              {rows.length === 0 && <tr><td colSpan={9} style={{ textAlign: "center", padding: 20 }}>No students found.</td></tr>}
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

export default AccountantStudents;
