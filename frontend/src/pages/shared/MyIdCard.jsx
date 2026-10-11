import React, { useEffect, useState } from "react";
import DashboardLayout from "../../layouts/DashboardLayout";
import api, { apiErrorMessage } from "../../services/api";
import { useToast } from "../../context/ToastContext";

const MyIdCard = () => {
  const [card, setCard] = useState(null);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    api.get("/id-card/mine").then((res) => setCard(res.data.data)).catch((err) => showToast(apiErrorMessage(err), "error")).finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const downloadPdf = () => {
    const token = localStorage.getItem("cp_token");
    const base = api.defaults.baseURL;
    // Open with the token as a query-string fallback isn't supported by our auth
    // middleware (header-only), so fetch as a blob and trigger a download instead.
    fetch(`${base}/id-card/mine/pdf`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.blob())
      .then((blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "id-card.pdf";
        a.click();
        URL.revokeObjectURL(url);
      })
      .catch(() => showToast("Could not download ID card", "error"));
  };

  if (loading) return <DashboardLayout title="Digital ID Card"><div className="loading-state"><span className="spinner" /></div></DashboardLayout>;
  if (!card) return <DashboardLayout title="Digital ID Card"><p>ID card not available.</p></DashboardLayout>;

  return (
    <DashboardLayout title="Digital ID Card">
      <div className="page-header"><div><h2>Digital ID Card</h2></div></div>
      <div
        style={{
          width: 280, borderRadius: 14, background: "#101828", color: "#fff", padding: 20,
          display: "flex", flexDirection: "column", alignItems: "center", gap: 6, textAlign: "center",
        }}
      >
        {card.photo ? (
          <img src={card.photo} alt="" style={{ width: 72, height: 72, borderRadius: "50%", objectFit: "cover", marginBottom: 8 }} />
        ) : (
          <div style={{ width: 72, height: 72, borderRadius: "50%", background: "#333", marginBottom: 8 }} />
        )}
        <div style={{ fontSize: 12, letterSpacing: 1, color: "#bbb" }}>{card.collegeName}</div>
        <div style={{ fontSize: 11, color: "#888" }}>{card.kind === "student" ? "STUDENT ID" : "FACULTY ID"}</div>
        <div style={{ fontSize: 16, fontWeight: 600, marginTop: 6 }}>{card.name}</div>
        {card.kind === "student" ? (
          <>
            <div style={{ fontSize: 13, color: "#ccc" }}>Roll No: {card.rollNumber}</div>
            <div style={{ fontSize: 13, color: "#ccc" }}>{card.branch} - Year {card.year}, Sem {card.semester}</div>
          </>
        ) : (
          <>
            <div style={{ fontSize: 13, color: "#ccc" }}>Employee ID: {card.employeeId}</div>
            <div style={{ fontSize: 13, color: "#ccc" }}>{card.department} - {card.designation}</div>
          </>
        )}
        <img
          src={`https://api.qrserver.com/v1/create-qr-code/?size=110x110&data=${encodeURIComponent(card.verifyUrl)}`}
          alt="Verification QR code"
          style={{ marginTop: 10, borderRadius: 6, background: "#fff", padding: 6 }}
        />
      </div>
      <button className="btn btn-secondary" style={{ marginTop: 16 }} onClick={downloadPdf}>Download PDF</button>
    </DashboardLayout>
  );
};

export default MyIdCard;
