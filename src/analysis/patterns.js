// src/analysis/patterns.js — Rooted Health Tracker
// Pattern engine shared by the Summary page and the doctor report.
//
// Method: split days into two groups, compare an outcome's average (or rate)
// between them. Only reported when BOTH groups have >= MIN_N days and the
// difference is meaningful. The list of checks is fixed in advance; testing
// everything against everything would produce chance "patterns".

export const MIN_N = 5;
export const MAX_REPORTED = 5;

const mean = (a) => a.reduce((s, x) => s + x, 0) / a.length;

const addDays = (iso, n) => {
  const d = new Date(`${iso}T12:00:00`);
  d.setDate(d.getDate() + n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

/* ----- Outcomes: what we measure ----- */
// kind: "scale" (0–4), "rate" (true/false), "hours", "bpm"
export const OUTCOMES = {
  mood: { label: "mood", kind: "scale", get: (d) => d.mood, scaleNote: "0 = very low, 4 = very good" },
  activation: { label: "mind speed", kind: "scale", get: (d) => d.activation, scaleNote: "0 = foggy or blank, 2 = normal, 4 = racing" },
  body: { label: "body energy", kind: "scale", get: (d) => d.body, scaleNote: "0 = heavy, 2 = normal, 4 = restless" },
  painStop: { label: "pain getting in the way", kind: "scale", get: (d) => d.painStop, scaleNote: "0 = no, 2 = slowing down, 4 = stopping activity" },
  hardStart: { label: "trouble starting tasks", kind: "scale", get: (d) => d.hardStart, scaleNote: "0 = no, 4 = couldn't start" },
  potsAny: { label: "POTS symptoms (dizzy, palpitations, or fainting)", kind: "rate", get: (d) => d.potsAny },
  meltdownOrShutdown: { label: "a meltdown or shutdown", kind: "rate", get: (d) => d.meltdownOrShutdown },
  sleepHours: { label: "sleep", kind: "hours", get: (d) => d.sleepHours },
  hrMax: { label: "highest logged heart rate", kind: "bpm", get: (d) => d.hrMax },
};

const MIN_DIFF = { scale: 0.75, rate: 0.25, hours: 1, bpm: 10 };

/* ----- Checks: decided in advance ----- */
// split(day) -> true (group A) | false (group B) | null (exclude)
// lag: outcome is read from the day `lag` days after the split day
export const CHECKS = [
  ...["mood", "activation", "body", "painStop", "potsAny"].map((out) => ({
    id: `shortSleep-${out}`, outcome: out, lag: 0,
    split: (d) => d.sleepShort,
    a: "days after under 6 hours of sleep", b: "days after 6+ hours",
  })),
  ...["mood", "painStop", "potsAny", "meltdownOrShutdown"].map((out) => ({
    id: `period-${out}`, outcome: out, lag: 0, needs: "cycle",
    split: (d) => d.period,
    a: "period days", b: "other days",
  })),
  { id: "missedMeds-mood", outcome: "mood", lag: 0, split: (d) => d.medsMissed, a: "days with a missed med", b: "days with no missed meds" },
  { id: "missedMeds-mood-next", outcome: "mood", lag: 1, split: (d) => d.medsMissed, a: "the day after a missed med", b: "the day after no missed meds" },
  { id: "missedMeds-hardStart", outcome: "hardStart", lag: 0, split: (d) => d.medsMissed, a: "days with a missed med", b: "days with no missed meds" },
  { id: "lateStim-sleep", outcome: "sleepHours", lag: 1, split: (d) => (d.stimTime == null ? null : d.stimTime >= 12 * 60), a: "nights after a stimulant taken at noon or later", b: "nights after one taken before noon" },
  { id: "caffeine-sleep", outcome: "sleepHours", lag: 1, split: (d) => (d.caffeine == null ? null : d.caffeine >= 2), a: "nights after 2+ caffeine drinks", b: "nights after 0–1" },
  { id: "caffeine-hr", outcome: "hrMax", lag: 0, split: (d) => (d.caffeine == null ? null : d.caffeine >= 2), a: "days with 2+ caffeine drinks", b: "days with 0–1" },
  { id: "sensory-melt", outcome: "meltdownOrShutdown", lag: 0, split: (d) => (d.sensory == null ? null : d.sensory >= 2.5), a: "days rated a lot or too much loud/bright/crowded", b: "calmer days" },
  { id: "sensory-act-next", outcome: "body", lag: 1, split: (d) => (d.sensory == null ? null : d.sensory >= 2.5), a: "the day after a loud/bright/crowded day", b: "the day after a calmer day" },
  { id: "people-melt", outcome: "meltdownOrShutdown", lag: 0, split: (d) => (d.people == null ? null : d.people >= 4), a: "days with a lot of people time", b: "days with less" },
  { id: "people-act-next", outcome: "body", lag: 1, split: (d) => (d.people == null ? null : d.people >= 4), a: "the day after a lot of people time", b: "the day after less" },
  { id: "peopleDrain-body-next", outcome: "body", lag: 1, split: (d) => d.peopleDraining, a: "the day after draining or hard people time", b: "the day after people time that felt okay or good" },
  { id: "batteryNotRespected-melt", outcome: "meltdownOrShutdown", lag: 0, split: (d) => (d.batteryRespected == null ? null : !d.batteryRespected), a: "days the social battery wasn't respected", b: "days it was" },
  { id: "aloneShort-melt", outcome: "meltdownOrShutdown", lag: 0, split: (d) => (d.aloneFelt == null ? null : d.aloneFelt === "none" || d.aloneFelt === "notEnough"), a: "days with too little alone time", b: "days with enough alone time" },
  { id: "aloneTooMuch-mood", outcome: "mood", lag: 0, split: (d) => (d.aloneFelt == null ? null : d.aloneFelt === "tooMuch"), a: "days with too much alone time", b: "other days" },
  { id: "masking-mood-next", outcome: "mood", lag: 1, split: (d) => (d.masking == null ? null : d.masking >= 4), a: "the day after masking a lot", b: "the day after masking less" },
  { id: "sick-mood", outcome: "mood", lag: 0, split: (d) => d.sick, a: "days marked sick or injured", b: "other days" },
  { id: "sick-body", outcome: "body", lag: 0, split: (d) => d.sick, a: "days marked sick or injured", b: "other days" },
  { id: "pots-mood", outcome: "mood", lag: 0, split: (d) => d.potsAny, a: "days with POTS symptoms", b: "days without" },
  { id: "school-mood", outcome: "mood", lag: 0, split: (d) => d.schoolDay, a: "school days", b: "non-school days" },
  { id: "school-melt", outcome: "meltdownOrShutdown", lag: 0, split: (d) => d.schoolDay, a: "school days", b: "non-school days" },
  { id: "weekend-mood", outcome: "mood", lag: 0, split: (d) => (d.dow == null ? null : d.dow === 0 || d.dow === 6), a: "weekends", b: "weekdays" },
];

const r1 = (x) => Math.round(x * 10) / 10;

function compare(byDate, days, check) {
  const out = OUTCOMES[check.outcome];
  const A = [];
  const B = [];
  for (const d of days) {
    const g = check.split(d);
    if (g === null || g === undefined) continue;
    const target = check.lag ? byDate[addDays(d.date, check.lag)] : d;
    if (!target) continue;
    let v = out.get(target);
    if (v === null || v === undefined) continue;
    if (out.kind === "rate") v = v ? 1 : 0;
    (g ? A : B).push(v);
  }
  const base = { id: check.id, check, outcome: out, nA: A.length, nB: B.length };
  if (A.length < MIN_N || B.length < MIN_N) return { ...base, status: "not_enough_data" };
  const mA = mean(A);
  const mB = mean(B);
  const diff = mA - mB;
  const status = Math.abs(diff) >= MIN_DIFF[out.kind] ? "pattern" : "no_clear_pattern";
  return { ...base, mA, mB, diff, countA: A.filter(Boolean).length, countB: B.filter(Boolean).length, status, strength: Math.abs(diff) / MIN_DIFF[out.kind] };
}

export function sentence(r) {
  const { check, outcome: o } = r;
  if (o.kind === "rate") {
    const pa = Math.round(r.mA * 100);
    const pb = Math.round(r.mB * 100);
    return `${cap(o.label)} on ${pa}% of ${check.a} (${r.countA} of ${r.nA}) vs ${pb}% of ${check.b} (${r.countB} of ${r.nB}).`;
  }
  const unit = o.kind === "hours" ? " h" : o.kind === "bpm" ? " bpm" : "";
  const scale = o.kind === "scale" ? " on a 0–4 scale" : "";
  return `${cap(o.label)} averaged ${r1(r.mA)}${unit} on ${check.a} vs ${r1(r.mB)}${unit} on ${check.b}${scale} (${r.nA} vs ${r.nB} days).`;
}

export function checkedLabel(r) {
  return `${cap(r.outcome.label)}: ${r.check.a} vs ${r.check.b}`;
}

const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

/** days: normalized day records (any order). */
export function findPatterns(days, { cycleTracking = false } = {}) {
  const sorted = [...days].filter((d) => d.date).sort((a, b) => a.date.localeCompare(b.date));
  const byDate = Object.fromEntries(sorted.map((d) => [d.date, d]));
  const results = CHECKS.filter((c) => c.needs !== "cycle" || cycleTracking).map((c) => compare(byDate, sorted, c));
  const patterns = results.filter((r) => r.status === "pattern").sort((a, b) => b.strength - a.strength);
  return {
    top: patterns.slice(0, MAX_REPORTED),
    noPattern: results.filter((r) => r.status === "no_clear_pattern"),
    notEnough: results.filter((r) => r.status === "not_enough_data"),
    testedCount: results.filter((r) => r.status !== "not_enough_data").length,
  };
}

/* ----- Stability measures ----- */

/** Mean absolute successive difference across consecutive calendar days. */
export function masd(days, field) {
  const sorted = [...days].sort((a, b) => a.date.localeCompare(b.date));
  const diffs = [];
  for (let i = 1; i < sorted.length; i++) {
    const a = sorted[i - 1];
    const b = sorted[i];
    if (addDays(a.date, 1) === b.date && a[field] != null && b[field] != null) diffs.push(Math.abs(b[field] - a[field]));
  }
  return diffs.length >= MIN_N ? { value: mean(diffs), n: diffs.length } : null;
}

/** Runs of consecutive calendar days meeting `test`, returned as [{start, end, length}]. */
export function runs(days, test, minLength = 1) {
  const sorted = [...days].sort((a, b) => a.date.localeCompare(b.date));
  const out = [];
  let cur = null;
  for (const d of sorted) {
    if (test(d)) {
      if (cur && addDays(cur.end, 1) === d.date) {
        cur.end = d.date;
        cur.length += 1;
      } else {
        if (cur) out.push(cur);
        cur = { start: d.date, end: d.date, length: 1 };
      }
    } else if (cur) {
      out.push(cur);
      cur = null;
    }
  }
  if (cur) out.push(cur);
  return out.filter((r) => r.length >= minLength);
}

export { addDays };
