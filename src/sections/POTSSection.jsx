// src/sections/POTSSection.jsx — Rooted Health Tracker
// Section 5: POTS — color: teal
// Fields: heartRate (number), dizziness (y/n + severity), fainting (y/n),
//         palpitations (y/n + severity), nausea (y/n + severity),
//         skinFlushing (y/n), tempSensitivity (y/n + hot/cold/both)
// Good Enough Mode: dizziness + palpitations only

import { useState, useCallback } from "react";
import TogglePair from "../components/TogglePair";
import EmojiScale from "../components/EmojiScale";
import SkipLink from "../components/SkipLink";
import SectionProgress from "../components/SectionProgress";

const COLOR = "teal";

const SEVERITY_OPTIONS = [
  { emoji: "😊", label: "Mild" },
  { emoji: "😐", label: "Moderate" },
  { emoji: "😣", label: "Bad" },
  { emoji: "😫", label: "Severe" },
  { emoji: "🆘", label: "Worst" },
];

const TEMP_OPTIONS = [
  { id: "hot", label: "Hot", emoji: "🥵" },
  { id: "cold", label: "Cold", emoji: "🥶" },
  { id: "both", label: "Both", emoji: "🌡️" },
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

/** Reusable sub-section: yes/no toggle that reveals severity when yes */
function SymptomToggle({ label, emoji, value, severity, onToggle, onSeverity, colorClass }) {
  return (
    <div style={{
      background: "var(--cream, #FAF5EB)",
      borderRadius: "14px",
      padding: "12px 14px",
      border: value
        ? `1.5px solid var(--${colorClass}, #5A9099)`
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
          {emoji} {label}
        </span>
        <TogglePair
          value={value}
          onChange={onToggle}
          colorClass={colorClass}
        />
      </div>
      {value && onSeverity && (
        <div style={{
          marginTop: "10px",
          paddingTop: "10px",
          borderTop: "1px solid var(--tan-light, #EDE3CF)",
          animation: "pots-reveal 0.25s ease-out",
        }}>
          <EmojiScale
            id={`pots-${label}-severity`}
            options={SEVERITY_OPTIONS}
            value={severity}
            onSelect={onSeverity}
            colorClass={colorClass}
            size="sm"
          />
        </div>
      )}
    </div>
  );
}

/**
 * POTSSection
 *
 * Props:
 *   data         — current POTS data object
 *   onUpdate     — (field, value) => void
 *   onSave       — () => void
 *   onSkip       — () => void
 *   onCelebrate  — ({ emoji, title, msg }) => void
 *   goodEnough   — boolean
 */
export default function POTSSection({
  data = {},
  onUpdate,
  onSave,
  onSkip,
  onCelebrate,
  goodEnough = false,
}) {
  const [step, setStep] = useState(0);
  // Full: step 0 = HR + dizziness + fainting, step 1 = palp + nausea + flushing + temp
  // Good enough: single step = dizziness + palpitations

  const handleSave = useCallback(() => {
    onSave?.();
    onCelebrate?.({
      emoji: "💙",
      title: "POTS logged!",
      msg: randomMsg(),
    });
  }, [onSave, onCelebrate]);

  if (goodEnough) {
    return (
      <div style={{
        background: "var(--white, #FFFDF8)",
        borderRadius: "20px",
        border: `2px solid var(--${COLOR}, #5A9099)`,
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
            color: `var(--${COLOR}, #5A9099)`,
            margin: 0,
          }}>
            💙 POTS
          </h3>
          <span style={{
            fontFamily: "'Nunito', sans-serif",
            fontSize: "12px",
            color: "var(--brown-light, #9A7E7E)",
          }}>
            ~15 sec
          </span>
        </div>

        <SymptomToggle
          label="Dizziness"
          emoji="😵‍💫"
          value={data.dizziness ?? null}
          severity={data.dizzinessSeverity ?? null}
          onToggle={(v) => onUpdate?.("dizziness", v)}
          onSeverity={(i) => onUpdate?.("dizzinessSeverity", i)}
          colorClass={COLOR}
        />

        <SymptomToggle
          label="Palpitations"
          emoji="💓"
          value={data.palpitations ?? null}
          severity={data.palpitationsSeverity ?? null}
          onToggle={(v) => onUpdate?.("palpitations", v)}
          onSeverity={(i) => onUpdate?.("palpitationsSeverity", i)}
          colorClass={COLOR}
        />

        <button
          onClick={handleSave}
          style={{
            fontFamily: "'Nunito', sans-serif",
            fontSize: "16px",
            fontWeight: 700,
            color: "var(--white, #FFFDF8)",
            background: `var(--${COLOR}, #5A9099)`,
            border: "none",
            borderRadius: "14px",
            padding: "12px 24px",
            cursor: "pointer",
            transition: "all 0.2s ease",
            boxShadow: `0 3px 10px color-mix(in srgb, var(--${COLOR}) 25%, transparent)`,
            WebkitTapHighlightColor: "transparent",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = `var(--teal-dark, #477a82)`;
            e.currentTarget.style.transform = "scale(1.02)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = `var(--${COLOR}, #5A9099)`;
            e.currentTarget.style.transform = "scale(1)";
          }}
        >
          Save POTS 💙
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
      border: `2px solid var(--${COLOR}, #5A9099)`,
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
          color: `var(--${COLOR}, #5A9099)`,
          margin: 0,
        }}>
          💙 POTS
        </h3>
        <span style={{
          fontFamily: "'Nunito', sans-serif",
          fontSize: "12px",
          color: "var(--brown-light, #9A7E7E)",
        }}>
          ~1.5 min
        </span>
      </div>

      <SectionProgress total={2} current={step} colorClass={COLOR} />

      {/* Step 0: HR + Dizziness + Fainting */}
      {step >= 0 && (
        <div style={{
          display: "flex",
          flexDirection: "column",
          gap: "12px",
        }}>
          {/* Heart rate on standing */}
          <div style={{
            background: "var(--cream, #FAF5EB)",
            borderRadius: "14px",
            padding: "12px 14px",
            border: "1.5px solid var(--tan-light, #EDE3CF)",
          }}>
            <label style={{
              fontFamily: "'Nunito', sans-serif",
              fontSize: "14px",
              fontWeight: 600,
              color: "var(--brown, #3B2F2F)",
              display: "block",
              marginBottom: "8px",
            }}>
              ❤️ Heart rate on standing <span style={{
                fontWeight: 400,
                color: "var(--brown-light)",
                fontSize: "12px",
              }}>(optional, bpm)</span>
            </label>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <input
                type="number"
                inputMode="numeric"
                placeholder="e.g. 120"
                value={data.heartRate || ""}
                onChange={(e) => onUpdate?.("heartRate", e.target.value ? Number(e.target.value) : null)}
                style={{
                  width: "100px",
                  padding: "10px 12px",
                  fontFamily: "'Nunito', sans-serif",
                  fontSize: "16px",
                  fontWeight: 600,
                  color: "var(--brown, #3B2F2F)",
                  background: "var(--white, #FFFDF8)",
                  border: "1.5px solid var(--tan, #D4C5A9)",
                  borderRadius: "12px",
                  outline: "none",
                  textAlign: "center",
                  transition: "border-color 0.2s ease",
                }}
                onFocus={(e) => e.target.style.borderColor = `var(--${COLOR})`}
                onBlur={(e) => e.target.style.borderColor = "var(--tan, #D4C5A9)"}
              />
              <span style={{
                fontFamily: "'Nunito', sans-serif",
                fontSize: "14px",
                color: "var(--brown-light, #9A7E7E)",
              }}>
                bpm
              </span>
            </div>
          </div>

          {/* Dizziness */}
          <SymptomToggle
            label="Dizziness"
            emoji="😵‍💫"
            value={data.dizziness ?? null}
            severity={data.dizzinessSeverity ?? null}
            onToggle={(v) => onUpdate?.("dizziness", v)}
            onSeverity={(i) => onUpdate?.("dizzinessSeverity", i)}
            colorClass={COLOR}
          />

          {/* Fainting */}
          <div style={{
            background: "var(--cream, #FAF5EB)",
            borderRadius: "14px",
            padding: "12px 14px",
            border: data.fainting
              ? `1.5px solid var(--${COLOR}, #5A9099)`
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
                🫠 Fainting / near-fainting
              </span>
              <TogglePair
                value={data.fainting ?? null}
                onChange={(v) => onUpdate?.("fainting", v)}
                colorClass={COLOR}
              />
            </div>
          </div>

          {/* Advance button */}
          <button
            onClick={() => { playTap(); setStep(1); }}
            style={{
              fontFamily: "'Nunito', sans-serif",
              fontSize: "14px",
              fontWeight: 600,
              color: `var(--${COLOR}, #5A9099)`,
              background: "transparent",
              border: `1.5px solid var(--${COLOR}, #5A9099)`,
              borderRadius: "12px",
              padding: "10px",
              cursor: "pointer",
              transition: "all 0.2s ease",
              WebkitTapHighlightColor: "transparent",
            }}
          >
            More symptoms →
          </button>
        </div>
      )}

      {/* Step 1: Palpitations + Nausea + Flushing + Temp */}
      {step >= 1 && (
        <div style={{
          display: "flex",
          flexDirection: "column",
          gap: "12px",
          animation: "pots-reveal 0.3s ease-out",
        }}>
          {/* Palpitations */}
          <SymptomToggle
            label="Palpitations"
            emoji="💓"
            value={data.palpitations ?? null}
            severity={data.palpitationsSeverity ?? null}
            onToggle={(v) => onUpdate?.("palpitations", v)}
            onSeverity={(i) => onUpdate?.("palpitationsSeverity", i)}
            colorClass={COLOR}
          />

          {/* Nausea */}
          <SymptomToggle
            label="Nausea"
            emoji="🤢"
            value={data.nausea ?? null}
            severity={data.nauseaSeverity ?? null}
            onToggle={(v) => onUpdate?.("nausea", v)}
            onSeverity={(i) => onUpdate?.("nauseaSeverity", i)}
            colorClass={COLOR}
          />

          {/* Skin flushing — no severity */}
          <div style={{
            background: "var(--cream, #FAF5EB)",
            borderRadius: "14px",
            padding: "12px 14px",
            border: data.skinFlushing
              ? `1.5px solid var(--${COLOR}, #5A9099)`
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
                🔴 Skin flushing
              </span>
              <TogglePair
                value={data.skinFlushing ?? null}
                onChange={(v) => onUpdate?.("skinFlushing", v)}
                colorClass={COLOR}
              />
            </div>
          </div>

          {/* Temperature sensitivity */}
          <div style={{
            background: "var(--cream, #FAF5EB)",
            borderRadius: "14px",
            padding: "12px 14px",
            border: data.tempSensitivity
              ? `1.5px solid var(--${COLOR}, #5A9099)`
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
                🌡️ Temperature sensitivity
              </span>
              <TogglePair
                value={data.tempSensitivity ?? null}
                onChange={(v) => onUpdate?.("tempSensitivity", v)}
                colorClass={COLOR}
              />
            </div>

            {/* Hot / Cold / Both selector */}
            {data.tempSensitivity && (
              <div style={{
                display: "flex",
                gap: "8px",
                marginTop: "10px",
                paddingTop: "10px",
                borderTop: "1px solid var(--tan-light, #EDE3CF)",
                animation: "pots-reveal 0.25s ease-out",
              }}>
                {TEMP_OPTIONS.map((opt) => {
                  const isActive = data.tempType === opt.id;
                  return (
                    <button
                      key={opt.id}
                      onClick={() => { playTap(); onUpdate?.("tempType", opt.id); }}
                      aria-pressed={isActive}
                      style={{
                        flex: 1,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: "3px",
                        padding: "8px",
                        border: isActive
                          ? `2px solid var(--${COLOR}, #5A9099)`
                          : "2px solid var(--tan-light, #EDE3CF)",
                        borderRadius: "12px",
                        background: isActive
                          ? `color-mix(in srgb, var(--${COLOR}) 10%, var(--white))`
                          : "var(--white, #FFFDF8)",
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                        WebkitTapHighlightColor: "transparent",
                      }}
                    >
                      <span style={{ fontSize: "20px" }}>{opt.emoji}</span>
                      <span style={{
                        fontFamily: "'Nunito', sans-serif",
                        fontSize: "12px",
                        fontWeight: isActive ? 700 : 500,
                        color: isActive
                          ? `var(--${COLOR}, #5A9099)`
                          : "var(--brown-light, #9A7E7E)",
                      }}>
                        {opt.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
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
          background: `var(--${COLOR}, #5A9099)`,
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
          e.currentTarget.style.background = `var(--teal-dark, #477a82)`;
          e.currentTarget.style.transform = "scale(1.02)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = `var(--${COLOR}, #5A9099)`;
          e.currentTarget.style.transform = "scale(1)";
        }}
      >
        Save POTS 💙
      </button>

      <SkipLink onSkip={onSkip} />

      <style>{`
        @keyframes pots-reveal {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}