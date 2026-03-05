// src/components/SymptomCard.jsx — Rooted Health Tracker
// Expandable symptom card — tap Yes to reveal severity scale

import { useCallback } from "react";
import EmojiScale from "./EmojiScale";

const playTap = () => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.connect(g);
    g.connect(ctx.destination);
    o.frequency.setValueAtTime(520, ctx.currentTime);
    o.frequency.exponentialRampToValueAtTime(680, ctx.currentTime + 0.06);
    g.gain.setValueAtTime(0.1, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.16);
    o.start();
    o.stop(ctx.currentTime + 0.16);
  } catch {
    return;
  }
};

const SEVERITY_OPTIONS = [
  { emoji: "😊", label: "Mild" },
  { emoji: "😐", label: "Moderate" },
  { emoji: "😣", label: "Bad" },
  { emoji: "😫", label: "Severe" },
  { emoji: "🆘", label: "Worst" },
];

/**
 * SymptomCard
 *
 * Props:
 *   emoji         — display emoji
 *   name          — symptom name (e.g. "Headache")
 *   sub           — subtitle text (optional, e.g. "Including migraine")
 *   active        — boolean, whether symptom is toggled on
 *   severity      — severity index (0-4) or null
 *   onToggle      — (bool) => void
 *   onSeverity    — (index) => void
 *   colorClass    — section color
 *   severityOptions — custom severity scale (defaults to standard 5-point)
 *   alwaysExpanded — skip the toggle, always show severity (for Fatigue)
 */
export default function SymptomCard({
  emoji = "🤕",
  name = "Symptom",
  sub,
  active = false,
  severity = null,
  onToggle,
  onSeverity,
  colorClass = "sage",
  severityOptions = SEVERITY_OPTIONS,
  alwaysExpanded = false,
}) {
  const color = `var(--${colorClass}, var(--sage))`;
  const showSeverity = alwaysExpanded || active;

  const handleToggle = useCallback(() => {
    playTap();
    onToggle?.(!active);
  }, [active, onToggle]);

  return (
    <div
      style={{
        background: "var(--white, #FFFDF8)",
        border: active || alwaysExpanded
          ? `2px solid ${color}`
          : "2px solid var(--tan-light, #EDE3CF)",
        borderRadius: "14px",
        padding: "12px 14px",
        transition: "all 0.2s ease",
      }}
    >
      {/* Header row */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "10px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flex: 1 }}>
          <span style={{ fontSize: "22px", lineHeight: 1 }}>{emoji}</span>
          <div>
            <div style={{
              fontFamily: "'Nunito', sans-serif",
              fontSize: "14px",
              fontWeight: 600,
              color: "var(--brown, #3B2F2F)",
            }}>
              {name}
            </div>
            {sub && (
              <div style={{
                fontFamily: "'Nunito', sans-serif",
                fontSize: "11px",
                color: "var(--brown-light, #9A7E7E)",
              }}>
                {sub}
              </div>
            )}
          </div>
        </div>

        {/* Toggle button (hidden if alwaysExpanded) */}
        {!alwaysExpanded && (
          <button
            onClick={handleToggle}
            aria-pressed={active}
            style={{
              fontFamily: "'Nunito', sans-serif",
              fontSize: "12px",
              fontWeight: 700,
              color: active ? "var(--white, #FFFDF8)" : "var(--brown-light, #9A7E7E)",
              background: active ? color : "transparent",
              border: active
                ? `1.5px solid ${color}`
                : "1.5px solid var(--tan, #D4C5A9)",
              borderRadius: "8px",
              padding: "4px 12px",
              cursor: "pointer",
              transition: "all 0.2s ease",
              whiteSpace: "nowrap",
              WebkitTapHighlightColor: "transparent",
            }}
          >
            {active ? "Yes ✓" : "Yes"}
          </button>
        )}
      </div>

      {/* Severity scale — reveals when active */}
      {showSeverity && (
        <div
          style={{
            marginTop: "10px",
            paddingTop: "10px",
            borderTop: "1px solid var(--tan-light, #EDE3CF)",
            animation: "symptom-reveal 0.25s ease-out",
          }}
        >
          <EmojiScale
            id={`${name}-severity`}
            options={severityOptions}
            value={severity}
            onSelect={onSeverity}
            colorClass={colorClass}
            size="sm"
          />
        </div>
      )}

      <style>{`
        @keyframes symptom-reveal {
          from {
            opacity: 0;
            max-height: 0;
            margin-top: 0;
            padding-top: 0;
          }
          to {
            opacity: 1;
            max-height: 100px;
            margin-top: 10px;
            padding-top: 10px;
          }
        }
      `}</style>
    </div>
  );
}