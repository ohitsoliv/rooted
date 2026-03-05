// src/pages/Login.jsx — Rooted Health Tracker
// Sign-in screen with Google auth

/**
 * Login
 *
 * Props:
 *   onLogin — () => void (triggers Google sign-in)
 *   error   — error message string or null
 */
export default function Login({ onLogin, error }) {
  return (
    <div style={{
      minHeight: "100vh",
      background: "var(--cream, #FAF5EB)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "24px",
      gap: "24px",
    }}>
      {/* Logo area */}
      <div style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "8px",
      }}>
        <span style={{
          fontSize: "64px",
          lineHeight: 1,
          animation: "login-sway 3s ease-in-out infinite",
        }}>
          🌱
        </span>
        <h1 style={{
          fontFamily: "'Fraunces', serif",
          fontSize: "36px",
          fontWeight: 700,
          color: "var(--terra, #C1724F)",
          margin: 0,
        }}>
          Rooted
        </h1>
        <p style={{
          fontFamily: "'Nunito', sans-serif",
          fontSize: "15px",
          color: "var(--brown-light, #9A7E7E)",
          margin: 0,
          textAlign: "center",
          maxWidth: "280px",
          lineHeight: 1.5,
        }}>
          A gentle health tracker built for your brain and your body
        </p>
      </div>

      {/* Features */}
      <div style={{
        display: "flex",
        flexDirection: "column",
        gap: "8px",
        maxWidth: "260px",
      }}>
        {[
          { emoji: "🧠", text: "ADHD-friendly — no overwhelm" },
          { emoji: "💜", text: "Track POTS, EDS & mood" },
          { emoji: "🌿", text: "Grow your streak garden" },
          { emoji: "📊", text: "Patterns & doctor exports" },
        ].map((f) => (
          <div
            key={f.text}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontFamily: "'Nunito', sans-serif",
              fontSize: "13px",
              color: "var(--brown, #3B2F2F)",
            }}
          >
            <span style={{ fontSize: "18px" }}>{f.emoji}</span>
            {f.text}
          </div>
        ))}
      </div>

      {/* Sign in button */}
      <button
        onClick={onLogin}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "10px",
          padding: "14px 28px",
          background: "var(--white, #FFFDF8)",
          border: "2px solid var(--tan, #D4C5A9)",
          borderRadius: "16px",
          cursor: "pointer",
          transition: "all 0.2s ease",
          boxShadow: "0 2px 8px rgba(59, 47, 47, 0.06)",
          WebkitTapHighlightColor: "transparent",
          fontFamily: "'Nunito', sans-serif",
          fontSize: "16px",
          fontWeight: 700,
          color: "var(--brown, #3B2F2F)",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = "var(--terra, #C1724F)";
          e.currentTarget.style.transform = "scale(1.02)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = "var(--tan, #D4C5A9)";
          e.currentTarget.style.transform = "scale(1)";
        }}
      >
        <svg width="20" height="20" viewBox="0 0 48 48">
          <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
          <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
          <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
          <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
        </svg>
        Sign in with Google
      </button>

      {/* Error message */}
      {error && (
        <p style={{
          fontFamily: "'Nunito', sans-serif",
          fontSize: "13px",
          color: "var(--terra, #C1724F)",
          margin: 0,
          textAlign: "center",
          padding: "8px 16px",
          background: "color-mix(in srgb, var(--terra) 8%, var(--cream))",
          borderRadius: "10px",
        }}>
          {error}
        </p>
      )}

      <style>{`
        @keyframes login-sway {
          0%, 100% { transform: rotate(-3deg); }
          50% { transform: rotate(3deg); }
        }
      `}</style>
    </div>
  );
}