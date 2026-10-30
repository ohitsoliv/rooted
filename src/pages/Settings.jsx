// src/pages/Settings.jsx — Rooted Health Tracker
// Profile: medications with a dated
// change log, cycle tracking, trusted contact.

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import BottomNav from "../components/BottomNav";
import { dateKey } from "../firebase";
import { SECTIONS, CHECKIN_QUESTIONS, LOCKED_SECTIONS } from "../questions";

const font = "'Nunito', sans-serif";
const card = { background: "var(--white)", borderRadius: "20px", border: "1.5px solid var(--tan-light)", padding: "18px", display: "flex", flexDirection: "column", gap: "12px" };
const h2 = { fontFamily: "'Fraunces', serif", fontSize: "17px", fontWeight: 700, color: "var(--brown)", margin: 0 };
const sub = { fontFamily: font, fontSize: "12px", color: "var(--brown-light)", margin: 0 };
const input = { width: "100%", padding: "9px 11px", fontFamily: font, fontSize: "14px", color: "var(--brown)", background: "var(--white)", border: "1.5px solid var(--tan)", borderRadius: "10px", outline: "none" };
const btn = (primary) => ({ fontFamily: font, fontSize: "13px", fontWeight: 700, color: primary ? "var(--white)" : "var(--brown)", background: primary ? "var(--terra)" : "var(--cream)", border: primary ? "none" : "1.5px solid var(--tan-light)", borderRadius: "10px", padding: "8px 14px", cursor: "pointer" });

function MedCard({ med, onChange }) {
  const [dose, setDose] = useState(med.dose || "");
  const today = dateKey();
  const commitDose = () => {
    if (dose.trim() === (med.dose || "")) return;
    onChange({ ...med, dose: dose.trim(), changes: [...(med.changes || []), { date: today, text: `dose changed to ${dose.trim() || "(blank)"}` }] });
  };
  return (
    <div style={{ border: "1.5px solid var(--tan-light)", borderRadius: "14px", padding: "12px", display: "flex", flexDirection: "column", gap: "8px", opacity: med.stopped ? 0.6 : 1 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px" }}>
        <strong style={{ fontFamily: font, fontSize: "14px", color: "var(--brown)" }}>{med.name}{med.stopped ? " (stopped)" : ""}</strong>
        {!med.stopped && (
          <button type="button" style={btn(false)} onClick={() => onChange({ ...med, stopped: today, changes: [...(med.changes || []), { date: today, text: "stopped" }] })}>Stop</button>
        )}
      </div>
      {!med.stopped && (
        <>
          <label style={{ ...sub, display: "flex", flexDirection: "column", gap: "4px" }}>
            Dose (changing it records the date)
            <input value={dose} onChange={(e) => setDose(e.target.value)} onBlur={commitDose} style={input} />
          </label>
          <label style={{ fontFamily: font, fontSize: "13px", color: "var(--brown)", display: "flex", gap: "8px", alignItems: "center" }}>
            <input type="checkbox" checked={Boolean(med.stimulant)} onChange={(e) => onChange({ ...med, stimulant: e.target.checked })} />
            Stimulant (asks time taken and when it wore off)
          </label>
        </>
      )}
      {(med.changes || []).length > 0 && (
        <p style={sub}>{med.changes.map((c) => `${c.date}: ${c.text}`).join(" · ")}</p>
      )}
    </div>
  );
}

function AddMed({ onAdd }) {
  const [name, setName] = useState("");
  const [dose, setDose] = useState("");
  const [since, setSince] = useState(dateKey());
  const [stimulant, setStimulant] = useState(false);
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!name.trim()) return;
        onAdd({ id: `m${Date.now()}`, name: name.trim(), dose: dose.trim(), stimulant, since, changes: [{ date: since, text: `started${dose.trim() ? ` ${dose.trim()}` : ""}` }] });
        setName(""); setDose(""); setStimulant(false); setSince(dateKey());
      }}
      style={{ display: "flex", flexDirection: "column", gap: "8px", borderTop: "1px solid var(--tan-light)", paddingTop: "12px" }}
    >
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Medication name" style={input} />
      <div style={{ display: "flex", gap: "8px" }}>
        <input value={dose} onChange={(e) => setDose(e.target.value)} placeholder="Dose, e.g. 20 mg" style={input} />
        <input type="date" value={since} onChange={(e) => setSince(e.target.value)} style={{ ...input, width: "auto" }} aria-label="Started on" />
      </div>
      <label style={{ fontFamily: font, fontSize: "13px", color: "var(--brown)", display: "flex", gap: "8px", alignItems: "center" }}>
        <input type="checkbox" checked={stimulant} onChange={(e) => setStimulant(e.target.checked)} /> Stimulant
      </label>
      <button type="submit" style={{ ...btn(true), alignSelf: "flex-start" }}>+ Add medication</button>
    </form>
  );
}

function QuestionChooser({ hidden = [], onChange }) {
  const [open, setOpen] = useState(null);
  const set = new Set(hidden);
  const toggle = (key) => {
    const next = new Set(set);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    onChange([...next]);
  };
  const groups = SECTIONS.map((s) => ({
    id: s.id,
    label: `${s.emoji} ${s.label}`,
    locked: LOCKED_SECTIONS.includes(s.id),
    keyPrefix: s.id === "checkins" ? "checkin" : s.id,
    questions: s.id === "checkins" ? CHECKIN_QUESTIONS : s.questions || [],
  }));
  const row = { display: "flex", gap: "10px", alignItems: "flex-start", fontFamily: font, fontSize: "13px", color: "var(--brown)" };
  return (
    <section style={card}>
      <h2 style={h2}>Choose your questions</h2>
      <p style={sub}>Turn off anything you don't want to see. Nothing is deleted, and you can turn it back on any time. The report notes which questions were off.</p>
      {groups.map((g) => {
        const sectionOn = g.locked || !set.has(g.id);
        const offCount = g.questions.filter((q) => set.has(`${g.keyPrefix}.${q.id}`)).length;
        return (
          <div key={g.id} style={{ borderTop: "1px solid var(--tan-light)", paddingTop: "10px", display: "flex", flexDirection: "column", gap: "8px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px" }}>
              <label style={{ ...row, fontWeight: 700, alignItems: "center" }}>
                <input type="checkbox" checked={sectionOn} disabled={g.locked} onChange={() => toggle(g.id)} />
                {g.label}
              </label>
              {sectionOn && g.questions.length > 0 && (
                <button type="button" onClick={() => setOpen(open === g.id ? null : g.id)} style={{ background: "none", border: "none", fontFamily: font, fontSize: "12px", fontWeight: 700, color: "var(--mauve-dark)", cursor: "pointer" }}>
                  {open === g.id ? "Done" : `Questions${offCount ? ` (${offCount} off)` : ""} ›`}
                </button>
              )}
            </div>
            {open === g.id && sectionOn && (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px", paddingLeft: "24px" }}>
                {g.questions.map((q) => {
                  const key = `${g.keyPrefix}.${q.id}`;
                  return (
                    <label key={key} style={row}>
                      <input type="checkbox" checked={q.safety || !set.has(key)} disabled={q.safety} onChange={() => toggle(key)} />
                      <span>{q.prompt}{q.safety ? " (always asked)" : ""}</span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </section>
  );
}

function ReferencePeriod({ value, onSave }) {
  const [start, setStart] = useState(value?.start || "");
  const [end, setEnd] = useState(value?.end || "");
  const days = start && end ? Math.round((new Date(`${end}T12:00:00`) - new Date(`${start}T12:00:00`)) / 86400000) + 1 : 0;
  const valid = days >= 14 && end <= dateKey();
  return (
    <section style={card}>
      <h2 style={h2}>Okay-period reference</h2>
      <p style={sub}>
        Pick 2+ weeks (already logged) that felt like your usual — not great, not bad. Reports compare against it, so a long low or high stretch can't slowly become the new "usual."
      </p>
      <div style={{ display: "flex", gap: "8px", alignItems: "center", fontFamily: font, fontSize: "13px" }}>
        <input type="date" value={start} max={end || dateKey()} onChange={(e) => setStart(e.target.value)} style={{ ...input, width: "auto" }} aria-label="Okay period start" />
        to
        <input type="date" value={end} min={start} max={dateKey()} onChange={(e) => setEnd(e.target.value)} style={{ ...input, width: "auto" }} aria-label="Okay period end" />
      </div>
      {start && end && !valid && <p style={{ ...sub, color: "var(--terra-dark)" }}>Pick at least 14 days, ending today or earlier.</p>}
      <div style={{ display: "flex", gap: "8px" }}>
        <button type="button" style={btn(true)} disabled={!valid} onClick={() => onSave({ start, end })}>Save</button>
        {value?.start && <button type="button" style={btn(false)} onClick={() => { setStart(""); setEnd(""); onSave(null); }}>Clear</button>}
      </div>
      {value?.start && <p style={sub}>Current: {value.start} to {value.end}. You can change it any time — for example after a med change settles.</p>}
    </section>
  );
}

export default function Settings({ profile, onUpdate }) {
  const navigate = useNavigate();
  const meds = profile.meds || [];
  const contact = profile.trustedContact || { name: "", phone: "" };
  const [c, setC] = useState(contact);

  return (
    <div style={{ minHeight: "100vh", background: "var(--cream)", paddingBottom: "100px" }}>
      <header style={{ padding: "16px 20px 8px", display: "flex", alignItems: "center", gap: "12px" }}>
        <button onClick={() => navigate("/")} style={{ background: "none", border: "none", fontFamily: font, fontSize: "14px", fontWeight: 600, color: "var(--brown-light)", cursor: "pointer" }}>← Home</button>
        <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: "22px", color: "var(--brown)", margin: 0 }}>Settings</h1>
      </header>
      <main style={{ padding: "8px 16px", display: "flex", flexDirection: "column", gap: "14px", maxWidth: "560px", margin: "0 auto" }}>
        <section style={card}>
          <h2 style={h2}>Medications</h2>
          <p style={sub}>Each one gets its own on time / late / missed answer. Dose changes are dated so doctors can line them up with your data.</p>
          {meds.map((m) => (
            <MedCard key={m.id} med={m} onChange={(next) => onUpdate({ meds: meds.map((x) => (x.id === m.id ? next : x)) })} />
          ))}
          <AddMed onAdd={(m) => onUpdate({ meds: [...meds, m] })} />
        </section>

        <section style={card}>
          <h2 style={h2}>Default logging mode</h2>
          <p style={sub}>What each day starts in. You can still switch on the Home screen; it goes back to this the next morning.</p>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {[["full", "Full"], ["good", "Good Enough"], ["bare", "Bare minimum"]].map(([id, label]) => {
              const sel = (profile.defaultMode || "full") === id;
              return (
                <button key={id} type="button" aria-pressed={sel} onClick={() => onUpdate({ defaultMode: id })}
                  style={{ fontFamily: font, fontSize: "13px", fontWeight: sel ? 800 : 600, padding: "8px 13px", borderRadius: "999px", cursor: "pointer", color: sel ? "var(--sage-dark)" : "var(--brown)", background: sel ? "color-mix(in srgb, var(--sage) 12%, var(--white))" : "var(--white)", border: sel ? "2px solid var(--sage)" : "1.5px solid var(--tan-light)" }}>
                  {label}
                </button>
              );
            })}
          </div>
        </section>

        <QuestionChooser hidden={profile.hidden} onChange={(hidden) => onUpdate({ hidden })} />

        <ReferencePeriod value={profile.reference} onSave={(reference) => onUpdate({ reference })} />

        <section style={card}>
          <h2 style={h2}>Period tracking</h2>
          <label style={{ fontFamily: font, fontSize: "14px", color: "var(--brown)", display: "flex", gap: "10px", alignItems: "center" }}>
            <input type="checkbox" checked={Boolean(profile.cycleTracking)} onChange={(e) => onUpdate({ cycleTracking: e.target.checked })} />
            Ask "Period today?" in the Body section
          </label>
          <p style={sub}>Cycles can affect mood, pain, and POTS. The report compares them once 2 cycles are logged.</p>
        </section>

        <section style={card}>
          <h2 style={h2}>Support contact</h2>
          <p style={sub}>Someone you trust. Shown as a call button on the support screen.</p>
          <input value={c.name} onChange={(e) => setC({ ...c, name: e.target.value })} onBlur={() => onUpdate({ trustedContact: c })} placeholder="Name" style={input} />
          <input value={c.phone} onChange={(e) => setC({ ...c, phone: e.target.value })} onBlur={() => onUpdate({ trustedContact: c })} placeholder="Phone number" inputMode="tel" style={input} />
          <p style={{ ...sub, color: "var(--brown)", background: "var(--cream)", padding: "10px", borderRadius: "10px" }}>
            Rooted never contacts anyone for you, including this person. If you answer the safety question with anything other than "No," it shows support options on your screen only.
          </p>
        </section>
      </main>
      <BottomNav />
    </div>
  );
}
