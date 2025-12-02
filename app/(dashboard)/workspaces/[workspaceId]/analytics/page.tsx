'use client';

/**
 * Analytics Dashboard
 * Phase 5.1: Admin Dashboard
 *
 * Workspace analytics overview with metrics, charts, and insights.
 */

import { useEffect, useState, useCallback, use } from 'react';
import Link from 'next/link';

// Types
interface OverviewMetrics {
  totalPageViews: number;
  uniqueVisitors: number;
  totalSessions: number;
  averageSessionDuration: number;
  bounceRate: number;
  totalLeads: number;
  conversionRate: number;
}

interface WebsiteMetric {
  websiteId: string;
  websiteName: string;
  websiteSlug: string;
  status: string;
  sessions: number;
  uniqueVisitors: number;
  leads: number;
  conversionRate: number;
}

interface TrafficSource {
  source: string;
  count: number;
  percentage: number;
}

interface DeviceBreakdown {
  device: string;
  count: number;
  percentage: number;
}

interface PersonaBreakdown {
  personaId: string;
  personaName: string;
  count: number;
  avgConfidence: number;
  percentage: number;
}

interface DailyMetric {
  date: string;
  sessions: number;
  uniqueVisitors: number;
  leads: number;
}

interface Analytics {
  overview: OverviewMetrics;
  websiteMetrics: WebsiteMetric[];
  trafficSources: TrafficSource[];
  deviceBreakdown: DeviceBreakdown[];
  personaBreakdown: PersonaBreakdown[];
  dailyMetrics: DailyMetric[];
  dateRange: {
    startDate: string;
    endDate: string;
  };
}

// Date range options
type DateRange = '7d' | '30d' | '90d' | 'custom';

export default function AnalyticsDashboardPage({
  params,
}: {
  params: Promise<{ workspaceId: string }>;
}) {
  const { workspaceId } = use(params);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<DateRange>('30d');

  const getDateRangeParams = useCallback(() => {
    const endDate = new Date().toISOString();
    let startDate: string;

    switch (dateRange) {
      case '7d':
        startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
        break;
      case '90d':
        startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
        break;
      case '30d':
      default:
        startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    }

    return { startDate, endDate };
  }, [dateRange]);

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      const { startDate, endDate } = getDateRangeParams();

      const response = await fetch(
        `/api/workspaces/${workspaceId}/analytics?startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch analytics');
      }

      const data = await response.json();
      setAnalytics(data.analytics);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [workspaceId, getDateRangeParams]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const formatDuration = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
          <button
            onClick={fetchAnalytics}
            className="mt-2 text-sm text-red-600 hover:text-red-800"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-600 mt-1">
            Track your workspace performance and visitor insights
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as DateRange)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
          <button
            onClick={fetchAnalytics}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-8">
        <MetricCard
          title="Page Views"
          value={formatNumber(analytics?.overview.totalPageViews || 0)}
          icon="eye"
        />
        <MetricCard
          title="Unique Visitors"
          value={formatNumber(analytics?.overview.uniqueVisitors || 0)}
          icon="users"
        />
        <MetricCard
          title="Sessions"
          value={formatNumber(analytics?.overview.totalSessions || 0)}
          icon="activity"
        />
        <MetricCard
          title="Avg. Duration"
          value={formatDuration(analytics?.overview.averageSessionDuration || 0)}
          icon="clock"
        />
        <MetricCard
          title="Bounce Rate"
          value={`${analytics?.overview.bounceRate || 0}%`}
          icon="arrow-down"
        />
        <MetricCard
          title="Leads"
          value={formatNumber(analytics?.overview.totalLeads || 0)}
          icon="mail"
        />
        <MetricCard
          title="Conversion"
          value={`${analytics?.overview.conversionRate || 0}%`}
          icon="trending-up"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* Daily Chart */}
        <div className="lg:col-span-2 bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Traffic Overview</h2>
          {analytics?.dailyMetrics && analytics.dailyMetrics.length > 0 ? (
            <SimpleBarChart data={analytics.dailyMetrics} />
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500">
              No data available for this period
            </div>
          )}
        </div>

        {/* Traffic Sources */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Traffic Sources</h2>
          {analytics?.trafficSources && analytics.trafficSources.length > 0 ? (
            <div className="space-y-3">
              {analytics.trafficSources.map((source, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                    <span className="text-sm text-gray-700 capitalize">{source.source}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900">{source.count}</span>
                    <span className="text-xs text-gray-500">({source.percentage.toFixed(1)}%)</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center text-gray-500">
              No traffic data available
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Device Breakdown */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Devices</h2>
          {analytics?.deviceBreakdown && analytics.deviceBreakdown.length > 0 ? (
            <div className="space-y-4">
              {analytics.deviceBreakdown.map((device, index) => (
                <div key={index}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-700 capitalize">{device.device}</span>
                    <span className="font-medium">{device.percentage.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full transition-all"
                      style={{ width: `${device.percentage}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-32 flex items-center justify-center text-gray-500">
              No device data available
            </div>
          )}
        </div>

        {/* Persona Detection */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Persona Detection</h2>
          {analytics?.personaBreakdown && analytics.personaBreakdown.length > 0 ? (
            <div className="space-y-3">
              {analytics.personaBreakdown.map((persona, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-medium text-gray-900">{persona.personaName}</div>
                    <div className="text-xs text-gray-500">
                      {persona.count} detections ({persona.percentage.toFixed(1)}%)
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-green-600">
                      {(persona.avgConfidence * 100).toFixed(0)}%
                    </div>
                    <div className="text-xs text-gray-500">confidence</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-32 flex items-center justify-center text-gray-500">
              No persona detections yet
            </div>
          )}
        </div>
      </div>

      {/* Website Performance */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Website Performance</h2>
        {analytics?.websiteMetrics && analytics.websiteMetrics.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Website</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Status</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Sessions</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Visitors</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Leads</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Conversion</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody>
                {analytics.websiteMetrics.map((website) => (
                  <tr key={website.websiteId} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="font-medium text-gray-900">{website.websiteName}</div>
                      <div className="text-xs text-gray-500">/{website.websiteSlug}</div>
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={website.status} />
                    </td>
                    <td className="py-3 px-4 text-right font-medium">{website.sessions}</td>
                    <td className="py-3 px-4 text-right font-medium">{website.uniqueVisitors}</td>
                    <td className="py-3 px-4 text-right font-medium">{website.leads}</td>
                    <td className="py-3 px-4 text-right font-medium">{website.conversionRate.toFixed(2)}%</td>
                    <td className="py-3 px-4 text-right">
                      <Link
                        href={`/workspaces/${workspaceId}/websites/${website.websiteId}`}
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="h-32 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <p>No websites in this workspace</p>
              <Link
                href={`/workspaces/${workspaceId}/websites`}
                className="text-sm text-blue-600 hover:text-blue-800 mt-2 inline-block"
              >
                Create your first website
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Metric Card Component
function MetricCard({ title, value, icon }: { title: string; value: string; icon: string }) {
  const getIcon = () => {
    switch (icon) {
      case 'eye':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
        );
      case 'users':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        );
      case 'activity':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        );
      case 'clock':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'arrow-down':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        );
      case 'mail':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        );
      case 'trending-up':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center gap-2 text-gray-500 mb-2">
        {getIcon()}
        <span className="text-xs font-medium uppercase tracking-wide">{title}</span>
      </div>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
    </div>
  );
}

// Status Badge Component
function StatusBadge({ status }: { status: string }) {
  const getStyles = () => {
    switch (status) {
      case 'published':
        return 'bg-green-100 text-green-800';
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'generating':
        return 'bg-yellow-100 text-yellow-800';
      case 'archived':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <span className={`px-2 py-1 text-xs font-medium rounded-full capitalize ${getStyles()}`}>
      {status}
    </span>
  );
}

// Simple Bar Chart Component
function SimpleBarChart({ data }: { data: DailyMetric[] }) {
  const maxSessions = Math.max(...data.map(d => d.sessions), 1);

  // Show last 14 days max
  const displayData = data.slice(-14);

  return (
    <div className="h-64">
      <div className="flex items-end justify-between h-48 gap-1">
        {displayData.map((day, index) => (
          <div key={index} className="flex-1 flex flex-col items-center">
            <div className="w-full flex flex-col items-center gap-1">
              {/* Sessions bar */}
              <div
                className="w-full bg-blue-500 rounded-t transition-all hover:bg-blue-600"
                style={{ height: `${(day.sessions / maxSessions) * 150}px` }}
                title={`${day.sessions} sessions`}
              ></div>
            </div>
          </div>
        ))}
      </div>
      <div className="flex justify-between mt-2 text-xs text-gray-500">
        {displayData.length > 0 && (
          <>
            <span>{new Date(displayData[0].date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
            <span>{new Date(displayData[displayData.length - 1].date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
          </>
        )}
      </div>
      <div className="flex items-center gap-4 mt-4 justify-center text-xs">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-blue-500 rounded"></div>
          <span className="text-gray-600">Sessions</span>
        </div>
      </div>
    </div>
  );
}
