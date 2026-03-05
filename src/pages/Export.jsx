// src/pages/Export.jsx — Rooted Health Tracker
// Export page: plain text summary, CSV download, JSON backup/restore

import { useState, useCallback, useMemo } from "react";
import BottomNav from "../components/BottomNav";

const MOOD_EMOJIS = ["😢", "😕", "😐", "🙂", "😊"];
const PAIN_EMOJIS = ["😌", "🤏", "😐", "😣", "😫"];
const ENERGY_EMOJIS = ["🪫", "😮‍💨", "😐", "⚡", "🔋"];

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

/**
 * Export
 *
 * Props:
 *   logs       — array of log objects for the month
 *   loading    — boolean
 *   onRestore  — (logsArray) => Promise — restores backup data
 */
export default function Export({ logs = [], loading = false, onRestore }) {
  const [copied, setCopied] = useState(false);
  const [restoreStatus, setRestoreStatus] = useState(null); // null | "success" | "error"
  const [restoring, setRestoring] = useState(false);

  const now = useMemo(() => new Date(), []);
  const monthName = now.toLocaleString("default", { month: "long", year: "numeric" });
  const totalDays = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const flareDays = logs.filter((l) => l.eds?.flareDay).length;

  // --- Plain text summary ---
  const generateSummary = useCallback(() => {
    const lines = [
      "═══════════════════════════════════════",
      `  ROOTED — Health Summary`,
      `  ${monthName}`,
      `  Generated ${now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}`,
      "═══════════════════════════════════════",
      "",
      `Days logged: ${logs.length} of ${totalDays}`,
      `Flare days (EDS): ${flareDays}`,
      "",
    ];

    // Averages
    const moods = logs.map((l) => l.mood?.overallMood).filter((v) => v != null);
    const pains = logs.flatMap((l) => {
      const cis = l.checkins?.checkins || l.checkins || [];
      return Array.isArray(cis) ? cis.map((c) => c.pain).filter((v) => v != null) : [];
    });
    const energies = logs.flatMap((l) => {
      const cis = l.checkins?.checkins || l.checkins || [];
      return Array.isArray(cis) ? cis.map((c) => c.energy).filter((v) => v != null) : [];
    });

    const avgMood = moods.length > 0 ? (moods.reduce((a, b) => a + b, 0) / moods.length).toFixed(1) : "N/A";
    const avgPain = pains.length > 0 ? (pains.reduce((a, b) => a + b, 0) / pains.length).toFixed(1) : "N/A";
    const avgEnergy = energies.length > 0 ? (energies.reduce((a, b) => a + b, 0) / energies.length).toFixed(1) : "N/A";

    lines.push("AVERAGES (scale 0-4):");
    lines.push(`  Mood:   ${avgMood}`);
    lines.push(`  Pain:   ${avgPain}`);
    lines.push(`  Energy: ${avgEnergy}`);
    lines.push("");

    // POTS summary
    const potsLogs = logs.filter((l) => l.pots);
    if (potsLogs.length > 0) {
      const dizzyDays = potsLogs.filter((l) => l.pots.dizziness).length;
      const palpDays = potsLogs.filter((l) => l.pots.palpitations).length;
      const faintDays = potsLogs.filter((l) => l.pots.fainting).length;
      const hrs = potsLogs.map((l) => l.pots.heartRate).filter(Boolean);
      const avgHR = hrs.length > 0 ? Math.round(hrs.reduce((a, b) => a + b, 0) / hrs.length) : null;

      lines.push("POTS:");
      lines.push(`  Dizziness: ${dizzyDays} of ${potsLogs.length} days`);
      lines.push(`  Palpitations: ${palpDays} of ${potsLogs.length} days`);
      lines.push(`  Fainting/near-faint: ${faintDays} of ${potsLogs.length} days`);
      if (avgHR) lines.push(`  Avg standing HR: ${avgHR} bpm`);
      lines.push("");
    }

    // EDS summary
    const edsLogs = logs.filter((l) => l.eds);
    if (edsLogs.length > 0) {
      const jointPainDays = edsLogs.filter((l) => l.eds.jointPain).length;
      const subluxDays = edsLogs.filter((l) => l.eds.subluxation).length;
      const allLocations = edsLogs.flatMap((l) => l.eds.jointPainLocations || []);
      const locationCounts = {};
      allLocations.forEach((loc) => { locationCounts[loc] = (locationCounts[loc] || 0) + 1; });
      const topLocations = Object.entries(locationCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([loc, count]) => `${loc} (${count}x)`)
        .join(", ");

      lines.push("EDS:");
      lines.push(`  Flare days: ${flareDays}`);
      lines.push(`  Joint pain: ${jointPainDays} of ${edsLogs.length} days`);
      lines.push(`  Subluxation: ${subluxDays} of ${edsLogs.length} days`);
      if (topLocations) lines.push(`  Most affected: ${topLocations}`);
      lines.push("");
    }

    // Emotions
    const emotions = {};
    logs.forEach((l) => {
      if (l.mood?.emotion) emotions[l.mood.emotion] = (emotions[l.mood.emotion] || 0) + 1;
    });
    const topEmotions = Object.entries(emotions).sort((a, b) => b[1] - a[1]).slice(0, 5);
    if (topEmotions.length > 0) {
      lines.push("MOST COMMON EMOTIONS:");
      topEmotions.forEach(([e, c]) => lines.push(`  ${e}: ${c}x`));
      lines.push("");
    }

    // Daily breakdown
    lines.push("───────────────────────────────────────");
    lines.push("DAILY BREAKDOWN:");
    lines.push("───────────────────────────────────────");

    logs.forEach((l) => {
      lines.push("");
      lines.push(`📅 ${l.date}`);
      if (l.mood?.overallMood != null) lines.push(`   Mood: ${MOOD_EMOJIS[l.mood.overallMood]} (${l.mood.overallMood}/4)`);
      if (l.mood?.emotionPath) lines.push(`   Emotion: ${l.mood.emotionPath}`);

      const cis = l.checkins?.checkins || l.checkins || [];
      if (Array.isArray(cis) && cis.length > 0) {
        const last = cis[cis.length - 1];
        if (last.pain != null) lines.push(`   Pain: ${PAIN_EMOJIS[last.pain]} (${last.pain}/4)`);
        if (last.energy != null) lines.push(`   Energy: ${ENERGY_EMOJIS[last.energy]} (${last.energy}/4)`);
      }

      if (l.symptoms?.fatigue != null) lines.push(`   Fatigue: ${l.symptoms.fatigue}/4`);
      if (l.pots?.heartRate) lines.push(`   HR standing: ${l.pots.heartRate} bpm`);
      if (l.eds?.flareDay) lines.push("   ⚠️  FLARE DAY");
      if (l.eds?.activityTolerance) lines.push(`   Activity: ${l.eds.activityTolerance}`);
      if (l.habits?.win) lines.push(`   Win: ${l.habits.win}`);
      if (l.habits?.notableEvent) lines.push(`   Note: ${l.habits.notableEvent}`);
    });

    return lines.join("\n");
  }, [logs, monthName, totalDays, flareDays, now]);

  // --- Handlers ---

  const handleCopy = useCallback(() => {
    const text = generateSummary();
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }).catch(() => {});
    playTap();
  }, [generateSummary]);

  const handleCSV = useCallback(() => {
    const headers = [
      "Date", "Mood (0-4)", "Emotion", "Emotion Path", "Pain (0-4)", "Energy (0-4)",
      "Anxiety (0-4)", "Stress (0-4)", "Sleep Quality (0-4)", "Fatigue (0-4)",
      "Flare Day", "Activity Tolerance", "HR Standing (bpm)",
      "Dizziness", "Palpitations", "Fainting",
      "Joint Pain", "Joint Locations", "Subluxation",
      "Hydration (0-4)", "Salt", "Caffeine", "Exercise", "Meds Taken",
      "Homework", "Attendance", "Win", "Notable Event"
    ];

    const rows = logs.map((l) => {
      const cis = l.checkins?.checkins || l.checkins || [];
      const lastCi = Array.isArray(cis) && cis.length > 0 ? cis[cis.length - 1] : {};
      return [
        l.date || "",
        l.mood?.overallMood ?? "",
        l.mood?.emotion || "",
        l.mood?.emotionPath || "",
        lastCi.pain ?? "",
        lastCi.energy ?? "",
        l.mood?.anxiety ?? "",
        l.mood?.stress ?? "",
        l.sleep?.quality ?? "",
        l.symptoms?.fatigue ?? "",
        l.eds?.flareDay ? "YES" : "",
        l.eds?.activityTolerance || "",
        l.pots?.heartRate || "",
        l.pots?.dizziness ? "YES" : "",
        l.pots?.palpitations ? "YES" : "",
        l.pots?.fainting ? "YES" : "",
        l.eds?.jointPain ? "YES" : "",
        (l.eds?.jointPainLocations || []).join("; "),
        l.eds?.subluxation ? "YES" : "",
        l.nutrition?.hydration ?? "",
        l.nutrition?.salt || "",
        l.nutrition?.caffeine || "",
        l.nutrition?.exercise ? "YES" : "",
        l.nutrition?.medsTaken ? "YES" : "",
        l.habits?.homework || "",
        l.habits?.attendance || "",
        `"${(l.habits?.win || "").replace(/"/g, '""')}"`,
        `"${(l.habits?.notableEvent || "").replace(/"/g, '""')}"`,
      ].join(",");
    });

    const csv = [headers.join(","), ...rows].join("\n");
    downloadFile(csv, `rooted-export-${now.toISOString().split("T")[0]}.csv`, "text/csv");
    playTap();
  }, [logs, now]);

  const handleBackup = useCallback(() => {
    const data = JSON.stringify(logs, null, 2);
    downloadFile(data, `rooted-backup-${now.toISOString().split("T")[0]}.json`, "application/json");
    playTap();
  }, [logs, now]);

  const handleRestore = useCallback(async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setRestoring(true);
    setRestoreStatus(null);

    try {
      const text = await file.text();
      const data = JSON.parse(text);

      if (!Array.isArray(data)) {
        throw new Error("Invalid backup format");
      }

      await onRestore?.(data);
      setRestoreStatus("success");
    } catch (err) {
      console.error("Restore failed:", err);
      setRestoreStatus("error");
    } finally {
      setRestoring(false);
      // Reset file input
      e.target.value = "";
    }
  }, [onRestore]);

  if (loading) {
    return (
      <div style={{
        minHeight: "100vh",
        background: "var(--cream, #FAF5EB)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        paddingBottom: "80px",
      }}>
        <span style={{
          fontFamily: "'Nunito', sans-serif",
          fontSize: "16px",
          color: "var(--brown-light, #9A7E7E)",
        }}>
          Loading your data... 📤
        </span>
        <BottomNav />
      </div>
    );
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "var(--cream, #FAF5EB)",
      paddingBottom: "90px",
    }}>
      {/* Header */}
      <header style={{ padding: "16px 20px 12px" }}>
        <h1 style={{
          fontFamily: "'Fraunces', serif",
          fontSize: "24px",
          fontWeight: 700,
          color: "var(--brown, #3B2F2F)",
          margin: "0 0 2px 0",
        }}>
          📤 Export
        </h1>
        <p style={{
          fontFamily: "'Nunito', sans-serif",
          fontSize: "13px",
          color: "var(--brown-light, #9A7E7E)",
          margin: 0,
        }}>
          Share with your doctor or back up your data
        </p>
      </header>

      <main style={{
        padding: "0 16px 20px",
        display: "flex",
        flexDirection: "column",
        gap: "16px",
      }}>
        {/* Quick stats */}
        <div style={{
          background: "var(--white, #FFFDF8)",
          borderRadius: "16px",
          border: "1.5px solid var(--tan-light, #EDE3CF)",
          padding: "14px 16px",
          display: "flex",
          justifyContent: "space-around",
          textAlign: "center",
        }}>
          <QuickStat emoji="📅" value={logs.length} label="Days logged" />
          <QuickStat emoji="🔥" value={flareDays} label="Flare days" />
          <QuickStat emoji="📊" value={`${Math.round((logs.length / totalDays) * 100)}%`} label="Completion" />
        </div>

        {/* Doctor Export */}
        <ExportCard
          emoji="🩺"
          title="Doctor Summary"
          description="A formatted plain-text report you can share with your healthcare provider. Includes averages, POTS/EDS breakdown, and daily details."
        >
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <ActionButton
              label={copied ? "Copied! ✓" : "📋 Copy to Clipboard"}
              onClick={handleCopy}
              primary
              color="teal"
            />
          </div>
        </ExportCard>

        {/* CSV Export */}
        <ExportCard
          emoji="📊"
          title="Spreadsheet (CSV)"
          description="Download your data as a CSV file. Opens in Excel, Google Sheets, or any spreadsheet app. Includes all tracked fields."
        >
          <ActionButton
            label="📥 Download CSV"
            onClick={handleCSV}
            primary
            color="sage"
          />
        </ExportCard>

        {/* Backup & Restore */}
        <ExportCard
          emoji="💾"
          title="Backup & Restore"
          description="Download a full backup of your data as JSON, or restore from a previous backup."
        >
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
            <ActionButton
              label="📦 Download Backup"
              onClick={handleBackup}
              primary
              color="gold"
            />
            <label
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "10px 16px",
                border: "2px solid var(--gold, #C4A96A)",
                borderRadius: "12px",
                background: "var(--white, #FFFDF8)",
                cursor: restoring ? "wait" : "pointer",
                fontFamily: "'Nunito', sans-serif",
                fontSize: "14px",
                fontWeight: 700,
                color: "var(--gold, #C4A96A)",
                transition: "all 0.2s ease",
                opacity: restoring ? 0.6 : 1,
              }}
            >
              📂 Restore Backup
              <input
                type="file"
                accept=".json"
                onChange={handleRestore}
                disabled={restoring}
                style={{ display: "none" }}
              />
            </label>
          </div>

          {restoreStatus === "success" && (
            <p style={{
              fontFamily: "'Nunito', sans-serif",
              fontSize: "13px",
              color: "var(--sage, #7D9B76)",
              margin: "8px 0 0",
              fontWeight: 600,
            }}>
              ✅ Backup restored successfully! Refresh to see your data.
            </p>
          )}
          {restoreStatus === "error" && (
            <p style={{
              fontFamily: "'Nunito', sans-serif",
              fontSize: "13px",
              color: "var(--terra, #C1724F)",
              margin: "8px 0 0",
              fontWeight: 600,
            }}>
              ❌ Restore failed — make sure the file is a valid Rooted backup.
            </p>
          )}
        </ExportCard>

        {/* Privacy note */}
        <p style={{
          fontFamily: "'Nunito', sans-serif",
          fontSize: "12px",
          color: "var(--brown-light, #9A7E7E)",
          textAlign: "center",
          padding: "0 16px",
          lineHeight: 1.5,
        }}>
          🔒 Your data is stored in your personal Firebase account. Exports stay on your device — nothing is shared unless you choose to.
        </p>
      </main>

      <BottomNav />
    </div>
  );
}

/* ---- Helpers ---- */

function downloadFile(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/* ---- Sub-components ---- */

function ExportCard({ emoji, title, description, children }) {
  return (
    <div style={{
      background: "var(--white, #FFFDF8)",
      borderRadius: "20px",
      border: "1.5px solid var(--tan-light, #EDE3CF)",
      padding: "16px",
      display: "flex",
      flexDirection: "column",
      gap: "10px",
    }}>
      <h3 style={{
        fontFamily: "'Fraunces', serif",
        fontSize: "16px",
        fontWeight: 700,
        color: "var(--brown, #3B2F2F)",
        margin: 0,
      }}>
        {emoji} {title}
      </h3>
      <p style={{
        fontFamily: "'Nunito', sans-serif",
        fontSize: "13px",
        color: "var(--brown-light, #9A7E7E)",
        margin: 0,
        lineHeight: 1.5,
      }}>
        {description}
      </p>
      {children}
    </div>
  );
}

function ActionButton({ label, onClick, primary = false, color = "terra" }) {
  const c = `var(--${color})`;
  return (
    <button
      onClick={onClick}
      style={{
        fontFamily: "'Nunito', sans-serif",
        fontSize: "14px",
        fontWeight: 700,
        color: primary ? "var(--white, #FFFDF8)" : c,
        background: primary ? c : "var(--white, #FFFDF8)",
        border: primary ? "none" : `2px solid ${c}`,
        borderRadius: "12px",
        padding: "10px 18px",
        cursor: "pointer",
        transition: "all 0.2s ease",
        WebkitTapHighlightColor: "transparent",
      }}
    >
      {label}
    </button>
  );
}

function QuickStat({ emoji, value, label }) {
  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: "2px",
    }}>
      <span style={{ fontSize: "16px" }}>{emoji}</span>
      <span style={{
        fontFamily: "'Fraunces', serif",
        fontSize: "20px",
        fontWeight: 700,
        color: "var(--brown, #3B2F2F)",
      }}>
        {value}
      </span>
      <span style={{
        fontFamily: "'Nunito', sans-serif",
        fontSize: "11px",
        color: "var(--brown-light, #9A7E7E)",
      }}>
        {label}
      </span>
    </div>
  );
}