// src/components/EmojiScale.jsx — Rooted Health Tracker
// Reusable horizontal emoji selector (mood, energy, pain, anxiety, etc.)

import { useCallback } from "react";

/**
 * EmojiScale
 *
 * Props:
 *   id            — unique identifier (used for aria + keys)
 *   options       — [{ emoji, label }] — typically 5 items
 *   value         — currently selected index (0-based) or null
 *   onSelect      — (index) => void
 *   colorClass    — "mauve" | "terra" | "sage" | "teal" | "amber" | "gold" (default: "terra")
 *   size          — "sm" | "md" | "lg" (default: "md")
 */

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

export default function EmojiScale({
  id = "emoji-scale",
  options = [],
  value = null,
  onSelect,
  colorClass = "terra",
  size = "md",
}) {
  const handleSelect = useCallback(
    (index) => {
      playTap();
      onSelect?.(index);
    },
    [onSelect]
  );

  const sizes = {
    sm: { emoji: "24px", label: "10px", gap: "6px", pad: "8px 4px" },
    md: { emoji: "32px", label: "11px", gap: "8px", pad: "10px 6px" },
    lg: { emoji: "40px", label: "12px", gap: "10px", pad: "12px 8px" },
  };
  const s = sizes[size] || sizes.md;

  return (
    <div
      className="emoji-scale"
      role="radiogroup"
      aria-label={id}
      style={{ display: "flex", gap: s.gap, justifyContent: "center" }}
    >
      {options.map((opt, i) => {
        const isSelected = value === i;
        return (
          <button
            key={`${id}-${i}`}
            role="radio"
            aria-checked={isSelected}
            aria-label={opt.label}
            className={`emoji-scale__btn ${isSelected ? "emoji-scale__btn--selected" : ""}`}
            onClick={() => handleSelect(i)}
            data-color={colorClass}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "3px",
              padding: s.pad,
              border: isSelected ? "2px solid" : "2px solid transparent",
              borderColor: isSelected ? `var(--${colorClass}, var(--terra))` : "transparent",
              borderRadius: "14px",
              background: isSelected
                ? `color-mix(in srgb, var(--${colorClass}, var(--terra)) 12%, transparent)`
                : "transparent",
              cursor: "pointer",
              transition: "all 0.2s ease",
              transform: isSelected ? "scale(1.1)" : "scale(1)",
              WebkitTapHighlightColor: "transparent",
              minWidth: "48px",
            }}
          >
            <span
              style={{
                fontSize: s.emoji,
                lineHeight: 1,
                filter: isSelected ? "none" : "grayscale(40%)",
                transition: "filter 0.2s ease",
              }}
            >
              {opt.emoji}
            </span>
            <span
              style={{
                fontFamily: "'Nunito', sans-serif",
                fontSize: s.label,
                fontWeight: isSelected ? 700 : 500,
                color: isSelected
                  ? `var(--${colorClass}, var(--terra))`
                  : "var(--brown-light, #9A7E7E)",
                transition: "color 0.2s ease",
                textAlign: "center",
                lineHeight: 1.2,
                maxWidth: "56px",
              }}
            >
              {opt.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}