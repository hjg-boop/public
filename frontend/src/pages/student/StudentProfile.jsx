import React, { useEffect, useState } from "react";
import DashboardLayout from "../../layouts/DashboardLayout";
import api, { apiErrorMessage } from "../../services/api";
import { useToast } from "../../context/ToastContext";

const StudentProfile = () => {
  const [profile, setProfile] = useState(null);
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get("/students/me");
      setProfile(res.data.data);
      setPhone(res.data.data.user?.phone || "");
    } catch (err) {
      showToast(apiErrorMessage(err), "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put(`/students/${profile._id}`, { phone });
      showToast("Profile updated", "success");
      load();
    } catch (err) {
      showToast(apiErrorMessage(err), "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="Profile">
        <div className="loading-state">
          <span className="spinner" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Profile">
      <div className="page-header">
        <div>
          <h2>My profile</h2>
          <p>Contact details can be updated here. Academic details are managed by admin.</p>
        </div>
      </div>

      <div className="card card-pad" style={{ maxWidth: 560 }}>
        <div className="form-grid">
          <div className="field">
            <label>Name</label>
            <input value={profile.user?.name || ""} disabled />
          </div>
          <div className="field">
            <label>Roll number</label>
            <input value={profile.rollNumber} disabled />
          </div>
          <div className="field">
            <label>Email</label>
            <input value={profile.user?.email || ""} disabled />
          </div>
          <div className="field">
            <label>Branch</label>
            <input value={profile.branch?.name || ""} disabled />
          </div>
          <div className="field">
            <label>Year</label>
            <input value={profile.year} disabled />
          </div>
          <div className="field">
            <label>Semester</label>
            <input value={profile.semester} disabled />
          </div>
          <div className="field">
            <label>Section</label>
            <input value={profile.section} disabled />
          </div>
        </div>

        <form onSubmit={handleSave}>
          <div className="field" style={{ maxWidth: 260 }}>
            <label>Phone number</label>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Your phone number" />
          </div>
          <button className="btn btn-primary" type="submit" disabled={saving}>
            {saving ? "Saving..." : "Save changes"}
          </button>
        </form>
      </div>
    </DashboardLayout>
  );
};

export default StudentProfile;
