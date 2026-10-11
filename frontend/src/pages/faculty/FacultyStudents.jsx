import React, { useEffect, useState } from "react";
import DashboardLayout from "../../layouts/DashboardLayout";
import DataTable from "../../components/DataTable";
import api, { apiErrorMessage } from "../../services/api";

const FacultyStudents = () => {
  const [students, setStudents] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [branchFilter, setBranchFilter] = useState("");
  const [semesterFilter, setSemesterFilter] = useState("");

  useEffect(() => {
    api.get("/branches").then((res) => setBranches(res.data.data)).catch(() => {});
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const params = {};
        if (search) params.search = search;
        if (branchFilter) params.branch = branchFilter;
        if (semesterFilter) params.semester = semesterFilter;
        const res = await api.get("/students", { params });
        setStudents(res.data.data);
      } catch (err) {
        setError(apiErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [search, branchFilter, semesterFilter]);

  const columns = [
    { key: "name", label: "Name", render: (row) => row.user?.name },
    { key: "rollNumber", label: "Roll number" },
    { key: "branch", label: "Branch", render: (row) => row.branch?.code },
    { key: "year", label: "Year" },
    { key: "semester", label: "Semester" },
    { key: "section", label: "Section" },
    { key: "email", label: "Email", render: (row) => row.user?.email },
  ];

  return (
    <DashboardLayout title="Student Information">
      <div className="page-header">
        <div>
          <h2>Student information</h2>
          <p>Read-only directory of students across branches and semesters.</p>
        </div>
      </div>

      <div className="toolbar">
        <input placeholder="Search by name, email, roll no..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ minWidth: 220 }} />
        <select value={branchFilter} onChange={(e) => setBranchFilter(e.target.value)}>
          <option value="">All branches</option>
          {branches.map((b) => (
            <option key={b._id} value={b._id}>
              {b.code}
            </option>
          ))}
        </select>
        <select value={semesterFilter} onChange={(e) => setSemesterFilter(e.target.value)}>
          <option value="">All semesters</option>
          {Array.from({ length: 8 }, (_, i) => i + 1).map((s) => (
            <option key={s} value={s}>
              Semester {s}
            </option>
          ))}
        </select>
      </div>

      <DataTable columns={columns} rows={students} loading={loading} error={error} />
    </DashboardLayout>
  );
};

export default FacultyStudents;
