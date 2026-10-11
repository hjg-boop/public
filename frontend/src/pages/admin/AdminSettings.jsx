import React, { useEffect, useState } from "react";
import DashboardLayout from "../../layouts/DashboardLayout";
import api, { apiErrorMessage } from "../../services/api";
import { useToast } from "../../context/ToastContext";

const AdminSettings = () => {
  const [settings, setSettings] = useState(null);
  const [logoFile, setLogoFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();

  const load = async () => {
    try {
      const res = await api.get("/settings");
      setSettings(res.data.data);
    } catch (err) { showToast(apiErrorMessage(err), "error"); }
  };
  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put("/settings", {
        collegeName: settings.collegeName,
        address: settings.address,
        email: settings.email,
        phone: settings.phone,
        currentAcademicYear: settings.currentAcademicYear,
        lowAttendanceThreshold: settings.lowAttendanceThreshold,
      });
      if (logoFile) {
        const fd = new FormData();
        fd.append("logo", logoFile);
        await api.post("/settings/logo", fd, { headers: { "Content-Type": "multipart/form-data" } });
      }
      showToast("Settings updated", "success");
      setLogoFile(null);
      load();
    } catch (err) { showToast(apiErrorMessage(err), "error"); } finally { setSaving(false); }
  };

  if (!settings) return <DashboardLayout title="Settings"><div className="loading-state"><span className="spinner" /></div></DashboardLayout>;

  return (
    <DashboardLayout title="Settings">
      <div className="page-header"><div><h2>Settings</h2><p>College identity used on certificates, ID cards and receipts.</p></div></div>
      <form onSubmit={handleSave} className="card" style={{ padding: 24, maxWidth: 560 }}>
        <div className="field"><label>College name</label><input value={settings.collegeName || ""} onChange={(e) => setSettings({ ...settings, collegeName: e.target.value })} /></div>
        <div className="field"><label>Address</label><textarea rows={2} value={settings.address || ""} onChange={(e) => setSettings({ ...settings, address: e.target.value })} /></div>
        <div className="field"><label>Email (shown on receipts)</label><input type="email" value={settings.email || ""} onChange={(e) => setSettings({ ...settings, email: e.target.value })} /></div>
        <div className="field"><label>Phone (shown on receipts)</label><input value={settings.phone || ""} onChange={(e) => setSettings({ ...settings, phone: e.target.value })} /></div>
        <div className="field">
          <label>College logo</label>
          {settings.logo?.url && <img src={settings.logo.url} alt="" style={{ height: 60, display: "block", marginBottom: 8 }} />}
          <input type="file" accept="image/*" onChange={(e) => setLogoFile(e.target.files[0])} />
        </div>
        <div className="field"><label>Current academic year</label><input value={settings.currentAcademicYear || ""} onChange={(e) => setSettings({ ...settings, currentAcademicYear: e.target.value })} /></div>
        <div className="field"><label>Low attendance threshold (%)</label><input type="number" min={0} max={100} value={settings.lowAttendanceThreshold} onChange={(e) => setSettings({ ...settings, lowAttendanceThreshold: e.target.value })} /></div>
        <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? "Saving..." : "Save settings"}</button>
      </form>
    </DashboardLayout>
  );
};

export default AdminSettings;
