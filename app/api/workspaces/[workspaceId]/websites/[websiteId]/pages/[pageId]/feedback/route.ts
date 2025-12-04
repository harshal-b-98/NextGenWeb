/**
 * Feedback API
 * Epic #146: Iterative Website Feedback & Refinement System
 *
 * Story #151: API endpoints for submitting feedback and applying changes.
 *
 * NOTE: This uses untypedFrom for new tables that haven't been added to type definitions.
 * Once the migration is applied and types regenerated, switch to typed queries.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { untypedFrom } from '@/lib/supabase/untyped';
import {
  processFeedback,
  applyChanges,
  FeedbackInputSchema,
  ApplyChangesRequestSchema,
} from '@/lib/feedback';
import { z } from 'zod';

type RouteParams = {
  params: Promise<{
    workspaceId: string;
    websiteId: string;
    pageId: string;
  }>;
};

/**
 * GET /api/workspaces/[workspaceId]/websites/[websiteId]/pages/[pageId]/feedback
 * Get all feedback for a page
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

    // Get feedback with optional status filter using untyped query
    const url = new URL(request.url);
    const status = url.searchParams.get('status');

    const feedbackTable = await untypedFrom('section_feedback');
    let query = feedbackTable
      .select('*')
      .eq('page_id', pageId)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data: feedback, error } = await query;

    if (error) {
      console.error('Error fetching feedback:', error);
      return NextResponse.json(
        { error: 'Failed to fetch feedback' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      feedback,
    });
  } catch (error) {
    console.error('Error in feedback GET:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/workspaces/[workspaceId]/websites/[websiteId]/pages/[pageId]/feedback
 * Submit feedback and get proposed changes
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

    // Handle single or multiple feedback items
    const feedbackItems = Array.isArray(body.feedback)
      ? body.feedback
      : [{ ...body, pageId }];

    // Validate feedback items
    const FeedbackArraySchema = z.array(
      FeedbackInputSchema.omit({ pageId: true }).extend({
        pageId: z.string().uuid().optional(),
      })
    );

    const validation = FeedbackArraySchema.safeParse(feedbackItems);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error.issues },
        { status: 400 }
      );
    }

    // Process feedback
    const result = await processFeedback({
      pageId,
      feedbackItems: validation.data.map(item => ({
        ...item,
        pageId,
      })),
      workspaceId,
      userId: user.id,
    });

    return NextResponse.json({
      success: result.success,
      proposedChanges: result.proposedChanges,
      aiSummary: result.aiSummary,
      suggestedFollowUps: result.suggestedFollowUps,
      processingTimeMs: result.processingTimeMs,
      errors: result.errors,
    });
  } catch (error) {
    console.error('Error in feedback POST:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/workspaces/[workspaceId]/websites/[websiteId]/pages/[pageId]/feedback
 * Apply proposed changes
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
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

    // Parse and validate request body
    const body = await request.json();
    const validation = ApplyChangesRequestSchema.omit({ pageId: true }).safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error.issues },
        { status: 400 }
      );
    }

    // Apply changes
    const result = await applyChanges({
      pageId,
      ...validation.data,
      userId: user.id,
    });

    return NextResponse.json({
      success: result.success,
      revision: result.revision,
      appliedChanges: result.appliedChanges,
      failedChanges: result.failedChanges,
    });
  } catch (error) {
    console.error('Error in feedback PUT:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
