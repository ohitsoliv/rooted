// src/pages/Lookback.jsx — Rooted Health Tracker
// Weekly look-back. Hindsight catches stretches that didn't feel different
// while they were happening. Saved into today's log under `lookback`.

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import BottomNav from "../components/BottomNav";
import Question from "../components/Question";
import { saveLog, logDayKey } from "../firebase";
import { LOOKBACK_QUESTIONS, isAnswered } from "../questions";
import { addDays } from "../analysis/patterns";

const font = "'Nunito', sans-serif";

export default function Lookback({ user, onDone }) {
  const navigate = useNavigate();
  const [answers, setAnswers] = useState({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const today = logDayKey();
  const canSave = LOOKBACK_QUESTIONS.some((q) => !q.optional && isAnswered(answers[q.id]));

  const save = async () => {
    setSaving(true);
    const result = await saveLog(user.uid, today, { lookback: { ...answers, weekStart: addDays(today, -7), weekEnd: addDays(today, -1), takenAt: new Date().toISOString() } });
    if (!result.ok) {
      setSaving(false);
      setError("That didn't save — please try again.");
      return;
    }
    await onDone?.(today);
    navigate("/");
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--cream)", paddingBottom: "100px" }}>
      <header style={{ padding: "16px 20px 8px" }}>
        <button onClick={() => navigate("/")} style={{ background: "none", border: "none", fontFamily: font, fontSize: "14px", fontWeight: 600, color: "var(--brown-light)", cursor: "pointer", padding: 0 }}>← Home (do it later)</button>
        <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: "22px", color: "var(--brown)", margin: "8px 0 4px" }}>🔭 Last week</h1>
        <p style={{ fontFamily: font, fontSize: "13px", color: "var(--brown-light)", margin: 0 }}>A quick look back at the past 7 days.</p>
      </header>
      <main style={{ padding: "8px 16px", maxWidth: "560px", margin: "0 auto" }}>
        <div style={{ background: "var(--white)", borderRadius: "20px", border: "2px solid var(--sage)", padding: "20px", display: "flex", flexDirection: "column", gap: "22px" }}>
          {LOOKBACK_QUESTIONS.map((q) => (
            <Question key={q.id} q={q} value={answers[q.id]} color="sage" onChange={(v) => setAnswers((a) => ({ ...a, [q.id]: v }))} />
          ))}
          {error && <p role="alert" style={{ fontFamily: font, fontSize: "13px", fontWeight: 700, color: "var(--terra-dark)", margin: 0 }}>{error}</p>}
          <button type="button" disabled={!canSave || saving} onClick={save}
            style={{ fontFamily: font, fontSize: "15px", fontWeight: 700, color: canSave ? "var(--white)" : "var(--brown-light)", background: canSave ? "var(--sage)" : "var(--tan-light)", border: "none", borderRadius: "14px", padding: "13px", cursor: canSave ? "pointer" : "not-allowed" }}>
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
