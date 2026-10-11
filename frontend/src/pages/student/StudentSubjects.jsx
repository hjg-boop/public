import React, { useEffect, useState } from "react";
import DashboardLayout from "../../layouts/DashboardLayout";
import DataTable from "../../components/DataTable";
import api, { apiErrorMessage } from "../../services/api";

const StudentSubjects = () => {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const profileRes = await api.get("/students/me");
        const { branch, semester } = profileRes.data.data;
        const subjectsRes = await api.get("/subjects", {
          params: { branch: branch._id, semester },
        });
        setSubjects(subjectsRes.data.data);
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
    { key: "credits", label: "Credits" },
    {
      key: "faculty",
      label: "Faculty",
      render: (row) => row.faculty?.user?.name || "Not assigned",
    },
  ];

  return (
    <DashboardLayout title="Subjects">
      <div className="page-header">
        <div>
          <h2>My subjects</h2>
          <p>Subjects for your current semester, based on your branch and enrollment.</p>
        </div>
      </div>
      <DataTable
        columns={columns}
        rows={subjects}
        loading={loading}
        error={error}
        emptyMessage="No subjects have been added for your semester yet."
      />
    </DashboardLayout>
  );
};

export default StudentSubjects;
