import React, { useEffect, useRef, useState } from "react";
import DashboardLayout from "../../layouts/DashboardLayout";
import api, { apiErrorMessage } from "../../services/api";
import { useToast } from "../../context/ToastContext";

// Faculty never pick a semester/section/subject by hand: the backend reads
// their own timetable, matches it against the current day + clock time, and
// tells us which class is active right now (GET /attendance/current-class).
// Re-polling that endpoint is what makes the screen move on to the next
// period on its own once the current one's time slot ends - nothing here
// hard-codes a 55-minute duration, it just reflects whatever start/end times
// the timetable actually has.
const POLL_MS = 30000;

const fmtSlot = (slot) =>
  slot ? `${slot.subject?.subjectCode} - ${slot.branch?.code} Y${slot.year} S${slot.semester} ${slot.section}` : "";

const FacultyAttendance = () => {
  const [loading, setLoading] = useState(true);
  const [current, setCurrent] = useState(null); // response from /attendance/current-class
  const [manualSlot, setManualSlot] = useState(null); // a slot picked from today's list, overriding "live" mode
  const [statusMap, setStatusMap] = useState({});
  const [students, setStudents] = useState([]);
  const [alreadyMarked, setAlreadyMarked] = useState(false);
  const [saving, setSaving] = useState(false);
  const [switchAvailable, setSwitchAvailable] = useState(false);
  const liveSlotIdRef = useRef(undefined);
  const { showToast } = useToast();

  const applySlotData = (studentList, existingMap, marked) => {
    setStudents(studentList);
    setAlreadyMarked(marked);
    const next = {};
    studentList.forEach((s) => {
      next[s._id] = existingMap[s._id] || "present"; // unmarked defaults to present, tap to flip to absent
    });
    setStatusMap(next);
  };

  const fetchCurrent = async ({ silent } = {}) => {
    try {
      const res = await api.get("/attendance/current-class");
      const data = res.data.data;
      setCurrent(data);

      if (!manualSlot) {
        // Auto mode: always reflect whichever class is active right now.
        const newActiveId = data.active ? data.slot._id : null;
        if (newActiveId !== liveSlotIdRef.current) {
          liveSlotIdRef.current = newActiveId;
          if (data.active) {
            const existingMap = {};
            data.students.forEach((s) => { if (s.existingStatus) existingMap[s._id] = s.existingStatus; });
            applySlotData(data.students, existingMap, data.alreadyMarked);
          } else {
            setStudents([]);
          }
        }
        setSwitchAvailable(false);
      } else {
        // Reviewing a different period from today's list - don't yank it
        // away, just let them know a (new) live period is available.
        setSwitchAvailable(data.active && data.slot._id !== manualSlot._id);
      }
    } catch (err) {
      if (!silent) showToast(apiErrorMessage(err), "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrent();
    const id = setInterval(() => fetchCurrent({ silent: true }), POLL_MS);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [manualSlot]);

  const viewSlot = async (slot) => {
    setManualSlot(slot);
    setLoading(true);
    try {
      const res = await api.get("/attendance/roster", {
        params: { branch: slot.branch._id || slot.branch, year: slot.year, semester: slot.semester, section: slot.section },
      });
      // The roster endpoint doesn't carry existing marks for this specific
      // subject+period, so cross-reference today's current-class payload
      // when it happens to be the same slot, otherwise default everyone to
      // present (first time marking that period today).
      const existingMap = {};
      if (current?.slot?._id === slot._id) {
        current.students.forEach((s) => { if (s.existingStatus) existingMap[s._id] = s.existingStatus; });
      }
      applySlotData(res.data.data, existingMap, current?.slot?._id === slot._id ? current.alreadyMarked : false);
    } catch (err) {
      showToast(apiErrorMessage(err), "error");
    } finally {
      setLoading(false);
    }
  };

  const returnToLive = () => {
    setManualSlot(null);
    liveSlotIdRef.current = undefined; // force a resync on the next fetch
    fetchCurrent();
  };

  const toggle = (studentId) => {
    setStatusMap((prev) => ({ ...prev, [studentId]: prev[studentId] === "present" ? "absent" : "present" }));
  };

  const activeSlot = manualSlot || current?.slot;

  const handleSave = async () => {
    if (!activeSlot) return;
    setSaving(true);
    try {
      await api.post("/attendance/mark", {
        subject: activeSlot.subject._id,
        branch: activeSlot.branch._id,
        year: activeSlot.year,
        semester: activeSlot.semester,
        section: activeSlot.section,
        date: new Date().toISOString().slice(0, 10),
        periodNumber: activeSlot.periodNumber,
        records: students.map((s) => ({ student: s._id, status: statusMap[s._id] || "absent" })),
      });
      showToast("Attendance saved", "success");
      setAlreadyMarked(true);
    } catch (err) {
      showToast(apiErrorMessage(err), "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <DashboardLayout title="Attendance"><div className="loading-state"><span className="spinner" /></div></DashboardLayout>;

  const presentCount = students.filter((s) => statusMap[s._id] === "present").length;

  return (
    <DashboardLayout title="Attendance">
      <div className="page-header">
        <div>
          <h2>Attendance</h2>
          <p>Automatically follows your timetable - no need to pick a class.</p>
        </div>
      </div>

      {switchAvailable && (
        <div className="card" style={{ padding: "10px 16px", marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--grey-100)" }}>
          <span style={{ fontSize: 13.5 }}>A new period ({fmtSlot(current.slot)}) is now live.</span>
          <button className="btn btn-primary btn-sm" onClick={returnToLive}>Switch to it</button>
        </div>
      )}

      {!activeSlot ? (
        <div className="card" style={{ padding: 24 }}>
          <p style={{ margin: 0 }}>No class is active right now.</p>
          {current?.todaySlots?.length > 0 && (
            <>
              <p style={{ fontSize: 13.5, color: "var(--grey-700)", marginTop: 12 }}>Today's periods - tap one to mark/review it:</p>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {current.todaySlots.map((slot) => (
                  <button key={slot._id} className="btn btn-secondary btn-sm" onClick={() => viewSlot(slot)}>
                    P{slot.periodNumber} - {fmtSlot(slot)} ({slot.startTime}-{slot.endTime})
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      ) : (
        <>
          <div className="card" style={{ padding: 16, marginBottom: 20, display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 12, alignItems: "center" }}>
            <div>
              <strong>{fmtSlot(activeSlot)}</strong>
              <div style={{ fontSize: 13, color: "var(--grey-700)" }}>
                Period {activeSlot.periodNumber} - {activeSlot.startTime}-{activeSlot.endTime}
                {manualSlot && manualSlot._id !== current?.slot?._id ? " (reviewing - not the live period)" : ""}
                {alreadyMarked ? " - already marked today, editing is fine" : ""}
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              {manualSlot && <button className="btn btn-ghost btn-sm" onClick={returnToLive}>Back to live period</button>}
              <span style={{ fontSize: 13.5 }}>{presentCount}/{students.length} present</span>
            </div>
          </div>

          {current?.todaySlots?.length > 1 && (
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
              {current.todaySlots.map((slot) => (
                <button
                  key={slot._id}
                  className={`btn btn-sm ${activeSlot._id === slot._id ? "btn-primary" : "btn-ghost"}`}
                  onClick={() => viewSlot(slot)}
                >
                  P{slot.periodNumber}
                </button>
              ))}
            </div>
          )}

          {/* Roll-number button grid: tap a student to flip present <-> absent. */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 12, marginBottom: 24 }}>
            {students.map((s) => {
              const present = statusMap[s._id] === "present";
              return (
                <button
                  key={s._id}
                  onClick={() => toggle(s._id)}
                  title={s.user?.name}
                  style={{
                    padding: "14px 10px",
                    borderRadius: 10,
                    border: "none",
                    cursor: "pointer",
                    fontWeight: 700,
                    fontSize: 14,
                    letterSpacing: 0.3,
                    color: "#fff",
                    background: present ? "var(--ink)" : "var(--danger, #c0392b)",
                    boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
                    transition: "background 0.15s",
                  }}
                >
                  <div>{s.rollNumber}</div>
                  <div style={{ fontSize: 10.5, fontWeight: 500, opacity: 0.85, marginTop: 2 }}>{present ? "Present" : "Absent"}</div>
                </button>
              );
            })}
            {students.length === 0 && <p>No students found for this class.</p>}
          </div>

          <button className="btn btn-primary" onClick={handleSave} disabled={saving || students.length === 0}>
            {saving ? "Saving..." : alreadyMarked ? "Update Attendance" : "Save Attendance"}
          </button>
        </>
      )}
    </DashboardLayout>
  );
};

export default FacultyAttendance;
