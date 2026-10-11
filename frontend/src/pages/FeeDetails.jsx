import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import PublicLayout from "../components/PublicLayout";
import api from "../services/api";

const money = (n) => `\u20B9${Number(n || 0).toLocaleString("en-IN")}`;

const Section = ({ title, badge, note, heads }) => (
  <div className="card card-pad" style={{ marginBottom: 18 }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
      <h3 style={{ margin: 0 }}>{title}</h3>
      <span className={`badge ${badge === "Mandatory" ? "badge-danger" : "badge-info"}`}>{badge}</span>
    </div>
    <p style={{ fontSize: 13.5, margin: "8px 0 14px" }}>{note}</p>
    {heads.length === 0 ? (
      <p style={{ margin: 0, fontSize: 13.5, color: "var(--grey-500)" }}>Amount not published yet - please contact the college office.</p>
    ) : (
      <table className="data-table">
        <tbody>
          {heads.map((h) => (
            <tr key={h._id}><td>{h.name}</td><td style={{ textAlign: "right", fontWeight: 600 }}>{money(h.defaultAmount)}</td></tr>
          ))}
        </tbody>
      </table>
    )}
  </div>
);

const FeeDetails = () => {
  const [data, setData] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    api.get("/fee-heads/public").then((res) => setData(res.data.data)).catch(() => setError(true));
  }, []);

  const pick = (category) => (data?.heads || []).filter((h) => h.category === category);

  return (
    <PublicLayout>
      <section style={{ background: "var(--ink)", padding: "56px 0" }}>
        <div className="container">
          <h1 style={{ color: "#fff", margin: 0 }}>Fee Details</h1>
          {data && <p style={{ color: "rgba(255,255,255,0.75)", margin: "8px 0 0" }}>Academic year {data.academicYear}</p>}
        </div>
      </section>

      <section className="container" style={{ padding: "48px 0 72px", maxWidth: 820 }}>
        {error && <div className="form-error">Fee details are unavailable right now - the API server may not be running.</div>}
        {!data && !error && <div className="loading-state"><span className="spinner" /></div>}

        {data && (
          <>
            <Section
              title="College Fee"
              badge="Mandatory"
              note="Charged to every student at admission."
              heads={pick("college")}
            />
            <Section
              title="Hostel Fee"
              badge="Only if you stay in the hostel"
              note="Added to your fees only when you opt for hostel accommodation. The accounts office switches this on for you."
              heads={pick("hostel")}
            />
            <Section
              title="Transport Fee"
              badge="Only if you use college transport"
              note="Added to your fees only when you use the college bus. The accounts office switches this on for you."
              heads={pick("transport")}
            />
            <div className="card card-pad" style={{ marginBottom: 18 }}>
              <h3 style={{ marginTop: 0 }}>Other Fees</h3>
              <p style={{ margin: 0, fontSize: 13.5 }}>
                Miscellaneous or special fees may be added to your account by the accounts office when applicable. They appear in your fee breakdown with a clear label.
              </p>
            </div>

            <div className="card card-pad" style={{ background: "var(--grey-100)" }}>
              <h4 style={{ marginTop: 0 }}>Already a student?</h4>
              <p style={{ fontSize: 13.5 }}>Log in to see your own fee breakdown, balance, payment history and downloadable receipts.</p>
              <Link to="/login" className="btn btn-primary btn-sm">Log in to the portal</Link>
            </div>
          </>
        )}
      </section>
    </PublicLayout>
  );
};

export default FeeDetails;
