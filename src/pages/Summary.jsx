// src/pages/Summary.jsx — Rooted Health Tracker
// Summary page: week selector, stat cards, mood timeline, best/hardest day,
// flare calendar, emotion cloud, patterns, doctor export

import { useState, useMemo } from "react";
import BottomNav from "../components/BottomNav";
import MonthSwitcher from "../components/MonthSwitcher";
import { useNavigate } from "react-router-dom";
import { normalizeDay, checkinList } from "../analysis/normalize";
import { findPatterns, sentence, MIN_N } from "../analysis/patterns";

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

const MOOD_EMOJIS = ["😢", "😕", "😐", "🙂", "😊"];

/** Get average of an array of numbers, ignoring nulls */
function avg(arr) {
  const valid = arr.filter((v) => v != null);
  if (valid.length === 0) return null;
  return valid.reduce((a, b) => a + b, 0) / valid.length;
}

/** Format a number to 1 decimal */
function fmt(n) {
  if (n == null) return "—";
  return n.toFixed(1);
}

/**
 * Summary
 *
 * Props:
 *   logs       — array of log objects for the selected month
 *   loading    — boolean
 *   year, month — selected month
 *   onMonthChange — change selected month by -1 or +1
 */
export default function Summary({ logs = [], loading = false, year, month, onMonthChange, profile }) {
  const navigate = useNavigate();
  const [selectedWeek, setSelectedWeek] = useState(0); // 0=week1, 1=week2, 2=week3, 3=week4, 4=all

  const now = useMemo(() => new Date(), []);
  const totalDays = new Date(year, month + 1, 0).getDate();
  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth();
  const currentDay = isCurrentMonth ? now.getDate() : totalDays;

  // Build a map: dayOfMonth -> log
  const logMap = useMemo(() => {
    const map = {};
    logs.forEach((l) => {
      if (l.date) {
        const day = parseInt(l.date.split("-")[2], 10);
        map[day] = l;
      }
    });
    return map;
  }, [logs]);

  // Week ranges
  const weeks = useMemo(() => [
    { label: "Week 1", start: 1, end: 7 },
    { label: "Week 2", start: 8, end: 14 },
    { label: "Week 3", start: 15, end: 21 },
    { label: "Week 4", start: 22, end: totalDays },
    { label: `All ${totalDays}`, start: 1, end: totalDays },
  ], [totalDays]);

  const activeWeek = weeks[selectedWeek];

  // Filter logs for selected week
  const weekLogs = useMemo(() => {
    const result = [];
    for (let d = activeWeek.start; d <= activeWeek.end; d++) {
      if (logMap[d]) result.push({ day: d, ...logMap[d] });
    }
    return result;
  }, [logMap, activeWeek]);

  // --- Compute stats ---

  // Daily values from the shared normalizer (handles old and new answers)
  const normWeek = useMemo(() => weekLogs.map(normalizeDay), [weekLogs]);
  const moodValues = useMemo(() => normWeek.map((d) => d.mood), [normWeek]);
  const painValues = useMemo(() => normWeek.map((d) => d.painStop), [normWeek]);
  const energyValues = useMemo(() => normWeek.map((d) => d.activation), [normWeek]);

  const flareDays = useMemo(() =>
    weekLogs.filter((l) => l.eds?.flareDay === true).length,
    [weekLogs]
  );

  const avgMood = avg(moodValues);
  const avgPain = avg(painValues);
  const avgEnergy = avg(energyValues);

  // Best and hardest day
  const bestDay = useMemo(() => {
    let best = null;
    let bestScore = -1;
    weekLogs.forEach((l, i) => {
      const m = moodValues[i];
      if (m != null && m > bestScore) {
        bestScore = m;
        best = l;
      }
    });
    return best;
  }, [weekLogs, moodValues]);

  const hardestDay = useMemo(() => {
    let worst = null;
    let worstScore = 999;
    weekLogs.forEach((l, i) => {
      const m = moodValues[i];
      if (m != null && m < worstScore) {
        worstScore = m;
        worst = l;
      }
    });
    return worst;
  }, [weekLogs, moodValues]);

  // Emotion frequency
  const emotionCounts = useMemo(() => {
    const counts = {};
    logs.forEach((l) => {
      const emotions = [l.mood?.emotion, ...checkinList(l).map((c) => c.emotion)].filter(Boolean);
      emotions.forEach((emotion) => {
        counts[emotion] = (counts[emotion] || 0) + 1;
      });
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
  }, [logs]);



  // --- Render ---

  if (loading) {
    return (
      <div style={{
        minHeight: "100vh",
        background: "var(--cream, #FAF5EB)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        paddingBottom: "80px",
      }}>
        <span style={{
          fontFamily: "'Nunito', sans-serif",
          fontSize: "16px",
          color: "var(--brown-light, #9A7E7E)",
        }}>
          Loading your data... 🌱
        </span>
        <BottomNav />
      </div>
    );
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "var(--cream, #FAF5EB)",
      paddingBottom: "90px",
    }}>
      {/* Header */}
      <header style={{
        padding: "16px 20px 12px",
      }}>
        <h1 style={{
          fontFamily: "'Fraunces', serif",
          fontSize: "24px",
          fontWeight: 700,
          color: "var(--brown, #3B2F2F)",
          margin: "0 0 2px 0",
        }}>
          📊 Summary
        </h1>
        <p style={{
          fontFamily: "'Nunito', sans-serif",
          fontSize: "13px",
          color: "var(--brown-light, #9A7E7E)",
          margin: 0,
        }}>
          {logs.length} days logged
        </p>
        <MonthSwitcher year={year} month={month} onMonthChange={onMonthChange} />
      </header>

      <main style={{
        padding: "0 16px 20px",
        display: "flex",
        flexDirection: "column",
        gap: "16px",
      }}>
        {/* Week selector */}
        <div style={{
          display: "flex",
          gap: "6px",
          overflowX: "auto",
          WebkitOverflowScrolling: "touch",
          scrollbarWidth: "none",
        }}>
          {weeks.map((w, i) => {
            const isActive = selectedWeek === i;
            return (
              <button
                key={i}
                onClick={() => { playTap(); setSelectedWeek(i); }}
                style={{
                  padding: "8px 14px",
                  border: isActive
                    ? "2px solid var(--terra, #C1724F)"
                    : "1.5px solid var(--tan-light, #EDE3CF)",
                  borderRadius: "20px",
                  background: isActive
                    ? "color-mix(in srgb, var(--terra) 10%, var(--white))"
                    : "var(--white, #FFFDF8)",
                  cursor: "pointer",
                  fontFamily: "'Nunito', sans-serif",
                  fontSize: "13px",
                  fontWeight: isActive ? 700 : 500,
                  color: isActive ? "var(--terra, #C1724F)" : "var(--brown-light, #9A7E7E)",
                  whiteSpace: "nowrap",
                  transition: "all 0.2s ease",
                  WebkitTapHighlightColor: "transparent",
                  flexShrink: 0,
                }}
              >
                {w.label}
              </button>
            );
          })}
        </div>

        {/* Stat cards */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "10px",
        }}>
          <StatCard
            label="Avg Mood"
            value={avgMood != null ? MOOD_EMOJIS[Math.round(avgMood)] : "—"}
            sub={fmt(avgMood)}
            color="mauve"
          />
          <StatCard
            label="Pain in the way"
            value={avgPain != null ? ["None", "", "Slowing", "", "Stopping"][Math.round(avgPain)] || fmt(avgPain) : "—"}
            sub={avgPain != null ? `${fmt(avgPain)} of 4` : "no data"}
            color="terra"
          />
          <StatCard
            label="Activation"
            value={avgEnergy != null ? ["🛌", "🐢", "🙂", "⚡", "🌪️"][Math.round(avgEnergy)] : "—"}
            sub={avgEnergy != null ? `${fmt(avgEnergy)} · 2 = normal` : "no data"}
            color="gold"
          />
          <StatCard
            label="Flare Days"
            value={flareDays}
            sub={`of ${weekLogs.length} days`}
            color="amber"
          />
        </div>

        {/* Mood timeline */}
        <div style={{
          background: "var(--white, #FFFDF8)",
          borderRadius: "20px",
          border: "1.5px solid var(--tan-light, #EDE3CF)",
          padding: "16px",
        }}>
          <h3 style={{
            fontFamily: "'Fraunces', serif",
            fontSize: "16px",
            fontWeight: 700,
            color: "var(--brown, #3B2F2F)",
            margin: "0 0 12px 0",
          }}>
            Mood Timeline
          </h3>
          <div style={{
            display: "flex",
            gap: "4px",
            justifyContent: "center",
            flexWrap: "wrap",
          }}>
            {Array.from(
              { length: activeWeek.end - activeWeek.start + 1 },
              (_, i) => {
                const day = activeWeek.start + i;
                const log = logMap[day];
                const normMood = log ? normalizeDay(log).mood : null;
                const mood = normMood == null ? undefined : Math.round(normMood);
                const isFuture = isCurrentMonth && day > currentDay;

                return (
                  <div
                    key={day}
                    title={`Day ${day}${mood != null ? ` — ${MOOD_EMOJIS[mood]}` : ""}`}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: "2px",
                      minWidth: "32px",
                      opacity: isFuture ? 0.35 : 1,
                    }}
                  >
                    <span style={{
                      fontSize: "20px",
                      lineHeight: 1,
                      filter: mood == null ? "grayscale(100%)" : "none",
                    }}>
                      {mood != null ? MOOD_EMOJIS[mood] : "·"}
                    </span>
                    <span style={{
                      fontFamily: "'Nunito', sans-serif",
                      fontSize: "10px",
                      color: "var(--brown-light, #9A7E7E)",
                    }}>
                      {day}
                    </span>
                  </div>
                );
              }
            )}
          </div>
        </div>

        {/* Best / Hardest day */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "10px",
        }}>
          <DayCard
            label="Best day"
            emoji="☀️"
            log={bestDay}
            color="sage"
          />
          <DayCard
            label="Hardest day"
            emoji="🌧️"
            log={hardestDay}
            color="terra"
          />
        </div>

        {/* Flare calendar */}
        <div style={{
          background: "var(--white, #FFFDF8)",
          borderRadius: "20px",
          border: "1.5px solid var(--tan-light, #EDE3CF)",
          padding: "16px",
        }}>
          <h3 style={{
            fontFamily: "'Fraunces', serif",
            fontSize: "16px",
            fontWeight: 700,
            color: "var(--brown, #3B2F2F)",
            margin: "0 0 12px 0",
          }}>
            Flare Calendar
          </h3>
          <div style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "5px",
            justifyContent: "center",
          }}>
            {Array.from({ length: totalDays }, (_, i) => {
              const day = i + 1;
              const log = logMap[day];
              const isFlare = log?.eds?.flareDay === true;
              const isLogged = !!log;
              const isToday = isCurrentMonth && day === currentDay;
              const isFuture = isCurrentMonth && day > currentDay;

              return (
                <div
                  key={day}
                  title={`Day ${day}${isFlare ? " — Flare" : isLogged ? " — Logged" : ""}`}
                  style={{
                    width: "18px",
                    height: "18px",
                    borderRadius: "4px",
                    background: isFlare
                      ? "var(--terra, #C1724F)"
                      : isLogged
                        ? "var(--sage, #7D9B76)"
                        : isFuture
                          ? "var(--tan-light, #EDE3CF)"
                          : "var(--tan, #D4C5A9)",
                    border: isToday
                      ? "2.5px solid var(--brown, #3B2F2F)"
                      : "2px solid transparent",
                    opacity: isFuture ? 0.4 : 1,
                    transition: "all 0.2s ease",
                  }}
                />
              );
            })}
          </div>
          {/* Legend */}
          <div style={{
            display: "flex",
            gap: "12px",
            justifyContent: "center",
            marginTop: "10px",
          }}>
            <LegendItem color="var(--terra)" label="Flare" />
            <LegendItem color="var(--sage)" label="Logged" />
            <LegendItem color="var(--tan)" label="Missed" />
          </div>
        </div>

        {/* Most common emotions */}
        {emotionCounts.length > 0 && (
          <div style={{
            background: "var(--white, #FFFDF8)",
            borderRadius: "20px",
            border: "1.5px solid var(--tan-light, #EDE3CF)",
            padding: "16px",
          }}>
            <h3 style={{
              fontFamily: "'Fraunces', serif",
              fontSize: "16px",
              fontWeight: 700,
              color: "var(--brown, #3B2F2F)",
              margin: "0 0 12px 0",
            }}>
              Most Common Emotions
            </h3>
            <div style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "6px",
              justifyContent: "center",
            }}>
              {emotionCounts.map(([emotion, count]) => {
                const maxCount = emotionCounts[0][1];
                const scale = 0.7 + (count / maxCount) * 0.3;
                return (
                  <span
                    key={emotion}
                    style={{
                      padding: "5px 12px",
                      background: "color-mix(in srgb, var(--mauve, #A07B8A) 10%, var(--cream))",
                      border: "1.5px solid var(--mauve, #A07B8A)",
                      borderRadius: "16px",
                      fontFamily: "'Nunito', sans-serif",
                      fontSize: `${Math.round(12 * scale)}px`,
                      fontWeight: 600,
                      color: "var(--mauve-dark, #7A5568)",
                      opacity: 0.6 + (count / maxCount) * 0.4,
                    }}
                  >
                    {emotion} ({count})
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {/* Patterns detected */}
        <PatternsCard logs={logs} profile={profile} />

        {/* Doctor report lives on the Export page */}
        <button
          onClick={() => { playTap(); navigate("/export"); }}
          style={{
            fontFamily: "'Nunito', sans-serif", fontSize: "15px", fontWeight: 700, color: "var(--white)",
            background: "var(--teal)", border: "none", borderRadius: "14px", padding: "13px 18px", cursor: "pointer",
          }}
        >
          🩺 Make a doctor report →
        </button>
      </main>

      <BottomNav />
    </div>
  );
}

/* ---- Sub-components ---- */

function StatCard({ label, value, sub, color }) {
  return (
    <div style={{
      background: "var(--white, #FFFDF8)",
      borderRadius: "16px",
      border: `1.5px solid var(--${color}, var(--tan-light))`,
      padding: "14px",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: "2px",
    }}>
      <span style={{
        fontSize: typeof value === "number" ? "28px" : "32px",
        lineHeight: 1,
        fontFamily: typeof value === "number" ? "'Fraunces', serif" : undefined,
        fontWeight: typeof value === "number" ? 700 : undefined,
        color: typeof value === "number" ? `var(--${color})` : undefined,
      }}>
        {value}
      </span>
      {sub && (
        <span style={{
          fontFamily: "'Nunito', sans-serif",
          fontSize: "12px",
          color: "var(--brown-light, #9A7E7E)",
        }}>
          {sub}
        </span>
      )}
      <span style={{
        fontFamily: "'Nunito', sans-serif",
        fontSize: "11px",
        fontWeight: 600,
        color: `var(--${color})`,
        textTransform: "uppercase",
        letterSpacing: "0.04em",
        marginTop: "2px",
      }}>
        {label}
      </span>
    </div>
  );
}

function DayCard({ label, emoji, log, color }) {
  const day = log?.date ? parseInt(log.date.split("-")[2], 10) : null;
  return (
    <div style={{
      background: "var(--white, #FFFDF8)",
      borderRadius: "16px",
      border: `1.5px solid var(--${color})`,
      padding: "14px",
      display: "flex",
      flexDirection: "column",
      gap: "4px",
    }}>
      <span style={{
        fontFamily: "'Nunito', sans-serif",
        fontSize: "12px",
        fontWeight: 600,
        color: `var(--${color})`,
        textTransform: "uppercase",
        letterSpacing: "0.04em",
      }}>
        {emoji} {label}
      </span>
      {day ? (
        <>
          <span style={{
            fontFamily: "'Fraunces', serif",
            fontSize: "18px",
            fontWeight: 700,
            color: "var(--brown, #3B2F2F)",
          }}>
            Day {day}
          </span>
          {log.mood?.emotion && (
            <span style={{
              fontFamily: "'Nunito', sans-serif",
              fontSize: "12px",
              color: "var(--brown-light, #9A7E7E)",
            }}>
              Feeling: {log.mood.emotion}
            </span>
          )}
        </>
      ) : (
        <span style={{
          fontFamily: "'Nunito', sans-serif",
          fontSize: "13px",
          color: "var(--brown-light, #9A7E7E)",
        }}>
          Not enough data yet
        </span>
      )}
    </div>
  );
}

function LegendItem({ color, label }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
      <div style={{
        width: "10px",
        height: "10px",
        borderRadius: "3px",
        background: color,
      }} />
      <span style={{
        fontFamily: "'Nunito', sans-serif",
        fontSize: "11px",
        color: "var(--brown-light, #9A7E7E)",
      }}>
        {label}
      </span>
    </div>
  );
}

function PatternsCard({ logs, profile }) {
  const result = useMemo(
    () => findPatterns(logs.map(normalizeDay), { cycleTracking: Boolean(profile?.cycleTracking) }),
    [logs, profile]
  );
  const card = {
    background: "var(--white, #FFFDF8)",
    borderRadius: "20px",
    border: "1.5px solid var(--tan-light, #EDE3CF)",
    padding: "16px",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  };
  const h = { fontFamily: "'Fraunces', serif", fontSize: "16px", fontWeight: 700, color: "var(--brown, #3B2F2F)", margin: 0 };
  const p = { fontFamily: "'Nunito', sans-serif", fontSize: "13px", color: "var(--brown, #3B2F2F)", margin: 0, lineHeight: 1.5 };

  return (
    <div style={card}>
      <h3 style={h}>🔍 Patterns this month</h3>
      {result.top.length > 0 ? (
        result.top.map((r) => (
          <p key={r.id} style={{ ...p, padding: "8px 10px", background: "var(--cream)", borderRadius: "10px" }}>{sentence(r)}</p>
        ))
      ) : (
        <p style={{ ...p, color: "var(--brown-light)" }}>
          {result.testedCount
            ? "Nothing stands out yet. That's useful to know too."
            : `Keep logging — each comparison needs at least ${MIN_N} days on both sides before it shows up here.`}
        </p>
      )}
      <p style={{ ...p, fontSize: "11px", color: "var(--brown-light)" }}>
        These are things that happened together, not proof one caused the other.
      </p>
    </div>
  );
}
