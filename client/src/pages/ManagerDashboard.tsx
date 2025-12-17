import React, { useEffect, useMemo, useState } from "react";
import { Users, Activity, Eye, TrendingUp, Copy, Check, Crown } from "lucide-react";
import TrackingHeader from "../components/layout/TrackingHeader";

interface ManagerStats {
  managerId: string;
  managerName: string;
  totalReferrals: number;
  activePartners: number;
  totalClicks: number;
  totalConversions: number;
  conversionRate: number;
  partners: Array<{
    trackingId: string;
    name: string;
    clicks: number;
    conversions: number;
    lastActive: string;
    status: 'active' | 'inactive';
  }>;
  recentActivity: Array<{
    partnerName: string;
    trackingId: string;
    campaign: string;
    clicks: number;
    timestamp: string;
  }>;
  clicksByDay: Array<{
    date: string;
    clicks: number;
  }>;
}

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
  tone?: "blue" | "purple" | "yellow" | "green" | "indigo";
  children: React.ReactNode;
}) {
  const toneMap: Record<string, string> = {
    blue: "bg-blue-50 text-blue-600 ring-blue-100",
    purple: "bg-purple-50 text-purple-600 ring-purple-100",
    yellow: "bg-yellow-50 text-yellow-700 ring-yellow-100",
    green: "bg-green-50 text-green-600 ring-green-100",
    indigo: "bg-indigo-50 text-indigo-600 ring-indigo-100",
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
  tone: "blue" | "purple" | "yellow" | "green" | "indigo";
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
            <span className="text-lg leading-none">{deltaUp ? "↗" : "↘"}</span>
            <span>{deltaText}</span>
          </div>
        </div>

        <IconTile tone={tone}>{icon}</IconTile>
      </div>
    </div>
  );
}

const ManagerDashboard: React.FC = () => {
  const [stats, setStats] = useState<ManagerStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    fetchManagerStats();
  }, []);

  const fetchManagerStats = async () => {
    try {
      const response = await fetch("/api/manager/stats");
      if (!response.ok) {
        throw new Error("API not available");
      }
      const data = await response.json();
      setStats(data);
    } catch (e) {
      console.error("Failed to fetch manager stats, using demo data:", e);
      // Demo data for manager
      setStats({
        managerId: "mgr_demo_123",
        managerName: "Sarah Johnson",
        totalReferrals: 12,
        activePartners: 8,
        totalClicks: 3421,
        totalConversions: 287,
        conversionRate: 8.4,
        partners: [
          {
            trackingId: "partner_001",
            name: "Wellness Influencer Alex",
            clicks: 892,
            conversions: 78,
            lastActive: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
            status: 'active',
          },
          {
            trackingId: "partner_002",
            name: "Fitness Coach Mike",
            clicks: 673,
            conversions: 61,
            lastActive: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
            status: 'active',
          },
          {
            trackingId: "partner_003",
            name: "Health Blog Emma",
            clicks: 521,
            conversions: 45,
            lastActive: new Date(Date.now() - 1000 * 60 * 240).toISOString(),
            status: 'active',
          },
          {
            trackingId: "partner_004",
            name: "Nutrition Expert Lisa",
            clicks: 387,
            conversions: 32,
            lastActive: new Date(Date.now() - 1000 * 60 * 480).toISOString(),
            status: 'active',
          },
          {
            trackingId: "partner_005",
            name: "Yoga Instructor Tom",
            clicks: 289,
            conversions: 24,
            lastActive: new Date(Date.now() - 1000 * 60 * 720).toISOString(),
            status: 'active',
          },
          {
            trackingId: "partner_006",
            name: "Wellness Podcast Jane",
            clicks: 234,
            conversions: 19,
            lastActive: new Date(Date.now() - 1000 * 60 * 1440).toISOString(),
            status: 'active',
          },
          {
            trackingId: "partner_007",
            name: "Health Forum Chris",
            clicks: 198,
            conversions: 15,
            lastActive: new Date(Date.now() - 1000 * 60 * 2880).toISOString(),
            status: 'active',
          },
          {
            trackingId: "partner_008",
            name: "Fitness Blog David",
            clicks: 156,
            conversions: 11,
            lastActive: new Date(Date.now() - 1000 * 60 * 4320).toISOString(),
            status: 'active',
          },
          {
            trackingId: "partner_009",
            name: "Nutrition Newsletter Pat",
            clicks: 71,
            conversions: 2,
            lastActive: new Date(Date.now() - 1000 * 60 * 10080).toISOString(),
            status: 'inactive',
          },
        ],
        recentActivity: [
          {
            partnerName: "Wellness Influencer Alex",
            trackingId: "partner_001",
            campaign: "instagram_story",
            clicks: 45,
            timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
          },
          {
            partnerName: "Fitness Coach Mike",
            trackingId: "partner_002",
            campaign: "youtube_video",
            clicks: 32,
            timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
          },
          {
            partnerName: "Health Blog Emma",
            trackingId: "partner_003",
            campaign: "blog_post",
            clicks: 28,
            timestamp: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
          },
        ],
        clicksByDay: [],
      });
    } finally {
      setLoading(false);
    }
  };

  const copyPartnerLink = (trackingId: string) => {
    const baseUrl = window.location.origin;
    const link = `${baseUrl}/partner-hub?id=${trackingId}`;
    navigator.clipboard.writeText(link).then(() => {
      setCopiedId(trackingId);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  const chartData = useMemo(() => {
    return [
      { height: 62, label: "Mon" },
      { height: 75, label: "Tue" },
      { height: 68, label: "Wed" },
      { height: 85, label: "Thu" },
      { height: 92, label: "Fri" },
      { height: 58, label: "Sat" },
      { height: 45, label: "Sun" },
    ];
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen overflow-hidden" style={{ backgroundColor: '#f0f7ff' }}>
        <TrackingHeader />
        <div className="mx-auto max-w-6xl px-6 py-10">
          <div className="rounded-3xl bg-white p-10 text-center shadow-sm ring-1 ring-slate-200">
            <div className="mx-auto h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-slate-900" />
            <div className="mt-3 text-sm text-slate-600">Loading dashboard...</div>
          </div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="min-h-screen overflow-hidden" style={{ backgroundColor: '#f0f7ff' }}>
        <TrackingHeader />
        <div className="mx-auto max-w-6xl px-6 py-10">
          <div className="rounded-3xl bg-white p-10 text-center shadow-sm ring-1 ring-slate-200">
            <div className="text-lg font-semibold text-slate-900">No data available</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen overflow-hidden" style={{ backgroundColor: '#f0f7ff' }}>
      <TrackingHeader />
      
      <div className="mx-auto max-w-6xl px-6 py-10">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
                Manager Dashboard
              </h1>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100 ring-1 ring-indigo-200">
                <Crown className="h-4 w-4 text-indigo-600" />
              </div>
            </div>
            <p className="mt-1 text-sm text-slate-600">
              Welcome back, <span className="font-semibold text-slate-900">{stats.managerName}</span>
            </p>
          </div>

          <div className="rounded-2xl bg-white px-4 py-2 shadow-sm ring-1 ring-slate-200">
            <div className="text-xs font-medium text-slate-500">Manager ID</div>
            <div className="font-mono text-sm font-semibold text-slate-900">{stats.managerId}</div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Referrals"
            value={stats.totalReferrals.toLocaleString()}
            deltaText="Partners recruited"
            deltaUp
            tone="indigo"
            icon={<Users className="h-4 w-4" />}
          />
          <StatCard
            title="Active Partners"
            value={stats.activePartners.toLocaleString()}
            deltaText="Currently engaged"
            deltaUp
            tone="green"
            icon={<Activity className="h-4 w-4" />}
          />
          <StatCard
            title="Total Clicks"
            value={stats.totalClicks.toLocaleString()}
            deltaText="From your network"
            deltaUp
            tone="blue"
            icon={<Eye className="h-4 w-4" />}
          />
          <StatCard
            title="Conversions"
            value={stats.totalConversions.toLocaleString()}
            deltaText={`${stats.conversionRate}% conversion rate`}
            deltaUp
            tone="purple"
            icon={<TrendingUp className="h-4 w-4" />}
          />
        </div>

        {/* Performance Chart */}
        <div className="mt-8 rounded-3xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
          <h2 className="text-xl font-semibold text-slate-900">Weekly Performance</h2>
          <p className="mt-1 text-sm text-slate-600">Clicks from your partner network over the last 7 days</p>

          <div className="mt-8 rounded-3xl bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-8 ring-1 ring-slate-200">
            <div className="flex items-end justify-between gap-2" style={{ height: '200px' }}>
              {chartData.map((data, i) => (
                <div
                  key={i}
                  className="group relative flex flex-1 flex-col items-center justify-end"
                  style={{ minWidth: '20px' }}
                >
                  <div
                    className="w-full rounded-t-xl bg-gradient-to-t from-indigo-500 to-purple-500 shadow-lg transition-all duration-300 hover:from-indigo-600 hover:to-purple-600 hover:shadow-xl cursor-pointer"
                    style={{ height: `${data.height}%` }}
                  >
                    <div className="absolute -top-12 left-1/2 -translate-x-1/2 hidden group-hover:block z-10">
                      <div className="rounded-xl bg-slate-900 px-3 py-2 text-xs font-semibold text-white shadow-xl whitespace-nowrap">
                        {Math.round(data.height * 5)} clicks
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 flex items-center justify-between gap-2">
              {chartData.map((data, i) => (
                <div key={i} className="flex-1 text-center text-xs font-medium text-slate-600">
                  {data.label}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Partners Table */}
        <div className="mt-8 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Your Partners</h2>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-200">
              {stats.partners.length} total
            </span>
          </div>

          <div className="mt-4 overflow-hidden rounded-2xl ring-1 ring-slate-200">
            <table className="min-w-full bg-white text-left text-sm">
              <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Partner Name</th>
                  <th className="px-4 py-3 text-right">Clicks</th>
                  <th className="px-4 py-3 text-right">Conversions</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Last Active</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {stats.partners.map((partner) => (
                  <tr key={partner.trackingId} className="hover:bg-slate-50/60">
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900">{partner.name}</div>
                      <div className="text-xs text-slate-500 font-mono">{partner.trackingId}</div>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-slate-900">
                      {partner.clicks.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-emerald-600">
                      {partner.conversions}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "inline-flex rounded-full px-2 py-1 text-xs font-medium ring-1",
                          partner.status === 'active'
                            ? "bg-green-50 text-green-700 ring-green-200"
                            : "bg-slate-50 text-slate-600 ring-slate-200"
                        )}
                      >
                        {partner.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600">
                      {formatDate(partner.lastActive)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => copyPartnerLink(partner.trackingId)}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-white px-3 py-1.5 text-xs font-semibold text-slate-900 shadow-sm ring-1 ring-slate-200 hover:bg-slate-50"
                      >
                        {copiedId === partner.trackingId ? (
                          <>
                            <Check className="h-3 w-3 text-green-600" />
                            <span>Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3" />
                            <span>Share</span>
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="mt-8 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Recent Activity</h2>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-200">
              Latest
            </span>
          </div>

          <div className="mt-4 space-y-3">
            {stats.recentActivity.map((activity, idx) => (
              <div
                key={idx}
                className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 ring-1 ring-indigo-200">
                      <Activity className="h-5 w-5 text-indigo-600" />
                    </div>
                    <div>
                      <div className="font-medium text-slate-900">{activity.partnerName}</div>
                      <div className="text-sm text-slate-600">
                        <span className="font-mono text-xs">{activity.campaign}</span> • {activity.clicks} clicks
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-slate-500">
                    {formatDate(activity.timestamp)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Commission Info */}
        <div className="mt-8 rounded-3xl bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-8 ring-1 ring-slate-200">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-600 ring-1 ring-indigo-700">
              <Crown className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-semibold text-slate-900">Manager Performance Summary</h3>
              <p className="mt-2 text-sm text-slate-600">
                You've recruited {stats.totalReferrals} partners who have generated {stats.totalClicks.toLocaleString()} clicks 
                and {stats.totalConversions} conversions. Keep up the great work!
              </p>
              <div className="mt-4 grid grid-cols-3 gap-4">
                <div className="rounded-2xl bg-white/80 p-4 shadow-sm ring-1 ring-slate-200">
                  <div className="text-xs font-medium text-slate-500">Avg Clicks/Partner</div>
                  <div className="mt-1 text-2xl font-bold text-slate-900">
                    {Math.round(stats.totalClicks / stats.totalReferrals).toLocaleString()}
                  </div>
                </div>
                <div className="rounded-2xl bg-white/80 p-4 shadow-sm ring-1 ring-slate-200">
                  <div className="text-xs font-medium text-slate-500">Network Conversion Rate</div>
                  <div className="mt-1 text-2xl font-bold text-emerald-600">
                    {stats.conversionRate}%
                  </div>
                </div>
                <div className="rounded-2xl bg-white/80 p-4 shadow-sm ring-1 ring-slate-200">
                  <div className="text-xs font-medium text-slate-500">Active Rate</div>
                  <div className="mt-1 text-2xl font-bold text-indigo-600">
                    {Math.round((stats.activePartners / stats.totalReferrals) * 100)}%
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManagerDashboard;
