// src/pages/Summary.jsx — Rooted Health Tracker
// Summary page: week selector, stat cards, mood timeline, best/hardest day,
// flare calendar, emotion cloud, patterns, doctor export

import { useState, useMemo, useCallback } from "react";
import BottomNav from "../components/BottomNav";

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
const PAIN_EMOJIS = ["😌", "🤏", "😐", "😣", "😫"];
const ENERGY_EMOJIS = ["🪫", "😮‍💨", "😐", "⚡", "🔋"];

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
 *   logs       — array of log objects for the current month
 *   loading    — boolean
 */
export default function Summary({ logs = [], loading = false }) {
  const [selectedWeek, setSelectedWeek] = useState(0); // 0=week1, 1=week2, 2=week3, 3=week4, 4=all

  const now = useMemo(() => new Date(), []);
  const currentDay = now.getDate();
  const totalDays = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const monthName = now.toLocaleString("default", { month: "long", year: "numeric" });

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

  // Extract mood/pain/energy from check-ins or mood section
  const moodValues = useMemo(() =>
    weekLogs.map((l) => {
      if (l.mood?.overallMood != null) return l.mood.overallMood;
      const cis = l.checkins?.checkins || l.checkins || [];
      if (Array.isArray(cis) && cis.length > 0) {
        const last = cis[cis.length - 1];
        return last.mood ?? null;
      }
      return null;
    }), [weekLogs]);

  const painValues = useMemo(() =>
    weekLogs.map((l) => {
      const cis = l.checkins?.checkins || l.checkins || [];
      if (Array.isArray(cis) && cis.length > 0) {
        const last = cis[cis.length - 1];
        return last.pain ?? null;
      }
      return null;
    }), [weekLogs]);

  const energyValues = useMemo(() =>
    weekLogs.map((l) => {
      const cis = l.checkins?.checkins || l.checkins || [];
      if (Array.isArray(cis) && cis.length > 0) {
        const last = cis[cis.length - 1];
        return last.energy ?? null;
      }
      return null;
    }), [weekLogs]);

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
      const emotion = l.mood?.emotion;
      if (emotion) {
        counts[emotion] = (counts[emotion] || 0) + 1;
      }
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
  }, [logs]);

  // --- Doctor export ---
  const generateExportText = useCallback(() => {
    const lines = [
      `ROOTED Health Summary — ${monthName}`,
      `Generated: ${now.toLocaleDateString()}`,
      "",
      `Days logged: ${logs.length} / ${totalDays}`,
      `Average Mood: ${fmt(avg(logs.map((l) => l.mood?.overallMood).filter(Boolean)))} / 4`,
      `Flare days: ${logs.filter((l) => l.eds?.flareDay).length}`,
      "",
      "--- Daily Breakdown ---",
    ];

    logs.forEach((l) => {
      const cis = l.checkins?.checkins || l.checkins || [];
      const lastCi = Array.isArray(cis) && cis.length > 0 ? cis[cis.length - 1] : {};
      lines.push("");
      lines.push(`Date: ${l.date}`);
      if (l.mood?.overallMood != null) lines.push(`  Mood: ${MOOD_EMOJIS[l.mood.overallMood]} (${l.mood.overallMood}/4)`);
      if (l.mood?.emotion) lines.push(`  Emotion: ${l.mood.emotionPath || l.mood.emotion}`);
      if (lastCi.pain != null) lines.push(`  Pain: ${PAIN_EMOJIS[lastCi.pain]} (${lastCi.pain}/4)`);
      if (lastCi.energy != null) lines.push(`  Energy: ${ENERGY_EMOJIS[lastCi.energy]} (${lastCi.energy}/4)`);
      if (l.eds?.flareDay) lines.push("  ⚠️ FLARE DAY");
      if (l.eds?.activityTolerance) lines.push(`  Activity: ${l.eds.activityTolerance}`);
      if (l.pots?.heartRate) lines.push(`  HR standing: ${l.pots.heartRate} bpm`);
      if (l.symptoms?.fatigue != null) lines.push(`  Fatigue: ${l.symptoms.fatigue}/4`);
    });

    return lines.join("\n");
  }, [logs, monthName, totalDays, now]);

  const handleCopy = useCallback(() => {
    const text = generateExportText();
    navigator.clipboard.writeText(text).catch(() => {});
    playTap();
  }, [generateExportText]);

  const handleCSV = useCallback(() => {
    const headers = ["Date", "Mood", "Emotion", "Pain", "Energy", "Fatigue", "Flare", "Activity", "HR Standing"];
    const rows = logs.map((l) => {
      const cis = l.checkins?.checkins || l.checkins || [];
      const lastCi = Array.isArray(cis) && cis.length > 0 ? cis[cis.length - 1] : {};
      return [
        l.date || "",
        l.mood?.overallMood ?? "",
        l.mood?.emotion || "",
        lastCi.pain ?? "",
        lastCi.energy ?? "",
        l.symptoms?.fatigue ?? "",
        l.eds?.flareDay ? "YES" : "",
        l.eds?.activityTolerance || "",
        l.pots?.heartRate || "",
      ].join(",");
    });

    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `rooted-export-${now.toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    playTap();
  }, [logs, now]);

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
          {monthName} · {logs.length} days logged
        </p>
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
            label="Avg Pain"
            value={avgPain != null ? PAIN_EMOJIS[Math.round(avgPain)] : "—"}
            sub={fmt(avgPain)}
            color="terra"
          />
          <StatCard
            label="Avg Energy"
            value={avgEnergy != null ? ENERGY_EMOJIS[Math.round(avgEnergy)] : "—"}
            sub={fmt(avgEnergy)}
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
                const mood = log?.mood?.overallMood;
                const isFuture = day > currentDay;

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
              const isToday = day === currentDay;
              const isFuture = day > currentDay;

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
        <PatternsCard logs={logs} />

        {/* Doctor export */}
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
            margin: "0 0 4px 0",
          }}>
            🩺 Doctor Export
          </h3>
          <p style={{
            fontFamily: "'Nunito', sans-serif",
            fontSize: "13px",
            color: "var(--brown-light, #9A7E7E)",
            margin: "0 0 12px 0",
          }}>
            Share a plain-text summary or CSV with your doctor
          </p>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <button
              onClick={handleCopy}
              style={{
                fontFamily: "'Nunito', sans-serif",
                fontSize: "14px",
                fontWeight: 700,
                color: "var(--white, #FFFDF8)",
                background: "var(--teal, #5A9099)",
                border: "none",
                borderRadius: "12px",
                padding: "10px 18px",
                cursor: "pointer",
                transition: "all 0.2s ease",
                WebkitTapHighlightColor: "transparent",
              }}
            >
              📋 Copy Summary
            </button>
            <button
              onClick={handleCSV}
              style={{
                fontFamily: "'Nunito', sans-serif",
                fontSize: "14px",
                fontWeight: 700,
                color: "var(--teal, #5A9099)",
                background: "var(--white, #FFFDF8)",
                border: "2px solid var(--teal, #5A9099)",
                borderRadius: "12px",
                padding: "10px 18px",
                cursor: "pointer",
                transition: "all 0.2s ease",
                WebkitTapHighlightColor: "transparent",
              }}
            >
              📥 Download CSV
            </button>
          </div>
        </div>
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

function PatternsCard({ logs }) {
  const patterns = useMemo(() => {
    const found = [];
    if (logs.length < 3) return found;

    // Sleep quality vs mood
    const sleepMoodPairs = logs
      .filter((l) => l.sleep?.quality != null && l.mood?.overallMood != null)
      .map((l) => ({ sleep: l.sleep.quality, mood: l.mood.overallMood }));

    if (sleepMoodPairs.length >= 3) {
      const goodSleep = sleepMoodPairs.filter((p) => p.sleep >= 3);
      const badSleep = sleepMoodPairs.filter((p) => p.sleep <= 1);
      const goodSleepAvgMood = avg(goodSleep.map((p) => p.mood));
      const badSleepAvgMood = avg(badSleep.map((p) => p.mood));

      if (goodSleepAvgMood != null && badSleepAvgMood != null && goodSleepAvgMood - badSleepAvgMood > 0.8) {
        found.push({
          emoji: "😴→😊",
          text: "Better sleep tends to mean better mood for you",
        });
      }
    }

    // Flare days vs activity
    const flareLogs = logs.filter((l) => l.eds?.flareDay);
    if (flareLogs.length >= 2) {
      const flareWithReduced = flareLogs.filter(
        (l) => l.eds?.activityTolerance === "veryLimited" || l.eds?.activityTolerance === "bedbound"
      );
      if (flareWithReduced.length > flareLogs.length * 0.5) {
        found.push({
          emoji: "🔥→🛏️",
          text: "Flare days often come with very limited activity",
        });
      }
    }

    // Salt intake vs dizziness
    const saltDizzPairs = logs
      .filter((l) => l.nutrition?.salt && l.pots?.dizziness != null)
      .map((l) => ({ salt: l.nutrition.salt, dizzy: l.pots.dizziness }));

    if (saltDizzPairs.length >= 3) {
      const lowSaltDizzy = saltDizzPairs.filter((p) => p.salt === "low" && p.dizzy === true);
      if (lowSaltDizzy.length >= 2) {
        found.push({
          emoji: "🧂→😵‍💫",
          text: "Low salt days seem to correlate with dizziness",
        });
      }
    }

    // Anxiety trend
    const anxietyVals = logs
      .filter((l) => l.mood?.anxiety != null)
      .map((l) => l.mood.anxiety);
    if (anxietyVals.length >= 5) {
      const recent = anxietyVals.slice(-3);
      const earlier = anxietyVals.slice(0, -3);
      const recentAvg = avg(recent);
      const earlierAvg = avg(earlier);
      if (recentAvg != null && earlierAvg != null) {
        if (recentAvg > earlierAvg + 0.5) {
          found.push({
            emoji: "📈😰",
            text: "Anxiety has been trending up recently",
          });
        } else if (recentAvg < earlierAvg - 0.5) {
          found.push({
            emoji: "📉😌",
            text: "Anxiety has been trending down — nice!",
          });
        }
      }
    }

    return found;
  }, [logs]);

  if (patterns.length === 0) {
    return (
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
          margin: "0 0 4px 0",
        }}>
          🔍 Patterns
        </h3>
        <p style={{
          fontFamily: "'Nunito', sans-serif",
          fontSize: "13px",
          color: "var(--brown-light, #9A7E7E)",
          margin: 0,
        }}>
          Keep logging — patterns will appear after a few more days of data
        </p>
      </div>
    );
  }

  return (
    <div style={{
      background: "var(--white, #FFFDF8)",
      borderRadius: "20px",
      border: "1.5px solid var(--tan-light, #EDE3CF)",
      padding: "16px",
      display: "flex",
      flexDirection: "column",
      gap: "10px",
    }}>
      <h3 style={{
        fontFamily: "'Fraunces', serif",
        fontSize: "16px",
        fontWeight: 700,
        color: "var(--brown, #3B2F2F)",
        margin: 0,
      }}>
        🔍 Patterns Detected
      </h3>
      {patterns.map((p, i) => (
        <div
          key={i}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "10px 12px",
            background: "var(--cream, #FAF5EB)",
            borderRadius: "12px",
            border: "1px solid var(--tan-light, #EDE3CF)",
          }}
        >
          <span style={{ fontSize: "18px", flexShrink: 0 }}>{p.emoji}</span>
          <span style={{
            fontFamily: "'Nunito', sans-serif",
            fontSize: "13px",
            fontWeight: 500,
            color: "var(--brown, #3B2F2F)",
          }}>
            {p.text}
          </span>
        </div>
      ))}
    </div>
  );
}