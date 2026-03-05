// src/sections/CheckInSection.jsx — Rooted Health Tracker
// Section 2: Check-ins — color: terra
// Multiple check-ins per day. Each has: timestamp, event, mood, energy, pain
// Past check-ins show as collapsed cards. "+ Add Check-in" saves to list.

import { useState, useCallback, useMemo } from "react";
import EmojiScale from "../components/EmojiScale";
import SkipLink from "../components/SkipLink";

const COLOR = "terra";

const MOOD_OPTIONS = [
  { emoji: "😢", label: "Awful" },
  { emoji: "😕", label: "Low" },
  { emoji: "😐", label: "Okay" },
  { emoji: "🙂", label: "Good" },
  { emoji: "😊", label: "Great" },
];

const ENERGY_OPTIONS = [
  { emoji: "🪫", label: "Empty" },
  { emoji: "😮‍💨", label: "Low" },
  { emoji: "😐", label: "Mid" },
  { emoji: "⚡", label: "Good" },
  { emoji: "🔋", label: "Full" },
];

const PAIN_OPTIONS = [
  { emoji: "😌", label: "None" },
  { emoji: "🤏", label: "Mild" },
  { emoji: "😐", label: "Moderate" },
  { emoji: "😣", label: "Bad" },
  { emoji: "😫", label: "Severe" },
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

/** Format a timestamp for display */
function formatTime(ts) {
  if (!ts) return "";
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

/** Get the emoji for a given scale index */
function getEmoji(options, index) {
  if (index == null || !options[index]) return "—";
  return options[index].emoji;
}

/**
 * CheckInSection
 *
 * Props:
 *   data         — { checkins: [...] } array of past check-ins
 *   onUpdate     — (field, value) => void — updates the checkins array
 *   onSave       — () => void
 *   onSkip       — () => void
 *   onCelebrate  — ({ emoji, title, msg }) => void
 *   goodEnough   — boolean
 */
export default function CheckInSection({
  data = {},
  onUpdate,
  onSave,
  onSkip,
  onCelebrate,
  goodEnough = false,
}) {
  const checkins = useMemo(() => data.checkins || [], [data.checkins]);

  // Current check-in being built
  const [draft, setDraft] = useState({
    mood: null,
    energy: null,
    pain: null,
    event: "",
  });

  const [expandedIndex, setExpandedIndex] = useState(null);

  const updateDraft = useCallback((field, value) => {
    setDraft((prev) => ({ ...prev, [field]: value }));
  }, []);

  const canAdd = goodEnough
    ? draft.mood != null && draft.pain != null
    : draft.mood != null;

  const handleAdd = useCallback(() => {
    const newCheckin = {
      ...draft,
      timestamp: new Date().toISOString(),
    };

    // If good enough mode, strip optional fields
    if (goodEnough) {
      delete newCheckin.energy;
      delete newCheckin.event;
    }

    const updated = [...checkins, newCheckin];
    onUpdate?.("checkins", updated);

    // Reset draft
    setDraft({ mood: null, energy: null, pain: null, event: "" });

    // Save and celebrate
    onSave?.();
    onCelebrate?.({
      emoji: "📝",
      title: "Check-in logged!",
      msg: randomMsg(),
    });
  }, [draft, checkins, goodEnough, onUpdate, onSave, onCelebrate]);

  return (
    <div
      style={{
        background: "var(--white, #FFFDF8)",
        borderRadius: "20px",
        border: `2px solid var(--${COLOR}, #C1724F)`,
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
          color: `var(--${COLOR}, #C1724F)`,
          margin: 0,
        }}>
          📝 Check-in
        </h3>
        <span style={{
          fontFamily: "'Nunito', sans-serif",
          fontSize: "12px",
          color: "var(--brown-light, #9A7E7E)",
        }}>
          ~30 sec · Add as many as you want today
        </span>
      </div>

      {/* Past check-ins — collapsed cards */}
      {checkins.length > 0 && (
        <div style={{
          display: "flex",
          flexDirection: "column",
          gap: "8px",
        }}>
          <span style={{
            fontFamily: "'Nunito', sans-serif",
            fontSize: "12px",
            fontWeight: 600,
            color: "var(--brown-light, #9A7E7E)",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}>
            Today's check-ins
          </span>
          {checkins.map((ci, i) => {
            const isExpanded = expandedIndex === i;
            return (
              <button
                key={i}
                onClick={() => setExpandedIndex(isExpanded ? null : i)}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: isExpanded ? "6px" : "0",
                  padding: "10px 12px",
                  background: "var(--cream, #FAF5EB)",
                  border: "1.5px solid var(--tan-light, #EDE3CF)",
                  borderRadius: "12px",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "all 0.2s ease",
                  animation: "checkin-slide 0.3s ease-out",
                  WebkitTapHighlightColor: "transparent",
                }}
              >
                {/* Collapsed row */}
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  width: "100%",
                }}>
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}>
                    <span style={{
                      fontFamily: "'Nunito', sans-serif",
                      fontSize: "12px",
                      color: "var(--brown-light, #9A7E7E)",
                    }}>
                      {formatTime(ci.timestamp)}
                    </span>
                    <span style={{ fontSize: "18px" }}>
                      {getEmoji(MOOD_OPTIONS, ci.mood)}
                    </span>
                    <span style={{ fontSize: "18px" }}>
                      {getEmoji(ENERGY_OPTIONS, ci.energy)}
                    </span>
                    <span style={{ fontSize: "18px" }}>
                      {getEmoji(PAIN_OPTIONS, ci.pain)}
                    </span>
                  </div>
                  <span style={{
                    fontSize: "12px",
                    color: "var(--brown-light, #9A7E7E)",
                    transform: isExpanded ? "rotate(180deg)" : "rotate(0)",
                    transition: "transform 0.2s ease",
                  }}>
                    ▾
                  </span>
                </div>

                {/* Expanded detail */}
                {isExpanded && (
                  <div style={{
                    fontFamily: "'Nunito', sans-serif",
                    fontSize: "13px",
                    color: "var(--brown, #3B2F2F)",
                    display: "flex",
                    flexDirection: "column",
                    gap: "2px",
                    paddingTop: "4px",
                    borderTop: "1px solid var(--tan-light, #EDE3CF)",
                  }}>
                    <span>Mood: {getEmoji(MOOD_OPTIONS, ci.mood)} {ci.mood != null ? MOOD_OPTIONS[ci.mood]?.label : "—"}</span>
                    {ci.energy != null && (
                      <span>Energy: {getEmoji(ENERGY_OPTIONS, ci.energy)} {ENERGY_OPTIONS[ci.energy]?.label}</span>
                    )}
                    <span>Pain: {getEmoji(PAIN_OPTIONS, ci.pain)} {ci.pain != null ? PAIN_OPTIONS[ci.pain]?.label : "—"}</span>
                    {ci.event && <span>Event: {ci.event}</span>}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* New check-in form */}
      <div style={{
        display: "flex",
        flexDirection: "column",
        gap: "14px",
        padding: "14px",
        background: "var(--cream, #FAF5EB)",
        borderRadius: "14px",
        border: "1.5px solid var(--tan-light, #EDE3CF)",
      }}>
        <span style={{
          fontFamily: "'Nunito', sans-serif",
          fontSize: "13px",
          fontWeight: 700,
          color: `var(--${COLOR}, #C1724F)`,
        }}>
          {checkins.length === 0 ? "How are you right now?" : "+ New check-in"}
        </span>

        {/* Mood */}
        <div>
          <label style={{
            fontFamily: "'Nunito', sans-serif",
            fontSize: "13px",
            fontWeight: 600,
            color: "var(--brown, #3B2F2F)",
            display: "block",
            marginBottom: "6px",
          }}>
            Mood
          </label>
          <EmojiScale
            id="checkin-mood"
            options={MOOD_OPTIONS}
            value={draft.mood}
            onSelect={(i) => updateDraft("mood", i)}
            colorClass={COLOR}
            size="sm"
          />
        </div>

        {/* Energy — hidden in good enough mode */}
        {!goodEnough && (
          <div>
            <label style={{
              fontFamily: "'Nunito', sans-serif",
              fontSize: "13px",
              fontWeight: 600,
              color: "var(--brown, #3B2F2F)",
              display: "block",
              marginBottom: "6px",
            }}>
              Energy
            </label>
            <EmojiScale
              id="checkin-energy"
              options={ENERGY_OPTIONS}
              value={draft.energy}
              onSelect={(i) => updateDraft("energy", i)}
              colorClass={COLOR}
              size="sm"
            />
          </div>
        )}

        {/* Pain */}
        <div>
          <label style={{
            fontFamily: "'Nunito', sans-serif",
            fontSize: "13px",
            fontWeight: 600,
            color: "var(--brown, #3B2F2F)",
            display: "block",
            marginBottom: "6px",
          }}>
            Pain
          </label>
          <EmojiScale
            id="checkin-pain"
            options={PAIN_OPTIONS}
            value={draft.pain}
            onSelect={(i) => updateDraft("pain", i)}
            colorClass={COLOR}
            size="sm"
          />
        </div>

        {/* Event note — hidden in good enough mode */}
        {!goodEnough && (
          <div>
            <label style={{
              fontFamily: "'Nunito', sans-serif",
              fontSize: "13px",
              fontWeight: 600,
              color: "var(--brown, #3B2F2F)",
              display: "block",
              marginBottom: "6px",
            }}>
              What's happening? <span style={{ fontWeight: 400, color: "var(--brown-light)" }}>(optional)</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Just had lunch, feeling off..."
              value={draft.event}
              onChange={(e) => updateDraft("event", e.target.value)}
              style={{
                width: "100%",
                padding: "10px 12px",
                fontFamily: "'Nunito', sans-serif",
                fontSize: "14px",
                color: "var(--brown, #3B2F2F)",
                background: "var(--white, #FFFDF8)",
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
        )}

        {/* Add button */}
        <button
          onClick={handleAdd}
          disabled={!canAdd}
          style={{
            fontFamily: "'Nunito', sans-serif",
            fontSize: "15px",
            fontWeight: 700,
            color: canAdd ? "var(--white, #FFFDF8)" : "var(--brown-light, #9A7E7E)",
            background: canAdd
              ? `var(--${COLOR}, #C1724F)`
              : "var(--tan-light, #EDE3CF)",
            border: "none",
            borderRadius: "14px",
            padding: "12px 24px",
            cursor: canAdd ? "pointer" : "not-allowed",
            transition: "all 0.2s ease",
            boxShadow: canAdd
              ? `0 3px 10px color-mix(in srgb, var(--${COLOR}) 25%, transparent)`
              : "none",
            WebkitTapHighlightColor: "transparent",
          }}
          onMouseEnter={(e) => {
            if (canAdd) {
              e.currentTarget.style.background = `var(--${COLOR}-dark, #9E5A38)`;
              e.currentTarget.style.transform = "scale(1.02)";
            }
          }}
          onMouseLeave={(e) => {
            if (canAdd) {
              e.currentTarget.style.background = `var(--${COLOR}, #C1724F)`;
              e.currentTarget.style.transform = "scale(1)";
            }
          }}
        >
          {checkins.length === 0 ? "Save Check-in 📝" : "+ Add Check-in"}
        </button>
      </div>

      {/* Skip */}
      <SkipLink onSkip={onSkip} />

      <style>{`
        @keyframes checkin-slide {
          from {
            opacity: 0;
            transform: translateX(-12px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
    </div>
  );
}