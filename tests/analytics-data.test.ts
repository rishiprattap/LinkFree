import { describe, expect, it } from "vitest";
import { hasAnalyticsActivity, normalizeAnalyticsDays } from "../src/lib/analytics-data";

describe("analytics data normalization", () => {
  it("keeps genuine activity and safely normalizes incomplete historical records", () => {
    const days = normalizeAnalyticsDays([
      { date: "2026-10-27", views: 4.9, clicks: 2, unique: 3, devices: { Mobile: 3, Desktop: -2 }, referrers: { "example.com": 4 }, countries: { IN: 4 } },
      { date: "2026-10-26", views: "not-a-number" },
      { date: "not-a-date", views: 99 },
    ]);
    expect(days).toEqual([
      { date: "2026-10-26", views: 0, clicks: 0, unique: 0, devices: {}, referrers: {}, countries: {} },
      { date: "2026-10-27", views: 4, clicks: 2, unique: 3, devices: { Mobile: 3 }, referrers: { "example.com": 4 }, countries: { IN: 4 } },
    ]);
    expect(hasAnalyticsActivity(days)).toBe(true);
  });

  it("rejects a malformed API payload instead of displaying it as zero activity", () => {
    expect(() => normalizeAnalyticsDays({})).toThrow("Analytics data was unavailable");
  });
});
