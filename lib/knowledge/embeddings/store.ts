/**
 * Embedding Store
 *
 * Handles storing and retrieving embeddings from the database.
 */

import { createClient } from '@/lib/supabase/server';
import type { Json } from '@/types/database';
import type {
  SimilaritySearchOptions,
  SimilaritySearchResult,
  KnowledgeEmbeddingRecord,
  KnowledgeBaseItemRecord,
} from './types';

/**
 * Store embedding in the database
 */
export async function storeEmbedding(
  knowledgeItemId: string,
  chunkIndex: number,
  chunkText: string,
  embedding: number[]
): Promise<string> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('knowledge_embeddings')
    .insert({
      knowledge_item_id: knowledgeItemId,
      chunk_index: chunkIndex,
      chunk_text: chunkText,
      embedding,
    })
    .select('id')
    .single();

  if (error) {
    throw new Error(`Failed to store embedding: ${error.message}`);
  }

  return data.id;
}

/**
 * Store multiple embeddings in batch
 */
export async function storeEmbeddingsBatch(
  embeddings: Array<{
    knowledgeItemId: string;
    chunkIndex: number;
    chunkText: string;
    embedding: number[];
  }>
): Promise<string[]> {
  const supabase = await createClient();

  const records = embeddings.map(e => ({
    knowledge_item_id: e.knowledgeItemId,
    chunk_index: e.chunkIndex,
    chunk_text: e.chunkText,
    embedding: e.embedding,
  }));

  const { data, error } = await supabase
    .from('knowledge_embeddings')
    .insert(records)
    .select('id');

  if (error) {
    throw new Error(`Failed to store embeddings batch: ${error.message}`);
  }

  return data.map(d => d.id);
}

/**
 * Get embeddings for a knowledge item
 */
export async function getEmbeddingsForItem(
  knowledgeItemId: string
): Promise<KnowledgeEmbeddingRecord[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('knowledge_embeddings')
    .select('*')
    .eq('knowledge_item_id', knowledgeItemId)
    .order('chunk_index', { ascending: true });

  if (error) {
    throw new Error(`Failed to get embeddings: ${error.message}`);
  }

  return data || [];
}

/**
 * Delete embeddings for a knowledge item
 */
export async function deleteEmbeddingsForItem(knowledgeItemId: string): Promise<number> {
  const supabase = await createClient();

  const { error, count } = await supabase
    .from('knowledge_embeddings')
    .delete()
    .eq('knowledge_item_id', knowledgeItemId);

  if (error) {
    throw new Error(`Failed to delete embeddings: ${error.message}`);
  }

  return count || 0;
}

/**
 * Perform similarity search using the database function
 */
export async function similaritySearch(
  options: SimilaritySearchOptions,
  queryEmbedding: number[]
): Promise<SimilaritySearchResult[]> {
  const supabase = await createClient();
  const { workspaceId, limit = 10, threshold = 0.7, documentId, entityType, query } = options;

  console.log('[KB Search] Starting similarity search:', {
    workspaceId,
    query: query?.slice(0, 100),
    limit,
    threshold,
    embeddingLength: queryEmbedding.length,
  });

  // Call the match_embeddings database function
  // Note: The deployed DB function uses 'workspace_id' as the parameter name
  const { data, error } = await supabase.rpc('match_embeddings', {
    query_embedding: queryEmbedding,
    match_threshold: threshold,
    match_count: limit * 2, // Get more than needed for filtering
    workspace_id: workspaceId,
  });

  if (error) {
    console.error('[KB Search] Similarity search failed:', error);
    throw new Error(`Similarity search failed: ${error.message}`);
  }

  // Get knowledge item details for the results
  const embeddingIds = (data || []).map((d: { id: string }) => d.id);

  console.log('[KB Search] Raw results from DB:', {
    matchCount: embeddingIds.length,
    topMatches: (data || []).slice(0, 3).map((d: { id: string; similarity: number; content?: string }) => ({
      id: d.id,
      similarity: d.similarity,
      contentPreview: d.content?.slice(0, 80),
    })),
  });

  if (embeddingIds.length === 0) {
    console.log('[KB Search] No embeddings found above threshold', threshold);
    return [];
  }

  // Fetch full embedding details with knowledge item info
  const { data: embeddings, error: embeddingsError } = await supabase
    .from('knowledge_embeddings')
    .select(`
      id,
      knowledge_item_id,
      chunk_index,
      chunk_text,
      knowledge_base_items (
        id,
        document_id,
        entity_type,
        metadata
      )
    `)
    .in('id', embeddingIds);

  if (embeddingsError) {
    throw new Error(`Failed to fetch embedding details: ${embeddingsError.message}`);
  }

  // Build results with similarity scores
  const similarityMap = new Map(
    (data || []).map((d: { id: string; similarity: number }) => [d.id, d.similarity])
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let results: SimilaritySearchResult[] = (embeddings || []).map((e: any) => ({
    id: e.id,
    knowledgeItemId: e.knowledge_item_id,
    content: e.chunk_text,
    similarity: similarityMap.get(e.id) || 0,
    chunkIndex: e.chunk_index,
    documentId: e.knowledge_base_items?.document_id || undefined,
    entityType: e.knowledge_base_items?.entity_type,
    metadata: e.knowledge_base_items?.metadata as Record<string, unknown> | undefined,
  }));

  // Apply additional filters
  if (documentId) {
    results = results.filter(r => r.documentId === documentId);
  }

  if (entityType) {
    results = results.filter(r => r.entityType === entityType);
  }

  // Sort by similarity and limit
  return results
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, limit);
}

/**
 * Create a knowledge base item
 */
export async function createKnowledgeBaseItem(
  workspaceId: string,
  entityType: string,
  content: string,
  documentId?: string,
  metadata?: Json
): Promise<KnowledgeBaseItemRecord> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('knowledge_base_items')
    .insert({
      workspace_id: workspaceId,
      document_id: documentId || null,
      entity_type: entityType,
      content,
      metadata: metadata || {},
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create knowledge base item: ${error.message}`);
  }

  return data;
}

/**
 * Get knowledge base items for a workspace
 */
export async function getKnowledgeBaseItems(
  workspaceId: string,
  options?: {
    documentId?: string;
    entityType?: string;
    limit?: number;
    offset?: number;
  }
): Promise<KnowledgeBaseItemRecord[]> {
  const supabase = await createClient();
  const { documentId, entityType, limit = 100, offset = 0 } = options || {};

  let query = supabase
    .from('knowledge_base_items')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (documentId) {
    query = query.eq('document_id', documentId);
  }

  if (entityType) {
    query = query.eq('entity_type', entityType);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to get knowledge base items: ${error.message}`);
  }

  return data || [];
}

/**
 * Delete a knowledge base item and its embeddings
 */
export async function deleteKnowledgeBaseItem(itemId: string): Promise<void> {
  const supabase = await createClient();

  // Embeddings are deleted via CASCADE
  const { error } = await supabase
    .from('knowledge_base_items')
    .delete()
    .eq('id', itemId);

  if (error) {
    throw new Error(`Failed to delete knowledge base item: ${error.message}`);
  }
}

/**
 * Update embedding status for a knowledge base item
 */
export async function updateEmbeddingStatus(
  knowledgeItemId: string,
  status: 'pending' | 'generating' | 'completed' | 'failed',
  options?: {
    error?: string;
    embeddingsCount?: number;
  }
): Promise<void> {
  const supabase = await createClient();

  const updateData: Record<string, unknown> = {
    embedding_status: status,
  };

  if (status === 'completed') {
    updateData.embeddings_generated_at = new Date().toISOString();
    updateData.embedding_error = null;
    if (options?.embeddingsCount !== undefined) {
      updateData.embeddings_count = options.embeddingsCount;
    }
  } else if (status === 'failed' && options?.error) {
    updateData.embedding_error = options.error;
  } else if (status === 'generating') {
    updateData.embedding_error = null;
  }

  const { error } = await supabase
    .from('knowledge_base_items')
    .update(updateData)
    .eq('id', knowledgeItemId);

  if (error) {
    console.error(`Failed to update embedding status: ${error.message}`);
    // Don't throw - this is a non-critical update
  }
}

/**
 * Get embedding stats for a workspace
 */
export async function getWorkspaceEmbeddingStats(workspaceId: string): Promise<{
  totalItems: number;
  pendingCount: number;
  generatingCount: number;
  completedCount: number;
  failedCount: number;
  totalEmbeddings: number;
}> {
  const supabase = await createClient();

  // Get items by status
  const { data: items, error } = await supabase
    .from('knowledge_base_items')
    .select('id, embedding_status, embeddings_count')
    .eq('workspace_id', workspaceId);

  if (error) {
    throw new Error(`Failed to get embedding stats: ${error.message}`);
  }

  const stats = {
    totalItems: items?.length || 0,
    pendingCount: 0,
    generatingCount: 0,
    completedCount: 0,
    failedCount: 0,
    totalEmbeddings: 0,
  };

  for (const item of items || []) {
    // Count by status (handle old records without embedding_status)
    const status = item.embedding_status || 'pending';
    if (status === 'pending') stats.pendingCount++;
    else if (status === 'generating') stats.generatingCount++;
    else if (status === 'completed') stats.completedCount++;
    else if (status === 'failed') stats.failedCount++;

    stats.totalEmbeddings += item.embeddings_count || 0;
  }

  return stats;
}

/**
 * Get total embedding count for a workspace
 */
export async function getEmbeddingCount(workspaceId: string): Promise<number> {
  const supabase = await createClient();

  const { count, error } = await supabase
    .from('knowledge_embeddings')
    .select('id', { count: 'exact', head: true })
    .eq('knowledge_base_items.workspace_id', workspaceId);

  if (error) {
    // Fallback: count via knowledge items
    const { data, error: itemError } = await supabase
      .from('knowledge_base_items')
      .select('id')
      .eq('workspace_id', workspaceId);

    if (itemError) {
      throw new Error(`Failed to get embedding count: ${itemError.message}`);
    }

    const itemIds = (data || []).map(d => d.id);
    if (itemIds.length === 0) return 0;

    const { count: embCount, error: embError } = await supabase
      .from('knowledge_embeddings')
      .select('id', { count: 'exact', head: true })
      .in('knowledge_item_id', itemIds);

    if (embError) {
      throw new Error(`Failed to get embedding count: ${embError.message}`);
    }

    return embCount || 0;
  }

  return count || 0;
}
