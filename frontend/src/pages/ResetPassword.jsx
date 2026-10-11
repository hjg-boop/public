import React, { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import api, { apiErrorMessage } from "../services/api";
import { SITE } from "../config/siteConfig";

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }
    setSubmitting(true);
    try {
      await api.post(`/auth/reset-password/${token}`, { password });
      setDone(true);
      setTimeout(() => navigate("/login"), 1500);
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--ink)", padding: 20 }}>
      <div className="card" style={{ width: "100%", maxWidth: 420, padding: 32 }}>
        <h2 style={{ marginBottom: 4 }}>Set a new password</h2>
        <p style={{ marginTop: 0, fontSize: 14 }}>{SITE.shortName}</p>
        {error && <div className="form-error">{error}</div>}
        {done ? (
          <p>Password reset. Redirecting to login...</p>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="field">
              <label>New password</label>
              <input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <div className="field">
              <label>Confirm new password</label>
              <input type="password" required minLength={6} value={confirm} onChange={(e) => setConfirm(e.target.value)} />
            </div>
            <button className="btn btn-primary" type="submit" disabled={submitting} style={{ width: "100%" }}>
              {submitting ? "Saving..." : "Reset password"}
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

export default ResetPassword;
