/**
 * Embedding Stats API Route
 * GET /api/knowledge/embedding-stats - Get embedding generation stats for a workspace
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/knowledge/embedding-stats?workspaceId=xxx
 * Get embedding stats for a workspace
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

    // Get workspace ID from query params
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

    // Get embedding stats from knowledge_base_items
    const { data: items, error: itemsError } = await supabase
      .from('knowledge_base_items')
      .select('id, embedding_status, embeddings_count, embedding_error')
      .eq('workspace_id', workspaceId);

    if (itemsError) {
      console.error('Failed to fetch embedding stats:', itemsError);
      return NextResponse.json(
        { error: 'Failed to fetch embedding stats' },
        { status: 500 }
      );
    }

    // Calculate stats
    const stats = {
      totalItems: items?.length || 0,
      pendingCount: 0,
      generatingCount: 0,
      completedCount: 0,
      failedCount: 0,
      totalEmbeddings: 0,
      itemsWithErrors: [] as Array<{ id: string; error: string }>,
    };

    for (const item of items || []) {
      // Handle items without embedding_status (old records default to 'pending')
      const status = item.embedding_status || 'pending';

      if (status === 'pending') stats.pendingCount++;
      else if (status === 'generating') stats.generatingCount++;
      else if (status === 'completed') stats.completedCount++;
      else if (status === 'failed') {
        stats.failedCount++;
        if (item.embedding_error) {
          stats.itemsWithErrors.push({
            id: item.id,
            error: item.embedding_error,
          });
        }
      }

      stats.totalEmbeddings += item.embeddings_count || 0;
    }

    return NextResponse.json({
      success: true,
      stats,
    });

  } catch (error) {
    console.error('Embedding stats route error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
