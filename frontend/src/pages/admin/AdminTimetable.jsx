import React, { useEffect, useState } from "react";
import DashboardLayout from "../../layouts/DashboardLayout";
import api, { apiErrorMessage } from "../../services/api";
import { useToast } from "../../context/ToastContext";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const AdminTimetable = () => {
  const [branches, setBranches] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [faculty, setFaculty] = useState([]);
  const [filters, setFilters] = useState({ branch: "", year: 1, semester: 1, section: "A" });
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ day: "Monday", periodNumber: 1, startTime: "", endTime: "", subject: "", faculty: "", room: "" });
  const { showToast } = useToast();

  useEffect(() => {
    api.get("/branches").then((res) => setBranches(res.data.data)).catch(() => {});
    api.get("/faculty").then((res) => setFaculty(res.data.data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (filters.branch) {
      api.get("/subjects", { params: { branch: filters.branch, semester: filters.semester } }).then((res) => setSubjects(res.data.data)).catch(() => {});
    }
  }, [filters.branch, filters.semester]);

  const loadTimetable = async () => {
    if (!filters.branch) return;
    setLoading(true);
    try {
      const res = await api.get("/timetable", { params: filters });
      setSlots(res.data.data);
    } catch (err) {
      showToast(apiErrorMessage(err), "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadTimetable(); }, [filters]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleAddSlot = async (e) => {
    e.preventDefault();
    try {
      await api.post("/timetable", { ...filters, ...form });
      showToast("Slot saved", "success");
      setForm({ day: "Monday", periodNumber: 1, startTime: "", endTime: "", subject: "", faculty: "", room: "" });
      loadTimetable();
    } catch (err) {
      showToast(apiErrorMessage(err), "error");
    }
  };

  const removeSlot = async (id) => {
    try {
      await api.delete(`/timetable/${id}`);
      loadTimetable();
    } catch (err) {
      showToast(apiErrorMessage(err), "error");
    }
  };

  const slotFor = (day, period) => slots.find((s) => s.day === day && s.periodNumber === period);
  const maxPeriod = Math.max(6, ...slots.map((s) => s.periodNumber), form.periodNumber || 0);

  return (
    <DashboardLayout title="Timetable">
      <div className="page-header"><div><h2>Timetable</h2><p>Build the weekly class schedule for one branch/year/semester/section.</p></div></div>

      <div className="card" style={{ padding: 20, marginBottom: 20, display: "flex", gap: 16, flexWrap: "wrap" }}>
        <div className="field">
          <label>Branch</label>
          <select value={filters.branch} onChange={(e) => setFilters({ ...filters, branch: e.target.value })}>
            <option value="">Select...</option>
            {branches.map((b) => <option key={b._id} value={b._id}>{b.code}</option>)}
          </select>
        </div>
        <div className="field" style={{ width: 100 }}><label>Year</label><input type="number" min={1} max={5} value={filters.year} onChange={(e) => setFilters({ ...filters, year: e.target.value })} /></div>
        <div className="field" style={{ width: 120 }}><label>Semester</label><input type="number" min={1} max={10} value={filters.semester} onChange={(e) => setFilters({ ...filters, semester: e.target.value })} /></div>
        <div className="field" style={{ width: 100 }}><label>Section</label><input value={filters.section} onChange={(e) => setFilters({ ...filters, section: e.target.value })} /></div>
      </div>

      {filters.branch && (
        <>
          <div className="card" style={{ padding: 20, marginBottom: 20 }}>
            <h4 style={{ marginTop: 0 }}>Add / replace a slot</h4>
            <form onSubmit={handleAddSlot} style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end" }}>
              <div className="field"><label>Day</label><select value={form.day} onChange={(e) => setForm({ ...form, day: e.target.value })}>{DAYS.map((d) => <option key={d}>{d}</option>)}</select></div>
              <div className="field" style={{ width: 90 }}><label>Period</label><input type="number" min={1} value={form.periodNumber} onChange={(e) => setForm({ ...form, periodNumber: e.target.value })} /></div>
              <div className="field" style={{ width: 110 }}><label>Start</label><input type="time" required value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} /></div>
              <div className="field" style={{ width: 110 }}><label>End</label><input type="time" required value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} /></div>
              <div className="field" style={{ minWidth: 200 }}>
                <label>Subject</label>
                <select required value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })}>
                  <option value="">Select...</option>
                  {subjects.map((s) => <option key={s._id} value={s._id}>{s.subjectCode}</option>)}
                </select>
              </div>
              <div className="field" style={{ minWidth: 200 }}>
                <label>Faculty</label>
                <select required value={form.faculty} onChange={(e) => setForm({ ...form, faculty: e.target.value })}>
                  <option value="">Select...</option>
                  {faculty.map((f) => <option key={f._id} value={f._id}>{f.user?.name}</option>)}
                </select>
              </div>
              <div className="field" style={{ width: 100 }}><label>Room</label><input value={form.room} onChange={(e) => setForm({ ...form, room: e.target.value })} /></div>
              <button type="submit" className="btn btn-primary">Save Slot</button>
            </form>
          </div>

          {loading ? <div className="loading-state"><span className="spinner" /></div> : (
            <div className="table-wrap">
              <table className="data-table">
                <thead><tr><th>Period</th>{DAYS.map((d) => <th key={d}>{d}</th>)}</tr></thead>
                <tbody>
                  {Array.from({ length: maxPeriod }, (_, i) => i + 1).map((period) => (
                    <tr key={period}>
                      <td>{period}</td>
                      {DAYS.map((day) => {
                        const slot = slotFor(day, period);
                        return (
                          <td key={day}>
                            {slot ? (
                              <div>
                                <div style={{ fontWeight: 600 }}>{slot.subject?.subjectCode}</div>
                                <div style={{ fontSize: 12 }}>{slot.faculty?.user?.name}</div>
                                <div style={{ fontSize: 11, color: "var(--grey-700)" }}>{slot.startTime}-{slot.endTime} {slot.room}</div>
                                <button className="btn btn-ghost btn-sm" onClick={() => removeSlot(slot._id)}>Remove</button>
                              </div>
                            ) : "-"}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </DashboardLayout>
  );
};

export default AdminTimetable;
