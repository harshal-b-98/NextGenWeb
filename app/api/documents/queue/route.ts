/**
 * Document Queue API Route
 * GET /api/documents/queue - Get queue status and jobs
 * POST /api/documents/queue - Queue a document for processing
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  enqueueDocument,
  getJobsByWorkspace,
  getQueueStats,
  retryJob,
  cancelJob,
} from '@/lib/documents/queue';
import { getFileType } from '@/lib/documents/parsers';
import type { SupportedFileType } from '@/lib/documents/parsers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET - Get queue status and jobs for a workspace
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspaceId');

    if (!workspaceId) {
      return NextResponse.json({ error: 'Workspace ID required' }, { status: 400 });
    }

    // Verify workspace membership
    const { error: membershipError } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', workspaceId)
      .eq('user_id', user.id)
      .single();

    if (membershipError) {
      return NextResponse.json({ error: 'Not a member of this workspace' }, { status: 403 });
    }

    const jobs = getJobsByWorkspace(workspaceId);
    const stats = getQueueStats();

    return NextResponse.json({
      jobs,
      stats,
    });

  } catch (error) {
    console.error('Queue GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST - Queue a document for processing or perform queue actions
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, documentId, jobId, workspaceId } = body;

    // Handle retry action
    if (action === 'retry' && jobId) {
      const success = retryJob(jobId);
      return NextResponse.json({ success });
    }

    // Handle cancel action
    if (action === 'cancel' && jobId) {
      const success = cancelJob(jobId);
      return NextResponse.json({ success });
    }

    // Queue a document for processing
    if (!documentId || !workspaceId) {
      return NextResponse.json(
        { error: 'Document ID and Workspace ID required' },
        { status: 400 }
      );
    }

    // Verify workspace membership with edit permissions
    const { data: membership, error: membershipError } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', workspaceId)
      .eq('user_id', user.id)
      .single();

    if (membershipError || !membership) {
      return NextResponse.json({ error: 'Not a member of this workspace' }, { status: 403 });
    }

    if (!['owner', 'admin', 'editor'].includes(membership.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Get document details
    const { data: document, error: docError } = await supabase
      .from('documents')
      .select('id, file_path, file_type, workspace_id')
      .eq('id', documentId)
      .eq('workspace_id', workspaceId)
      .single();

    if (docError || !document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Get file type
    const fileType = document.file_type as SupportedFileType;
    if (!fileType) {
      return NextResponse.json({ error: 'Invalid document file type' }, { status: 400 });
    }

    // Update document status to processing
    await supabase
      .from('documents')
      .update({ status: 'processing' })
      .eq('id', documentId);

    // Add to queue
    const job = enqueueDocument(
      documentId,
      workspaceId,
      document.file_path,
      fileType
    );

    return NextResponse.json({
      success: true,
      job: {
        id: job.id,
        documentId: job.documentId,
        status: job.status,
        progress: job.progress,
      },
    });

  } catch (error) {
    console.error('Queue POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
