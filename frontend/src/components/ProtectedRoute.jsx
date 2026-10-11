import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// The 5 roles this app currently has dashboards for. Kept as a local
// constant (rather than trusting any role string from storage/the API) so a
// stale session from a role that no longer exists (e.g. a cached
// "super_admin" session from before that role was removed) can't bounce
// between routes forever - it gets logged out instead.
const KNOWN_ROLES = ["admin", "hod", "faculty", "accountant", "student"];

const ProtectedRoute = ({ roles, children }) => {
  const { user, loading, logout } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="loading-state">
        <span className="spinner" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!KNOWN_ROLES.includes(user.role)) {
    // Unrecognized role (e.g. an old account type that no longer exists) -
    // there's no dashboard to send them to, so sign them out cleanly.
    logout();
    return <Navigate to="/login" replace />;
  }

  if (roles && !roles.includes(user.role)) {
    // Logged in, but wrong role for this URL -> send to their own dashboard
    return <Navigate to={`/${user.role}`} replace />;
  }

  return children;
};

export default ProtectedRoute;
