import React, { useEffect, useState } from "react";
import DashboardLayout from "../../layouts/DashboardLayout";
import DataTable from "../../components/DataTable";
import api, { apiErrorMessage } from "../../services/api";
import { useToast } from "../../context/ToastContext";

const FacultyMyClasses = () => {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    api.get("/faculty-assignments/mine").then((res) => setAssignments(res.data.data)).catch((err) => showToast(apiErrorMessage(err), "error")).finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const columns = [
    { key: "subject", label: "Subject", render: (r) => `${r.subject?.subjectCode} - ${r.subject?.subjectName}` },
    { key: "branch", label: "Branch", render: (r) => r.branch?.code },
    { key: "year", label: "Year" },
    { key: "semester", label: "Semester" },
    { key: "section", label: "Section" },
  ];

  return (
    <DashboardLayout title="My Classes">
      <div className="page-header"><div><h2>My Classes</h2><p>The classes you're assigned to teach, assigned by Admin/HOD.</p></div></div>
      <DataTable columns={columns} rows={assignments} loading={loading} emptyMessage="You have not been assigned to any classes yet." />
    </DashboardLayout>
  );
};

export default FacultyMyClasses;
