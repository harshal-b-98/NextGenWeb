/**
 * Text Chunking Strategies
 *
 * Implements various strategies for splitting documents into chunks
 * suitable for embedding and semantic search.
 */

import { v4 as uuidv4 } from 'uuid';
import type {
  TextChunk,
  ChunkMetadata,
  ChunkingConfig,
  ChunkingResult,
  ChunkingInput,
  ChunkingStrategy,
  ContentType,
} from './types';
import { DEFAULT_CONFIGS } from './types';

/**
 * Approximate token count (rough estimate: 1 token ≈ 4 characters for English)
 */
function estimateTokenCount(text: string): number {
  return Math.ceil(text.length / 4);
}

/**
 * Split text by sentence boundaries
 */
function splitBySentences(text: string): string[] {
  // Handle common sentence endings while preserving abbreviations
  const sentenceRegex = /(?<=[.!?])\s+(?=[A-Z])|(?<=[.!?])$/g;
  const sentences = text.split(sentenceRegex).filter(s => s.trim());
  return sentences;
}

/**
 * Split text by paragraph boundaries
 */
function splitByParagraphs(text: string): string[] {
  // Split on double newlines or multiple newlines
  const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim());
  return paragraphs;
}

/**
 * Split text by markdown headers
 */
function splitByMarkdownHeaders(text: string): { content: string; header?: string }[] {
  const headerRegex = /^(#{1,6})\s+(.+)$/gm;
  const sections: { content: string; header?: string }[] = [];

  let lastIndex = 0;
  let currentHeader: string | undefined;
  let match;

  while ((match = headerRegex.exec(text)) !== null) {
    // Add content before this header
    if (match.index > lastIndex) {
      const content = text.slice(lastIndex, match.index).trim();
      if (content) {
        sections.push({ content, header: currentHeader });
      }
    }
    currentHeader = match[2];
    lastIndex = match.index + match[0].length;
  }

  // Add remaining content
  const remaining = text.slice(lastIndex).trim();
  if (remaining) {
    sections.push({ content: remaining, header: currentHeader });
  }

  return sections;
}

/**
 * Detect content type from text
 */
function detectContentType(text: string): ContentType {
  const trimmed = text.trim();

  // Check for headings
  if (/^#{1,6}\s/.test(trimmed)) return 'heading';

  // Check for lists
  if (/^[-*+]\s|^\d+\.\s/.test(trimmed)) return 'list';

  // Check for code blocks
  if (/^```|^    |\t/.test(trimmed)) return 'code';

  // Check for quotes
  if (/^>/.test(trimmed)) return 'quote';

  // Check for tables
  if (/\|.*\|/.test(trimmed) && /-{3,}/.test(trimmed)) return 'table';

  return 'paragraph';
}

/**
 * Recursive character text splitter
 * Tries to split by larger units first, then falls back to smaller units
 */
function recursiveSplit(
  text: string,
  separators: string[],
  chunkSize: number,
  chunkOverlap: number
): string[] {
  const chunks: string[] = [];

  if (text.length <= chunkSize) {
    return [text];
  }

  // Try each separator in order
  for (const separator of separators) {
    const splits = text.split(separator);

    if (splits.length > 1) {
      let currentChunk = '';

      for (const split of splits) {
        const potentialChunk = currentChunk
          ? currentChunk + separator + split
          : split;

        if (potentialChunk.length <= chunkSize) {
          currentChunk = potentialChunk;
        } else {
          if (currentChunk) {
            chunks.push(currentChunk);
          }

          // If single split is too large, recursively split it
          if (split.length > chunkSize) {
            const subChunks = recursiveSplit(
              split,
              separators.slice(separators.indexOf(separator) + 1),
              chunkSize,
              chunkOverlap
            );
            chunks.push(...subChunks);
            currentChunk = '';
          } else {
            currentChunk = split;
          }
        }
      }

      if (currentChunk) {
        chunks.push(currentChunk);
      }

      return chunks;
    }
  }

  // Fallback: split by character count
  const result: string[] = [];
  for (let i = 0; i < text.length; i += chunkSize - chunkOverlap) {
    result.push(text.slice(i, i + chunkSize));
  }
  return result;
}

/**
 * Default separators for recursive splitting
 */
const DEFAULT_SEPARATORS = [
  '\n\n',      // Paragraphs
  '\n',        // Lines
  '. ',        // Sentences
  ', ',        // Clauses
  ' ',         // Words
  '',          // Characters (fallback)
];

/**
 * Markdown-specific separators
 */
const MARKDOWN_SEPARATORS = [
  '\n## ',     // H2 headers
  '\n### ',    // H3 headers
  '\n#### ',   // H4 headers
  '\n\n',      // Paragraphs
  '\n',        // Lines
  '. ',        // Sentences
  ', ',        // Clauses
  ' ',         // Words
];

/**
 * Fixed-size chunking strategy
 */
function chunkFixed(
  text: string,
  config: ChunkingConfig
): string[] {
  const { chunkSize, chunkOverlap } = config;
  const chunks: string[] = [];

  for (let i = 0; i < text.length; i += chunkSize - chunkOverlap) {
    let chunk = text.slice(i, i + chunkSize);

    if (config.trimWhitespace) {
      chunk = chunk.trim();
    }

    if (chunk || !config.removeEmpty) {
      chunks.push(chunk);
    }
  }

  return chunks;
}

/**
 * Sentence-based chunking strategy
 */
function chunkBySentences(
  text: string,
  config: ChunkingConfig
): string[] {
  const { chunkSize, chunkOverlap, minChunkSize = 0 } = config;
  const sentences = splitBySentences(text);
  const chunks: string[] = [];
  let currentChunk = '';
  let overlapBuffer: string[] = [];

  // If no sentences found, return original text as single chunk
  if (sentences.length === 0) {
    return text.trim() ? [text.trim()] : [];
  }

  for (const sentence of sentences) {
    const potentialChunk = currentChunk
      ? currentChunk + ' ' + sentence
      : sentence;

    if (potentialChunk.length <= chunkSize) {
      currentChunk = potentialChunk;
      overlapBuffer.push(sentence);
    } else {
      if (currentChunk && currentChunk.length >= minChunkSize) {
        chunks.push(currentChunk);
      }

      // Start new chunk with overlap
      const overlapText = overlapBuffer
        .slice(-Math.ceil(overlapBuffer.length * (chunkOverlap / chunkSize)))
        .join(' ');

      currentChunk = overlapText ? overlapText + ' ' + sentence : sentence;
      overlapBuffer = [sentence];
    }
  }

  // Always add final chunk if it has content (allow smaller last chunks)
  if (currentChunk && (chunks.length === 0 || currentChunk.length >= minChunkSize)) {
    chunks.push(currentChunk);
  }

  return chunks;
}

/**
 * Paragraph-based chunking strategy
 */
function chunkByParagraphs(
  text: string,
  config: ChunkingConfig
): string[] {
  const { chunkSize, chunkOverlap, minChunkSize = 0 } = config;
  const paragraphs = splitByParagraphs(text);
  const chunks: string[] = [];
  let currentChunk = '';

  // If no paragraphs found, return original text as single chunk
  if (paragraphs.length === 0) {
    return text.trim() ? [text.trim()] : [];
  }

  for (const paragraph of paragraphs) {
    const potentialChunk = currentChunk
      ? currentChunk + '\n\n' + paragraph
      : paragraph;

    if (potentialChunk.length <= chunkSize) {
      currentChunk = potentialChunk;
    } else {
      if (currentChunk && currentChunk.length >= minChunkSize) {
        chunks.push(currentChunk);
      }

      // If paragraph is too large, split it further
      if (paragraph.length > chunkSize) {
        const subChunks = chunkBySentences(paragraph, config);
        chunks.push(...subChunks);
        currentChunk = '';
      } else {
        // Add overlap from previous chunk
        const overlap = currentChunk.slice(-chunkOverlap);
        currentChunk = overlap ? overlap + '\n\n' + paragraph : paragraph;
      }
    }
  }

  // Always add final chunk if it has content (allow smaller last chunks)
  if (currentChunk && (chunks.length === 0 || currentChunk.length >= minChunkSize)) {
    chunks.push(currentChunk);
  }

  return chunks;
}

/**
 * Semantic chunking strategy
 * Uses content structure to make intelligent splitting decisions
 */
function chunkSemantic(
  text: string,
  config: ChunkingConfig
): string[] {
  const { chunkSize, chunkOverlap, minChunkSize } = config;
  const chunks: string[] = [];

  // First, split by markdown headers if present
  const sections = splitByMarkdownHeaders(text);

  for (const section of sections) {
    const { content, header } = section;
    const sectionText = header ? `## ${header}\n\n${content}` : content;

    if (sectionText.length <= chunkSize) {
      if (sectionText.length >= (minChunkSize || 0)) {
        chunks.push(sectionText);
      }
    } else {
      // Split large sections by paragraphs
      const paragraphChunks = chunkByParagraphs(content, config);

      // Add header context to first chunk
      if (header && paragraphChunks.length > 0) {
        paragraphChunks[0] = `## ${header}\n\n${paragraphChunks[0]}`;
      }

      chunks.push(...paragraphChunks);
    }
  }

  // Add overlap between chunks
  return addOverlap(chunks, chunkOverlap);
}

/**
 * Recursive chunking strategy
 */
function chunkRecursive(
  text: string,
  config: ChunkingConfig
): string[] {
  const separators = config.separators || DEFAULT_SEPARATORS;
  const rawChunks = recursiveSplit(text, separators, config.chunkSize, config.chunkOverlap);

  // Filter and trim chunks
  const processedChunks = rawChunks
    .map(chunk => config.trimWhitespace ? chunk.trim() : chunk)
    .filter(chunk => !config.removeEmpty || chunk.length > 0);

  // Only apply minChunkSize filter if we have multiple chunks
  // This ensures single chunks for short content are preserved
  if (processedChunks.length <= 1) {
    return processedChunks;
  }

  return processedChunks.filter(chunk => chunk.length >= (config.minChunkSize || 0));
}

/**
 * Markdown-aware chunking strategy
 */
function chunkMarkdown(
  text: string,
  config: ChunkingConfig
): string[] {
  const separators = MARKDOWN_SEPARATORS;
  const rawChunks = recursiveSplit(text, separators, config.chunkSize, config.chunkOverlap);

  // Filter and trim chunks
  const processedChunks = rawChunks
    .map(chunk => config.trimWhitespace ? chunk.trim() : chunk)
    .filter(chunk => !config.removeEmpty || chunk.length > 0);

  // Only apply minChunkSize filter if we have multiple chunks
  // This ensures single chunks for short content are preserved
  if (processedChunks.length <= 1) {
    return processedChunks;
  }

  return processedChunks.filter(chunk => chunk.length >= (config.minChunkSize || 0));
}

/**
 * Hybrid chunking strategy
 * Combines semantic understanding with fallback to recursive splitting
 */
function chunkHybrid(
  text: string,
  config: ChunkingConfig
): string[] {
  // Try semantic first
  const semanticChunks = chunkSemantic(text, config);

  // If semantic produces too many small chunks, fall back to recursive
  const avgSize = semanticChunks.reduce((sum, c) => sum + c.length, 0) / semanticChunks.length;

  if (avgSize < (config.minChunkSize || 100)) {
    return chunkRecursive(text, config);
  }

  return semanticChunks;
}

/**
 * Add overlap between chunks
 */
function addOverlap(chunks: string[], overlapSize: number): string[] {
  if (overlapSize === 0 || chunks.length <= 1) {
    return chunks;
  }

  return chunks.map((chunk, index) => {
    if (index === 0) return chunk;

    const prevChunk = chunks[index - 1];
    const overlap = prevChunk.slice(-overlapSize);

    return overlap + chunk;
  });
}

/**
 * Main chunking function
 */
export function chunkText(
  input: ChunkingInput
): ChunkingResult {
  const startTime = Date.now();
  const { documentId, documentName, content, config: configOverride, contentType } = input;

  // Merge config with defaults
  const baseConfig = DEFAULT_CONFIGS.default;
  const config: ChunkingConfig = {
    ...baseConfig,
    ...configOverride,
  };

  // Auto-detect strategy based on content type
  if (!configOverride?.strategy && contentType === 'markdown') {
    config.strategy = 'markdown';
  }

  // Select chunking function based on strategy
  let rawChunks: string[];

  switch (config.strategy) {
    case 'fixed':
      rawChunks = chunkFixed(content, config);
      break;
    case 'sentence':
      rawChunks = chunkBySentences(content, config);
      break;
    case 'paragraph':
      rawChunks = chunkByParagraphs(content, config);
      break;
    case 'semantic':
      rawChunks = chunkSemantic(content, config);
      break;
    case 'recursive':
      rawChunks = chunkRecursive(content, config);
      break;
    case 'markdown':
      rawChunks = chunkMarkdown(content, config);
      break;
    case 'hybrid':
      rawChunks = chunkHybrid(content, config);
      break;
    default:
      rawChunks = chunkRecursive(content, config);
  }

  // Convert to TextChunk objects with metadata
  const chunks: TextChunk[] = rawChunks.map((chunkContent, index) => {
    // Find position in original text
    const startIndex = content.indexOf(chunkContent);
    const endIndex = startIndex + chunkContent.length;

    const metadata: ChunkMetadata = {
      documentId,
      documentName,
      startIndex: startIndex >= 0 ? startIndex : 0,
      endIndex: endIndex >= 0 ? endIndex : chunkContent.length,
      chunkIndex: index,
      totalChunks: rawChunks.length,
      contentType: detectContentType(chunkContent),
    };

    return {
      id: uuidv4(),
      content: chunkContent,
      tokenCount: estimateTokenCount(chunkContent),
      characterCount: chunkContent.length,
      metadata,
    };
  });

  const processingTime = Date.now() - startTime;

  return {
    chunks,
    originalLength: content.length,
    chunkedLength: chunks.reduce((sum, c) => sum + c.characterCount, 0),
    processingTime,
    strategy: config.strategy,
    config,
  };
}

/**
 * Chunk multiple documents
 */
export async function chunkDocuments(
  inputs: ChunkingInput[]
): Promise<ChunkingResult[]> {
  return inputs.map(input => chunkText(input));
}

/**
 * Get recommended config based on content analysis
 */
export function getRecommendedConfig(
  content: string,
  contentType?: 'text' | 'markdown' | 'html' | 'code'
): ChunkingConfig {
  // Check for markdown indicators
  const hasMarkdown = /^#{1,6}\s|```|\*\*|__|\[.*\]\(.*\)/.test(content);

  // Check for code indicators
  const hasCode = /```|function\s|class\s|const\s|let\s|var\s|import\s|export\s/.test(content);

  // Check content length
  const isShort = content.length < 5000;
  const isLong = content.length > 50000;

  if (contentType === 'code' || hasCode) {
    return DEFAULT_CONFIGS.technical;
  }

  if (contentType === 'markdown' || hasMarkdown) {
    return { ...DEFAULT_CONFIGS.technical, strategy: 'markdown' };
  }

  if (isShort) {
    return DEFAULT_CONFIGS.precise;
  }

  if (isLong) {
    return DEFAULT_CONFIGS.contextual;
  }

  return DEFAULT_CONFIGS.default;
}

// Export types and defaults
export { DEFAULT_CONFIGS };
export type { ChunkingConfig, ChunkingStrategy, TextChunk, ChunkMetadata };
