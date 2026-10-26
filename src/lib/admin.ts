import "server-only";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
export const adminConfigured = !!(
  process.env.FIREBASE_PROJECT_ID &&
  process.env.FIREBASE_CLIENT_EMAIL &&
  process.env.FIREBASE_PRIVATE_KEY &&
  process.env.ANALYTICS_SECRET &&
  process.env.ANALYTICS_SECRET.length >= 32
);
export function admin() {
  if (!adminConfigured) throw new Error("Server configuration incomplete");
  const app =
    getApps()[0] ||
    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, "\n"),
      }),
    });
  return { db: getFirestore(app), auth: getAuth(app) };
}
