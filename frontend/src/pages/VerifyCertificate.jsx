import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../services/api";
import { SITE } from "../config/siteConfig";

const VerifyCertificate = () => {
  const { code } = useParams();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/certificates/verify/${code}`).then((res) => setResult(res.data.data)).catch(() => setResult({ valid: false })).finally(() => setLoading(false));
  }, [code]);

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--ink)", padding: 20 }}>
      <div className="card" style={{ width: "100%", maxWidth: 420, padding: 32, textAlign: "center" }}>
        <h2>{SITE.shortName}</h2>
        {loading ? (
          <p>Verifying...</p>
        ) : result?.valid ? (
          <>
            <div style={{ fontSize: 40, color: "#2e7d32" }}>&#10003;</div>
            <h3>Certificate Verified</h3>
            <p><strong>{result.type}</strong></p>
            <p>Certificate No: {result.certificateNumber}</p>
            <p>Issued to: {result.studentName}</p>
            <p>Branch: {result.branch}</p>
            <p>Issue date: {new Date(result.issueDate).toLocaleDateString()}</p>
          </>
        ) : (
          <>
            <div style={{ fontSize: 40, color: "#c0392b" }}>&#10007;</div>
            <h3>Not a valid certificate</h3>
            <p>This QR code / link does not match any certificate issued by {SITE.collegeName}.</p>
          </>
        )}
        <p style={{ marginTop: 20 }}><Link to="/">&larr; Back to homepage</Link></p>
      </div>
    </div>
  );
};

export default VerifyCertificate;
