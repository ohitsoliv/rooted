// src/components/TogglePair.jsx — Rooted Health Tracker
// Yes / No toggle button pair

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
 * TogglePair
 *
 * Props:
 *   value      — true | false | null
 *   onChange   — (bool) => void
 *   yesLabel   — (default "Yes")
 *   noLabel    — (default "No")
 *   colorClass — "terra" | "sage" | "teal" | "amber" etc. (default: "terra")
 */
export default function TogglePair({
  value = null,
  onChange,
  yesLabel = "Yes",
  noLabel = "No",
  colorClass = "terra",
}) {
  const color = `var(--${colorClass}, var(--terra))`;

  const btnStyle = (isActive) => ({
    fontFamily: "'Nunito', sans-serif",
    fontSize: "14px",
    fontWeight: isActive ? 700 : 600,
    color: isActive ? "var(--white, #FFFDF8)" : "var(--brown-light, #9A7E7E)",
    background: isActive ? color : "var(--white, #FFFDF8)",
    border: isActive ? `2px solid ${color}` : "2px solid var(--tan-light, #EDE3CF)",
    borderRadius: "12px",
    padding: "8px 20px",
    cursor: "pointer",
    transition: "all 0.2s ease",
    flex: 1,
    maxWidth: "120px",
    WebkitTapHighlightColor: "transparent",
  });

  return (
    <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
      <button
        style={btnStyle(value === true)}
        onClick={() => { playTap(); onChange?.(true); }}
        aria-pressed={value === true}
      >
        {yesLabel}
      </button>
      <button
        style={btnStyle(value === false)}
        onClick={() => { playTap(); onChange?.(false); }}
        aria-pressed={value === false}
      >
        {noLabel}
      </button>
    </div>
  );
}