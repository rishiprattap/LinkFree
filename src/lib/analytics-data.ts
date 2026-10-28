export type AnalyticsDay = {
  date: string;
  views: number;
  clicks: number;
  unique: number;
  devices: Record<string, number>;
  referrers: Record<string, number>;
  countries: Record<string, number>;
};

const DAY = /^\d{4}-\d{2}-\d{2}$/;

function count(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) && value >= 0
    ? Math.floor(value)
    : 0;
}

function breakdown(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return Object.entries(value).reduce<Record<string, number>>(
    (result, [key, item]) => {
      const normalized = count(item);
      if (key.length > 0 && key.length <= 128 && normalized > 0)
        result[key] = normalized;
      return result;
    },
    {},
  );
}

/** Converts API records into a display-safe shape without inventing activity. */
export function normalizeAnalyticsDays(value: unknown): AnalyticsDay[] {
  if (!Array.isArray(value))
    throw new Error("Analytics data was unavailable. Try again.");
  return value
    .filter(
      (day): day is Record<string, unknown> =>
        !!day &&
        typeof day === "object" &&
        !Array.isArray(day) &&
        typeof day.date === "string" &&
        DAY.test(day.date),
    )
    .map((day) => ({
      date: day.date as string,
      views: count(day.views),
      clicks: count(day.clicks),
      unique: count(day.unique),
      devices: breakdown(day.devices),
      referrers: breakdown(day.referrers),
      countries: breakdown(day.countries),
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function hasAnalyticsActivity(days: AnalyticsDay[]) {
  return days.some((day) => day.views > 0 || day.clicks > 0 || day.unique > 0);
}
