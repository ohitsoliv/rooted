// src/pages/History.jsx — Rooted Health Tracker
// History page: calendar view, tap any day to see full log detail

import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import BottomNav from "../components/BottomNav";
import MonthSwitcher from "../components/MonthSwitcher";
import { logDayKey } from "../firebase";
import { normalizeDay, checkinList } from "../analysis/normalize";
import { SECTIONS, CHECKIN_QUESTIONS, isAnswered, labelOf } from "../questions";
import { describeFeeling } from "../feelings";

const MOOD_EMOJIS = ["😢", "😕", "😐", "🙂", "😊"];
const PAIN_EMOJIS = ["😌", "🤏", "😐", "😣", "😫"];
const ENERGY_EMOJIS = ["🪫", "😮‍💨", "😐", "⚡", "🔋"];
const FATIGUE_EMOJIS = ["🔋", "😐", "😮‍💨", "😩", "🪫"];
const QUALITY_EMOJIS = ["😫", "😕", "😐", "🙂", "😴"];

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

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
 * History
 *
 * Props:
 *   logs    — array of log objects for the month
 *   loading — boolean
 *   year, month — selected month
 *   onMonthChange — change selected month by -1 or +1
 */
export default function History({ logs = [], loading = false, year, month, onMonthChange }) {
  const [selectedDate, setSelectedDate] = useState(null);
  const navigate = useNavigate();

  const now = new Date();
  const totalDays = new Date(year, month + 1, 0).getDate();
  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth();
  const currentDay = isCurrentMonth ? now.getDate() : totalDays;

  // What day of the week does the 1st fall on? (0=Sun)
  const firstDayOfWeek = new Date(year, month, 1).getDay();

  // Build logMap: dayOfMonth -> log
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

  const selectedDay = selectedDate?.year === year && selectedDate?.month === month
    ? selectedDate.day
    : null;
  const selectedLog = selectedDay ? logMap[selectedDay] : null;
  const selectedDateKey = selectedDay
    ? `${year}-${String(month + 1).padStart(2, "0")}-${String(selectedDay).padStart(2, "0")}`
    : null;

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
          Loading history... 📅
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
      <header style={{ padding: "16px 20px 12px" }}>
        <h1 style={{
          fontFamily: "'Fraunces', serif",
          fontSize: "24px",
          fontWeight: 700,
          color: "var(--brown, #3B2F2F)",
          margin: "0 0 2px 0",
        }}>
          📅 History
        </h1>
        <p style={{
          fontFamily: "'Nunito', sans-serif",
          fontSize: "13px",
          color: "var(--brown-light, #9A7E7E)",
          margin: 0,
        }}>
          Tap a day to see details
        </p>
        <MonthSwitcher year={year} month={month} onMonthChange={onMonthChange} />
      </header>

      <main style={{
        padding: "0 16px 20px",
        display: "flex",
        flexDirection: "column",
        gap: "16px",
      }}>
        {/* Calendar grid */}
        <div style={{
          background: "var(--white, #FFFDF8)",
          borderRadius: "20px",
          border: "1.5px solid var(--tan-light, #EDE3CF)",
          padding: "16px",
        }}>
          {/* Day name headers */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(7, 1fr)",
            gap: "4px",
            marginBottom: "8px",
          }}>
            {DAY_NAMES.map((d) => (
              <div
                key={d}
                style={{
                  fontFamily: "'Nunito', sans-serif",
                  fontSize: "11px",
                  fontWeight: 700,
                  color: "var(--brown-light, #9A7E7E)",
                  textAlign: "center",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                {d}
              </div>
            ))}
          </div>

          {/* Calendar cells */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(7, 1fr)",
            gap: "4px",
          }}>
            {/* Empty cells for days before the 1st */}
            {Array.from({ length: firstDayOfWeek }, (_, i) => (
              <div key={`empty-${i}`} />
            ))}

            {/* Actual days */}
            {Array.from({ length: totalDays }, (_, i) => {
              const day = i + 1;
              const log = logMap[day];
              const isLogged = !!log;
              const isBackfilled = log?.backfilled === true;
              const isFlare = log?.eds?.flareDay === true;
              const isToday = isCurrentMonth && day === currentDay;
              const isFuture = day > currentDay;
              const isSelected = day === selectedDay;
              const normMood = log ? normalizeDay(log).mood : null;
              const mood = normMood == null ? undefined : Math.round(normMood);

              return (
                <button
                  key={day}
                  onClick={() => {
                    if (!isFuture) {
                      playTap();
                      setSelectedDate(isSelected ? null : { year, month, day });
                    }
                  }}
                  disabled={isFuture}
                  style={{
                    aspectRatio: "1",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "1px",
                    borderRadius: "12px",
                    border: isSelected
                      ? "2.5px solid var(--terra, #C1724F)"
                      : isBackfilled
                        ? "2px dashed var(--terra, #C1724F)"
                      : isToday
                        ? "2px solid var(--brown, #3B2F2F)"
                        : "1.5px solid transparent",
                    background: isFlare
                      ? "color-mix(in srgb, var(--terra) 15%, var(--white))"
                      : isLogged
                        ? "color-mix(in srgb, var(--sage) 12%, var(--white))"
                        : "transparent",
                    cursor: isFuture ? "default" : "pointer",
                    opacity: isFuture ? 0.3 : 1,
                    transition: "all 0.2s ease",
                    WebkitTapHighlightColor: "transparent",
                    padding: "2px",
                  }}
                >
                  {/* Mood emoji if logged */}
                  {isLogged && mood != null ? (
                    <span style={{ fontSize: "14px", lineHeight: 1 }}>
                      {MOOD_EMOJIS[mood]}
                    </span>
                  ) : isFlare ? (
                    <span style={{ fontSize: "12px", lineHeight: 1 }}>🔥</span>
                  ) : null}
                  <span style={{
                    fontFamily: "'Nunito', sans-serif",
                    fontSize: isLogged ? "10px" : "13px",
                    fontWeight: isToday ? 700 : 500,
                    color: isToday
                      ? "var(--brown, #3B2F2F)"
                      : "var(--brown-light, #9A7E7E)",
                    lineHeight: 1,
                  }}>
                    {day}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div style={{
            display: "flex",
            gap: "12px",
            justifyContent: "center",
            marginTop: "12px",
          }}>
            <LegendDot color="color-mix(in srgb, var(--sage) 12%, var(--white))" border="var(--sage)" label="Logged" />
            <LegendDot color="color-mix(in srgb, var(--terra) 15%, var(--white))" border="var(--terra)" label="Flare" />
            <LegendDot color="transparent" border="var(--terra)" label="Filled in later" dashed />
            {isCurrentMonth && <LegendDot color="transparent" border="var(--brown)" label="Today" />}
          </div>
        </div>

        {/* Selected day detail */}
        {selectedDay && (
          <div style={{
            background: "var(--white, #FFFDF8)",
            borderRadius: "20px",
            border: "1.5px solid var(--tan-light, #EDE3CF)",
            padding: "16px",
            animation: "history-reveal 0.3s ease-out",
          }}>
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "12px",
            }}>
              <h3 style={{
                fontFamily: "'Fraunces', serif",
                fontSize: "18px",
                fontWeight: 700,
                color: "var(--brown, #3B2F2F)",
                margin: 0,
              }}>
                {`${year}-${String(month + 1).padStart(2, "0")}-${String(selectedDay).padStart(2, "0")}`}
              </h3>
              <button
                onClick={() => { playTap(); setSelectedDate(null); }}
                style={{
                  fontFamily: "'Nunito', sans-serif",
                  fontSize: "12px",
                  fontWeight: 600,
                  color: "var(--brown-light, #9A7E7E)",
                  background: "var(--cream, #FAF5EB)",
                  border: "1px solid var(--tan-light)",
                  borderRadius: "8px",
                  padding: "4px 10px",
                  cursor: "pointer",
                }}
              >
                Close ✕
              </button>
            </div>

            {selectedLog ? (
              <div style={{
                display: "flex",
                flexDirection: "column",
                gap: "10px",
              }}>
                {selectedLog.backfilled && (
                  <p style={{
                    fontFamily: "'Nunito', sans-serif",
                    fontSize: "12px",
                    fontWeight: 700,
                    color: "var(--terra, #C1724F)",
                    margin: 0,
                  }}>
                    Filled in later from memory
                  </p>
                )}
                {/* Completed sections */}
                {selectedLog.completedSections?.length > 0 && (
                  <div style={{
                    display: "flex",
                    gap: "6px",
                    flexWrap: "wrap",
                    marginBottom: "4px",
                  }}>
                    {selectedLog.completedSections.map((s) => (
                      <span
                        key={s}
                        style={{
                          padding: "3px 8px",
                          background: "color-mix(in srgb, var(--sage) 10%, var(--cream))",
                          borderRadius: "8px",
                          fontFamily: "'Nunito', sans-serif",
                          fontSize: "11px",
                          fontWeight: 600,
                          color: "var(--sage-dark, #5A7554)",
                        }}
                      >
                        ✓ {s}
                      </span>
                    ))}
                  </div>
                )}

                {/* Sleep */}
                {selectedLog.sleep?.quality != null && (
                  <DetailRow
                    color="mauve"
                    label="Sleep"
                    value={`${QUALITY_EMOJIS[selectedLog.sleep.quality]} ${["Awful","Poor","Okay","Good","Great"][selectedLog.sleep.quality]}`}
                    sub={selectedLog.sleep.activity ? `Before bed: ${selectedLog.sleep.activity}` : null}
                  />
                )}

                {/* Mood */}
                {selectedLog.mood?.overallMood != null && (
                  <DetailRow
                    color="mauve"
                    label="Mood"
                    value={`${MOOD_EMOJIS[selectedLog.mood.overallMood]} ${["Awful","Low","Okay","Good","Great"][selectedLog.mood.overallMood]}`}
                    sub={selectedLog.mood.emotionPath || selectedLog.mood.emotion || null}
                  />
                )}
                {selectedLog.mood?.note && (
                  <DetailRow color="mauve" label="Mood note" value={selectedLog.mood.note} />
                )}

                {/* Check-ins */}
                {(() => {
                  const cis = selectedLog.checkins?.checkins || selectedLog.checkins;
                  // Older check-ins only; new ones are listed by <AnswerList>
                  if (Array.isArray(cis) && cis.length > 0 && typeof cis[cis.length - 1].mood === "number") {
                    const last = cis[cis.length - 1];
                    return (
                      <DetailRow
                        color="terra"
                        label={`Check-ins (${cis.length})`}
                        value={[
                          last.mood != null ? `Mood ${MOOD_EMOJIS[last.mood]}` : null,
                          last.pain != null ? `Pain ${PAIN_EMOJIS[last.pain]}` : null,
                          last.energy != null ? `Energy ${ENERGY_EMOJIS[last.energy]}` : null,
                        ].filter(Boolean).join("  ")}
                        sub={last.event || null}
                      />
                    );
                  }
                  return null;
                })()}

                {/* Symptoms */}
                {selectedLog.symptoms?.fatigue != null && (
                  <DetailRow
                    color="sage"
                    label="Fatigue"
                    value={`${FATIGUE_EMOJIS[selectedLog.symptoms.fatigue]} ${["Fine","Tired","Dragging","Exhausted","Empty"][selectedLog.symptoms.fatigue]}`}
                    sub={[
                      selectedLog.symptoms.headache?.active && "Headache",
                      selectedLog.symptoms.stomach?.active && "Stomach",
                      selectedLog.symptoms.brainFog?.active && "Brain fog",
                      selectedLog.symptoms.tension?.active && "Tension",
                    ].filter(Boolean).join(", ") || null}
                  />
                )}

                {/* POTS */}
                {(selectedLog.pots?.dizziness != null || selectedLog.pots?.heartRate) && (
                  <DetailRow
                    color="teal"
                    label="POTS"
                    value={[
                      selectedLog.pots.heartRate ? `HR: ${selectedLog.pots.heartRate} bpm` : null,
                      selectedLog.pots.dizziness ? "Dizzy" : null,
                      selectedLog.pots.palpitations ? "Palp" : null,
                      selectedLog.pots.fainting ? "Faint" : null,
                    ].filter(Boolean).join("  ·  ") || "Logged"}
                  />
                )}

                {/* EDS */}
                {selectedLog.eds?.activityTolerance && (
                  <DetailRow
                    color="amber"
                    label="EDS"
                    value={`Activity: ${selectedLog.eds.activityTolerance}${selectedLog.eds.flareDay ? "  🔥 Flare" : ""}`}
                    sub={selectedLog.eds.jointPainLocations?.length > 0
                      ? `Joint pain: ${selectedLog.eds.jointPainLocations.join(", ")}`
                      : null
                    }
                  />
                )}

                {/* Nutrition */}
                {selectedLog.nutrition?.hydration != null && (
                  <DetailRow
                    color="gold"
                    label="Nutrition"
                    value={`Hydration: ${["Parched","Low","Okay","Good","Great"][selectedLog.nutrition.hydration]}${selectedLog.nutrition.salt ? `  ·  Salt: ${selectedLog.nutrition.salt}` : ""}`}
                    sub={[
                      selectedLog.nutrition.exercise && "Exercised",
                      selectedLog.nutrition.medsTaken && "Meds taken",
                    ].filter(Boolean).join("  ·  ") || null}
                  />
                )}

                {/* Habits */}
                {selectedLog.habits?.homework && (
                  <DetailRow
                    color="mauve"
                    label="Habits"
                    value={`Homework: ${selectedLog.habits.homework}${selectedLog.habits.attendance ? `  ·  ${selectedLog.habits.attendance}` : ""}`}
                    sub={selectedLog.habits.win ? `Win: ${selectedLog.habits.win}` : null}
                  />
                )}

                {/* Notes */}
                {(selectedLog.habits?.notableEvent || selectedLog.habits?.moodAffect) && (
                  <div style={{
                    padding: "10px 12px",
                    background: "var(--cream, #FAF5EB)",
                    borderRadius: "12px",
                    border: "1px solid var(--tan-light, #EDE3CF)",
                  }}>
                    {selectedLog.habits.notableEvent && (
                      <p style={{
                        fontFamily: "'Nunito', sans-serif",
                        fontSize: "13px",
                        color: "var(--brown, #3B2F2F)",
                        margin: "0 0 4px 0",
                      }}>
                        📌 {selectedLog.habits.notableEvent}
                      </p>
                    )}
                    {selectedLog.habits.moodAffect && (
                      <p style={{
                        fontFamily: "'Nunito', sans-serif",
                        fontSize: "13px",
                        color: "var(--brown-light, #9A7E7E)",
                        margin: 0,
                      }}>
                        💭 {selectedLog.habits.moodAffect}
                      </p>
                    )}
                  </div>
                )}
                <AnswerList log={selectedLog} />
              </div>
            ) : (
              <p style={{
                fontFamily: "'Nunito', sans-serif",
                fontSize: "14px",
                color: "var(--brown-light, #9A7E7E)",
                textAlign: "center",
                padding: "12px 0",
              }}>
                No log for this day — and that's okay 🌿
              </p>
            )}
            {selectedDateKey && selectedDateKey < logDayKey() && (
              <button
                type="button"
                onClick={() => navigate(`/log/${selectedDateKey}`)}
                style={{
                  display: "block",
                  margin: "0 auto",
                  border: 0,
                  borderRadius: "12px",
                  padding: "10px 16px",
                  background: "var(--terra, #C1724F)",
                  color: "var(--white, #FFFDF8)",
                  fontFamily: "'Nunito', sans-serif",
                  fontSize: "14px",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                {selectedLog?.completedSections?.length && !selectedLog.backfilled
                  ? "Review or edit this day"
                  : "Log this day"}
              </button>
            )}
          </div>
        )}

        {/* Monthly summary stat */}
        <div style={{
          background: "var(--white, #FFFDF8)",
          borderRadius: "16px",
          border: "1.5px solid var(--tan-light, #EDE3CF)",
          padding: "14px 16px",
          display: "flex",
          justifyContent: "space-around",
          textAlign: "center",
        }}>
          <MiniStat label="Logged" value={logs.length} sub={`of ${totalDays}`} color="sage" />
          <MiniStat
            label="Flare days"
            value={logs.filter((l) => l.eds?.flareDay).length}
            color="terra"
          />
          <MiniStat
            label="Streak"
            value={`${logs.filter((l) => l.completedSections?.length > 0).length}`}
            sub="🌿"
            color="sage"
          />
        </div>
      </main>

      <BottomNav />

      <style>{`
        @keyframes history-reveal {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

/* ---- Sub-components ---- */

function DetailRow({ color, label, value, sub }) {
  return (
    <div style={{
      display: "flex",
      gap: "10px",
      alignItems: "flex-start",
      padding: "8px 0",
      borderBottom: "1px solid var(--tan-light, #EDE3CF)",
    }}>
      <div style={{
        width: "4px",
        minHeight: "24px",
        borderRadius: "2px",
        background: `var(--${color})`,
        flexShrink: 0,
        marginTop: "2px",
      }} />
      <div style={{ flex: 1 }}>
        <div style={{
          fontFamily: "'Nunito', sans-serif",
          fontSize: "11px",
          fontWeight: 700,
          color: `var(--${color})`,
          textTransform: "uppercase",
          letterSpacing: "0.04em",
          marginBottom: "2px",
        }}>
          {label}
        </div>
        <div style={{
          fontFamily: "'Nunito', sans-serif",
          fontSize: "14px",
          fontWeight: 600,
          color: "var(--brown, #3B2F2F)",
        }}>
          {value}
        </div>
        {sub && (
          <div style={{
            fontFamily: "'Nunito', sans-serif",
            fontSize: "12px",
            color: "var(--brown-light, #9A7E7E)",
            marginTop: "2px",
          }}>
            {sub}
          </div>
        )}
      </div>
    </div>
  );
}

function LegendDot({ color, border, label, dashed = false }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
      <div style={{
        width: "12px",
        height: "12px",
        borderRadius: "4px",
        background: color,
        border: `2px ${dashed ? "dashed" : "solid"} ${border}`,
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

function MiniStat({ label, value, sub, color }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "2px" }}>
      <span style={{
        fontFamily: "'Fraunces', serif",
        fontSize: "22px",
        fontWeight: 700,
        color: `var(--${color})`,
      }}>
        {value}
      </span>
      {sub && (
        <span style={{
          fontFamily: "'Nunito', sans-serif",
          fontSize: "11px",
          color: "var(--brown-light, #9A7E7E)",
        }}>
          {sub}
        </span>
      )}
      <span style={{
        fontFamily: "'Nunito', sans-serif",
        fontSize: "11px",
        fontWeight: 600,
        color: "var(--brown-light, #9A7E7E)",
        textTransform: "uppercase",
        letterSpacing: "0.03em",
      }}>
        {label}
      </span>
    </div>
  );
}

/** Every answer from the current question set, grouped by section. */
function AnswerList({ log }) {
  const groups = [];
  const cis = checkinList(log);
  cis.forEach((ci, i) => {
    const rows = CHECKIN_QUESTIONS.filter((q) => isAnswered(ci[q.id]))
      .map((q) => [q.prompt, q.options ? labelOf(q, ci[q.id]) : String(ci[q.id])]);
    if (describeFeeling(ci)) rows.push(["Feeling", describeFeeling(ci)]);
    if (rows.length) {
      const time = ci.timestamp ? new Date(ci.timestamp).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) : `#${i + 1}`;
      groups.push({ title: `📝 Check-in ${time}`, rows });
    }
  });
  for (const s of SECTIONS) {
    if (!s.questions) continue;
    const data = log[s.id] || {};
    const rows = s.questions.filter((q) => q.type !== "meds" && isAnswered(data[q.id])).map((q) => [q.prompt, labelOf(q, data[q.id])]);
    if (s.id === "nutrition" && data.meds && typeof data.meds === "object") {
      const statuses = Object.values(data.meds).filter((v) => v && typeof v === "object" && v.status).map((v) => v.status);
      if (statuses.length) rows.unshift(["Meds", statuses.join(", ")]);
    }
    if (rows.length) groups.push({ title: `${s.emoji} ${s.label}`, rows });
  }
  if (!groups.length) return null;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
      {groups.map((g) => (
        <div key={g.title} style={{ padding: "10px 12px", background: "var(--cream)", borderRadius: "12px", border: "1px solid var(--tan-light)" }}>
          <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: "13px", fontWeight: 700, color: "var(--brown)", margin: "0 0 4px" }}>{g.title}</p>
          {g.rows.map(([k, v]) => (
            <p key={k} style={{ fontFamily: "'Nunito', sans-serif", fontSize: "12px", color: "var(--brown)", margin: "2px 0" }}>
              <span style={{ color: "var(--brown-light)" }}>{k}</span> — {v}
            </p>
          ))}
        </div>
      ))}
    </div>
  );
}
