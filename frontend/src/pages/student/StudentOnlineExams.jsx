import React, { useEffect, useState } from "react";
import DashboardLayout from "../../layouts/DashboardLayout";
import Modal from "../../components/Modal";
import api, { apiErrorMessage } from "../../services/api";
import { useToast } from "../../context/ToastContext";

const StudentOnlineExams = () => {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState(null);
  const [answers, setAnswers] = useState({});
  const { showToast } = useToast();

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get("/online-exams/available");
      setExams(res.data.data);
    } catch (err) { showToast(apiErrorMessage(err), "error"); } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const openExam = (exam) => { setActive(exam); setAnswers({}); };

  const submit = async () => {
    try {
      const payload = Object.entries(answers).map(([question, selectedOption]) => ({ question, selectedOption }));
      const res = await api.post(`/online-exams/${active._id}/submit`, { answers: payload });
      showToast(`Submitted. Score: ${res.data.data.score}/${res.data.data.maxScore}`, "success");
      setActive(null);
      load();
    } catch (err) { showToast(apiErrorMessage(err), "error"); }
  };

  if (loading) return <DashboardLayout title="Online Exams"><div className="loading-state"><span className="spinner" /></div></DashboardLayout>;

  return (
    <DashboardLayout title="Online Exams">
      <div className="page-header"><div><h2>Online Exams</h2></div></div>

      {exams.length === 0 ? <p>No online exams available right now.</p> : (
        <div style={{ display: "grid", gap: 12 }}>
          {exams.map((e) => (
            <div key={e._id} className="card" style={{ padding: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <strong>{e.title}</strong>
                <div style={{ fontSize: 13, color: "var(--grey-700)" }}>
                  {e.subject?.subjectCode} - Ends {new Date(e.endTime).toLocaleString()} - {e.durationMinutes} min
                </div>
              </div>
              {e.mySubmission ? (
                <span className="badge badge-success">Score: {e.mySubmission.score}/{e.mySubmission.maxScore}</span>
              ) : (
                <button className="btn btn-primary btn-sm" onClick={() => openExam(e)}>Start</button>
              )}
            </div>
          ))}
        </div>
      )}

      {active && (
        <Modal title={active.title} onClose={() => setActive(null)} width="600px">
          {active.questions.map((q, i) => (
            <div key={q._id} className="field">
              <label>{i + 1}. {q.text}</label>
              {q.options?.map((opt, oi) => (
                <div key={oi} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <input type="radio" name={q._id} checked={answers[q._id] === oi} onChange={() => setAnswers({ ...answers, [q._id]: oi })} />
                  <span>{opt}</span>
                </div>
              ))}
            </div>
          ))}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 16 }}>
            <button className="btn btn-ghost" onClick={() => setActive(null)}>Cancel</button>
            <button className="btn btn-primary" onClick={submit}>Submit</button>
          </div>
        </Modal>
      )}
    </DashboardLayout>
  );
};

export default StudentOnlineExams;
