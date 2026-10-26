"use client";
import { useState } from "react";
export default function Unsubscribe() {
  const [message, setMessage] = useState(
    "Remove your email from this creator’s subscriber list.",
  );
  const [busy, setBusy] = useState(false);
  async function remove() {
    setBusy(true);
    try {
      const p = new URLSearchParams(location.search);
      const res = await fetch(
        `/api/public/${encodeURIComponent(p.get("username") || "")}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "unsubscribe",
            email: p.get("email"),
            token: p.get("token"),
            ownerUid: p.get("owner"),
          }),
        },
      );
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      setMessage("You have been unsubscribed.");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Unable to unsubscribe");
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="center-page">
      <h1>Unsubscribe</h1>
      <p role="status">{message}</p>
      <button disabled={busy} className="btn primary" onClick={remove}>
        Unsubscribe
      </button>
    </main>
  );
}
