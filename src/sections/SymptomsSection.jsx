// src/sections/SymptomsSection.jsx — Rooted Health Tracker
// Section 4: General Symptoms — color: sage
// Toggle cards: Headache, Stomach issues, Brain fog, Tension
// Always-visible: Fatigue scale
// Good Enough Mode: flare day toggle + activity tolerance only

import { useCallback } from "react";
import SymptomCard from "../components/SymptomCard";
import EmojiScale from "../components/EmojiScale";
import SkipLink from "../components/SkipLink";

const COLOR = "sage";

const FATIGUE_OPTIONS = [
  { emoji: "🔋", label: "Fine" },
  { emoji: "😐", label: "Tired" },
  { emoji: "😮‍💨", label: "Dragging" },
  { emoji: "😩", label: "Exhausted" },
  { emoji: "🪫", label: "Empty" },
];

const SYMPTOMS = [
  { key: "headache", emoji: "🤕", name: "Headache", sub: "Including migraine" },
  { key: "stomach", emoji: "🤢", name: "Stomach issues", sub: "Nausea, cramps, etc." },
  { key: "brainFog", emoji: "🌫️", name: "Brain fog", sub: "Hard to think or focus" },
  { key: "tension", emoji: "😬", name: "Tension", sub: "Muscle tightness, clenching" },
];

const MESSAGES = [
  "Even logging one thing counts. Seriously.",
  "Your future self will love having this.",
  "You showed up. That is the whole thing.",
  "This took 30 seconds and it mattered.",
  "One more day of data. You are doing it.",
  "No pressure — just show up as you are.",
  "Every entry is a small act of self-care.",
  "You do not have to be perfect to track.",
];

const randomMsg = () => MESSAGES[Math.floor(Math.random() * MESSAGES.length)];

/**
 * SymptomsSection
 *
 * Props:
 *   data         — current symptoms data object
 *   onUpdate     — (field, value) => void
 *   onSave       — () => void
 *   onSkip       — () => void
 *   onCelebrate  — ({ emoji, title, msg }) => void
 *   goodEnough   — boolean
 */
export default function SymptomsSection({
  data = {},
  onUpdate,
  onSave,
  onSkip,
  onCelebrate,
  goodEnough = false,
}) {
  const handleSave = useCallback(() => {
    onSave?.();
    onCelebrate?.({
      emoji: "🩺",
      title: "Symptoms logged!",
      msg: randomMsg(),
    });
  }, [onSave, onCelebrate]);

  // In good enough mode, just show fatigue
  if (goodEnough) {
    return (
      <div
        style={{
          background: "var(--white, #FFFDF8)",
          borderRadius: "20px",
          border: `2px solid var(--${COLOR}, #7D9B76)`,
          padding: "20px",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
        }}
      >
        {/* Header */}
        <div>
          <h3 style={{
            fontFamily: "'Fraunces', serif",
            fontSize: "18px",
            fontWeight: 700,
            color: `var(--${COLOR}, #7D9B76)`,
            margin: 0,
          }}>
            🩺 Symptoms
          </h3>
          <span style={{
            fontFamily: "'Nunito', sans-serif",
            fontSize: "12px",
            color: "var(--brown-light, #9A7E7E)",
          }}>
            ~15 sec
          </span>
        </div>

        {/* Fatigue only */}
        <div>
          <label style={{
            fontFamily: "'Nunito', sans-serif",
            fontSize: "14px",
            fontWeight: 600,
            color: "var(--brown, #3B2F2F)",
            display: "block",
            marginBottom: "8px",
          }}>
            How's your energy / fatigue?
          </label>
          <EmojiScale
            id="symptoms-fatigue"
            options={FATIGUE_OPTIONS}
            value={data.fatigue}
            onSelect={(i) => onUpdate?.("fatigue", i)}
            colorClass={COLOR}
          />
        </div>

        {/* Save */}
        <button
          onClick={handleSave}
          style={{
            fontFamily: "'Nunito', sans-serif",
            fontSize: "16px",
            fontWeight: 700,
            color: "var(--white, #FFFDF8)",
            background: `var(--${COLOR}, #7D9B76)`,
            border: "none",
            borderRadius: "14px",
            padding: "12px 24px",
            cursor: "pointer",
            transition: "all 0.2s ease",
            boxShadow: `0 3px 10px color-mix(in srgb, var(--${COLOR}) 25%, transparent)`,
            WebkitTapHighlightColor: "transparent",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = `var(--${COLOR}-dark, #5A7554)`;
            e.currentTarget.style.transform = "scale(1.02)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = `var(--${COLOR}, #7D9B76)`;
            e.currentTarget.style.transform = "scale(1)";
          }}
        >
          Save Symptoms 🩺
        </button>

        <SkipLink onSkip={onSkip} />
      </div>
    );
  }

  // Full mode
  return (
    <div
      style={{
        background: "var(--white, #FFFDF8)",
        borderRadius: "20px",
        border: `2px solid var(--${COLOR}, #7D9B76)`,
        padding: "20px",
        display: "flex",
        flexDirection: "column",
        gap: "16px",
      }}
    >
      {/* Header */}
      <div>
        <h3 style={{
          fontFamily: "'Fraunces', serif",
          fontSize: "18px",
          fontWeight: 700,
          color: `var(--${COLOR}, #7D9B76)`,
          margin: 0,
        }}>
          🩺 Symptoms
        </h3>
        <span style={{
          fontFamily: "'Nunito', sans-serif",
          fontSize: "12px",
          color: "var(--brown-light, #9A7E7E)",
        }}>
          ~1 min
        </span>
      </div>

      {/* Fatigue — always visible */}
      <div>
        <label style={{
          fontFamily: "'Nunito', sans-serif",
          fontSize: "14px",
          fontWeight: 600,
          color: "var(--brown, #3B2F2F)",
          display: "block",
          marginBottom: "8px",
        }}>
          Fatigue level
        </label>
        <EmojiScale
          id="symptoms-fatigue"
          options={FATIGUE_OPTIONS}
          value={data.fatigue}
          onSelect={(i) => onUpdate?.("fatigue", i)}
          colorClass={COLOR}
        />
      </div>

      {/* Divider */}
      <div style={{
        height: "1px",
        background: "var(--tan-light, #EDE3CF)",
      }} />

      {/* Symptom toggle cards */}
      <div>
        <label style={{
          fontFamily: "'Nunito', sans-serif",
          fontSize: "14px",
          fontWeight: 600,
          color: "var(--brown, #3B2F2F)",
          display: "block",
          marginBottom: "10px",
        }}>
          Any of these today? <span style={{
            fontWeight: 400,
            color: "var(--brown-light, #9A7E7E)",
            fontSize: "12px",
          }}>Tap Yes to rate severity</span>
        </label>
        <div style={{
          display: "flex",
          flexDirection: "column",
          gap: "10px",
        }}>
          {SYMPTOMS.map((sym) => (
            <SymptomCard
              key={sym.key}
              emoji={sym.emoji}
              name={sym.name}
              sub={sym.sub}
              active={data[sym.key]?.active || false}
              severity={data[sym.key]?.severity ?? null}
              onToggle={(val) => {
                onUpdate?.(sym.key, {
                  ...(data[sym.key] || {}),
                  active: val,
                  severity: val ? (data[sym.key]?.severity ?? null) : null,
                });
              }}
              onSeverity={(i) => {
                onUpdate?.(sym.key, {
                  ...(data[sym.key] || {}),
                  active: true,
                  severity: i,
                });
              }}
              colorClass={COLOR}
            />
          ))}
        </div>
      </div>

      {/* Additional notes */}
      <div>
        <label style={{
          fontFamily: "'Nunito', sans-serif",
          fontSize: "13px",
          fontWeight: 600,
          color: "var(--brown, #3B2F2F)",
          display: "block",
          marginBottom: "6px",
        }}>
          Anything else? <span style={{ fontWeight: 400, color: "var(--brown-light)" }}>(optional)</span>
        </label>
        <input
          type="text"
          placeholder="e.g. New symptom, something unusual..."
          value={data.otherNote || ""}
          onChange={(e) => onUpdate?.("otherNote", e.target.value)}
          style={{
            width: "100%",
            padding: "10px 12px",
            fontFamily: "'Nunito', sans-serif",
            fontSize: "14px",
            color: "var(--brown, #3B2F2F)",
            background: "var(--cream, #FAF5EB)",
            border: "1.5px solid var(--tan, #D4C5A9)",
            borderRadius: "12px",
            outline: "none",
            boxSizing: "border-box",
            transition: "border-color 0.2s ease",
          }}
          onFocus={(e) => e.target.style.borderColor = `var(--${COLOR})`}
          onBlur={(e) => e.target.style.borderColor = "var(--tan, #D4C5A9)"}
        />
      </div>

      {/* Save */}
      <button
        onClick={handleSave}
        style={{
          fontFamily: "'Nunito', sans-serif",
          fontSize: "16px",
          fontWeight: 700,
          color: "var(--white, #FFFDF8)",
          background: `var(--${COLOR}, #7D9B76)`,
          border: "none",
          borderRadius: "14px",
          padding: "12px 24px",
          cursor: "pointer",
          transition: "all 0.2s ease",
          marginTop: "4px",
          boxShadow: `0 3px 10px color-mix(in srgb, var(--${COLOR}) 25%, transparent)`,
          WebkitTapHighlightColor: "transparent",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = `var(--${COLOR}-dark, #5A7554)`;
          e.currentTarget.style.transform = "scale(1.02)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = `var(--${COLOR}, #7D9B76)`;
          e.currentTarget.style.transform = "scale(1)";
        }}
      >
        Save Symptoms 🩺
      </button>

      <SkipLink onSkip={onSkip} />
    </div>
  );
}