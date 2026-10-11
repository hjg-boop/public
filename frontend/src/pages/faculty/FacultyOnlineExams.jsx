import React, { useEffect, useState } from "react";
import DashboardLayout from "../../layouts/DashboardLayout";
import DataTable from "../../components/DataTable";
import Modal from "../../components/Modal";
import api, { apiErrorMessage } from "../../services/api";
import { useToast } from "../../context/ToastContext";

const emptyQuestion = () => ({ text: "", type: "mcq", options: ["", "", "", ""], correctOption: 0, marks: 1 });
const emptyForm = { title: "", subject: "", branch: "", year: 1, semester: 1, durationMinutes: 30, startTime: "", endTime: "", questions: [emptyQuestion()] };

const FacultyOnlineExams = () => {
  const [exams, setExams] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [analytics, setAnalytics] = useState(null);
  const { showToast } = useToast();

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get("/online-exams");
      setExams(res.data.data);
    } catch (err) { showToast(apiErrorMessage(err), "error"); } finally { setLoading(false); }
  };

  useEffect(() => {
    load();
    api.get("/subjects/mine").then((res) => setSubjects(res.data.data)).catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const onSubjectChange = (id) => {
    const s = subjects.find((x) => x._id === id);
    setForm({ ...form, subject: id, branch: s?.branch?._id || "", year: s?.year || 1, semester: s?.semester || 1 });
  };

  const updateQuestion = (i, field, value) => {
    const questions = [...form.questions];
    questions[i] = { ...questions[i], [field]: value };
    setForm({ ...form, questions });
  };
  const updateOption = (qi, oi, value) => {
    const questions = [...form.questions];
    const options = [...questions[qi].options];
    options[oi] = value;
    questions[qi] = { ...questions[qi], options };
    setForm({ ...form, questions });
  };
  const addQuestion = () => setForm({ ...form, questions: [...form.questions, emptyQuestion()] });
  const removeQuestion = (i) => setForm({ ...form, questions: form.questions.filter((_, idx) => idx !== i) });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post("/online-exams", form);
      showToast("Online exam created", "success");
      setShowForm(false);
      setForm(emptyForm);
      load();
    } catch (err) { showToast(apiErrorMessage(err), "error"); }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/online-exams/${id}`);
      showToast("Deleted", "success");
      load();
    } catch (err) { showToast(apiErrorMessage(err), "error"); }
  };

  const viewAnalytics = async (id) => {
    try {
      const res = await api.get(`/online-exams/${id}/analytics`);
      setAnalytics(res.data.data);
    } catch (err) { showToast(apiErrorMessage(err), "error"); }
  };

  const columns = [
    { key: "title", label: "Title" },
    { key: "subject", label: "Subject", render: (r) => r.subject?.subjectCode },
    { key: "startTime", label: "Starts", render: (r) => new Date(r.startTime).toLocaleString() },
    { key: "endTime", label: "Ends", render: (r) => new Date(r.endTime).toLocaleString() },
    { key: "actions", label: "Actions", render: (r) => (
      <div style={{ display: "flex", gap: 8 }}>
        <button className="btn btn-secondary btn-sm" onClick={() => viewAnalytics(r._id)}>Results</button>
        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(r._id)}>Delete</button>
      </div>
    ) },
  ];

  return (
    <DashboardLayout title="Online Exams">
      <div className="page-header">
        <div><h2>Online Exams</h2><p>Objective (MCQ) questions are auto-graded on submission.</p></div>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>+ Create exam</button>
      </div>
      <DataTable columns={columns} rows={exams} loading={loading} />

      {showForm && (
        <Modal title="Create online exam" onClose={() => setShowForm(false)} width="640px">
          <form onSubmit={handleSubmit}>
            <div className="field"><label>Title *</label><input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
            <div className="field">
              <label>Subject *</label>
              <select required value={form.subject} onChange={(e) => onSubjectChange(e.target.value)}>
                <option value="">Select...</option>{subjects.map((s) => <option key={s._id} value={s._id}>{s.subjectCode}</option>)}
              </select>
            </div>
            <div className="field" style={{ display: "flex", gap: 10 }}>
              <div style={{ flex: 1 }}><label>Duration (min)</label><input type="number" value={form.durationMinutes} onChange={(e) => setForm({ ...form, durationMinutes: e.target.value })} /></div>
              <div style={{ flex: 1 }}><label>Start</label><input type="datetime-local" required value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} /></div>
              <div style={{ flex: 1 }}><label>End</label><input type="datetime-local" required value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} /></div>
            </div>

            <h4>Questions</h4>
            {form.questions.map((q, i) => (
              <div key={i} className="card" style={{ padding: 12, marginBottom: 10 }}>
                <div className="field"><label>Question {i + 1}</label><input required value={q.text} onChange={(e) => updateQuestion(i, "text", e.target.value)} /></div>
                {q.options.map((opt, oi) => (
                  <div key={oi} style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 4 }}>
                    <input type="radio" name={`correct-${i}`} checked={q.correctOption === oi} onChange={() => updateQuestion(i, "correctOption", oi)} />
                    <input placeholder={`Option ${oi + 1}`} value={opt} onChange={(e) => updateOption(i, oi, e.target.value)} style={{ flex: 1 }} />
                  </div>
                ))}
                <div style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 6 }}>
                  <label style={{ margin: 0 }}>Marks</label>
                  <input type="number" style={{ width: 70 }} value={q.marks} onChange={(e) => updateQuestion(i, "marks", e.target.value)} />
                  {form.questions.length > 1 && <button type="button" className="btn btn-ghost btn-sm" onClick={() => removeQuestion(i)}>Remove question</button>}
                </div>
              </div>
            ))}
            <button type="button" className="btn btn-secondary btn-sm" onClick={addQuestion} style={{ marginBottom: 16 }}>+ Add question</button>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary">Create Exam</button>
            </div>
          </form>
        </Modal>
      )}

      {analytics && (
        <Modal title="Results" onClose={() => setAnalytics(null)} width="520px">
          <p>Average score: {analytics.avgScore?.toFixed(1)}</p>
          <table className="data-table">
            <thead><tr><th>Student</th><th>Score</th></tr></thead>
            <tbody>
              {analytics.submissions.map((s) => (
                <tr key={s._id}><td>{s.student?.user?.name} ({s.student?.rollNumber})</td><td>{s.score}/{s.maxScore}</td></tr>
              ))}
            </tbody>
          </table>
        </Modal>
      )}
    </DashboardLayout>
  );
};

export default FacultyOnlineExams;
