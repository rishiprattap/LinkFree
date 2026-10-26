import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { admin } from "@/lib/admin";
import {
  body,
  fail,
  findProfile,
  hash,
  HttpError,
  identity,
  limit,
  passwordMatches,
  record,
  sameOrigin,
} from "@/lib/server";
import { LinkItem, usernameSchema, visible } from "@/lib/model";
export const runtime = "nodejs";
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ username: string }> },
) {
  try {
    sameOrigin(req);
    const username = usernameSchema.parse((await params).username);
    await limit("public:" + identity(req), 90);
    const input = await body(req);
    // Opt-out remains available while a creator's profile is unpublished.
    if (input.action === "unsubscribe") {
      let uid: string | undefined;
      if (input.ownerUid)
        uid = z
          .string()
          .regex(/^[a-zA-Z0-9_-]+$/)
          .max(128)
          .parse(input.ownerUid);
      else {
        const claim = await admin()
          .db.collection("usernames")
          .doc(username)
          .get();
        uid = claim.data()?.uid;
      }
      if (!uid) throw new HttpError(404, "Profile not found");
      const email = z.email().max(254).parse(input.email).toLowerCase();
      if (input.token !== hash("unsubscribe:" + uid + ":" + email))
        throw new HttpError(403, "Invalid unsubscribe link");
      await admin()
        .db.collection("profiles")
        .doc(uid)
        .collection("subscribers")
        .doc(hash(`${uid}:${email}`))
        .delete();
      return NextResponse.json({ ok: true });
    }
    const p = await findProfile(username);
    if (!p) throw new HttpError(404, "Profile not found");
    const ref = admin().db.collection("profiles").doc(p.uid!);
    if (input.action === "view") {
      const source = z
        .string()
        .max(2048)
        .parse(input.referrer || "");
      await record(req, p.uid!, "view", "", source);
      return NextResponse.json({ ok: true });
    }
    if (input.action === "open") {
      const id = z
        .string()
        .regex(/^[\w-]+$/)
        .max(100)
        .parse(input.id);
      const doc = await ref.collection("links").doc(id).get();
      if (!doc.exists) throw new HttpError(404, "Link unavailable");
      const link = doc.data() as LinkItem;
      if (!visible(link)) throw new HttpError(404, "Link unavailable");
      if (link.passwordHash) {
        await limit(`unlock:${p.uid}:${identity(req)}`, 10, 15 * 60000);
        const password = z
          .string()
          .max(128)
          .parse(input.password || "");
        if (!passwordMatches(password, link.passwordHash))
          throw new HttpError(403, "Incorrect password");
      }
      await record(req, p.uid!, "click", id);
      return NextResponse.json({ url: link.url });
    }
    if (input.action === "subscribe") {
      if (!p.subscribe) throw new HttpError(403, "Subscriptions are disabled");
      await limit(`subscribe:${identity(req)}`, 5, 3600000);
      const email = z.email().max(254).parse(input.email).toLowerCase();
      if (input.consent !== true)
        throw new HttpError(400, "Consent is required");
      const doc = ref.collection("subscribers").doc(hash(`${p.uid}:${email}`));
      const unsubscribeToken = hash("unsubscribe:" + p.uid + ":" + email);
      await doc.set({
        email,
        consent: true,
        consentText: "I agree to receive emails from this creator.",
        createdAt: new Date().toISOString(),
        unsubscribeToken,
      });
      return NextResponse.json({
        ok: true,
        unsubscribeUrl: `/unsubscribe?username=${username}&owner=${p.uid}&email=${encodeURIComponent(email)}&token=${unsubscribeToken}`,
      });
    }
    throw new HttpError(400, "Unknown action");
  } catch (e) {
    return fail(e);
  }
}
