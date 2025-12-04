/**
 * Approval Workflow API
 * Epic #146: Iterative Website Feedback & Refinement System
 *
 * Story #151: API endpoints for approval workflow management.
 *
 * NOTE: This uses untypedFrom for new tables that haven't been added to type definitions.
 * Once the migration is applied and types regenerated, switch to typed queries.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { untypedFrom } from '@/lib/supabase/untyped';
import { z } from 'zod';
import type { ApprovalStatus } from '@/lib/feedback/types';

// Type interfaces for untyped tables
interface PageApproval {
  id: string;
  page_id: string;
  revision_id: string;
  status: ApprovalStatus;
  submitted_by?: string;
  submitted_at?: string;
  submission_notes?: string;
  reviewed_by?: string;
  reviewed_at?: string;
  review_notes?: string;
  approved_by?: string;
  approved_at?: string;
  approval_notes?: string;
  published_at?: string;
  published_by?: string;
  created_at: string;
}

type RouteParams = {
  params: Promise<{
    workspaceId: string;
    websiteId: string;
    pageId: string;
  }>;
};

// Approval action schemas
const SubmitForReviewSchema = z.object({
  action: z.literal('submit'),
  revisionId: z.string().uuid(),
  notes: z.string().optional(),
});

const ReviewSchema = z.object({
  action: z.literal('review'),
  approvalId: z.string().uuid(),
  decision: z.enum(['approve', 'request_changes']),
  notes: z.string().optional(),
});

const PublishSchema = z.object({
  action: z.literal('publish'),
  approvalId: z.string().uuid(),
  notes: z.string().optional(),
});

const ActionSchema = z.discriminatedUnion('action', [
  SubmitForReviewSchema,
  ReviewSchema,
  PublishSchema,
]);

/**
 * GET /api/workspaces/[workspaceId]/websites/[websiteId]/pages/[pageId]/approval
 * Get approval status and history for a page
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

    // Get current approval (if any) using untyped query
    const approvalsTable = await untypedFrom('page_approvals');
    const { data: currentApprovalRaw } = await approvalsTable
      .select('*')
      .eq('page_id', pageId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    const currentApproval = currentApprovalRaw as PageApproval | null;

    // Get approval history using untyped query
    const approvalsTableHistory = await untypedFrom('page_approvals');
    const { data: approvalHistoryRaw } = await approvalsTableHistory
      .select('*')
      .eq('page_id', pageId)
      .order('created_at', { ascending: false });
    const approvalHistory = (approvalHistoryRaw || []) as PageApproval[];

    // Determine what actions are available
    const canSubmit = !currentApproval || ['draft', 'changes_requested'].includes(currentApproval.status);
    const canApprove = currentApproval?.status === 'in_review' &&
      ['owner', 'admin'].includes(membership.role);
    const canPublish = currentApproval?.status === 'approved' &&
      ['owner', 'admin'].includes(membership.role);

    // Get page status from the latest approval or default to 'draft'
    const pageStatus = currentApproval?.status || 'draft';

    return NextResponse.json({
      success: true,
      pageStatus,
      currentApproval,
      approvalHistory,
      availableActions: {
        canSubmit,
        canApprove,
        canPublish,
      },
    });
  } catch (error) {
    console.error('Error in approval GET:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/workspaces/[workspaceId]/websites/[websiteId]/pages/[pageId]/approval
 * Perform approval workflow actions
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

    // Parse and validate request body
    const body = await request.json();
    const validation = ActionSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error.issues },
        { status: 400 }
      );
    }

    const action = validation.data;
    let result;

    switch (action.action) {
      case 'submit':
        result = await handleSubmitForReview(
          supabase,
          pageId,
          action.revisionId,
          user.id,
          action.notes
        );
        break;

      case 'review':
        if (!['owner', 'admin'].includes(membership.role)) {
          return NextResponse.json(
            { error: 'Only owners and admins can review' },
            { status: 403 }
          );
        }
        result = await handleReview(
          supabase,
          pageId,
          action.approvalId,
          action.decision,
          user.id,
          action.notes
        );
        break;

      case 'publish':
        if (!['owner', 'admin'].includes(membership.role)) {
          return NextResponse.json(
            { error: 'Only owners and admins can publish' },
            { status: 403 }
          );
        }
        result = await handlePublish(
          supabase,
          pageId,
          action.approvalId,
          user.id,
          action.notes
        );
        break;
    }

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('Error in approval POST:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper functions - use untypedFrom for new tables

async function handleSubmitForReview(
  _supabase: Awaited<ReturnType<typeof createClient>>,
  pageId: string,
  revisionId: string,
  userId: string,
  notes?: string
) {
  // Create approval record using untyped query
  const approvalsTable = await untypedFrom('page_approvals');
  const { data: approval, error } = await approvalsTable
    .insert({
      page_id: pageId,
      revision_id: revisionId,
      status: 'in_review' as ApprovalStatus,
      submitted_by: userId,
      submitted_at: new Date().toISOString(),
      submission_notes: notes,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to submit for review: ${error.message}`);
  }

  // Note: page status tracking is now done via the approval record
  // No need to update pages table since approval_status column may not exist yet

  return {
    approval,
    message: 'Page submitted for review',
  };
}

async function handleReview(
  _supabase: Awaited<ReturnType<typeof createClient>>,
  pageId: string,
  approvalId: string,
  decision: 'approve' | 'request_changes',
  userId: string,
  notes?: string
) {
  const newStatus: ApprovalStatus = decision === 'approve' ? 'approved' : 'changes_requested';

  // Update approval record using untyped query
  const approvalsTable = await untypedFrom('page_approvals');
  const { data: approval, error } = await approvalsTable
    .update({
      status: newStatus,
      reviewed_by: userId,
      reviewed_at: new Date().toISOString(),
      review_notes: notes,
      ...(decision === 'approve' && {
        approved_by: userId,
        approved_at: new Date().toISOString(),
        approval_notes: notes,
      }),
    })
    .eq('id', approvalId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update review: ${error.message}`);
  }

  // Note: page status tracking is now done via the approval record

  return {
    approval,
    message: decision === 'approve'
      ? 'Page approved and ready to publish'
      : 'Changes requested',
  };
}

async function handlePublish(
  _supabase: Awaited<ReturnType<typeof createClient>>,
  pageId: string,
  approvalId: string,
  userId: string,
  _notes?: string
) {
  // Update approval record using untyped query
  const approvalsTable = await untypedFrom('page_approvals');
  const { data: approval, error } = await approvalsTable
    .update({
      status: 'published' as ApprovalStatus,
      published_at: new Date().toISOString(),
      published_by: userId,
    })
    .eq('id', approvalId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to publish: ${error.message}`);
  }

  // Note: page status tracking is now done via the approval record

  return {
    approval,
    message: 'Page published successfully',
  };
}
