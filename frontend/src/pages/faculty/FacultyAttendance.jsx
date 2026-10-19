import React, { useEffect, useRef, useState } from "react";
import DashboardLayout from "../../layouts/DashboardLayout";
import api, { apiErrorMessage } from "../../services/api";
import { useToast } from "../../context/ToastContext";

const POLL_MS = 30000;
const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const todayDate = () => {
  const today = new Date();
  const local = new Date(today.getTime() - today.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
};

const dayForDate = (date) => DAY_NAMES[new Date(`${date}T00:00:00.000Z`).getUTCDay()];
const fmtSlot = (slot) =>
  slot ? `${slot.subject?.subjectCode} - ${slot.branch?.code} Y${slot.year} S${slot.semester} ${slot.section}` : "";

const FacultyAttendance = () => {
  const [loading, setLoading] = useState(true);
  const [current, setCurrent] = useState(null);
  const [timetableSlots, setTimetableSlots] = useState([]);
  const [manualSlot, setManualSlot] = useState(null);
  const [selectedDate, setSelectedDate] = useState(todayDate);
  const [statusMap, setStatusMap] = useState({});
  const [students, setStudents] = useState([]);
  const [sessionSummary, setSessionSummary] = useState(null);
  const [alreadyMarked, setAlreadyMarked] = useState(false);
  const [saving, setSaving] = useState(false);
  const [switchAvailable, setSwitchAvailable] = useState(false);
  const liveSlotIdRef = useRef(undefined);
  const { showToast } = useToast();

  const applySlotData = (studentList, existingMap, marked, summary = null) => {
    setStudents(studentList);
    setAlreadyMarked(marked);
    setSessionSummary(summary || {
      sessionExists: marked,
      totalStudents: studentList.length,
      absentees: studentList.filter((student) => existingMap[student._id] === "absent").map((student) => student.rollNumber),
    });
    const next = {};
    studentList.forEach((student) => {
      next[student._id] = existingMap[student._id] || "present";
    });
    setStatusMap(next);
  };

  const fetchCurrent = async ({ silent } = {}) => {
    try {
      const res = await api.get("/attendance/current-class");
      const data = res.data.data;
      setCurrent(data);

      if (!manualSlot && selectedDate === todayDate()) {
        const newActiveId = data.active ? data.slot._id : null;
        if (newActiveId !== liveSlotIdRef.current) {
          liveSlotIdRef.current = newActiveId;
          if (data.active) {
            const existingMap = {};
            data.students.forEach((student) => {
              if (student.existingStatus) existingMap[student._id] = student.existingStatus;
            });
            applySlotData(data.students, existingMap, data.alreadyMarked);
          } else {
            setStudents([]);
            setSessionSummary(null);
          }
        }
        setSwitchAvailable(false);
      } else if (manualSlot) {
        setSwitchAvailable(data.active && data.slot._id !== manualSlot._id);
      }
    } catch (err) {
      if (!silent) showToast(apiErrorMessage(err), "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    api.get("/timetable/mine")
      .then((res) => setTimetableSlots(res.data.data))
      .catch((err) => showToast(apiErrorMessage(err), "error"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchCurrent();
    const id = setInterval(() => fetchCurrent({ silent: true }), POLL_MS);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [manualSlot, selectedDate]);

  const viewSlot = async (slot, date = selectedDate) => {
    setManualSlot(slot);
    setLoading(true);
    try {
      const params = {
        branch: slot.branch._id || slot.branch,
        year: slot.year,
        semester: slot.semester,
        section: slot.section,
      };
      const sessionParams = {
        branchId: params.branch,
        subjectId: slot.subject._id || slot.subject,
        year: slot.year,
        semester: slot.semester,
        section: slot.section || "A",
        periodNumber: slot.periodNumber,
        date,
      };
      const [rosterResponse, sessionResponse] = await Promise.all([
        api.get("/attendance/roster", { params }),
        api.get("/attendance/session", { params: sessionParams }),
      ]);
      const roster = rosterResponse.data.data;
      const summary = sessionResponse.data.data;
      const byRollNumber = Object.fromEntries(
        summary.records.map((record) => [record.rollNumber, record.status.toLowerCase()])
      );
      const existingMap = Object.fromEntries(
        roster
          .filter((student) => byRollNumber[student.rollNumber])
          .map((student) => [student._id, byRollNumber[student.rollNumber]])
      );
      setSelectedDate(date);
      applySlotData(roster, existingMap, summary.sessionExists, summary);
    } catch (err) {
      showToast(apiErrorMessage(err), "error");
    } finally {
      setLoading(false);
    }
  };

  const daySlots = selectedDate === todayDate()
    ? (current?.todaySlots || [])
    : timetableSlots.filter((slot) => slot.day === dayForDate(selectedDate));
  const activeSlot = manualSlot || (selectedDate === todayDate() ? current?.slot : null);

  const changeDate = (date) => {
    setSelectedDate(date);
    setSessionSummary(null);
    if (date === todayDate()) {
      setManualSlot(null);
      liveSlotIdRef.current = undefined;
      return;
    }

    const previousSlot = activeSlot;
    const slotsForDate = timetableSlots.filter((slot) => slot.day === dayForDate(date));
    const targetSlot = slotsForDate.find((slot) => slot.periodNumber === previousSlot?.periodNumber) || slotsForDate[0];
    if (targetSlot) viewSlot(targetSlot, date);
    else {
      setManualSlot(null);
      setStudents([]);
      setStatusMap({});
      setAlreadyMarked(false);
    }
  };

  const returnToLive = () => {
    setSelectedDate(todayDate());
    setManualSlot(null);
    liveSlotIdRef.current = undefined;
    fetchCurrent();
  };

  const toggle = (studentId) => {
    setStatusMap((prev) => ({
      ...prev,
      [studentId]: prev[studentId] === "present" ? "absent" : "present",
    }));
  };

  const handleSave = async () => {
    if (!activeSlot) return;
    setSaving(true);
    try {
      await api.put("/attendance/update", {
        subject: activeSlot.subject._id || activeSlot.subject,
        branch: activeSlot.branch._id || activeSlot.branch,
        year: activeSlot.year,
        semester: activeSlot.semester,
        section: activeSlot.section,
        date: selectedDate,
        periodNumber: activeSlot.periodNumber,
        records: students.map((student) => ({
          student: student._id,
          status: statusMap[student._id] || "absent",
        })),
      });
      const absentees = students
        .filter((student) => statusMap[student._id] === "absent")
        .map((student) => student.rollNumber);
      setAlreadyMarked(true);
      setSessionSummary({
        sessionExists: true,
        date: selectedDate,
        periodNumber: activeSlot.periodNumber,
        totalStudents: students.length,
        presentCount: students.length - absentees.length,
        absentCount: absentees.length,
        absentees,
      });
      showToast("Attendance updated successfully.", "success");
    } catch (err) {
      showToast(apiErrorMessage(err), "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <DashboardLayout title="Attendance"><div className="loading-state"><span className="spinner" /></div></DashboardLayout>;

  const presentCount = students.filter((student) => statusMap[student._id] === "present").length;

  return (
    <DashboardLayout title="Attendance">
      <div className="page-header">
        <div>
          <h2>Attendance</h2>
          <p>Choose a date and period to review or update attendance.</p>
        </div>
      </div>

      {switchAvailable && (
        <div className="card" style={{ padding: "10px 16px", marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--grey-100)" }}>
          <span style={{ fontSize: 13.5 }}>A new period ({fmtSlot(current.slot)}) is now live.</span>
          <button className="btn btn-primary btn-sm" onClick={returnToLive}>Switch to it</button>
        </div>
      )}

      <div className="attendance-session-toolbar">
        <label htmlFor="attendance-session-date">Attendance date</label>
        <input id="attendance-session-date" type="date" value={selectedDate} max={todayDate()} onChange={(event) => changeDate(event.target.value)} />
        {selectedDate === todayDate() && <span>Today’s live class is selected automatically.</span>}
      </div>

      {!activeSlot ? (
        <div className="card attendance-period-picker">
          <p>{selectedDate === todayDate() ? "No class is active right now." : `Choose a period for ${dayForDate(selectedDate)} to review attendance.`}</p>
          {daySlots.length > 0 ? (
            <div className="attendance-period-tabs">
              {daySlots.map((slot) => (
                <button key={slot._id} className="btn btn-secondary btn-sm" onClick={() => viewSlot(slot)}>
                  P{slot.periodNumber} · {fmtSlot(slot)}
                </button>
              ))}
            </div>
          ) : (
            <p className="attendance-no-periods">No timetable periods are scheduled for this date.</p>
          )}
        </div>
      ) : (
        <>
          <div className="card attendance-session-card">
            <div>
              <strong>{fmtSlot(activeSlot)}</strong>
              <div className="attendance-session-meta">
                Period {activeSlot.periodNumber} · {activeSlot.startTime}-{activeSlot.endTime} · {selectedDate}
                {alreadyMarked ? " · saved session — editing is available" : " · not yet saved"}
              </div>
            </div>
            <div className="attendance-session-actions">
              {selectedDate !== todayDate() && <button className="btn btn-ghost btn-sm" onClick={returnToLive}>Back to today</button>}
              <span>{presentCount}/{students.length} present</span>
            </div>
          </div>

          {daySlots.length > 1 && (
            <div className="attendance-period-tabs attendance-period-tabs-active">
              {daySlots.map((slot) => (
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

          {sessionSummary?.sessionExists && sessionSummary.absentCount > 0 && (
            <div className="attendance-absent-summary" role="status">
              <strong>{sessionSummary.absentCount} {sessionSummary.absentCount === 1 ? "student" : "students"} absent:</strong>
              <span>{sessionSummary.absentees.join(", ")}</span>
            </div>
          )}
          {sessionSummary?.sessionExists && sessionSummary.absentCount === 0 && (
            <div className="attendance-all-present-summary" role="status">All students were marked present for this session.</div>
          )}

          <div className="attendance-student-grid">
            {students.map((student) => {
              const present = statusMap[student._id] === "present";
              return (
                <button
                  key={student._id}
                  className={`attendance-student-card ${present ? "is-present" : "is-absent"}`}
                  onClick={() => toggle(student._id)}
                  title={student.user?.name}
                  aria-pressed={!present}
                >
                  <span>{student.rollNumber}</span>
                  <small>{present ? "Present" : "Absent"}</small>
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
