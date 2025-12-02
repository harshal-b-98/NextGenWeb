/**
 * Embedding Types
 *
 * Type definitions for the embedding generation system.
 */

import type { Json } from '@/types/database';

/**
 * Supported embedding models
 */
export type EmbeddingModel =
  | 'text-embedding-3-small'
  | 'text-embedding-3-large'
  | 'text-embedding-ada-002';

/**
 * Embedding model configuration
 */
export interface EmbeddingModelConfig {
  model: EmbeddingModel;
  dimensions: number;
  maxTokens: number;
  costPer1kTokens: number;
}

/**
 * Available embedding model configurations
 */
export const EMBEDDING_MODELS: Record<EmbeddingModel, EmbeddingModelConfig> = {
  'text-embedding-3-small': {
    model: 'text-embedding-3-small',
    dimensions: 1536,
    maxTokens: 8191,
    costPer1kTokens: 0.00002,
  },
  'text-embedding-3-large': {
    model: 'text-embedding-3-large',
    dimensions: 3072,
    maxTokens: 8191,
    costPer1kTokens: 0.00013,
  },
  'text-embedding-ada-002': {
    model: 'text-embedding-ada-002',
    dimensions: 1536,
    maxTokens: 8191,
    costPer1kTokens: 0.0001,
  },
};

/**
 * Input for generating embeddings
 */
export interface EmbeddingInput {
  /** Unique identifier for the text */
  id: string;
  /** Text content to embed */
  text: string;
  /** Optional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Result of embedding generation
 */
export interface EmbeddingResult {
  /** Input identifier */
  id: string;
  /** Generated embedding vector */
  embedding: number[];
  /** Token count used */
  tokenCount: number;
  /** Model used */
  model: EmbeddingModel;
}

/**
 * Batch embedding result
 */
export interface BatchEmbeddingResult {
  /** Successfully generated embeddings */
  results: EmbeddingResult[];
  /** Failed inputs with error messages */
  errors: Array<{
    id: string;
    error: string;
  }>;
  /** Total tokens used */
  totalTokens: number;
  /** Processing time in ms */
  processingTime: number;
  /** Estimated cost in USD */
  estimatedCost: number;
}

/**
 * Embedding cache entry
 */
export interface EmbeddingCacheEntry {
  /** Text hash used as key */
  textHash: string;
  /** Cached embedding */
  embedding: number[];
  /** Model used */
  model: EmbeddingModel;
  /** When the cache entry was created */
  createdAt: Date;
  /** When the cache entry expires */
  expiresAt: Date;
}

/**
 * Similarity search options
 */
export interface SimilaritySearchOptions {
  /** Workspace ID to search within */
  workspaceId: string;
  /** Query text */
  query: string;
  /** Maximum number of results */
  limit?: number;
  /** Minimum similarity threshold (0-1) */
  threshold?: number;
  /** Optional document ID filter */
  documentId?: string;
  /** Optional entity type filter */
  entityType?: string;
}

/**
 * Similarity search result
 */
export interface SimilaritySearchResult {
  /** Embedding ID */
  id: string;
  /** Knowledge item ID */
  knowledgeItemId: string;
  /** Chunk text content */
  content: string;
  /** Similarity score (0-1) */
  similarity: number;
  /** Chunk index in the document */
  chunkIndex: number;
  /** Source document ID */
  documentId?: string;
  /** Entity type */
  entityType?: string;
  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Knowledge embedding database record
 */
export interface KnowledgeEmbeddingRecord {
  id: string;
  knowledge_item_id: string;
  embedding: number[];
  chunk_index: number;
  chunk_text: string;
  created_at: string;
}

/**
 * Knowledge base item database record
 */
export interface KnowledgeBaseItemRecord {
  id: string;
  workspace_id: string;
  document_id: string | null;
  entity_type: string;
  content: string;
  metadata: Json;
  created_at: string;
  updated_at: string;
}
