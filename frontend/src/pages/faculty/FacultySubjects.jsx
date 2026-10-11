import React, { useEffect, useState } from "react";
import DashboardLayout from "../../layouts/DashboardLayout";
import DataTable from "../../components/DataTable";
import api, { apiErrorMessage } from "../../services/api";

const FacultySubjects = () => {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get("/subjects/mine");
        setSubjects(res.data.data);
      } catch (err) {
        setError(apiErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const columns = [
    { key: "subjectCode", label: "Code" },
    { key: "subjectName", label: "Subject" },
    { key: "branch", label: "Branch", render: (row) => row.branch?.code },
    { key: "semester", label: "Semester" },
    { key: "credits", label: "Credits" },
  ];

  return (
    <DashboardLayout title="My Subjects">
      <div className="page-header">
        <div>
          <h2>My subjects</h2>
          <p>Subjects assigned to you by the admin.</p>
        </div>
      </div>
      <DataTable
        columns={columns}
        rows={subjects}
        loading={loading}
        error={error}
        emptyMessage="No subjects have been assigned to you yet. Contact admin."
      />
    </DashboardLayout>
  );
};

export default FacultySubjects;
