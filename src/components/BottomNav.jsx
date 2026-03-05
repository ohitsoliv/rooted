// src/components/BottomNav.jsx — Rooted Health Tracker
// Bottom navigation bar — 5 tabs with ripple effect and tap sound

import { useNavigate, useLocation } from "react-router-dom";

const tabs = [
  { id: "home",    label: "Home",    emoji: "🌱", path: "/" },
  { id: "log",     label: "Log",     emoji: "📝", path: "/log" },
  { id: "history", label: "History", emoji: "📅", path: "/history" },
  { id: "summary", label: "Summary", emoji: "📊", path: "/summary" },
  { id: "export",  label: "Export",  emoji: "📤", path: "/export" },
];

/** Tap sound — Web Audio API oscillator */
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

export default function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();

  // Determine active tab from current path
  const activePath = location.pathname;

  const handleTap = (path) => {
    playTap();
    navigate(path);
  };

  return (
    <nav className="bottom-nav" aria-label="Main navigation">
      {tabs.map((tab) => {
        const isActive =
          tab.path === "/"
            ? activePath === "/"
            : activePath.startsWith(tab.path);

        return (
          <button
            key={tab.id}
            className={`bottom-nav__tab ${isActive ? "bottom-nav__tab--active" : ""}`}
            onClick={() => handleTap(tab.path)}
            aria-current={isActive ? "page" : undefined}
          >
            <span className="bottom-nav__emoji">{tab.emoji}</span>
            <span className="bottom-nav__label">{tab.label}</span>
          </button>
        );
      })}

      <style>{`
        .bottom-nav {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          width: 100%;
          z-index: 100;
          display: flex;
          justify-content: space-around;
          align-items: center;
          height: 68px;
          background: var(--white, #FFFDF8);
          border-top: 1.5px solid var(--tan-light, #EDE3CF);
          padding-bottom: env(safe-area-inset-bottom, 0px);
          box-shadow: 0 -2px 12px rgba(59, 47, 47, 0.06);
        }

        @media (min-width: 480px) {
          .bottom-nav {
            max-width: 430px;
            left: 50%;
            right: auto;
            transform: translateX(-50%);
          }
        }

        .bottom-nav__tab {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 2px;
          flex: 1;
          padding: 8px 4px;
          border: none;
          background: transparent;
          cursor: pointer;
          position: relative;
          overflow: hidden;
          border-radius: 12px;
          margin: 4px 2px;
          transition: background 0.2s ease, transform 0.15s ease;
          -webkit-tap-highlight-color: transparent;
        }

        .bottom-nav__tab:active {
          transform: scale(0.92);
          background: var(--tan-light, #EDE3CF);
        }

        .bottom-nav__tab--active {
          background: var(--tan-light, #EDE3CF);
        }

        .bottom-nav__tab--active .bottom-nav__label {
          color: var(--terra, #C1724F);
          font-weight: 700;
        }

        .bottom-nav__emoji {
          font-size: 20px;
          line-height: 1;
        }

        .bottom-nav__label {
          font-family: 'Nunito', sans-serif;
          font-size: 11px;
          font-weight: 600;
          color: var(--brown-light, #9A7E7E);
          transition: color 0.2s ease;
          letter-spacing: 0.01em;
        }

        /* Leave room for the nav bar */
        body {
          padding-bottom: 80px;
        }
      `}</style>
    </nav>
  );
}
