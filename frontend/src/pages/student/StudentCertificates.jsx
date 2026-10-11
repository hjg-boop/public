import React, { useEffect, useState } from "react";
import DashboardLayout from "../../layouts/DashboardLayout";
import DataTable from "../../components/DataTable";
import api, { apiErrorMessage } from "../../services/api";
import { useToast } from "../../context/ToastContext";

const StudentCertificates = () => {
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    api.get("/certificates/mine").then((res) => setCertificates(res.data.data)).catch((err) => showToast(apiErrorMessage(err), "error")).finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const columns = [
    { key: "certificateNumber", label: "Cert No." },
    { key: "type", label: "Type" },
    { key: "issueDate", label: "Issued", render: (r) => new Date(r.issueDate).toLocaleDateString() },
    { key: "fileUrl", label: "Download", render: (r) => r.fileUrl ? <a href={r.fileUrl} target="_blank" rel="noopener noreferrer">View PDF</a> : "-" },
  ];

  return (
    <DashboardLayout title="Certificates">
      <div className="page-header"><div><h2>My Certificates</h2></div></div>
      <DataTable columns={columns} rows={certificates} loading={loading} emptyMessage="No certificates issued yet." />
    </DashboardLayout>
  );
};

export default StudentCertificates;
