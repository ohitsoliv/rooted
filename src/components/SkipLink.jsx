// src/components/SkipLink.jsx — Rooted Health Tracker
// Warm, guilt-free skip link — shown on every section

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
 * SkipLink
 *
 * Props:
 *   onSkip — () => void
 *   label  — custom text (default: "Not feeling this one — skip →")
 */
export default function SkipLink({
  onSkip,
  label = "Not feeling this one — skip →",
}) {
  return (
    <button
      className="skip-link"
      onClick={() => { playTap(); onSkip?.(); }}
      style={{
        display: "block",
        margin: "12px auto 0",
        background: "none",
        border: "none",
        cursor: "pointer",
        fontFamily: "'Nunito', sans-serif",
        fontSize: "13px",
        fontWeight: 500,
        color: "var(--brown-light, #9A7E7E)",
        padding: "8px 12px",
        borderRadius: "8px",
        transition: "all 0.15s ease",
        WebkitTapHighlightColor: "transparent",
        textDecoration: "none",
        letterSpacing: "0.01em",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.color = "var(--brown, #3B2F2F)";
        e.currentTarget.style.background = "var(--tan-light, #EDE3CF)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.color = "var(--brown-light, #9A7E7E)";
        e.currentTarget.style.background = "none";
      }}
    >
      {label}
    </button>
  );
}