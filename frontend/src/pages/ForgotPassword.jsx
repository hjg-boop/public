import React, { useState } from "react";
import { Link } from "react-router-dom";
import api, { apiErrorMessage } from "../services/api";
import { SITE } from "../config/siteConfig";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [devUrl, setDevUrl] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const res = await api.post("/auth/forgot-password", { email });
      setSent(true);
      if (res.data?.data?.devResetUrl) setDevUrl(res.data.data.devResetUrl);
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--ink)", padding: 20 }}>
      <div className="card" style={{ width: "100%", maxWidth: 420, padding: 32 }}>
        <h2 style={{ marginBottom: 4 }}>Reset your password</h2>
        <p style={{ marginTop: 0, fontSize: 14 }}>{SITE.shortName}</p>

        {error && <div className="form-error">{error}</div>}

        {sent ? (
          <div>
            <p>If that email exists in our system, a reset link has been sent to it.</p>
            {devUrl && (
              <p style={{ fontSize: 13, wordBreak: "break-all" }}>
                Development mode - use this link directly: <Link to={devUrl.replace(window.location.origin, "")}>{devUrl}</Link>
              </p>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="field">
              <label>Email</label>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@college.edu" />
            </div>
            <button className="btn btn-primary" type="submit" disabled={submitting} style={{ width: "100%" }}>
              {submitting ? "Sending..." : "Send reset link"}
            </button>
          </form>
        )}

        <p style={{ textAlign: "center", marginTop: 20, fontSize: 13.5 }}>
          <Link to="/login">&larr; Back to login</Link>
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword;
