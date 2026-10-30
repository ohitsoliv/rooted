// src/analysis/report.js — Rooted Health Tracker
// Builds every number shown on the doctor report from raw logs.
// Descriptive only: no diagnostic labels anywhere.

import { normalizeDay, answerQuality } from "./normalize";
import { findPatterns, masd, runs, addDays } from "./patterns";
import { QUESTION_INDEX, SAFETY_OPTIONS, SITUATION_TAGS, BODY_LOCATIONS } from "../questions";
import { medChangesInRange } from "../profile";
import { PHQ9, GAD7, band } from "../screeners";

const mean = (a) => (a.length ? a.reduce((s, x) => s + x, 0) / a.length : null);
const vals = (days, f) => days.map((d) => d[f]).filter((x) => x !== null && x !== undefined);
const countTrue = (days, f) => days.filter((d) => d[f] === true).length;
const answered = (days, f) => days.filter((d) => d[f] === true || d[f] === false).length;

export const fmt = (x, digits = 1) => (x == null || Number.isNaN(x) ? "—" : Number(x).toFixed(digits));
export const shortDate = (iso) => {
  const d = new Date(`${iso}T12:00:00`);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
};

function stat(days, field) {
  const v = vals(days, field);
  if (!v.length) return { n: 0 };
  return { n: v.length, avg: mean(v), min: Math.min(...v), max: Math.max(...v) };
}

function tally(list, labels) {
  const counts = {};
  for (const x of list) counts[x] = (counts[x] || 0) + 1;
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([id, n]) => ({ id, label: labels?.find((l) => l.id === id)?.label || id, n }));
}

const datesWhere = (days, f) => days.filter((d) => d[f] === true).map((d) => d.date);

export const TRIGGER_LABELS = [...SITUATION_TAGS, { id: "outOfNowhere", label: "Out of nowhere" }];

/** Count menstrual cycles: a period start is a period day with no period day in the 10 days before. */
function cycleStarts(days) {
  const periodDates = new Set(days.filter((d) => d.period === true).map((d) => d.date));
  return [...periodDates].sort().filter((date) => {
    for (let i = 1; i <= 10; i++) if (periodDates.has(addDays(date, -i))) return false;
    return true;
  });
}

export function buildReport(rawLogs, profile = {}, { start, end, noteKeys = [], includeSubstances = false } = {}) {
  const logs = rawLogs.filter((l) => l.date >= start && l.date <= end);
  const days = logs.map(normalizeDay).sort((a, b) => a.date.localeCompare(b.date));
  const logged = days.filter((d) => d.logged || d.mood != null);
  const totalDays = Math.round((new Date(`${end}T12:00:00`) - new Date(`${start}T12:00:00`)) / 86400000) + 1;
  const coverage = totalDays ? logged.length / totalDays : 0;
  const limited = logged.length < 21 || coverage < 0.6;

  // ---- Flags ----
  const safety = days
    .filter((d) => d.safety && d.safety !== "no")
    .map((d) => ({ date: d.date, level: SAFETY_OPTIONS.find((o) => o.id === d.safety)?.label || d.safety }));
  const phqItem9 = days
    .filter((d) => d.screeners?.phq9?.[8] > 0)
    .map((d) => ({ date: d.date, level: `PHQ-9 item 9 = ${d.screeners.phq9[8]}` }));
  const highRuns = runs(days, (d) => d.activationMax != null && d.activationMax >= 3, 3);
  const flags = [
    { label: "Thoughts of self-harm / not wanting to be alive", count: safety.length + phqItem9.length, detail: [...safety, ...phqItem9].map((s) => `${shortDate(s.date)} (${s.level})`).join(", "), critical: true },
    { label: "Meltdowns", count: countTrue(days, "meltdown"), detail: datesWhere(days, "meltdown").map(shortDate).join(", ") },
    { label: "Shutdowns", count: countTrue(days, "shutdown"), detail: datesWhere(days, "shutdown").map(shortDate).join(", ") },
    { label: "Nights under 6 h without feeling tired", count: countTrue(days, "shortNotTired"), detail: datesWhere(days, "shortNotTired").map(shortDate).join(", ") },
    { label: "Runs of 3+ days with high activation", count: highRuns.length, detail: highRuns.map((r) => `${shortDate(r.start)}–${shortDate(r.end)} (${r.length} d)`).join(", ") },
    { label: "Days with a missed medication", count: countTrue(days, "medsMissed"), detail: "" },
    { label: "Fainting / near-fainting", count: countTrue(days, "fainting"), detail: datesWhere(days, "fainting").map(shortDate).join(", ") },
    { label: "EDS flare days", count: countTrue(days, "flare"), detail: "" },
  ];

  // ---- Mood stability ----
  const lowRuns = runs(days, (d) => d.mood != null && d.mood <= 1);
  const actHighRuns = runs(days, (d) => d.activationMax != null && d.activationMax >= 3);
  const longest = (rs) => rs.reduce((m, r) => (r.length > (m?.length || 0) ? r : m), null);
  const mood = {
    stat: stat(days, "mood"),
    activation: stat(days, "activation"),
    masd: masd(days, "mood"),
    swingDays: days.filter((d) => d.moodSwing != null && d.moodSwing >= 2).length,
    multiCheckinDays: days.filter((d) => d.moodSwing != null).length,
    steady: tally(vals(days, "steady"), QUESTION_INDEX["mood.steady"].options),
    shiftLength: tally(vals(days, "shiftLength"), QUESTION_INDEX["mood.shiftLength"].options),
    triggers: tally(days.flatMap((d) => d.shiftTrigger), TRIGGER_LABELS),
    longestLow: longest(lowRuns),
    longestHigh: longest(actHighRuns),
    hypomanicSignDays: days.filter((d) => [d.talkingFast, d.newProjects, d.noRest].filter(Boolean).length >= 2).length,
    talkingFast: countTrue(days, "talkingFast"),
    newProjects: countTrue(days, "newProjects"),
    noRest: countTrue(days, "noRest"),
    impulsive: tally(days.flatMap((d) => d.impulsive), QUESTION_INDEX["mood.impulsive"].options),
    anhedoniaDays: days.filter((d) => d.anhedonia != null && d.anhedonia >= 2).length,
    othersMadDays: days.filter((d) => d.othersMad != null && d.othersMad >= 2).length,
    nAnswered: (f) => answered(days, f),
  };

  // ---- Sleep ----
  const sleep = {
    hours: stat(days, "sleepHours"),
    quality: stat(days, "sleepQuality"),
    short: countTrue(days, "sleepShort"),
    shortNotTired: countTrue(days, "shortNotTired"),
    nightmares: countTrue(days, "nightmares"),
    nightmaresN: answered(days, "nightmares"),
  };

  // ---- Body ----
  const body = {
    painStop: stat(days, "painStop"),
    painSlowedOrStopped: days.filter((d) => d.painStop != null && d.painStop >= 2).length,
    painStopped: days.filter((d) => d.painStop === 4).length,
    painLegacy: stat(days, "painLegacy"),
    symptomHardDays: ["headache", "stomach", "tension", "thinkHard"].map((f) => ({
      f,
      label: { headache: "Headache", stomach: "Stomach", tension: "Tension", thinkHard: "Hard to think clearly" }[f],
      n: vals(days, f).length,
      hard: days.filter((d) => d[f] != null && d[f] >= 2.6).length,
    })),
    potsDays: countTrue(days, "potsAny"),
    potsN: answered(days, "potsAny"),
    dizzy: countTrue(days, "dizzy"),
    palpitations: countTrue(days, "palpitations"),
    fainting: countTrue(days, "fainting"),
    worseStanding: countTrue(days, "worseStanding"),
    hr: { n: vals(days, "hrMax").length, min: vals(days, "hrMin").length ? Math.min(...vals(days, "hrMin")) : null, max: vals(days, "hrMax").length ? Math.max(...vals(days, "hrMax")) : null },
    flare: countTrue(days, "flare"),
    jointPain: countTrue(days, "jointPain"),
    subluxation: countTrue(days, "subluxation"),
    joints: tally(days.flatMap((d) => d.joints), BODY_LOCATIONS),
  };

  // ---- Attention & functioning ----
  const attention = {
    hardStart: days.filter((d) => d.hardStart != null && d.hardStart >= 2).length,
    couldntStart: days.filter((d) => d.hardStart === 4).length,
    hardStartN: vals(days, "hardStart").length,
    forgot: countTrue(days, "forgot"),
    forgotN: answered(days, "forgot"),
    timeSlip: countTrue(days, "timeSlip"),
    timeSlipN: answered(days, "timeSlip"),
    hyperfocus: countTrue(days, "hyperfocus"),
    hyperfocusN: answered(days, "hyperfocus"),
    basicsHard: days.filter((d) => d.basicsHard != null && d.basicsHard >= 2).length,
    basicsN: vals(days, "basicsHard").length,
    thinkHard: days.filter((d) => d.thinkHard != null && d.thinkHard >= 2.6).length,
    school: tally(vals(days, "school").filter((s) => s !== "noSchool"), QUESTION_INDEX["habits.school"].options),
  };

  // ---- Sensory & social ----
  const meltDays = days.filter((d) => d.meltdownOrShutdown === true);
  const sensory = {
    overload: days.filter((d) => d.sensory != null && d.sensory >= 2.5).length,
    sensoryN: vals(days, "sensory").length,
    peopleLot: days.filter((d) => d.people === 4).length,
    peopleN: vals(days, "people").length,
    maskingLot: days.filter((d) => d.masking === 4).length,
    maskingN: vals(days, "masking").length,
    lovedNone: days.filter((d) => d.loved === 0).length,
    lovedN: vals(days, "loved").length,
    meltDays: meltDays.length,
    meltPreceding: tally(meltDays.flatMap((d) => [...new Set([...d.situation, ...d.shiftTrigger])]).filter((t) => t !== "meltdown" && t !== "shutdown" && t !== "nothing"), TRIGGER_LABELS),
  };

  // ---- Medications ----
  const medList = profile.meds || [];
  const meds = {
    perMed: medList.map((m) => {
      const statuses = days.map((d) => d.medStatuses.find((s) => s.id === m.id)?.status).filter(Boolean);
      return {
        name: m.name,
        dose: m.dose,
        stopped: m.stopped,
        stimulant: m.stimulant,
        onTime: statuses.filter((s) => s === "onTime").length,
        late: statuses.filter((s) => s === "late").length,
        missed: statuses.filter((s) => s === "missed").length,
        n: statuses.length,
      };
    }),
    missedDays: countTrue(days, "medsMissed"),
    medsN: answered(days, "medsMissed"),
    stimTime: stat(days, "stimTime"),
    wearOff: tally(vals(days, "stimWoreOff"), [
      { id: "still", label: "Still working at bedtime" }, { id: "afternoon", label: "Afternoon" }, { id: "evening", label: "Evening" }, { id: "didntNotice", label: "Didn't notice" }, { id: "dk", label: "Don't know" },
    ]),
    sideEffects: tally(days.flatMap((d) => d.sideEffects), QUESTION_INDEX["nutrition.sideEffects"].options),
    caffeine: stat(days, "caffeine"),
    alcoholDays: countTrue(days, "alcohol"),
    alcoholN: answered(days, "alcohol"),
    substances: includeSubstances ? tally(days.flatMap((d) => d.substances), QUESTION_INDEX["nutrition.substances"].options) : null,
    changes: medChangesInRange(profile, start, end),
    current: medList.filter((m) => !m.stopped),
  };

  // ---- Cycle ----
  const starts = cycleStarts(days);
  let cycle = { tracked: Boolean(profile.cycleTracking), cycles: starts.length, ready: starts.length >= 2 };
  if (cycle.ready) {
    const pre = new Set(starts.flatMap((s) => [1, 2, 3, 4, 5, 6, 7].map((i) => addDays(s, -i))));
    const groups = {
      period: days.filter((d) => d.period === true),
      premenstrual: days.filter((d) => pre.has(d.date) && d.period !== true),
      other: days.filter((d) => d.period !== true && !pre.has(d.date)),
    };
    const row = (g) => ({ n: g.length, mood: mean(vals(g, "mood")), pain: mean(vals(g, "painStop")), pots: g.length ? g.filter((d) => d.potsAny).length / g.length : null, melt: g.filter((d) => d.meltdownOrShutdown).length });
    cycle = { ...cycle, period: row(groups.period), premenstrual: row(groups.premenstrual), other: row(groups.other) };
  }

  // ---- Screeners ----
  const screeners = days
    .filter((d) => d.screeners && (d.screeners.phq9Total != null || d.screeners.gad7Total != null))
    .map((d) => ({
      date: d.date,
      phq9: d.screeners.phq9Total,
      phq9Band: d.screeners.phq9Total != null ? band(PHQ9, d.screeners.phq9Total) : "",
      gad7: d.screeners.gad7Total,
      gad7Band: d.screeners.gad7Total != null ? band(GAD7, d.screeners.gad7Total) : "",
    }));

  // ---- Notes the user picked ----
  const allNotes = days.flatMap((d) => d.notes);
  const notes = allNotes.filter((n) => noteKeys.includes(noteKey(n))).slice(0, 5);

  // ---- Data quality ----
  const quality = answerQuality(logs, profile);
  const dkRows = Object.entries(quality)
    .map(([key, q]) => {
      const total = q.answered + q.dk + q.skipped;
      return { key, prompt: QUESTION_INDEX[key]?.prompt || key, total, dk: q.dk, skipped: q.skipped, dkRate: total ? q.dk / total : 0, skipRate: total ? q.skipped / total : 0 };
    })
    .filter((r) => r.total >= 3)
    .sort((a, b) => b.dkRate + b.skipRate - (a.dkRate + a.skipRate));

  const patterns = findPatterns(days, { cycleTracking: Boolean(profile.cycleTracking) && cycle.ready });

  // ---- Chart events ----
  const events = {
    melt: days.filter((d) => d.meltdownOrShutdown).map((d) => d.date),
    flare: days.filter((d) => d.flare).map((d) => d.date),
    period: days.filter((d) => d.period).map((d) => d.date),
    medChange: meds.changes.map((c) => c.date),
    bigEvent: days.filter((d) => d.events.length).map((d) => d.date),
  };

  return {
    start, end, totalDays, days, logged: logged.length, coverage, limited,
    backfilled: days.filter((d) => d.backfilled).length,
    checkins: days.reduce((s, d) => s + d.checkinCount, 0),
    profile, flags, mood, sleep, body, attention, sensory, meds, cycle, screeners, notes, dkRows, patterns, events,
    allNotes,
  };
}

export const noteKey = (n) => `${n.date}|${n.source}|${n.text.slice(0, 40)}`;
