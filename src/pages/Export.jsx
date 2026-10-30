// src/pages/Export.jsx — Rooted Health Tracker
// Doctor report (print / save as PDF), CSV of raw data, JSON backup/restore.

import { useState, useEffect, useMemo, useCallback } from "react";
import BottomNav from "../components/BottomNav";
import ClinicianReport from "../components/ClinicianReport";
import { fetchLogRange, logDayKey } from "../firebase";
import { buildReport, noteKey, shortDate } from "../analysis/report";
import { normalizeDay, checkinList } from "../analysis/normalize";
import { CHECKIN_QUESTIONS, SECTIONS, labelOf } from "../questions";
import { describeFeeling } from "../feelings";
import { addDays } from "../analysis/patterns";
import { playTap } from "../utils";

const font = "'Nunito', sans-serif";

const RANGES = [
  { id: 30, label: "30 days" },
  { id: 60, label: "60 days" },
  { id: 90, label: "90 days" },
  { id: "custom", label: "Custom" },
];

function downloadFile(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const csvCell = (v) => {
  if (v === null || v === undefined) return "";
  const s = Array.isArray(v) ? v.join("; ") : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
const toCsv = (rows) => rows.map((r) => r.map(csvCell).join(",")).join("\n");

function daysCsv(logs, { includeNotes, includeSubstances }) {
  const qs = SECTIONS.flatMap((s) => (s.questions || []).map((q) => ({ s, q })))
    .filter(({ q }) => q.type !== "meds" && (includeNotes || q.type !== "text") && (includeSubstances || !q.private));
  const head = ["date", "from_memory", "checkins", "mood_avg_0_4", "mood_low", "mood_high", "mind_speed_avg_0_4", "body_energy_avg_0_4", "low_mood_mind_racing", "pain_in_way_max_0_4", "sleep_hours_mid", "meds_missed", "pots_any", "eds_flare", "heart_rate_max",
    ...qs.map(({ s, q }) => `${s.id}.${q.id}`)];
  const rows = logs.map((log) => {
    const d = normalizeDay(log);
    return [d.date, d.backfilled ? "yes" : "", d.checkinCount, d.mood?.toFixed(2), d.moodMin, d.moodMax, d.activation?.toFixed(2), d.body?.toFixed(2), d.mismatch, d.painStop, d.sleepHours, d.medsMissed, d.potsAny, d.flare, d.hrMax,
      ...qs.map(({ s, q }) => labelOf(q, log[s.id]?.[q.id]) + (includeNotes && log[s.id]?.[`${q.id}Other`] ? ` (${log[s.id][`${q.id}Other`]})` : ""))];
  });
  return toCsv([head, ...rows]);
}

function checkinsCsv(logs, { includeNotes }) {
  const qs = CHECKIN_QUESTIONS.filter((q) => includeNotes || q.type !== "text");
  const head = ["date", "time", ...qs.map((q) => q.id), "feeling", "legacy_mood_0_4", "legacy_energy_0_4", "legacy_pain_0_4"];
  const rows = logs.flatMap((log) => checkinList(log).map((ci) => [
    log.date,
    ci.timestamp ? new Date(ci.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "",
    ...qs.map((q) => (q.options ? labelOf(q, ci[q.id]) : ci[q.id])),
    describeFeeling(ci),
    typeof ci.mood === "number" ? ci.mood : "",
    typeof ci.energy === "number" ? ci.energy : "",
    typeof ci.pain === "number" ? ci.pain : "",
  ]));
  return toCsv([head, ...rows]);
}

function Card({ title, description, children }) {
  return (
    <section style={{ background: "var(--white)", borderRadius: "20px", border: "1.5px solid var(--tan-light)", padding: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
      <h3 style={{ fontFamily: "'Fraunces', serif", fontSize: "16px", fontWeight: 700, color: "var(--brown)", margin: 0 }}>{title}</h3>
      {description && <p style={{ fontFamily: font, fontSize: "13px", color: "var(--brown-light)", margin: 0, lineHeight: 1.5 }}>{description}</p>}
      {children}
    </section>
  );
}

function Button({ label, onClick, primary, disabled }) {
  return (
    <button type="button" disabled={disabled} onClick={() => { playTap(); onClick(); }}
      style={{ fontFamily: font, fontSize: "14px", fontWeight: 700, color: primary ? "var(--white)" : "var(--terra)", background: primary ? "var(--terra)" : "var(--white)", border: primary ? "none" : "2px solid var(--terra)", borderRadius: "12px", padding: "10px 16px", cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.5 : 1 }}>
      {label}
    </button>
  );
}

const pill = (sel) => ({ fontFamily: font, fontSize: "13px", fontWeight: sel ? 700 : 600, padding: "7px 13px", borderRadius: "999px", cursor: "pointer", color: sel ? "var(--terra)" : "var(--brown)", background: sel ? "color-mix(in srgb, var(--terra) 12%, var(--white))" : "var(--white)", border: sel ? "2px solid var(--terra)" : "1.5px solid var(--tan-light)" });
const dateInput = { fontFamily: font, fontSize: "14px", padding: "7px 9px", border: "1.5px solid var(--tan)", borderRadius: "10px", background: "var(--white)", color: "var(--brown)" };

export default function Export({ onRestore, user, profile }) {
  const today = logDayKey();
  const [range, setRange] = useState(30);
  const [custom, setCustom] = useState({ start: addDays(today, -29), end: today });
  const start = range === "custom" ? custom.start : addDays(today, -(range - 1));
  const end = range === "custom" ? custom.end : today;

  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [noteKeys, setNoteKeys] = useState([]);
  const [includeSubstances, setIncludeSubstances] = useState(false);
  const [includeNotesCsv, setIncludeNotesCsv] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [restoreStatus, setRestoreStatus] = useState(null);

  useEffect(() => {
    let alive = true;
    if (!user?.uid || !start || !end || start > end) return undefined;
    setLoading(true);
    // 28 extra days before the range feed the personal baseline
    const refStart = profile?.reference?.start;
    const from = refStart && refStart < addDays(start, -28) ? refStart : addDays(start, -28);
    fetchLogRange(user.uid, from, end).then((data) => {
      if (alive) {
        setLogs(data);
        setLoading(false);
      }
    });
    return () => {
      alive = false;
    };
  }, [user?.uid, start, end, profile?.reference?.start]);

  const report = useMemo(
    () => buildReport(logs, profile, { start, end, noteKeys, includeSubstances }),
    [logs, profile, start, end, noteKeys, includeSubstances]
  );

  const toggleNote = (k) => setNoteKeys((cur) => (cur.includes(k) ? cur.filter((x) => x !== k) : cur.length >= 5 ? cur : [...cur, k]));

  const handleBackup = useCallback(async () => {
    const all = await fetchLogRange(user.uid, "2024-01-01", today);
    // Profile rides along as a pseudo-day so Restore brings it back too.
    const withProfile = [...all, { ...profile, date: "_profile" }];
    downloadFile(JSON.stringify(withProfile, null, 2), `rooted-backup-${today}.json`, "application/json");
  }, [user?.uid, today, profile]);

  const handleRestore = useCallback(async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setRestoreStatus(null);
    try {
      const data = JSON.parse(await file.text());
      if (!Array.isArray(data)) throw new Error("Invalid backup format");
      await onRestore?.(data);
      setRestoreStatus("success");
    } catch {
      setRestoreStatus("error");
    } finally {
      e.target.value = "";
    }
  }, [onRestore]);

  if (showReport) {
    return (
      <div className="rr-overlay" style={{ background: "#fff", minHeight: "100vh" }}>
        <div className="no-print" style={{ position: "sticky", top: 0, zIndex: 5, display: "flex", gap: "8px", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", background: "var(--cream)", borderBottom: "1.5px solid var(--tan-light)" }}>
          <button type="button" onClick={() => setShowReport(false)} style={{ background: "none", border: "none", fontFamily: font, fontSize: "14px", fontWeight: 700, color: "var(--brown-light)", cursor: "pointer" }}>← Back</button>
          <Button primary label="Print / Save as PDF" onClick={() => window.print()} />
        </div>
        <ClinicianReport report={report} />
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--cream)", paddingBottom: "100px" }}>
      <header style={{ padding: "16px 20px 8px" }}>
        <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: "24px", color: "var(--brown)", margin: 0 }}>Export</h1>
        <p style={{ fontFamily: font, fontSize: "13px", color: "var(--brown-light)", margin: "4px 0 0" }}>Make a summary for your doctor, or download your data.</p>
      </header>

      <main style={{ padding: "8px 16px", display: "flex", flexDirection: "column", gap: "14px", maxWidth: "560px", margin: "0 auto" }}>
        <Card title="🩺 Doctor report" description="A 2–3 page summary: flags, a mood/sleep chart, and patterns on page 1. Print it or save it as a PDF.">
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {RANGES.map((r) => (
              <button key={r.id} type="button" style={pill(range === r.id)} onClick={() => { playTap(); setRange(r.id); }}>{r.label}</button>
            ))}
          </div>
          {range === "custom" && (
            <div style={{ display: "flex", gap: "8px", alignItems: "center", fontFamily: font, fontSize: "13px" }}>
              <input type="date" value={custom.start} max={custom.end} onChange={(e) => setCustom({ ...custom, start: e.target.value })} style={dateInput} aria-label="Start date" />
              to
              <input type="date" value={custom.end} min={custom.start} max={today} onChange={(e) => setCustom({ ...custom, end: e.target.value })} style={dateInput} aria-label="End date" />
            </div>
          )}
          <p style={{ fontFamily: font, fontSize: "13px", color: "var(--brown)", margin: 0 }}>
            {loading ? "Loading…" : `${shortDate(start)} – ${shortDate(end)}: ${report.logged} of ${report.totalDays} days logged.`}
            {!loading && report.limited && " That's not much yet — the report will say patterns aren't reliable."}
          </p>

          {report.allNotes.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <span style={{ fontFamily: font, fontSize: "13px", fontWeight: 700, color: "var(--brown)" }}>
                Include any notes? <span style={{ fontWeight: 500, color: "var(--brown-light)" }}>Up to 5. None are included unless you pick them.</span>
              </span>
              <div style={{ maxHeight: "180px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "4px" }}>
                {report.allNotes.slice(-60).reverse().map((n) => {
                  const k = noteKey(n);
                  return (
                    <label key={k} style={{ display: "flex", gap: "8px", alignItems: "flex-start", fontFamily: font, fontSize: "13px", color: "var(--brown)" }}>
                      <input type="checkbox" checked={noteKeys.includes(k)} onChange={() => toggleNote(k)} disabled={!noteKeys.includes(k) && noteKeys.length >= 5} />
                      <span><strong>{shortDate(n.date)}</strong> · {n.text}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          <label style={{ display: "flex", gap: "8px", alignItems: "center", fontFamily: font, fontSize: "13px", color: "var(--brown)" }}>
            <input type="checkbox" checked={includeSubstances} onChange={(e) => setIncludeSubstances(e.target.checked)} />
            Include "anything else" substance answers
          </label>

          <Button primary label="Open doctor report" disabled={loading} onClick={() => setShowReport(true)} />
        </Card>

        <Card title="📊 Spreadsheet (CSV)" description="Every answer for the same date range — one file per day, one per check-in. Good for a clinician who wants the raw data, or for an AI to analyze.">
          <label style={{ display: "flex", gap: "8px", alignItems: "center", fontFamily: font, fontSize: "13px", color: "var(--brown)" }}>
            <input type="checkbox" checked={includeNotesCsv} onChange={(e) => setIncludeNotesCsv(e.target.checked)} />
            Include typed notes
          </label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            <Button label="Daily CSV" disabled={loading} onClick={() => downloadFile(daysCsv(logs.filter((l) => l.date >= start), { includeNotes: includeNotesCsv, includeSubstances }), `rooted-days-${start}-to-${end}.csv`, "text/csv")} />
            <Button label="Check-ins CSV" disabled={loading} onClick={() => downloadFile(checkinsCsv(logs.filter((l) => l.date >= start), { includeNotes: includeNotesCsv }), `rooted-checkins-${start}-to-${end}.csv`, "text/csv")} />
          </div>
        </Card>

        <Card title="📦 Backup & restore" description="Download everything as a JSON file, or restore from one.">
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            <Button label="Download backup" onClick={handleBackup} />
            <label style={{ ...pill(false), display: "inline-flex", alignItems: "center", fontSize: "14px", fontWeight: 700, color: "var(--terra)", border: "2px solid var(--terra)", borderRadius: "12px" }}>
              Restore backup
              <input type="file" accept="application/json" onChange={handleRestore} style={{ display: "none" }} />
            </label>
          </div>
          {restoreStatus === "success" && <p style={{ fontFamily: font, fontSize: "13px", color: "var(--sage-dark)", margin: 0 }}>Backup restored. Refresh to see it.</p>}
          {restoreStatus === "error" && <p style={{ fontFamily: font, fontSize: "13px", color: "var(--terra-dark)", margin: 0 }}>Restore failed — make sure it's a Rooted backup file.</p>}
        </Card>
      </main>

      <BottomNav />
    </div>
  );
}
