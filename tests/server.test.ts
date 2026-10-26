import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
const mocks = vi.hoisted(() => {
  const records = new Map<string, Record<string, unknown>>();
  const snapshot = (path: string) => ({
    exists: records.has(path),
    data: () => records.get(path),
  });
  const doc = (path: string): any => ({
    path,
    get: async () => snapshot(path),
    collection: (name: string) => collection(path + "/" + name),
  });
  const collection = (path: string): any => ({
    doc: (name: string) => doc(path + "/" + name),
  });
  const db = {
    collection,
    runTransaction: async (fn: any) =>
      fn({
        get: async (ref: any) => snapshot(ref.path),
        set: (ref: any, value: Record<string, unknown>) =>
          records.set(ref.path, value),
      }),
  };
  return { records, db, verify: vi.fn() };
});
vi.mock("server-only", () => ({}));
vi.mock("../src/lib/admin", () => ({
  adminConfigured: true,
  admin: () => ({ db: mocks.db, auth: { verifyIdToken: mocks.verify } }),
}));
import {
  body,
  HttpError,
  limit,
  owner,
  passwordHash,
  passwordMatches,
  record,
  sameOrigin,
} from "../src/lib/server";
beforeEach(() => {
  mocks.records.clear();
  mocks.verify.mockReset();
  process.env.ANALYTICS_SECRET =
    "test-only-secret-with-more-than-thirty-two-characters";
  process.env.NEXT_PUBLIC_SITE_URL = "https://linkfree.test";
  process.env.TRUSTED_PROXY = "none";
});
describe("Server security behavior (mocked database)", () => {
  it("salts password hashes and verifies correct secrets", () => {
    const a = passwordHash("correct horse");
    const b = passwordHash("correct horse");
    expect(a).not.toBe(b);
    expect(passwordMatches("correct horse", a)).toBe(true);
    expect(passwordMatches("incorrect", a)).toBe(false);
  });
  it("rejects cross-origin mutations", () => {
    expect(() =>
      sameOrigin(
        new NextRequest("https://linkfree.test/api", {
          headers: { origin: "https://evil.test" },
        }),
      ),
    ).toThrow(HttpError);
    expect(() =>
      sameOrigin(
        new NextRequest("https://linkfree.test/api", {
          headers: { origin: "https://linkfree.test" },
        }),
      ),
    ).not.toThrow();
  });
  it("rejects absent tokens and verifies revocation for authorized owners", async () => {
    await expect(
      owner(new NextRequest("https://linkfree.test/api")),
    ).rejects.toMatchObject({ status: 401 });
    mocks.verify.mockResolvedValue({ uid: "owner" });
    await expect(
      owner(
        new NextRequest("https://linkfree.test/api", {
          headers: { authorization: "Bearer token" },
        }),
      ),
    ).resolves.toMatchObject({ uid: "owner" });
    expect(mocks.verify).toHaveBeenCalledWith("token", true);
  });
  it("bounds streaming JSON body size", async () => {
    const req = new NextRequest("https://linkfree.test/api", {
      method: "POST",
      body: JSON.stringify({ text: "a".repeat(20001) }),
    });
    await expect(body(req)).rejects.toMatchObject({ status: 413 });
    await expect(
      body(
        new NextRequest("https://linkfree.test/api", {
          method: "POST",
          body: '{"action":"view"}',
        }),
      ),
    ).resolves.toEqual({ action: "view" });
  });
  it("rejects a bucket after its configured allowance", async () => {
    await limit("visitor", 2);
    await limit("visitor", 2);
    await expect(limit("visitor", 2)).rejects.toMatchObject({ status: 429 });
  });
  it("deduplicates daily views and per-link clicks without inventing country", async () => {
    const req = new NextRequest("https://linkfree.test/api", {
      headers: { "user-agent": "Mobile test" },
    });
    await record(req, "user", "view", "", "https://example.com/article");
    await record(req, "user", "view", "", "https://example.com/article");
    await record(req, "user", "click", "link1");
    await record(req, "user", "click", "link1");
    await record(req, "user", "click", "link2");
    const stats = [...mocks.records.entries()].find(([key]) =>
      key.includes("/stats/"),
    )![1];
    expect(stats).toMatchObject({
      views: 1,
      unique: 1,
      clicks: 2,
      devices: { Mobile: 1 },
      referrers: { "example.com": 1 },
      countries: {},
    });
  });
});
