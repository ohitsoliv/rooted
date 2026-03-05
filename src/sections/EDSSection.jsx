// src/sections/EDSSection.jsx — Rooted Health Tracker
// Section 6: EDS — color: amber
// Fields: jointPain (y/n + severity + body locations), subluxation (y/n + locations),
//         activityTolerance (grid), flareDay (toggle — turns card red)
// Good Enough Mode: flare day + activity tolerance only

import { useState, useCallback } from "react";
import TogglePair from "../components/TogglePair";
import EmojiScale from "../components/EmojiScale";
import IconGrid from "../components/IconGrid";
import SectionProgress from "../components/SectionProgress";
import SkipLink from "../components/SkipLink";

const COLOR = "amber";

const SEVERITY_OPTIONS = [
  { emoji: "😊", label: "Mild" },
  { emoji: "😐", label: "Moderate" },
  { emoji: "😣", label: "Bad" },
  { emoji: "😫", label: "Severe" },
  { emoji: "🆘", label: "Worst" },
];

const BODY_LOCATIONS = [
  { emoji: "🦵", label: "Knee" },
  { emoji: "🤚", label: "Wrist" },
  { emoji: "💪", label: "Shoulder" },
  { emoji: "🦶", label: "Ankle" },
  { emoji: "🖐️", label: "Fingers" },
  { emoji: "🦴", label: "Hip" },
  { emoji: "🔙", label: "Back" },
  { emoji: "🦷", label: "Jaw" },
  { emoji: "👣", label: "Toes" },
  { emoji: "💀", label: "Neck" },
  { emoji: "🦵", label: "Elbow" },
  { emoji: "🫁", label: "Ribs" },
];

const ACTIVITY_OPTIONS = [
  { id: "full", label: "Full", emoji: "🏃" },
  { id: "reduced", label: "Reduced", emoji: "🚶" },
  { id: "veryLimited", label: "Very limited", emoji: "🧘" },
  { id: "bedbound", label: "Bedbound", emoji: "🛏️" },
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

/**
 * EDSSection
 *
 * Props:
 *   data         — current EDS data object
 *   onUpdate     — (field, value) => void
 *   onSave       — () => void
 *   onSkip       — () => void
 *   onCelebrate  — ({ emoji, title, msg }) => void
 *   goodEnough   — boolean
 */
export default function EDSSection({
  data = {},
  onUpdate,
  onSave,
  onSkip,
  onCelebrate,
  goodEnough = false,
}) {
  const [step, setStep] = useState(0);
  // Full: step 0 = flare + activity, step 1 = joint pain, step 2 = subluxation
  const isFlare = data.flareDay === true;

  const handleSave = useCallback(() => {
    onSave?.();
    onCelebrate?.({
      emoji: "🧡",
      title: "EDS logged!",
      msg: randomMsg(),
    });
  }, [onSave, onCelebrate]);

  // Good Enough Mode
  if (goodEnough) {
    return (
      <div style={{
        background: isFlare
          ? "color-mix(in srgb, var(--terra, #C1724F) 6%, var(--white, #FFFDF8))"
          : "var(--white, #FFFDF8)",
        borderRadius: "20px",
        border: isFlare
          ? "2px solid var(--terra, #C1724F)"
          : `2px solid var(--${COLOR}, #C49A45)`,
        padding: "20px",
        display: "flex",
        flexDirection: "column",
        gap: "14px",
        transition: "all 0.3s ease",
      }}>
        <div>
          <h3 style={{
            fontFamily: "'Fraunces', serif",
            fontSize: "18px",
            fontWeight: 700,
            color: `var(--${COLOR}, #C49A45)`,
            margin: 0,
          }}>
            🧡 EDS
          </h3>
          <span style={{
            fontFamily: "'Nunito', sans-serif",
            fontSize: "12px",
            color: "var(--brown-light, #9A7E7E)",
          }}>
            ~15 sec
          </span>
        </div>

        {/* Flare toggle */}
        <FlareToggle value={isFlare} onChange={(v) => onUpdate?.("flareDay", v)} />

        {/* Activity tolerance */}
        <ActivityGrid
          value={data.activityTolerance}
          onSelect={(id) => onUpdate?.("activityTolerance", id)}
        />

        <button
          onClick={handleSave}
          style={{
            fontFamily: "'Nunito', sans-serif",
            fontSize: "16px",
            fontWeight: 700,
            color: "var(--white, #FFFDF8)",
            background: `var(--${COLOR}, #C49A45)`,
            border: "none",
            borderRadius: "14px",
            padding: "12px 24px",
            cursor: "pointer",
            transition: "all 0.2s ease",
            boxShadow: `0 3px 10px color-mix(in srgb, var(--${COLOR}) 25%, transparent)`,
            WebkitTapHighlightColor: "transparent",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "scale(1.02)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "scale(1)";
          }}
        >
          Save EDS 🧡
        </button>
        <SkipLink onSkip={onSkip} />
      </div>
    );
  }

  // Full mode
  return (
    <div style={{
      background: isFlare
        ? "color-mix(in srgb, var(--terra, #C1724F) 6%, var(--white, #FFFDF8))"
        : "var(--white, #FFFDF8)",
      borderRadius: "20px",
      border: isFlare
        ? "2px solid var(--terra, #C1724F)"
        : `2px solid var(--${COLOR}, #C49A45)`,
      padding: "20px",
      display: "flex",
      flexDirection: "column",
      gap: "16px",
      transition: "all 0.3s ease",
    }}>
      {/* Header */}
      <div>
        <h3 style={{
          fontFamily: "'Fraunces', serif",
          fontSize: "18px",
          fontWeight: 700,
          color: `var(--${COLOR}, #C49A45)`,
          margin: 0,
        }}>
          🧡 EDS
        </h3>
        <span style={{
          fontFamily: "'Nunito', sans-serif",
          fontSize: "12px",
          color: "var(--brown-light, #9A7E7E)",
        }}>
          ~1.5 min
        </span>
      </div>

      <SectionProgress total={3} current={step} colorClass={COLOR} />

      {/* Step 0: Flare day + Activity tolerance */}
      {step >= 0 && (
        <div style={{
          display: "flex",
          flexDirection: "column",
          gap: "14px",
        }}>
          <FlareToggle value={isFlare} onChange={(v) => onUpdate?.("flareDay", v)} />
          <ActivityGrid
            value={data.activityTolerance}
            onSelect={(id) => {
              onUpdate?.("activityTolerance", id);
              if (step === 0) setTimeout(() => setStep(1), 300);
            }}
          />
        </div>
      )}

      {/* Step 1: Joint pain */}
      {step >= 1 && (
        <div style={{
          display: "flex",
          flexDirection: "column",
          gap: "12px",
          animation: "eds-reveal 0.3s ease-out",
        }}>
          <div style={{
            background: "var(--cream, #FAF5EB)",
            borderRadius: "14px",
            padding: "12px 14px",
            border: data.jointPain
              ? `1.5px solid var(--${COLOR}, #C49A45)`
              : "1.5px solid var(--tan-light, #EDE3CF)",
            transition: "all 0.2s ease",
          }}>
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: data.jointPain ? "10px" : "0",
            }}>
              <span style={{
                fontFamily: "'Nunito', sans-serif",
                fontSize: "14px",
                fontWeight: 600,
                color: "var(--brown, #3B2F2F)",
              }}>
                🦴 Joint pain
              </span>
              <TogglePair
                value={data.jointPain ?? null}
                onChange={(v) => onUpdate?.("jointPain", v)}
                colorClass={COLOR}
              />
            </div>

            {data.jointPain && (
              <div style={{
                display: "flex",
                flexDirection: "column",
                gap: "10px",
                paddingTop: "10px",
                borderTop: "1px solid var(--tan-light, #EDE3CF)",
                animation: "eds-reveal 0.25s ease-out",
              }}>
                {/* Severity */}
                <div>
                  <span style={{
                    fontFamily: "'Nunito', sans-serif",
                    fontSize: "12px",
                    fontWeight: 600,
                    color: "var(--brown-light, #9A7E7E)",
                    display: "block",
                    marginBottom: "6px",
                  }}>
                    Severity
                  </span>
                  <EmojiScale
                    id="eds-joint-severity"
                    options={SEVERITY_OPTIONS}
                    value={data.jointPainSeverity ?? null}
                    onSelect={(i) => onUpdate?.("jointPainSeverity", i)}
                    colorClass={COLOR}
                    size="sm"
                  />
                </div>

                {/* Body locations — multi-select */}
                <div>
                  <span style={{
                    fontFamily: "'Nunito', sans-serif",
                    fontSize: "12px",
                    fontWeight: 600,
                    color: "var(--brown-light, #9A7E7E)",
                    display: "block",
                    marginBottom: "6px",
                  }}>
                    Where? <span style={{ fontWeight: 400 }}>(tap all that apply)</span>
                  </span>
                  <IconGrid
                    options={BODY_LOCATIONS}
                    value={data.jointPainLocations || []}
                    multiSelect
                    onSelect={(val) => onUpdate?.("jointPainLocations", val)}
                    colorClass={COLOR}
                    columns={4}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Advance */}
          {step === 1 && (
            <button
              onClick={() => { playTap(); setStep(2); }}
              style={{
                fontFamily: "'Nunito', sans-serif",
                fontSize: "14px",
                fontWeight: 600,
                color: `var(--${COLOR}, #C49A45)`,
                background: "transparent",
                border: `1.5px solid var(--${COLOR}, #C49A45)`,
                borderRadius: "12px",
                padding: "10px",
                cursor: "pointer",
                transition: "all 0.2s ease",
                WebkitTapHighlightColor: "transparent",
              }}
            >
              Next →
            </button>
          )}
        </div>
      )}

      {/* Step 2: Subluxation */}
      {step >= 2 && (
        <div style={{
          animation: "eds-reveal 0.3s ease-out",
        }}>
          <div style={{
            background: "var(--cream, #FAF5EB)",
            borderRadius: "14px",
            padding: "12px 14px",
            border: data.subluxation
              ? `1.5px solid var(--${COLOR}, #C49A45)`
              : "1.5px solid var(--tan-light, #EDE3CF)",
            transition: "all 0.2s ease",
          }}>
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: data.subluxation ? "10px" : "0",
            }}>
              <span style={{
                fontFamily: "'Nunito', sans-serif",
                fontSize: "14px",
                fontWeight: 600,
                color: "var(--brown, #3B2F2F)",
              }}>
                ⚡ Subluxation
              </span>
              <TogglePair
                value={data.subluxation ?? null}
                onChange={(v) => onUpdate?.("subluxation", v)}
                colorClass={COLOR}
              />
            </div>

            {data.subluxation && (
              <div style={{
                paddingTop: "10px",
                borderTop: "1px solid var(--tan-light, #EDE3CF)",
                animation: "eds-reveal 0.25s ease-out",
              }}>
                <span style={{
                  fontFamily: "'Nunito', sans-serif",
                  fontSize: "12px",
                  fontWeight: 600,
                  color: "var(--brown-light, #9A7E7E)",
                  display: "block",
                  marginBottom: "6px",
                }}>
                  Where? <span style={{ fontWeight: 400 }}>(tap all that apply)</span>
                </span>
                <IconGrid
                  options={BODY_LOCATIONS}
                  value={data.subluxationLocations || []}
                  multiSelect
                  onSelect={(val) => onUpdate?.("subluxationLocations", val)}
                  colorClass={COLOR}
                  columns={4}
                />
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
          background: `var(--${COLOR}, #C49A45)`,
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
          e.currentTarget.style.transform = "scale(1.02)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "scale(1)";
        }}
      >
        Save EDS 🧡
      </button>

      <SkipLink onSkip={onSkip} />

      <style>{`
        @keyframes eds-reveal {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

/* ---- Sub-components ---- */

function FlareToggle({ value, onChange }) {
  return (
    <button
      onClick={() => { playTap(); onChange?.(!value); }}
      aria-pressed={value}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "10px",
        width: "100%",
        padding: "14px 16px",
        background: value
          ? "color-mix(in srgb, var(--terra, #C1724F) 12%, var(--white, #FFFDF8))"
          : "var(--cream, #FAF5EB)",
        border: value
          ? "2.5px solid var(--terra, #C1724F)"
          : "2px solid var(--tan-light, #EDE3CF)",
        borderRadius: "14px",
        cursor: "pointer",
        transition: "all 0.2s ease",
        WebkitTapHighlightColor: "transparent",
      }}
    >
      <span style={{ fontSize: "22px", lineHeight: 1 }}>
        {value ? "🔥" : "🔥"}
      </span>
      <span style={{
        fontFamily: "'Nunito', sans-serif",
        fontSize: "15px",
        fontWeight: 700,
        color: value ? "var(--terra, #C1724F)" : "var(--brown, #3B2F2F)",
      }}>
        {value ? "Flare day — yes" : "Flare day?"}
      </span>
      {value && (
        <span style={{
          fontFamily: "'Nunito', sans-serif",
          fontSize: "11px",
          color: "var(--terra, #C1724F)",
          fontWeight: 500,
        }}>
          (tap to undo)
        </span>
      )}
    </button>
  );
}

function ActivityGrid({ value, onSelect }) {
  return (
    <div>
      <label style={{
        fontFamily: "'Nunito', sans-serif",
        fontSize: "14px",
        fontWeight: 600,
        color: "var(--brown, #3B2F2F)",
        display: "block",
        marginBottom: "8px",
      }}>
        Activity tolerance
      </label>
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        gap: "8px",
      }}>
        {ACTIVITY_OPTIONS.map((opt) => {
          const isActive = value === opt.id;
          return (
            <button
              key={opt.id}
              onClick={() => { playTap(); onSelect?.(opt.id); }}
              aria-pressed={isActive}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "4px",
                padding: "10px 6px",
                border: isActive
                  ? "2px solid var(--amber, #C49A45)"
                  : "2px solid var(--tan-light, #EDE3CF)",
                borderRadius: "14px",
                background: isActive
                  ? "color-mix(in srgb, var(--amber, #C49A45) 10%, var(--white))"
                  : "var(--white, #FFFDF8)",
                cursor: "pointer",
                transition: "all 0.2s ease",
                WebkitTapHighlightColor: "transparent",
              }}
            >
              <span style={{ fontSize: "22px", lineHeight: 1 }}>{opt.emoji}</span>
              <span style={{
                fontFamily: "'Nunito', sans-serif",
                fontSize: "11px",
                fontWeight: isActive ? 700 : 500,
                color: isActive
                  ? "var(--amber, #C49A45)"
                  : "var(--brown-light, #9A7E7E)",
                textAlign: "center",
                lineHeight: 1.2,
              }}>
                {opt.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}