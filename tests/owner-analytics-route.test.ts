import { describe, expect, it, vi } from "vitest";
import { NextRequest, NextResponse } from "next/server";

const mocks = vi.hoisted(() => {
  const statsGet = vi.fn();
  const profile = {
    collection: (name: string) => {
      if (name === "stats") return { get: statsGet };
      return { get: vi.fn() };
    },
  };
  return {
    statsGet,
    admin: {
      db: {
        collection: (name: string) => {
          if (name === "profiles") return { doc: () => profile };
          return { doc: () => ({}) };
        },
      },
    },
  };
});

vi.mock("@/lib/admin", () => ({ admin: () => mocks.admin }));
vi.mock("@/lib/server", () => ({
  body: vi.fn(),
  fail: (error: unknown) =>
    NextResponse.json({ error: error instanceof Error ? error.message : "failed" }, { status: 500 }),
  HttpError: class HttpError extends Error {
    constructor(public status: number, message: string) {
      super(message);
    }
  },
  limit: vi.fn(),
  owner: vi.fn().mockResolvedValue({ uid: "creator" }),
  passwordHash: vi.fn(),
}));

import { GET } from "../src/app/api/owner/[[...path]]/route";

describe("owner analytics route", () => {
  it("reads normal stats collections and returns the latest 366 valid days", async () => {
    mocks.statsGet.mockResolvedValue({
      docs: [
        { id: "2026-01-02", data: () => ({ views: 3, clicks: 1, unique: 2 }) },
        { id: "2026-01-01", data: () => ({ views: 1, clicks: 0, unique: 1 }) },
        { id: "not-a-day", data: () => ({ views: 99 }) },
      ],
    });
    const response = await GET(
      new NextRequest("https://linkfree.test/api/owner/analytics"),
      { params: Promise.resolve({ path: ["analytics"] }) },
    );
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      days: [
        { date: "2026-01-01", views: 1, clicks: 0, unique: 1, devices: {}, referrers: {}, countries: {} },
        { date: "2026-01-02", views: 3, clicks: 1, unique: 2, devices: {}, referrers: {}, countries: {} },
      ],
    });
    expect(mocks.statsGet).toHaveBeenCalledOnce();
  });
});
