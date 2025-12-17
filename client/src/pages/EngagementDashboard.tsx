import React, { useEffect, useState, useMemo } from "react";
import { useParams } from "react-router-dom";
import { Users, TrendingUp, Target, Activity, Copy, Check, Crown } from "lucide-react";
import TrackingHeader from "../components/layout/TrackingHeader";

interface EngagementStats {
  trackingId: string;
  totalClicks: number;
  totalConversions: number;
  conversionRate: number;
  potentialRevenue: number; // Partner's 10% commission from conversions only
  topCampaigns: Array<{
    campaign: string;
    clicks: number;
  }>;
  recentActivity: Array<{
    timestamp: string;
    campaign: string;
    destination: string;
    eventType: "inbound" | "outbound";
  }>;
  clicksByDay: Array<{
    date: string;
    clicks: number;
  }>;
  destinations: Array<{
    name: string;
    clicks: number;
  }>;
}

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function formatDate(ts: string) {
  try {
    const date = new Date(ts);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return ts;
  }
}

function IconTile({
  tone = "blue",
  children,
}: {
  tone?: "blue" | "purple" | "yellow" | "green" | "emerald";
  children: React.ReactNode;
}) {
  const toneMap: Record<string, string> = {
    blue: "bg-blue-50 text-blue-600 ring-blue-100",
    purple: "bg-purple-50 text-purple-600 ring-purple-100",
    yellow: "bg-yellow-50 text-yellow-700 ring-yellow-100",
    green: "bg-green-50 text-green-600 ring-green-100",
    emerald: "bg-emerald-50 text-emerald-600 ring-emerald-100",
  };

  return (
    <div
      className={cn(
        "flex h-14 w-14 items-center justify-center rounded-2xl ring-1 p-3",
        toneMap[tone]
      )}
    >
      {children}
    </div>
  );
}

function StatCard({
  title,
  value,
  deltaText,
  deltaUp = true,
  tone,
  icon,
}: {
  title: string;
  value: string | number;
  deltaText: string;
  deltaUp?: boolean;
  tone: "blue" | "purple" | "yellow" | "green" | "emerald";
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
      <div className="flex items-start justify-between gap-4">
        <div className="overflow-hidden">
          <div className="text-sm font-medium text-slate-500">{title}</div>
          <div className="mt-2 text-4xl font-semibold tracking-tight text-slate-900 overflow-hidden">
            {value}
          </div>

          <div
            className={cn(
              "mt-3 inline-flex items-center gap-2 text-sm font-medium",
              deltaUp ? "text-emerald-600" : "text-rose-600"
            )}
          >
            <span className="text-lg leading-none">{deltaUp ? "" : ""}</span>
            <span>{deltaText}</span>
          </div>
        </div>

        <IconTile tone={tone}>{icon}</IconTile>
      </div>
    </div>
  );
}

const EngagementDashboard: React.FC = () => {
  const { trackingId } = useParams<{ trackingId: string }>();
  const [stats, setStats] = useState<EngagementStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (trackingId) {
      fetchStats();
    } else {
      // Show demo data when no trackingId
      setStats({
        trackingId: "demo_preview",
        totalClicks: 1247,
        totalConversions: 89,
        conversionRate: 7.1,
        potentialRevenue: 890, // 89 conversions × $100 × 10% = $890
        topCampaigns: [
          { campaign: "instagram_story", clicks: 456 },
          { campaign: "youtube_video", clicks: 312 },
          { campaign: "email_newsletter", clicks: 289 },
          { campaign: "tiktok_post", clicks: 190 },
        ],
        recentActivity: [
          {
            timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
            campaign: "instagram_story",
            destination: "kickstarter",
            eventType: "outbound" as const,
          },
          {
            timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
            campaign: "youtube_video",
            destination: "about_page",
            eventType: "inbound" as const,
          },
          {
            timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
            campaign: "email_newsletter",
            destination: "kickstarter",
            eventType: "outbound" as const,
          },
        ],
        clicksByDay: [],
        destinations: [
          { name: "Kickstarter Campaign", clicks: 567 },
          { name: "About Page", clicks: 423 },
          { name: "Product Demo", clicks: 257 },
        ],
      });
      setLoading(false);
    }
  }, [trackingId]);

  const fetchStats = async () => {
    try {
      const response = await fetch(`/api/tracking/engagement/${trackingId}`);
      if (!response.ok) {
        throw new Error("Failed to load stats");
      }
      const data = await response.json();
      setStats(data);
    } catch (err) {
      setError("Unable to load your dashboard. Please check your link.");
      console.error("Failed to fetch engagement stats:", err);
    } finally {
      setLoading(false);
    }
  };

  const copyTrackingLink = () => {
    const link = trackingId 
      ? `${window.location.origin}/?ref=${trackingId}`
      : `${window.location.origin}/?ref=your_tracking_id`;
    navigator.clipboard.writeText(link).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // Generate stable chart data (must be before conditional returns)
  const chartData = useMemo(() => {
    return [
      { height: 55, isToday: false, date: new Date(Date.now() - 13 * 86400000) },
      { height: 62, isToday: false, date: new Date(Date.now() - 12 * 86400000) },
      { height: 48, isToday: false, date: new Date(Date.now() - 11 * 86400000) },
      { height: 71, isToday: false, date: new Date(Date.now() - 10 * 86400000) },
      { height: 68, isToday: false, date: new Date(Date.now() - 9 * 86400000) },
      { height: 82, isToday: false, date: new Date(Date.now() - 8 * 86400000) },
      { height: 75, isToday: false, date: new Date(Date.now() - 7 * 86400000) },
      { height: 88, isToday: false, date: new Date(Date.now() - 6 * 86400000) },
      { height: 65, isToday: false, date: new Date(Date.now() - 5 * 86400000) },
      { height: 78, isToday: false, date: new Date(Date.now() - 4 * 86400000) },
      { height: 92, isToday: false, date: new Date(Date.now() - 3 * 86400000) },
      { height: 70, isToday: false, date: new Date(Date.now() - 2 * 86400000) },
      { height: 85, isToday: false, date: new Date(Date.now() - 1 * 86400000) },
      { height: 95, isToday: true, date: new Date(Date.now() - 0 * 86400000) }
    ];
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen overflow-hidden" style={{ backgroundColor: '#f0f7ff' }}>
        <TrackingHeader />
        <div className="mx-auto max-w-6xl px-6 py-10">
          <div className="rounded-3xl bg-white p-10 text-center shadow-sm ring-1 ring-slate-200">
            <div className="mx-auto h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-slate-900" />
            <div className="mt-3 text-sm text-slate-600">Loading your dashboard</div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="min-h-screen overflow-hidden" style={{ backgroundColor: '#f0f7ff' }}>
        <TrackingHeader />
        <div className="mx-auto max-w-2xl px-6 py-10">
          <div className="rounded-3xl bg-white p-10 text-center shadow-sm ring-1 ring-slate-200">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 ring-1 ring-rose-200">
              <Activity className="h-7 w-7 text-rose-400" />
            </div>
            <h2 className="mt-6 text-2xl font-semibold text-slate-900">
              Dashboard Not Found
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              {error || "This tracking link is invalid or has expired."}
            </p>
            <p className="mt-4 text-xs text-slate-500">
              Please contact WIHY support if you believe this is an error.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const conversionRate = stats.totalClicks > 0 
    ? ((stats.totalConversions / stats.totalClicks) * 100).toFixed(1)
    : "0.0";

  return (
    <div className="min-h-screen overflow-hidden" style={{ backgroundColor: '#f0f7ff' }}>
      <TrackingHeader />
      <div className="mx-auto max-w-6xl px-6 py-10">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
              {trackingId ? "Your Performance Dashboard" : "Demo Performance Dashboard"}
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              {trackingId ? (
                <>
                  Tracking ID: <span className="font-mono font-semibold text-slate-900">{trackingId}</span>
                </>
              ) : (
                "Explore the dashboard features with sample data"
              )}
            </p>
          </div>

          <button
            onClick={copyTrackingLink}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-800"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4" />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                <span>Copy Your Link</span>
              </>
            )}
          </button>
        </div>

        <p className="mt-4 max-w-2xl text-sm text-slate-600">
          Track your impact and see real-time results from your promotion efforts.
        </p>

        {/* Stats Grid */}
        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">
          <StatCard
            title="Total Clicks"
            value={stats.totalClicks.toLocaleString()}
            deltaText="People who clicked"
            deltaUp
            tone="blue"
            icon={<Users className="h-4 w-4" />}
          />
          <StatCard
            title="Conversions"
            value={stats.totalConversions.toLocaleString()}
            deltaText="Completed actions"
            deltaUp
            tone="purple"
            icon={<Target className="h-4 w-4" />}
          />
          <StatCard
            title="Conversion Rate"
            value={`${conversionRate}%`}
            deltaText="Click to conversion"
            deltaUp
            tone="green"
            icon={<TrendingUp className="h-4 w-4" />}
          />
          <StatCard
            title="Your Earnings"
            value={`$${stats.potentialRevenue.toLocaleString()}`}
            deltaText="From conversions only"
            deltaUp
            tone="emerald"
            icon={<Crown className="h-4 w-4" />}
          />
          <StatCard
            title="Campaigns"
            value={stats.topCampaigns.length.toLocaleString()}
            deltaText="Active campaigns"
            deltaUp
            tone="yellow"
            icon={<Activity className="h-4 w-4" />}
          />
        </div>

        {/* Performance Chart */}
        <div className="mt-8 rounded-3xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
              Click Performance
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Daily engagement trends and activity patterns
            </p>
          </div>

          {/* Large Chart Area */}
          <div className="rounded-3xl bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-12 ring-1 ring-slate-200">
            <div className="flex flex-col items-center justify-center space-y-6" style={{ minHeight: '400px' }}>
              {/* Chart Title */}
              <div className="text-center">
                <h3 className="text-xl font-semibold text-slate-800">
                  Clicks Over Time
                </h3>
                <p className="mt-2 text-sm text-slate-600">
                  Track your daily engagement and identify peak activity periods
                </p>
              </div>

              {/* Chart Visualization */}
              <div className="w-full max-w-4xl">
                <div className="flex items-end justify-between gap-2" style={{ height: '280px' }}>
                  {chartData.map((data, i) => (
                      <div
                        key={i}
                        className="group relative flex flex-1 flex-col items-center justify-end"
                        style={{ minWidth: '20px' }}
                      >
                        <div
                          className={cn(
                            "w-full rounded-t-xl shadow-lg transition-all duration-300 cursor-pointer",
                            data.isToday
                              ? "bg-gradient-to-t from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600"
                              : "bg-gradient-to-t from-blue-400 to-indigo-400 hover:from-blue-500 hover:to-indigo-500",
                            "hover:shadow-xl"
                          )}
                          style={{ height: `${data.height}%` }}
                        >
                          {/* Tooltip on hover */}
                          <div className="absolute -top-16 left-1/2 -translate-x-1/2 hidden group-hover:block z-10">
                            <div className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-xl whitespace-nowrap">
                              <div>{Math.round(data.height * 8)} clicks</div>
                              <div className="text-slate-400 mt-1">
                                {data.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
                
                {/* X-axis labels */}
                <div className="mt-4 flex items-center justify-between gap-2">
                  {chartData.map((data, i) => (
                      <div key={i} className="flex-1 text-center text-xs font-medium text-slate-600">
                        {data.date.getDate()}
                      </div>
                    ))}
                </div>
              </div>

              {/* Chart Stats Summary */}
              <div className="mt-6 flex flex-wrap items-center justify-center gap-6 text-center">
                <div className="rounded-2xl bg-white/80 px-6 py-3 shadow-sm ring-1 ring-slate-200">
                  <div className="text-xs font-medium text-slate-500">Best Day</div>
                  <div className="mt-1 text-lg font-semibold text-slate-900">
                    {new Date(Date.now() - 5 * 86400000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </div>
                </div>
                <div className="rounded-2xl bg-white/80 px-6 py-3 shadow-sm ring-1 ring-slate-200">
                  <div className="text-xs font-medium text-slate-500">Avg. Daily</div>
                  <div className="mt-1 text-lg font-semibold text-slate-900">
                    {Math.round(stats.totalClicks / 14).toLocaleString()}
                  </div>
                </div>
                <div className="rounded-2xl bg-white/80 px-6 py-3 shadow-sm ring-1 ring-slate-200">
                  <div className="text-xs font-medium text-slate-500">Trend</div>
                  <div className="mt-1 text-lg font-semibold text-emerald-600">↗ Growing</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Top Campaigns */}
        <div className="mt-8 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-900">
              Top Campaigns
            </h2>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-200">
              Best Performing
            </span>
          </div>

          <div className="mt-4 overflow-hidden rounded-2xl ring-1 ring-slate-200">
            <table className="min-w-full bg-white text-left text-sm">
              <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Campaign</th>
                  <th className="px-4 py-3 text-right">Clicks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {stats.topCampaigns.map((campaign, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/60">
                    <td className="px-4 py-3 font-medium text-slate-900">
                      {campaign.campaign}
                    </td>
                    <td className="px-4 py-3 text-right text-slate-700">
                      {campaign.clicks.toLocaleString()}
                    </td>
                  </tr>
                ))}
                {stats.topCampaigns.length === 0 && (
                  <tr>
                    <td
                      colSpan={2}
                      className="px-4 py-10 text-center text-sm text-slate-600"
                    >
                      No campaign data yet. Start sharing your link!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="mt-8 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-900">
              Recent Activity
            </h2>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-200">
              Latest
            </span>
          </div>

          <div className="mt-4 overflow-hidden rounded-2xl ring-1 ring-slate-200">
            <table className="min-w-full bg-white text-left text-sm">
              <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Campaign</th>
                  <th className="px-4 py-3">Destination</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {stats.recentActivity.map((activity, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/60">
                    <td className="px-4 py-3 font-medium text-slate-900">
                      {activity.campaign}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600">
                      {activity.destination}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "inline-flex rounded-full px-2 py-1 text-xs font-medium ring-1",
                          activity.eventType === "inbound"
                            ? "bg-blue-50 text-blue-700 ring-blue-200"
                            : "bg-purple-50 text-purple-700 ring-purple-200"
                        )}
                      >
                        {activity.eventType}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600">
                      {formatDate(activity.timestamp)}
                    </td>
                  </tr>
                ))}
                {stats.recentActivity.length === 0 && (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-4 py-10 text-center text-sm text-slate-600"
                    >
                      No recent activity. Share your link to get started!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Destinations */}
        {stats.destinations && stats.destinations.length > 0 && (
          <div className="mt-8 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-slate-900">
                Top Destinations
              </h2>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-200">
                Where Traffic Goes
              </span>
            </div>

            <div className="mt-4 overflow-hidden rounded-2xl ring-1 ring-slate-200">
              <table className="min-w-full bg-white text-left text-sm">
                <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Destination</th>
                    <th className="px-4 py-3 text-right">Clicks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {stats.destinations.map((dest, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/60">
                      <td className="px-4 py-3 font-medium text-slate-900">
                        {dest.name}
                      </td>
                      <td className="px-4 py-3 text-right text-slate-700">
                        {dest.clicks.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EngagementDashboard;
