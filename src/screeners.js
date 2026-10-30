// src/screeners.js — PHQ-9 and GAD-7, standard wording and scoring.
// Both are public domain (developed by Drs. Spitzer, Williams, Kroenke et al.,
// grant from Pfizer); no permission is required to reproduce them.

export const FREQUENCY = [
  { id: 0, label: "Not at all" },
  { id: 1, label: "Several days" },
  { id: 2, label: "More than half the days" },
  { id: 3, label: "Nearly every day" },
];

export const PHQ9 = {
  id: "phq9",
  name: "PHQ-9",
  stem: "Over the last 2 weeks, how often have you been bothered by any of the following problems?",
  items: [
    "Little interest or pleasure in doing things",
    "Feeling down, depressed, or hopeless",
    "Trouble falling or staying asleep, or sleeping too much",
    "Feeling tired or having little energy",
    "Poor appetite or overeating",
    "Feeling bad about yourself — or that you are a failure or have let yourself or your family down",
    "Trouble concentrating on things, such as reading the newspaper or watching television",
    "Moving or speaking so slowly that other people could have noticed? Or the opposite — being so fidgety or restless that you have been moving around a lot more than usual",
    "Thoughts that you would be better off dead or of hurting yourself in some way",
  ],
  bands: [
    [0, 4, "Minimal"],
    [5, 9, "Mild"],
    [10, 14, "Moderate"],
    [15, 19, "Moderately severe"],
    [20, 27, "Severe"],
  ],
  max: 27,
};

export const GAD7 = {
  id: "gad7",
  name: "GAD-7",
  stem: "Over the last 2 weeks, how often have you been bothered by the following problems?",
  items: [
    "Feeling nervous, anxious, or on edge",
    "Not being able to stop or control worrying",
    "Worrying too much about different things",
    "Trouble relaxing",
    "Being so restless that it is hard to sit still",
    "Becoming easily annoyed or irritable",
    "Feeling afraid, as if something awful might happen",
  ],
  bands: [
    [0, 4, "Minimal"],
    [5, 9, "Mild"],
    [10, 14, "Moderate"],
    [15, 21, "Severe"],
  ],
  max: 21,
};

export const band = (tool, total) => tool.bands.find(([lo, hi]) => total >= lo && total <= hi)?.[2] || "";

export const total = (answers = []) =>
  answers.length && answers.every((a) => typeof a === "number") ? answers.reduce((s, a) => s + a, 0) : null;
