// Questions for filling in a missed day from memory. Answers are stored as
// option indexes and flagged `backfilled`, so the report can count them
// separately. src/analysis/normalize.js maps these fields.

export const BACKFILL_QUESTIONS = [
  {
    section: "mood",
    field: "overallMood",
    type: "emoji5",
    prompt: "How was your mood that day, roughly?",
    options: [
      { emoji: "😢", label: "Very low" },
      { emoji: "😕", label: "Low" },
      { emoji: "😐", label: "Okay" },
      { emoji: "🙂", label: "Good" },
      { emoji: "😄", label: "Very good" },
    ],
  },
  {
    section: "mood",
    field: "recallActivation",
    type: "emoji5",
    prompt: "How did your body feel that day?",
    options: [
      { emoji: "🛌", label: "Stay in bed" },
      { emoji: "🐢", label: "Slow" },
      { emoji: "🙂", label: "My usual" },
      { emoji: "⚡", label: "Lots of energy" },
      { emoji: "🌪️", label: "Couldn't sit still" },
    ],
  },
  {
    section: "symptoms",
    field: "recallPainStop",
    type: "emoji5",
    prompt: "Did pain stop you from doing things?",
    options: [
      { emoji: "😌", label: "No" },
      { emoji: "🐢", label: "Slowed me" },
      { emoji: "🛑", label: "Stopped me" },
    ],
  },
  {
    section: "eds",
    field: "flareDay",
    type: "yesno",
    prompt: "Was it a flare day?",
  },
  {
    section: "mood",
    field: "note",
    type: "text",
    prompt: "Anything you remember about that day?",
  },
];
