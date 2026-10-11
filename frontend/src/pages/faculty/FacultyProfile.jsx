import React, { useEffect, useState } from "react";
import DashboardLayout from "../../layouts/DashboardLayout";
import api, { apiErrorMessage } from "../../services/api";
import { useToast } from "../../context/ToastContext";

const FacultyProfile = () => {
  const [data, setData] = useState(null);
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get("/faculty/me");
      setData(res.data.data);
      setPhone(res.data.data.faculty.user?.phone || "");
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
      await api.put(`/faculty/${data.faculty._id}`, { phone });
      showToast("Profile updated", "success");
      load();
    } catch (err) {
      showToast(apiErrorMessage(err), "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading || !data) {
    return (
      <DashboardLayout title="Profile">
        <div className="loading-state">
          <span className="spinner" />
        </div>
      </DashboardLayout>
    );
  }

  const { faculty } = data;

  return (
    <DashboardLayout title="Profile">
      <div className="page-header">
        <div>
          <h2>My profile</h2>
          <p>Contact details can be updated here. Department and role are managed by admin.</p>
        </div>
      </div>

      <div className="card card-pad" style={{ maxWidth: 560 }}>
        <div className="form-grid">
          <div className="field">
            <label>Name</label>
            <input value={faculty.user?.name || ""} disabled />
          </div>
          <div className="field">
            <label>Employee ID</label>
            <input value={faculty.employeeId} disabled />
          </div>
          <div className="field">
            <label>Email</label>
            <input value={faculty.user?.email || ""} disabled />
          </div>
          <div className="field">
            <label>Department</label>
            <input value={faculty.department?.name || ""} disabled />
          </div>
          <div className="field">
            <label>Designation</label>
            <input value={faculty.designation} disabled />
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

export default FacultyProfile;
