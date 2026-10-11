import React, { useEffect, useState } from "react";
import DashboardLayout from "../../layouts/DashboardLayout";
import DataTable from "../../components/DataTable";
import api, { apiErrorMessage } from "../../services/api";
import { useToast } from "../../context/ToastContext";

const HodFaculty = () => {
  const [faculty, setFaculty] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    api.get("/faculty").then((res) => setFaculty(res.data.data)).catch((err) => showToast(apiErrorMessage(err), "error")).finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const columns = [
    { key: "employeeId", label: "Employee ID" },
    { key: "name", label: "Name", render: (r) => r.user?.name },
    { key: "designation", label: "Designation" },
    { key: "email", label: "Email", render: (r) => r.user?.email },
  ];

  return (
    <DashboardLayout title="Faculty">
      <div className="page-header"><div><h2>Department Faculty</h2></div></div>
      <DataTable columns={columns} rows={faculty} loading={loading} />
    </DashboardLayout>
  );
};

export default HodFaculty;
