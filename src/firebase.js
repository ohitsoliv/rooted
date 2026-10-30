import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  setDoc,
  documentId,
} from "firebase/firestore";

const readEnv = (key) => String(import.meta.env[key] || "").trim();

const firebaseConfig = {
  apiKey: readEnv("VITE_FIREBASE_API_KEY"),
  authDomain: readEnv("VITE_FIREBASE_AUTH_DOMAIN"),
  projectId: readEnv("VITE_FIREBASE_PROJECT_ID"),
  storageBucket: readEnv("VITE_FIREBASE_STORAGE_BUCKET"),
  messagingSenderId: readEnv("VITE_FIREBASE_MESSAGING_SENDER_ID"),
  appId: readEnv("VITE_FIREBASE_APP_ID"),
};

const requiredEnv = [
  "VITE_FIREBASE_API_KEY",
  "VITE_FIREBASE_AUTH_DOMAIN",
  "VITE_FIREBASE_PROJECT_ID",
  "VITE_FIREBASE_STORAGE_BUCKET",
  "VITE_FIREBASE_MESSAGING_SENDER_ID",
  "VITE_FIREBASE_APP_ID",
];

const missingEnv = requiredEnv.filter((key) => !readEnv(key));

if (missingEnv.length > 0) {
  throw new Error(
    `Missing Firebase env vars: ${missingEnv.join(", ")}. ` +
      "Add them to .env.local and Vercel Project Settings -> Environment Variables."
  );
}

if (!String(firebaseConfig.apiKey).startsWith("AIza")) {
  throw new Error(
    "Invalid VITE_FIREBASE_API_KEY value. Check your Firebase web app config in Firebase Console."
  );
}

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

const localCacheKey = (userId) => `rooted_logs_${userId}`;
const isLocalOnlyUser = (userId) => String(userId || "").startsWith("guest_local_");

function readLocalLogs(userId) {
  if (typeof window === "undefined" || !userId) return {};
  try {
    const raw = window.localStorage.getItem(localCacheKey(userId));
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeLocalLogs(userId, logsByDate) {
  if (typeof window === "undefined" || !userId) return false;
  try {
    window.localStorage.setItem(localCacheKey(userId), JSON.stringify(logsByDate));
    return true;
  } catch {
    return false;
  }
}

/* ---- Unsynced days: saved on this device, not yet in Firestore ---- */

const pendingKey = (userId) => `rooted_pending_${userId}`;

export function getPending(userId) {
  try {
    return JSON.parse(window.localStorage.getItem(pendingKey(userId)) || "[]");
  } catch {
    return [];
  }
}

function setPending(userId, list) {
  try {
    window.localStorage.setItem(pendingKey(userId), JSON.stringify([...new Set(list)]));
  } catch {
    // nothing else we can do; the banner will still show from memory
  }
  window.dispatchEvent(new CustomEvent("rooted-sync", { detail: { pending: list.length } }));
}

/** Push every unsynced day to Firestore. Returns the number still pending. */
export async function syncPending(userId) {
  if (!userId || isLocalOnlyUser(userId)) return 0;
  const pending = getPending(userId);
  if (!pending.length) return 0;
  const local = readLocalLogs(userId);
  const still = [];
  for (const dayKey of pending) {
    try {
      await setDoc(doc(db, "users", userId, "logs", dayKey), local[dayKey] || {}, { merge: true });
    } catch {
      still.push(dayKey);
    }
  }
  setPending(userId, still);
  return still.length;
}

export { onAuthStateChanged };

export const signInWithGoogle = () => signInWithPopup(auth, googleProvider);

export const logOut = () => signOut(auth);

/**
 * The day a log entry belongs to. Anything before 4 a.m. counts as the
 * previous day, so a 1 a.m. entry about "today" doesn't land on tomorrow.
 */
export const DAY_ROLLOVER_HOUR = 4;
export const logDayKey = (now = new Date()) => dateKey(new Date(now.getTime() - DAY_ROLLOVER_HOUR * 3600000));

export const dateKey = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export async function fetchLog(userId, dayKey) {
  if (!userId || !dayKey) return {};

  if (isLocalOnlyUser(userId)) {
    const localOnly = readLocalLogs(userId);
    return localOnly[dayKey] || {};
  }

  try {
    const ref = doc(db, "users", userId, "logs", dayKey);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const data = snap.data() || {};
      const local = readLocalLogs(userId);
      local[dayKey] = {
        ...(local[dayKey] || {}),
        ...data,
      };
      writeLocalLogs(userId, local);
      return data;
    }
  } catch {
    // fall back to local cache below
  }

  const local = readLocalLogs(userId);
  return local[dayKey] || {};
}

/**
 * Saves locally first, then to Firestore.
 * Returns { ok, cloud }:
 *   ok    — false only if it could not be saved anywhere
 *   cloud — true if it reached Firestore (false = saved on this device only,
 *           queued for retry; also false for guest mode)
 */
export async function saveLog(userId, dayKey, payload) {
  if (!userId || !dayKey) return { ok: false, cloud: false };

  const local = readLocalLogs(userId);
  local[dayKey] = {
    ...(local[dayKey] || {}),
    ...(payload || {}),
  };
  const savedLocally = writeLocalLogs(userId, local);

  if (isLocalOnlyUser(userId)) {
    return { ok: savedLocally, cloud: false };
  }

  try {
    const ref = doc(db, "users", userId, "logs", dayKey);
    await setDoc(ref, payload, { merge: true });
    return { ok: true, cloud: true };
  } catch {
    if (savedLocally) setPending(userId, [...getPending(userId), dayKey]);
    return { ok: savedLocally, cloud: false };
  }
}

export async function fetchLogRange(userId, startDate, endDate) {
  if (!userId || !startDate || !endDate) return [];

  const logs = [];

  if (isLocalOnlyUser(userId)) {
    const localOnly = readLocalLogs(userId);
    Object.entries(localOnly).forEach(([date, data]) => {
      if (date >= startDate && date <= endDate) {
        logs.push({ date, ...(data || {}) });
      }
    });
    logs.sort((a, b) => String(a.date).localeCompare(String(b.date)));
    return logs;
  }

  try {
    const logsRef = collection(db, "users", userId, "logs");
    const logsQuery = query(
      logsRef,
      where(documentId(), ">=", startDate),
      where(documentId(), "<=", endDate)
    );

    const snapshot = await getDocs(logsQuery);
    snapshot.forEach((docSnap) => {
      logs.push({ date: docSnap.id, ...docSnap.data() });
    });
  } catch {
    const parseDateKey = (key) => {
      const [year, month, day] = key.split("-").map((value) => parseInt(value, 10));
      return new Date(Date.UTC(year, month - 1, day));
    };

    const toDateKey = (date) => {
      const year = date.getUTCFullYear();
      const month = String(date.getUTCMonth() + 1).padStart(2, "0");
      const day = String(date.getUTCDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    };

    const cursor = parseDateKey(startDate);
    const end = parseDateKey(endDate);

    while (cursor <= end) {
      const dayKey = toDateKey(cursor);
      const ref = doc(db, "users", userId, "logs", dayKey);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        logs.push({ date: dayKey, ...snap.data() });
      }
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }
  }

  const local = readLocalLogs(userId);
  Object.entries(local).forEach(([date, data]) => {
    if (date >= startDate && date <= endDate) {
      const idx = logs.findIndex((entry) => entry.date === date);
      if (idx >= 0) {
        logs[idx] = { ...data, ...logs[idx], date };
      } else {
        logs.push({ date, ...(data || {}) });
      }
    }
  });

  logs.sort((a, b) => String(a.date).localeCompare(String(b.date)));
  return logs;
}
