// src/hooks/useLog.js — Rooted Health Tracker
// Custom hook: read & write a single day's log (users/{uid}/logs/{YYYY-MM-DD})

import { useState, useEffect, useCallback, useRef } from "react";
import { fetchLog, saveLog, dateKey } from "../firebase";

/**
 * useLog(userId, date?)
 *
 * Returns:
 *   log          — the full day-log object (or empty {} while loading)
 *   loading      — true while fetching from Firestore
 *   saving       — true during a save operation
 *   error        — any Firestore error message
 *   updateField  — (section, field, value) => merges into local state instantly
 *   updateSection— (section, data) => merges an entire section object
 *   saveSection  — (sectionName) => persists current local state to Firestore
 *                   and adds sectionName to completedSections
 *   resetSection — (sectionName) => clears a section locally
 *   completedSections — array of section names that have been saved
 */
export default function useLog(userId, date) {
  const today = date || dateKey();
  const requestKey = userId ? `${userId}_${today}` : "";
  const [log, setLog] = useState({});
  const [resolvedKey, setResolvedKey] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Track which version of userId+date we're on to avoid stale writes
  const keyRef = useRef("");
  const logRef = useRef({});

  // Fetch log on mount or when userId/date changes
  useEffect(() => {
    if (!requestKey) {
      keyRef.current = "";
      return;
    }

    const key = requestKey;
    keyRef.current = key;

    fetchLog(userId, today)
      .then((data) => {
        // Only update if we're still looking at the same user+date
        if (keyRef.current === key) {
          const next = data || {};
          logRef.current = next;
          setLog(next);
          setError(null);
          setResolvedKey(key);
        }
      })
      .catch((err) => {
        if (keyRef.current === key) {
          setError(err.message);
          setResolvedKey(key);
        }
      });
  }, [requestKey, today, userId]);

  // --- Local state helpers (instant, no network) ---

  /** Update a single field inside a section: log[section][field] = value */
  const updateField = useCallback((section, field, value) => {
    const current = logRef.current;
    const next = {
      ...current,
      [section]: {
        ...(current[section] || {}),
        [field]: value,
      },
    };
    logRef.current = next;
    setLog(next);
  }, []);

  /** Merge an object into a section: log[section] = { ...old, ...data } */
  const updateSection = useCallback((section, data) => {
    const current = logRef.current;
    const next = {
      ...current,
      [section]: {
        ...(current[section] || {}),
        ...data,
      },
    };
    logRef.current = next;
    setLog(next);
  }, []);

  /** Clear a section back to empty */
  const resetSection = useCallback((section) => {
    const next = { ...logRef.current };
    delete next[section];
    if (next.completedSections) {
      next.completedSections = next.completedSections.filter(
        (s) => s !== section
      );
    }
    logRef.current = next;
    setLog(next);
  }, []);

  // --- Persist to Firestore ---

  /**
   * Save the current local log state to Firestore.
   * Adds `sectionName` to the completedSections array.
   * Returns true on success, false on error.
   */
  const saveSection = useCallback(
    async (sectionName) => {
      if (!userId) return false;
      setSaving(true);
      setError(null);

      try {
        // Build completedSections list
        const current = logRef.current;
        const completed = current.completedSections || [];
        const updatedCompleted = completed.includes(sectionName)
          ? completed
          : [...completed, sectionName];

        // Persist the entire section + updated completedSections
        const payload = {
          [sectionName]: current[sectionName] || {},
          completedSections: updatedCompleted,
        };

        await saveLog(userId, today, payload);

        // Update local state with new completedSections
        const next = {
          ...current,
          completedSections: updatedCompleted,
        };
        logRef.current = next;
        setLog(next);

        setSaving(false);
        return true;
      } catch (err) {
        setError(err.message);
        setSaving(false);
        return false;
      }
    },
    [userId, today, log]
    [userId, today]
  );

  const loading = Boolean(requestKey) && resolvedKey !== requestKey;
  const completedSections = log.completedSections || [];

  return {
    log,
    loading,
    saving,
    error,
    updateField,
    updateSection,
    saveSection,
    resetSection,
    completedSections,
  };
}
