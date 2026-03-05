// src/utils.js — Rooted Health Tracker
// Shared utilities: tap sound, encouraging messages, date helpers

/** Tap sound — Web Audio API oscillator */
export const playTap = () => {
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

/** Encouraging messages — used after section saves */
export const ENCOURAGING_MESSAGES = [
  "Even logging one thing counts. Seriously.",
  "Your future self will love having this.",
  "You showed up. That is the whole thing.",
  "This took 30 seconds and it mattered.",
  "One more day of data. You are doing it.",
  "No pressure — just show up as you are.",
  "Every entry is a small act of self-care.",
  "You do not have to be perfect to track.",
];

/** Pick a random encouraging message */
export const randomMessage = () =>
  ENCOURAGING_MESSAGES[Math.floor(Math.random() * ENCOURAGING_MESSAGES.length)];

/** Format a Date to YYYY-MM-DD (local timezone) */
export const formatDate = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;

/** Get the day-of-month from a YYYY-MM-DD string */
export const dayFromDateKey = (key) => parseInt(key.split("-")[2], 10);

/** Days in a given month (1-indexed month) */
export const daysInMonth = (year, month) => new Date(year, month, 0).getDate();