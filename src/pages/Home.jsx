// src/pages/Home.jsx — Rooted Health Tracker
// Home screen: greeting, garden, today's progress, section cards, CTA

import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Garden from "../components/Garden.jsx";
import BottomNav from "../components/BottomNav";

import { sectionsFor, MOOD_OPTIONS, ACTIVATION_OPTIONS, BODY_OPTIONS, QUESTION_INDEX } from "../questions";
import { screenerDue, currentSickEpisode, startSick, endSick, lookbackDue } from "../profile";

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
 *   mode           — "full" | "good" | "bare" (today's logging mode)
 *   onModeChange   — (mode) => void
 *   onBareSave     — ({ mood, body, mind, sleepHours, meds }) => Promise<boolean>
 *   onLogout       — () => void
 */
export default function Home({
  user,
  log = {},
  completedSections = [],
  loggedDays = [],
  mode = "full",
  onModeChange,
  onBareSave,
  onLogout,
  profile,
  onUpdateProfile,
}) {
  const goodEnough = mode === "good";
  const SECTIONS = sectionsFor(goodEnough, profile);
  const navigate = useNavigate();
  const [greeting] = useState(getGreeting);
  const [encouragement] = useState(getEncouragement);

  const completedSet = useMemo(
    () => new Set(completedSections),
    [completedSections]
  );

  const totalSections = SECTIONS.length;
  const doneSections = SECTIONS.filter((s) => completedSet.has(s.id)).length;
  const progressPct = totalSections > 0 ? Math.round((doneSections / totalSections) * 100) : 0;

  // Quick chips from today's mood/pain/energy (from check-ins or mood section)
  const checkinList = Array.isArray(log.checkins) ? log.checkins : log.checkins?.checkins || [];
  const latestCheckin = checkinList.length > 0 ? checkinList[checkinList.length - 1] : null;
  const dueScreener = screenerDue(profile);

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

          {/* Quick chips — latest check-in */}
          {latestCheckin && (
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              {MOOD_OPTIONS.find((m) => m.id === latestCheckin.mood) && (
                <Chip label="Mood" emoji={MOOD_OPTIONS.find((m) => m.id === latestCheckin.mood).emoji} />
              )}
              {BODY_OPTIONS.find((m) => m.id === latestCheckin.body) && (
                <Chip label="Body" emoji={BODY_OPTIONS.find((m) => m.id === latestCheckin.body).emoji} />
              )}
              {ACTIVATION_OPTIONS.find((m) => m.id === latestCheckin.activation) && (
                <Chip label="Mind" emoji={ACTIVATION_OPTIONS.find((m) => m.id === latestCheckin.activation).emoji} />
              )}
            </div>
          )}
        </div>

        <SickToggle profile={profile} onUpdateProfile={onUpdateProfile} />

        {/* Weekly look-back */}
        {lookbackDue(profile) && (
          <button
            onClick={() => { playTap(); navigate("/lookback"); }}
            style={{
              display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "2px",
              padding: "14px 16px", background: "var(--white)", border: "2px dashed var(--sage)",
              borderRadius: "16px", cursor: "pointer", textAlign: "left", fontFamily: "'Nunito', sans-serif",
            }}
          >
            <span style={{ fontSize: "15px", fontWeight: 700, color: "var(--sage-dark)" }}>🔭 Look back at last week</span>
            <span style={{ fontSize: "12px", color: "var(--brown-light)" }}>3 quick questions · about 20 seconds</span>
          </button>
        )}

        {/* 2-week check (PHQ-9 / GAD-7) */}
        {dueScreener && (
          <button
            onClick={() => { playTap(); navigate("/screeners"); }}
            style={{
              display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "2px",
              padding: "14px 16px", background: "var(--white)", border: "2px dashed var(--mauve)",
              borderRadius: "16px", cursor: "pointer", textAlign: "left", fontFamily: "'Nunito', sans-serif",
            }}
          >
            <span style={{ fontSize: "15px", fontWeight: 700, color: "var(--mauve-dark)" }}>🗓️ 2-week check is ready</span>
            <span style={{ fontSize: "12px", color: "var(--brown-light)" }}>16 quick questions · about 2 minutes</span>
          </button>
        )}

        {/* Logging mode for today */}
        <ModePicker mode={mode} onChange={onModeChange} />

        {mode === "bare" && <BareMinimum onSave={onBareSave} />}

        {mode !== "bare" && (
          <>
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

          </>
        )}

        <button
          onClick={() => { playTap(); navigate("/settings"); }}
          style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "'Nunito', sans-serif", fontSize: "14px", fontWeight: 700, color: "var(--mauve-dark)", padding: "8px", margin: "0 auto" }}
        >
          ⚙️ Settings — meds, period tracking, support contact
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
            Sign out ({user.isGuest ? "Guest" : user.email})
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
/** Sick / injured: stays on until switched off, like a period. */
function SickToggle({ profile, onUpdateProfile }) {
  const [picking, setPicking] = useState(false);
  const [start, setStart] = useState("");
  const open = currentSickEpisode(profile);
  const font = "'Nunito', sans-serif";
  const box = { display: "flex", flexDirection: "column", gap: "8px", padding: "12px 14px", background: "var(--white)", border: "1.5px solid var(--tan-light)", borderRadius: "16px", fontFamily: font };
  const btn = (primary) => ({ fontFamily: font, fontSize: "13px", fontWeight: 700, padding: "8px 12px", borderRadius: "10px", cursor: "pointer", border: primary ? "none" : "1.5px solid var(--tan-light)", background: primary ? "var(--teal)" : "var(--white)", color: primary ? "var(--white)" : "var(--brown)" });

  if (open) {
    const since = new Date(`${open.start}T12:00:00`).toLocaleDateString(undefined, { month: "short", day: "numeric" });
    return (
      <div style={{ ...box, borderColor: "var(--teal)" }}>
        <span style={{ fontSize: "14px", fontWeight: 700, color: "var(--teal-dark)" }}>🤒 Sick or injured since {since}</span>
        <div><button type="button" style={btn(true)} onClick={() => { playTap(); onUpdateProfile?.({ sickEpisodes: endSick(profile) }); }}>Feeling better today</button></div>
      </div>
    );
  }
  if (picking) {
    return (
      <div style={box}>
        <span style={{ fontSize: "14px", fontWeight: 700, color: "var(--brown)" }}>🤒 When did it start?</span>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
          <button type="button" style={btn(true)} onClick={() => { playTap(); onUpdateProfile?.({ sickEpisodes: startSick(profile) }); setPicking(false); }}>Today</button>
          <input type="date" value={start} max={new Date().toISOString().slice(0, 10)} onChange={(e) => setStart(e.target.value)} aria-label="Started on" style={{ fontFamily: font, fontSize: "13px", padding: "6px 8px", border: "1.5px solid var(--tan)", borderRadius: "10px" }} />
          {start && <button type="button" style={btn(false)} onClick={() => { playTap(); onUpdateProfile?.({ sickEpisodes: startSick(profile, start) }); setPicking(false); }}>Use this date</button>}
          <button type="button" style={{ ...btn(false), border: "none", color: "var(--brown-light)" }} onClick={() => setPicking(false)}>Cancel</button>
        </div>
      </div>
    );
  }
  return (
    <button type="button" onClick={() => { playTap(); setPicking(true); }} style={{ ...box, flexDirection: "row", alignItems: "center", cursor: "pointer", textAlign: "left" }}>
      <span style={{ fontSize: "14px", fontWeight: 700, color: "var(--brown)" }}>🤒 Sick or injured?</span>
      <span style={{ fontSize: "12px", color: "var(--brown-light)" }}>Turn on until you feel better</span>
    </button>
  );
}

const MODES = [
  { id: "full", label: "Full", sub: "everything" },
  { id: "good", label: "Good Enough", sub: "~1 min" },
  { id: "bare", label: "Bare minimum", sub: "4 taps" },
];

/** Today's logging mode. Resets to the Settings default each morning. */
function ModePicker({ mode, onChange }) {
  const font = "'Nunito', sans-serif";
  return (
    <div role="radiogroup" aria-label="Logging mode for today" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px" }}>
      {MODES.map((m) => {
        const sel = mode === m.id;
        return (
          <button key={m.id} type="button" role="radio" aria-checked={sel} onClick={() => { playTap(); onChange?.(m.id); }}
            style={{
              display: "flex", flexDirection: "column", alignItems: "center", gap: "1px", padding: "10px 4px", cursor: "pointer",
              borderRadius: "14px", fontFamily: font,
              border: sel ? "2px solid var(--sage)" : "1.5px solid var(--tan-light)",
              background: sel ? "color-mix(in srgb, var(--sage) 12%, var(--white))" : "var(--white)",
            }}>
            <span style={{ fontSize: "13px", fontWeight: 800, color: sel ? "var(--sage-dark)" : "var(--brown)" }}>{m.label}</span>
            <span style={{ fontSize: "11px", color: "var(--brown-light)" }}>{m.sub}</span>
          </button>
        );
      })}
    </div>
  );
}

const SHORT_BODY = ["Heavy", "Slow", "Usual", "Energy", "Restless"];
const SHORT_MIND = ["Foggy", "Slow", "Usual", "Busy", "Racing"];

/** "I really don't want to log, but I will": one screen, four questions. */
function BareMinimum({ onSave }) {
  const [v, setV] = useState({});
  const [status, setStatus] = useState(null); // null | "saving" | "saved" | "error"
  const font = "'Nunito', sans-serif";
  const set = (k, val) => setV((cur) => ({ ...cur, [k]: cur[k] === val ? undefined : val }));
  const any = Object.values(v).some(Boolean);
  const hours = QUESTION_INDEX["sleep.sleepHours"].options;
  const label = { fontFamily: font, fontSize: "14px", fontWeight: 700, color: "var(--brown)", margin: "0 0 6px" };
  const tap = (sel) => ({
    flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "2px", padding: "7px 2px", cursor: "pointer",
    borderRadius: "12px", fontFamily: font, fontSize: "11px", fontWeight: sel ? 800 : 600,
    color: sel ? "var(--sage-dark)" : "var(--brown-light)",
    border: sel ? "2px solid var(--sage)" : "1.5px solid transparent",
    background: sel ? "color-mix(in srgb, var(--sage) 12%, var(--white))" : "transparent",
  });
  const chip = (sel) => ({
    fontFamily: font, fontSize: "13px", fontWeight: sel ? 800 : 600, padding: "8px 12px", borderRadius: "999px", cursor: "pointer",
    color: sel ? "var(--sage-dark)" : "var(--brown)",
    border: sel ? "2px solid var(--sage)" : "1.5px solid var(--tan-light)",
    background: sel ? "color-mix(in srgb, var(--sage) 12%, var(--white))" : "var(--white)",
  });
  const row = (opts, key, short) => (
    <div style={{ display: "flex", gap: "2px" }}>
      {opts.map((o, i) => (
        <button key={o.id} type="button" aria-pressed={v[key] === o.id} aria-label={o.label} onClick={() => { playTap(); set(key, o.id); }} style={tap(v[key] === o.id)}>
          <span style={{ fontSize: "22px", lineHeight: 1 }}>{o.emoji}</span>
          {short ? short[i] : o.label}
        </button>
      ))}
    </div>
  );

  if (status === "saved") {
    return (
      <div style={{ padding: "18px", background: "var(--white)", borderRadius: "20px", border: "2px solid var(--sage)", textAlign: "center", fontFamily: font }}>
        <div style={{ fontSize: "28px" }}>🌱</div>
        <p style={{ fontSize: "15px", fontWeight: 800, color: "var(--sage-dark)", margin: "4px 0" }}>Logged. That counts.</p>
        <button type="button" onClick={() => { setV({}); setStatus(null); }} style={{ background: "none", border: "none", fontFamily: font, fontSize: "12px", color: "var(--brown-light)", textDecoration: "underline", cursor: "pointer" }}>
          Log again
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px", padding: "18px", background: "var(--white)", borderRadius: "20px", border: "2px solid var(--sage)" }}>
      <div>
        <p style={label}>Mood</p>
        {row(MOOD_OPTIONS, "mood")}
      </div>
      <div>
        <p style={label}>Body · Mind</p>
        {row(BODY_OPTIONS, "body", SHORT_BODY)}
        <div style={{ height: "6px" }} />
        {row(ACTIVATION_OPTIONS, "mind", SHORT_MIND)}
      </div>
      <div>
        <p style={label}>Sleep</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
          {hours.map((h) => <button key={h.id} type="button" aria-pressed={v.sleepHours === h.id} onClick={() => { playTap(); set("sleepHours", h.id); }} style={chip(v.sleepHours === h.id)}>{h.label}</button>)}
        </div>
      </div>
      <div>
        <p style={label}>Meds</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
          {[["onTime", "Took them"], ["missed", "Missed some"], ["none", "No meds"]].map(([id, l]) => (
            <button key={id} type="button" aria-pressed={v.meds === id} onClick={() => { playTap(); set("meds", id); }} style={chip(v.meds === id)}>{l}</button>
          ))}
        </div>
      </div>
      {status === "error" && <p role="alert" style={{ fontFamily: font, fontSize: "13px", fontWeight: 700, color: "var(--terra-dark)", margin: 0 }}>That didn't save — try again.</p>}
      <button type="button" disabled={!any || status === "saving"}
        onClick={async () => { setStatus("saving"); setStatus((await onSave?.(v)) ? "saved" : "error"); }}
        style={{ fontFamily: font, fontSize: "15px", fontWeight: 800, padding: "13px", borderRadius: "14px", border: "none", cursor: any ? "pointer" : "not-allowed", color: any ? "var(--white)" : "var(--brown-light)", background: any ? "var(--sage)" : "var(--tan-light)" }}>
        {status === "saving" ? "Saving…" : "Save"}
      </button>
    </div>
  );
}
