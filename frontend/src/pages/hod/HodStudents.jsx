import React, { useEffect, useState } from "react";
import DashboardLayout from "../../layouts/DashboardLayout";
import DataTable from "../../components/DataTable";
import api, { apiErrorMessage } from "../../services/api";
import { useToast } from "../../context/ToastContext";

// Read-only: HOD monitors department students but doesn't create/edit them
// (that's Admin's job). The backend already restricts results to the HOD's
// own department regardless of any filter sent here.
const HodStudents = () => {
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get("/students", { params: search ? { search } : {} });
      setStudents(res.data.data);
    } catch (err) { showToast(apiErrorMessage(err), "error"); } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [search]); // eslint-disable-line react-hooks/exhaustive-deps

  const columns = [
    { key: "rollNumber", label: "Roll No." },
    { key: "name", label: "Name", render: (r) => r.user?.name },
    { key: "branch", label: "Branch", render: (r) => r.branch?.code },
    { key: "year", label: "Year" },
    { key: "semester", label: "Semester" },
    { key: "section", label: "Section" },
    { key: "status", label: "Status", render: (r) => r.user?.status },
  ];

  return (
    <DashboardLayout title="Students">
      <div className="page-header"><div><h2>Department Students</h2></div></div>
      <div className="toolbar"><input placeholder="Search name or roll number..." value={search} onChange={(e) => setSearch(e.target.value)} /></div>
      <DataTable columns={columns} rows={students} loading={loading} />
    </DashboardLayout>
  );
};

export default HodStudents;
