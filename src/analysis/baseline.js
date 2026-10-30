// src/analysis/baseline.js — Rooted Health Tracker
// Personal baseline ("usual for this person"). The person's normal is not the
// average person's normal, so flags compare each day to their own recent usual
// instead of fixed cutoffs once there is enough data.
//
// Baseline for day D = median of the previous 28 days (D itself excluded, so a
// spike can't hide inside its own baseline). Needs >= MIN_BASELINE_DAYS values;
// before that, callers fall back to fixed cutoffs and say so.

import { addDays } from "./patterns";

export const BASELINE_WINDOW = 28;
export const MIN_BASELINE_DAYS = 14;
export const BASELINE_FIELDS = ["mood", "activation", "body", "painStop", "sleepHours"];

export function median(values) {
  const v = values.filter((x) => x != null && Number.isFinite(x)).sort((a, b) => a - b);
  if (!v.length) return null;
  const m = Math.floor(v.length / 2);
  return v.length % 2 ? v[m] : (v[m - 1] + v[m]) / 2;
}

/**
 * days: normalized days (may include days before the report range).
 * Returns { [date]: { mood, activation, body, painStop, sleepHours } } where
 * each value is the rolling baseline or null if not enough history.
 */
export function rollingBaselines(days) {
  const byDate = Object.fromEntries(days.map((d) => [d.date, d]));
  const out = {};
  for (const d of days) {
    const window = [];
    for (let i = 1; i <= BASELINE_WINDOW; i++) {
      const prev = byDate[addDays(d.date, -i)];
      if (prev) window.push(prev);
    }
    const b = {};
    for (const f of BASELINE_FIELDS) {
      const vals = window.map((w) => w[f]).filter((x) => x != null);
      b[f] = vals.length >= MIN_BASELINE_DAYS ? median(vals) : null;
    }
    out[d.date] = b;
  }
  return out;
}

export const MIN_REFERENCE_DAYS = 7;

/**
 * Fixed reference baseline from an "okay period" the person chose.
 * Unlike the rolling baseline it doesn't drift during a long episode.
 */
export function referenceBaseline(days, reference) {
  if (!reference?.start || !reference?.end) return null;
  const inRange = days.filter((d) => d.date >= reference.start && d.date <= reference.end);
  const out = { start: reference.start, end: reference.end, n: inRange.length };
  let any = false;
  for (const f of BASELINE_FIELDS) {
    const vals = inRange.map((d) => d[f]).filter((x) => x != null);
    out[f] = vals.length >= MIN_REFERENCE_DAYS ? median(vals) : null;
    if (out[f] != null) any = true;
  }
  return any ? out : { ...out, insufficient: true };
}

/** One "usual" summary over a set of days, for the report header. */
export function overallUsual(days) {
  const out = {};
  for (const f of BASELINE_FIELDS) {
    const vals = days.map((d) => d[f]).filter((x) => x != null);
    out[f] = { value: vals.length >= MIN_BASELINE_DAYS ? median(vals) : null, n: vals.length };
  }
  return out;
}
