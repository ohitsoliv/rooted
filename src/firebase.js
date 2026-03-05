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
  if (typeof window === "undefined" || !userId) return;
  try {
    window.localStorage.setItem(localCacheKey(userId), JSON.stringify(logsByDate));
  } catch {
    return;
  }
}

export { onAuthStateChanged };

export const signInWithGoogle = () => signInWithPopup(auth, googleProvider);

export const logOut = () => signOut(auth);

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

export async function saveLog(userId, dayKey, payload) {
  if (!userId || !dayKey) return;

  const local = readLocalLogs(userId);
  local[dayKey] = {
    ...(local[dayKey] || {}),
    ...(payload || {}),
  };
  writeLocalLogs(userId, local);

  if (isLocalOnlyUser(userId)) {
    return;
  }

  try {
    const ref = doc(db, "users", userId, "logs", dayKey);
    await setDoc(ref, payload, { merge: true });
  } catch {
    return;
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
