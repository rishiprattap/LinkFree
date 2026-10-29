import { NextRequest, NextResponse } from "next/server";
import { admin } from "@/lib/admin";
import { getStorage } from "firebase-admin/storage";
import {
  body,
  fail,
  HttpError,
  limit,
  owner,
  passwordHash,
} from "@/lib/server";
import { linkSchema, profileSchema, usernameSchema } from "@/lib/model";
import { normalizeAnalyticsDays } from "@/lib/analytics-data";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
type Context = { params: Promise<{ path?: string[] }> };
function assertOwnedStorageImage(
  value: string,
  uid: string,
  folder: "avatars" | "backgrounds",
  filename: "avatar" | "background",
  label: string,
) {
  if (!value) return;
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new HttpError(400, `Upload a ${label} using the profile editor`);
  }
  const bucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
  let objectPath = "";
  try {
    objectPath = decodeURIComponent(url.pathname.split("/o/")[1] || "");
  } catch {
    throw new HttpError(400, `Upload a ${label} using the profile editor`);
  }
  if (
    url.protocol !== "https:" ||
    url.hostname !== "firebasestorage.googleapis.com" ||
    !bucket ||
    !url.pathname.startsWith(`/v0/b/${bucket}/o/`) ||
    objectPath !== `${folder}/${uid}/${filename}`
  )
    throw new HttpError(400, `Upload a ${label} using the profile editor`);
}
async function handle(req: NextRequest, ctx: Context) {
  try {
    const user = await owner(req);
    await limit("owner:" + user.uid, 120);
    const db = admin().db;
    const ref = db.collection("profiles").doc(user.uid);
    const path = (await ctx.params).path || [];
    const route = path[0] || "profile";
    if (req.method === "GET") {
      if (route === "profile") {
        const snap = await ref.get();
        const links = await ref.collection("links").orderBy("order").get();
        return NextResponse.json({
          profile: snap.exists ? { ...snap.data(), uid: user.uid } : null,
          links: links.docs.map((d) => {
            const { passwordHash, ...data } = d.data();
            return { ...data, id: d.id, protected: !!passwordHash };
          }),
        });
      }
      if (route === "analytics") {
        // Firestore already returns a collection by document ID when no order
        // is specified. Sorting validated day IDs in application code avoids a
        // special-field query that failed for this project at runtime.
        const stats = await ref.collection("stats").get();
        const days = normalizeAnalyticsDays(
          stats.docs.map((d) => ({ date: d.id, ...d.data() })),
        ).slice(-366);
        return NextResponse.json({
          days,
        });
      }
      if (route === "subscribers") {
        const data = await ref
          .collection("subscribers")
          .orderBy("createdAt", "desc")
          .get();
        return NextResponse.json({
          subscribers: data.docs.map((d) => ({ ...d.data(), id: d.id })),
        });
      }
      throw new HttpError(404, "Not found");
    }
    if (req.method === "DELETE") {
      if (route === "links" && path[1] && /^[\w-]+$/.test(path[1])) {
        await ref.collection("links").doc(path[1]).delete();
        return NextResponse.json({ ok: true });
      }
      if (route === "subscribers" && path[1]) {
        if (!/^[a-f0-9]{64}$/.test(path[1]))
          throw new HttpError(400, "Invalid identifier");
        await ref.collection("subscribers").doc(path[1]).delete();
        return NextResponse.json({ ok: true });
      }
      if (route === "account") {
        if (Date.now() / 1000 - user.auth_time > 300)
          throw new HttpError(
            401,
            "Sign out and sign in again before deleting your account",
          );
        const p = await ref.get();
        const username = p.data()?.username;
        await ref.set({ published: false }, { merge: true });
        const bucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
        if (bucket)
          await Promise.all([
            getStorage().bucket(bucket).deleteFiles({
              prefix: `avatars/${user.uid}/`,
            }),
            getStorage().bucket(bucket).deleteFiles({
              prefix: `backgrounds/${user.uid}/`,
            }),
          ]);
        await db.recursiveDelete(ref);
        if (username)
          await db.runTransaction(async (tx) => {
            const claim = db.collection("usernames").doc(username);
            const s = await tx.get(claim);
            if (s.data()?.uid === user.uid) tx.delete(claim);
          });
        await admin().auth.deleteUser(user.uid);
        return NextResponse.json({ ok: true });
      }
      throw new HttpError(404, "Not found");
    }
    const input = await body(req);
    if (route === "profile") {
      const profile = profileSchema.parse(input);
      const username = usernameSchema.parse(input.username);
      assertOwnedStorageImage(
        profile.avatar,
        user.uid,
        "avatars",
        "avatar",
        "avatar",
      );
      assertOwnedStorageImage(
        profile.theme.backgroundImage,
        user.uid,
        "backgrounds",
        "background",
        "background image",
      );
      await db.runTransaction(async (tx) => {
        const old = await tx.get(ref);
        const claim = db.collection("usernames").doc(username);
        const existing = await tx.get(claim);
        if (existing.exists && existing.data()!.uid !== user.uid)
          throw new HttpError(409, "That username is already taken");
        const previous = old.data()?.username;
        if (previous && previous !== username)
          tx.delete(db.collection("usernames").doc(previous));
        tx.set(claim, { uid: user.uid });
        tx.set(ref, { ...profile, username });
      });
      return NextResponse.json({ ok: true });
    }
    if (route === "links") {
      if (!(await ref.get()).exists)
        throw new HttpError(
          409,
          "Save your profile and claim a username first",
        );
      const data = linkSchema.parse(input);
      const { password, ...link } = data;
      const id = path[1];
      if (id && !/^[\w-]+$/.test(id)) throw new HttpError(400, "Invalid link");
      const doc = id
        ? ref.collection("links").doc(id)
        : ref.collection("links").doc();
      const existing = await doc.get();
      const protectedHash =
        password === undefined
          ? existing.data()?.passwordHash || ""
          : password
            ? passwordHash(password)
            : "";
      await doc.set({ ...link, passwordHash: protectedHash });
      return NextResponse.json({ id: doc.id, protected: !!protectedHash });
    }
    throw new HttpError(404, "Not found");
  } catch (e) {
    return fail(e);
  }
}
export const GET = handle;
export const POST = handle;
export const DELETE = handle;
