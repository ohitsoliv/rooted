// src/App.jsx — Rooted Health Tracker
// Root component: auth gate, routing, data orchestration

import { useState, useCallback, useMemo, lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import useAuth from "./hooks/useAuth";
import useLog from "./hooks/useLog";
import useLogs from "./hooks/useLogs";
import { dateKey, saveLog } from "./firebase";

const Home = lazy(() => import("./pages/Home"));
const Log = lazy(() => import("./pages/Log"));
const Summary = lazy(() => import("./pages/Summary"));
const History = lazy(() => import("./pages/History"));
const Export = lazy(() => import("./pages/Export"));
const Login = lazy(() => import("./pages/Login"));

/** Get the first and last day of the current month as YYYY-MM-DD strings. */
function getMonthRange() {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  const first = `${y}-${String(m + 1).padStart(2, "0")}-01`;
  const lastDay = new Date(y, m + 1, 0).getDate();
  const last = `${y}-${String(m + 1).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
  return { first, last };
}

/** Get yesterday's date key. */
function yesterdayKey() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return dateKey(d);
}

export default function App() {
  const {
    user,
    loading: authLoading,
    error: authError,
    login,
    loginAsGuest,
    logout,
  } = useAuth();

  // Today's log
  const today = dateKey();
  const {
    log,
    updateField,
    saveSection,
    completedSections,
  } = useLog(user?.uid, today);

  // Yesterday's log (for "same as yesterday" feature)
  const { log: yesterdayLog } = useLog(user?.uid, yesterdayKey());

  // Month logs (for Summary, History, Export pages)
  const { first, last } = useMemo(() => getMonthRange(), []);
  const {
    logs: monthLogs,
    loading: monthLoading,
    refetch: refetchMonthLogs,
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

  // Backup restore handler
  const userId = user?.uid;

  const handleRestore = useCallback(async (logsArray) => {
    if (!userId) return;
    for (const logEntry of logsArray) {
      if (logEntry.date) {
        await saveLog(userId, logEntry.date, logEntry);
      }
    }
    refetchMonthLogs();
  }, [userId, refetchMonthLogs]);

  const handleSaveSection = useCallback(async (sectionName) => {
    const ok = await saveSection(sectionName);
    if (ok) {
      refetchMonthLogs();
    }
    return ok;
  }, [saveSection, refetchMonthLogs]);

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
        <Suspense fallback={null}>
          <Login onLogin={login} onGuestLogin={loginAsGuest} error={authError} />
        </Suspense>
      </BrowserRouter>
    );
  }

  // --- Signed in ---
  return (
    <BrowserRouter>
      <Suspense fallback={null}>
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
                onSaveSection={handleSaveSection}
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
              <History
                logs={monthLogs}
                loading={monthLoading}
              />
            }
          />
          <Route
            path="/export"
            element={
              <Export
                logs={monthLogs}
                loading={monthLoading}
                onRestore={handleRestore}
              />
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}