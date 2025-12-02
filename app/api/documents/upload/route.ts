/**
 * Document Upload API Route
 * POST /api/documents/upload
 *
 * Handles document uploads, stores in Supabase Storage,
 * and creates a document record in the database
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getFileType, isSupportedFileType, isImageFileType } from '@/lib/documents/parsers';
import { parseDocument } from '@/lib/documents/parsers.server';
import { generateFilePath } from '@/lib/documents/upload';
import { enqueueDocument } from '@/lib/documents/queue';
import { runAutoGeneratePipeline, buildResultMessage } from '@/lib/pipeline/auto-generate';
import type { SupportedFileType } from '@/lib/documents/parsers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Max file size: 50MB
const MAX_FILE_SIZE = 50 * 1024 * 1024;

// Threshold for using queue processing (5MB or images)
const QUEUE_THRESHOLD = 5 * 1024 * 1024;

/**
 * Trigger the auto-generate pipeline for a document
 * This extracts knowledge and generates website pages
 */
async function triggerAutoGenerate(workspaceId: string, documentId: string): Promise<void> {
  try {
    const result = await runAutoGeneratePipeline({
      workspaceId,
      documentId,
    });
    console.log('Auto-generate pipeline completed:', buildResultMessage(result));
    if (result.errors.length > 0) {
      console.warn('Pipeline warnings:', result.errors);
    }
  } catch (error) {
    console.error('Auto-generate pipeline error:', error);
  }
}

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

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const workspaceId = formData.get('workspaceId') as string | null;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    if (!workspaceId) {
      return NextResponse.json(
        { error: 'No workspace ID provided' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!isSupportedFileType(file.type, file.name)) {
      return NextResponse.json(
        { error: `Unsupported file type: ${file.type || file.name}` },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File size exceeds 50MB limit' },
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

    // Check if user has edit permissions
    if (!['owner', 'admin', 'editor'].includes(membership.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions to upload documents' },
        { status: 403 }
      );
    }

    // Generate file path and upload to storage
    const filePath = generateFilePath(workspaceId, file.name);
    const fileBuffer = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await supabase.storage
      .from('documents')
      .upload(filePath, fileBuffer, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      return NextResponse.json(
        { error: 'Failed to upload file to storage' },
        { status: 500 }
      );
    }

    // Get file type for parsing
    const fileType = getFileType(file.type, file.name);

    // Create document record with pending status
    const { data: document, error: insertError } = await supabase
      .from('documents')
      .insert({
        workspace_id: workspaceId,
        name: file.name,
        file_path: filePath,
        file_type: fileType || file.type,
        file_size: file.size,
        status: 'processing',
        uploaded_by: user.id,
        metadata: {
          originalName: file.name,
          mimeType: file.type,
          uploadedAt: new Date().toISOString(),
        },
      })
      .select()
      .single();

    if (insertError) {
      console.error('Database insert error:', insertError);
      // Try to clean up uploaded file
      await supabase.storage.from('documents').remove([filePath]);
      return NextResponse.json(
        { error: 'Failed to create document record' },
        { status: 500 }
      );
    }

    // Decide whether to process synchronously or via queue
    // Use queue for large files (>5MB) or images (OCR is slow)
    const shouldUseQueue = file.size > QUEUE_THRESHOLD || isImageFileType(fileType);

    if (shouldUseQueue && fileType) {
      // Queue for async processing
      const job = enqueueDocument(
        document.id,
        workspaceId,
        filePath,
        fileType as SupportedFileType
      );

      return NextResponse.json({
        success: true,
        document: {
          ...document,
          status: 'processing',
        },
        job: {
          id: job.id,
          status: job.status,
        },
        message: 'Document queued for processing',
      });
    }

    // Process synchronously for small files
    try {
      if (fileType) {
        const parsed = await parseDocument(fileBuffer, fileType as SupportedFileType);

        // Update document with extracted text
        const existingMetadata = (document.metadata as Record<string, unknown>) || {};
        await supabase
          .from('documents')
          .update({
            extracted_text: parsed.text,
            status: 'completed',
            metadata: {
              ...existingMetadata,
              ...parsed.metadata,
              processedAt: new Date().toISOString(),
            },
          })
          .eq('id', document.id);

        // Trigger auto-generation pipeline in background
        triggerAutoGenerate(workspaceId, document.id).catch(err => {
          console.error('Auto-generate pipeline error:', err);
        });

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
          pipelineTriggered: true,
        });
      }
    } catch (parseError) {
      console.error('Document parsing error:', parseError);
      // Update status to failed
      const existingMetadata = (document.metadata as Record<string, unknown>) || {};
      await supabase
        .from('documents')
        .update({
          status: 'failed',
          metadata: {
            ...existingMetadata,
            error: parseError instanceof Error ? parseError.message : 'Parsing failed',
          },
        })
        .eq('id', document.id);

      return NextResponse.json({
        success: true,
        document: {
          ...document,
          status: 'failed',
        },
        warning: 'Document uploaded but parsing failed',
      });
    }

    return NextResponse.json({
      success: true,
      document,
    });

  } catch (error) {
    console.error('Upload route error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
