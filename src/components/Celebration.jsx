// src/components/Celebration.jsx — Rooted Health Tracker
// Full-screen confetti burst + encouraging message overlay

import { useState, useEffect, useRef, useCallback } from "react";

/**
 * Celebration
 *
 * Props:
 *   emoji     — big emoji displayed center (e.g. "🌿")
 *   title     — heading text (e.g. "Sleep logged!")
 *   msg       — encouraging message (randomly picked by parent, or passed in)
 *   onNext    — called when user taps the CTA button
 *   nextLabel — CTA button text (default: "Continue")
 *   colorClass— "mauve" | "terra" | "sage" etc. (default: "sage")
 */

const CONFETTI_COLORS = [
  "#C1724F", // terra
  "#7D9B76", // sage
  "#A07B8A", // mauve
  "#C4A96A", // gold
  "#5A9099", // teal
  "#C49A45", // amber
  "#D4C5A9", // tan
];

const CONFETTI_COUNT = 60;

function createConfettiPiece(i) {
  const color = CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)];
  const left = Math.random() * 100;
  const delay = Math.random() * 0.4;
  const duration = 1.2 + Math.random() * 1.0;
  const size = 6 + Math.random() * 6;
  const rotation = Math.random() * 360;
  const drift = -30 + Math.random() * 60;
  const shape = Math.random() > 0.5 ? "circle" : "rect";

  return {
    id: i,
    color,
    left,
    delay,
    duration,
    size,
    rotation,
    drift,
    shape,
  };
}

/** Play a brighter celebratory sound */
const playCelebration = () => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    // Two quick ascending notes
    [520, 660, 780].forEach((freq, i) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.connect(g);
      g.connect(ctx.destination);
      o.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.08);
      g.gain.setValueAtTime(0.08, ctx.currentTime + i * 0.08);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.08 + 0.2);
      o.start(ctx.currentTime + i * 0.08);
      o.stop(ctx.currentTime + i * 0.08 + 0.2);
    });
  } catch {
    return;
  }
};

export default function Celebration({
  emoji = "🌿",
  title = "Saved!",
  msg = "You showed up. That is the whole thing.",
  onNext,
  nextLabel = "Continue",
  colorClass = "sage",
}) {
  const [visible, setVisible] = useState(false);
  const [confetti] = useState(() =>
    Array.from({ length: CONFETTI_COUNT }, (_, i) => createConfettiPiece(i))
  );
  const soundPlayed = useRef(false);

  // Animate in on mount
  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
    if (!soundPlayed.current) {
      playCelebration();
      soundPlayed.current = true;
    }
  }, []);

  const handleNext = useCallback(() => {
    setVisible(false);
    setTimeout(() => onNext?.(), 250);
  }, [onNext]);

  const color = `var(--${colorClass}, var(--sage))`;
  const colorDark = `var(--${colorClass}-dark, var(--sage-dark))`;

  return (
    <div
      className="celebration-overlay"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 999,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(250, 245, 235, 0.92)",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
        opacity: visible ? 1 : 0,
        transition: "opacity 0.3s ease",
        padding: "24px",
        overflow: "hidden",
      }}
      onClick={handleNext}
    >
      {/* Confetti pieces */}
      {confetti.map((c) => (
        <div
          key={c.id}
          style={{
            position: "absolute",
            top: "-12px",
            left: `${c.left}%`,
            width: c.shape === "circle" ? `${c.size}px` : `${c.size * 0.7}px`,
            height: `${c.size}px`,
            background: c.color,
            borderRadius: c.shape === "circle" ? "50%" : "2px",
            opacity: 0,
            transform: `rotate(${c.rotation}deg)`,
            animation: `celebration-fall ${c.duration}s ease-out ${c.delay}s forwards`,
            pointerEvents: "none",
          }}
        />
      ))}

      {/* Content card */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "12px",
          transform: visible ? "scale(1) translateY(0)" : "scale(0.8) translateY(20px)",
          transition: "transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)",
          zIndex: 1,
        }}
      >
        {/* Big emoji */}
        <span
          style={{
            fontSize: "64px",
            lineHeight: 1,
            animation: "celebration-bounce 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) 0.2s both",
          }}
        >
          {emoji}
        </span>

        {/* Title */}
        <h2
          style={{
            fontFamily: "'Fraunces', serif",
            fontSize: "24px",
            fontWeight: 700,
            color: "var(--brown, #3B2F2F)",
            margin: 0,
            textAlign: "center",
          }}
        >
          {title}
        </h2>

        {/* Encouraging message */}
        <p
          style={{
            fontFamily: "'Nunito', sans-serif",
            fontSize: "15px",
            fontWeight: 500,
            color: "var(--brown-light, #9A7E7E)",
            margin: 0,
            textAlign: "center",
            maxWidth: "280px",
            lineHeight: 1.5,
          }}
        >
          {msg}
        </p>

        {/* Continue button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleNext();
          }}
          style={{
            fontFamily: "'Nunito', sans-serif",
            fontSize: "16px",
            fontWeight: 700,
            color: "var(--white, #FFFDF8)",
            background: color,
            border: "none",
            borderRadius: "20px",
            padding: "12px 32px",
            cursor: "pointer",
            marginTop: "8px",
            transition: "all 0.2s ease",
            boxShadow: `0 4px 12px color-mix(in srgb, ${color} 30%, transparent)`,
            WebkitTapHighlightColor: "transparent",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = colorDark;
            e.currentTarget.style.transform = "scale(1.04)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = color;
            e.currentTarget.style.transform = "scale(1)";
          }}
        >
          {nextLabel}
        </button>
      </div>

      {/* Keyframe animations */}
      <style>{`
        @keyframes celebration-fall {
          0% {
            opacity: 1;
            transform: translateY(0) translateX(0) rotate(0deg);
          }
          100% {
            opacity: 0;
            transform: translateY(calc(100vh + 20px)) translateX(var(--drift, 30px)) rotate(720deg);
          }
        }
        @keyframes celebration-bounce {
          0% {
            transform: scale(0);
            opacity: 0;
          }
          60% {
            transform: scale(1.2);
            opacity: 1;
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
        ${confetti
          .map(
            (c) => `
          .celebration-overlay div:nth-child(${c.id + 1}) {
            --drift: ${c.drift}px;
          }
        `
          )
          .join("")}
      `}</style>
    </div>
  );
}