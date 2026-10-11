import React, { useEffect, useState } from "react";
import DashboardLayout from "../../layouts/DashboardLayout";
import DataTable from "../../components/DataTable";
import api, { apiErrorMessage } from "../../services/api";
import { useToast } from "../../context/ToastContext";

const HodSubjects = () => {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    api.get("/subjects").then((res) => setSubjects(res.data.data)).catch((err) => showToast(apiErrorMessage(err), "error")).finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const columns = [
    { key: "subjectCode", label: "Code" },
    { key: "subjectName", label: "Name" },
    { key: "year", label: "Year" },
    { key: "semester", label: "Semester" },
    { key: "credits", label: "Credits" },
  ];

  return (
    <DashboardLayout title="Subjects">
      <div className="page-header"><div><h2>Department Subjects</h2></div></div>
      <DataTable columns={columns} rows={subjects} loading={loading} />
    </DashboardLayout>
  );
};

export default HodSubjects;
