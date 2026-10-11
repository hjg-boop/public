import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import DashboardLayout from "../../layouts/DashboardLayout";
import DataTable from "../../components/DataTable";
import api, { apiErrorMessage } from "../../services/api";
import { useToast } from "../../context/ToastContext";

const StudentExams = () => {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    api.get("/exams/mine").then((res) => setExams(res.data.data)).catch((err) => showToast(apiErrorMessage(err), "error")).finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const columns = [
    { key: "name", label: "Name" },
    { key: "examType", label: "Type" },
    { key: "subject", label: "Subject", render: (r) => `${r.subject?.subjectCode} - ${r.subject?.subjectName}` },
    { key: "date", label: "Date", render: (r) => new Date(r.date).toLocaleDateString() },
    { key: "time", label: "Time" },
    { key: "room", label: "Room" },
  ];

  return (
    <DashboardLayout title="Exams">
      <div className="page-header">
        <div><h2>Upcoming Exams</h2></div>
        <Link to="/student/online-exams" className="btn btn-secondary btn-sm">Online Exams</Link>
      </div>
      <DataTable columns={columns} rows={exams} loading={loading} emptyMessage="No upcoming exams scheduled." />
    </DashboardLayout>
  );
};

export default StudentExams;
