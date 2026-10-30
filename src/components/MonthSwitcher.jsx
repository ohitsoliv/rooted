export default function MonthSwitcher({ year, month, onMonthChange }) {
  const now = new Date();
  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth();
  const monthName = new Date(year, month, 1).toLocaleString("default", {
    month: "long",
    year: "numeric",
  });

  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "12px",
    }}>
      <button
        type="button"
        aria-label="Previous month"
        onClick={() => onMonthChange(-1)}
        style={buttonStyle}
      >
        ‹
      </button>
      <span style={{
        minWidth: "150px",
        textAlign: "center",
        fontFamily: "'Nunito', sans-serif",
        fontSize: "15px",
        fontWeight: 700,
        color: "var(--brown, #3B2F2F)",
      }}>
        {monthName}
      </span>
      <button
        type="button"
        aria-label="Next month"
        onClick={() => onMonthChange(1)}
        disabled={isCurrentMonth}
        style={{
          ...buttonStyle,
          opacity: isCurrentMonth ? 0.35 : 1,
          cursor: isCurrentMonth ? "default" : "pointer",
        }}
      >
        ›
      </button>
    </div>
  );
}

const buttonStyle = {
  width: "36px",
  height: "36px",
  border: "1.5px solid var(--tan-light, #EDE3CF)",
  borderRadius: "8px",
  background: "var(--white, #FFFDF8)",
  color: "var(--terra, #C1724F)",
  fontSize: "26px",
  lineHeight: 1,
  cursor: "pointer",
};