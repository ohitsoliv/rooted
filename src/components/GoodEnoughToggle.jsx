// src/components/GoodEnoughToggle.jsx — Rooted Health Tracker
// Toggle for Good Enough Mode — dashed sage border per spec

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
 * GoodEnoughToggle
 *
 * Props:
 *   active   — boolean
 *   onToggle — (bool) => void
 */
export default function GoodEnoughToggle({ active = false, onToggle }) {
  return (
    <button
      onClick={() => { playTap(); onToggle?.(!active); }}
      aria-pressed={active}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "8px",
        width: "100%",
        padding: "12px 16px",
        background: active
          ? "color-mix(in srgb, var(--sage, #7D9B76) 10%, var(--white, #FFFDF8))"
          : "var(--white, #FFFDF8)",
        border: active
          ? "2px solid var(--sage, #7D9B76)"
          : "2px dashed var(--sage, #7D9B76)",
        borderRadius: "14px",
        cursor: "pointer",
        transition: "all 0.2s ease",
        WebkitTapHighlightColor: "transparent",
      }}
    >
      <span style={{ fontSize: "18px", lineHeight: 1 }}>
        {active ? "✅" : "🌿"}
      </span>
      <span style={{
        fontFamily: "'Nunito', sans-serif",
        fontSize: "14px",
        fontWeight: 600,
        color: active ? "var(--sage-dark, #5A7554)" : "var(--sage, #7D9B76)",
      }}>
        {active ? "Good Enough Mode — on" : "Good Enough Mode"}
      </span>
      {!active && (
        <span style={{
          fontFamily: "'Nunito', sans-serif",
          fontSize: "11px",
          color: "var(--brown-light, #9A7E7E)",
        }}>
          (fewer fields)
        </span>
      )}
    </button>
  );
}