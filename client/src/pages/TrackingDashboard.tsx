/**
 * Tracking Dashboard (Tailwind)
 * View and analyze link tracking data
 *
 * Uses:
 *  - GET  /api/tracking/stats
 *  - GET  /api/tracking/referrer/:referrerId
 */

import React, { useEffect, useMemo, useState } from "react";

interface TrackingEvent {
  id: string;
  referrer: string;
  campaign: string;
  timestamp: string;
  landingPage: string;
  originalSource?: string;
  destinationUrl?: string;
  eventType?: 'inbound' | 'outbound';
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
    originalSource?: string;
    destinationUrl?: string;
    eventType?: 'inbound' | 'outbound';
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

function TopBar({
  onGenerate,
  onTest,
}: {
  onGenerate: () => void;
  onTest: () => void;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-slate-900">
          Link Tracking Dashboard
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Track influencer links, platforms, and campaign performance.
        </p>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <button
          onClick={onGenerate}
          className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400"
        >
          Generate tracking links
        </button>
        <button
          onClick={onTest}
          className="inline-flex items-center justify-center rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-slate-200 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-300"
        >
          Test tracking
        </button>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  accent = "slate",
}: {
  label: string;
  value: string | number;
  accent?: "slate" | "emerald" | "blue" | "rose" | "amber";
}) {
  const accentMap: Record<string, string> = {
    slate: "text-slate-900",
    emerald: "text-emerald-600",
    blue: "text-blue-600",
    rose: "text-rose-600",
    amber: "text-amber-600",
  };

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className={cn("mt-2 text-3xl font-semibold", accentMap[accent])}>
        {value}
      </p>
    </div>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 ring-1 ring-slate-200">
      {children}
    </span>
  );
}

function EmptyState({
  onGenerate,
  onTest,
}: {
  onGenerate: () => void;
  onTest: () => void;
}) {
  return (
    <div className="rounded-3xl bg-white p-10 text-center shadow-sm ring-1 ring-slate-200">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50 ring-1 ring-slate-200">
        <span className="text-2xl">📊</span>
      </div>

      <h2 className="mt-6 text-2xl font-semibold text-slate-900">
        No Click Data Yet
      </h2>
      <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-slate-600">
        No one has clicked your tracking links yet. Generate unique links for
        partners and campaigns to track who drives traffic to your destination.
      </p>

      <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
        <button
          onClick={onGenerate}
          className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-300"
        >
          Generate Tracking Links
        </button>
        <button
          onClick={onTest}
          className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-300"
        >
          Test Tracking System
        </button>
      </div>

      <div className="mx-auto mt-8 max-w-3xl rounded-2xl bg-slate-50 p-6 text-left ring-1 ring-slate-200">
        <h3 className="text-sm font-semibold text-slate-900">
          How to get started
        </h3>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-6 text-slate-700">
          <li>Click "Generate Tracking Links" to create unique links.</li>
          <li>Share each link with a specific partner, influencer, or campaign.</li>
          <li>When someone clicks the link, it will appear here.</li>
          <li>See which partners and campaigns drive the most traffic.</li>
        </ol>
      </div>
    </div>
  );
}

function Card({
  title,
  right,
  children,
}: {
  title: string;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-slate-900">{title}</h2>
        {right}
      </div>
      {children}
    </section>
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
            <p className="text-xs font-medium text-slate-500">Details</p>
            <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl bg-white px-3 py-2 text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-slate-200 transition hover:bg-slate-50"
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

  const [selectedReferrer, setSelectedReferrer] = useState<string | null>(null);
  const [referrerEvents, setReferrerEvents] = useState<TrackingEvent[]>([]);
  const [detailsLoading, setDetailsLoading] = useState(false);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/tracking/stats");
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error("Failed to fetch stats:", error);
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
    } catch (error) {
      console.error("Failed to fetch referrer details:", error);
    } finally {
      setDetailsLoading(false);
    }
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

  const topCampaigns = useMemo(() => {
    if (!stats) return [];
    return Object.entries(stats.byCampaign || {})
      .sort(([, a], [, b]) => b - a)
      .map(([campaign, count]) => ({ campaign, count }));
  }, [stats]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="mx-auto max-w-6xl px-6 py-10">
          <div className="rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-slate-200">
            <div className="mx-auto h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-slate-900" />
            <p className="mt-3 text-sm text-slate-600">Loading dashboard…</p>
          </div>
        </div>
      </div>
    );
  }

  // Empty state
  if (!stats || stats.totalEvents === 0) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="mx-auto max-w-5xl px-6 py-10">
          <TopBar onGenerate={onGenerate} onTest={onTest} />
          <div className="mt-8">
            <EmptyState onGenerate={onGenerate} onTest={onTest} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <TopBar onGenerate={onGenerate} onTest={onTest} />

        {/* Summary */}
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard
            label="Total Clicks"
            value={stats.totalEvents}
            accent="emerald"
          />
          <StatCard
            label="Partners / Sources"
            value={Object.keys(stats.byReferrer || {}).length}
            accent="blue"
          />
          <StatCard
            label="Campaigns"
            value={Object.keys(stats.byCampaign || {}).length}
            accent="rose"
          />
        </div>

        {/* Top Referrers */}
        <div className="mt-6">
          <Card
            title="Top Partners & Sources"
            right={<Badge>{topReferrers.length} sources</Badge>}
          >
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-3 py-3">Partner / Source</th>
                    <th className="px-3 py-3 text-right">Clicks</th>
                    <th className="px-3 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {topReferrers.map(({ referrer, count }) => (
                    <tr key={referrer} className="hover:bg-slate-50/60">
                      <td className="px-3 py-3 font-medium text-slate-900">
                        {referrer}
                      </td>
                      <td className="px-3 py-3 text-right text-slate-700">
                        {count}
                      </td>
                      <td className="px-3 py-3 text-right">
                        <button
                          onClick={() => fetchReferrerDetails(referrer)}
                          className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400"
                        >
                          {detailsLoading && selectedReferrer === referrer
                            ? "Loading…"
                            : "View details"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Campaigns */}
        <div className="mt-6">
          <Card title="Campaigns" right={<Badge>{topCampaigns.length} campaigns</Badge>}>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {topCampaigns.map(({ campaign, count }) => (
                <div
                  key={campaign}
                  className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200"
                >
                  <div className="text-xs font-medium text-slate-600">
                    {campaign}
                  </div>
                  <div className="mt-2 text-2xl font-semibold text-slate-900">
                    {count}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Recent Activity */}
        <div className="mt-6">
          <Card title="Recent Clicks" right={<Badge>Latest</Badge>}>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-3 py-3">Type</th>
                    <th className="px-3 py-3">Source</th>
                    <th className="px-3 py-3">Original Source</th>
                    <th className="px-3 py-3">Campaign</th>
                    <th className="px-3 py-3">Destination</th>
                    <th className="px-3 py-3">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {stats.recent.map((event, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/60">
                      <td className="px-3 py-3">
                        <span className={cn(
                          "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold",
                          event.eventType === 'outbound' 
                            ? "bg-blue-100 text-blue-700" 
                            : "bg-emerald-100 text-emerald-700"
                        )}>
                          {event.eventType === 'outbound' ? '→ OUT' : '← IN'}
                        </span>
                      </td>
                      <td className="px-3 py-3 font-medium text-slate-900">
                        {event.referrer}
                      </td>
                      <td className="px-3 py-3 text-xs text-slate-600">
                        {event.originalSource 
                          ? (event.originalSource !== event.referrer ? `${event.originalSource} →` : event.originalSource)
                          : '-'}
                      </td>
                      <td className="px-3 py-3 text-slate-700">
                        {event.campaign}
                      </td>
                      <td className="px-3 py-3 text-xs text-slate-600">
                        {event.eventType === 'outbound' 
                          ? (event.destinationUrl?.includes('kickstarter') ? 'Kickstarter' : event.destinationUrl?.split('/')[2] || 'External')
                          : event.landingPage}
                      </td>
                      <td className="px-3 py-3 text-xs text-slate-600">
                        {formatDate(event.timestamp)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Referrer Details Modal */}
        <Modal
          open={!!selectedReferrer}
          title={selectedReferrer ? `Details for ${selectedReferrer}` : "Details"}
          onClose={() => setSelectedReferrer(null)}
        >
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm text-slate-700">
                Total clicks:{" "}
                <span className="font-semibold text-slate-900">
                  {referrerEvents.length}
                </span>
              </p>
              <Badge>{referrerEvents.length} events</Badge>
            </div>

            <div className="overflow-x-auto rounded-2xl ring-1 ring-slate-200">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-3 py-3">Campaign</th>
                    <th className="px-3 py-3">Destination</th>
                    <th className="px-3 py-3">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {referrerEvents.map((e) => (
                    <tr key={e.id} className="hover:bg-slate-50/60">
                      <td className="px-3 py-3 text-slate-800">{e.campaign}</td>
                      <td className="px-3 py-3 text-xs text-slate-600">
                        {e.landingPage}
                      </td>
                      <td className="px-3 py-3 text-xs text-slate-600">
                        {formatDate(e.timestamp)}
                      </td>
                    </tr>
                  ))}
                  {referrerEvents.length === 0 && (
                    <tr>
                      <td
                        colSpan={3}
                        className="px-3 py-10 text-center text-sm text-slate-600"
                      >
                        No events found for this source.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
};

export default TrackingDashboard;
