"use client";
import { getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";
export const firebaseConfigured = !!(
  process.env.NEXT_PUBLIC_FIREBASE_API_KEY &&
  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID &&
  process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN &&
  process.env.NEXT_PUBLIC_FIREBASE_APP_ID
);
export function firebase() {
  if (!firebaseConfigured)
    throw new Error(
      "Firebase is not configured. Follow .env.example and the deployment guide.",
    );
  const app =
    getApps()[0] ||
    initializeApp({
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    });
  return { auth: getAuth(app), storage: getStorage(app) };
}
export async function api(path: string, body?: unknown, method?: string): Promise<any> {
  const user = firebase().auth.currentUser;
  if (!user) throw new Error("Please sign in");
  const res = await fetch("/api/owner" + path, {
    method: method || (body ? "POST" : "GET"),
    headers: {
      Authorization: `Bearer ${await user.getIdToken()}`,
      "Content-Type": "application/json",
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const raw = await res.text();
  let data: unknown = null;
  try {
    data = raw ? JSON.parse(raw) : null;
  } catch {
    if (!res.ok) throw new Error(`Request failed (${res.status}). Try again.`);
    throw new Error("The server returned an invalid response. Try again.");
  }
  if (!res.ok) {
    const message =
      data && typeof data === "object" && "error" in data && typeof data.error === "string"
        ? data.error
        : `Request failed (${res.status}). Try again.`;
    throw new Error(message);
  }
  return data;
}
