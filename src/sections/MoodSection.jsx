// src/sections/MoodSection.jsx - Rooted Health Tracker
// Section 3: Mood - color: mauve
// Fields: overallMood, emotion, emotionPath, anxiety, stress, note

import { useState, useCallback } from "react";
import EmojiScale from "../components/EmojiScale";
import EmotionTree from "../components/EmotionTree";
import SectionProgress from "../components/SectionProgress";
import SkipLink from "../components/SkipLink";

const COLOR = "mauve";

const OVERALL_MOOD_OPTIONS = [
  { emoji: "😢", label: "Awful" },
  { emoji: "😕", label: "Low" },
  { emoji: "😐", label: "Okay" },
  { emoji: "🙂", label: "Good" },
  { emoji: "😊", label: "Great" },
];

const ANXIETY_OPTIONS = [
  { emoji: "🫠", label: "None" },
  { emoji: "🙂", label: "Mild" },
  { emoji: "😬", label: "Noticeable" },
  { emoji: "😰", label: "High" },
  { emoji: "😵", label: "Very high" },
];

const STRESS_OPTIONS = [
  { emoji: "😌", label: "Calm" },
  { emoji: "🙂", label: "Light" },
  { emoji: "😐", label: "Moderate" },
  { emoji: "😣", label: "Heavy" },
  { emoji: "🤯", label: "Maxed" },
];

const MESSAGES = [
  "Naming how you feel is real progress.",
  "You checked in with yourself. That matters.",
  "Small data points become helpful patterns.",
  "This is enough for today.",
  "You are building self-understanding day by day.",
];

const randomMsg = () => MESSAGES[Math.floor(Math.random() * MESSAGES.length)];

export default function MoodSection({
  data = {},
  onUpdate,
  onSave,
  onSkip,
  onCelebrate,
  goodEnough = false,
}) {
  const [step, setStep] = useState(() => {
    if (goodEnough) return 0;
    if (data.stress != null) return 3;
    if (data.anxiety != null) return 2;
    if (data.emotion) return 2;
    if (data.overallMood != null) return 1;
    return 0;
  });

  const totalSteps = goodEnough ? 1 : 4;

  const handleOverallMood = useCallback(
    (value) => {
      onUpdate?.("overallMood", value);
      if (!goodEnough && step === 0) {
        setTimeout(() => setStep(1), 250);
      }
    },
    [goodEnough, onUpdate, step]
  );

  const handleEmotionSelect = useCallback(
    (emotion, path) => {
      onUpdate?.("emotion", emotion);
      onUpdate?.("emotionPath", Array.isArray(path) ? path.join(" > ") : emotion);
      if (step < 2) {
        setStep(2);
      }
    },
    [onUpdate, step]
  );

  const handleSave = useCallback(() => {
    onSave?.();
    onCelebrate?.({
      emoji: "💜",
      title: "Mood logged!",
      msg: randomMsg(),
    });
  }, [onSave, onCelebrate]);

  const canSave = goodEnough
    ? data.overallMood != null
    : data.overallMood != null && Boolean(data.emotion);

  return (
    <div
      style={{
        background: "var(--white, #FFFDF8)",
        borderRadius: "20px",
        border: `2px solid var(--${COLOR}, #A07B8A)`,
        padding: "20px",
        display: "flex",
        flexDirection: "column",
        gap: "16px",
      }}
    >
      <div>
        <h3
          style={{
            fontFamily: "'Fraunces', serif",
            fontSize: "18px",
            fontWeight: 700,
            color: `var(--${COLOR}, #A07B8A)`,
            margin: 0,
          }}
        >
          💜 Mood
        </h3>
        <span
          style={{
            fontFamily: "'Nunito', sans-serif",
            fontSize: "12px",
            color: "var(--brown-light, #9A7E7E)",
          }}
        >
          ~2 min
        </span>
      </div>

      {!goodEnough && <SectionProgress total={totalSteps} current={step} colorClass={COLOR} />}

      <div>
        <label
          style={{
            fontFamily: "'Nunito', sans-serif",
            fontSize: "14px",
            fontWeight: 600,
            color: "var(--brown, #3B2F2F)",
            display: "block",
            marginBottom: "8px",
          }}
        >
          Overall mood right now
        </label>
        <EmojiScale
          id="mood-overall"
          options={OVERALL_MOOD_OPTIONS}
          value={data.overallMood}
          onSelect={handleOverallMood}
          colorClass={COLOR}
        />
      </div>

      {!goodEnough && step >= 1 && (
        <div style={{ animation: "section-reveal 0.25s ease-out" }}>
          <label
            style={{
              fontFamily: "'Nunito', sans-serif",
              fontSize: "14px",
              fontWeight: 600,
              color: "var(--brown, #3B2F2F)",
              display: "block",
              marginBottom: "8px",
            }}
          >
            What emotion fits best?
          </label>
          <EmotionTree onSelect={handleEmotionSelect} colorClass={COLOR} />
          {data.emotion && (
            <p
              style={{
                fontFamily: "'Nunito', sans-serif",
                fontSize: "13px",
                color: "var(--brown-light, #9A7E7E)",
                margin: "8px 0 0",
              }}
            >
              Selected: <strong style={{ color: "var(--brown, #3B2F2F)" }}>{data.emotionPath || data.emotion}</strong>
            </p>
          )}
        </div>
      )}

      {!goodEnough && step >= 2 && (
        <div style={{ animation: "section-reveal 0.25s ease-out" }}>
          <label
            style={{
              fontFamily: "'Nunito', sans-serif",
              fontSize: "14px",
              fontWeight: 600,
              color: "var(--brown, #3B2F2F)",
              display: "block",
              marginBottom: "8px",
            }}
          >
            Anxiety level
          </label>
          <EmojiScale
            id="mood-anxiety"
            options={ANXIETY_OPTIONS}
            value={data.anxiety}
            onSelect={(value) => {
              onUpdate?.("anxiety", value);
              if (step === 2) {
                setTimeout(() => setStep(3), 250);
              }
            }}
            colorClass={COLOR}
            size="sm"
          />
        </div>
      )}

      {!goodEnough && step >= 3 && (
        <div
          style={{
            animation: "section-reveal 0.25s ease-out",
            display: "flex",
            flexDirection: "column",
            gap: "10px",
          }}
        >
          <div>
            <label
              style={{
                fontFamily: "'Nunito', sans-serif",
                fontSize: "14px",
                fontWeight: 600,
                color: "var(--brown, #3B2F2F)",
                display: "block",
                marginBottom: "8px",
              }}
            >
              Stress level
            </label>
            <EmojiScale
              id="mood-stress"
              options={STRESS_OPTIONS}
              value={data.stress}
              onSelect={(value) => onUpdate?.("stress", value)}
              colorClass={COLOR}
              size="sm"
            />
          </div>

          <div>
            <label
              style={{
                fontFamily: "'Nunito', sans-serif",
                fontSize: "13px",
                fontWeight: 600,
                color: "var(--brown, #3B2F2F)",
                display: "block",
                marginBottom: "6px",
              }}
            >
              Notes (optional)
            </label>
            <textarea
              placeholder="Anything you want future-you to remember..."
              value={data.note || ""}
              onChange={(e) => onUpdate?.("note", e.target.value)}
              style={{
                width: "100%",
                minHeight: "62px",
                padding: "10px 12px",
                fontFamily: "'Nunito', sans-serif",
                fontSize: "14px",
                color: "var(--brown, #3B2F2F)",
                background: "var(--cream, #FAF5EB)",
                border: "1.5px solid var(--tan, #D4C5A9)",
                borderRadius: "12px",
                resize: "vertical",
                outline: "none",
                boxSizing: "border-box",
                transition: "border-color 0.2s ease",
              }}
              onFocus={(e) => {
                e.target.style.borderColor = `var(--${COLOR})`;
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "var(--tan, #D4C5A9)";
              }}
            />
          </div>
        </div>
      )}

      {canSave && (
        <button
          onClick={handleSave}
          style={{
            fontFamily: "'Nunito', sans-serif",
            fontSize: "16px",
            fontWeight: 700,
            color: "var(--white, #FFFDF8)",
            background: `var(--${COLOR}, #A07B8A)`,
            border: "none",
            borderRadius: "14px",
            padding: "12px 24px",
            cursor: "pointer",
            transition: "all 0.2s ease",
            boxShadow: `0 3px 10px color-mix(in srgb, var(--${COLOR}) 25%, transparent)`,
            WebkitTapHighlightColor: "transparent",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = `var(--${COLOR}-dark, #7A5568)`;
            e.currentTarget.style.transform = "scale(1.02)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = `var(--${COLOR}, #A07B8A)`;
            e.currentTarget.style.transform = "scale(1)";
          }}
        >
          Save Mood 💜
        </button>
      )}

      <SkipLink onSkip={onSkip} />

      <style>{`
        @keyframes section-reveal {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
