// src/components/Question.jsx — Rooted Health Tracker
// Renders any question from src/questions.js. Every choice question gets a
// "Don't know" chip, stored as "dk" (distinct from skipping).

import { Link } from "react-router-dom";
import { DK, hasDk, FILL_IN_MAX } from "../questions";
import { playTap } from "../utils";

const font = "'Nunito', sans-serif";

function Chip({ selected, onClick, children, color, muted = false, block = false, emoji }) {
  const c = `var(--${color}, var(--terra))`;
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={() => { playTap(); onClick(); }}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
        width: block ? "100%" : "auto",
        textAlign: "left",
        padding: block ? "11px 14px" : "8px 13px",
        fontFamily: font,
        fontSize: "14px",
        fontWeight: selected ? 700 : 600,
        lineHeight: 1.25,
        color: selected ? c : muted ? "var(--brown-light)" : "var(--brown)",
        background: selected ? `color-mix(in srgb, ${c} 12%, var(--white))` : "var(--white)",
        border: selected ? `2px solid ${c}` : "1.5px solid var(--tan-light)",
        borderStyle: muted && !selected ? "dashed" : "solid",
        borderRadius: block ? "14px" : "999px",
        cursor: "pointer",
        transition: "all 0.15s ease",
        WebkitTapHighlightColor: "transparent",
      }}
    >
      {emoji && <span style={{ fontSize: "20px", lineHeight: 1 }}>{emoji}</span>}
      <span>{children}</span>
    </button>
  );
}

function Faces({ q, value, onChange, color }) {
  const c = `var(--${color}, var(--terra))`;
  return (
    <div role="radiogroup" aria-label={q.prompt} style={{ display: "flex", justifyContent: "space-between", gap: "4px" }}>
      {q.options.map((opt) => {
        const sel = value === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            role="radio"
            aria-checked={sel}
            onClick={() => { playTap(); onChange(sel ? undefined : opt.id); }}
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "4px",
              padding: "8px 2px",
              border: sel ? `2px solid ${c}` : "2px solid transparent",
              borderRadius: "14px",
              background: sel ? `color-mix(in srgb, ${c} 12%, transparent)` : "transparent",
              cursor: "pointer",
              WebkitTapHighlightColor: "transparent",
            }}
          >
            <span style={{ fontSize: "30px", lineHeight: 1, filter: sel ? "none" : "grayscale(35%)" }}>{opt.emoji}</span>
            <span style={{ fontFamily: font, fontSize: "11px", fontWeight: sel ? 700 : 600, color: sel ? c : "var(--brown-light)", textAlign: "center", lineHeight: 1.2 }}>
              {opt.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

const inputStyle = {
  width: "100%",
  padding: "10px 12px",
  fontFamily: font,
  fontSize: "15px",
  color: "var(--brown)",
  background: "var(--white)",
  border: "1.5px solid var(--tan)",
  borderRadius: "12px",
  outline: "none",
};

const WEAR_OFF = [
  { id: "still", label: "Still working" },
  { id: "afternoon", label: "Afternoon" },
  { id: "evening", label: "Evening" },
  { id: "didntNotice", label: "Didn't notice" },
];

const MED_STATUS = [
  { id: "onTime", label: "On time" },
  { id: "late", label: "Late" },
  { id: "missed", label: "Missed" },
];

function MedsQuestion({ value, onChange, color, profile }) {
  const meds = (profile?.meds || []).filter((m) => !m.stopped);
  const v = value && typeof value === "object" ? value : {};
  const set = (medId, patch) => onChange({ ...v, [medId]: { ...(v[medId] || {}), ...patch } });

  if (meds.length === 0) {
    return (
      <div style={{ fontFamily: font, fontSize: "13px", color: "var(--brown-light)" }}>
        Add your medications in <Link to="/settings" style={{ color: `var(--${color})`, fontWeight: 700 }}>Settings</Link> to track each one.
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "10px" }}>
          {[...MED_STATUS, { id: "none", label: "No meds" }].map((s) => (
            <Chip key={s.id} color={color} selected={v._all === s.id} onClick={() => onChange({ ...v, _all: v._all === s.id ? undefined : s.id })}>
              {s.label}
            </Chip>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
      {meds.map((m) => {
        const mv = v[m.id] || {};
        return (
          <div key={m.id} style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <span style={{ fontFamily: font, fontSize: "13px", fontWeight: 700, color: "var(--brown)" }}>
              {m.name}{m.dose ? ` · ${m.dose}` : ""}
            </span>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {MED_STATUS.map((s) => (
                <Chip key={s.id} color={color} selected={mv.status === s.id} onClick={() => set(m.id, { status: mv.status === s.id ? undefined : s.id })}>
                  {s.label}
                </Chip>
              ))}
              <Chip color={color} muted selected={mv.status === DK} onClick={() => set(m.id, { status: mv.status === DK ? undefined : DK })}>
                Don't know
              </Chip>
            </div>
            {m.stimulant && mv.status && mv.status !== "missed" && mv.status !== DK && (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px", paddingLeft: "10px", borderLeft: "2px solid var(--tan-light)" }}>
                <label style={{ fontFamily: font, fontSize: "13px", color: "var(--brown)" }}>
                  Time taken{" "}
                  <input type="time" value={mv.time || ""} onChange={(e) => set(m.id, { time: e.target.value || undefined })} style={{ ...inputStyle, width: "auto", padding: "6px 8px", fontSize: "14px" }} />
                </label>
                <span style={{ fontFamily: font, fontSize: "13px", color: "var(--brown)" }}>When did it wear off?</span>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                  {WEAR_OFF.map((w) => (
                    <Chip key={w.id} color={color} selected={mv.woreOff === w.id} onClick={() => set(m.id, { woreOff: mv.woreOff === w.id ? undefined : w.id })}>
                      {w.label}
                    </Chip>
                  ))}
                  <Chip color={color} muted selected={mv.woreOff === DK} onClick={() => set(m.id, { woreOff: mv.woreOff === DK ? undefined : DK })}>
                    Don't know
                  </Chip>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function Question({ q, value, onChange, color = "terra", profile, fillValue, onFillChange }) {
  const dk = hasDk(q);

  let body = null;
  if (q.type === "single" && q.layout === "faces") {
    body = <Faces q={q} value={value} onChange={onChange} color={color} />;
  } else if (q.type === "single") {
    const block = q.layout === "stack";
    body = (
      <div role="radiogroup" aria-label={q.prompt} style={{ display: "flex", flexDirection: block ? "column" : "row", flexWrap: "wrap", gap: "8px" }}>
        {q.options.map((opt) => (
          <Chip key={opt.id} color={color} block={block} emoji={opt.emoji} selected={value === opt.id} onClick={() => onChange(value === opt.id ? undefined : opt.id)}>
            {opt.label}
          </Chip>
        ))}
      </div>
    );
  } else if (q.type === "multi") {
    const arr = Array.isArray(value) ? value : [];
    const toggle = (id) => {
      let next;
      if (arr.includes(id)) next = arr.filter((x) => x !== id);
      else if (id === q.exclusive) next = [id];
      else next = [...arr.filter((x) => x !== DK && x !== q.exclusive), id];
      onChange(next.length ? next : undefined);
    };
    body = (
      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
        {q.options.map((opt) => (
          <Chip key={opt.id} color={color} selected={arr.includes(opt.id)} onClick={() => toggle(opt.id)}>
            {opt.label}
          </Chip>
        ))}
      </div>
    );
  } else if (q.type === "number") {
    body = (
      <input
        type="number"
        inputMode="numeric"
        min={q.min}
        max={q.max}
        value={value ?? ""}
        placeholder="e.g. 95"
        onChange={(e) => {
          const n = e.target.value === "" ? undefined : Number(e.target.value);
          onChange(Number.isFinite(n) ? n : undefined);
        }}
        style={{ ...inputStyle, width: "120px" }}
      />
    );
  } else if (q.type === "text") {
    body = (
      <textarea
        rows={2}
        value={value || ""}
        placeholder={q.placeholder}
        onChange={(e) => onChange(e.target.value || undefined)}
        style={{ ...inputStyle, resize: "vertical" }}
      />
    );
  } else if (q.type === "meds") {
    body = <MedsQuestion value={value} onChange={onChange} color={color} profile={profile} />;
  }

  const isDk = value === DK || (Array.isArray(value) && value.includes(DK));
  const fillOpen = q.fillIn && onFillChange && (Array.isArray(value) ? value.includes(q.fillIn) : value === q.fillIn);

  return (
    <fieldset style={{ border: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "8px", animation: "question-reveal 0.25s ease-out" }}>
      <legend style={{ fontFamily: font, fontSize: "15px", fontWeight: 700, color: "var(--brown)", padding: 0, marginBottom: "8px", lineHeight: 1.35 }}>
        {q.prompt}
        {q.hint && <span style={{ display: "block", fontSize: "12px", fontWeight: 500, color: "var(--brown-light)", marginTop: "2px" }}>{q.hint}</span>}
      </legend>
      {body}
      {fillOpen && (
        <input
          type="text"
          maxLength={FILL_IN_MAX}
          value={fillValue || ""}
          placeholder={`Something else (up to ${FILL_IN_MAX} letters)`}
          aria-label={`${q.prompt} — something else`}
          onChange={(e) => onFillChange(e.target.value || undefined)}
          style={{ ...inputStyle, fontSize: "14px" }}
        />
      )}
      {dk && (
        <div>
          <Chip color={color} muted selected={isDk} onClick={() => onChange(isDk ? undefined : q.type === "multi" ? [DK] : DK)}>
            Don't know
          </Chip>
        </div>
      )}
      <style>{`@keyframes question-reveal { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }`}</style>
    </fieldset>
  );
}
