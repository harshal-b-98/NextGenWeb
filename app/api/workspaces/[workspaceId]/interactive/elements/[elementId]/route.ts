/**
 * Interactive Element Detail API
 * Phase 4.1: Interactive Elements System
 *
 * Endpoints for individual interactive element operations
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createElementService } from '@/lib/interactive';

interface RouteParams {
  params: Promise<{ workspaceId: string; elementId: string }>;
}

/**
 * GET /api/workspaces/[workspaceId]/interactive/elements/[elementId]
 * Get an interactive element by ID
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

    const service = createElementService(workspaceId);
    const result = await service.getElement(elementId);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 404 });
    }

    return NextResponse.json({ data: result.data });
  } catch (error) {
    console.error('Error fetching interactive element:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PATCH /api/workspaces/[workspaceId]/interactive/elements/[elementId]
 * Update an interactive element
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
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

    // Check for editor or higher role
    if (!['owner', 'admin', 'editor'].includes(membership.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await request.json();

    const service = createElementService(workspaceId);
    const result = await service.updateElement(elementId, body);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ data: result.data });
  } catch (error) {
    console.error('Error updating interactive element:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/workspaces/[workspaceId]/interactive/elements/[elementId]
 * Delete an interactive element
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
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

    // Check for editor or higher role
    if (!['owner', 'admin', 'editor'].includes(membership.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const service = createElementService(workspaceId);
    const result = await service.deleteElement(elementId);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting interactive element:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
