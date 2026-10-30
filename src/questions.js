// src/questions.js — Rooted Health Tracker
// Single source of truth for every question the app asks.
//
// Storage rules:
//   single choice -> option id string            ("dk" = Don't know)
//   multi choice  -> array of option ids         (["dk"] = Don't know)
//   skipped       -> field absent / undefined    (never stored as "dk")
// Each option may carry `score`. Scores are normalised to 0–4 for analysis
// using the question's `max` (default 4). For two-direction scales, 2 = normal.

export const DK = "dk";

const o = (id, label, score, emoji) => ({ id, label, score, emoji });

/* ---------- Shared option sets ---------- */

export const MOOD_OPTIONS = [
  o("vlow", "Very low", 0, "😢"),
  o("low", "Low", 1, "😕"),
  o("okay", "Okay", 2, "😐"),
  o("good", "Good", 3, "🙂"),
  o("vgood", "Very good", 4, "😄"),
];

export const ACTIVATION_OPTIONS = [
  o("bed", "Want to stay in bed", 0, "🛌"),
  o("slow", "Slow and heavy", 1, "🐢"),
  o("normal", "Normal", 2, "🙂"),
  o("high", "Lots of energy, want to do things", 3, "⚡"),
  o("wired", "Can't sit still or stop talking", 4, "🌪️"),
];

export const PAIN_STOP_OPTIONS = [
  o("no", "No", 0),
  o("slow", "Slowing me down", 2),
  o("stop", "Stopping me", 4),
];

export const BODY_LOCATIONS = [
  "Head", "Neck", "Jaw", "Shoulder", "Back", "Ribs", "Stomach",
  "Hip", "Knee", "Ankle", "Wrist", "Fingers", "Elbow", "Toes",
].map((l) => o(l.toLowerCase(), l));

export const SITUATION_TAGS = [
  o("loud", "Too loud, bright, or crowded"),
  o("plansChanged", "Plans changed"),
  o("upsetMe", "Someone upset me"),
  o("mad", "I think someone's mad at me"),
  o("leftOut", "Felt left out"),
  o("peopleTime", "Too much people time"),
  o("school", "School stress"),
  o("body", "Body stuff (dizzy, heart, pain)"),
  o("hungry", "Hungry"),
  o("tired", "Tired"),
  o("meltdown", "Meltdown"),
  o("shutdown", "Shutdown"),
  o("nothing", "Nothing in particular"),
];

const YES_NO = [o("no", "No", 0), o("yes", "Yes", 4)];

const SEVERITY = [
  o("none", "Didn't notice", 0),
  o("noticed", "Noticed, could ignore", 1),
  o("hard", "Hard to ignore", 2),
  o("couldnt", "Couldn't do things", 3),
];

export const SAFETY_OPTIONS = [
  o("no", "No", 0),
  o("passing", "Passing thought", 1),
  o("strong", "Strong thoughts", 2),
  o("urge", "Urge or plan", 3),
];

/* ---------- Check-in (repeatable) ---------- */

export const CHECKIN_QUESTIONS = [
  { id: "activation", prompt: "Which is closest right now?", type: "single", options: ACTIVATION_OPTIONS, layout: "stack", ge: true },
  { id: "mood", prompt: "Mood right now", type: "single", options: MOOD_OPTIONS, layout: "faces", ge: true },
  { id: "painStop", prompt: "Is pain stopping you from doing things?", type: "single", options: PAIN_STOP_OPTIONS, ge: true },
  { id: "painWhere", prompt: "Where?", type: "multi", options: BODY_LOCATIONS, dk: false, showIf: (a) => a.painStop === "slow" || a.painStop === "stop" },
  { id: "situation", prompt: "What's going on?", hint: "Tap any that fit", type: "multi", options: SITUATION_TAGS },
  { id: "heartRate", prompt: "Heart rate", hint: "Optional, bpm", type: "number", optional: true, dk: false, min: 30, max: 250 },
  { id: "hrPosition", prompt: "Position when measured", type: "single", options: [o("lying", "Lying"), o("sitting", "Sitting"), o("standing", "Standing")], dk: false, showIf: (a) => Boolean(a.heartRate) },
  { id: "note", prompt: "Anything to note?", type: "text", optional: true, dk: false, placeholder: "Optional" },
];

/* ---------- Daily sections ---------- */

const SLEEP = [
  {
    id: "sleepQuality", prompt: "How did you sleep?", type: "single", layout: "faces",
    options: [o("awful", "Awful", 0, "😫"), o("poor", "Poor", 1, "😕"), o("okay", "Okay", 2, "😐"), o("good", "Good", 3, "🙂"), o("great", "Great", 4, "😴")],
  },
  {
    id: "sleepHours", prompt: "About how many hours?", type: "single", ge: true,
    options: [
      { ...o("u4", "Under 4"), hours: 3.5 },
      { ...o("h4", "4–6"), hours: 5 },
      { ...o("h6", "6–8"), hours: 7 },
      { ...o("h8", "8–10"), hours: 9 },
      { ...o("o10", "Over 10"), hours: 10.5 },
    ],
  },
  { id: "tiredAfterShort", prompt: "Do you feel tired?", type: "single", options: YES_NO, showIf: (a) => a.sleepHours === "u4" || a.sleepHours === "h4" },
  {
    id: "keptUp", prompt: "What kept you up?", type: "multi", showIf: (a) => a.sleepQuality === "awful" || a.sleepQuality === "poor",
    options: [o("racing", "Mind racing"), o("pain", "Pain"), o("heart", "Heart racing or too hot"), o("woke", "Woke up a lot")],
  },
  { id: "nightmares", prompt: "Nightmares?", type: "single", options: YES_NO },
  { id: "nap", prompt: "Nap yesterday?", type: "single", optional: true, options: [o("none", "None", 0), o("short", "Short", 2), o("long", "Long", 4)] },
];

const SHIFT_TRIGGERS = [...SITUATION_TAGS.filter((t) => t.id !== "nothing"), o("outOfNowhere", "Out of nowhere")];

const DAY = [
  {
    id: "steady", prompt: "How steady was today?", type: "single", max: 2,
    options: [o("same", "About the same all day", 0), o("some", "Some ups and downs", 1), o("big", "Big ups and downs", 2)],
  },
  {
    id: "shiftLength", prompt: "How long did the biggest change last?", type: "single",
    showIf: (a) => a.steady === "some" || a.steady === "big",
    options: [o("minutes", "Minutes"), o("hours", "A few hours"), o("most", "Most of the day"), o("days", "It's been going for days")],
  },
  { id: "shiftTrigger", prompt: "Did something set it off?", type: "multi", options: SHIFT_TRIGGERS, showIf: (a) => a.steady === "some" || a.steady === "big" },
  {
    id: "meltdown", prompt: "Meltdown or shutdown today?", type: "single",
    options: [o("no", "No"), o("almost", "Almost"), o("meltdown", "Meltdown"), o("shutdown", "Shutdown"), o("both", "Both")],
  },
  { id: "anhedonia", prompt: "Did things you usually like feel boring or pointless?", type: "single", options: [o("no", "No", 0), o("bit", "A bit", 2), o("yes", "Yes", 4)] },
  { id: "othersMad", prompt: "Did you think someone was mad at you or pulling away?", type: "single", options: [o("no", "No", 0), o("little", "A little", 2), o("lot", "A lot", 4)] },
  { id: "talkingFast", prompt: "Did anyone say you were talking a lot or fast?", type: "single", options: YES_NO },
  { id: "newProjects", prompt: "Did you start several new projects or ideas?", type: "single", options: YES_NO },
  { id: "noRest", prompt: "Did you feel like you didn't need to rest?", type: "single", options: YES_NO },
  {
    id: "impulsive", prompt: "Did you do anything on impulse you normally wouldn't?", type: "multi", exclusive: "none",
    options: [o("spent", "Spent money"), o("ate", "Ate a lot"), o("substances", "Alcohol or substances"), o("risky", "Something risky"), o("regret", "Said something I regret"), o("none", "None")],
  },
];

const BODY = [
  { id: "headache", prompt: "Headache", type: "single", options: SEVERITY, max: 3 },
  { id: "stomach", prompt: "Stomach (nausea, cramps)", type: "single", options: SEVERITY, max: 3 },
  { id: "tension", prompt: "Muscle tension or clenching", type: "single", options: SEVERITY, max: 3 },
  { id: "thinkClearly", prompt: "Was it hard to think clearly?", type: "single", options: SEVERITY, max: 3 },
  {
    id: "period", prompt: "Period today?", type: "single", dk: false,
    showIf: (_a, profile) => Boolean(profile?.cycleTracking),
    options: [o("yes", "Yes"), o("spotting", "Spotting"), o("no", "No")],
  },
];

const FUEL = [
  { id: "meds", prompt: "Meds today", type: "meds", ge: true },
  {
    id: "sideEffects", prompt: "Side effects?", type: "multi", exclusive: "none",
    options: [o("appetite", "No appetite"), o("sleep", "Trouble sleeping"), o("heart", "Heart racing"), o("headache", "Headache"), o("stomach", "Stomach"), o("crash", "Crash or mood drop"), o("none", "None")],
  },
  { id: "timesAte", prompt: "How many times did you eat?", type: "single", options: [o("0", "0", 0), o("1", "1", 1), o("2", "2", 2), o("3", "3", 3), o("4", "4+", 4)] },
  { id: "water", prompt: "Bottles or glasses of water?", type: "single", options: [o("0", "0", 0), o("1", "1–2", 1), o("3", "3–4", 2), o("5", "5+", 3)], max: 3 },
  { id: "salt", prompt: "Extra salt or electrolytes?", type: "single", options: [o("none", "None", 0), o("little", "A little", 1), o("some", "Some", 2), o("lot", "A lot", 3)], max: 3 },
  { id: "caffeine", prompt: "Caffeine drinks", type: "single", options: [o("0", "0", 0), o("1", "1", 1), o("2", "2", 2), o("3", "3+", 3)], max: 3 },
  { id: "alcohol", prompt: "Alcohol", type: "single", options: [o("0", "None", 0), o("1", "1–2 drinks", 1), o("3", "3+ drinks", 2)], max: 2 },
  {
    id: "substances", prompt: "Anything else?", hint: "Private — left out of the doctor report unless you choose", type: "multi", optional: true, exclusive: "none", private: true,
    options: [o("cannabis", "Cannabis"), o("nicotine", "Nicotine / vape"), o("other", "Something else"), o("none", "None")],
  },
];

const SCHOOL = [
  { id: "school", prompt: "Did you go to class?", type: "single", options: [o("all", "All"), o("some", "Some"), o("none", "None"), o("noSchool", "No school today")] },
  { id: "homework", prompt: "Homework", type: "single", options: [o("done", "Done"), o("partly", "Partly"), o("notYet", "Didn't get to it"), o("noneDue", "None due")] },
  { id: "hardStart", prompt: "Was it hard to start something you needed to do?", type: "single", options: [o("no", "No", 0), o("little", "A little", 2), o("couldnt", "Couldn't start at all", 4)] },
  { id: "forgot", prompt: "Lost or forgot something important?", type: "single", options: YES_NO },
  {
    id: "forgotWhat", prompt: "What was it?", type: "multi", showIf: (a) => a.forgot === "yes",
    options: [o("assignment", "Assignment"), o("item", "An item"), o("appointment", "Appointment"), o("meds", "Meds")],
  },
  { id: "timeSlip", prompt: "Were you late, or did time get away from you?", type: "single", options: YES_NO },
  { id: "hyperfocus", prompt: "Got stuck on one thing for hours and missed other stuff?", type: "single", options: YES_NO },
  { id: "basicsHard", prompt: "Were basic things (shower, eating, replying to people) hard today?", type: "single", options: [o("no", "No", 0), o("some", "Some", 2), o("lot", "A lot", 4)] },
  { id: "sensory", prompt: "How loud, bright, or crowded was today?", type: "single", options: [o("calm", "Calm", 0), o("some", "Some", 1), o("lot", "A lot", 2), o("too", "Too much", 3)], max: 3 },
  { id: "people", prompt: "Time with people", type: "single", options: [o("alone", "Mostly alone", 0), o("some", "Some", 1), o("lot", "A lot", 2)], max: 2 },
  { id: "masking", prompt: "Did you have to act \"normal\" or hide things a lot?", type: "single", options: [o("no", "No", 0), o("little", "A little", 2), o("lot", "A lot", 4)] },
  { id: "loved", prompt: "Time on things you love?", type: "single", options: [o("none", "None", 0), o("some", "Some", 2), o("lot", "A lot", 4)] },
  { id: "moved", prompt: "Moved your body or got outside?", type: "single", options: [o("no", "No", 0), o("little", "A little", 2), o("yes", "Yes", 4)] },
  { id: "screensLate", prompt: "On screens late at night?", type: "single", options: [o("no", "No", 0), o("some", "Some", 2), o("lot", "A lot", 4)] },
  {
    id: "events", prompt: "Anything big happen?", type: "multi", optional: true,
    options: [o("conflict", "Conflict"), o("test", "Test"), o("cancelled", "Plans cancelled"), o("goodNews", "Good news"), o("loss", "Loss"), o("other", "Other")],
  },
  { id: "win", prompt: "Win of the day", hint: "Tiny wins count", type: "text", optional: true, dk: false, placeholder: "e.g. Took my meds" },
];

const WRAP = [
  { id: "safety", prompt: "Did you have thoughts of hurting yourself or not wanting to be alive today?", type: "single", options: SAFETY_OPTIONS, dk: false, ge: true, safety: true },
  { id: "dayNote", prompt: "Anything you want to remember about today?", type: "text", optional: true, dk: false, placeholder: "Optional — you choose later whether doctors see it" },
];

/* ---------- Section registry ---------- */

export const SECTIONS = [
  { id: "sleep", label: "Sleep", emoji: "😴", color: "mauve", time: "~30 sec", questions: SLEEP },
  { id: "checkins", label: "Check-in", emoji: "📝", color: "terra", time: "~15 sec", custom: true, ge: true },
  { id: "mood", label: "Your day", emoji: "💜", color: "mauve", time: "~1 min", questions: DAY },
  { id: "symptoms", label: "Body", emoji: "🩺", color: "sage", time: "~20 sec", questions: BODY },
  { id: "pots", label: "POTS", emoji: "💙", color: "teal", time: "~1 min", custom: true },
  { id: "eds", label: "EDS", emoji: "🧡", color: "amber", time: "~1 min", custom: true },
  { id: "nutrition", label: "Fuel + meds", emoji: "🍽️", color: "gold", time: "~45 sec", questions: FUEL },
  { id: "habits", label: "School + focus", emoji: "⭐", color: "mauve", time: "~1 min", questions: SCHOOL },
  { id: "wrap", label: "Last check", emoji: "🌙", color: "terra", time: "~10 sec", questions: WRAP },
];

for (const s of SECTIONS) {
  if (s.questions) s.ge = s.questions.some((q) => q.ge);
}

export const SECTION_BY_ID = Object.fromEntries(SECTIONS.map((s) => [s.id, s]));

export const sectionsFor = (goodEnough) => (goodEnough ? SECTIONS.filter((s) => s.ge) : SECTIONS);

/** All questions keyed "section.field" for lookups in history/export. */
export const QUESTION_INDEX = (() => {
  const idx = {};
  for (const s of SECTIONS) for (const q of s.questions || []) idx[`${s.id}.${q.id}`] = { ...q, section: s.id };
  for (const q of CHECKIN_QUESTIONS) idx[`checkin.${q.id}`] = { ...q, section: "checkin" };
  return idx;
})();

export const hasDk = (q) => q.dk !== false && (q.type === "single" || q.type === "multi");

export const isVisible = (q, answers, profile, goodEnough) => {
  if (goodEnough && !q.ge) return false;
  return q.showIf ? Boolean(q.showIf(answers || {}, profile || {})) : true;
};

/** Normalised 0–4 score for a single-choice answer, or null. */
export function scoreOf(q, value) {
  if (!q || value == null || value === DK) return null;
  const opt = q.options?.find((x) => x.id === value);
  if (!opt || opt.score == null) return null;
  return (opt.score * 4) / (q.max || 4);
}

export function labelOf(q, value) {
  if (value == null) return "";
  if (value === DK) return "Don't know";
  if (Array.isArray(value)) {
    if (value.includes(DK)) return "Don't know";
    return value.map((v) => q.options?.find((x) => x.id === v)?.label || v).join(", ");
  }
  return q.options?.find((x) => x.id === value)?.label ?? String(value);
}

export const isAnswered = (v) =>
  v !== undefined && v !== null && v !== "" && !(Array.isArray(v) && v.length === 0);
