/**
 * Embedding Pipeline
 *
 * End-to-end pipeline for processing documents into embeddings.
 */

import { chunkText, getRecommendedConfig } from '../chunking';
import type { TextChunk, ChunkingConfig } from '../types';
import type { Json } from '@/types/database';
import {
  generateEmbedding,
  generateBatchEmbeddings,
  getModelConfig,
} from './client';
import { getEmbeddingCache } from './cache';
import {
  storeEmbeddingsBatch,
  createKnowledgeBaseItem,
  deleteEmbeddingsForItem,
  similaritySearch,
  updateEmbeddingStatus,
} from './store';
import type {
  EmbeddingModel,
  EmbeddingInput,
  SimilaritySearchOptions,
  SimilaritySearchResult,
} from './types';

/**
 * Pipeline configuration options
 */
export interface PipelineOptions {
  /** Workspace ID */
  workspaceId: string;
  /** Document ID (optional) */
  documentId?: string;
  /** Entity type for the knowledge base item */
  entityType?: string;
  /** Embedding model to use */
  model?: EmbeddingModel;
  /** Chunking configuration */
  chunkingConfig?: Partial<ChunkingConfig>;
  /** Use caching for embeddings */
  useCache?: boolean;
  /** Batch size for embedding generation */
  batchSize?: number;
  /** Metadata to attach */
  metadata?: Json;
}

/**
 * Pipeline result
 */
export interface PipelineResult {
  /** Knowledge base item ID */
  knowledgeItemId: string;
  /** Number of chunks created */
  chunkCount: number;
  /** Number of embeddings stored */
  embeddingCount: number;
  /** Total tokens used */
  totalTokens: number;
  /** Estimated cost */
  estimatedCost: number;
  /** Processing time in ms */
  processingTime: number;
  /** Cache hits (if caching enabled) */
  cacheHits: number;
}

/**
 * Process a document into embeddings
 *
 * This is the main entry point for the embedding pipeline.
 * It takes raw document content and:
 * 1. Chunks the content into smaller pieces
 * 2. Generates embeddings for each chunk
 * 3. Stores the embeddings in the database
 */
export async function processDocument(
  content: string,
  documentName: string,
  options: PipelineOptions
): Promise<PipelineResult> {
  const startTime = Date.now();
  const {
    workspaceId,
    documentId,
    entityType = 'document',
    model = 'text-embedding-3-small',
    chunkingConfig,
    useCache = true,
    batchSize = 50,
    metadata = {},
  } = options;

  const cache = useCache ? getEmbeddingCache() : null;
  let cacheHits = 0;
  let totalTokens = 0;

  // Step 1: Create knowledge base item
  // Ensure metadata is an object before spreading
  const metadataObj = (typeof metadata === 'object' && metadata !== null && !Array.isArray(metadata))
    ? metadata as Record<string, Json | undefined>
    : {};
  const knowledgeItem = await createKnowledgeBaseItem(
    workspaceId,
    entityType,
    content,
    documentId,
    {
      ...metadataObj,
      documentName,
      processedAt: new Date().toISOString(),
    }
  );

  // Mark as generating embeddings
  await updateEmbeddingStatus(knowledgeItem.id, 'generating');

  try {
    // Step 2: Chunk the content
    const recommendedConfig = getRecommendedConfig(content);
    const finalConfig = { ...recommendedConfig, ...chunkingConfig };

    const chunkResult = chunkText({
      documentId: documentId || knowledgeItem.id,
      documentName,
      content,
      config: finalConfig,
    });

    const chunks = chunkResult.chunks;

    if (chunks.length === 0) {
      // No content to embed - mark as completed with 0 embeddings
      await updateEmbeddingStatus(knowledgeItem.id, 'completed', { embeddingsCount: 0 });
      return {
        knowledgeItemId: knowledgeItem.id,
        chunkCount: 0,
        embeddingCount: 0,
        totalTokens: 0,
        estimatedCost: 0,
        processingTime: Date.now() - startTime,
        cacheHits: 0,
      };
    }

    // Step 3: Generate embeddings
    const embeddingsToStore: Array<{
      knowledgeItemId: string;
      chunkIndex: number;
      chunkText: string;
      embedding: number[];
    }> = [];

    const chunksNeedingEmbeddings: Array<{
      chunk: TextChunk;
      index: number;
    }> = [];

    // Check cache first
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const cachedEmbedding = cache?.get(chunk.content, model);

      if (cachedEmbedding) {
        cacheHits++;
        embeddingsToStore.push({
          knowledgeItemId: knowledgeItem.id,
          chunkIndex: i,
          chunkText: chunk.content,
          embedding: cachedEmbedding,
        });
      } else {
        chunksNeedingEmbeddings.push({ chunk, index: i });
      }
    }

    // Generate embeddings for uncached chunks in batches
    const modelConfig = getModelConfig(model);

    for (let i = 0; i < chunksNeedingEmbeddings.length; i += batchSize) {
      const batch = chunksNeedingEmbeddings.slice(i, i + batchSize);

      const inputs: EmbeddingInput[] = batch.map(({ chunk, index }) => ({
        id: `${index}`,
        text: chunk.content,
      }));

      const batchResult = await generateBatchEmbeddings(inputs, { model });

      totalTokens += batchResult.totalTokens;

      // Process results
      for (const result of batchResult.results) {
        const originalIndex = parseInt(result.id, 10);
        const { chunk } = batch.find(b => b.index === originalIndex)!;

        // Cache the embedding
        cache?.set(chunk.content, model, result.embedding);

        embeddingsToStore.push({
          knowledgeItemId: knowledgeItem.id,
          chunkIndex: originalIndex,
          chunkText: chunk.content,
          embedding: result.embedding,
        });
      }

      // Handle errors
      for (const error of batchResult.errors) {
        console.error(`Failed to generate embedding for chunk ${error.id}: ${error.error}`);
      }
    }

    // Step 4: Store embeddings in database
    if (embeddingsToStore.length > 0) {
      await storeEmbeddingsBatch(embeddingsToStore);
    }

    // Mark as completed with embedding count
    await updateEmbeddingStatus(knowledgeItem.id, 'completed', {
      embeddingsCount: embeddingsToStore.length,
    });

    const estimatedCost = (totalTokens / 1000) * modelConfig.costPer1kTokens;
    const processingTime = Date.now() - startTime;

    return {
      knowledgeItemId: knowledgeItem.id,
      chunkCount: chunks.length,
      embeddingCount: embeddingsToStore.length,
      totalTokens,
      estimatedCost,
      processingTime,
      cacheHits,
    };
  } catch (error) {
    // Mark as failed if embedding generation fails
    const errorMessage = error instanceof Error ? error.message : 'Unknown error during embedding generation';
    await updateEmbeddingStatus(knowledgeItem.id, 'failed', { error: errorMessage });
    throw error;
  }
}

/**
 * Reprocess a knowledge base item with new settings
 */
export async function reprocessKnowledgeItem(
  knowledgeItemId: string,
  content: string,
  options: Omit<PipelineOptions, 'workspaceId'>
): Promise<PipelineResult> {
  const startTime = Date.now();

  // Mark as generating
  await updateEmbeddingStatus(knowledgeItemId, 'generating');

  try {
    // Delete existing embeddings
    await deleteEmbeddingsForItem(knowledgeItemId);

    // Regenerate embeddings
    const {
      documentId,
      model = 'text-embedding-3-small',
      chunkingConfig,
      useCache = true,
      batchSize = 50,
    } = options;

    const cache = useCache ? getEmbeddingCache() : null;
    let cacheHits = 0;
    let totalTokens = 0;

    // Chunk the content
    const recommendedConfig = getRecommendedConfig(content);
    const finalConfig = { ...recommendedConfig, ...chunkingConfig };

    const chunkResult = chunkText({
      documentId: documentId || knowledgeItemId,
      documentName: 'reprocessed',
      content,
      config: finalConfig,
    });

    const chunks = chunkResult.chunks;

    if (chunks.length === 0) {
      await updateEmbeddingStatus(knowledgeItemId, 'completed', { embeddingsCount: 0 });
      return {
        knowledgeItemId,
        chunkCount: 0,
        embeddingCount: 0,
        totalTokens: 0,
        estimatedCost: 0,
        processingTime: Date.now() - startTime,
        cacheHits: 0,
      };
    }

    // Generate and store embeddings (similar to processDocument)
    const embeddingsToStore: Array<{
      knowledgeItemId: string;
      chunkIndex: number;
      chunkText: string;
      embedding: number[];
    }> = [];

    const chunksNeedingEmbeddings: Array<{
      chunk: TextChunk;
      index: number;
    }> = [];

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const cachedEmbedding = cache?.get(chunk.content, model);

      if (cachedEmbedding) {
        cacheHits++;
        embeddingsToStore.push({
          knowledgeItemId,
          chunkIndex: i,
          chunkText: chunk.content,
          embedding: cachedEmbedding,
        });
      } else {
        chunksNeedingEmbeddings.push({ chunk, index: i });
      }
    }

    const modelConfig = getModelConfig(model);

    for (let i = 0; i < chunksNeedingEmbeddings.length; i += batchSize) {
      const batch = chunksNeedingEmbeddings.slice(i, i + batchSize);

      const inputs: EmbeddingInput[] = batch.map(({ chunk, index }) => ({
        id: `${index}`,
        text: chunk.content,
      }));

      const batchResult = await generateBatchEmbeddings(inputs, { model });
      totalTokens += batchResult.totalTokens;

      for (const result of batchResult.results) {
        const originalIndex = parseInt(result.id, 10);
        const { chunk } = batch.find(b => b.index === originalIndex)!;

        cache?.set(chunk.content, model, result.embedding);

        embeddingsToStore.push({
          knowledgeItemId,
          chunkIndex: originalIndex,
          chunkText: chunk.content,
          embedding: result.embedding,
        });
      }
    }

    if (embeddingsToStore.length > 0) {
      await storeEmbeddingsBatch(embeddingsToStore);
    }

    // Mark as completed with embedding count
    await updateEmbeddingStatus(knowledgeItemId, 'completed', {
      embeddingsCount: embeddingsToStore.length,
    });

    const estimatedCost = (totalTokens / 1000) * modelConfig.costPer1kTokens;

    return {
      knowledgeItemId,
      chunkCount: chunks.length,
      embeddingCount: embeddingsToStore.length,
      totalTokens,
      estimatedCost,
      processingTime: Date.now() - startTime,
      cacheHits,
    };
  } catch (error) {
    // Mark as failed if embedding generation fails
    const errorMessage = error instanceof Error ? error.message : 'Unknown error during embedding regeneration';
    await updateEmbeddingStatus(knowledgeItemId, 'failed', { error: errorMessage });
    throw error;
  }
}

/**
 * Search for similar content in the knowledge base
 */
export async function searchKnowledgeBase(
  options: SimilaritySearchOptions
): Promise<SimilaritySearchResult[]> {
  const { query } = options;

  // Generate embedding for the query
  const queryResult = await generateEmbedding(query);

  // Perform similarity search
  return similaritySearch(options, queryResult.embedding);
}

/**
 * Get the embedding for a query text
 */
export async function getQueryEmbedding(
  query: string,
  model: EmbeddingModel = 'text-embedding-3-small'
): Promise<number[]> {
  const cache = getEmbeddingCache();

  // Check cache first
  const cached = cache.get(query, model);
  if (cached) {
    return cached;
  }

  // Generate embedding
  const result = await generateEmbedding(query, { model });

  // Cache it
  cache.set(query, model, result.embedding);

  return result.embedding;
}
