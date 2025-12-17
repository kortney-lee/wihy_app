/**
 * Engagement Dashboard (Public)
 * Individual performance dashboard for partners/marketers
 * Accessed via: /engagement/:trackingId
 * 
 * Uses:
 *  - GET /api/tracking/engagement/:trackingId
 */

import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

interface EngagementStats {
  trackingId: string;
  totalClicks: number;
  totalConversions: number;
  conversionRate: number;
  topCampaigns: Array<{
    campaign: string;
    clicks: number;
  }>;
  recentActivity: Array<{
    timestamp: string;
    campaign: string;
    destination: string;
    eventType: 'inbound' | 'outbound';
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
  return classes.filter(Boolean).join(' ');
}

function formatDate(ts: string) {
  try {
    const date = new Date(ts);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return ts;
  }
}

function StatCard({
  label,
  value,
  subtitle,
  icon,
  accent = 'emerald',
}: {
  label: string;
  value: string | number;
  subtitle?: string;
  icon?: string;
  accent?: 'emerald' | 'blue' | 'purple' | 'amber';
}) {
  const accentMap: Record<string, string> = {
    emerald: 'text-emerald-600 bg-emerald-50 ring-emerald-200',
    blue: 'text-blue-600 bg-blue-50 ring-blue-200',
    purple: 'text-purple-600 bg-purple-50 ring-purple-200',
    amber: 'text-amber-600 bg-amber-50 ring-amber-200',
  };

  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
      {icon && (
        <div className={cn(
          'mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl ring-1',
          accentMap[accent]
        )}>
          <span className="text-xl">{icon}</span>
        </div>
      )}
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className={cn('mt-2 text-3xl font-bold', accentMap[accent].split(' ')[0])}>
        {value}
      </p>
      {subtitle && (
        <p className="mt-1 text-xs text-slate-600">{subtitle}</p>
      )}
    </div>
  );
}

function Card({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
      <div className="mb-4">
        <h2 className="text-base font-semibold text-slate-900">{title}</h2>
        {subtitle && (
          <p className="mt-1 text-sm text-slate-600">{subtitle}</p>
        )}
      </div>
      {children}
    </section>
  );
}

function Badge({ 
  children,
  variant = 'default'
}: { 
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'info';
}) {
  const variants = {
    default: 'bg-slate-100 text-slate-700 ring-slate-200',
    success: 'bg-emerald-100 text-emerald-700 ring-emerald-200',
    info: 'bg-blue-100 text-blue-700 ring-blue-200',
  };

  return (
    <span className={cn(
      'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1',
      variants[variant]
    )}>
      {children}
    </span>
  );
}

const EngagementDashboard: React.FC = () => {
  const { trackingId } = useParams<{ trackingId: string }>();
  const [stats, setStats] = useState<EngagementStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (trackingId) {
      fetchStats();
    }
  }, [trackingId]);

  const fetchStats = async () => {
    try {
      const response = await fetch(`/api/tracking/engagement/${trackingId}`);
      if (!response.ok) {
        throw new Error('Failed to load stats');
      }
      const data = await response.json();
      setStats(data);
    } catch (err) {
      setError('Unable to load your dashboard. Please check your link.');
      console.error('Failed to fetch engagement stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const copyTrackingLink = () => {
    const link = `${window.location.origin}/?ref=${trackingId}`;
    navigator.clipboard.writeText(link);
    alert('Your tracking link copied to clipboard!');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <div className="rounded-3xl bg-white p-12 text-center shadow-lg ring-1 ring-slate-200">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-emerald-600" />
            <p className="mt-4 text-sm text-slate-600">Loading your dashboard…</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="mx-auto max-w-2xl px-6 py-16">
          <div className="rounded-3xl bg-white p-12 text-center shadow-lg ring-1 ring-slate-200">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 ring-1 ring-red-200">
              <span className="text-3xl">⚠️</span>
            </div>
            <h2 className="mt-6 text-2xl font-bold text-slate-900">Dashboard Not Found</h2>
            <p className="mt-2 text-slate-600">
              {error || 'This tracking link is invalid or has expired.'}
            </p>
            <p className="mt-4 text-sm text-slate-500">
              Please contact WIHY support if you believe this is an error.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="mx-auto max-w-7xl px-6 py-10">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-lg">
                  <span className="text-2xl">📊</span>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-slate-900">
                    Your Performance Dashboard
                  </h1>
                  <p className="text-sm text-slate-600">
                    Tracking ID: <span className="font-mono font-semibold text-slate-900">{trackingId}</span>
                  </p>
                </div>
              </div>
            </div>
            <button
              onClick={copyTrackingLink}
              className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-400"
            >
              📋 Copy Your Link
            </button>
          </div>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-600">
            Track your impact and see real-time results from your promotion efforts. Share your unique link to drive traffic to WIHY.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Total Clicks"
            value={stats.totalClicks}
            subtitle="People who clicked your link"
            icon="👥"
            accent="emerald"
          />
          <StatCard
            label="Conversions"
            value={stats.totalConversions}
            subtitle="Clicked through to destination"
            icon="🎯"
            accent="blue"
          />
          <StatCard
            label="Conversion Rate"
            value={`${stats.conversionRate}%`}
            subtitle="How many visitors convert"
            icon="📈"
            accent="purple"
          />
          <StatCard
            label="Active Campaigns"
            value={stats.topCampaigns.length}
            subtitle="Different campaigns tracked"
            icon="🚀"
            accent="amber"
          />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Top Campaigns */}
          <Card 
            title="Your Top Campaigns" 
            subtitle="Performance by campaign"
          >
            <div className="space-y-3">
              {stats.topCampaigns.length > 0 ? (
                stats.topCampaigns.map((campaign, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between rounded-xl bg-slate-50 p-4 ring-1 ring-slate-200"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-sm font-bold text-emerald-700">
                        {idx + 1}
                      </div>
                      <span className="font-medium text-slate-900">
                        {campaign.campaign}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-slate-900">
                        {campaign.clicks}
                      </div>
                      <div className="text-xs text-slate-600">clicks</div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-xl bg-slate-50 p-8 text-center">
                  <p className="text-sm text-slate-600">
                    No campaigns yet. Start sharing your link!
                  </p>
                </div>
              )}
            </div>
          </Card>

          {/* Destinations */}
          <Card 
            title="Where People Go" 
            subtitle="Click destinations from your traffic"
          >
            <div className="space-y-3">
              {stats.destinations.length > 0 ? (
                stats.destinations.map((dest, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between rounded-xl bg-slate-50 p-4 ring-1 ring-slate-200"
                  >
                    <span className="font-medium text-slate-900">{dest.name}</span>
                    <div className="flex items-center gap-3">
                      <div className="h-2 w-32 overflow-hidden rounded-full bg-slate-200">
                        <div
                          className="h-full rounded-full bg-emerald-500"
                          style={{
                            width: `${Math.min(100, (dest.clicks / stats.totalConversions) * 100)}%`,
                          }}
                        />
                      </div>
                      <span className="w-12 text-right text-sm font-semibold text-slate-700">
                        {dest.clicks}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-xl bg-slate-50 p-8 text-center">
                  <p className="text-sm text-slate-600">
                    No conversions yet. Keep sharing!
                  </p>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Recent Activity */}
        <div className="mt-6">
          <Card title="Recent Activity" subtitle="Your latest traffic and conversions">
            {stats.recentActivity.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-3 py-3">Type</th>
                      <th className="px-3 py-3">Campaign</th>
                      <th className="px-3 py-3">Destination</th>
                      <th className="px-3 py-3">Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {stats.recentActivity.map((activity, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/60">
                        <td className="px-3 py-3">
                          <Badge variant={activity.eventType === 'outbound' ? 'info' : 'success'}>
                            {activity.eventType === 'outbound' ? '→ OUT' : '← IN'}
                          </Badge>
                        </td>
                        <td className="px-3 py-3 font-medium text-slate-900">
                          {activity.campaign}
                        </td>
                        <td className="px-3 py-3 text-slate-700">
                          {activity.destination}
                        </td>
                        <td className="px-3 py-3 text-xs text-slate-600">
                          {formatDate(activity.timestamp)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="rounded-xl bg-slate-50 p-12 text-center">
                <span className="text-4xl">🎯</span>
                <p className="mt-4 font-medium text-slate-900">No activity yet</p>
                <p className="mt-1 text-sm text-slate-600">
                  Start sharing your tracking link to see results here!
                </p>
              </div>
            )}
          </Card>
        </div>

        {/* How to Share */}
        <div className="mt-6">
          <div className="rounded-2xl bg-gradient-to-br from-emerald-50 to-emerald-100 p-8 shadow-sm ring-1 ring-emerald-200">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-2xl shadow-lg">
                🔗
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-emerald-900">
                  Share Your Tracking Link
                </h3>
                <p className="mt-1 text-sm text-emerald-800">
                  Click "Copy Your Link" above to get your unique tracking URL. Share it on social media,
                  email, or anywhere you promote WIHY. Every click and conversion will show up here in real-time.
                </p>
                <div className="mt-4 rounded-xl bg-white p-4 font-mono text-sm text-slate-700 ring-1 ring-emerald-200">
                  {window.location.origin}/?ref={trackingId}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-xs text-slate-500">
            Questions about your stats?{' '}
            <a href="mailto:info@wihy.ai" className="font-medium text-emerald-600 hover:underline">
              Contact WIHY Support
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default EngagementDashboard;
