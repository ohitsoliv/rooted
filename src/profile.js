// src/profile.js — Rooted Health Tracker
// User profile: medications (with a dated change log), cycle tracking,
// trusted contact, screener schedule.
//
// Stored as the document users/{uid}/logs/_profile so the existing Firestore
// rules cover it. "_" sorts after digits, so date-range queries never return it.

import { useState, useEffect, useCallback } from "react";
import { fetchLog, saveLog, logDayKey, dateKey } from "./firebase";

export const PROFILE_DOC = "_profile";
export const SCREENER_INTERVAL_DAYS = 14;

export const EMPTY_PROFILE = {
  meds: [], // { id, name, dose, stimulant, since, stopped, changes: [{ date, text }] }
  cycleTracking: false,
  trustedContact: { name: "", phone: "" },
  lastScreener: null,
  defaultMode: "full", // "full" | "good" | "bare"
  whoList: [], // labels for "Who?"; empty = default list
  hidden: [], // "section" or "section.question" keys the person turned off
  sickEpisodes: [], // [{ start, end|null }] — end null = still sick/injured
  lastLookback: null,
  firstSeen: null,
};

export const LOOKBACK_INTERVAL_DAYS = 7;
const daysBetween = (a, b) => (new Date(`${b}T12:00:00`) - new Date(`${a}T12:00:00`)) / 86400000;

/** Weekly look-back is due 7 days after the last one (or after the first week of use). */
export function lookbackDue(profile, today = logDayKey()) {
  const since = profile?.lastLookback || profile?.firstSeen;
  return Boolean(since) && daysBetween(since, today) >= LOOKBACK_INTERVAL_DAYS;
}

export function screenerDue(profile, today = logDayKey()) {
  if (!profile) return false;
  if (!profile.lastScreener) return true;
  const days = (new Date(`${today}T12:00:00`) - new Date(`${profile.lastScreener}T12:00:00`)) / 86400000;
  return days >= SCREENER_INTERVAL_DAYS;
}

/* ---- Sick / injured episodes (on until switched off, like a period) ---- */

export const currentSickEpisode = (profile) => (profile?.sickEpisodes || []).find((e) => !e.end) || null;

const shiftDay = (iso, n) => {
  const d = new Date(`${iso}T12:00:00`);
  d.setDate(d.getDate() + n);
  return dateKey(d);
};

/** Start an episode (default today). */
export function startSick(profile, start = logDayKey()) {
  return [...(profile?.sickEpisodes || []).filter((e) => e.end), { start, end: null }];
}

/** End the open episode: feeling better today means the last sick day was yesterday. */
export function endSick(profile, today = logDayKey()) {
  return (profile?.sickEpisodes || [])
    .map((e) => (e.end ? e : { ...e, end: shiftDay(today, -1) }))
    .filter((e) => e.end >= e.start); // switched on and off the same day = undo
}

/** Set of sick dates between start and end (inclusive). */
export function sickDates(profile, start, end, today = logDayKey()) {
  const out = new Set();
  for (const e of profile?.sickEpisodes || []) {
    let d = e.start < start ? start : e.start;
    const last = (e.end || today) > end ? end : e.end || today;
    while (d <= last) {
      out.add(d);
      d = shiftDay(d, 1);
    }
  }
  return out;
}

/** Med changes (start, dose change, stop) falling inside a date range. */
export function medChangesInRange(profile, start, end) {
  const out = [];
  for (const m of profile?.meds || []) {
    for (const c of m.changes || []) {
      if (c.date >= start && c.date <= end) out.push({ date: c.date, text: `${m.name}: ${c.text}` });
    }
  }
  return out.sort((a, b) => a.date.localeCompare(b.date));
}

export default function useProfile(userId) {
  const [profile, setProfile] = useState(EMPTY_PROFILE);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let alive = true;
    if (!userId) return undefined;
    fetchLog(userId, PROFILE_DOC).then((data) => {
      if (!alive) return;
      const loadedProfile = { ...EMPTY_PROFILE, ...(data || {}) };
      if (!loadedProfile.firstSeen) {
        loadedProfile.firstSeen = logDayKey();
        saveLog(userId, PROFILE_DOC, { firstSeen: loadedProfile.firstSeen });
      }
      setProfile(loadedProfile);
      setLoaded(true);
    });
    return () => {
      alive = false;
    };
  }, [userId]);

  const updateProfile = useCallback(
    async (patch) => {
      setProfile((p) => ({ ...p, ...patch }));
      if (userId) await saveLog(userId, PROFILE_DOC, patch);
    },
    [userId]
  );

  return { profile, loaded, updateProfile };
}
