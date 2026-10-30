// src/App.jsx — Rooted Health Tracker
// Root component: auth gate, routing, data orchestration

import { useState, useCallback, useMemo, lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import useAuth from "./hooks/useAuth";
import useLog from "./hooks/useLog";
import useLogs from "./hooks/useLogs";
import { logDayKey, saveLog } from "./firebase";
import useProfile from "./profile";
import SafetySupport from "./components/SafetySupport";
import SyncBanner from "./components/SyncBanner";

const Home = lazy(() => import("./pages/Home"));
const Log = lazy(() => import("./pages/Log"));
const Summary = lazy(() => import("./pages/Summary"));
const History = lazy(() => import("./pages/History"));
const Export = lazy(() => import("./pages/Export"));
const PastLog = lazy(() => import("./pages/PastLog"));
const Login = lazy(() => import("./pages/Login"));
const Settings = lazy(() => import("./pages/Settings"));
const Screeners = lazy(() => import("./pages/Screeners"));
const Lookback = lazy(() => import("./pages/Lookback"));

/** Get the first and last day of a month as YYYY-MM-DD strings. */
function getMonthRange(year, month) {
  const first = `${year}-${String(month + 1).padStart(2, "0")}-01`;
  const lastDay = new Date(year, month + 1, 0).getDate();
  const last = `${year}-${String(month + 1).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
  return { first, last };
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
  const today = logDayKey();
  const {
    log,
    updateField,
    updateSection,
    reload: reloadLog,
    saveSection,
    completedSections,
  } = useLog(user?.uid, today);

  // Profile (meds, cycle tracking, support contact)
  const { profile, updateProfile } = useProfile(user?.uid);

  // Safety support screen
  const [showSupport, setShowSupport] = useState(false);
  const handleSafety = useCallback(() => setShowSupport(true), []);

  // Month logs (for Summary, History, Export pages)
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });
  const { year, month } = selectedMonth;
  const { first, last } = useMemo(() => getMonthRange(year, month), [year, month]);
  const {
    logs: monthLogs,
    loading: monthLoading,
    refetch: refetchMonthLogs,
  } = useLogs(user?.uid, first, last);

  const handleMonthChange = useCallback((offset) => {
    setSelectedMonth((current) => {
      const next = new Date(current.year, current.month + offset, 1);
      const now = new Date();
      if (next > new Date(now.getFullYear(), now.getMonth(), 1)) return current;
      return { year: next.getFullYear(), month: next.getMonth() };
    });
  }, []);

  // Logging mode: "full" | "good" | "bare". Picked on Home for today only;
  // each new day starts from the default chosen in Settings.
  const [modeChoice, setModeChoice] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("rooted_mode") || "null");
    } catch {
      return null;
    }
  });
  const mode = modeChoice?.day === today ? modeChoice.mode : profile.defaultMode || "full";
  const goodEnough = mode === "good" || mode === "bare";

  const handleModeChange = useCallback((m) => {
    const next = { day: today, mode: m };
    setModeChoice(next);
    try {
      localStorage.setItem("rooted_mode", JSON.stringify(next));
    } catch {
      // per-browser convenience only
    }
  }, [today]);

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
      // Record a shortened day so the report doesn't count unasked questions as skipped
      if (mode !== "full" && userId) await saveLog(userId, today, { mode });
      refetchMonthLogs();
    }
    return ok;
  }, [saveSection, refetchMonthLogs, mode, userId, today]);

  // Bare minimum: one screen, saved straight into the normal sections
  const handleBareSave = useCallback(async ({ mood, body, mind, sleepHours, meds }) => {
    if (!userId) return false;
    const cis = Array.isArray(log.checkins) ? log.checkins : log.checkins?.checkins || [];
    const ci = { timestamp: new Date().toISOString(), bare: true };
    if (mood) ci.mood = mood;
    if (body) ci.body = body;
    if (mind) ci.activation = mind;
    const payload = { mode: "bare" };
    const done = new Set(log.completedSections || []);
    if (mood || body || mind) {
      payload.checkins = { checkins: [...cis, ci] };
      done.add("checkins");
    }
    if (sleepHours) {
      payload.sleep = { ...(log.sleep || {}), sleepHours };
      done.add("sleep");
    }
    if (meds) {
      payload.nutrition = { ...(log.nutrition || {}), meds: { ...(log.nutrition?.meds || {}), _all: meds } };
      done.add("nutrition");
    }
    payload.completedSections = [...done];
    const result = await saveLog(userId, today, payload);
    if (result.ok) {
      Object.entries(payload).forEach(([k, v]) => {
        if (k !== "completedSections" && k !== "mode") updateSection(k, v);
      });
      refetchMonthLogs();
      reloadLog();
    }
    return result.ok;
  }, [userId, log, today, updateSection, refetchMonthLogs, reloadLog]);

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
      <SyncBanner user={user} />
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
                mode={mode}
                onModeChange={handleModeChange}
                onBareSave={handleBareSave}
                onLogout={logout}
                profile={profile}
                onUpdateProfile={updateProfile}
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
                profile={profile}
                onSafety={handleSafety}
              />
            }
          />
          <Route
            path="/log/:date"
            element={<PastLog user={user} onSaved={refetchMonthLogs} />}
          />
          <Route
            path="/summary"
            element={
              <Summary
                logs={monthLogs}
                loading={monthLoading}
                year={year}
                month={month}
                onMonthChange={handleMonthChange}
                profile={profile}
              />
            }
          />
          <Route
            path="/history"
            element={
              <History
                logs={monthLogs}
                loading={monthLoading}
                year={year}
                month={month}
                onMonthChange={handleMonthChange}
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
                year={year}
                month={month}
                user={user}
                profile={profile}
              />
            }
          />
          <Route
            path="/lookback"
            element={<Lookback user={user} onDone={async (day) => { await updateProfile({ lastLookback: day }); refetchMonthLogs(); }} />}
          />
          <Route path="/settings" element={<Settings profile={profile} onUpdate={updateProfile} />} />
          <Route
            path="/screeners"
            element={
              <Screeners
                user={user}
                onSafety={handleSafety}
                onDone={async (day) => { await updateProfile({ lastScreener: day }); refetchMonthLogs(); }}
              />
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
      {showSupport && <SafetySupport contact={profile.trustedContact} onClose={() => setShowSupport(false)} />}
    </BrowserRouter>
  );
}