/**
 * Workspace Analytics API
 * Phase 5.1: Admin Dashboard
 *
 * Analytics data aggregation for workspace overview.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/workspaces/[workspaceId]/analytics
 * Get analytics data for a workspace
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  try {
    const { workspaceId } = await params;
    const supabase = await createClient();

    // Verify authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check workspace membership
    const { data: membership } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', workspaceId)
      .eq('user_id', user.id)
      .single();

    if (!membership) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Parse query parameters for date range
    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get('startDate') || getDefaultStartDate();
    const endDate = searchParams.get('endDate') || new Date().toISOString();

    // Get all websites in workspace
    const { data: websites } = await supabase
      .from('websites')
      .select('id, name, slug, status')
      .eq('workspace_id', workspaceId);

    const websiteIds = websites?.map(w => w.id) || [];

    if (websiteIds.length === 0) {
      return NextResponse.json({
        success: true,
        analytics: {
          overview: {
            totalPageViews: 0,
            uniqueVisitors: 0,
            totalSessions: 0,
            averageSessionDuration: 0,
            bounceRate: 0,
            totalLeads: 0,
            conversionRate: 0,
          },
          websiteMetrics: [],
          trafficSources: [],
          topPages: [],
          personaBreakdown: [],
          dailyMetrics: [],
        },
      });
    }

    // Fetch analytics data in parallel
    const [
      pageViewsResult,
      sessionsResult,
      leadsResult,
      trafficSourcesResult,
      personaDetectionsResult,
    ] = await Promise.all([
      // Page views count
      supabase
        .from('analytics_events')
        .select('id', { count: 'exact', head: true })
        .in('website_id', websiteIds)
        .eq('event_type', 'page_view')
        .gte('created_at', startDate)
        .lte('created_at', endDate),

      // Sessions with visitor data
      supabase
        .from('visitor_sessions')
        .select('*')
        .in('website_id', websiteIds)
        .gte('created_at', startDate)
        .lte('created_at', endDate),

      // Leads count
      supabase
        .from('lead_captures')
        .select('*')
        .in('website_id', websiteIds)
        .gte('created_at', startDate)
        .lte('created_at', endDate),

      // Traffic sources from sessions
      supabase
        .from('visitor_sessions')
        .select('utm_source, utm_medium, utm_campaign, referrer_url')
        .in('website_id', websiteIds)
        .gte('created_at', startDate)
        .lte('created_at', endDate),

      // Persona detections
      supabase
        .from('visitor_sessions')
        .select('detected_persona_id, persona_confidence')
        .in('website_id', websiteIds)
        .not('detected_persona_id', 'is', null)
        .gte('created_at', startDate)
        .lte('created_at', endDate),
    ]);

    // Calculate metrics
    const sessions = sessionsResult.data || [];
    const leads = leadsResult.data || [];
    const trafficData = trafficSourcesResult.data || [];
    const personaDetections = personaDetectionsResult.data || [];

    // Unique visitors
    const uniqueVisitors = new Set(sessions.map(s => s.visitor_id)).size;

    // Average session duration (calculate from last_activity_at - started_at)
    const sessionDurations = sessions.map(s => {
      const start = new Date(s.started_at).getTime();
      const end = new Date(s.last_activity_at).getTime();
      return (end - start) / 1000; // seconds
    });
    const avgSessionDuration = sessionDurations.length > 0
      ? sessionDurations.reduce((a, b) => a + b, 0) / sessionDurations.length
      : 0;

    // Bounce rate (sessions with only 1 page in navigation_path)
    const bouncedSessions = sessions.filter(s =>
      !s.navigation_path || (s.navigation_path as string[]).length <= 1
    ).length;
    const bounceRate = sessions.length > 0
      ? (bouncedSessions / sessions.length) * 100
      : 0;

    // Conversion rate
    const conversionRate = uniqueVisitors > 0
      ? (leads.length / uniqueVisitors) * 100
      : 0;

    // Traffic sources breakdown
    const sourceMap = new Map<string, number>();
    trafficData.forEach(t => {
      const source = t.utm_source ||
        (t.referrer_url ? new URL(t.referrer_url).hostname : 'direct');
      sourceMap.set(source, (sourceMap.get(source) || 0) + 1);
    });
    const trafficSources = Array.from(sourceMap.entries())
      .map(([source, count]) => ({ source, count, percentage: (count / trafficData.length) * 100 }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Device breakdown
    const deviceMap = new Map<string, number>();
    sessions.forEach(s => {
      const device = s.device_type || 'unknown';
      deviceMap.set(device, (deviceMap.get(device) || 0) + 1);
    });
    const deviceBreakdown = Array.from(deviceMap.entries())
      .map(([device, count]) => ({ device, count, percentage: (count / sessions.length) * 100 }));

    // Persona breakdown
    const personaMap = new Map<string, { count: number; avgConfidence: number }>();
    personaDetections.forEach(p => {
      const existing = personaMap.get(p.detected_persona_id!) || { count: 0, avgConfidence: 0 };
      const newCount = existing.count + 1;
      const newAvgConfidence = ((existing.avgConfidence * existing.count) + (p.persona_confidence || 0)) / newCount;
      personaMap.set(p.detected_persona_id!, { count: newCount, avgConfidence: newAvgConfidence });
    });

    // Get persona names
    const personaIds = Array.from(personaMap.keys());
    const { data: personas } = await supabase
      .from('personas')
      .select('id, name')
      .in('id', personaIds);

    const personaNameMap = new Map(personas?.map(p => [p.id, p.name]) || []);
    const personaBreakdown = Array.from(personaMap.entries())
      .map(([id, data]) => ({
        personaId: id,
        personaName: personaNameMap.get(id) || 'Unknown',
        count: data.count,
        avgConfidence: data.avgConfidence,
        percentage: (data.count / personaDetections.length) * 100,
      }))
      .sort((a, b) => b.count - a.count);

    // Per-website metrics
    const websiteMetrics = websites?.map(w => {
      const wSessions = sessions.filter(s => s.website_id === w.id);
      const wLeads = leads.filter(l => l.website_id === w.id);
      const wUniqueVisitors = new Set(wSessions.map(s => s.visitor_id)).size;

      return {
        websiteId: w.id,
        websiteName: w.name,
        websiteSlug: w.slug,
        status: w.status,
        sessions: wSessions.length,
        uniqueVisitors: wUniqueVisitors,
        leads: wLeads.length,
        conversionRate: wUniqueVisitors > 0 ? (wLeads.length / wUniqueVisitors) * 100 : 0,
      };
    }) || [];

    // Daily metrics for chart
    const dailyMap = new Map<string, { sessions: number; visitors: Set<string>; leads: number }>();
    sessions.forEach(s => {
      const date = s.created_at.split('T')[0];
      const existing = dailyMap.get(date) || { sessions: 0, visitors: new Set(), leads: 0 };
      existing.sessions++;
      existing.visitors.add(s.visitor_id);
      dailyMap.set(date, existing);
    });
    leads.forEach(l => {
      const date = l.created_at.split('T')[0];
      const existing = dailyMap.get(date) || { sessions: 0, visitors: new Set(), leads: 0 };
      existing.leads++;
      dailyMap.set(date, existing);
    });

    const dailyMetrics = Array.from(dailyMap.entries())
      .map(([date, data]) => ({
        date,
        sessions: data.sessions,
        uniqueVisitors: data.visitors.size,
        leads: data.leads,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return NextResponse.json({
      success: true,
      analytics: {
        overview: {
          totalPageViews: pageViewsResult.count || 0,
          uniqueVisitors,
          totalSessions: sessions.length,
          averageSessionDuration: Math.round(avgSessionDuration),
          bounceRate: Math.round(bounceRate * 10) / 10,
          totalLeads: leads.length,
          conversionRate: Math.round(conversionRate * 100) / 100,
        },
        websiteMetrics,
        trafficSources,
        deviceBreakdown,
        personaBreakdown,
        dailyMetrics,
        dateRange: {
          startDate,
          endDate,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function getDefaultStartDate(): string {
  const date = new Date();
  date.setDate(date.getDate() - 30); // Default to last 30 days
  return date.toISOString();
}
