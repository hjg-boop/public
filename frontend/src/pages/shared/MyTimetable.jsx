import React, { useEffect, useState } from "react";
import DashboardLayout from "../../layouts/DashboardLayout";
import api, { apiErrorMessage } from "../../services/api";
import { useToast } from "../../context/ToastContext";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const MyTimetable = () => {
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    api.get("/timetable/mine").then((res) => setSlots(res.data.data)).catch((err) => showToast(apiErrorMessage(err), "error")).finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) return <DashboardLayout title="Timetable"><div className="loading-state"><span className="spinner" /></div></DashboardLayout>;

  const maxPeriod = Math.max(6, ...slots.map((s) => s.periodNumber), 0);
  const slotFor = (day, period) => slots.find((s) => s.day === day && s.periodNumber === period);

  return (
    <DashboardLayout title="Timetable">
      <div className="page-header"><div><h2>My Timetable</h2><p>Your weekly class schedule.</p></div></div>
      {slots.length === 0 ? <p>No timetable has been published yet.</p> : (
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
    </DashboardLayout>
  );
};

export default MyTimetable;
