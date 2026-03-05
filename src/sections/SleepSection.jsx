// src/sections/SleepSection.jsx — Rooted Health Tracker
// Section 1: Sleep — color: mauve
// Fields: quality (emoji), activity (icon grid), dreamType (icon grid), dreamNote (text)
// Progressive reveal: max 3 visible at a time
// Good Enough Mode: quality emoji only

import { useState, useCallback } from "react";
import EmojiScale from "../components/EmojiScale";
import IconGrid from "../components/IconGrid";
import SectionProgress from "../components/SectionProgress";
import SkipLink from "../components/SkipLink";

const COLOR = "mauve";

const QUALITY_OPTIONS = [
  { emoji: "😫", label: "Awful" },
  { emoji: "😕", label: "Poor" },
  { emoji: "😐", label: "Okay" },
  { emoji: "🙂", label: "Good" },
  { emoji: "😴", label: "Great" },
];

const ACTIVITY_OPTIONS = [
  { emoji: "📖", label: "Reading" },
  { emoji: "📱", label: "Scrolling" },
  { emoji: "🎵", label: "Music" },
  { emoji: "📺", label: "TV" },
  { emoji: "😴", label: "Nothing" },
];

const DREAM_OPTIONS = [
  { emoji: "🚫", label: "None" },
  { emoji: "🌫️", label: "Vague" },
  { emoji: "🎬", label: "Vivid" },
  { emoji: "😱", label: "Nightmare" },
];

// Encouraging messages from the spec
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
 * SleepSection
 *
 * Props:
 *   data           — current sleep data object
 *   onUpdate       — (field, value) => void
 *   onSave         — () => void (triggers Firestore save)
 *   onSkip         — () => void
 *   onCelebrate    — ({ emoji, title, msg }) => void
 *   goodEnough     — boolean
 *   yesterdayData   — yesterday's sleep data for "same as yesterday"
 */
export default function SleepSection({
  data = {},
  onUpdate,
  onSave,
  onSkip,
  onCelebrate,
  goodEnough = false,
  yesterdayData = null,
}) {
  const [step, setStep] = useState(0);

  const totalSteps = goodEnough ? 1 : 3;
  // Steps: 0=quality, 1=activity, 2=dreams

  const handleSave = useCallback(() => {
    onSave?.();
    onCelebrate?.({
      emoji: "😴",
      title: "Sleep logged!",
      msg: randomMsg(),
    });
  }, [onSave, onCelebrate]);

  const handleSameAsYesterday = useCallback(() => {
    if (!yesterdayData) return;
    // Copy all fields from yesterday
    Object.entries(yesterdayData).forEach(([field, value]) => {
      onUpdate?.(field, value);
    });
    handleSave();
  }, [yesterdayData, onUpdate, handleSave]);

  const canSave =
    goodEnough
      ? data.quality != null
      : data.quality != null; // quality is the minimum requirement

  return (
    <div
      className="section-card"
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
      {/* Header */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}>
        <div>
          <h3 style={{
            fontFamily: "'Fraunces', serif",
            fontSize: "18px",
            fontWeight: 700,
            color: `var(--${COLOR}, #A07B8A)`,
            margin: 0,
          }}>
            😴 Sleep
          </h3>
          <span style={{
            fontFamily: "'Nunito', sans-serif",
            fontSize: "12px",
            color: "var(--brown-light, #9A7E7E)",
          }}>
            ~1 min
          </span>
        </div>
        {yesterdayData && (
          <button
            onClick={handleSameAsYesterday}
            style={{
              fontFamily: "'Nunito', sans-serif",
              fontSize: "12px",
              fontWeight: 600,
              color: `var(--${COLOR}, #A07B8A)`,
              background: `color-mix(in srgb, var(--${COLOR}, #A07B8A) 8%, transparent)`,
              border: `1.5px dashed var(--${COLOR}, #A07B8A)`,
              borderRadius: "10px",
              padding: "6px 12px",
              cursor: "pointer",
              WebkitTapHighlightColor: "transparent",
              transition: "all 0.15s ease",
            }}
          >
            📋 Same as yesterday
          </button>
        )}
      </div>

      {!goodEnough && <SectionProgress total={totalSteps} current={step} colorClass={COLOR} />}

      {/* Step 0: Sleep quality */}
      {step >= 0 && (
        <div>
          <label style={{
            fontFamily: "'Nunito', sans-serif",
            fontSize: "14px",
            fontWeight: 600,
            color: "var(--brown, #3B2F2F)",
            display: "block",
            marginBottom: "8px",
          }}>
            How did you sleep?
          </label>
          <EmojiScale
            id="sleep-quality"
            options={QUALITY_OPTIONS}
            value={data.quality}
            onSelect={(i) => {
              onUpdate?.("quality", i);
              if (goodEnough) return;
              // Auto-advance after a short delay
              if (step === 0) setTimeout(() => setStep(1), 300);
            }}
            colorClass={COLOR}
          />
        </div>
      )}

      {/* Step 1: Pre-bed activity (full mode only) */}
      {!goodEnough && step >= 1 && (
        <div style={{
          animation: "section-reveal 0.3s ease-out",
        }}>
          <label style={{
            fontFamily: "'Nunito', sans-serif",
            fontSize: "14px",
            fontWeight: 600,
            color: "var(--brown, #3B2F2F)",
            display: "block",
            marginBottom: "8px",
          }}>
            What'd you do before bed?
          </label>
          <IconGrid
            options={ACTIVITY_OPTIONS}
            value={data.activity}
            onSelect={(val) => {
              onUpdate?.("activity", val);
              if (step === 1) setTimeout(() => setStep(2), 300);
            }}
            colorClass={COLOR}
            columns={5}
          />
        </div>
      )}

      {/* Step 2: Dreams (full mode only) */}
      {!goodEnough && step >= 2 && (
        <div style={{
          animation: "section-reveal 0.3s ease-out",
        }}>
          <label style={{
            fontFamily: "'Nunito', sans-serif",
            fontSize: "14px",
            fontWeight: 600,
            color: "var(--brown, #3B2F2F)",
            display: "block",
            marginBottom: "8px",
          }}>
            Dreams?
          </label>
          <IconGrid
            options={DREAM_OPTIONS}
            value={data.dreamType}
            onSelect={(val) => onUpdate?.("dreamType", val)}
            colorClass={COLOR}
            columns={4}
          />

          {/* Dream note — reveals if dream type is not None */}
          {data.dreamType && data.dreamType !== "None" && (
            <div style={{
              marginTop: "10px",
              animation: "section-reveal 0.3s ease-out",
            }}>
              <textarea
                placeholder="Describe your dream (optional)..."
                value={data.dreamNote || ""}
                onChange={(e) => onUpdate?.("dreamNote", e.target.value)}
                style={{
                  width: "100%",
                  minHeight: "60px",
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
                onFocus={(e) => e.target.style.borderColor = `var(--${COLOR})`}
                onBlur={(e) => e.target.style.borderColor = "var(--tan, #D4C5A9)"}
              />
            </div>
          )}
        </div>
      )}

      {/* Save button */}
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
            marginTop: "4px",
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
          Save Sleep 😴
        </button>
      )}

      {/* Skip */}
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