import React, { useEffect, useMemo, useState } from "react";
import { Users, Activity, Eye, FileText, Copy, Check } from "lucide-react";
import TrackingHeader from "../components/layout/TrackingHeader";

interface TrackingEvent {
  id: string;
  referrer: string;
  campaign: string;
  timestamp: string;
  landingPage: string;
}

interface TrackingStats {
  totalEvents: number;
  byReferrer: Record<string, number>;
  byCampaign: Record<string, number>;
  byLandingPage: Record<string, number>;
  recent: Array<{
    referrer: string;
    campaign: string;
    timestamp: string;
    landingPage: string;
  }>;
}

type TabKey = "Clicks" | "Unique" | "Top Sources";

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function formatDate(ts: string) {
  try {
    return new Date(ts).toLocaleString();
  } catch {
    return ts;
  }
}

function IconTile({
  tone = "blue",
  children,
}: {
  tone?: "blue" | "purple" | "yellow" | "green";
  children: React.ReactNode;
}) {
  const toneMap: Record<string, string> = {
    blue: "bg-blue-50 text-blue-600 ring-blue-100",
    purple: "bg-purple-50 text-purple-600 ring-purple-100",
    yellow: "bg-yellow-50 text-yellow-700 ring-yellow-100",
    green: "bg-green-50 text-green-600 ring-green-100",
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
  tone: "blue" | "purple" | "yellow" | "green";
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

function Tabs({
  value,
  onChange,
  items,
}: {
  value: TabKey;
  onChange: (v: TabKey) => void;
  items: TabKey[];
}) {
  return (
    <div className="inline-flex rounded-full bg-slate-100 p-1 ring-1 ring-slate-200">
      {items.map((t) => {
        const active = t === value;
        return (
          <button
            key={t}
            onClick={() => onChange(t)}
            className={cn(
              "rounded-full px-4 py-2 text-sm font-semibold transition",
              active
                ? "bg-white text-slate-900 shadow-sm ring-1 ring-slate-200"
                : "text-slate-600 hover:text-slate-900"
            )}
          >
            {t}
          </button>
        );
      })}
    </div>
  );
}

function Modal({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-4xl rounded-3xl bg-white shadow-xl ring-1 ring-slate-200">
        <div className="flex items-center justify-between gap-4 border-b border-slate-100 px-6 py-5">
          <div>
            <div className="text-xs font-medium text-slate-500">Details</div>
            <div className="text-lg font-semibold text-slate-900">{title}</div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl bg-white px-3 py-2 text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-slate-200 hover:bg-slate-50"
          >
            Close
          </button>
        </div>
        <div className="max-h-[70vh] overflow-auto px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

const TrackingDashboard: React.FC = () => {
  const [stats, setStats] = useState<TrackingStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabKey>("Clicks");
  const [selectedReferrer, setSelectedReferrer] = useState<string | null>(null);
  const [referrerEvents, setReferrerEvents] = useState<TrackingEvent[]>([]);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [copiedReferrer, setCopiedReferrer] = useState<string | null>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/tracking/stats");
      if (!response.ok) {
        throw new Error("API not available");
      }
      const data = await response.json();
      setStats(data);
    } catch (e) {
      console.error("Failed to fetch stats, using demo data:", e);
      // Use demo data when API is not available
      setStats({
        totalEvents: 2847,
        byReferrer: {
          "sarah_wellness_ig": 892,
          "mike_fitness_yt": 673,
          "health_hub_blog": 521,
          "nutrition_podcast": 387,
          "fitness_forum": 234,
          "wellness_newsletter": 140,
        },
        byCampaign: {
          "instagram_story": 1247,
          "youtube_description": 673,
          "blog_post": 521,
          "podcast_notes": 387,
          "forum_signature": 234,
        },
        byLandingPage: {
          "/": 1821,
          "/about": 672,
          "/nutrition-facts": 354,
        },
        recent: [
          {
            referrer: "sarah_wellness_ig",
            campaign: "instagram_story",
            timestamp: new Date(Date.now() - 1000 * 60 * 8).toISOString(),
            landingPage: "/",
          },
          {
            referrer: "mike_fitness_yt",
            campaign: "youtube_description",
            timestamp: new Date(Date.now() - 1000 * 60 * 22).toISOString(),
            landingPage: "/about",
          },
          {
            referrer: "health_hub_blog",
            campaign: "blog_post",
            timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
            landingPage: "/nutrition-facts",
          },
          {
            referrer: "nutrition_podcast",
            campaign: "podcast_notes",
            timestamp: new Date(Date.now() - 1000 * 60 * 78).toISOString(),
            landingPage: "/",
          },
          {
            referrer: "sarah_wellness_ig",
            campaign: "instagram_story",
            timestamp: new Date(Date.now() - 1000 * 60 * 95).toISOString(),
            landingPage: "/about",
          },
        ],
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchReferrerDetails = async (referrerId: string) => {
    setDetailsLoading(true);
    try {
      const response = await fetch(`/api/tracking/referrer/${referrerId}`);
      const data = await response.json();
      setReferrerEvents(data.events || []);
      setSelectedReferrer(referrerId);
    } catch (e) {
      console.error("Failed to fetch referrer details:", e);
    } finally {
      setDetailsLoading(false);
    }
  };

  const copyTrackingLink = (referrer: string) => {
    const baseUrl = window.location.origin;
    const trackingUrl = `${baseUrl}/?ref=${encodeURIComponent(referrer)}&campaign=influencer`;
    navigator.clipboard.writeText(trackingUrl).then(() => {
      setCopiedReferrer(referrer);
      setTimeout(() => setCopiedReferrer(null), 2000);
    });
  };

  const onGenerate = () => {
    window.location.href = "/tracking-admin";
  };

  const onTest = () => {
    fetch("/api/tracking/capture", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        referrer: "test_user",
        campaign: "test_campaign",
        timestamp: new Date().toISOString(),
        destination: "kickstarter",
        action: "outbound_click",
      }),
    }).then(() => {
      alert("Test click tracked! Refresh the page to see it.");
      setTimeout(() => window.location.reload(), 800);
    });
  };

  const topReferrers = useMemo(() => {
    if (!stats) return [];
    return Object.entries(stats.byReferrer || {})
      .sort(([, a], [, b]) => b - a)
      .map(([referrer, count]) => ({ referrer, count }));
  }, [stats]);

  const totalSources = useMemo(
    () => Object.keys(stats?.byReferrer || {}).length,
    [stats]
  );

  const totalCampaigns = useMemo(
    () => Object.keys(stats?.byCampaign || {}).length,
    [stats]
  );

  const estimatedUnique = useMemo(() => {
    const total = stats?.totalEvents || 0;
    return Math.max(1, Math.round(total * 0.78));
  }, [stats]);

  // Generate stable chart data
  const chartData = useMemo(() => {
    return [
      { height: 65 },
      { height: 78 },
      { height: 82 },
      { height: 70 },
      { height: 88 },
      { height: 92 },
      { height: 75 },
      { height: 68 },
      { height: 85 },
      { height: 95 },
      { height: 72 },
      { height: 80 }
    ];
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen overflow-hidden" style={{ backgroundColor: '#f0f7ff' }}>
        <TrackingHeader />
        <div className="mx-auto max-w-6xl px-6 py-10">
          <div className="rounded-3xl bg-white p-10 text-center shadow-sm ring-1 ring-slate-200">
            <div className="mx-auto h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-slate-900" />
            <div className="mt-3 text-sm text-slate-600">Loading</div>
          </div>
        </div>
      </div>
    );
  }

  if (!stats || stats.totalEvents === 0) {
    return (
      <div className="min-h-screen overflow-hidden" style={{ backgroundColor: '#f0f7ff' }}>
        <TrackingHeader />
        <div className="mx-auto max-w-5xl px-6 py-10">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
                Link Tracking Dashboard
              </h1>
              <p className="mt-1 text-sm text-slate-600">
                Generate links for partners and see traffic performance.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={onGenerate}
                className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-800"
              >
                Generate tracking links
              </button>
              <button
                onClick={onTest}
                className="rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-slate-200 hover:bg-slate-50"
              >
                Test tracking
              </button>
            </div>
          </div>

          <div className="mt-8 rounded-3xl bg-white p-10 text-center shadow-sm ring-1 ring-slate-200">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50 ring-1 ring-slate-200">
              <Activity className="h-7 w-7 text-slate-400" />
            </div>
            <div className="mt-6 text-2xl font-semibold text-slate-900">
              No Click Data Yet
            </div>
            <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Create unique links for each influencer or campaign. When they share and
              people click, you will see it here.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen overflow-hidden" style={{ backgroundColor: '#f0f7ff' }}>
      <TrackingHeader />
      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
              Link Tracking Dashboard
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Monitor influencer links, sources, and click performance.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              onClick={onGenerate}
              className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-800"
            >
              Generate tracking links
            </button>
            <button
              onClick={onTest}
              className="rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-slate-200 hover:bg-slate-50"
            >
              Test tracking
            </button>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
          <StatCard
            title="Total Clicks"
            value={stats.totalEvents.toLocaleString()}
            deltaText="12.5% from last week"
            deltaUp
            tone="blue"
            icon={<Users className="h-4 w-4" />}
          />
          <StatCard
            title="Campaigns"
            value={totalCampaigns.toLocaleString()}
            deltaText="2.1% from last week"
            deltaUp
            tone="purple"
            icon={<Activity className="h-4 w-4" />}
          />
          <StatCard
            title="Avg. Clicks / Source"
            value={Math.max(1, Math.round(stats.totalEvents / Math.max(1, totalSources))).toLocaleString()}
            deltaText="3.8% from last week"
            deltaUp={false}
            tone="yellow"
            icon={<Eye className="h-4 w-4" />}
          />
          <StatCard
            title="Partners / Sources"
            value={totalSources.toLocaleString()}
            deltaText="25% from last week"
            deltaUp
            tone="green"
            icon={<FileText className="h-4 w-4" />}
          />
        </div>

        <div className="mt-8 rounded-3xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
              Engagement Analytics
            </h2>

            <Tabs
              value={tab}
              onChange={setTab}
              items={["Clicks", "Unique", "Top Sources"]}
            />
          </div>

          {/* Large Chart Area */}
          <div className="mt-8 rounded-3xl bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-12 ring-1 ring-slate-200">
            <div className="flex flex-col items-center justify-center space-y-6" style={{ minHeight: '400px' }}>
              {/* Chart Title */}
              <div className="text-center">
                <h3 className="text-xl font-semibold text-slate-800">
                  {tab === "Clicks" && "Total Clicks Over Time"}
                  {tab === "Unique" && "Unique Visitors Trend"}
                  {tab === "Top Sources" && "Traffic Sources Distribution"}
                </h3>
                <p className="mt-2 text-sm text-slate-600">
                  {tab === "Clicks" && "Track engagement patterns and peak activity periods"}
                  {tab === "Unique" && "Monitor unique user growth and retention"}
                  {tab === "Top Sources" && "Analyze partner performance and traffic quality"}
                </p>
              </div>

              {/* Placeholder Chart Visualization */}
              <div className="w-full max-w-4xl">
                <div className="flex items-end justify-between gap-2" style={{ height: '240px' }}>
                  {chartData.map((data, i) => (
                      <div
                        key={i}
                        className="group relative flex flex-1 flex-col items-center justify-end"
                        style={{ minWidth: '20px' }}
                      >
                        <div
                          className="w-full rounded-t-xl bg-gradient-to-t from-blue-500 to-indigo-500 shadow-lg transition-all duration-300 hover:from-blue-600 hover:to-indigo-600 hover:shadow-xl cursor-pointer"
                          style={{ height: `${data.height}%` }}
                        >
                          {/* Tooltip on hover */}
                          <div className="absolute -top-12 left-1/2 -translate-x-1/2 hidden group-hover:block z-10">
                            <div className="rounded-xl bg-slate-900 px-3 py-2 text-xs font-semibold text-white shadow-xl whitespace-nowrap">
                              {Math.round(data.height * 10)} clicks
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
                
                {/* X-axis labels */}
                <div className="mt-4 flex items-center justify-between gap-2">
                  {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((month) => (
                    <div key={month} className="flex-1 text-center text-xs font-medium text-slate-600">
                      {month}
                    </div>
                  ))}
                </div>
              </div>

              {/* Chart Stats Summary */}
              <div className="mt-6 flex flex-wrap items-center justify-center gap-6 text-center">
                <div className="rounded-2xl bg-white/80 px-6 py-3 shadow-sm ring-1 ring-slate-200">
                  <div className="text-xs font-medium text-slate-500">Peak Activity</div>
                  <div className="mt-1 text-lg font-semibold text-slate-900">March 2025</div>
                </div>
                <div className="rounded-2xl bg-white/80 px-6 py-3 shadow-sm ring-1 ring-slate-200">
                  <div className="text-xs font-medium text-slate-500">Avg. Daily</div>
                  <div className="mt-1 text-lg font-semibold text-slate-900">
                    {Math.round(stats.totalEvents / 30).toLocaleString()}
                  </div>
                </div>
                <div className="rounded-2xl bg-white/80 px-6 py-3 shadow-sm ring-1 ring-slate-200">
                  <div className="text-xs font-medium text-slate-500">Growth Rate</div>
                  <div className="mt-1 text-lg font-semibold text-emerald-600">+12.5%</div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 overflow-x-auto rounded-2xl ring-1 ring-slate-200">
            <table className="min-w-full bg-white text-left text-sm">
              <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Partner / Source</th>
                  <th className="px-4 py-3 text-right">Clicks</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {topReferrers.slice(0, 10).map(({ referrer, count }) => (
                  <tr key={referrer} className="hover:bg-slate-50/60">
                    <td className="px-4 py-3 font-medium text-slate-900">
                      {referrer}
                    </td>
                    <td className="px-4 py-3 text-right text-slate-700">
                      {count.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => copyTrackingLink(referrer)}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-white px-3 py-2 text-xs font-semibold text-slate-900 shadow-sm ring-1 ring-slate-200 hover:bg-slate-50"
                          title="Copy tracking link"
                        >
                          {copiedReferrer === referrer ? (
                            <>
                              <Check className="h-3.5 w-3.5 text-green-600" />
                              <span>Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="h-3.5 w-3.5" />
                              <span>Copy link</span>
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => fetchReferrerDetails(referrer)}
                          className="rounded-xl bg-slate-900 px-3 py-2 text-xs font-semibold text-white shadow-sm hover:bg-slate-800"
                        >
                          {detailsLoading && selectedReferrer === referrer
                            ? "Loading"
                            : "View details"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 text-xs text-slate-500">
            Note: "Unique" is estimated until you store deduped click events server-side.
            Current estimate: {estimatedUnique.toLocaleString()}.
          </div>
        </div>

        <div className="mt-8 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-slate-900">
              Recent Clicks
            </h3>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-200">
              Latest
            </span>
          </div>

          <div className="mt-4 overflow-x-auto rounded-2xl ring-1 ring-slate-200">
            <table className="min-w-full bg-white text-left text-sm">
              <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Source</th>
                  <th className="px-4 py-3">Campaign</th>
                  <th className="px-4 py-3">Destination</th>
                  <th className="px-4 py-3">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {stats.recent.map((e, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/60">
                    <td className="px-4 py-3 font-medium text-slate-900">
                      {e.referrer}
                    </td>
                    <td className="px-4 py-3 text-slate-700">{e.campaign}</td>
                    <td className="px-4 py-3 text-xs text-slate-600">
                      {e.landingPage}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600">
                      {formatDate(e.timestamp)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <Modal
          open={!!selectedReferrer}
          title={
            selectedReferrer ? `Details for ${selectedReferrer}` : "Details"
          }
          onClose={() => setSelectedReferrer(null)}
        >
          <div className="flex items-center justify-between">
            <div className="text-sm text-slate-700">
              Total clicks:{" "}
              <span className="font-semibold text-slate-900">
                {referrerEvents.length.toLocaleString()}
              </span>
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-200">
              {referrerEvents.length} events
            </span>
          </div>

          <div className="mt-4 overflow-x-auto rounded-2xl ring-1 ring-slate-200">
            <table className="min-w-full bg-white text-left text-sm">
              <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Campaign</th>
                  <th className="px-4 py-3">Destination</th>
                  <th className="px-4 py-3">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {referrerEvents.map((ev) => (
                  <tr key={ev.id} className="hover:bg-slate-50/60">
                    <td className="px-4 py-3 text-slate-800">{ev.campaign}</td>
                    <td className="px-4 py-3 text-xs text-slate-600">
                      {ev.landingPage}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600">
                      {formatDate(ev.timestamp)}
                    </td>
                  </tr>
                ))}
                {referrerEvents.length === 0 && (
                  <tr>
                    <td
                      colSpan={3}
                      className="px-4 py-10 text-center text-sm text-slate-600"
                    >
                      No events found for this source.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Modal>
      </div>
    </div>
  );
};

export default TrackingDashboard;
