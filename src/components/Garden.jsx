// src/components/Garden.jsx — Rooted Health Tracker
// Growing garden streak visualization — plant grows with streak, 31-dot progress row
// Missing a day doesn't reset — garden just pauses

import { useMemo } from "react";

/**
 * Garden
 *
 * Props:
 *   streakDays    — number of days logged (not necessarily consecutive)
 *   loggedDays    — array of day-of-month numbers that have logs [1, 2, 5, 6, ...]
 *   currentDay    — today's day-of-month (1-31)
 *   totalDays     — days in the current month (28-31)
 *   colorClass    — "sage" | "terra" etc. (default: "sage")
 */

// Plant grows through stages based on total logged days
const PLANT_STAGES = [
  { min: 0,  emoji: "🫘", label: "A seed" },
  { min: 1,  emoji: "🌱", label: "Sprouting" },
  { min: 3,  emoji: "🪴", label: "Growing" },
  { min: 7,  emoji: "🌿", label: "Thriving" },
  { min: 14, emoji: "🌳", label: "Strong" },
  { min: 21, emoji: "🌸", label: "Blooming" },
  { min: 28, emoji: "🌺", label: "Full bloom" },
];

function getPlantStage(days) {
  let stage = PLANT_STAGES[0];
  for (const s of PLANT_STAGES) {
    if (days >= s.min) stage = s;
  }
  return stage;
}

function Garden({
  streakDays = 0,
  loggedDays = [],
  currentDay = new Date().getDate(),
  totalDays = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate(),
  colorClass = "sage",
}) {
  const stage = useMemo(() => getPlantStage(streakDays), [streakDays]);
  const loggedSet = useMemo(() => new Set(loggedDays), [loggedDays]);

  const color = `var(--${colorClass}, var(--sage))`;

  return (
    <div
      className="garden"
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "14px",
        padding: "20px 16px",
        background: "var(--white, #FFFDF8)",
        borderRadius: "20px",
        border: "1.5px solid var(--tan-light, #EDE3CF)",
      }}
    >
      {/* Plant + label */}
      <div style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "4px",
      }}>
        <span
          style={{
            fontSize: "48px",
            lineHeight: 1,
            animation: "garden-sway 3s ease-in-out infinite",
          }}
        >
          {stage.emoji}
        </span>
        <span style={{
          fontFamily: "'Fraunces', serif",
          fontSize: "16px",
          fontWeight: 600,
          color: "var(--brown, #3B2F2F)",
        }}>
          {stage.label}
        </span>
        <span style={{
          fontFamily: "'Nunito', sans-serif",
          fontSize: "13px",
          fontWeight: 500,
          color: "var(--brown-light, #9A7E7E)",
        }}>
          {streakDays} {streakDays === 1 ? "day" : "days"} logged this month
        </span>
      </div>

      {/* 31-dot progress row */}
      <div style={{
        display: "flex",
        flexWrap: "wrap",
        gap: "5px",
        justifyContent: "center",
        maxWidth: "320px",
      }}>
        {Array.from({ length: totalDays }, (_, i) => {
          const day = i + 1;
          const isLogged = loggedSet.has(day);
          const isToday = day === currentDay;
          const isFuture = day > currentDay;

          return (
            <div
              key={day}
              title={`Day ${day}${isLogged ? " ✓" : ""}${isToday ? " (today)" : ""}`}
              style={{
                width: "14px",
                height: "14px",
                borderRadius: "50%",
                background: isLogged
                  ? color
                  : isFuture
                    ? "var(--tan-light, #EDE3CF)"
                    : "var(--tan, #D4C5A9)",
                border: isToday
                  ? `2.5px solid var(--brown, #3B2F2F)`
                  : "2px solid transparent",
                transition: "all 0.3s ease",
                opacity: isFuture ? 0.4 : 1,
                boxShadow: isLogged
                  ? `0 1px 4px color-mix(in srgb, ${color} 30%, transparent)`
                  : "none",
              }}
            />
          );
        })}
      </div>

      {/* Legend */}
      <div style={{
        display: "flex",
        gap: "14px",
        alignItems: "center",
        marginTop: "2px",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          <div style={{
            width: "10px",
            height: "10px",
            borderRadius: "50%",
            background: color,
          }} />
          <span style={{
            fontFamily: "'Nunito', sans-serif",
            fontSize: "11px",
            color: "var(--brown-light, #9A7E7E)",
          }}>
            Logged
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          <div style={{
            width: "10px",
            height: "10px",
            borderRadius: "50%",
            background: "var(--tan, #D4C5A9)",
          }} />
          <span style={{
            fontFamily: "'Nunito', sans-serif",
            fontSize: "11px",
            color: "var(--brown-light, #9A7E7E)",
          }}>
            Missed
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          <div style={{
            width: "10px",
            height: "10px",
            borderRadius: "50%",
            border: "2px solid var(--brown, #3B2F2F)",
            background: "transparent",
            boxSizing: "border-box",
          }} />
          <span style={{
            fontFamily: "'Nunito', sans-serif",
            fontSize: "11px",
            color: "var(--brown-light, #9A7E7E)",
          }}>
            Today
          </span>
        </div>
      </div>

      {/* Gentle sway animation */}
      <style>{`
        @keyframes garden-sway {
          0%, 100% { transform: rotate(-2deg); }
          50% { transform: rotate(2deg); }
        }
      `}</style>
    </div>
  );
}

export { Garden };
export default Garden;