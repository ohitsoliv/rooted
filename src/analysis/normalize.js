// src/analysis/normalize.js — Rooted Health Tracker
// Turns one stored day log (old or new format) into a flat record that the
// pattern engine, Summary page, and doctor report all share.
// Scales are 0–4. Body energy and mind speed are two-direction (2 = normal).
// null = no answer.

import { coreFeelings } from "../feelings";
import { QUESTION_INDEX, SECTIONS, CHECKIN_QUESTIONS, DK, scoreOf, isAnswered, isHidden, LEGACY_ACTIVATION_SCORES } from "../questions";

export const checkinList = (log) =>
  (Array.isArray(log?.checkins) ? log.checkins : log?.checkins?.checkins) || [];

const Q = (key) => QUESTION_INDEX[key];
const mean = (a) => (a.length ? a.reduce((s, x) => s + x, 0) / a.length : null);
const nums = (a) => a.filter((x) => typeof x === "number" && Number.isFinite(x));
const arr = (v) => (Array.isArray(v) ? v.filter((x) => x !== DK) : []);
const yes = (v) => (v === "yes" ? true : v === "no" ? false : null);

function ciMood(ci) {
  if (typeof ci.mood === "number") return ci.mood; // legacy Awful..Great, same direction
  return scoreOf(Q("checkin.mood"), ci.mood);
}

const minutes = (hhmm) => {
  if (!hhmm || typeof hhmm !== "string") return null;
  const [h, m] = hhmm.split(":").map(Number);
  return Number.isFinite(h) ? h * 60 + (m || 0) : null;
};

export function normalizeDay(log = {}) {
  const date = log.date;
  const cis = checkinList(log);
  const sleep = log.sleep || {};
  const day = log.mood || {};
  const body = log.symptoms || {};
  const pots = log.pots || {};
  const eds = log.eds || {};
  const fuel = log.nutrition || {};
  const sch = log.habits || {};
  const wrap = log.wrap || {};

  // ---- Check-ins ----
  const moods = nums(cis.map(ciMood));
  const mindScore = (c) => scoreOf(Q("checkin.activation"), c.activation) ?? LEGACY_ACTIVATION_SCORES[c.activation] ?? null;
  const acts = nums(cis.map(mindScore));
  const bodies = nums(cis.map((c) => scoreOf(Q("checkin.body"), c.body)));
  // Same check-in: mood low/very low (0–1) while mind busy/racing (3–4).
  // Body energy is deliberately not part of this — with EDS/POTS a heavy body
  // is often physical, so it would fire constantly and mean little.
  const mismatchCount = cis.filter((c) => {
    const md = ciMood(c);
    const m = mindScore(c);
    return md != null && m != null && md <= 1 && m >= 3;
  }).length;
  const pains = nums(cis.map((c) => scoreOf(Q("checkin.painStop"), c.painStop)));
  const legacyPain = nums(cis.map((c) => (typeof c.pain === "number" ? c.pain : null)));
  const legacyEnergy = nums(cis.map((c) => (typeof c.energy === "number" ? c.energy : null)));
  const situation = [...new Set(cis.flatMap((c) => arr(c.situation)))];
  const hrs = nums([...cis.map((c) => c.heartRate), Number(pots.heartRate) || null]);

  let mood = mean(moods);
  if (mood == null && typeof day.overallMood === "number") mood = day.overallMood; // legacy + backfill
  const activation = mean(acts);
  let bodyEnergy = mean(bodies);
  if (bodyEnergy == null && typeof day.recallActivation === "number") bodyEnergy = day.recallActivation; // backfill asked about the body
  let painStop = pains.length ? Math.max(...pains) : null;
  if (painStop == null && typeof body.recallPainStop === "number") painStop = [0, 2, 4][body.recallPainStop] ?? null;

  // ---- Sleep ----
  const hoursOpt = Q("sleep.sleepHours").options.find((x) => x.id === sleep.sleepHours);
  const sleepHours = hoursOpt ? hoursOpt.hours : null;
  const sleepQuality = sleep.sleepQuality ? scoreOf(Q("sleep.sleepQuality"), sleep.sleepQuality) : typeof sleep.quality === "number" ? sleep.quality : null;
  const tired = yes(sleep.tiredAfterShort);

  // ---- Day pattern ----
  const melt = day.meltdown;
  // "Today I had more…" (everyday wording) → activation signs
  const more = Array.isArray(day.more) && !day.more.includes(DK) ? day.more : null;
  const has = (...ids) => (more ? ids.some((x) => more.includes(x)) : null);
  const talkingFast = more ? has("chatting") : yes(day.talkingFast);
  const newProjects = more ? has("ideas", "plans") : yes(day.newProjects);
  const noRest = more ? has("energy") : yes(day.noRest);
  const moreBuying = has("buying");
  const shortNotTired = sleepHours != null && sleepHours < 6 && tired === false;

  // ---- Meds ----
  const medAnswers = fuel.meds && typeof fuel.meds === "object" ? fuel.meds : {};
  const statuses = Object.entries(medAnswers).filter(([k]) => k !== "_all").map(([id, v]) => ({ id, ...(v || {}) }));
  const anyStatus = statuses.some((s) => s.status) || Boolean(medAnswers._all);
  let medsMissed = anyStatus ? statuses.some((s) => s.status === "missed") || medAnswers._all === "missed" : null;
  if (medsMissed == null && fuel.medsTaken === false) medsMissed = true;
  if (medsMissed == null && fuel.medsTaken === true) medsMissed = false;
  const medsLate = anyStatus ? statuses.some((s) => s.status === "late") || medAnswers._all === "late" : null;
  const stim = statuses.find((s) => s.time);
  const sideEffects = arr(fuel.sideEffects).filter((x) => x !== "none");

  // ---- School / attention / sensory ----
  const schoolDay = sch.school && sch.school !== DK ? sch.school !== "noSchool" : null;

  // ---- Notes (never auto-included in reports) ----
  const notes = [];
  const pushNote = (source, text) => text && String(text).trim() && notes.push({ date, source, text: String(text).trim() });
  pushNote("Day note", wrap.dayNote);
  pushNote("Look-back", log.lookback?.note);
  pushNote("Mood note", day.note);
  pushNote("Event", sch.notableEvent);
  cis.forEach((c) => pushNote("Check-in", c.note || c.event));

  const logged = (log.completedSections || []).length > 0 || cis.length > 0;

  return {
    date,
    dow: date ? new Date(`${date}T12:00:00`).getDay() : null,
    logged,
    backfilled: Boolean(log.backfilled),
    mode: log.mode || "full",
    checkinCount: cis.length,
    mood,
    moodMin: moods.length ? Math.min(...moods) : null,
    moodMax: moods.length ? Math.max(...moods) : null,
    moodSwing: moods.length >= 2 ? Math.max(...moods) - Math.min(...moods) : null,
    activation,
    activationMax: acts.length ? Math.max(...acts) : activation,
    body: bodyEnergy,
    bodyMin: bodies.length ? Math.min(...bodies) : bodyEnergy,
    mismatch: cis.length ? mismatchCount > 0 : null,
    mismatchCount,
    feelingCores: cis.flatMap(coreFeelings),
    sensations: cis.flatMap((c) => c.feeling?.sensations || []),
    feelingCantTell: cis.filter((c) => c.feeling?.cantTell).length,
    feelingAnswered: cis.filter((c) => c.feeling || c.emotion).length,
    checkinScores: cis.map((c) => ({ mood: ciMood(c), mind: mindScore(c) })),
    painStop,
    painLegacy: legacyPain.length ? Math.max(...legacyPain) : null,
    energyLegacy: mean(legacyEnergy),
    situation,
    hrMin: hrs.length ? Math.min(...hrs) : null,
    hrMax: hrs.length ? Math.max(...hrs) : null,

    sleepHours,
    sleepShort: sleepHours != null ? sleepHours < 6 : null,
    sleepQuality,
    tiredAfterShort: tired,
    shortNotTired,
    nightmares: sleep.nightmares ? yes(sleep.nightmares) : sleep.dreamType ? sleep.dreamType === "Nightmare" : null,

    steady: day.steady && day.steady !== DK ? day.steady : null,
    shiftLength: day.shiftLength && day.shiftLength !== DK ? day.shiftLength : null,
    shiftTrigger: arr(day.shiftTrigger),
    meltdown: melt && melt !== DK ? melt === "meltdown" || melt === "both" : null,
    shutdown: melt && melt !== DK ? melt === "shutdown" || melt === "both" : null,
    meltdownOrShutdown: melt && melt !== DK ? ["meltdown", "shutdown", "both"].includes(melt) : null,
    anhedonia: scoreOf(Q("mood.anhedonia"), day.anhedonia),
    othersMad: scoreOf(Q("mood.othersMad"), day.othersMad),
    talkingFast,
    newProjects,
    noRest,
    moreBuying,
    moreCount: more ? more.filter((x) => x !== "nothing" && x !== "motivation").length : null,
    impulsive: [...arr(day.impulsive), ...arr(sch.impulsive)].filter((x) => x !== "none"),
    safety: wrap.safety || null,

    headache: scoreOf(Q("symptoms.headache"), body.headache),
    stomach: scoreOf(Q("symptoms.stomach"), body.stomach),
    tension: scoreOf(Q("symptoms.tension"), body.tension),
    thinkHard: scoreOf(Q("symptoms.thinkClearly"), body.thinkClearly),
    period: body.period ? body.period === "yes" || body.period === "spotting" : null,

    dizzy: typeof pots.dizziness === "boolean" ? pots.dizziness : null,
    palpitations: typeof pots.palpitations === "boolean" ? pots.palpitations : null,
    fainting: typeof pots.fainting === "boolean" ? pots.fainting : null,
    worseStanding: yes(pots.worseStanding),
    potsAny: [pots.dizziness, pots.palpitations, pots.fainting].some((x) => typeof x === "boolean")
      ? Boolean(pots.dizziness || pots.palpitations || pots.fainting)
      : null,
    flare: typeof eds.flareDay === "boolean" ? eds.flareDay : null,
    jointPain: typeof eds.jointPain === "boolean" ? eds.jointPain : null,
    joints: Array.isArray(eds.jointPainLocations) ? eds.jointPainLocations : [],
    subluxation: typeof eds.subluxation === "boolean" ? eds.subluxation : null,

    medStatuses: statuses,
    medsMissed,
    medsLate,
    stimTime: stim ? minutes(stim.time) : null,
    stimWoreOff: stim?.woreOff || null,
    sideEffects,
    timesAte: fuel.timesAte && fuel.timesAte !== DK ? Number(fuel.timesAte) : null,
    water: scoreOf(Q("nutrition.water"), fuel.water),
    caffeine: fuel.caffeine && fuel.caffeine !== DK ? Number(fuel.caffeine) : null,
    alcohol: fuel.alcohol && fuel.alcohol !== DK ? Number(fuel.alcohol) > 0 : null,
    substances: arr(fuel.substances).filter((x) => x !== "none"),

    school: sch.school && sch.school !== DK ? sch.school : null,
    schoolDay,
    hardStart: scoreOf(Q("habits.hardStart"), sch.hardStart),
    forgot: yes(sch.forgot),
    timeSlip: yes(sch.timeSlip),
    hyperfocus: yes(sch.hyperfocus),
    basicsHard: scoreOf(Q("habits.basicsHard"), sch.basicsHard),
    sensory: scoreOf(Q("habits.sensory"), sch.sensory),
    people: scoreOf(Q("habits.people"), sch.people),
    masking: scoreOf(Q("habits.masking"), sch.masking),
    loved: scoreOf(Q("habits.loved"), sch.loved),
    events: arr(sch.events),
    screeners: log.screeners || null,
    lookback: log.lookback || null,
    // What helped (all optional / reveal-only)
    helpedCalm: arr(day.helpedCalm),
    helpedBody: arr(body.helpedBody),
    helpedSleep: arr(sleep.helpedSleep),
    helpedToday: arr(wrap.helpedToday),
    checkinDoing: cis.flatMap((c) => arr(c.doing)),
    helpResults: cis.filter((c) => c.didItHelp && c.didItHelp !== DK && Array.isArray(c.didItHelpFor)).map((c) => ({ items: c.didItHelpFor, result: c.didItHelp })),
    sick: false, // filled in from profile sick episodes by the report
    notes,
  };
}

/**
 * Per-question answered / don't-know / skipped counts, over days where the
 * question's section was saved and the question would have been shown.
 */
export function answerQuality(logs, profile) {
  const out = {};
  const bump = (key, kind) => {
    out[key] = out[key] || { answered: 0, dk: 0, skipped: 0 };
    out[key][kind] += 1;
  };
  for (const log of logs) {
    const done = new Set(log.completedSections || []);
    for (const s of SECTIONS) {
      if (!s.questions || !done.has(s.id)) continue;
      const data = log[s.id] || {};
      for (const q of s.questions) {
        if (q.optional || q.type === "text" || q.type === "meds") continue;
        if (q.showIf && !q.showIf(data, profile || {})) continue;
        if (isHidden(q, s.id, profile)) continue;
        if (log.mode === "bare" || (log.mode === "good" && !q.ge)) continue; // not asked in that mode
        const v = data[q.id];
        const key = `${s.id}.${q.id}`;
        if (v === DK || (Array.isArray(v) && v.includes(DK))) bump(key, "dk");
        else if (isAnswered(v)) bump(key, "answered");
        else bump(key, "skipped");
      }
    }
    for (const ci of checkinList(log)) {
      for (const q of CHECKIN_QUESTIONS) {
        if (q.optional || q.type === "text" || q.showIf || isHidden(q, "checkin", profile)) continue;
        if (ci.bare && !["mood", "body", "activation"].includes(q.id)) continue;
        if (ci.timestamp && !("activation" in ci) && !("body" in ci) && !("painStop" in ci) && typeof ci.mood === "number") continue; // legacy check-in
        const v = ci[q.id];
        const key = `checkin.${q.id}`;
        if (v === DK || (Array.isArray(v) && v.includes(DK))) bump(key, "dk");
        else if (isAnswered(v)) bump(key, "answered");
        else bump(key, "skipped");
      }
    }
  }
  return out;
}
