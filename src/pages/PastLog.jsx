import { useEffect, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import BottomNav from "../components/BottomNav";
import EmojiScale from "../components/EmojiScale";
import TogglePair from "../components/TogglePair";
import { BACKFILL_QUESTIONS } from "../backfillQuestions";
import useLog from "../hooks/useLog";
import { dateKey, saveLog } from "../firebase";

function isDateKey(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || "")) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year
    && date.getMonth() === month - 1
    && date.getDate() === day;
}

function checkinList(value) {
  const checkins = value?.checkins || value || [];
  return Array.isArray(checkins) ? checkins : [];
}

function getAnswer(log, question) {
  if (question.section === "checkins" && question.field === "pain") {
    const checkins = checkinList(log.checkins);
    return [...checkins].reverse().find((checkin) => checkin.pain != null)?.pain;
  }
  return log[question.section]?.[question.field];
}

function PastLogForDate({ user, date, onSaved }) {
  const navigate = useNavigate();
  const { log, loading, error: loadError } = useLog(user?.uid, date);
  const [answers, setAnswers] = useState({});
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const isExistingLog = (log.completedSections?.length || 0) > 0 && !log.backfilled;

  useEffect(() => {
    if (loading) return;
    const initialAnswers = {};
    BACKFILL_QUESTIONS.forEach((question) => {
      const answer = getAnswer(log, question);
      if (answer !== undefined) initialAnswers[`${question.section}.${question.field}`] = answer;
    });
    setAnswers(initialAnswers);
    setEditing(!isExistingLog);
  }, [loading, log, isExistingLog]);

  const updateAnswer = (question, value) => {
    setAnswers((current) => ({
      ...current,
      [`${question.section}.${question.field}`]: value,
    }));
  };

  const handleSave = async (event) => {
    event.preventDefault();
    setSaveError("");
    const answeredQuestions = BACKFILL_QUESTIONS.filter((question) => {
      const value = answers[`${question.section}.${question.field}`];
      return value !== undefined && value !== null && (question.type !== "text" || value.trim());
    });
    if (answeredQuestions.length === 0) {
      setSaveError("Add at least one answer before saving.");
      return;
    }

    setSaving(true);
    try {
      const backfilledAt = new Date().toISOString();
      const payload = {
        backfilled: true,
        backfilledAt,
      };
      const completed = new Set(log.completedSections || []);

      answeredQuestions.forEach((question) => {
        const value = answers[`${question.section}.${question.field}`];
        completed.add(question.section);
        if (question.section === "checkins" && question.field === "pain") {
          const checkins = [...checkinList(log.checkins)];
          const lastCheckin = checkins.length - 1;
          if (lastCheckin >= 0) {
            checkins[lastCheckin] = { ...checkins[lastCheckin], pain: value };
          } else {
            checkins.push({ pain: value });
          }
          payload.checkins = checkins;
        } else {
          payload[question.section] = {
            ...(payload[question.section] || log[question.section] || {}),
            [question.field]: value,
          };
        }
      });

      payload.completedSections = [...completed];
      await saveLog(user.uid, date, payload);
      onSaved?.();
      navigate("/history", { replace: true });
    } catch (err) {
      setSaveError(`Could not save this day: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <PageMessage message="Loading this day..." />;
  if (loadError) return <PageMessage message={`Could not load this day: ${loadError}`} />;

  return (
    <div style={pageStyle}>
      <header style={{ padding: "16px 20px 12px" }}>
        <button type="button" onClick={() => navigate("/history")} style={textButtonStyle}>
          ← Back to History
        </button>
        <h1 style={headingStyle}>Log a past day</h1>
        <p style={subtitleStyle}>{date}</p>
      </header>

      <main style={{ padding: "0 16px 20px" }}>
        <div style={cardStyle}>
          {isExistingLog && !editing ? (
            <>
              <p style={noticeStyle}>
                This day already has a log. Review the saved answers below; editing adds a
                filled-in-later marker to the day.
              </p>
              <AnswerSummary log={log} />
              <button type="button" onClick={() => setEditing(true)} style={primaryButtonStyle}>
                Edit
              </button>
            </>
          ) : (
            <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
              {log.backfilled && (
                <p style={noticeStyle}>These answers are marked as filled in later.</p>
              )}
              <p style={subtitleStyle}>
                A best guess is enough. Skip anything you don’t remember.
              </p>
              {BACKFILL_QUESTIONS.map((question) => {
                const key = `${question.section}.${question.field}`;
                const value = answers[key] ?? null;
                return (
                  <div key={key} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    <label htmlFor={question.type === "text" ? key : undefined} style={questionStyle}>
                      {question.prompt}
                    </label>
                    {question.type === "emoji5" && (
                      <EmojiScale
                        id={question.prompt}
                        options={question.options}
                        value={value}
                        onSelect={(answer) => updateAnswer(question, answer)}
                      />
                    )}
                    {question.type === "yesno" && (
                      <TogglePair value={value} onChange={(answer) => updateAnswer(question, answer)} />
                    )}
                    {question.type === "text" && (
                      <textarea
                        id={key}
                        value={value || ""}
                        onChange={(event) => updateAnswer(question, event.target.value)}
                        rows={3}
                        style={textareaStyle}
                      />
                    )}
                  </div>
                );
              })}
              {saveError && <p role="alert" style={errorStyle}>{saveError}</p>}
              <div style={{ display: "flex", gap: "8px" }}>
                <button type="submit" disabled={saving} style={primaryButtonStyle}>
                  {saving ? "Saving..." : "Save past-day answers"}
                </button>
                {isExistingLog && (
                  <button type="button" onClick={() => setEditing(false)} style={secondaryButtonStyle}>
                    Cancel
                  </button>
                )}
              </div>
            </form>
          )}
        </div>
      </main>
      <BottomNav />
    </div>
  );
}

function AnswerSummary({ log }) {
  const answers = BACKFILL_QUESTIONS.map((question) => ({
    question,
    value: getAnswer(log, question),
  })).filter(({ value }) => value !== undefined && value !== null && value !== "");

  if (answers.length === 0) {
    return <p style={subtitleStyle}>No saved answers from this short recall set.</p>;
  }

  return (
    <dl style={{ margin: "12px 0 20px" }}>
      {answers.map(({ question, value }) => {
        const label = question.type === "emoji5"
          ? `${question.options[value]?.emoji || ""} ${question.options[value]?.label || value}`
          : question.type === "yesno" ? (value ? "Yes" : "No") : value;
        return (
          <div key={`${question.section}.${question.field}`} style={{ marginBottom: "12px" }}>
            <dt style={questionStyle}>{question.prompt}</dt>
            <dd style={{ margin: "4px 0 0", ...subtitleStyle }}>{label}</dd>
          </div>
        );
      })}
    </dl>
  );
}

function PageMessage({ message }) {
  return (
    <div style={{ ...pageStyle, display: "grid", placeItems: "center" }}>
      <p style={subtitleStyle}>{message}</p>
      <BottomNav />
    </div>
  );
}

export default function PastLog({ user, onSaved }) {
  const { date } = useParams();
  if (!isDateKey(date) || date >= dateKey()) {
    return <Navigate to="/log" replace />;
  }
  return <PastLogForDate user={user} date={date} onSaved={onSaved} />;
}

const pageStyle = {
  minHeight: "100vh",
  background: "var(--cream, #FAF5EB)",
  paddingBottom: "90px",
};
const cardStyle = {
  background: "var(--white, #FFFDF8)",
  borderRadius: "20px",
  border: "1.5px solid var(--tan-light, #EDE3CF)",
  padding: "20px",
};
const headingStyle = {
  fontFamily: "'Fraunces', serif",
  fontSize: "24px",
  fontWeight: 700,
  color: "var(--brown, #3B2F2F)",
  margin: "12px 0 2px",
};
const subtitleStyle = {
  fontFamily: "'Nunito', sans-serif",
  fontSize: "13px",
  color: "var(--brown-light, #9A7E7E)",
  margin: 0,
  lineHeight: 1.5,
};
const questionStyle = {
  fontFamily: "'Nunito', sans-serif",
  fontSize: "14px",
  fontWeight: 700,
  color: "var(--brown, #3B2F2F)",
};
const noticeStyle = {
  ...subtitleStyle,
  background: "color-mix(in srgb, var(--terra) 10%, var(--cream))",
  borderRadius: "10px",
  padding: "10px 12px",
};
const textButtonStyle = {
  border: 0,
  padding: 0,
  background: "transparent",
  color: "var(--brown-light, #9A7E7E)",
  fontFamily: "'Nunito', sans-serif",
  fontSize: "13px",
  cursor: "pointer",
};
const primaryButtonStyle = {
  border: 0,
  borderRadius: "12px",
  padding: "10px 16px",
  background: "var(--terra, #C1724F)",
  color: "var(--white, #FFFDF8)",
  fontFamily: "'Nunito', sans-serif",
  fontSize: "14px",
  fontWeight: 700,
  cursor: "pointer",
};
const secondaryButtonStyle = {
  ...primaryButtonStyle,
  background: "var(--cream, #FAF5EB)",
  color: "var(--brown, #3B2F2F)",
  border: "1px solid var(--tan-light, #EDE3CF)",
};
const textareaStyle = {
  width: "100%",
  boxSizing: "border-box",
  border: "1.5px solid var(--tan-light, #EDE3CF)",
  borderRadius: "12px",
  padding: "10px 12px",
  background: "var(--cream, #FAF5EB)",
  color: "var(--brown, #3B2F2F)",
  fontFamily: "'Nunito', sans-serif",
  fontSize: "14px",
  resize: "vertical",
};
const errorStyle = {
  ...subtitleStyle,
  color: "var(--terra, #C1724F)",
};
