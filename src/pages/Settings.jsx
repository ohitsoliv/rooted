// src/pages/Settings.jsx — Rooted Health Tracker
// Profile: medications with a dated
// change log, cycle tracking, trusted contact.

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import BottomNav from "../components/BottomNav";
import { dateKey } from "../firebase";

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
