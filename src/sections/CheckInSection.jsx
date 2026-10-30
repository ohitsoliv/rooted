// src/sections/CheckInSection.jsx — Rooted Health Tracker
// Repeatable check-in. Each check-in is its own timestamped record in
// log.checkins.checkins[]. Questions come from CHECKIN_QUESTIONS.

import { useState, useCallback, useMemo } from "react";
import Question from "../components/Question";
import FeelingPicker from "../components/FeelingPicker";
import { describeFeeling } from "../feelings";
import SkipLink from "../components/SkipLink";
import { CHECKIN_QUESTIONS, MOOD_OPTIONS, ACTIVATION_OPTIONS, BODY_OPTIONS, DK, isVisible, isAnswered } from "../questions";
import { randomMessage, playTap } from "../utils";

const COLOR = "terra";
const font = "'Nunito', sans-serif";

const LEGACY_MOOD = ["😢", "😕", "😐", "🙂", "😊"];

function formatTime(ts) {
  if (!ts) return "";
  return new Date(ts).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function summary(ci) {
  const mood = MOOD_OPTIONS.find((m) => m.id === ci.mood)?.emoji ?? (typeof ci.mood === "number" ? LEGACY_MOOD[ci.mood] : ci.mood === DK ? "?" : "—");
  const body = BODY_OPTIONS.find((a) => a.id === ci.body)?.emoji;
  const mind = ACTIVATION_OPTIONS.find((a) => a.id === ci.activation)?.emoji;
  const act = [body && `body ${body}`, mind && `mind ${mind}`].filter(Boolean).join("  ");
  return { mood, act };
}

export default function CheckInSection({ data = {}, onUpdate, onSave, onSkip, onCelebrate, goodEnough = false, profile }) {
  const checkins = useMemo(() => data.checkins || [], [data.checkins]);
  const [draft, setDraft] = useState({});
  const [showFeeling, setShowFeeling] = useState(false);
  const [expanded, setExpanded] = useState(null);

  // Previous check-in's "doing" answer drives the "Did that help?" follow-up.
  const prevDoing = useMemo(
    () => (checkins[checkins.length - 1]?.doing || []).filter((x) => x !== "nothing" && x !== DK),
    [checkins]
  );
  const ctx = useMemo(() => ({ ...draft, _prevDoing: prevDoing }), [draft, prevDoing]);
  const doingQ = CHECKIN_QUESTIONS.find((q) => q.id === "doing");
  const prevLabel = prevDoing.map((id) => doingQ.options.find((x) => x.id === id)?.label || id).join(", ").toLowerCase();
  const visible = CHECKIN_QUESTIONS.filter((q) => isVisible(q, ctx, profile, goodEnough, "checkin"))
    .map((q) => (q.id === "didItHelp" ? { ...q, hint: `Last check-in: ${prevLabel}` } : q));
  const canAdd = isAnswered(draft.mood) || isAnswered(draft.body) || isAnswered(draft.activation) || isAnswered(draft.painStop);

  const setField = useCallback((id, value) => {
    setDraft((d) => {
      const next = { ...d };
      if (value === undefined) delete next[id];
      else next[id] = value;
      return next;
    });
  }, []);

  const handleAdd = useCallback(() => {
    // Drop answers to questions that are no longer visible (e.g. "Where?" after pain set to No)
    const clean = {};
    for (const q of CHECKIN_QUESTIONS) {
      if (isVisible(q, ctx, profile, false, "checkin") && isAnswered(draft[q.id])) clean[q.id] = draft[q.id];
    }
    if (clean.didItHelp) clean.didItHelpFor = prevDoing;
    const f = draft.feeling;
    if (f && (f.cantTell || f.feelings?.length || f.sensations?.length)) clean.feeling = f;
    const updated = [...checkins, { ...clean, timestamp: new Date().toISOString() }];
    onUpdate?.("checkins", updated);
    setDraft({});
    setShowFeeling(false);
    onSave?.();
    onCelebrate?.({ emoji: "📝", title: "Check-in logged!", msg: randomMessage() });
  }, [draft, ctx, prevDoing, checkins, onUpdate, onSave, onCelebrate, profile]);

  return (
    <div style={{ background: "var(--white)", borderRadius: "20px", border: `2px solid var(--${COLOR})`, padding: "20px", display: "flex", flexDirection: "column", gap: "18px" }}>
      <div>
        <h3 style={{ fontFamily: "'Fraunces', serif", fontSize: "18px", fontWeight: 700, color: `var(--${COLOR})`, margin: 0 }}>📝 Check-in</h3>
        <span style={{ fontFamily: font, fontSize: "12px", color: "var(--brown-light)" }}>~15 sec · add as many as you want today</span>
      </div>

      {checkins.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <span style={{ fontFamily: font, fontSize: "12px", fontWeight: 700, color: "var(--brown-light)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Today's check-ins
          </span>
          {checkins.map((ci, i) => {
            const s = summary(ci);
            const open = expanded === i;
            return (
              <button
                key={ci.timestamp || i}
                type="button"
                onClick={() => setExpanded(open ? null : i)}
                style={{ display: "flex", flexDirection: "column", gap: "4px", padding: "10px 12px", background: "var(--cream)", border: "1.5px solid var(--tan-light)", borderRadius: "12px", cursor: "pointer", textAlign: "left", fontFamily: font }}
              >
                <span style={{ display: "flex", gap: "10px", alignItems: "center", fontSize: "13px", color: "var(--brown)" }}>
                  <span style={{ color: "var(--brown-light)", minWidth: "62px" }}>{formatTime(ci.timestamp)}</span>
                  <span style={{ fontSize: "18px" }}>{s.mood}</span>
                  <span>{s.act || ""}</span>
                </span>
                {open && (
                  <span style={{ fontSize: "12px", color: "var(--brown-light)", borderTop: "1px solid var(--tan-light)", paddingTop: "4px" }}>
                    {CHECKIN_QUESTIONS.filter((q) => isAnswered(ci[q.id]) && q.options)
                      .map((q) => `${q.prompt.replace(/\?$/, "")}: ${[].concat(ci[q.id]).map((v) => (v === DK ? "Don't know" : q.options.find((x) => x.id === v)?.label || v)).join(", ")}`)
                      .join(" · ")}
                    {ci.heartRate ? ` · HR ${ci.heartRate}` : ""}
                    {describeFeeling(ci) ? ` · Feeling: ${describeFeeling(ci)}` : ""}
                    {ci.note ? ` · ${ci.note}` : ""}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "20px", padding: "16px", background: "var(--cream)", borderRadius: "14px", border: "1.5px solid var(--tan-light)" }}>
        {visible.map((q) => (
          <Question key={q.id} q={q} value={draft[q.id]} onChange={(v) => setField(q.id, v)} color={COLOR} profile={profile} />
        ))}

        {!goodEnough && (
          showFeeling ? (
            <div>
              <FeelingPicker color={COLOR} value={draft.feeling || {}} onChange={(v) => setDraft((d) => ({ ...d, feeling: v }))} />
            </div>
          ) : (
            <button type="button" onClick={() => { playTap(); setShowFeeling(true); }} style={{ alignSelf: "flex-start", background: "none", border: "none", padding: 0, fontFamily: font, fontSize: "13px", fontWeight: 600, color: `var(--${COLOR})`, textDecoration: "underline", cursor: "pointer" }}>
              Want to add a feeling? (optional)
            </button>
          )
        )}

        <button
          type="button"
          onClick={handleAdd}
          disabled={!canAdd}
          style={{
            fontFamily: font,
            fontSize: "15px",
            fontWeight: 700,
            color: canAdd ? "var(--white)" : "var(--brown-light)",
            background: canAdd ? `var(--${COLOR})` : "var(--tan-light)",
            border: "none",
            borderRadius: "14px",
            padding: "13px 24px",
            cursor: canAdd ? "pointer" : "not-allowed",
          }}
        >
          {checkins.length === 0 ? "Save check-in 📝" : "+ Add check-in"}
        </button>
      </div>

      <SkipLink onSkip={onSkip} />
    </div>
  );
}
