/**
 * Revisions API
 * Epic #146: Iterative Website Feedback & Refinement System
 *
 * Story #151: API endpoints for revision management, rollback, and comparison.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  getRevisions,
  createRevision,
  compareRevisions,
  rollbackToRevision,
  getPageAtRevision,
  CreateRevisionRequestSchema,
  CompareRevisionsRequestSchema,
  RollbackRequestSchema,
} from '@/lib/feedback';

type RouteParams = {
  params: Promise<{
    workspaceId: string;
    websiteId: string;
    pageId: string;
  }>;
};

/**
 * GET /api/workspaces/[workspaceId]/websites/[websiteId]/pages/[pageId]/revisions
 * Get all revisions for a page
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { workspaceId, websiteId, pageId } = await params;
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

    // Verify page belongs to website in workspace
    const { data: page } = await supabase
      .from('pages')
      .select('id, website:websites!inner(id, workspace_id)')
      .eq('id', pageId)
      .eq('website_id', websiteId)
      .single();

    if (!page || (page.website as { workspace_id: string }).workspace_id !== workspaceId) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 });
    }

    // Check for compare or preview query params
    const url = new URL(request.url);
    const fromRevision = url.searchParams.get('from');
    const toRevision = url.searchParams.get('to');
    const previewRevision = url.searchParams.get('preview');

    // Handle revision preview
    if (previewRevision) {
      const snapshot = await getPageAtRevision(previewRevision);
      if (!snapshot) {
        return NextResponse.json({ error: 'Revision not found' }, { status: 404 });
      }
      return NextResponse.json({
        success: true,
        snapshot,
      });
    }

    // Handle revision comparison
    if (fromRevision && toRevision) {
      const diff = await compareRevisions({
        pageId,
        fromRevisionId: fromRevision,
        toRevisionId: toRevision,
      });
      return NextResponse.json({
        success: true,
        diff,
      });
    }

    // Get all revisions
    const revisions = await getRevisions(pageId);

    return NextResponse.json({
      success: true,
      revisions,
    });
  } catch (error) {
    console.error('Error in revisions GET:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/workspaces/[workspaceId]/websites/[websiteId]/pages/[pageId]/revisions
 * Create a manual revision or rollback
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { workspaceId, websiteId, pageId } = await params;
    const supabase = await createClient();

    // Verify authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check workspace membership with edit permissions
    const { data: membership } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', workspaceId)
      .eq('user_id', user.id)
      .single();

    if (!membership || !['owner', 'admin', 'editor'].includes(membership.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Verify page belongs to website in workspace
    const { data: page } = await supabase
      .from('pages')
      .select('id, website:websites!inner(id, workspace_id)')
      .eq('id', pageId)
      .eq('website_id', websiteId)
      .single();

    if (!page || (page.website as { workspace_id: string }).workspace_id !== workspaceId) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 });
    }

    // Parse request body
    const body = await request.json();

    // Check if this is a rollback request
    if (body.action === 'rollback' && body.targetRevisionId) {
      const validation = RollbackRequestSchema.omit({ pageId: true }).safeParse(body);
      if (!validation.success) {
        return NextResponse.json(
          { error: 'Invalid input', details: validation.error.issues },
          { status: 400 }
        );
      }

      const revision = await rollbackToRevision({
        pageId,
        targetRevisionId: validation.data.targetRevisionId,
        userId: user.id,
      });

      return NextResponse.json({
        success: true,
        revision,
        message: `Rolled back to revision ${revision.revisionNumber}`,
      });
    }

    // Create manual revision
    const validation = CreateRevisionRequestSchema.omit({ pageId: true }).safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error.issues },
        { status: 400 }
      );
    }

    const revision = await createRevision({
      pageId,
      ...validation.data,
      userId: user.id,
    });

    return NextResponse.json({
      success: true,
      revision,
    });
  } catch (error) {
    console.error('Error in revisions POST:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
