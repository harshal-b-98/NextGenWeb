/**
 * Regenerate Embeddings API Route
 * POST /api/knowledge/regenerate-embeddings - Regenerate embeddings for existing knowledge items
 *
 * This API processes existing knowledge base items that are missing embeddings
 * and generates new embeddings for them.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { reprocessKnowledgeItem } from '@/lib/knowledge/embeddings/pipeline';
import { triggerLayoutGeneration } from '@/lib/knowledge/auto-layout-generator';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes max for processing

/**
 * POST /api/knowledge/regenerate-embeddings
 * Body: { workspaceId: string }
 * Regenerate embeddings for all knowledge items in a workspace
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

    // Get workspace ID from body
    const body = await request.json();
    const { workspaceId } = body;

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

    if (!['owner', 'admin'].includes(membership.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions - must be owner or admin' },
        { status: 403 }
      );
    }

    // Get all knowledge base items for this workspace
    const { data: knowledgeItems, error: itemsError } = await supabase
      .from('knowledge_base_items')
      .select('id, document_id, content, metadata')
      .eq('workspace_id', workspaceId);

    if (itemsError) {
      console.error('Failed to fetch knowledge items:', itemsError);
      return NextResponse.json(
        { error: 'Failed to fetch knowledge items' },
        { status: 500 }
      );
    }

    if (!knowledgeItems || knowledgeItems.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No knowledge items found',
        processed: 0,
        totalEmbeddings: 0,
      });
    }

    console.log(`[Regenerate Embeddings] Processing ${knowledgeItems.length} knowledge items...`);

    let totalEmbeddings = 0;
    const errors: string[] = [];
    const processed: string[] = [];

    // Process each knowledge item
    for (const item of knowledgeItems) {
      try {
        // Delete existing embeddings for this item
        const { error: deleteError } = await supabase
          .from('knowledge_embeddings')
          .delete()
          .eq('knowledge_item_id', item.id);

        if (deleteError) {
          console.warn(`Failed to delete existing embeddings for ${item.id}:`, deleteError);
        }

        // Get document info for metadata
        let documentName = 'Unknown';
        let fileType = 'unknown';

        if (item.document_id) {
          const { data: doc } = await supabase
            .from('documents')
            .select('name, file_type')
            .eq('id', item.document_id)
            .single();

          if (doc) {
            documentName = doc.name;
            fileType = doc.file_type;
          }
        }

        // Generate new embeddings
        const result = await reprocessKnowledgeItem(
          item.id,
          item.content,
          {
            documentId: item.document_id || undefined,
            metadata: {
              documentName,
              fileType,
              ...(item.metadata as Record<string, unknown> || {}),
            },
          }
        );

        totalEmbeddings += result.embeddingCount;
        processed.push(item.id);
        console.log(`[Regenerate Embeddings] Generated ${result.embeddingCount} embeddings for item ${item.id}`);
      } catch (itemError) {
        const errorMsg = `Failed to process item ${item.id}: ${itemError instanceof Error ? itemError.message : 'Unknown error'}`;
        console.error(`[Regenerate Embeddings] ${errorMsg}`);
        errors.push(errorMsg);
      }
    }

    console.log(`[Regenerate Embeddings] Completed. Processed ${processed.length} items, generated ${totalEmbeddings} embeddings, ${errors.length} errors`);

    // Trigger layout generation after embeddings are regenerated
    // This runs asynchronously and doesn't block the response
    triggerLayoutGeneration(workspaceId).catch(err => {
      console.error('[Regenerate Embeddings] Layout generation failed:', err);
    });

    return NextResponse.json({
      success: true,
      message: `Processed ${processed.length} knowledge items`,
      processed: processed.length,
      totalEmbeddings,
      errors: errors.length > 0 ? errors : undefined,
      layoutGenerationTriggered: true,
    });

  } catch (error) {
    console.error('Regenerate embeddings route error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
