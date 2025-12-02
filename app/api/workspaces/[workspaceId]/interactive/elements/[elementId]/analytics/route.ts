/**
 * Interactive Element Analytics API
 * Phase 4.1: Interactive Elements System
 *
 * Analytics endpoint for interactive elements
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createResponseService } from '@/lib/interactive';

interface RouteParams {
  params: Promise<{ workspaceId: string; elementId: string }>;
}

/**
 * GET /api/workspaces/[workspaceId]/interactive/elements/[elementId]/analytics
 * Get analytics for an interactive element
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { workspaceId, elementId } = await params;
    const supabase = await createClient();

    // Verify user has access to workspace
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: membership, error: memberError } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', workspaceId)
      .eq('user_id', user.id)
      .single();

    if (memberError || !membership) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const period = (searchParams.get('period') || 'all') as 'day' | 'week' | 'month' | 'all';

    const service = createResponseService(workspaceId);
    const result = await service.getElementAnalytics(elementId, period);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ data: result.data });
  } catch (error) {
    console.error('Error fetching element analytics:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
