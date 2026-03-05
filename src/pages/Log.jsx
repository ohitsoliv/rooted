// src/pages/Log.jsx — Rooted Health Tracker
// Main logging page — orchestrates all 8 sections, celebration overlay, navigation

import { useState, useCallback, useEffect, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import BottomNav from "../components/BottomNav";
import Celebration from "../components/Celebration";
import SleepSection from "../sections/SleepSection";
import CheckInSection from "../sections/CheckInSection";
import MoodSection from "../sections/MoodSection";
import SymptomsSection from "../sections/SymptomsSection";
import POTSSection from "../sections/POTSSection";
import EDSSection from "../sections/EDSSection";
import NutritionSection from "../sections/NutritionSection";
import HabitsSchoolSection from "../sections/HabitsSchoolSection";

const SECTION_ORDER = [
  "sleep",
  "checkins",
  "mood",
  "symptoms",
  "pots",
  "eds",
  "nutrition",
  "habits",
];

const SECTION_META = {
  sleep:     { label: "Sleep",            emoji: "😴", color: "mauve" },
  checkins:  { label: "Check-in",         emoji: "📝", color: "terra" },
  mood:      { label: "Mood",             emoji: "💜", color: "mauve" },
  symptoms:  { label: "Symptoms",         emoji: "🩺", color: "sage" },
  pots:      { label: "POTS",             emoji: "💙", color: "teal" },
  eds:       { label: "EDS",              emoji: "🧡", color: "amber" },
  nutrition: { label: "Nutrition",        emoji: "🍽️", color: "gold" },
  habits:    { label: "Habits + School",  emoji: "⭐", color: "mauve" },
};

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
 * Log
 *
 * Props:
 *   log              — full day log object
 *   completedSections — array of completed section IDs
 *   goodEnough       — boolean
 *   onUpdateField    — (section, field, value) => void
 *   onSaveSection    — (sectionName) => Promise
 *   yesterdayLog     — yesterday's log (for "same as yesterday")
 */
export default function Log({
  log = {},
  completedSections = [],
  goodEnough = false,
  onUpdateField,
  onSaveSection,
  yesterdayLog = null,
}) {
  const location = useLocation();
  const navigate = useNavigate();

  // Determine starting section from navigation state or default to first incomplete
  const initialSection = useMemo(() => {
    const fromState = location.state?.section;
    if (fromState && SECTION_ORDER.includes(fromState)) return fromState;
    const completedSet = new Set(completedSections);
    const next = SECTION_ORDER.find((s) => !completedSet.has(s));
    return next || SECTION_ORDER[0];
  }, [location.state, completedSections]);

  const [activeSection, setActiveSection] = useState(initialSection);
  const [celebration, setCelebration] = useState(null);

  // Scroll to top when section changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [activeSection]);

  const currentIndex = SECTION_ORDER.indexOf(activeSection);
  const meta = SECTION_META[activeSection];
  const completedSet = useMemo(() => new Set(completedSections), [completedSections]);

  // --- Handlers ---

  const handleUpdate = useCallback(
    (field, value) => {
      onUpdateField?.(activeSection, field, value);
    },
    [activeSection, onUpdateField]
  );

  const handleSave = useCallback(async () => {
    await onSaveSection?.(activeSection);
  }, [activeSection, onSaveSection]);

  const handleCelebrate = useCallback((celebrationData) => {
    setCelebration(celebrationData);
  }, []);

  const goToNext = useCallback(() => {
    const nextIndex = currentIndex + 1;
    if (nextIndex < SECTION_ORDER.length) {
      setActiveSection(SECTION_ORDER[nextIndex]);
    } else {
      navigate("/");
    }
  }, [currentIndex, navigate]);

  const handleSkip = useCallback(() => {
    playTap();
    goToNext();
  }, [goToNext]);

  const handleCelebrationDismiss = useCallback(() => {
    setCelebration(null);
    goToNext();
  }, [goToNext]);

  // --- Render active section ---
  const renderSection = () => {
    const sectionProps = {
      data: log[activeSection] || {},
      onUpdate: handleUpdate,
      onSave: handleSave,
      onSkip: handleSkip,
      onCelebrate: handleCelebrate,
      goodEnough,
    };

    switch (activeSection) {
      case "sleep":
        return (
          <SleepSection
            {...sectionProps}
            yesterdayData={yesterdayLog?.sleep || null}
          />
        );
      case "checkins":
        return <CheckInSection {...sectionProps} />;
      case "mood":
        return <MoodSection {...sectionProps} />;
      case "symptoms":
        return <SymptomsSection {...sectionProps} />;
      case "pots":
        return <POTSSection {...sectionProps} />;
      case "eds":
        return <EDSSection {...sectionProps} />;
      case "nutrition":
        return <NutritionSection {...sectionProps} />;
      case "habits":
        return <HabitsSchoolSection {...sectionProps} />;
      default:
        return null;
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "var(--cream, #FAF5EB)",
      paddingBottom: "90px",
    }}>
      {/* Header */}
      <header style={{
        padding: "16px 20px 12px",
        display: "flex",
        flexDirection: "column",
        gap: "10px",
      }}>
        {/* Top row */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}>
          <button
            onClick={() => { playTap(); navigate("/"); }}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              fontFamily: "'Nunito', sans-serif",
              fontSize: "14px",
              fontWeight: 600,
              color: "var(--brown-light, #9A7E7E)",
              padding: "4px 8px",
              borderRadius: "8px",
              transition: "background 0.15s",
              WebkitTapHighlightColor: "transparent",
            }}
          >
            ← Home
          </button>

          <span style={{
            fontFamily: "'Fraunces', serif",
            fontSize: "18px",
            fontWeight: 700,
            color: `var(--${meta.color})`,
          }}>
            {meta.emoji} {meta.label}
          </span>

          {/* Section counter */}
          <span style={{
            fontFamily: "'Nunito', sans-serif",
            fontSize: "13px",
            fontWeight: 600,
            color: "var(--brown-light, #9A7E7E)",
          }}>
            {currentIndex + 1}/{SECTION_ORDER.length}
          </span>
        </div>

        {/* Section tabs */}
        <div style={{
          display: "flex",
          gap: "6px",
          overflowX: "auto",
          padding: "0 0 4px 0",
          WebkitOverflowScrolling: "touch",
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}>
          {SECTION_ORDER.map((id) => {
            const m = SECTION_META[id];
            const isActive = id === activeSection;
            const isDone = completedSet.has(id);
            const color = `var(--${m.color})`;

            return (
              <button
                key={id}
                onClick={() => { playTap(); setActiveSection(id); }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  padding: "6px 12px",
                  border: isActive
                    ? `2px solid ${color}`
                    : "1.5px solid var(--tan-light, #EDE3CF)",
                  borderRadius: "20px",
                  background: isActive
                    ? `color-mix(in srgb, ${color} 10%, var(--white))`
                    : isDone
                      ? `color-mix(in srgb, ${color} 5%, var(--white))`
                      : "var(--white, #FFFDF8)",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  transition: "all 0.2s ease",
                  WebkitTapHighlightColor: "transparent",
                  flexShrink: 0,
                }}
              >
                <span style={{ fontSize: "14px" }}>
                  {isDone ? "✓" : m.emoji}
                </span>
                <span style={{
                  fontFamily: "'Nunito', sans-serif",
                  fontSize: "12px",
                  fontWeight: isActive ? 700 : 500,
                  color: isActive
                    ? color
                    : isDone
                      ? "var(--sage-dark, #5A7554)"
                      : "var(--brown-light, #9A7E7E)",
                }}>
                  {m.label}
                </span>
              </button>
            );
          })}
        </div>
      </header>

      {/* Section content */}
      <main style={{
        padding: "0 16px 20px",
        animation: "log-section-enter 0.3s ease-out",
      }}>
        {renderSection()}
      </main>

      {/* Prev / Next nav at bottom */}
      <div style={{
        display: "flex",
        gap: "10px",
        padding: "0 16px 16px",
        justifyContent: "space-between",
      }}>
        <button
          onClick={() => {
            playTap();
            if (currentIndex > 0) {
              setActiveSection(SECTION_ORDER[currentIndex - 1]);
            }
          }}
          disabled={currentIndex === 0}
          style={{
            fontFamily: "'Nunito', sans-serif",
            fontSize: "13px",
            fontWeight: 600,
            color: currentIndex === 0 ? "var(--tan, #D4C5A9)" : "var(--brown-light, #9A7E7E)",
            background: "var(--white, #FFFDF8)",
            border: "1.5px solid var(--tan-light, #EDE3CF)",
            borderRadius: "12px",
            padding: "10px 16px",
            cursor: currentIndex === 0 ? "not-allowed" : "pointer",
            transition: "all 0.15s ease",
            WebkitTapHighlightColor: "transparent",
          }}
        >
          ← Prev
        </button>

        <button
          onClick={() => {
            playTap();
            if (currentIndex < SECTION_ORDER.length - 1) {
              setActiveSection(SECTION_ORDER[currentIndex + 1]);
            } else {
              navigate("/");
            }
          }}
          style={{
            fontFamily: "'Nunito', sans-serif",
            fontSize: "13px",
            fontWeight: 600,
            color: "var(--white, #FFFDF8)",
            background: `var(--${meta.color})`,
            border: "none",
            borderRadius: "12px",
            padding: "10px 16px",
            cursor: "pointer",
            transition: "all 0.15s ease",
            WebkitTapHighlightColor: "transparent",
          }}
        >
          {currentIndex < SECTION_ORDER.length - 1
            ? "Next →"
            : "Done! 🎉"}
        </button>
      </div>

      {/* Celebration overlay */}
      {celebration && (
        <Celebration
          emoji={celebration.emoji}
          title={celebration.title}
          msg={celebration.msg}
          onNext={handleCelebrationDismiss}
          nextLabel={
            currentIndex < SECTION_ORDER.length - 1
              ? "Next section →"
              : "All done! 🎉"
          }
          colorClass={meta.color}
        />
      )}

      <BottomNav />

      <style>{`
        @keyframes log-section-enter {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        header div::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
}