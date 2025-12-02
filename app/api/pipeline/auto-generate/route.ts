/**
 * Auto-Generate Pipeline API
 * POST /api/pipeline/auto-generate
 *
 * Orchestrates the complete pipeline:
 * 1. Extract knowledge from completed documents
 * 2. Create or update website with generated pages
 *
 * This can be called after document upload completes or manually triggered.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { runAutoGeneratePipeline, buildResultMessage } from '@/lib/pipeline/auto-generate';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/pipeline/auto-generate
 * Body: { workspaceId: string, documentId?: string }
 *
 * If documentId provided, processes just that document.
 * Otherwise, processes all completed documents in workspace.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get parameters
    const body = await request.json();
    const { workspaceId, documentId } = body;

    if (!workspaceId) {
      return NextResponse.json(
        { error: 'Workspace ID is required' },
        { status: 400 }
      );
    }

    // Check workspace membership
    const { data: membership, error: membershipError } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', workspaceId)
      .eq('user_id', user.id)
      .single();

    if (membershipError || !membership) {
      return NextResponse.json(
        { error: 'Not a member of this workspace' },
        { status: 403 }
      );
    }

    if (!['owner', 'admin', 'editor'].includes(membership.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Run the pipeline
    const result = await runAutoGeneratePipeline({
      workspaceId,
      documentId,
    });

    return NextResponse.json({
      success: true,
      result,
      message: buildResultMessage(result),
    });

  } catch (error) {
    console.error('Auto-generate pipeline error:', error);
    return NextResponse.json(
      {
        error: 'Pipeline failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
