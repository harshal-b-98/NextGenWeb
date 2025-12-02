/**
 * Documents API Route
 * GET /api/documents - List documents for a workspace
 * DELETE /api/documents - Delete a document
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/documents?workspaceId=xxx
 * List all documents for a workspace
 */
export async function GET(request: NextRequest) {
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

    // Get workspace ID from query
    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspaceId');

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

    // Fetch documents
    const { data: documents, error: fetchError } = await supabase
      .from('documents')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false });

    if (fetchError) {
      console.error('Fetch documents error:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch documents' },
        { status: 500 }
      );
    }

    // Get document IDs for knowledge base lookup
    const documentIds = documents?.map(d => d.id) || [];

    // Fetch knowledge base status for each document
    let knowledgeStatusMap: Record<string, { hasKnowledge: boolean; itemCount: number; embeddingCount: number }> = {};

    if (documentIds.length > 0) {
      // Get knowledge base items linked to these documents
      const { data: kbItems, error: kbError } = await supabase
        .from('knowledge_base_items')
        .select('id, document_id')
        .in('document_id', documentIds);

      if (!kbError && kbItems) {
        // Count items per document
        const itemCountByDoc: Record<string, string[]> = {};
        for (const item of kbItems) {
          if (item.document_id) {
            if (!itemCountByDoc[item.document_id]) {
              itemCountByDoc[item.document_id] = [];
            }
            itemCountByDoc[item.document_id].push(item.id);
          }
        }

        // Get embedding counts for these knowledge items
        const allKbItemIds = kbItems.map(k => k.id);
        let embeddingCountByKbItem: Record<string, number> = {};

        if (allKbItemIds.length > 0) {
          const { data: embeddings, error: embError } = await supabase
            .from('knowledge_embeddings')
            .select('knowledge_item_id')
            .in('knowledge_item_id', allKbItemIds);

          if (!embError && embeddings) {
            for (const emb of embeddings) {
              embeddingCountByKbItem[emb.knowledge_item_id] =
                (embeddingCountByKbItem[emb.knowledge_item_id] || 0) + 1;
            }
          }
        }

        // Build status map
        for (const docId of documentIds) {
          const kbItemIds = itemCountByDoc[docId] || [];
          const embeddingCount = kbItemIds.reduce(
            (sum, kbId) => sum + (embeddingCountByKbItem[kbId] || 0),
            0
          );
          knowledgeStatusMap[docId] = {
            hasKnowledge: kbItemIds.length > 0,
            itemCount: kbItemIds.length,
            embeddingCount,
          };
        }
      }
    }

    // Enrich documents with knowledge status
    const enrichedDocuments = documents?.map(doc => ({
      ...doc,
      knowledgeStatus: knowledgeStatusMap[doc.id] || {
        hasKnowledge: false,
        itemCount: 0,
        embeddingCount: 0,
      },
    })) || [];

    return NextResponse.json({
      documents: enrichedDocuments,
      total: enrichedDocuments.length,
    });

  } catch (error) {
    console.error('Documents GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/documents?id=xxx
 * Delete a document
 */
export async function DELETE(request: NextRequest) {
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

    // Get document ID from query
    const { searchParams } = new URL(request.url);
    const documentId = searchParams.get('id');

    if (!documentId) {
      return NextResponse.json(
        { error: 'Document ID is required' },
        { status: 400 }
      );
    }

    // Fetch document to get workspace_id and file_path
    const { data: document, error: fetchError } = await supabase
      .from('documents')
      .select('workspace_id, file_path')
      .eq('id', documentId)
      .single();

    if (fetchError || !document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    // Check workspace membership with admin/owner role
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

    if (!['owner', 'admin'].includes(membership.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions to delete documents' },
        { status: 403 }
      );
    }

    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from('documents')
      .remove([document.file_path]);

    if (storageError) {
      console.error('Storage delete error:', storageError);
      // Continue to delete database record even if storage delete fails
    }

    // Delete from database
    const { error: deleteError } = await supabase
      .from('documents')
      .delete()
      .eq('id', documentId);

    if (deleteError) {
      console.error('Database delete error:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete document' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Document deleted successfully',
    });

  } catch (error) {
    console.error('Documents DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
