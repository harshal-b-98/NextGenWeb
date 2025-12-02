/**
 * Knowledge Base Types
 *
 * Type definitions for the semantic knowledge base system.
 */

/**
 * Chunk metadata containing source and position information
 */
export interface ChunkMetadata {
  /** Source document ID */
  documentId: string;
  /** Source document name */
  documentName: string;
  /** Section or heading the chunk belongs to */
  section?: string;
  /** Page number (for PDFs) */
  pageNumber?: number;
  /** Start position in the original text */
  startIndex: number;
  /** End position in the original text */
  endIndex: number;
  /** Chunk sequence number within the document */
  chunkIndex: number;
  /** Total chunks in the document */
  totalChunks: number;
  /** Content type (heading, paragraph, list, table, etc.) */
  contentType?: ContentType;
  /** Language detected */
  language?: string;
}

/**
 * Content types for semantic chunking
 */
export type ContentType =
  | 'heading'
  | 'paragraph'
  | 'list'
  | 'table'
  | 'code'
  | 'quote'
  | 'image_caption'
  | 'footnote'
  | 'unknown';

/**
 * A text chunk with metadata
 */
export interface TextChunk {
  /** Unique chunk identifier */
  id: string;
  /** The actual text content */
  content: string;
  /** Token count (approximate) */
  tokenCount: number;
  /** Character count */
  characterCount: number;
  /** Chunk metadata */
  metadata: ChunkMetadata;
  /** Overlap with previous chunk */
  overlapStart?: string;
  /** Overlap with next chunk */
  overlapEnd?: string;
}

/**
 * Chunking strategy options
 */
export type ChunkingStrategy =
  | 'fixed'      // Fixed character/token count
  | 'sentence'   // Split by sentences
  | 'paragraph'  // Split by paragraphs
  | 'semantic'   // Smart splitting based on content structure
  | 'recursive'  // Recursive character text splitter
  | 'markdown'   // Markdown-aware splitting
  | 'hybrid';    // Combination of strategies

/**
 * Configuration for text chunking
 */
export interface ChunkingConfig {
  /** Chunking strategy to use */
  strategy: ChunkingStrategy;
  /** Target chunk size in characters */
  chunkSize: number;
  /** Overlap between chunks in characters */
  chunkOverlap: number;
  /** Minimum chunk size (won't split below this) */
  minChunkSize?: number;
  /** Maximum chunk size (hard limit) */
  maxChunkSize?: number;
  /** Whether to preserve sentence boundaries */
  preserveSentences?: boolean;
  /** Whether to preserve paragraph boundaries */
  preserveParagraphs?: boolean;
  /** Whether to include metadata in chunks */
  includeMetadata?: boolean;
  /** Custom separators for splitting */
  separators?: string[];
  /** Whether to trim whitespace */
  trimWhitespace?: boolean;
  /** Whether to remove empty chunks */
  removeEmpty?: boolean;
}

/**
 * Default chunking configurations for different use cases
 */
export const DEFAULT_CONFIGS: Record<string, ChunkingConfig> = {
  /** Good for general text with semantic search */
  default: {
    strategy: 'recursive',
    chunkSize: 1000,
    chunkOverlap: 200,
    minChunkSize: 100,
    maxChunkSize: 2000,
    preserveSentences: true,
    preserveParagraphs: true,
    includeMetadata: true,
    trimWhitespace: true,
    removeEmpty: true,
  },
  /** Optimized for marketing content */
  marketing: {
    strategy: 'semantic',
    chunkSize: 800,
    chunkOverlap: 150,
    minChunkSize: 100,
    maxChunkSize: 1500,
    preserveSentences: true,
    preserveParagraphs: true,
    includeMetadata: true,
    trimWhitespace: true,
    removeEmpty: true,
  },
  /** Optimized for technical documentation */
  technical: {
    strategy: 'markdown',
    chunkSize: 1500,
    chunkOverlap: 300,
    minChunkSize: 200,
    maxChunkSize: 3000,
    preserveSentences: true,
    preserveParagraphs: true,
    includeMetadata: true,
    trimWhitespace: true,
    removeEmpty: true,
  },
  /** Small chunks for precise retrieval */
  precise: {
    strategy: 'sentence',
    chunkSize: 500,
    chunkOverlap: 100,
    minChunkSize: 50,
    maxChunkSize: 800,
    preserveSentences: true,
    preserveParagraphs: false,
    includeMetadata: true,
    trimWhitespace: true,
    removeEmpty: true,
  },
  /** Large chunks for context-heavy retrieval */
  contextual: {
    strategy: 'paragraph',
    chunkSize: 2000,
    chunkOverlap: 400,
    minChunkSize: 300,
    maxChunkSize: 4000,
    preserveSentences: true,
    preserveParagraphs: true,
    includeMetadata: true,
    trimWhitespace: true,
    removeEmpty: true,
  },
};

/**
 * Result of chunking operation
 */
export interface ChunkingResult {
  /** Generated chunks */
  chunks: TextChunk[];
  /** Total character count of original text */
  originalLength: number;
  /** Total character count of all chunks (may be more due to overlap) */
  chunkedLength: number;
  /** Processing time in milliseconds */
  processingTime: number;
  /** Strategy used */
  strategy: ChunkingStrategy;
  /** Configuration used */
  config: ChunkingConfig;
}

/**
 * Input for chunking a document
 */
export interface ChunkingInput {
  /** Document ID */
  documentId: string;
  /** Document name */
  documentName: string;
  /** Text content to chunk */
  content: string;
  /** Optional configuration override */
  config?: Partial<ChunkingConfig>;
  /** Content type hint */
  contentType?: 'text' | 'markdown' | 'html' | 'code';
}
