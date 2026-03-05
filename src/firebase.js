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

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const requiredEnv = [
  "VITE_FIREBASE_API_KEY",
  "VITE_FIREBASE_AUTH_DOMAIN",
  "VITE_FIREBASE_PROJECT_ID",
  "VITE_FIREBASE_STORAGE_BUCKET",
  "VITE_FIREBASE_MESSAGING_SENDER_ID",
  "VITE_FIREBASE_APP_ID",
];

const missingEnv = requiredEnv.filter((key) => !import.meta.env[key]);

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
  const ref = doc(db, "users", userId, "logs", dayKey);
  const snap = await getDoc(ref);
  return snap.exists() ? snap.data() : {};
}

export async function saveLog(userId, dayKey, payload) {
  if (!userId || !dayKey) return;
  const ref = doc(db, "users", userId, "logs", dayKey);
  await setDoc(ref, payload, { merge: true });
}

export async function fetchLogRange(userId, startDate, endDate) {
  if (!userId || !startDate || !endDate) return [];

  const logsRef = collection(db, "users", userId, "logs");
  const logsQuery = query(
    logsRef,
    where(documentId(), ">=", startDate),
    where(documentId(), "<=", endDate)
  );

  const snapshot = await getDocs(logsQuery);
  const logs = [];

  snapshot.forEach((docSnap) => {
    logs.push({ date: docSnap.id, ...docSnap.data() });
  });

  logs.sort((a, b) => String(a.date).localeCompare(String(b.date)));
  return logs;
}
