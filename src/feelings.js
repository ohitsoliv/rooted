// src/feelings.js — feeling categories, body sensations, and helpers.

export const FEELINGS = [
  { core: "Happy", emoji: "😊", words: ["Content", "Calm", "Proud", "Hopeful", "Excited", "Loving", "Playful"] },
  { core: "Sad", emoji: "😢", words: ["Lonely", "Hurt", "Disappointed", "Guilty", "Ashamed", "Hopeless", "Grieving"] },
  { core: "Angry", emoji: "😠", words: ["Annoyed", "Frustrated", "Let down", "Disrespected", "Jealous", "Bitter", "Furious"] },
  { core: "Scared", emoji: "😨", words: ["Worried", "Anxious", "Overwhelmed", "Insecure", "Rejected", "Helpless", "Panicky"] },
  { core: "Disgusted", emoji: "🤢", words: ["Embarrassed", "Uncomfortable", "Grossed out", "Judgmental", "Disapproving"] },
  { core: "Surprised", emoji: "😲", words: ["Confused", "Startled", "Shocked", "Amazed"] },
  { core: "Off / blah", emoji: "😶", words: ["Tired", "Bored", "Stressed", "Rushed", "Unfocused", "Numb", "Empty"] },
];

export const SENSATIONS = [
  { id: "tight", label: "Tight" },
  { id: "heavy", label: "Heavy" },
  { id: "buzzy", label: "Buzzy" },
  { id: "shaky", label: "Shaky" },
  { id: "hot", label: "Hot" },
  { id: "cold", label: "Cold" },
  { id: "fluttery", label: "Fluttery" },
  { id: "empty", label: "Empty" },
  { id: "numb", label: "Numb" },
];

/** Human-readable summary of a stored feeling value (new or legacy). */
export function describeFeeling(ci) {
  if (ci?.feeling?.cantTell) return "Can't tell";
  const parts = [];
  for (const f of ci?.feeling?.feelings || []) parts.push(f.word ? `${f.core} (${f.word})` : f.core);
  const sens = (ci?.feeling?.sensations || []).map((id) => SENSATIONS.find((s) => s.id === id)?.label || id);
  if (sens.length) parts.push(`feels ${sens.join(", ").toLowerCase()}`);
  if (!parts.length && ci?.emotion) parts.push(ci.emotion); // older emotion-wheel answers
  return parts.join(" · ");
}

/** Main-level feelings for counting (new answers + older emotion-wheel paths). */
const LEGACY_CORE = { Fearful: "Scared", Bad: "Off / blah" };
export function coreFeelings(ci) {
  if (ci?.feeling?.feelings?.length) return ci.feeling.feelings.map((f) => f.core);
  if (ci?.emotionPath) {
    const first = String(ci.emotionPath).split(" > ")[0];
    return [LEGACY_CORE[first] || first];
  }
  return [];
}
