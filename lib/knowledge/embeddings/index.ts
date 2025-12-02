/**
 * Embedding Module
 *
 * Exports for the embedding generation and storage system.
 */

// Types
export * from './types';

// Client
export {
  generateEmbedding,
  generateBatchEmbeddings,
  getModelConfig,
  cosineSimilarity,
  normalizeVector,
} from './client';

// Cache
export {
  EmbeddingCache,
  getEmbeddingCache,
  createEmbeddingCache,
} from './cache';

// Store
export {
  storeEmbedding,
  storeEmbeddingsBatch,
  getEmbeddingsForItem,
  deleteEmbeddingsForItem,
  similaritySearch,
  createKnowledgeBaseItem,
  getKnowledgeBaseItems,
  deleteKnowledgeBaseItem,
  getEmbeddingCount,
} from './store';

// Pipeline
export {
  processDocument,
  reprocessKnowledgeItem,
  searchKnowledgeBase,
  getQueryEmbedding,
} from './pipeline';
export type { PipelineOptions, PipelineResult } from './pipeline';
