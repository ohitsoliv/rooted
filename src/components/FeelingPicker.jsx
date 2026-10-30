// src/components/FeelingPicker.jsx — Rooted Health Tracker
// Optional feeling naming, built for alexithymia:
//   • "Name it": tap a main feeling (that alone is a full answer), optionally
//     tap one or more specific words. Up to 2 main feelings, for mixed states.
//   • "Describe how it feels": body sensations, for when words don't come.
//   • "Can't tell" is a real answer, not a skip.
//
// Value shape (stored on the check-in):
//   { feelings: [{ core, words?: [] }], sensations: [ids], cantTell: bool }
//   (older answers may have a single `word` instead of `words`)

import { useState } from "react";
import { playTap } from "../utils";
import { FEELINGS, SENSATIONS } from "../feelings";

const font = "'Nunito', sans-serif";

const MAX = 2;

function Pill({ selected, onClick, children, color, muted }) {
  const c = `var(--${color})`;
  return (
    <button type="button" aria-pressed={selected} onClick={() => { playTap(); onClick(); }}
      style={{
        fontFamily: font, fontSize: "13px", fontWeight: selected ? 700 : 600, padding: "7px 12px", borderRadius: "999px", cursor: "pointer",
        color: selected ? c : muted ? "var(--brown-light)" : "var(--brown)",
        background: selected ? `color-mix(in srgb, ${c} 12%, var(--white))` : "var(--white)",
        border: selected ? `2px solid ${c}` : `1.5px ${muted ? "dashed" : "solid"} var(--tan-light)`,
      }}>
      {children}
    </button>
  );
}

export default function FeelingPicker({ value = {}, onChange, color = "terra" }) {
  const [mode, setMode] = useState(value.sensations?.length && !value.feelings?.length ? "body" : "name");
  const [open, setOpen] = useState(null); // core whose specific words are showing
  const feelings = value.feelings || [];
  const sensations = value.sensations || [];
  const set = (patch) => onChange({ ...value, cantTell: false, ...patch });

  const toggleCore = (core) => {
    const has = feelings.find((f) => f.core === core);
    if (has) {
      set({ feelings: feelings.filter((f) => f.core !== core) });
      if (open === core) setOpen(null);
    } else if (feelings.length < MAX) {
      set({ feelings: [...feelings, { core }] });
      setOpen(core);
    }
  };
  const wordsOf = (f) => f.words || (f.word ? [f.word] : []);
  const toggleWord = (core, word) =>
    set({
      feelings: feelings.map((f) => {
        if (f.core !== core) return f;
        const cur = wordsOf(f);
        const words = cur.includes(word) ? cur.filter((w) => w !== word) : [...cur, word];
        const { word: _old, ...rest } = f;
        return words.length ? { ...rest, words } : rest;
      }),
    });
  const toggleSensation = (id) =>
    set({ sensations: sensations.includes(id) ? sensations.filter((x) => x !== id) : [...sensations, id] });

  const tab = (id, label) => (
    <button type="button" onClick={() => { playTap(); setMode(id); }}
      style={{ flex: 1, fontFamily: font, fontSize: "13px", fontWeight: 700, padding: "8px", cursor: "pointer", border: "none", borderBottom: mode === id ? `2.5px solid var(--${color})` : "2.5px solid transparent", background: "none", color: mode === id ? `var(--${color})` : "var(--brown-light)" }}>
      {label}
    </button>
  );

  const openCore = FEELINGS.find((f) => f.core === open);
  const openSel = feelings.find((f) => f.core === open);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      <div style={{ display: "flex", borderBottom: "1px solid var(--tan-light)" }}>
        {tab("name", "Name it")}
        {tab("body", "Describe how it feels")}
      </div>

      {mode === "name" ? (
        <>
          <span style={{ fontFamily: font, fontSize: "12px", color: "var(--brown-light)" }}>
            Tap the closest one. That's enough — specific words are extra. Pick up to {MAX} if it's mixed.
          </span>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {FEELINGS.map((f) => {
              const sel = feelings.find((x) => x.core === f.core);
              return (
                <Pill key={f.core} color={color} selected={Boolean(sel)} onClick={() => toggleCore(f.core)}>
                  {f.emoji} {f.core}{sel && wordsOf(sel).length ? ` · ${wordsOf(sel).join(", ")}` : ""}
                </Pill>
              );
            })}
          </div>
          {openCore && openSel && (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", padding: "10px", background: "var(--white)", borderRadius: "12px", border: "1.5px solid var(--tan-light)" }}>
              <span style={{ fontFamily: font, fontSize: "12px", fontWeight: 700, color: "var(--brown)" }}>More specific? Pick any (optional)</span>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                {openCore.words.map((w) => (
                  <Pill key={w} color={color} selected={wordsOf(openSel).includes(w)} onClick={() => toggleWord(open, w)}>{w}</Pill>
                ))}
              </div>
              <button type="button" onClick={() => setOpen(null)} style={{ alignSelf: "flex-start", background: "none", border: "none", padding: 0, fontFamily: font, fontSize: "12px", fontWeight: 700, color: `var(--${color})`, cursor: "pointer" }}>
                Done ✓
              </button>
            </div>
          )}
          {feelings.length > 0 && !open && (
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              {feelings.map((f) => (
                <button key={f.core} type="button" onClick={() => setOpen(f.core)} style={{ background: "none", border: "none", padding: 0, fontFamily: font, fontSize: "12px", color: "var(--brown-light)", textDecoration: "underline", cursor: "pointer" }}>
                  More specific {f.core.toLowerCase()} words
                </button>
              ))}
            </div>
          )}
        </>
      ) : (
        <>
          <span style={{ fontFamily: font, fontSize: "12px", color: "var(--brown-light)" }}>It feels… (tap any)</span>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {SENSATIONS.map((s) => (
              <Pill key={s.id} color={color} selected={sensations.includes(s.id)} onClick={() => toggleSensation(s.id)}>{s.label}</Pill>
            ))}
          </div>
        </>
      )}

      <div>
        <Pill color={color} muted selected={Boolean(value.cantTell)}
          onClick={() => onChange(value.cantTell ? {} : { feelings: [], sensations: [], cantTell: true })}>
          Can't tell what it is
        </Pill>
      </div>
    </div>
  );
}
