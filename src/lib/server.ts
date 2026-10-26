import "server-only";
import {
  createHmac,
  randomBytes,
  scryptSync,
  timingSafeEqual,
} from "node:crypto";
import { Timestamp } from "firebase-admin/firestore";
import { NextRequest, NextResponse } from "next/server";
import { admin, adminConfigured } from "./admin";
import { dailyKey, LinkItem, Profile, publicLink, visible } from "./model";
export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export function fail(e: unknown) {
  if (e instanceof HttpError)
    return NextResponse.json({ error: e.message }, { status: e.status });
  if (e && typeof e === "object" && "issues" in e)
    return NextResponse.json(
      { error: "Invalid input. Check lengths, dates and URLs." },
      { status: 400 },
    );
  console.error("Request failed", e instanceof Error ? e.name : "unknown");
  return NextResponse.json(
    {
      error: adminConfigured
        ? "Unable to complete request. Try again."
        : "Firebase server setup is required.",
    },
    { status: 503 },
  );
}
export async function body(req: NextRequest) {
  const reader = req.body?.getReader();
  if (!reader) throw new HttpError(400, "Missing request body");
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > 20000) {
      await reader.cancel();
      throw new HttpError(413, "Request too large");
    }
    chunks.push(value);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    throw new HttpError(400, "Invalid JSON");
  }
}
export function sameOrigin(req: NextRequest) {
  const origin = req.headers.get("origin");
  const expected = new URL(process.env.NEXT_PUBLIC_SITE_URL || req.url).origin;
  if (origin && origin !== expected)
    throw new HttpError(403, "Origin not allowed");
}
export async function owner(req: NextRequest) {
  sameOrigin(req);
  const token = req.headers.get("authorization")?.match(/^Bearer (.+)$/)?.[1];
  if (!token) throw new HttpError(401, "Sign in required");
  try {
    return await admin().auth.verifyIdToken(token, true);
  } catch (e) {
    if (!adminConfigured) throw e;
    throw new HttpError(401, "Your session expired. Sign in again.");
  }
}
export function hash(value: string) {
  return createHmac("sha256", process.env.ANALYTICS_SECRET!)
    .update(value)
    .digest("hex");
}
export function identity(req: NextRequest) {
  const ip =
    process.env.TRUSTED_PROXY === "vercel"
      ? req.headers.get("x-vercel-forwarded-for")?.split(",")[0]?.trim()
      : "local";
  if (
    process.env.NODE_ENV === "production" &&
    (process.env.TRUSTED_PROXY !== "vercel" || !ip)
  )
    throw new HttpError(
      503,
      "Configure a trusted ingress before enabling public interactions",
    );
  return hash(
    `${ip || "unknown"}|${req.headers.get("user-agent")?.slice(0, 300) || ""}`,
  );
}
export async function limit(key: string, max = 60, windowMs = 60000) {
  const db = admin().db;
  const now = Date.now();
  const ref = db
    .collection("rateLimits")
    .doc(hash(`${key}|${Math.floor(now / windowMs)}`));
  await db.runTransaction(async (tx) => {
    const s = await tx.get(ref);
    if ((s.data()?.count || 0) >= max)
      throw new HttpError(429, "Too many requests. Try again shortly.");
    tx.set(ref, {
      count: (s.data()?.count || 0) + 1,
      expiresAt: Timestamp.fromMillis(now + windowMs * 2),
    });
  });
}
export function passwordHash(password: string) {
  const salt = randomBytes(16).toString("hex");
  return salt + ":" + scryptSync(password, salt, 64).toString("hex");
}
export function passwordMatches(password: string, stored: string) {
  const [salt, h] = stored.split(":");
  const candidate = scryptSync(password, salt, 64);
  const actual = Buffer.from(h, "hex");
  return (
    candidate.length === actual.length && timingSafeEqual(candidate, actual)
  );
}
export async function findProfile(username: string) {
  if (!adminConfigured) return null;
  const db = admin().db;
  const claim = await db.collection("usernames").doc(username).get();
  if (!claim.exists) return null;
  const uid = claim.data()!.uid as string;
  const snap = await db.collection("profiles").doc(uid).get();
  if (!snap.exists || !snap.data()!.published) return null;
  return { ...snap.data(), uid, username } as Profile;
}
export async function publicData(username: string) {
  const profile = await findProfile(username);
  if (!profile) return null;
  const snaps = await admin()
    .db.collection("profiles")
    .doc(profile.uid!)
    .collection("links")
    .orderBy("order")
    .get();
  const links = snaps.docs
    .map((d) => ({ ...d.data(), id: d.id }) as LinkItem)
    .filter((l) => visible(l))
    .map(publicLink);
  const { uid, ...safe } = profile;
  void uid;
  return { profile: safe as Profile, links };
}
export async function record(
  req: NextRequest,
  uid: string,
  kind: "view" | "click",
  linkId = "",
  source = "",
) {
  const db = admin().db;
  const day = dailyKey();
  const visitor = hash(`${day}|${identity(req)}`);
  const stats = db.collection("profiles").doc(uid).collection("stats").doc(day);
  const seen = db
    .collection("eventKeys")
    .doc(hash(`${uid}|${day}|${visitor}|${kind}|${linkId}`));
  const ua = req.headers.get("user-agent") || "";
  const device = /tablet|ipad/i.test(ua)
    ? "Tablet"
    : /mobile|iphone|android/i.test(ua)
      ? "Mobile"
      : "Desktop";
  let referrer = "Direct";
  try {
    if (source) {
      const u = new URL(source);
      if (
        ["https:", "http:"].includes(u.protocol) &&
        u.hostname !== new URL(req.url).hostname
      )
        referrer = u.hostname.slice(0, 150);
    }
  } catch {}
  const country =
    process.env.TRUSTED_PROXY === "vercel"
      ? req.headers.get("x-vercel-ip-country")
      : null;
  await db.runTransaction(async (tx) => {
    const [s, dedup] = await Promise.all([tx.get(stats), tx.get(seen)]);
    const data = s.data() || {
      views: 0,
      clicks: 0,
      unique: 0,
      devices: {},
      referrers: {},
      countries: {},
    };
    if (dedup.exists) return;
    data[kind === "view" ? "views" : "clicks"]++;
    if (kind === "view") {
      data.unique++;
      data.devices[device] = (data.devices[device] || 0) + 1;
      if (
        !Object.hasOwn(data.referrers, referrer) &&
        Object.keys(data.referrers).length >= 64
      )
        referrer = "Other";
      data.referrers[referrer] =
        (Object.hasOwn(data.referrers, referrer)
          ? data.referrers[referrer]
          : 0) + 1;
      if (country && /^[A-Z]{2}$/.test(country))
        data.countries[country] = (data.countries[country] || 0) + 1;
    }
    tx.set(stats, data);
    tx.set(seen, {
      expiresAt: Timestamp.fromMillis(Date.now() + 48 * 3600000),
    });
  });
}
