// src/hooks/useAuth.js — Rooted Health Tracker
// Custom hook: manages Firebase Auth state (Google Sign-In)

import { useState, useEffect, useCallback } from "react";
import {
  auth,
  signInWithGoogle,
  logOut,
  onAuthStateChanged,
} from "../firebase";

const GUEST_PROFILE_KEY = "rooted_guest_profile";

function readGuestProfile() {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(GUEST_PROFILE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || !parsed.uid) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeGuestProfile(profile) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(GUEST_PROFILE_KEY, JSON.stringify(profile));
  } catch {
    return;
  }
}

function clearGuestProfile() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(GUEST_PROFILE_KEY);
  } catch {
    return;
  }
}

function createGuestUser() {
  const existing = readGuestProfile();
  if (existing) return existing;

  const randomSuffix = Math.random().toString(36).slice(2, 8);
  const guest = {
    uid: `guest_local_${randomSuffix}`,
    displayName: "Guest",
    email: null,
    isGuest: true,
  };
  writeGuestProfile(guest);
  return guest;
}

/**
 * useAuth — returns { user, loading, error, login, logout }
 *
 * - `user` is the Firebase user object (or null if signed out)
 * - `loading` is true while we wait for Firebase to resolve the session
 * - `error` holds any auth error message (auto-clears on retry)
 * - `login()` triggers Google Sign-In popup
 * - `logout()` signs the user out
 */
export default function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // true until first auth check
  const [error, setError] = useState(null);

  // Listen to auth state changes (fires once on load, then on login/logout)
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        clearGuestProfile();
        setUser(firebaseUser);
      } else {
        setUser(readGuestProfile());
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const login = useCallback(async () => {
    setError(null);
    try {
      await signInWithGoogle();
    } catch (err) {
      // Don't treat popup-closed as an error — user just changed their mind
      if (err.code === "auth/popup-closed-by-user") return;
      if (err.code === "auth/cancelled-popup-request") return;
      setError(err.message);
    }
  }, []);

  const logout = useCallback(async () => {
    setError(null);
    try {
      if (user?.isGuest) {
        clearGuestProfile();
        setUser(null);
        return;
      }
      await logOut();
    } catch (err) {
      setError(err.message);
    }
  }, [user]);

  const loginAsGuest = useCallback(() => {
    setError(null);
    const guest = createGuestUser();
    setUser(guest);
    setLoading(false);
  }, []);

  return { user, loading, error, login, loginAsGuest, logout };
}
