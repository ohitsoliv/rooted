// src/hooks/useAuth.js — Rooted Health Tracker
// Custom hook: manages Firebase Auth state (Google Sign-In)

import { useState, useEffect, useCallback } from "react";
import {
  auth,
  signInWithGoogle,
  logOut,
  onAuthStateChanged,
} from "../firebase";

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
      setUser(firebaseUser);
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
      await logOut();
    } catch (err) {
      setError(err.message);
    }
  }, []);

  return { user, loading, error, login, logout };
}
