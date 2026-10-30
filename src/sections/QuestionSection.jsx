// src/sections/QuestionSection.jsx — Rooted Health Tracker
// Generic once-a-day section rendered from the schema in src/questions.js.

import { useCallback } from "react";
import Question from "../components/Question";
import SkipLink from "../components/SkipLink";
import { isVisible } from "../questions";
import { randomMessage } from "../utils";

export default function QuestionSection({
  section,
  data = {},
  onUpdate,
  onSave,
  onSkip,
  onCelebrate,
  goodEnough = false,
  profile,
  onSafety,
}) {
  const color = section.color;
  const visible = section.questions.filter((q) => isVisible(q, data, profile, goodEnough));

  const handleChange = useCallback(
    (q, value) => {
      onUpdate?.(q.id, value);
      if (q.safety && value && value !== "no") onSafety?.(value);
    },
    [onUpdate, onSafety]
  );

  const handleSave = useCallback(() => {
    onSave?.();
    onCelebrate?.({ emoji: section.emoji, title: `${section.label} logged!`, msg: randomMessage() });
  }, [onSave, onCelebrate, section]);

  return (
    <div
      style={{
        background: "var(--white)",
        borderRadius: "20px",
        border: `2px solid var(--${color})`,
        padding: "20px",
        display: "flex",
        flexDirection: "column",
        gap: "22px",
      }}
    >
      <div>
        <h3 style={{ fontFamily: "'Fraunces', serif", fontSize: "18px", fontWeight: 700, color: `var(--${color})`, margin: 0 }}>
          {section.emoji} {section.label}
        </h3>
        <span style={{ fontFamily: "'Nunito', sans-serif", fontSize: "12px", color: "var(--brown-light)" }}>
          {section.time} · skip anything you want
        </span>
      </div>

      {visible.map((q) => (
        <Question key={q.id} q={q} value={data[q.id]} onChange={(v) => handleChange(q, v)} color={color} profile={profile} />
      ))}

      <button
        type="button"
        onClick={handleSave}
        style={{
          fontFamily: "'Nunito', sans-serif",
          fontSize: "15px",
          fontWeight: 700,
          color: "var(--white)",
          background: `var(--${color})`,
          border: "none",
          borderRadius: "14px",
          padding: "13px 24px",
          cursor: "pointer",
          boxShadow: `0 3px 10px color-mix(in srgb, var(--${color}) 25%, transparent)`,
        }}
      >
        Save {section.label} {section.emoji}
      </button>
      <SkipLink onSkip={onSkip} />
    </div>
  );
}
