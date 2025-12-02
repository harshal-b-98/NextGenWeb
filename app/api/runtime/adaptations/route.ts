/**
 * Content Adaptations API
 * Phase 4.3: Dynamic Page Runtime
 *
 * Public endpoint for logging content adaptation events.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { ContentAdaptationEvent } from '@/lib/runtime/types';

/**
 * POST /api/runtime/adaptations
 * Log a content adaptation event
 */
export async function POST(request: NextRequest) {
  try {
    const event: ContentAdaptationEvent = await request.json();

    // Basic validation
    if (!event.pageId || !event.websiteId || !event.sessionId || !event.toVariant) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Store the event in analytics_events table
    const { data, error } = await supabase
      .from('analytics_events')
      .insert({
        event_type: 'content_adaptation',
        website_id: event.websiteId,
        page_id: event.pageId,
        session_id: event.sessionId,
        persona_id: event.personaId || null,
        event_data: {
          fromVariant: event.fromVariant,
          toVariant: event.toVariant,
          adaptedSections: event.adaptedSections,
          confidence: event.confidence,
          reason: event.reason,
          transitionDuration: event.transitionDuration,
        },
        created_at: event.timestamp,
      })
      .select('id')
      .single();

    if (error) {
      console.error('Error storing adaptation event:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to store event' },
        { status: 500 }
      );
    }

    // Set CORS headers
    const response = NextResponse.json(
      { success: true, eventId: data?.id },
      { status: 201 }
    );

    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type');

    return response;
  } catch (error) {
    console.error('Error processing adaptation event:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/runtime/adaptations
 * Get adaptation events for analytics (authenticated)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Verify authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const pageId = searchParams.get('pageId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const limit = parseInt(searchParams.get('limit') || '100');

    // Build query
    let query = supabase
      .from('analytics_events')
      .select('*')
      .eq('event_type', 'content_adaptation')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (pageId) {
      query = query.eq('page_id', pageId);
    }

    if (startDate) {
      query = query.gte('created_at', startDate);
    }

    if (endDate) {
      query = query.lte('created_at', endDate);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }

    // Calculate summary statistics
    const summary = calculateAdaptationSummary(data || []);

    return NextResponse.json({
      success: true,
      data: {
        events: data,
        summary,
      },
    });
  } catch (error) {
    console.error('Error fetching adaptation events:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * OPTIONS /api/runtime/adaptations
 * Handle CORS preflight
 */
export async function OPTIONS() {
  const response = new NextResponse(null, { status: 204 });

  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
  response.headers.set('Access-Control-Max-Age', '86400');

  return response;
}

/**
 * Calculate summary statistics for adaptation events
 */
function calculateAdaptationSummary(events: any[]) {
  if (events.length === 0) {
    return {
      totalAdaptations: 0,
      uniqueSessions: 0,
      variantDistribution: {},
      avgConfidence: 0,
      reasonDistribution: {},
    };
  }

  const uniqueSessions = new Set(events.map((e) => e.session_id)).size;
  const variantDistribution: Record<string, number> = {};
  const reasonDistribution: Record<string, number> = {};
  let totalConfidence = 0;

  for (const event of events) {
    const eventData = event.event_data;

    // Count variants
    const variant = eventData.toVariant;
    variantDistribution[variant] = (variantDistribution[variant] || 0) + 1;

    // Count reasons
    const reason = eventData.reason;
    reasonDistribution[reason] = (reasonDistribution[reason] || 0) + 1;

    // Sum confidence
    totalConfidence += eventData.confidence || 0;
  }

  return {
    totalAdaptations: events.length,
    uniqueSessions,
    variantDistribution,
    avgConfidence: events.length > 0 ? totalConfidence / events.length : 0,
    reasonDistribution,
  };
}
