import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../services/api";
import { SITE } from "../config/siteConfig";

const VerifyId = () => {
  const { kind, id, code } = useParams();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/id-card/verify/${kind}/${id}/${code}`).then((res) => setResult(res.data.data)).catch(() => setResult({ valid: false })).finally(() => setLoading(false));
  }, [kind, id, code]);

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--ink)", padding: 20 }}>
      <div className="card" style={{ width: "100%", maxWidth: 420, padding: 32, textAlign: "center" }}>
        <h2>{SITE.shortName}</h2>
        {loading ? (
          <p>Verifying...</p>
        ) : result?.valid ? (
          <>
            <div style={{ fontSize: 40, color: "#2e7d32" }}>&#10003;</div>
            <h3>{result.kind === "student" ? "Student ID Verified" : "Faculty ID Verified"}</h3>
            <p><strong>{result.name}</strong></p>
            {result.kind === "student" ? (
              <>
                <p>Roll Number: {result.rollNumber}</p>
                <p>Branch: {result.branch}</p>
              </>
            ) : (
              <>
                <p>Employee ID: {result.employeeId}</p>
                <p>Department: {result.department}</p>
              </>
            )}
          </>
        ) : (
          <>
            <div style={{ fontSize: 40, color: "#c0392b" }}>&#10007;</div>
            <h3>Not a valid ID card</h3>
          </>
        )}
        <p style={{ marginTop: 20 }}><Link to="/">&larr; Back to homepage</Link></p>
      </div>
    </div>
  );
};

export default VerifyId;
