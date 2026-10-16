import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import DashboardLayout from "../../layouts/DashboardLayout";
import api, { apiErrorMessage } from "../../services/api";
import { useToast } from "../../context/ToastContext";

const HodDashboard = () => {
  const [stats, setStats] = useState(null);
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    Promise.all([api.get("/dashboard/hod-stats"), api.get("/attendance/department-overview")])
      .then(([s, o]) => { setStats(s.data.data); setOverview(o.data.data); })
      .catch((err) => showToast(apiErrorMessage(err), "error"))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <DashboardLayout title="Dashboard">
      <section className="portal-welcome">
        <div>
          <span className="portal-eyebrow">Department head portal</span>
          <h2>Department overview</h2>
          <p>Today’s attendance and the latest department snapshot.</p>
        </div>
        <Link to="/hod/attendance" className="btn btn-primary admin-report-button">Attendance</Link>
      </section>

      {loading && <div className="loading-state"><span className="spinner" /></div>}

      {!loading && (
        <>
          <section className="portal-section">
            <div className="portal-section-heading">
              <h3>Department at a glance</h3>
            </div>
            <div className="portal-stats hod-stats">
              <div className="portal-stat-card">
                <span className="portal-stat-icon blue">♙</span>
                <span className="portal-stat-value">{stats?.totalStudents ?? 0}</span>
                <span className="portal-stat-label">Students</span>
              </div>
              <div className="portal-stat-card">
                <span className="portal-stat-icon green">♧</span>
                <span className="portal-stat-value">{stats?.totalFaculty ?? 0}</span>
                <span className="portal-stat-label">Faculty</span>
              </div>
              <div className="portal-stat-card">
                <span className="portal-stat-icon purple">▦</span>
                <span className="portal-stat-value">{stats?.totalSubjects ?? 0}</span>
                <span className="portal-stat-label">Subjects</span>
              </div>
              <div className="portal-stat-card">
                <span className="portal-stat-icon orange">▤</span>
                <span className="portal-stat-value">{stats?.totalSections ?? 0}</span>
                <span className="portal-stat-label">Sections</span>
              </div>
            </div>
          </section>

          <section className="portal-section">
            <div className="portal-section-heading">
              <h3>Attendance today</h3>
              <Link to="/hod/attendance">View all</Link>
            </div>
            <div className="portal-stats attendance-stats">
              <div className="attendance-summary-card">
                <span className="portal-stat-icon green">✓</span>
                <div>
                  <strong>{overview?.presentToday ?? 0}</strong>
                  <span>Present</span>
                </div>
              </div>
              <div className="attendance-summary-card">
                <span className="portal-stat-icon red">×</span>
                <div>
                  <strong>{overview?.absentToday ?? 0}</strong>
                  <span>Absent</span>
                </div>
              </div>
            </div>
          </section>

          <section className="portal-section">
            <div className="portal-section-heading">
              <h3>Students needing attention</h3>
              <Link to="/hod/attendance">View all</Link>
            </div>
            <div className="card portal-list-card">
              {(overview?.lowAttendanceStudents || []).slice(0, 5).map((row) => {
                const percentage = Math.max(0, Math.min(100, Number(row.percentage) || 0));
                return (
                  <div key={row.student._id} className="hod-student-row">
                    <span className="welcome-avatar">{(row.student.user?.name || row.student.rollNumber || "?").slice(0, 1).toUpperCase()}</span>
                    <div className="hod-student-info">
                      <strong>{row.student.user?.name || "Student"}</strong>
                      <small>{row.student.rollNumber}</small>
                    </div>
                    <div className="hod-attendance-progress">
                      <span className="hod-attendance-track"><span style={{ width: `${percentage}%` }} /></span>
                      <strong>{percentage}%</strong>
                    </div>
                  </div>
                );
              })}
              {(!overview?.lowAttendanceStudents || overview.lowAttendanceStudents.length === 0) && (
                <p className="portal-empty">No students below the {overview?.threshold ?? 75}% attendance threshold.</p>
              )}
            </div>
            {(overview?.lowAttendanceStudents?.length || 0) > 5 && (
              <p className="portal-list-footnote">
                Showing 5 of {overview.lowAttendanceStudents.length} students below the threshold.
              </p>
            )}
          </section>

          <section className="portal-section">
            <div className="portal-section-heading"><h3>Quick actions</h3></div>
            <div className="portal-quick-grid">
              <Link to="/hod/attendance" className="portal-quick-card"><span className="portal-stat-icon blue">✓</span><span>Attendance</span></Link>
              <Link to="/hod/students" className="portal-quick-card"><span className="portal-stat-icon green">♙</span><span>Students</span></Link>
              <Link to="/hod/faculty" className="portal-quick-card"><span className="portal-stat-icon purple">♧</span><span>Faculty</span></Link>
              <Link to="/hod/subjects" className="portal-quick-card"><span className="portal-stat-icon orange">▦</span><span>Subjects</span></Link>
            </div>
          </section>
        </>
      )}
    </DashboardLayout>
  );
};

export default HodDashboard;
