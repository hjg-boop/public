import React, { useEffect, useState } from "react";
import DashboardLayout from "../../layouts/DashboardLayout";
import DataTable from "../../components/DataTable";
import api, { apiErrorMessage } from "../../services/api";

const StudentFaculty = () => {
  const [faculty, setFaculty] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await api.get("/faculty", { params: search ? { search } : {} });
        setFaculty(res.data.data);
      } catch (err) {
        setError(apiErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [search]);

  const columns = [
    { key: "name", label: "Name", render: (row) => row.user?.name },
    { key: "employeeId", label: "Employee ID" },
    { key: "department", label: "Department", render: (row) => row.department?.code },
    { key: "designation", label: "Designation" },
    { key: "email", label: "Email", render: (row) => row.user?.email },
  ];

  return (
    <DashboardLayout title="Faculty">
      <div className="page-header">
        <div>
          <h2>Faculty directory</h2>
          <p>Find contact details for any faculty member across departments.</p>
        </div>
      </div>
      <div className="toolbar">
        <input placeholder="Search by name or ID..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ minWidth: 240 }} />
      </div>
      <DataTable columns={columns} rows={faculty} loading={loading} error={error} />
    </DashboardLayout>
  );
};

export default StudentFaculty;
