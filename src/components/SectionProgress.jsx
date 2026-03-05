// src/components/SectionProgress.jsx — Rooted Health Tracker
// Pill-style step progress indicator for within a section

/**
 * SectionProgress
 *
 * Props:
 *   total      — total number of steps
 *   current    — current step (0-based)
 *   colorClass — "mauve" | "terra" etc. (default: "terra")
 */
function SectionProgress({
  total = 3,
  current = 0,
  colorClass = "terra",
}) {
  const color = `var(--${colorClass}, var(--terra))`;

  return (
    <div
      style={{
        display: "flex",
        gap: "6px",
        justifyContent: "center",
        padding: "4px 0",
      }}
      aria-label={`Step ${current + 1} of ${total}`}
    >
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          style={{
            width: i === current ? "24px" : "8px",
            height: "8px",
            borderRadius: "4px",
            background: i <= current
              ? color
              : "var(--tan-light, #EDE3CF)",
            transition: "all 0.3s ease",
          }}
        />
      ))}
    </div>
  );
}

export { SectionProgress };
export default SectionProgress;