/**
 * Tracking Analytics API
 * Phase 4.2: Runtime Persona Detection
 *
 * Endpoint for retrieving detection analytics.
 * This endpoint requires authentication.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createDetectionService } from '@/lib/tracking';

/**
 * GET /api/tracking/analytics
 * Get detection analytics for a website
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
    const startDate = searchParams.get('startDate') || undefined;
    const endDate = searchParams.get('endDate') || undefined;

    if (!websiteId) {
      return NextResponse.json(
        { error: 'websiteId is required' },
        { status: 400 }
      );
    }

    // Verify user has access to this website's workspace
    const { data: website, error: websiteError } = await supabase
      .from('websites')
      .select('workspace_id')
      .eq('id', websiteId)
      .single();

    if (websiteError || !website) {
      return NextResponse.json({ error: 'Website not found' }, { status: 404 });
    }

    const { data: membership, error: memberError } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', website.workspace_id)
      .eq('user_id', user.id)
      .single();

    if (memberError || !membership) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Get detection analytics
    const service = createDetectionService(websiteId);
    const result = await service.getDetectionAnalytics(startDate, endDate);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ data: result.data });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
