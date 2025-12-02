/**
 * Conversions API
 * Phase 4.4: Conversion & Lead Tools
 *
 * Endpoints for tracking conversion events.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createConversionService } from '@/lib/leads';
import type { ConversionEventInput } from '@/lib/leads/conversion-service';

/**
 * POST /api/conversions
 * Track a conversion event (public endpoint)
 */
export async function POST(request: NextRequest) {
  try {
    const input: ConversionEventInput = await request.json();

    // Basic validation
    if (!input.goalId || !input.websiteId || !input.sessionId) {
      return NextResponse.json(
        { success: false, error: 'Goal ID, website ID, and session ID are required' },
        { status: 400 }
      );
    }

    const conversionService = createConversionService();
    const event = await conversionService.trackConversion(input);

    if (!event) {
      return NextResponse.json(
        { success: false, error: 'Failed to track conversion or goal is inactive' },
        { status: 400 }
      );
    }

    // Set CORS headers for public endpoint
    const response = NextResponse.json(
      {
        success: true,
        eventId: event.id,
      },
      { status: 201 }
    );

    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type');

    return response;
  } catch (error) {
    console.error('Error tracking conversion:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/conversions
 * Get conversion events and stats (authenticated endpoint)
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
    const websiteId = searchParams.get('websiteId');
    const goalId = searchParams.get('goalId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const type = searchParams.get('type'); // 'events' or 'stats'

    if (!websiteId) {
      return NextResponse.json(
        { success: false, error: 'Website ID is required' },
        { status: 400 }
      );
    }

    const conversionService = createConversionService();

    if (type === 'stats') {
      // Get statistics
      if (goalId) {
        const stats = await conversionService.getGoalStats(
          goalId,
          startDate || undefined,
          endDate || undefined
        );
        return NextResponse.json({
          success: true,
          data: stats,
        });
      } else {
        const stats = await conversionService.getWebsiteStats(
          websiteId,
          startDate || undefined,
          endDate || undefined
        );
        return NextResponse.json({
          success: true,
          data: stats,
        });
      }
    } else {
      // Get events
      if (!goalId) {
        return NextResponse.json(
          { success: false, error: 'Goal ID is required for event listing' },
          { status: 400 }
        );
      }

      const events = await conversionService.getEvents(goalId, {
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        limit: 100,
      });

      return NextResponse.json({
        success: true,
        data: events,
      });
    }
  } catch (error) {
    console.error('Error fetching conversions:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * OPTIONS /api/conversions
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
