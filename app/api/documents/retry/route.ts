/**
 * Document Retry API Route
 * POST /api/documents/retry - Retry processing a failed document
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { parseDocument } from '@/lib/documents/parsers.server';
import { getFileType } from '@/lib/documents/parsers';
import type { SupportedFileType } from '@/lib/documents/parsers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/documents/retry
 * Body: { documentId: string }
 * Retry processing a failed document
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

    // Get document ID from body
    const body = await request.json();
    const { documentId } = body;

    if (!documentId) {
      return NextResponse.json(
        { error: 'Document ID is required' },
        { status: 400 }
      );
    }

    // Fetch document
    const { data: document, error: fetchError } = await supabase
      .from('documents')
      .select('*')
      .eq('id', documentId)
      .single();

    if (fetchError || !document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    // Check if document is failed
    if (document.status !== 'failed') {
      return NextResponse.json(
        { error: 'Only failed documents can be retried' },
        { status: 400 }
      );
    }

    // Check workspace membership
    const { data: membership, error: membershipError } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', document.workspace_id)
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
        { error: 'Insufficient permissions to retry documents' },
        { status: 403 }
      );
    }

    // Update status to processing
    await supabase
      .from('documents')
      .update({ status: 'processing' })
      .eq('id', documentId);

    // Download file from storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('documents')
      .download(document.file_path);

    if (downloadError || !fileData) {
      console.error('Storage download error:', downloadError);

      // Update status back to failed
      await supabase
        .from('documents')
        .update({
          status: 'failed',
          metadata: {
            ...((document.metadata as Record<string, unknown>) || {}),
            error: 'Failed to download file from storage',
            retryAttemptedAt: new Date().toISOString(),
          },
        })
        .eq('id', documentId);

      return NextResponse.json(
        { error: 'Failed to download file from storage' },
        { status: 500 }
      );
    }

    // Convert blob to buffer
    const buffer = Buffer.from(await fileData.arrayBuffer());

    // Get file type
    const fileType = getFileType(
      (document.metadata as Record<string, unknown>)?.mimeType as string || '',
      document.name
    );

    if (!fileType) {
      await supabase
        .from('documents')
        .update({
          status: 'failed',
          metadata: {
            ...((document.metadata as Record<string, unknown>) || {}),
            error: 'Unknown file type',
            retryAttemptedAt: new Date().toISOString(),
          },
        })
        .eq('id', documentId);

      return NextResponse.json(
        { error: 'Unknown file type' },
        { status: 400 }
      );
    }

    // Parse document
    try {
      const parsed = await parseDocument(buffer, fileType as SupportedFileType);

      // Update document with extracted text
      const existingMetadata = (document.metadata as Record<string, unknown>) || {};
      delete existingMetadata.error; // Remove previous error

      await supabase
        .from('documents')
        .update({
          extracted_text: parsed.text,
          status: 'completed',
          metadata: {
            ...existingMetadata,
            ...parsed.metadata,
            processedAt: new Date().toISOString(),
            retrySuccessAt: new Date().toISOString(),
          },
        })
        .eq('id', documentId);

      return NextResponse.json({
        success: true,
        document: {
          ...document,
          status: 'completed',
          extracted_text: parsed.text.substring(0, 500) + (parsed.text.length > 500 ? '...' : ''),
          metadata: {
            ...existingMetadata,
            ...parsed.metadata,
          },
        },
        message: 'Document processed successfully',
      });

    } catch (parseError) {
      console.error('Document parsing error:', parseError);

      // Update status to failed with error
      const existingMetadata = (document.metadata as Record<string, unknown>) || {};
      await supabase
        .from('documents')
        .update({
          status: 'failed',
          metadata: {
            ...existingMetadata,
            error: parseError instanceof Error ? parseError.message : 'Parsing failed',
            retryAttemptedAt: new Date().toISOString(),
          },
        })
        .eq('id', documentId);

      return NextResponse.json({
        success: false,
        error: 'Document parsing failed',
        message: parseError instanceof Error ? parseError.message : 'Unknown error',
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Retry route error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
