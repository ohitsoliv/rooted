// src/components/SafetySupport.jsx — Rooted Health Tracker
// Calm full-screen support options, shown right after a safety answer other
// than "No" (or PHQ-9 item 9 above 0). It never blocks the app.

const font = "'Nunito', sans-serif";

function Action({ href, title, detail, strong }) {
  return (
    <a
      href={href}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "2px",
        padding: "14px 16px",
        borderRadius: "16px",
        textDecoration: "none",
        background: strong ? "var(--terra)" : "var(--white)",
        border: strong ? "none" : "1.5px solid var(--tan)",
        color: strong ? "var(--white)" : "var(--brown)",
        fontFamily: font,
      }}
    >
      <span style={{ fontSize: "16px", fontWeight: 800 }}>{title}</span>
      <span style={{ fontSize: "13px", opacity: 0.85 }}>{detail}</span>
    </a>
  );
}

export default function SafetySupport({ contact, onClose }) {
  const hasContact = contact?.phone?.trim();
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="support-title"
      style={{ position: "fixed", inset: 0, zIndex: 1000, background: "var(--cream)", overflowY: "auto", padding: "28px 20px 40px" }}
    >
      <div style={{ maxWidth: "460px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "14px" }}>
        <span style={{ fontSize: "36px" }}>🌿</span>
        <h1 id="support-title" style={{ fontFamily: "'Fraunces', serif", fontSize: "24px", color: "var(--brown)", margin: 0 }}>
          Thank you for answering that.
        </h1>
        <p style={{ fontFamily: font, fontSize: "15px", color: "var(--brown)", lineHeight: 1.5, margin: 0 }}>
          Those thoughts are worth telling someone about. You can reach a real person any time, for free.
        </p>

        <Action strong href="tel:988" title="Call 988" detail="Suicide & Crisis Lifeline · 24/7" />
        <Action href="sms:988" title="Text 988" detail="Same lifeline, by text" />
        <Action href="sms:741741?&body=HOME" title="Text HOME to 741741" detail="Crisis Text Line · 24/7" />
        {hasContact && <Action href={`tel:${contact.phone.trim()}`} title={`Call ${contact.name || "your support person"}`} detail={contact.phone} />}
        <Action href="tel:911" title="Call 911" detail="If you might act on these thoughts or are in danger right now" />

        <p style={{ fontFamily: font, fontSize: "12px", color: "var(--brown-light)", margin: "4px 0 0" }}>
          Rooted doesn't contact anyone for you. Your answer is saved with today's log and appears on your doctor report.
        </p>

        <button
          type="button"
          onClick={onClose}
          style={{ marginTop: "6px", fontFamily: font, fontSize: "15px", fontWeight: 700, color: "var(--brown)", background: "var(--white)", border: "1.5px solid var(--tan)", borderRadius: "14px", padding: "13px", cursor: "pointer" }}
        >
          Go back to the app
        </button>
      </div>
    </div>
  );
}
