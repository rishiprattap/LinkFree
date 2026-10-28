"use client";
import { useCallback, useEffect, useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import {
  Eye,
  MousePointer2,
  Users,
  TrendingUp,
  ChartNoAxesCombined,
  RefreshCw,
} from "lucide-react";
import { api } from "@/lib/firebase";
import { useSession } from "./providers";
import {
  hasAnalyticsActivity,
  normalizeAnalyticsDays,
  type AnalyticsDay,
} from "@/lib/analytics-data";
export function Analytics({ local }: { local: boolean }) {
  const [days, setDays] = useState<AnalyticsDay[]>([]);
  const [loading, setLoading] = useState(!local);
  const [error, setError] = useState("");
  const [monthly, setMonthly] = useState(false);
  const { toast } = useSession();
  const load = useCallback(async () => {
    if (local) return;
    setLoading(true);
    setError("");
    try {
      const data = await api("/analytics");
      const record = data && typeof data === "object" ? (data as { days?: unknown }) : {};
      setDays(normalizeAnalyticsDays(record.days));
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "Analytics could not be loaded.";
      setError(message);
      toast(message);
    } finally {
      setLoading(false);
    }
  }, [local, toast]);
  useEffect(() => {
    void load();
  }, [load]);
  const totals = days.reduce(
    (a, d) => ({
      views: a.views + d.views,
      clicks: a.clicks + d.clicks,
      unique: a.unique + d.unique,
    }),
    { views: 0, clicks: 0, unique: 0 },
  );
  const groups: Record<
    string,
    { date: string; views: number; clicks: number }
  > = {};
  for (const d of days) {
    const key = monthly ? d.date.slice(0, 7) : d.date;
    groups[key] ??= { date: key, views: 0, clicks: 0 };
    groups[key].views += d.views;
    groups[key].clicks += d.clicks;
  }
  function breakdown(key: "devices" | "referrers" | "countries") {
    const sum: Record<string, number> = {};
    for (const d of days)
      for (const [k, v] of Object.entries(d[key] || {}))
        sum[k] = (sum[k] || 0) + v;
    return Object.entries(sum)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
  }
  const hasActivity = hasAnalyticsActivity(days);
  return (
    <>
      <div className="section-heading">
        <div>
          <span className="eyebrow">THE BIGGER PICTURE</span>
          <h1>Small links. Real impact.</h1>
          <p>Understand how people discover your world.</p>
        </div>
        <div className="analytics-actions">
          <select
            aria-label="Chart interval"
            value={monthly ? "month" : "day"}
            onChange={(e) => setMonthly(e.target.value === "month")}
          >
            <option value="day">Daily activity</option>
            <option value="month">Monthly activity</option>
          </select>
          <button className="icon-button analytics-refresh" aria-label="Refresh analytics" title="Refresh analytics" disabled={loading || local} onClick={() => void load()}>
            <RefreshCw size={16} className={loading ? "spin" : ""} />
          </button>
        </div>
      </div>
      {local ? (
        <section className="card analytics-message">
          <ChartNoAxesCombined size={32} />
          <div><h3>Analytics are available after publishing.</h3><p>Local drafts stay in this browser, so they do not collect visits or clicks.</p></div>
        </section>
      ) : loading ? (
        <div className="skeleton" />
      ) : error ? (
        <section className="card analytics-message analytics-error" role="alert">
          <ChartNoAxesCombined size={32} />
          <div><h3>Analytics could not be loaded.</h3><p>{error}</p></div>
          <button className="btn compact" onClick={() => void load()}><RefreshCw size={14} /> Try again</button>
        </section>
      ) : !hasActivity ? (
        <section className="card analytics-message">
          <ChartNoAxesCombined size={32} />
          <div><h3>No activity recorded yet.</h3><p>A public profile visit records one privacy-conscious view per estimated visitor each day. Opening a link records a click. Studio previews do not affect analytics.</p></div>
        </section>
      ) : (
        <>
          <div className="stat-grid">
            {[
              [Eye, "Profile views", totals.views],
              [MousePointer2, "Link clicks", totals.clicks],
              [Users, "Daily unique visitors", totals.unique],
              [
                TrendingUp,
                "Click-through rate",
                totals.views
                  ? `${((totals.clicks / totals.views) * 100).toFixed(1)}%`
                  : "—",
              ],
            ].map(([Icon, label, value]) => {
              const I = Icon as typeof Eye;
              return (
                <article className="stat" key={label as string}>
                  <I size={18} />
                  <span>{label as string}</span>
                  <strong>{value as string | number}</strong>
                </article>
              );
            })}
          </div>
          <section className="card chart-card">
            <div className="card-heading">
              <h3>Your activity</h3>
              <span className="muted">Last 366 recorded days · UTC</span>
            </div>
            {days.length ? (
              <div style={{ height: 280, width: "100%" }}>
                <ResponsiveContainer>
                  <AreaChart data={Object.values(groups)}>
                    <defs>
                      <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
                        <stop
                          offset="0%"
                          stopColor="#337b62"
                          stopOpacity={0.25}
                        />
                        <stop
                          offset="100%"
                          stopColor="#337b62"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Area
                      type="monotone"
                      dataKey="views"
                      stroke="#337b62"
                      fill="url(#areaFill)"
                      strokeWidth={2}
                    />
                    <Area
                      type="monotone"
                      dataKey="clicks"
                      stroke="#b57944"
                      fill="transparent"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="empty-state">
                <ChartNoAxesCombined size={36} />
                <h3>Your story is just getting started.</h3>
                <p>
                  {local
                    ? "Analytics require a published Firebase profile."
                    : "Share your published page to start collecting real activity."}
                </p>
              </div>
            )}
          </section>
          <div className="breakdown-grid">
            {(["devices", "referrers", "countries"] as const).map((key) => (
              <section className="card" key={key}>
                <h3>
                  {key === "devices"
                    ? "Devices"
                    : key === "referrers"
                      ? "Referral sources"
                      : "Countries"}
                </h3>
                {breakdown(key).length ? (
                  breakdown(key).map(([k, v]) => (
                    <div className="breakdown" key={k}>
                      <span>{k}</span>
                      <strong>{v}</strong>
                    </div>
                  ))
                ) : (
                  <p className="muted">
                    {key === "countries"
                      ? "Shown only when trusted location data is available."
                      : "No recorded activity yet."}
                  </p>
                )}
              </section>
            ))}
          </div>
          <p className="fine-print">
            Views and clicks are deduplicated per estimated visitor per day;
            clicks are also deduplicated per link. Daily uniques are summed, not
            deduplicated across days. CTR is clicks ÷ views and can exceed 100%.
            No raw IP addresses are stored.
          </p>
        </>
      )}
    </>
  );
}
