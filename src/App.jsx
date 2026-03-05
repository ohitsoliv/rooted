// src/App.jsx — Rooted Health Tracker
// Root component: auth gate, routing, data orchestration

import { useState, useCallback, useMemo } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import useAuth from "./hooks/useAuth";
import useLog from "./hooks/useLog";
import useLogs from "./hooks/useLogs";
import { dateKey } from "./firebase";
import Home from "./pages/Home";
import Log from "./pages/Log";
import Summary from "./pages/Summary";
import Login from "./pages/Login";

/**
 * Get the first and last day of the current month as YYYY-MM-DD strings.
 */
function getMonthRange() {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  const first = `${y}-${String(m + 1).padStart(2, "0")}-01`;
  const lastDay = new Date(y, m + 1, 0).getDate();
  const last = `${y}-${String(m + 1).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
  return { first, last };
}

/**
 * Get yesterday's date key.
 */
function yesterdayKey() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return dateKey(d);
}

export default function App() {
  const { user, loading: authLoading, error: authError, login, logout } = useAuth();

  // Today's log
  const today = dateKey();
  const {
    log,
    updateField,
    saveSection,
    completedSections,
  } = useLog(user?.uid, today);

  // Yesterday's log (for "same as yesterday" feature)
  const {
    log: yesterdayLog,
  } = useLog(user?.uid, yesterdayKey());

  // Month logs (for Summary page)
  const { first, last } = useMemo(() => getMonthRange(), []);
  const {
    logs: monthLogs,
    loading: monthLoading,
  } = useLogs(user?.uid, first, last);

  // Good Enough Mode — persisted in localStorage
  const [goodEnough, setGoodEnough] = useState(() => {
    try {
      return localStorage.getItem("rooted_goodEnough") === "true";
    } catch {
      return false;
    }
  });

  const handleGoodEnoughToggle = useCallback((val) => {
    setGoodEnough(val);
    try {
      localStorage.setItem("rooted_goodEnough", String(val));
    } catch {
      return;
    }
  }, []);

  // Compute logged days for Garden
  const loggedDays = useMemo(() => {
    return monthLogs
      .filter((l) => l.completedSections && l.completedSections.length > 0)
      .map((l) => {
        if (l.date) return parseInt(l.date.split("-")[2], 10);
        return null;
      })
      .filter(Boolean);
  }, [monthLogs]);

  // --- Auth loading screen ---
  if (authLoading) {
    return (
      <div className="loading-screen">
        <span className="loading-emoji">🌱</span>
        <span className="loading-text">Rooted</span>
      </div>
    );
  }

  // --- Not signed in ---
  if (!user) {
    return (
      <BrowserRouter>
        <Login onLogin={login} error={authError} />
      </BrowserRouter>
    );
  }

  // --- Signed in ---
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            <Home
              user={user}
              log={log}
              completedSections={completedSections}
              loggedDays={loggedDays}
              goodEnough={goodEnough}
              onGoodEnoughToggle={handleGoodEnoughToggle}
              onLogout={logout}
            />
          }
        />
        <Route
          path="/log"
          element={
            <Log
              log={log}
              completedSections={completedSections}
              goodEnough={goodEnough}
              onUpdateField={updateField}
              onSaveSection={saveSection}
              yesterdayLog={yesterdayLog}
            />
          }
        />
        <Route
          path="/summary"
          element={
            <Summary
              logs={monthLogs}
              loading={monthLoading}
            />
          }
        />
        <Route
          path="/history"
          element={
            <Summary
              logs={monthLogs}
              loading={monthLoading}
            />
          }
        />
        <Route
          path="/export"
          element={
            <Summary
              logs={monthLogs}
              loading={monthLoading}
            />
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}