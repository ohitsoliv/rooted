// src/profile.js — Rooted Health Tracker
// User profile: medications (with a dated change log), cycle tracking,
// trusted contact, screener schedule.
//
// Stored as the document users/{uid}/logs/_profile so the existing Firestore
// rules cover it. "_" sorts after digits, so date-range queries never return it.

import { useState, useEffect, useCallback } from "react";
import { fetchLog, saveLog, dateKey } from "./firebase";

export const PROFILE_DOC = "_profile";
export const SCREENER_INTERVAL_DAYS = 14;

export const EMPTY_PROFILE = {
  meds: [], // { id, name, dose, stimulant, since, stopped, changes: [{ date, text }] }
  cycleTracking: false,
  trustedContact: { name: "", phone: "" },
  lastScreener: null,
};

export function screenerDue(profile, today = dateKey()) {
  if (!profile) return false;
  if (!profile.lastScreener) return true;
  const days = (new Date(`${today}T12:00:00`) - new Date(`${profile.lastScreener}T12:00:00`)) / 86400000;
  return days >= SCREENER_INTERVAL_DAYS;
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
      setProfile({ ...EMPTY_PROFILE, ...(data || {}) });
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
