// src/pages/Screeners.jsx — Rooted Health Tracker
// 2-week PHQ-9 + GAD-7. Saved into today's log under `screeners`.

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import BottomNav from "../components/BottomNav";
import { PHQ9, GAD7, FREQUENCY, total } from "../screeners";
import { saveLog, logDayKey } from "../firebase";
import { playTap } from "../utils";

const font = "'Nunito', sans-serif";

function Tool({ tool, answers, setAnswers, onItem }) {
  return (
    <section style={{ background: "var(--white)", borderRadius: "20px", border: "1.5px solid var(--tan-light)", padding: "18px", display: "flex", flexDirection: "column", gap: "18px" }}>
      <p style={{ fontFamily: font, fontSize: "14px", fontWeight: 700, color: "var(--brown)", margin: 0 }}>{tool.stem}</p>
      {tool.items.map((item, i) => (
        <div key={item} style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <span style={{ fontFamily: font, fontSize: "14px", color: "var(--brown)" }}>{i + 1}. {item}</span>
          <div role="radiogroup" aria-label={item} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
            {FREQUENCY.map((f) => {
              const sel = answers[i] === f.id;
              return (
                <button key={f.id} type="button" role="radio" aria-checked={sel}
                  onClick={() => { playTap(); const next = [...answers]; next[i] = f.id; setAnswers(next); onItem?.(i, f.id); }}
                  style={{ fontFamily: font, fontSize: "13px", fontWeight: sel ? 700 : 600, padding: "9px 8px", borderRadius: "12px", cursor: "pointer", color: sel ? "var(--mauve-dark)" : "var(--brown)", background: sel ? "color-mix(in srgb, var(--mauve) 14%, var(--white))" : "var(--white)", border: sel ? "2px solid var(--mauve)" : "1.5px solid var(--tan-light)" }}>
                  {f.label}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </section>
  );
}

export default function Screeners({ user, onDone, onSafety }) {
  const navigate = useNavigate();
  const [phq, setPhq] = useState(Array(PHQ9.items.length).fill(null));
  const [gad, setGad] = useState(Array(GAD7.items.length).fill(null));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const complete = phq.every((a) => a !== null) && gad.every((a) => a !== null);

  const save = async () => {
    setSaving(true);
    const today = logDayKey();
    const result = await saveLog(user.uid, today, {
      screeners: { phq9: phq, gad7: gad, phq9Total: total(phq), gad7Total: total(gad), takenAt: new Date().toISOString() },
    });
    if (!result.ok) {
      setSaving(false);
      setError("That didn't save — please try again.");
      return;
    }
    await onDone?.(today);
    setSaving(false);
    navigate("/");
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--cream)", paddingBottom: "100px" }}>
      <header style={{ padding: "16px 20px 8px" }}>
        <button onClick={() => navigate("/")} style={{ background: "none", border: "none", fontFamily: font, fontSize: "14px", fontWeight: 600, color: "var(--brown-light)", cursor: "pointer", padding: 0 }}>← Home (do it later)</button>
        <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: "22px", color: "var(--brown)", margin: "8px 0 4px" }}>2-week check</h1>
        <p style={{ fontFamily: font, fontSize: "13px", color: "var(--brown-light)", margin: 0 }}>
          Same questions every 2 weeks. The wording is fixed, so a best guess is fine.
        </p>
      </header>
      <main style={{ padding: "8px 16px", display: "flex", flexDirection: "column", gap: "14px", maxWidth: "560px", margin: "0 auto" }}>
        <Tool tool={PHQ9} answers={phq} setAnswers={setPhq} onItem={(i, v) => { if (i === 8 && v > 0) onSafety?.("phq9"); }} />
        <Tool tool={GAD7} answers={gad} setAnswers={setGad} />
        {error && <p role="alert" style={{ fontFamily: font, fontSize: "13px", fontWeight: 700, color: "var(--terra-dark)", margin: 0 }}>{error}</p>}
        <button type="button" disabled={!complete || saving} onClick={save}
          style={{ fontFamily: font, fontSize: "15px", fontWeight: 700, color: complete ? "var(--white)" : "var(--brown-light)", background: complete ? "var(--mauve)" : "var(--tan-light)", border: "none", borderRadius: "14px", padding: "14px", cursor: complete ? "pointer" : "not-allowed" }}>
          {saving ? "Saving…" : complete ? "Save 2-week check" : "Answer every question to save"}
        </button>
      </main>
      <BottomNav />
    </div>
  );
}
