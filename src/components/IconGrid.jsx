// src/components/IconGrid.jsx — Rooted Health Tracker
// Tappable icon/emoji grid — single-select or multi-select

import { useCallback } from "react";

/**
 * IconGrid
 *
 * Props:
 *   options      — [{ emoji, label }]
 *   value        — single-select: label string | multi-select: array of label strings
 *   multiSelect  — boolean (default false)
 *   onSelect     — (value) => void — returns label string or array of labels
 *   colorClass   — "mauve" | "terra" | "sage" | "teal" | "amber" | "gold" (default: "terra")
 *   columns      — number of grid columns (default: auto-fit based on count)
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

export default function IconGrid({
  options = [],
  value = null,
  multiSelect = false,
  onSelect,
  colorClass = "terra",
  columns,
}) {
  const selected = multiSelect
    ? Array.isArray(value) ? value : []
    : value;

  const isSelected = (label) =>
    multiSelect
      ? selected.includes(label)
      : selected === label;

  const handleTap = useCallback(
    (label) => {
      playTap();
      if (multiSelect) {
        const arr = Array.isArray(value) ? value : [];
        const next = arr.includes(label)
          ? arr.filter((l) => l !== label)
          : [...arr, label];
        onSelect?.(next);
      } else {
        // Single select — toggle off if tapping same one
        onSelect?.(value === label ? null : label);
      }
    },
    [multiSelect, value, onSelect]
  );

  const colCount = columns || Math.min(options.length, 4);

  return (
    <div
      className="icon-grid"
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${colCount}, 1fr)`,
        gap: "10px",
      }}
    >
      {options.map((opt) => {
        const active = isSelected(opt.label);
        return (
          <button
            key={opt.label}
            className="icon-grid__item"
            onClick={() => handleTap(opt.label)}
            aria-pressed={active}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "4px",
              padding: "12px 8px",
              border: active ? "2px solid" : "2px solid var(--tan-light, #EDE3CF)",
              borderColor: active
                ? `var(--${colorClass}, var(--terra))`
                : "var(--tan-light, #EDE3CF)",
              borderRadius: "14px",
              background: active
                ? `color-mix(in srgb, var(--${colorClass}, var(--terra)) 10%, var(--white, #FFFDF8))`
                : "var(--white, #FFFDF8)",
              cursor: "pointer",
              transition: "all 0.2s ease",
              transform: active ? "scale(1.04)" : "scale(1)",
              boxShadow: active
                ? `0 2px 8px color-mix(in srgb, var(--${colorClass}, var(--terra)) 20%, transparent)`
                : "0 1px 3px rgba(59,47,47,0.04)",
              WebkitTapHighlightColor: "transparent",
            }}
          >
            <span
              style={{
                fontSize: "28px",
                lineHeight: 1,
                filter: active ? "none" : "grayscale(30%)",
                transition: "filter 0.2s ease",
              }}
            >
              {opt.emoji}
            </span>
            <span
              style={{
                fontFamily: "'Nunito', sans-serif",
                fontSize: "12px",
                fontWeight: active ? 700 : 500,
                color: active
                  ? `var(--${colorClass}, var(--terra))`
                  : "var(--brown-light, #9A7E7E)",
                transition: "color 0.2s ease",
                textAlign: "center",
                lineHeight: 1.2,
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