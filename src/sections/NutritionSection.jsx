// src/sections/NutritionSection.jsx — Rooted Health Tracker
// Section 7: Nutrition + General — color: gold
// Qualitative only — no counting.
// Fields: hydration, salt, meals x3, caffeine, alcohol, food notes,
//         exercise (y/n + type + feel), meds taken, screen time feel
// Good Enough Mode: hydration + did you eat 3 meals y/n

import { useState, useCallback } from "react";
import EmojiScale from "../components/EmojiScale";
import IconGrid from "../components/IconGrid";
import TogglePair from "../components/TogglePair";
import SectionProgress from "../components/SectionProgress";
import SkipLink from "../components/SkipLink";

const COLOR = "gold";

const HYDRATION_OPTIONS = [
  { emoji: "🏜️", label: "Parched" },
  { emoji: "😐", label: "Low" },
  { emoji: "💧", label: "Okay" },
  { emoji: "💦", label: "Good" },
  { emoji: "🌊", label: "Great" },
];

const SALT_OPTIONS = [
  { id: "low", label: "Low", emoji: "🔻" },
  { id: "medium", label: "Medium", emoji: "🧂" },
  { id: "high", label: "High", emoji: "🔺" },
];

const MEAL_OPTIONS = [
  { id: "nourishing", label: "Nourishing", emoji: "💚" },
  { id: "neutral", label: "Neutral", emoji: "😐" },
  { id: "uncomfortable", label: "Uncomfortable", emoji: "😣" },
  { id: "meh", label: "Ate but meh", emoji: "🤷" },
  { id: "skipped", label: "Skipped", emoji: "⏭️" },
];

const CAFFEINE_OPTIONS = [
  { id: "none", label: "None", emoji: "🚫" },
  { id: "little", label: "A little", emoji: "☕" },
  { id: "moderate", label: "Moderate", emoji: "☕☕" },
  { id: "lot", label: "A lot", emoji: "⚡" },
];

const EXERCISE_TYPES = [
  { emoji: "🚶", label: "Walking" },
  { emoji: "🏃", label: "Running" },
  { emoji: "🧘", label: "Yoga" },
  { emoji: "🏋️", label: "Weights" },
  { emoji: "🏊", label: "Swimming" },
  { emoji: "🚴", label: "Cycling" },
  { emoji: "🤸", label: "Stretching" },
  { emoji: "💃", label: "Dance" },
];

const EXERCISE_FEEL_OPTIONS = [
  { emoji: "😫", label: "Awful" },
  { emoji: "😕", label: "Rough" },
  { emoji: "😐", label: "Okay" },
  { emoji: "🙂", label: "Good" },
  { emoji: "💪", label: "Great" },
];

const SCREEN_OPTIONS = [
  { emoji: "😌", label: "Healthy" },
  { emoji: "😐", label: "Fine" },
  { emoji: "😬", label: "Too much" },
  { emoji: "🫠", label: "Way too much" },
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

/** Pill-style selector row for salt / caffeine */
function PillRow({ options, value, onSelect, colorClass = "gold" }) {
  const color = `var(--${colorClass}, var(--gold))`;
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

/** Single meal row */
function MealRow({ label, emoji, value, onSelect }) {
  return (
    <div style={{ marginBottom: "10px" }}>
      <span style={{
        fontFamily: "'Nunito', sans-serif",
        fontSize: "13px",
        fontWeight: 600,
        color: "var(--brown, #3B2F2F)",
        display: "block",
        marginBottom: "6px",
      }}>
        {emoji} {label}
      </span>
      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
        {MEAL_OPTIONS.map((opt) => {
          const isActive = value === opt.id;
          const color = "var(--gold, #C4A96A)";
          return (
            <button
              key={opt.id}
              onClick={() => { playTap(); onSelect?.(opt.id); }}
              aria-pressed={isActive}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "4px",
                padding: "6px 10px",
                border: isActive ? `2px solid ${color}` : "2px solid var(--tan-light, #EDE3CF)",
                borderRadius: "16px",
                background: isActive
                  ? `color-mix(in srgb, ${color} 10%, var(--white))`
                  : "var(--white, #FFFDF8)",
                cursor: "pointer",
                transition: "all 0.2s ease",
                WebkitTapHighlightColor: "transparent",
                fontFamily: "'Nunito', sans-serif",
                fontSize: "11px",
                fontWeight: isActive ? 700 : 500,
                color: isActive ? color : "var(--brown-light, #9A7E7E)",
              }}
            >
              <span style={{ fontSize: "14px" }}>{opt.emoji}</span>
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/**
 * NutritionSection
 */
export default function NutritionSection({
  data = {},
  onUpdate,
  onSave,
  onSkip,
  onCelebrate,
  goodEnough = false,
}) {
  // Full: step 0 = hydration + salt + meals, step 1 = caffeine + alcohol + notes,
  //       step 2 = exercise + meds + screen
  const [step, setStep] = useState(0);

  const handleSave = useCallback(() => {
    onSave?.();
    onCelebrate?.({
      emoji: "🍽️",
      title: "Nutrition logged!",
      msg: randomMsg(),
    });
  }, [onSave, onCelebrate]);

  // Good Enough Mode
  if (goodEnough) {
    return (
      <div style={{
        background: "var(--white, #FFFDF8)",
        borderRadius: "20px",
        border: `2px solid var(--${COLOR}, #C4A96A)`,
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
            color: `var(--${COLOR}, #C4A96A)`,
            margin: 0,
          }}>
            🍽️ Nutrition
          </h3>
          <span style={{
            fontFamily: "'Nunito', sans-serif",
            fontSize: "12px",
            color: "var(--brown-light, #9A7E7E)",
          }}>
            ~15 sec
          </span>
        </div>

        {/* Hydration */}
        <div>
          <label style={{
            fontFamily: "'Nunito', sans-serif",
            fontSize: "14px",
            fontWeight: 600,
            color: "var(--brown, #3B2F2F)",
            display: "block",
            marginBottom: "8px",
          }}>
            How hydrated do you feel?
          </label>
          <EmojiScale
            id="nutrition-hydration"
            options={HYDRATION_OPTIONS}
            value={data.hydration}
            onSelect={(i) => onUpdate?.("hydration", i)}
            colorClass={COLOR}
          />
        </div>

        {/* Did you eat 3 meals */}
        <div>
          <label style={{
            fontFamily: "'Nunito', sans-serif",
            fontSize: "14px",
            fontWeight: 600,
            color: "var(--brown, #3B2F2F)",
            display: "block",
            marginBottom: "8px",
          }}>
            Did you eat 3 meals?
          </label>
          <TogglePair
            value={data.ate3Meals ?? null}
            onChange={(v) => onUpdate?.("ate3Meals", v)}
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
            background: `var(--${COLOR}, #C4A96A)`,
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
          Save Nutrition 🍽️
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
      border: `2px solid var(--${COLOR}, #C4A96A)`,
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
          color: `var(--${COLOR}, #C4A96A)`,
          margin: 0,
        }}>
          🍽️ Nutrition + General
        </h3>
        <span style={{
          fontFamily: "'Nunito', sans-serif",
          fontSize: "12px",
          color: "var(--brown-light, #9A7E7E)",
        }}>
          ~2 min · No counting, just vibes
        </span>
      </div>

      <SectionProgress total={3} current={step} colorClass={COLOR} />

      {/* Step 0: Hydration + Salt + Meals */}
      {step >= 0 && (
        <div style={{
          display: "flex",
          flexDirection: "column",
          gap: "14px",
        }}>
          {/* Hydration */}
          <div>
            <label style={{
              fontFamily: "'Nunito', sans-serif",
              fontSize: "14px",
              fontWeight: 600,
              color: "var(--brown, #3B2F2F)",
              display: "block",
              marginBottom: "8px",
            }}>
              How hydrated do you feel?
            </label>
            <EmojiScale
              id="nutrition-hydration"
              options={HYDRATION_OPTIONS}
              value={data.hydration}
              onSelect={(i) => onUpdate?.("hydration", i)}
              colorClass={COLOR}
            />
          </div>

          {/* Salt intake — labeled for POTS */}
          <div>
            <label style={{
              fontFamily: "'Nunito', sans-serif",
              fontSize: "14px",
              fontWeight: 600,
              color: "var(--brown, #3B2F2F)",
              display: "block",
              marginBottom: "4px",
            }}>
              Salt intake
            </label>
            <span style={{
              fontFamily: "'Nunito', sans-serif",
              fontSize: "11px",
              color: "var(--brown-light, #9A7E7E)",
              display: "block",
              marginBottom: "8px",
            }}>
              Important for POTS management 🧂
            </span>
            <PillRow
              options={SALT_OPTIONS}
              value={data.salt}
              onSelect={(v) => onUpdate?.("salt", v)}
              colorClass={COLOR}
            />
          </div>

          {/* Meals */}
          <div>
            <label style={{
              fontFamily: "'Nunito', sans-serif",
              fontSize: "14px",
              fontWeight: 600,
              color: "var(--brown, #3B2F2F)",
              display: "block",
              marginBottom: "8px",
            }}>
              Meals
            </label>
            <MealRow
              label="Breakfast"
              emoji="🌅"
              value={data.mealBreakfast}
              onSelect={(v) => onUpdate?.("mealBreakfast", v)}
            />
            <MealRow
              label="Lunch"
              emoji="☀️"
              value={data.mealLunch}
              onSelect={(v) => onUpdate?.("mealLunch", v)}
            />
            <MealRow
              label="Dinner"
              emoji="🌙"
              value={data.mealDinner}
              onSelect={(v) => onUpdate?.("mealDinner", v)}
            />
          </div>

          {step === 0 && (
            <button
              onClick={() => { playTap(); setStep(1); }}
              style={{
                fontFamily: "'Nunito', sans-serif",
                fontSize: "14px",
                fontWeight: 600,
                color: `var(--${COLOR}, #C4A96A)`,
                background: "transparent",
                border: `1.5px solid var(--${COLOR}, #C4A96A)`,
                borderRadius: "12px",
                padding: "10px",
                cursor: "pointer",
                transition: "all 0.2s ease",
                WebkitTapHighlightColor: "transparent",
              }}
            >
              More →
            </button>
          )}
        </div>
      )}

      {/* Step 1: Caffeine + Alcohol + Food notes */}
      {step >= 1 && (
        <div style={{
          display: "flex",
          flexDirection: "column",
          gap: "14px",
          animation: "nutrition-reveal 0.3s ease-out",
        }}>
          {/* Caffeine */}
          <div>
            <label style={{
              fontFamily: "'Nunito', sans-serif",
              fontSize: "14px",
              fontWeight: 600,
              color: "var(--brown, #3B2F2F)",
              display: "block",
              marginBottom: "8px",
            }}>
              Caffeine
            </label>
            <PillRow
              options={CAFFEINE_OPTIONS}
              value={data.caffeine}
              onSelect={(v) => onUpdate?.("caffeine", v)}
              colorClass={COLOR}
            />
          </div>

          {/* Alcohol */}
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
              🍷 Alcohol
            </span>
            <TogglePair
              value={data.alcohol ?? null}
              onChange={(v) => onUpdate?.("alcohol", v)}
              colorClass={COLOR}
            />
          </div>

          {/* Food notes */}
          <div>
            <label style={{
              fontFamily: "'Nunito', sans-serif",
              fontSize: "13px",
              fontWeight: 600,
              color: "var(--brown, #3B2F2F)",
              display: "block",
              marginBottom: "6px",
            }}>
              Food notes <span style={{ fontWeight: 400, color: "var(--brown-light)" }}>(optional)</span>
            </label>
            <textarea
              placeholder="Anything to note about food today..."
              value={data.foodNotes || ""}
              onChange={(e) => onUpdate?.("foodNotes", e.target.value)}
              style={{
                width: "100%",
                minHeight: "50px",
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

          {step === 1 && (
            <button
              onClick={() => { playTap(); setStep(2); }}
              style={{
                fontFamily: "'Nunito', sans-serif",
                fontSize: "14px",
                fontWeight: 600,
                color: `var(--${COLOR}, #C4A96A)`,
                background: "transparent",
                border: `1.5px solid var(--${COLOR}, #C4A96A)`,
                borderRadius: "12px",
                padding: "10px",
                cursor: "pointer",
                transition: "all 0.2s ease",
                WebkitTapHighlightColor: "transparent",
              }}
            >
              Almost done →
            </button>
          )}
        </div>
      )}

      {/* Step 2: Exercise + Meds + Screen time */}
      {step >= 2 && (
        <div style={{
          display: "flex",
          flexDirection: "column",
          gap: "14px",
          animation: "nutrition-reveal 0.3s ease-out",
        }}>
          {/* Exercise */}
          <div style={{
            background: "var(--cream, #FAF5EB)",
            borderRadius: "14px",
            padding: "12px 14px",
            border: data.exercise
              ? `1.5px solid var(--${COLOR}, #C4A96A)`
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
                🏃 Exercise
              </span>
              <TogglePair
                value={data.exercise ?? null}
                onChange={(v) => onUpdate?.("exercise", v)}
                colorClass={COLOR}
              />
            </div>

            {data.exercise && (
              <div style={{
                marginTop: "10px",
                paddingTop: "10px",
                borderTop: "1px solid var(--tan-light, #EDE3CF)",
                display: "flex",
                flexDirection: "column",
                gap: "10px",
                animation: "nutrition-reveal 0.25s ease-out",
              }}>
                <div>
                  <span style={{
                    fontFamily: "'Nunito', sans-serif",
                    fontSize: "12px",
                    fontWeight: 600,
                    color: "var(--brown-light, #9A7E7E)",
                    display: "block",
                    marginBottom: "6px",
                  }}>
                    What type? <span style={{ fontWeight: 400 }}>(tap all that apply)</span>
                  </span>
                  <IconGrid
                    options={EXERCISE_TYPES}
                    value={data.exerciseTypes || []}
                    multiSelect
                    onSelect={(val) => onUpdate?.("exerciseTypes", val)}
                    colorClass={COLOR}
                    columns={4}
                  />
                </div>
                <div>
                  <span style={{
                    fontFamily: "'Nunito', sans-serif",
                    fontSize: "12px",
                    fontWeight: 600,
                    color: "var(--brown-light, #9A7E7E)",
                    display: "block",
                    marginBottom: "6px",
                  }}>
                    How did it feel?
                  </span>
                  <EmojiScale
                    id="exercise-feel"
                    options={EXERCISE_FEEL_OPTIONS}
                    value={data.exerciseFeel}
                    onSelect={(i) => onUpdate?.("exerciseFeel", i)}
                    colorClass={COLOR}
                    size="sm"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Meds taken */}
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
              💊 Meds taken
            </span>
            <TogglePair
              value={data.medsTaken ?? null}
              onChange={(v) => onUpdate?.("medsTaken", v)}
              colorClass={COLOR}
            />
          </div>

          {/* Screen time feel */}
          <div>
            <label style={{
              fontFamily: "'Nunito', sans-serif",
              fontSize: "14px",
              fontWeight: 600,
              color: "var(--brown, #3B2F2F)",
              display: "block",
              marginBottom: "8px",
            }}>
              Screen time today
            </label>
            <EmojiScale
              id="screen-time"
              options={SCREEN_OPTIONS}
              value={data.screenTime}
              onSelect={(i) => onUpdate?.("screenTime", i)}
              colorClass={COLOR}
              size="sm"
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
          background: `var(--${COLOR}, #C4A96A)`,
          border: "none",
          borderRadius: "14px",
          padding: "12px 24px",
          cursor: "pointer",
          transition: "all 0.2s ease",
          marginTop: "4px",
          boxShadow: `0 3px 10px color-mix(in srgb, var(--${COLOR}) 25%, transparent)`,
          WebkitTapHighlightColor: "transparent",
        }}
        onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.02)"}
        onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
      >
        Save Nutrition 🍽️
      </button>

      <SkipLink onSkip={onSkip} />

      <style>{`
        @keyframes nutrition-reveal {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}