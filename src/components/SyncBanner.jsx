// src/components/SyncBanner.jsx — Rooted Health Tracker
// Makes storage problems visible instead of silent:
//   • signed in: days saved on this device but not yet backed up (auto-retries)
//   • guest: data lives only in this browser

import { useEffect, useState, useCallback } from "react";
import { getPending, syncPending } from "../firebase";

const font = "'Nunito', sans-serif";
const box = {
  margin: "8px 12px 0",
  padding: "9px 12px",
  borderRadius: "12px",
  fontFamily: font,
  fontSize: "12.5px",
  lineHeight: 1.4,
  display: "flex",
  gap: "10px",
  alignItems: "center",
  justifyContent: "space-between",
};

export default function SyncBanner({ user }) {
  const uid = user?.uid;
  const [pending, setPending] = useState(() => (uid ? getPending(uid).length : 0));
  const [busy, setBusy] = useState(false);

  const retry = useCallback(async () => {
    if (!uid || user?.isGuest) return;
    setBusy(true);
    setPending(await syncPending(uid));
    setBusy(false);
  }, [uid, user?.isGuest]);

  useEffect(() => {
    if (!uid || user?.isGuest) return undefined;
    const onSync = (e) => setPending(e.detail?.pending ?? getPending(uid).length);
    window.addEventListener("rooted-sync", onSync);
    window.addEventListener("online", retry);
    syncPending(uid); // result arrives through the "rooted-sync" event
    const timer = setInterval(() => {
      if (getPending(uid).length) retry();
    }, 60000);
    return () => {
      window.removeEventListener("rooted-sync", onSync);
      window.removeEventListener("online", retry);
      clearInterval(timer);
    };
  }, [uid, user?.isGuest, retry]);

  if (user?.isGuest) {
    return (
      <div className="no-print" style={{ ...box, background: "var(--cream)", border: "1.5px dashed var(--tan)", color: "var(--brown)" }}>
        <span>Guest mode: your data only lives in this browser. Clearing site data deletes it — sign in, or download a backup from Export.</span>
      </div>
    );
  }
  if (!pending) return null;
  return (
    <div role="status" className="no-print" style={{ ...box, background: "#FBE9E4", border: "1.5px solid var(--terra)", color: "var(--terra-dark)", fontWeight: 700 }}>
      <span>{pending} day{pending === 1 ? "" : "s"} saved on this device but not backed up yet. Retrying automatically.</span>
      <button type="button" onClick={retry} disabled={busy} style={{ flexShrink: 0, fontFamily: font, fontSize: "12px", fontWeight: 800, color: "var(--white)", background: "var(--terra)", border: "none", borderRadius: "10px", padding: "6px 10px", cursor: "pointer" }}>
        {busy ? "…" : "Retry"}
      </button>
    </div>
  );
}
