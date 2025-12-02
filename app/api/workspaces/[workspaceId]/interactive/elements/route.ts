/**
 * Interactive Elements API
 * Phase 4.1: Interactive Elements System
 *
 * CRUD endpoints for interactive elements
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createElementService, AnyInteractiveConfig } from '@/lib/interactive';

interface RouteParams {
  params: Promise<{ workspaceId: string }>;
}

/**
 * GET /api/workspaces/[workspaceId]/interactive/elements
 * List interactive elements
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { workspaceId } = await params;
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
    const websiteId = searchParams.get('websiteId') || undefined;
    const pageId = searchParams.get('pageId') || undefined;
    const type = searchParams.get('type') as AnyInteractiveConfig['type'] | undefined;
    const status = searchParams.get('status') as 'draft' | 'published' | 'archived' | undefined;
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined;
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : undefined;

    const service = createElementService(workspaceId);
    const result = await service.listElements({
      websiteId,
      pageId,
      type,
      status,
      limit,
      offset,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ data: result.data });
  } catch (error) {
    console.error('Error listing interactive elements:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/workspaces/[workspaceId]/interactive/elements
 * Create a new interactive element
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { workspaceId } = await params;
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

    // Check for editor or higher role
    if (!['owner', 'admin', 'editor'].includes(membership.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await request.json();

    const service = createElementService(workspaceId);
    const result = await service.createElement(body);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ data: result.data }, { status: 201 });
  } catch (error) {
    console.error('Error creating interactive element:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
