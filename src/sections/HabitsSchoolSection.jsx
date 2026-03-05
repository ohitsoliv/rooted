// src/sections/HabitsSchoolSection.jsx — Rooted Health Tracker
// Section 8: Habits + School — color: mauve
// Fields: focus (5 emoji), homework, win of the day + suggestion chips,
//         school attendance, classes counter (+/- with live % bar),
//         test/assignment toggle (reveals grade), daily notes
// Good Enough Mode: homework + exercise y/n + attended y/n

import { useState, useCallback } from "react";
import EmojiScale from "../components/EmojiScale";
import TogglePair from "../components/TogglePair";
import SectionProgress from "../components/SectionProgress";
import SkipLink from "../components/SkipLink";

const COLOR = "mauve";

const FOCUS_OPTIONS = [
  { emoji: "🫠", label: "Zero" },
  { emoji: "😵‍💫", label: "Low" },
  { emoji: "😐", label: "Okay" },
  { emoji: "🎯", label: "Good" },
  { emoji: "🔥", label: "Locked in" },
];

const HOMEWORK_OPTIONS = [
  { id: "done", label: "Done", emoji: "✅" },
  { id: "partially", label: "Partially", emoji: "〽️" },
  { id: "didnt", label: "Didn't get to it", emoji: "⏭️" },
];

const ATTENDANCE_OPTIONS = [
  { id: "present", label: "Present", emoji: "✅" },
  { id: "late", label: "Late", emoji: "⏰" },
  { id: "absent", label: "Absent", emoji: "🏠" },
];

const WIN_SUGGESTIONS = [
  "Got out of bed",
  "Drank water",
  "Talked to a friend",
  "Finished an assignment",
  "Took my meds",
  "Asked for help",
  "Went outside",
  "Ate a real meal",
  "Was kind to myself",
  "Stayed off phone",
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

/** +/- counter component */
function Counter({ label, value, onChange, min = 0, max = 12, colorClass = "mauve" }) {
  const color = `var(--${colorClass}, var(--mauve))`;
  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: "10px",
    }}>
      <span style={{
        fontFamily: "'Nunito', sans-serif",
        fontSize: "13px",
        fontWeight: 600,
        color: "var(--brown, #3B2F2F)",
        minWidth: "70px",
      }}>
        {label}
      </span>
      <button
        onClick={() => { playTap(); onChange?.(Math.max(min, (value || 0) - 1)); }}
        disabled={(value || 0) <= min}
        style={{
          width: "34px",
          height: "34px",
          borderRadius: "10px",
          border: "1.5px solid var(--tan, #D4C5A9)",
          background: "var(--white, #FFFDF8)",
          fontSize: "18px",
          fontWeight: 700,
          color: (value || 0) <= min ? "var(--tan, #D4C5A9)" : color,
          cursor: (value || 0) <= min ? "not-allowed" : "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "all 0.15s ease",
          WebkitTapHighlightColor: "transparent",
        }}
      >
        −
      </button>
      <span style={{
        fontFamily: "'Nunito', sans-serif",
        fontSize: "18px",
        fontWeight: 700,
        color: "var(--brown, #3B2F2F)",
        minWidth: "24px",
        textAlign: "center",
      }}>
        {value || 0}
      </span>
      <button
        onClick={() => { playTap(); onChange?.(Math.min(max, (value || 0) + 1)); }}
        disabled={(value || 0) >= max}
        style={{
          width: "34px",
          height: "34px",
          borderRadius: "10px",
          border: `1.5px solid ${color}`,
          background: `color-mix(in srgb, ${color} 8%, var(--white))`,
          fontSize: "18px",
          fontWeight: 700,
          color: (value || 0) >= max ? "var(--tan, #D4C5A9)" : color,
          cursor: (value || 0) >= max ? "not-allowed" : "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "all 0.15s ease",
          WebkitTapHighlightColor: "transparent",
        }}
      >
        +
      </button>
    </div>
  );
}

/** Pill-style option row */
function OptionRow({ options, value, onSelect, colorClass = "mauve" }) {
  const color = `var(--${colorClass}, var(--mauve))`;
  return (
    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
      {options.map((opt) => {
        const isActive = value === opt.id;
        return (
          <button
            key={opt.id}
            onClick={() => { playTap(); onSelect?.(opt.id); }}
            aria-pressed={isActive}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "5px",
              padding: "8px 14px",
              border: isActive ? `2px solid ${color}` : "2px solid var(--tan-light, #EDE3CF)",
              borderRadius: "20px",
              background: isActive
                ? `color-mix(in srgb, ${color} 10%, var(--white))`
                : "var(--white, #FFFDF8)",
              cursor: "pointer",
              transition: "all 0.2s ease",
              WebkitTapHighlightColor: "transparent",
              fontFamily: "'Nunito', sans-serif",
              fontSize: "13px",
              fontWeight: isActive ? 700 : 500,
              color: isActive ? color : "var(--brown-light, #9A7E7E)",
            }}
          >
            <span style={{ fontSize: "16px" }}>{opt.emoji}</span>
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

/**
 * HabitsSchoolSection
 */
export default function HabitsSchoolSection({
  data = {},
  onUpdate,
  onSave,
  onSkip,
  onCelebrate,
  goodEnough = false,
}) {
  // Full: step 0 = focus + homework + win, step 1 = school, step 2 = notes
  const [step, setStep] = useState(0);

  const handleSave = useCallback(() => {
    onSave?.();
    onCelebrate?.({
      emoji: "⭐",
      title: "Habits logged!",
      msg: randomMsg(),
    });
  }, [onSave, onCelebrate]);

  const attended = data.classesAttended || 0;
  const total = data.classesTotal || 0;
  const pct = total > 0 ? Math.round((attended / total) * 100) : 0;

  // Good Enough Mode
  if (goodEnough) {
    return (
      <div style={{
        background: "var(--white, #FFFDF8)",
        borderRadius: "20px",
        border: `2px solid var(--${COLOR}, #A07B8A)`,
        padding: "20px",
        display: "flex",
        flexDirection: "column",
        gap: "14px",
      }}>
        <div>
          <h3 style={{
            fontFamily: "'Fraunces', serif",
            fontSize: "18px",
            fontWeight: 700,
            color: `var(--${COLOR}, #A07B8A)`,
            margin: 0,
          }}>
            ⭐ Habits + School
          </h3>
          <span style={{
            fontFamily: "'Nunito', sans-serif",
            fontSize: "12px",
            color: "var(--brown-light, #9A7E7E)",
          }}>
            ~15 sec
          </span>
        </div>

        {/* Homework */}
        <div>
          <label style={{
            fontFamily: "'Nunito', sans-serif",
            fontSize: "14px",
            fontWeight: 600,
            color: "var(--brown, #3B2F2F)",
            display: "block",
            marginBottom: "8px",
          }}>
            Homework
          </label>
          <OptionRow
            options={HOMEWORK_OPTIONS}
            value={data.homework}
            onSelect={(v) => onUpdate?.("homework", v)}
            colorClass={COLOR}
          />
        </div>

        {/* Exercise y/n */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "var(--cream, #FAF5EB)",
          borderRadius: "14px",
          padding: "12px 14px",
          border: "1.5px solid var(--tan-light, #EDE3CF)",
        }}>
          <span style={{
            fontFamily: "'Nunito', sans-serif",
            fontSize: "14px",
            fontWeight: 600,
            color: "var(--brown, #3B2F2F)",
          }}>
            🏃 Exercise
          </span>
          <TogglePair
            value={data.exerciseQuick ?? null}
            onChange={(v) => onUpdate?.("exerciseQuick", v)}
            colorClass={COLOR}
          />
        </div>

        {/* Attended y/n */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "var(--cream, #FAF5EB)",
          borderRadius: "14px",
          padding: "12px 14px",
          border: "1.5px solid var(--tan-light, #EDE3CF)",
        }}>
          <span style={{
            fontFamily: "'Nunito', sans-serif",
            fontSize: "14px",
            fontWeight: 600,
            color: "var(--brown, #3B2F2F)",
          }}>
            🏫 Attended school
          </span>
          <TogglePair
            value={data.attendedQuick ?? null}
            onChange={(v) => onUpdate?.("attendedQuick", v)}
            colorClass={COLOR}
          />
        </div>

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
            boxShadow: `0 3px 10px color-mix(in srgb, var(--${COLOR}) 25%, transparent)`,
            WebkitTapHighlightColor: "transparent",
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.02)"}
          onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
        >
          Save Habits ⭐
        </button>
        <SkipLink onSkip={onSkip} />
      </div>
    );
  }

  // Full mode
  return (
    <div style={{
      background: "var(--white, #FFFDF8)",
      borderRadius: "20px",
      border: `2px solid var(--${COLOR}, #A07B8A)`,
      padding: "20px",
      display: "flex",
      flexDirection: "column",
      gap: "16px",
    }}>
      {/* Header */}
      <div>
        <h3 style={{
          fontFamily: "'Fraunces', serif",
          fontSize: "18px",
          fontWeight: 700,
          color: `var(--${COLOR}, #A07B8A)`,
          margin: 0,
        }}>
          ⭐ Habits + School
        </h3>
        <span style={{
          fontFamily: "'Nunito', sans-serif",
          fontSize: "12px",
          color: "var(--brown-light, #9A7E7E)",
        }}>
          ~2 min
        </span>
      </div>

      <SectionProgress total={3} current={step} colorClass={COLOR} />

      {/* Step 0: Focus + Homework + Win */}
      {step >= 0 && (
        <div style={{
          display: "flex",
          flexDirection: "column",
          gap: "14px",
        }}>
          {/* Focus */}
          <div>
            <label style={{
              fontFamily: "'Nunito', sans-serif",
              fontSize: "14px",
              fontWeight: 600,
              color: "var(--brown, #3B2F2F)",
              display: "block",
              marginBottom: "8px",
            }}>
              How was your focus today?
            </label>
            <EmojiScale
              id="habits-focus"
              options={FOCUS_OPTIONS}
              value={data.focus}
              onSelect={(i) => onUpdate?.("focus", i)}
              colorClass={COLOR}
            />
          </div>

          {/* Homework */}
          <div>
            <label style={{
              fontFamily: "'Nunito', sans-serif",
              fontSize: "14px",
              fontWeight: 600,
              color: "var(--brown, #3B2F2F)",
              display: "block",
              marginBottom: "8px",
            }}>
              Homework
            </label>
            <OptionRow
              options={HOMEWORK_OPTIONS}
              value={data.homework}
              onSelect={(v) => onUpdate?.("homework", v)}
              colorClass={COLOR}
            />
          </div>

          {/* Win of the day */}
          <div>
            <label style={{
              fontFamily: "'Nunito', sans-serif",
              fontSize: "14px",
              fontWeight: 600,
              color: "var(--brown, #3B2F2F)",
              display: "block",
              marginBottom: "4px",
            }}>
              🏆 Win of the day
            </label>
            <span style={{
              fontFamily: "'Nunito', sans-serif",
              fontSize: "11px",
              color: "var(--brown-light, #9A7E7E)",
              display: "block",
              marginBottom: "8px",
            }}>
              Even tiny wins count — tap a suggestion or write your own
            </span>

            <input
              type="text"
              placeholder="What went well today?"
              value={data.win || ""}
              onChange={(e) => onUpdate?.("win", e.target.value)}
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
                marginBottom: "8px",
                transition: "border-color 0.2s ease",
              }}
              onFocus={(e) => e.target.style.borderColor = `var(--${COLOR})`}
              onBlur={(e) => e.target.style.borderColor = "var(--tan, #D4C5A9)"}
            />

            {/* Suggestion chips */}
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
              {WIN_SUGGESTIONS.map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => { playTap(); onUpdate?.("win", suggestion); }}
                  style={{
                    padding: "4px 10px",
                    border: data.win === suggestion
                      ? `1.5px solid var(--${COLOR}, #A07B8A)`
                      : "1.5px solid var(--tan-light, #EDE3CF)",
                    borderRadius: "14px",
                    background: data.win === suggestion
                      ? `color-mix(in srgb, var(--${COLOR}) 10%, var(--white))`
                      : "var(--white, #FFFDF8)",
                    cursor: "pointer",
                    fontFamily: "'Nunito', sans-serif",
                    fontSize: "11px",
                    fontWeight: data.win === suggestion ? 700 : 500,
                    color: data.win === suggestion
                      ? `var(--${COLOR}, #A07B8A)`
                      : "var(--brown-light, #9A7E7E)",
                    transition: "all 0.15s ease",
                    WebkitTapHighlightColor: "transparent",
                  }}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>

          {step === 0 && (
            <button
              onClick={() => { playTap(); setStep(1); }}
              style={{
                fontFamily: "'Nunito', sans-serif",
                fontSize: "14px",
                fontWeight: 600,
                color: `var(--${COLOR}, #A07B8A)`,
                background: "transparent",
                border: `1.5px solid var(--${COLOR}, #A07B8A)`,
                borderRadius: "12px",
                padding: "10px",
                cursor: "pointer",
                transition: "all 0.2s ease",
                WebkitTapHighlightColor: "transparent",
              }}
            >
              School stuff →
            </button>
          )}
        </div>
      )}

      {/* Step 1: School */}
      {step >= 1 && (
        <div style={{
          display: "flex",
          flexDirection: "column",
          gap: "14px",
          animation: "habits-reveal 0.3s ease-out",
        }}>
          {/* Attendance */}
          <div>
            <label style={{
              fontFamily: "'Nunito', sans-serif",
              fontSize: "14px",
              fontWeight: 600,
              color: "var(--brown, #3B2F2F)",
              display: "block",
              marginBottom: "8px",
            }}>
              🏫 School attendance
            </label>
            <OptionRow
              options={ATTENDANCE_OPTIONS}
              value={data.attendance}
              onSelect={(v) => onUpdate?.("attendance", v)}
              colorClass={COLOR}
            />
          </div>

          {/* Classes counter */}
          <div style={{
            background: "var(--cream, #FAF5EB)",
            borderRadius: "14px",
            padding: "14px",
            border: "1.5px solid var(--tan-light, #EDE3CF)",
            display: "flex",
            flexDirection: "column",
            gap: "10px",
          }}>
            <span style={{
              fontFamily: "'Nunito', sans-serif",
              fontSize: "14px",
              fontWeight: 600,
              color: "var(--brown, #3B2F2F)",
            }}>
              📚 Classes
            </span>
            <Counter
              label="Attended"
              value={data.classesAttended}
              onChange={(v) => onUpdate?.("classesAttended", v)}
              colorClass={COLOR}
            />
            <Counter
              label="Total"
              value={data.classesTotal}
              onChange={(v) => onUpdate?.("classesTotal", v)}
              colorClass={COLOR}
            />

            {/* Live % bar */}
            {total > 0 && (
              <div style={{ marginTop: "4px" }}>
                <div style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "4px",
                }}>
                  <span style={{
                    fontFamily: "'Nunito', sans-serif",
                    fontSize: "12px",
                    fontWeight: 600,
                    color: "var(--brown-light, #9A7E7E)",
                  }}>
                    Attendance rate
                  </span>
                  <span style={{
                    fontFamily: "'Nunito', sans-serif",
                    fontSize: "12px",
                    fontWeight: 700,
                    color: pct >= 75 ? "var(--sage, #7D9B76)" : pct >= 50 ? "var(--gold, #C4A96A)" : "var(--terra, #C1724F)",
                  }}>
                    {pct}%
                  </span>
                </div>
                <div style={{
                  height: "8px",
                  borderRadius: "4px",
                  background: "var(--tan-light, #EDE3CF)",
                  overflow: "hidden",
                }}>
                  <div style={{
                    height: "100%",
                    width: `${Math.min(pct, 100)}%`,
                    borderRadius: "4px",
                    background: pct >= 75 ? "var(--sage, #7D9B76)" : pct >= 50 ? "var(--gold, #C4A96A)" : "var(--terra, #C1724F)",
                    transition: "width 0.4s ease, background 0.3s ease",
                  }} />
                </div>
              </div>
            )}
          </div>

          {/* Test / assignment */}
          <div style={{
            background: "var(--cream, #FAF5EB)",
            borderRadius: "14px",
            padding: "12px 14px",
            border: data.hadTest
              ? `1.5px solid var(--${COLOR}, #A07B8A)`
              : "1.5px solid var(--tan-light, #EDE3CF)",
            transition: "all 0.2s ease",
          }}>
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}>
              <span style={{
                fontFamily: "'Nunito', sans-serif",
                fontSize: "14px",
                fontWeight: 600,
                color: "var(--brown, #3B2F2F)",
              }}>
                📝 Test or assignment due
              </span>
              <TogglePair
                value={data.hadTest ?? null}
                onChange={(v) => onUpdate?.("hadTest", v)}
                colorClass={COLOR}
              />
            </div>

            {data.hadTest && (
              <div style={{
                marginTop: "10px",
                paddingTop: "10px",
                borderTop: "1px solid var(--tan-light, #EDE3CF)",
                animation: "habits-reveal 0.25s ease-out",
              }}>
                <label style={{
                  fontFamily: "'Nunito', sans-serif",
                  fontSize: "12px",
                  fontWeight: 600,
                  color: "var(--brown-light, #9A7E7E)",
                  display: "block",
                  marginBottom: "6px",
                }}>
                  Grade <span style={{ fontWeight: 400 }}>(optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. B+, 85%, Pass"
                  value={data.grade || ""}
                  onChange={(e) => onUpdate?.("grade", e.target.value)}
                  style={{
                    width: "140px",
                    padding: "8px 12px",
                    fontFamily: "'Nunito', sans-serif",
                    fontSize: "14px",
                    color: "var(--brown, #3B2F2F)",
                    background: "var(--white, #FFFDF8)",
                    border: "1.5px solid var(--tan, #D4C5A9)",
                    borderRadius: "10px",
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

          {step === 1 && (
            <button
              onClick={() => { playTap(); setStep(2); }}
              style={{
                fontFamily: "'Nunito', sans-serif",
                fontSize: "14px",
                fontWeight: 600,
                color: `var(--${COLOR}, #A07B8A)`,
                background: "transparent",
                border: `1.5px solid var(--${COLOR}, #A07B8A)`,
                borderRadius: "12px",
                padding: "10px",
                cursor: "pointer",
                transition: "all 0.2s ease",
                WebkitTapHighlightColor: "transparent",
              }}
            >
              Last part →
            </button>
          )}
        </div>
      )}

      {/* Step 2: Daily notes */}
      {step >= 2 && (
        <div style={{
          display: "flex",
          flexDirection: "column",
          gap: "14px",
          animation: "habits-reveal 0.3s ease-out",
        }}>
          {/* Notable event */}
          <div>
            <label style={{
              fontFamily: "'Nunito', sans-serif",
              fontSize: "14px",
              fontWeight: 600,
              color: "var(--brown, #3B2F2F)",
              display: "block",
              marginBottom: "6px",
            }}>
              📌 Notable event <span style={{ fontWeight: 400, color: "var(--brown-light)", fontSize: "12px" }}>(optional)</span>
            </label>
            <input
              type="text"
              placeholder="Anything stand out today?"
              value={data.notableEvent || ""}
              onChange={(e) => onUpdate?.("notableEvent", e.target.value)}
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

          {/* What affected mood */}
          <div>
            <label style={{
              fontFamily: "'Nunito', sans-serif",
              fontSize: "14px",
              fontWeight: 600,
              color: "var(--brown, #3B2F2F)",
              display: "block",
              marginBottom: "6px",
            }}>
              💭 What affected your mood today? <span style={{ fontWeight: 400, color: "var(--brown-light)", fontSize: "12px" }}>(optional)</span>
            </label>
            <textarea
              placeholder="People, events, thoughts, body stuff..."
              value={data.moodAffect || ""}
              onChange={(e) => onUpdate?.("moodAffect", e.target.value)}
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
        </div>
      )}

      {/* Save */}
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
        Save Habits ⭐
      </button>

      <SkipLink onSkip={onSkip} />

      <style>{`
        @keyframes habits-reveal {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}