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

// Body and mind are asked separately: they can point in opposite directions
// (e.g. heavy body + racing mind), and that mismatch is clinically useful.
export const BODY_OPTIONS = [
  o("heavy", "Heavy, want to stay in bed", 0, "🛌"),
  o("slow", "Slow and tired", 1, "🐢"),
  o("normal", "My usual", 2, "🙂"),
  o("energy", "Lots of energy", 3, "⚡"),
  o("restless", "Restless, can't sit still", 4, "🦘"),
];

// Stored under the field name "activation" (mind speed).
export const ACTIVATION_OPTIONS = [
  o("blank", "Foggy or blank", 0, "🌫️"),
  o("slow", "Slow", 1, "🐌"),
  o("normal", "My usual", 2, "🙂"),
  o("busy", "Busy, lots of ideas", 3, "💭"),
  o("racing", "Racing, can't stop thinking or talking", 4, "🌪️"),
];

// Answers saved with the earlier single combined scale.
export const LEGACY_ACTIVATION_SCORES = { bed: 0, slow: 1, normal: 2, high: 3, wired: 4 };

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
  o("other", "Something else"),
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
  {
    // Shown when the previous check-in today listed something in "doing".
    // CheckInSection passes _prevDoing in and names those things in the hint.
    id: "didItHelp", prompt: "Did that help?", type: "single",
    showIf: (a) => Array.isArray(a._prevDoing) && a._prevDoing.length > 0,
    options: [o("yes", "Yes"), o("bit", "A bit"), o("no", "No"), o("worse", "Made it worse")],
  },
  { id: "body", prompt: "How does your body feel?", type: "single", options: BODY_OPTIONS, layout: "stack", ge: true },
  { id: "activation", prompt: "How does your mind feel?", type: "single", options: ACTIVATION_OPTIONS, layout: "stack", ge: true },
  { id: "mood", prompt: "Mood right now", type: "single", options: MOOD_OPTIONS, layout: "faces", ge: true },
  { id: "painStop", prompt: "Is pain stopping you from doing things?", type: "single", options: PAIN_STOP_OPTIONS, ge: true },
  { id: "painWhere", prompt: "Where?", type: "multi", options: BODY_LOCATIONS, dk: false, showIf: (a) => a.painStop === "slow" || a.painStop === "stop" },
  {
    id: "doing", fillIn: "other", prompt: "Doing anything about it?", hint: "Pick any", type: "multi", exclusive: "nothing",
    showIf: (a) => a.mood === "vlow" || a.mood === "low" || a.painStop === "slow" || a.painStop === "stop",
    options: [o("rest", "Resting"), o("music", "Music"), o("alone", "Alone time"), o("saltWater", "Salt or water"), o("meds", "Meds"), o("moving", "Moving / stretching"), o("talking", "Talking to someone"), o("stim", "Stimming"), o("comfort", "Comfort thing (show, food, pet)"), o("other", "Something else"), o("nothing", "Nothing right now")],
  },
  { id: "situation", fillIn: "other", prompt: "What's going on?", hint: "Tap any that fit", type: "multi", options: SITUATION_TAGS },
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
  {
    id: "helpedSleep", prompt: "Anything help last night?", type: "multi", exclusive: "noIdea",
    showIf: (a) => a.sleepQuality === "good" || a.sleepQuality === "great",
    options: [o("windDown", "Wind-down routine"), o("noScreens", "No screens"), o("meds", "Meds"), o("noise", "White noise / sound"), o("tired", "Tired from the day"), o("noIdea", "No idea")],
  },
  { id: "nightmares", prompt: "Nightmares?", type: "single", options: YES_NO },
  {
    id: "wantedDay", prompt: "What kind of day do you want today?", type: "single",
    options: [o("rest", "Rest / sleep a lot"), o("easy", "Easy and low-key"), o("normal", "A normal day"), o("productive", "Get stuff done"), o("busy", "Big and busy")],
  },
  { id: "nap", prompt: "Nap yesterday?", type: "single", optional: true, options: [o("none", "None", 0), o("short", "Short", 2), o("long", "Long", 4)] },
];

export const WHO_OPTIONS = [
  o("family", "Family"), o("partner", "Partner"), o("friends", "Friends"), o("online", "Online friends"),
  o("classmates", "Classmates"), o("teachers", "Teachers / staff"), o("coworkers", "Coworkers"),
  o("care", "Doctor / therapist"), o("strangers", "Strangers / crowds"), o("other", "Someone else"),
];

/**
 * The "who" options, editable in Settings. Custom entries use their own text
 * as the id, so labels still read correctly anywhere they're shown.
 * "Someone else" (with a fill-in) is always kept at the end.
 */
export function whoOptions(profile) {
  const list = profile?.whoList?.length ? profile.whoList : WHO_OPTIONS.filter((x) => x.id !== "other").map((x) => x.label);
  const known = Object.fromEntries(WHO_OPTIONS.map((x) => [x.label, x.id]));
  return [...list.map((label) => o(known[label] || label, label)), o("other", "Someone else")];
}

const SHIFT_TRIGGERS = [...SITUATION_TAGS.filter((t) => t.id !== "nothing"), o("outOfNowhere", "Out of nowhere")];

// Wording is deliberately everyday: no single question should give away what
// it's looking for (it's easier to answer honestly without second-guessing).
// Clinical meaning is recovered in src/analysis/normalize.js and report.js.
const DAY = [
  {
    id: "steady", prompt: "Today was like…", type: "single", max: 2,
    options: [o("same", "Flat road", 0), o("some", "Some bumps", 1), o("big", "Roller coaster", 2)],
  },
  {
    id: "shiftLength", prompt: "How long did the biggest bump last?", type: "single",
    showIf: (a) => a.steady === "some" || a.steady === "big",
    options: [o("minutes", "Minutes"), o("hours", "A few hours"), o("most", "Most of the day"), o("days", "It's been going for days")],
  },
  { id: "shiftTrigger", fillIn: "other", prompt: "Anything set it off?", type: "multi", options: SHIFT_TRIGGERS, showIf: (a) => a.steady === "some" || a.steady === "big" },
  {
    id: "anhedonia", prompt: "Did things you usually like feel boring or pointless?", type: "single",
    options: [o("no", "No", 0), o("bit", "A bit", 2), o("yes", "Yes", 4)],
  },
  {
    id: "more", prompt: "Today I had more…", hint: "Pick any", type: "multi", exclusive: "nothing",
    options: [o("ideas", "Ideas"), o("plans", "Plans"), o("energy", "Energy"), o("chatting", "Chatting"), o("buying", "Things I wanted to buy"), o("motivation", "Motivation"), o("nothing", "Nothing extra")],
  },
  {
    id: "othersMad", prompt: "Did you think someone was mad at you or pulling away?", type: "single",
    options: [o("no", "No", 0), o("little", "A little", 2), o("lot", "A lot", 4)],
  },
  {
    id: "dayFull", prompt: "How full was today?", type: "single", max: 3,
    options: [o("light", "Light", 0), o("manageable", "Manageable", 1), o("packed", "Packed", 2), o("tooMuch", "Too much", 3)],
  },
  {
    // Only when this morning's "What kind of day do you want?" was answered.
    // QuestionSection passes it in as _wantedDay and shows it in the hint.
    id: "gotDay", prompt: "Did you get the day you wanted?", type: "single",
    showIf: (a) => Boolean(a._wantedDay) && a._wantedDay !== DK,
    options: [o("yes", "Yes"), o("partly", "Partly"), o("no", "No")],
  },
  {
    id: "insteadWhat", fillIn: "other", prompt: "What happened instead?", hint: "Pick any", type: "multi",
    showIf: (a) => Boolean(a._wantedDay) && a._wantedDay !== DK && (a.gotDay === "partly" || a.gotDay === "no"),
    options: [o("restedMore", "Rested or slept more than I wanted"), o("didLess", "Did less than I wanted"), o("didMore", "Did more than I wanted"), o("other", "Something else")],
  },
  // ---- People and alone time ----
  {
    id: "people", prompt: "Time with people today", type: "single", max: 3,
    options: [o("none", "None", 0), o("little", "A little", 1), o("some", "Some", 2), o("lot", "A lot", 3)],
  },
  {
    id: "who", fillIn: "other", prompt: "Who?", hint: "Pick any", type: "multi", optionsFromProfile: "whoList",
    showIf: (a) => ["little", "some", "lot"].includes(a.people),
    options: WHO_OPTIONS,
  },
  {
    id: "peopleFelt", prompt: "How did people time feel?", type: "single",
    showIf: (a) => ["little", "some", "lot"].includes(a.people),
    options: [o("good", "Good", 0), o("okay", "Okay", 1), o("draining", "Draining", 3), o("hard", "Hard", 4)],
  },
  {
    id: "drainingWho", prompt: "Who was it with?", hint: "Pick any", type: "multi",
    showIf: (a) => (a.peopleFelt === "draining" || a.peopleFelt === "hard") && Array.isArray(a.who) && a.who.filter((x) => x !== DK).length > 1,
    optionsFromProfile: "whoList",
    optionsFrom: "who", // only the people picked above are shown
    options: WHO_OPTIONS,
  },
  {
    id: "batteryRespected", prompt: "Did you respect your social battery today?", type: "single",
    options: [o("yes", "Yes"), o("no", "No")],
  },
  {
    id: "batteryWhy", fillIn: "other", prompt: "What happened?", hint: "Pick any", type: "multi",
    showIf: (a) => a.batteryRespected === "no",
    options: [o("tooManyPlans", "Made too many plans"), o("tooLong", "Hung out too long"), o("other", "Something else")],
  },
  {
    id: "batteryReceived", prompt: "How was it received by others?", type: "single",
    showIf: (a) => a.batteryRespected === "yes",
    options: [o("fine", "Fine"), o("understood", "They understood"), o("pushback", "Some pushback"), o("upset", "Someone was upset"), o("noticed", "Nobody noticed"), o("na", "Didn't come up")],
  },
  {
    id: "aloneFelt", prompt: "Alone time today felt…", type: "single",
    options: [o("none", "Didn't get any"), o("notEnough", "Not enough"), o("right", "About right"), o("tooMuch", "Too much")],
  },
  {
    id: "aloneBlocked", fillIn: "other", prompt: "What got in the way?", hint: "Pick any", type: "multi",
    showIf: (a) => a.aloneFelt === "none" || a.aloneFelt === "notEnough",
    options: [o("school", "School"), o("work", "Work"), o("family", "Family needs"), o("plans", "Plans with people"), o("chores", "Chores"), o("couldntSayNo", "Couldn't say no"), o("other", "Something else")],
  },
  {
    id: "meltdown", prompt: "Meltdown or shutdown today?", type: "single",
    options: [o("no", "No"), o("almost", "Almost"), o("meltdown", "Meltdown"), o("shutdown", "Shutdown"), o("both", "Both")],
  },
  {
    id: "helpedCalm", fillIn: "other", prompt: "What helped you come back down?", type: "multi", exclusive: "nothingYet",
    showIf: (a) => ["almost", "meltdown", "shutdown", "both"].includes(a.meltdown),
    options: [o("quiet", "Quiet or dark space"), o("headphones", "Headphones"), o("alone", "Alone time"), o("pressure", "Pressure / weighted blanket"), o("stim", "Stimming"), o("sleep", "Sleep"), o("someone", "Someone helped"), o("other", "Something else"), o("nothingYet", "Nothing yet")],
  },
  {
    id: "bestPart", prompt: "Best part of today?", type: "multi", optional: true,
    options: [o("food", "Food"), o("people", "People"), o("quiet", "Quiet time"), o("made", "Something I made"), o("funny", "Something funny"), o("done", "Got stuff done"), o("pets", "Animals"), o("nothing", "Nothing much")],
  },
];

const BODY = [
  { id: "headache", prompt: "Headache", type: "single", options: SEVERITY, max: 3 },
  { id: "stomach", prompt: "Stomach (nausea, cramps)", type: "single", options: SEVERITY, max: 3 },
  { id: "tension", prompt: "Muscle tension or clenching", type: "single", options: SEVERITY, max: 3 },
  // ---- Folded in from the old POTS / EDS sections ----
  { id: "dizzy", prompt: "Dizzy or lightheaded", type: "single", options: SEVERITY, max: 3 },
  { id: "faint", prompt: "Fainted or almost fainted?", type: "single", options: [o("no", "No"), o("almost", "Almost"), o("yes", "Yes")] },
  { id: "flare", prompt: "Flare day?", type: "single", options: YES_NO },
  { id: "dislocation", prompt: "Any dislocations?", type: "single", options: YES_NO },
  {
    id: "dislocationWhere", prompt: "Where?", type: "multi", dk: false, options: BODY_LOCATIONS,
    showIf: (a) => a.dislocation === "yes",
  },
  {
    id: "dislocationType", prompt: "Partial or total?", type: "single",
    showIf: (a) => a.dislocation === "yes",
    options: [o("partial", "Partial"), o("total", "Total"), o("both", "Both")],
  },
  {
    id: "dislocationDuration", prompt: "Did it pop back in?", type: "single",
    showIf: (a) => a.dislocation === "yes",
    options: [o("popped", "Popped out and back in"), o("stayed", "Stayed out for a while")],
  },
  {
    id: "dislocationHowLong", prompt: "For how long?", type: "single",
    showIf: (a) => a.dislocation === "yes" && a.dislocationDuration === "stayed",
    options: [o("minutes", "A few minutes"), o("hour", "Up to an hour"), o("hours", "Hours"), o("still", "Still out")],
  },
  { id: "thinkClearly", prompt: "Was it hard to think clearly?", type: "single", options: SEVERITY, max: 3 },
  {
    id: "helpedBody", fillIn: "other", prompt: "What helped your body today?", type: "multi", exclusive: "nothingWorked",
    showIf: (a) => ["headache", "stomach", "tension", "thinkClearly"].some((k) => a[k] === "hard" || a[k] === "couldnt"),
    options: [o("lyingDown", "Lying down"), o("saltWater", "Salt or water"), o("compression", "Compression"), o("heatIce", "Heat or ice"), o("stretching", "Stretching"), o("meds", "Meds"), o("other", "Something else"), o("nothingWorked", "Nothing worked")],
  },
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
  { id: "masking", prompt: "Did you have to act \"normal\" or hide things a lot?", type: "single", options: [o("no", "No", 0), o("little", "A little", 2), o("lot", "A lot", 4)] },
  { id: "loved", prompt: "Time on things you love?", type: "single", options: [o("none", "None", 0), o("some", "Some", 2), o("lot", "A lot", 4)] },
  { id: "moved", prompt: "Moved your body or got outside?", type: "single", options: [o("no", "No", 0), o("little", "A little", 2), o("yes", "Yes", 4)] },
  { id: "screensLate", prompt: "On screens late at night?", type: "single", options: [o("no", "No", 0), o("some", "Some", 2), o("lot", "A lot", 4)] },
  {
    id: "events", fillIn: "other", prompt: "Anything big happen?", type: "multi", optional: true,
    options: [o("conflict", "Conflict"), o("test", "Test"), o("cancelled", "Plans cancelled"), o("goodNews", "Good news"), o("loss", "Loss"), o("other", "Other")],
  },
  {
    id: "impulsive", prompt: "Anything today that surprised you about yourself?", type: "multi", exclusive: "none",
    options: [o("spent", "Bought something"), o("regret", "Said something"), o("risky", "Tried something new"), o("ate", "Ate a lot"), o("late", "Stayed up late"), o("none", "Nope")],
  },
  { id: "win", prompt: "Win of the day", hint: "Tiny wins count", type: "text", optional: true, dk: false, placeholder: "e.g. Took my meds" },
];

const WRAP = [
  {
    id: "helpedToday", fillIn: "other", prompt: "Something that helped today?", type: "multi", optional: true, exclusive: "nothing",
    options: [o("rest", "Rest"), o("music", "Music"), o("alone", "Alone time"), o("people", "People"), o("outside", "Going outside"), o("food", "Good food"), o("meds", "Meds"), o("interest", "Favorite thing / special interest"), o("other", "Something else"), o("nothing", "Nothing really")],
  },
  { id: "safety", prompt: "Any thoughts today of not wanting to be here, or of hurting yourself?", type: "single", options: SAFETY_OPTIONS, dk: false, ge: true, safety: true },
  { id: "dayNote", prompt: "Anything you want to remember about today?", type: "text", optional: true, dk: false, placeholder: "Optional — you choose later whether doctors see it" },
];

/* ---------- Weekly look-back ---------- */

export const LOOKBACK_QUESTIONS = [
  {
    id: "overall", prompt: "Looking back at the past week, it was…", type: "single",
    options: [o("usual", "Mostly my usual"), o("down", "More down"), o("up", "More up"), o("mixed", "Up and down")],
  },
  {
    id: "hindsight", prompt: "Anything look different now than it felt at the time?", type: "single",
    options: [o("no", "No"), o("wound", "I was more wound up than I realized"), o("lower", "I was lower than I realized"), o("both", "Both, at different times")],
  },
  {
    id: "squeezed", prompt: "Did anything get squeezed out this week?", hint: "Pick any", type: "multi", exclusive: "nothing",
    options: [o("alone", "Alone time"), o("rest", "Rest"), o("friends", "Friends"), o("school", "School"), o("hobbies", "Hobbies"), o("nothing", "Nothing")],
  },
  { id: "note", prompt: "Anything stand out?", type: "text", optional: true, dk: false, placeholder: "Optional" },
];

/* ---------- Section registry ---------- */

export const SECTIONS = [
  { id: "sleep", label: "Sleep", emoji: "😴", color: "mauve", time: "~30 sec", questions: SLEEP },
  { id: "checkins", label: "Check-in", emoji: "📝", color: "terra", time: "~15 sec", custom: true, ge: true },
  { id: "mood", label: "Your day", emoji: "💜", color: "mauve", time: "~1 min", questions: DAY },
  { id: "symptoms", label: "Body", emoji: "🩺", color: "sage", time: "~20 sec", questions: BODY },
  { id: "nutrition", label: "Fuel + meds", emoji: "🍽️", color: "gold", time: "~45 sec", questions: FUEL },
  { id: "habits", label: "School + focus", emoji: "⭐", color: "mauve", time: "~1 min", questions: SCHOOL },
  { id: "wrap", label: "Last check", emoji: "🌙", color: "terra", time: "~10 sec", questions: WRAP },
];

for (const s of SECTIONS) {
  if (s.questions) s.ge = s.questions.some((q) => q.ge);
}

export const SECTION_BY_ID = Object.fromEntries(SECTIONS.map((s) => [s.id, s]));

/** Sections that can't be turned off (check-in and the safety question). */
export const LOCKED_SECTIONS = ["checkins", "wrap"];

const hiddenSet = (profile) => new Set(profile?.hidden || []);

export const sectionsFor = (goodEnough, profile) => {
  const hidden = hiddenSet(profile);
  return SECTIONS.filter((s) => (goodEnough ? s.ge : true) && (LOCKED_SECTIONS.includes(s.id) || !hidden.has(s.id)));
};

/** True if the person turned this question off in Settings. Safety can't be hidden. */
export const isHidden = (q, sectionId, profile) =>
  !q.safety && hiddenSet(profile).has(`${sectionId}.${q.id}`);

/** All questions keyed "section.field" for lookups in history/export. */
export const QUESTION_INDEX = (() => {
  const idx = {};
  for (const s of SECTIONS) for (const q of s.questions || []) idx[`${s.id}.${q.id}`] = { ...q, section: s.id };
  for (const q of CHECKIN_QUESTIONS) idx[`checkin.${q.id}`] = { ...q, section: "checkin" };
  return idx;
})();

/** Short typed answer allowed when the "other" option is picked. Stored as `${id}Other`. */
export const FILL_IN_MAX = 40;
export const fillKey = (q) => `${q.id}Other`;

export const hasDk = (q) => q.dk !== false && (q.type === "single" || q.type === "multi");

export const isVisible = (q, answers, profile, goodEnough, sectionId) => {
  if (goodEnough && !q.ge) return false;
  if (sectionId && isHidden(q, sectionId, profile)) return false;
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
