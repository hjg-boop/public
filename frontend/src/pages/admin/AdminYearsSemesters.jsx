import React, { useEffect, useState } from "react";
import DashboardLayout from "../../layouts/DashboardLayout";
import api, { apiErrorMessage } from "../../services/api";
import { useToast } from "../../context/ToastContext";

// Years & Semesters configuration is kept simple: how many years each branch
// runs for. Individual subjects/sections/timetable slots already carry their
// own year+semester, so this page is just the one setting that drives how
// many year/semester options those forms offer for a branch.
const AdminYearsSemesters = () => {
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const { showToast } = useToast();

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get("/branches");
      setBranches(res.data.data);
    } catch (err) { showToast(apiErrorMessage(err), "error"); } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const updateTotalYears = (id, value) => setBranches(branches.map((b) => (b._id === id ? { ...b, totalYears: value } : b)));

  const save = async (branch) => {
    setSavingId(branch._id);
    try {
      await api.put(`/branches/${branch._id}`, { totalYears: branch.totalYears });
      showToast(`Updated ${branch.code}`, "success");
    } catch (err) { showToast(apiErrorMessage(err), "error"); } finally { setSavingId(null); }
  };

  if (loading) return <DashboardLayout title="Years & Semesters"><div className="loading-state"><span className="spinner" /></div></DashboardLayout>;

  return (
    <DashboardLayout title="Years & Semesters">
      <div className="page-header"><div><h2>Years & Semesters</h2><p>How many years each branch's programme runs for (2 semesters per year).</p></div></div>
      <table className="data-table">
        <thead><tr><th>Branch</th><th>Total Years</th><th>Total Semesters</th><th></th></tr></thead>
        <tbody>
          {branches.map((b) => (
            <tr key={b._id}>
              <td>{b.name} ({b.code})</td>
              <td><input type="number" min={1} max={5} style={{ width: 70 }} value={b.totalYears} onChange={(e) => updateTotalYears(b._id, e.target.value)} /></td>
              <td>{(b.totalYears || 0) * 2}</td>
              <td><button className="btn btn-secondary btn-sm" disabled={savingId === b._id} onClick={() => save(b)}>Save</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </DashboardLayout>
  );
};

export default AdminYearsSemesters;
