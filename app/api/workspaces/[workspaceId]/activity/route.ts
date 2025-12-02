/**
 * Activity Feed API
 * Phase 4.1: Enterprise Scale - Activity Feed
 *
 * GET /api/workspaces/[workspaceId]/activity - Get activity events
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getActivityEvents } from '@/lib/activity';
import type { ActivityCategory } from '@/lib/activity';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  try {
    const { workspaceId } = await params;
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check workspace membership
    const { data: member } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', workspaceId)
      .eq('user_id', user.id)
      .single();

    if (!member) {
      return NextResponse.json(
        { error: 'Not a member of this workspace' },
        { status: 403 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const categoriesParam = searchParams.get('categories');
    const eventTypesParam = searchParams.get('eventTypes');
    const userId = searchParams.get('userId') || undefined;
    const startDate = searchParams.get('startDate') || undefined;
    const endDate = searchParams.get('endDate') || undefined;
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    // Build filter options
    const categories = categoriesParam
      ? (categoriesParam.split(',') as ActivityCategory[])
      : undefined;
    const eventTypes = eventTypesParam
      ? eventTypesParam.split(',')
      : undefined;

    // Get activity events
    const { events, total } = await getActivityEvents(workspaceId, {
      categories,
      eventTypes: eventTypes as never[],
      userId,
      startDate,
      endDate,
      limit: Math.min(limit, 100),
      offset,
    });

    return NextResponse.json({
      events,
      total,
      limit,
      offset,
      hasMore: offset + events.length < total,
    });
  } catch (error) {
    console.error('Activity feed error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch activity feed' },
      { status: 500 }
    );
  }
}
