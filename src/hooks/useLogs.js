// src/hooks/useLogs.js — Rooted Health Tracker
// Custom hook: fetch multiple days of logs for Summary / History pages

import { useState, useEffect, useRef } from "react";
import { fetchLogRange } from "../firebase";

/**
 * useLogs(userId, startDate, endDate)
 *
 * Fetches all log documents between startDate and endDate (inclusive).
 * Dates should be "YYYY-MM-DD" strings.
 *
 * Returns:
 *   logs     — array of log objects sorted by date
 *   loading  — true while fetching
 *   error    — any error message
 *   refetch  — call to manually re-fetch
 */
export default function useLogs(userId, startDate, endDate) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const keyRef = useRef("");

  const doFetch = () => {
    if (!userId || !startDate || !endDate) {
      setLoading(false);
      return;
    }

    const key = `${userId}_${startDate}_${endDate}`;
    keyRef.current = key;
    setLoading(true);
    setError(null);

    fetchLogRange(userId, startDate, endDate)
      .then((data) => {
        if (keyRef.current === key) {
          setLogs(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (keyRef.current === key) {
          setError(err.message);
          setLoading(false);
        }
      });
  };

  useEffect(() => {
    doFetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, startDate, endDate]);

  return { logs, loading, error, refetch: doFetch };
}
