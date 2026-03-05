// src/pages/Home.jsx — Rooted Health Tracker
// Home screen: greeting, garden, today's progress, section cards, CTA

import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Garden from "../components/Garden.jsx";
import GoodEnoughToggle from "../components/GoodEnoughToggle";
import BottomNav from "../components/BottomNav";

const SECTIONS = [
  { id: "sleep",      label: "Sleep",          emoji: "😴", color: "mauve",  time: "~1 min" },
  { id: "checkins",   label: "Check-in",       emoji: "📝", color: "terra",  time: "~30 sec" },
  { id: "mood",       label: "Mood",           emoji: "💜", color: "mauve",  time: "~2 min" },
  { id: "symptoms",   label: "Symptoms",       emoji: "🩺", color: "sage",   time: "~1 min" },
  { id: "pots",       label: "POTS",           emoji: "💙", color: "teal",   time: "~1.5 min" },
  { id: "eds",        label: "EDS",            emoji: "🧡", color: "amber",  time: "~1.5 min" },
  { id: "nutrition",  label: "Nutrition",      emoji: "🍽️", color: "gold",   time: "~2 min" },
  { id: "habits",     label: "Habits + School", emoji: "⭐", color: "mauve",  time: "~2 min" },
];

const GREETINGS = {
  morning: [
    "Good morning 🌅",
    "Rise and shine 🌻",
    "Hey, you're up ☀️",
  ],
  afternoon: [
    "Good afternoon 🌤️",
    "Hey there ☀️",
    "Afternoon check-in 🌿",
  ],
  evening: [
    "Good evening 🌙",
    "Winding down? 🌛",
    "Evening vibes 🌸",
  ],
};

const ENCOURAGEMENTS = [
  "You're doing amazing.",
  "One step at a time.",
  "Just showing up matters.",
  "Be gentle with yourself today.",
  "You've got this. Truly.",
  "Progress isn't always visible — but it's real.",
  "Your body and brain are worth tracking.",
  "Small data, big picture.",
];

function getGreeting() {
  const hour = new Date().getHours();
  const period = hour < 12 ? "morning" : hour < 17 ? "afternoon" : "evening";
  const options = GREETINGS[period];
  return options[Math.floor(Math.random() * options.length)];
}

function getEncouragement() {
  return ENCOURAGEMENTS[Math.floor(Math.random() * ENCOURAGEMENTS.length)];
}

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

/**
 * Home
 *
 * Props:
 *   user           — Firebase user object
 *   log            — today's log data
 *   completedSections — array of completed section IDs
 *   loggedDays     — array of day-of-month numbers with logs
 *   goodEnough     — boolean
 *   onGoodEnoughToggle — (bool) => void
 *   onLogout       — () => void
 */
export default function Home({
  user,
  log = {},
  completedSections = [],
  loggedDays = [],
  goodEnough = false,
  onGoodEnoughToggle,
  onLogout,
}) {
  const navigate = useNavigate();
  const [greeting] = useState(getGreeting);
  const [encouragement] = useState(getEncouragement);

  const completedSet = useMemo(
    () => new Set(completedSections),
    [completedSections]
  );

  const totalSections = SECTIONS.length;
  const doneSections = completedSections.length;
  const progressPct = totalSections > 0 ? Math.round((doneSections / totalSections) * 100) : 0;

  // Quick chips from today's mood/pain/energy (from check-ins or mood section)
  const latestCheckin = (log.checkins || []).length > 0
    ? log.checkins[log.checkins.length - 1]
    : null;

  const now = new Date();
  const currentDay = now.getDate();
  const totalDays = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();

  return (
    <div style={{
      minHeight: "100vh",
      background: "var(--cream, #FAF5EB)",
      paddingBottom: "90px",
    }}>
      {/* Top bar */}
      <header style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "16px 20px 8px",
      }}>
        {/* Logo */}
        <div style={{
          fontFamily: "'Fraunces', serif",
          fontSize: "22px",
          fontWeight: 700,
          color: "var(--terra, #C1724F)",
        }}>
          🌱 Rooted
        </div>

        {/* Date */}
        <div style={{
          fontFamily: "'Nunito', sans-serif",
          fontSize: "13px",
          fontWeight: 600,
          color: "var(--brown-light, #9A7E7E)",
          textAlign: "center",
        }}>
          {now.toLocaleDateString("en-US", {
            weekday: "short",
            month: "short",
            day: "numeric",
          })}
        </div>

        {/* Streak pill */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "4px",
          padding: "4px 10px",
          background: "color-mix(in srgb, var(--sage, #7D9B76) 10%, var(--cream))",
          borderRadius: "20px",
          border: "1.5px solid var(--sage, #7D9B76)",
        }}>
          <span style={{ fontSize: "14px" }}>🌿</span>
          <span style={{
            fontFamily: "'Nunito', sans-serif",
            fontSize: "12px",
            fontWeight: 700,
            color: "var(--sage-dark, #5A7554)",
          }}>
            {loggedDays.length}
          </span>
        </div>
      </header>

      {/* Main content */}
      <main style={{
        padding: "0 20px 20px",
        display: "flex",
        flexDirection: "column",
        gap: "16px",
      }}>
        {/* Greeting */}
        <div style={{ marginTop: "4px" }}>
          <h1 style={{
            fontFamily: "'Fraunces', serif",
            fontSize: "26px",
            fontWeight: 700,
            color: "var(--brown, #3B2F2F)",
            margin: "0 0 4px 0",
          }}>
            {greeting}
          </h1>
          <p style={{
            fontFamily: "'Nunito', sans-serif",
            fontSize: "14px",
            color: "var(--brown-light, #9A7E7E)",
            margin: 0,
          }}>
            {encouragement}
          </p>
        </div>

        {/* Garden card */}
        <Garden
          streakDays={loggedDays.length}
          loggedDays={loggedDays}
          currentDay={currentDay}
          totalDays={totalDays}
        />

        {/* Today's log card */}
        <div style={{
          background: "var(--white, #FFFDF8)",
          borderRadius: "20px",
          border: "1.5px solid var(--tan-light, #EDE3CF)",
          padding: "16px",
          display: "flex",
          flexDirection: "column",
          gap: "12px",
        }}>
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}>
            <span style={{
              fontFamily: "'Fraunces', serif",
              fontSize: "16px",
              fontWeight: 700,
              color: "var(--brown, #3B2F2F)",
            }}>
              Today's log
            </span>
            <span style={{
              fontFamily: "'Nunito', sans-serif",
              fontSize: "13px",
              fontWeight: 600,
              color: progressPct === 100
                ? "var(--sage, #7D9B76)"
                : "var(--brown-light, #9A7E7E)",
            }}>
              {doneSections}/{totalSections} sections
            </span>
          </div>

          {/* Progress bar */}
          <div style={{
            height: "10px",
            borderRadius: "5px",
            background: "var(--tan-light, #EDE3CF)",
            overflow: "hidden",
          }}>
            <div style={{
              height: "100%",
              width: `${progressPct}%`,
              borderRadius: "5px",
              background: progressPct === 100
                ? "var(--sage, #7D9B76)"
                : "var(--terra, #C1724F)",
              transition: "width 0.5s ease",
            }} />
          </div>

          {/* Quick chips */}
          {latestCheckin && (
            <div style={{
              display: "flex",
              gap: "8px",
              flexWrap: "wrap",
            }}>
              {latestCheckin.mood != null && (
                <Chip
                  label="Mood"
                  emoji={["😢","😕","😐","🙂","😊"][latestCheckin.mood] || "—"}
                />
              )}
              {latestCheckin.pain != null && (
                <Chip
                  label="Pain"
                  emoji={["😌","🤏","😐","😣","😫"][latestCheckin.pain] || "—"}
                />
              )}
              {latestCheckin.energy != null && (
                <Chip
                  label="Energy"
                  emoji={["🪫","😮‍💨","😐","⚡","🔋"][latestCheckin.energy] || "—"}
                />
              )}
            </div>
          )}
        </div>

        {/* Good Enough Mode */}
        <GoodEnoughToggle
          active={goodEnough}
          onToggle={onGoodEnoughToggle}
        />

        {/* Section cards grid */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "10px",
        }}>
          {SECTIONS.map((section) => {
            const isDone = completedSet.has(section.id);
            const color = `var(--${section.color})`;
            return (
              <button
                key={section.id}
                onClick={() => {
                  playTap();
                  navigate("/log", { state: { section: section.id } });
                }}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-start",
                  gap: "4px",
                  padding: "14px",
                  background: isDone
                    ? `color-mix(in srgb, ${color} 8%, var(--white))`
                    : "var(--white, #FFFDF8)",
                  border: isDone
                    ? `2px solid ${color}`
                    : "1.5px solid var(--tan-light, #EDE3CF)",
                  borderRadius: "16px",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  textAlign: "left",
                  WebkitTapHighlightColor: "transparent",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                {/* Completion indicator */}
                {isDone && (
                  <div style={{
                    position: "absolute",
                    top: "8px",
                    right: "8px",
                    width: "20px",
                    height: "20px",
                    borderRadius: "50%",
                    background: color,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "11px",
                  }}>
                    ✓
                  </div>
                )}

                <span style={{ fontSize: "24px", lineHeight: 1 }}>
                  {section.emoji}
                </span>
                <span style={{
                  fontFamily: "'Nunito', sans-serif",
                  fontSize: "13px",
                  fontWeight: 700,
                  color: isDone ? color : "var(--brown, #3B2F2F)",
                }}>
                  {section.label}
                </span>
                <span style={{
                  fontFamily: "'Nunito', sans-serif",
                  fontSize: "11px",
                  color: "var(--brown-light, #9A7E7E)",
                }}>
                  {isDone ? "Done ✓" : section.time}
                </span>
              </button>
            );
          })}
        </div>

        {/* Continue Logging CTA */}
        <button
          onClick={() => {
            playTap();
            // Navigate to first incomplete section
            const next = SECTIONS.find((s) => !completedSet.has(s.id));
            navigate("/log", {
              state: { section: next ? next.id : SECTIONS[0].id },
            });
          }}
          style={{
            fontFamily: "'Nunito', sans-serif",
            fontSize: "17px",
            fontWeight: 700,
            color: "var(--white, #FFFDF8)",
            background: "var(--terra, #C1724F)",
            border: "none",
            borderRadius: "16px",
            padding: "16px 24px",
            cursor: "pointer",
            transition: "all 0.2s ease",
            boxShadow: "0 4px 14px color-mix(in srgb, var(--terra) 30%, transparent)",
            WebkitTapHighlightColor: "transparent",
            width: "100%",
            marginTop: "4px",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "var(--terra-dark, #9E5A38)";
            e.currentTarget.style.transform = "scale(1.02)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "var(--terra, #C1724F)";
            e.currentTarget.style.transform = "scale(1)";
          }}
        >
          {doneSections === 0
            ? "Start Logging 🌱"
            : doneSections >= totalSections
              ? "All Done! Review 🎉"
              : "Continue Logging →"}
        </button>

        {/* Logout — subtle */}
        {user && (
          <button
            onClick={() => { playTap(); onLogout?.(); }}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              fontFamily: "'Nunito', sans-serif",
              fontSize: "12px",
              color: "var(--brown-light, #9A7E7E)",
              padding: "8px",
              margin: "0 auto",
              WebkitTapHighlightColor: "transparent",
            }}
          >
            Sign out ({user.email})
          </button>
        )}
      </main>

      <BottomNav />
    </div>
  );
}

/** Small chip for quick mood/pain/energy display */
function Chip({ label, emoji }) {
  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: "4px",
      padding: "4px 10px",
      background: "var(--cream, #FAF5EB)",
      borderRadius: "12px",
      border: "1px solid var(--tan-light, #EDE3CF)",
    }}>
      <span style={{ fontSize: "16px" }}>{emoji}</span>
      <span style={{
        fontFamily: "'Nunito', sans-serif",
        fontSize: "11px",
        fontWeight: 600,
        color: "var(--brown-light, #9A7E7E)",
      }}>
        {label}
      </span>
    </div>
  );
}