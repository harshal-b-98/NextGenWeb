/**
 * Text Chunking Tests
 *
 * Unit tests for the text chunking strategies.
 */

import { describe, it, expect } from 'vitest';
import {
  chunkText,
  getRecommendedConfig,
  DEFAULT_CONFIGS,
} from '../chunking';
import type { ChunkingInput, ChunkingConfig } from '../types';

describe('chunkText', () => {
  const createInput = (
    content: string,
    config?: Partial<ChunkingConfig>
  ): ChunkingInput => ({
    documentId: 'test-doc-1',
    documentName: 'test.txt',
    content,
    config,
  });

  describe('fixed strategy', () => {
    it('should split text into fixed-size chunks', () => {
      const input = createInput(
        'A'.repeat(500),
        { strategy: 'fixed', chunkSize: 100, chunkOverlap: 0 }
      );

      const result = chunkText(input);

      expect(result.chunks.length).toBe(5);
      result.chunks.forEach(chunk => {
        expect(chunk.characterCount).toBe(100);
      });
    });

    it('should apply overlap correctly', () => {
      const input = createInput(
        'A'.repeat(300),
        { strategy: 'fixed', chunkSize: 100, chunkOverlap: 20 }
      );

      const result = chunkText(input);

      // With 300 chars, 100 size, 20 overlap: positions 0, 80, 160, 240
      expect(result.chunks.length).toBe(4);
    });
  });

  describe('sentence strategy', () => {
    it('should split by sentences', () => {
      const input = createInput(
        'This is sentence one. This is sentence two. This is sentence three.',
        { strategy: 'sentence', chunkSize: 50, chunkOverlap: 0 }
      );

      const result = chunkText(input);

      expect(result.chunks.length).toBeGreaterThan(1);
      // Each chunk should end with a complete sentence
      result.chunks.forEach(chunk => {
        expect(chunk.content).toMatch(/[.!?]$/);
      });
    });

    it('should preserve sentence boundaries', () => {
      const input = createInput(
        'Short sentence. Another short one. Yet another. Final one.',
        { strategy: 'sentence', chunkSize: 100, chunkOverlap: 0, minChunkSize: 10 }
      );

      const result = chunkText(input);

      // Should not cut sentences in half
      result.chunks.forEach(chunk => {
        expect(chunk.content).not.toMatch(/\w$/); // Shouldn't end with a word character
      });
    });
  });

  describe('paragraph strategy', () => {
    it('should split by paragraphs', () => {
      const input = createInput(
        'Paragraph one content here.\n\nParagraph two content here.\n\nParagraph three content here.',
        { strategy: 'paragraph', chunkSize: 30, chunkOverlap: 0, minChunkSize: 0 }
      );

      const result = chunkText(input);

      expect(result.chunks.length).toBeGreaterThanOrEqual(3);
    });

    it('should handle single paragraph', () => {
      const input = createInput(
        'Just one paragraph without any breaks.',
        { strategy: 'paragraph', chunkSize: 100, chunkOverlap: 0 }
      );

      const result = chunkText(input);

      expect(result.chunks.length).toBe(1);
      expect(result.chunks[0].content).toBe('Just one paragraph without any breaks.');
    });
  });

  describe('recursive strategy', () => {
    it('should recursively split large text', () => {
      const input = createInput(
        'First paragraph with multiple sentences. It has more content. And even more.\n\nSecond paragraph here. Also with content.',
        { strategy: 'recursive', chunkSize: 80, chunkOverlap: 10 }
      );

      const result = chunkText(input);

      expect(result.chunks.length).toBeGreaterThan(1);
      result.chunks.forEach(chunk => {
        expect(chunk.characterCount).toBeLessThanOrEqual(100); // Some flexibility for overlap
      });
    });
  });

  describe('markdown strategy', () => {
    it('should respect markdown headers', () => {
      const markdownContent = `# Main Title

Some intro text here.

## Section One

Content for section one.

## Section Two

Content for section two.`;

      const input = createInput(markdownContent, {
        strategy: 'markdown',
        chunkSize: 100,
        chunkOverlap: 0,
      });

      const result = chunkText(input);

      expect(result.chunks.length).toBeGreaterThan(1);
    });

    it('should handle code blocks', () => {
      const content = `Some text before.

\`\`\`javascript
const x = 1;
const y = 2;
\`\`\`

Some text after.`;

      const input = createInput(content, {
        strategy: 'markdown',
        chunkSize: 200,
        chunkOverlap: 0,
      });

      const result = chunkText(input);

      expect(result.chunks.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('semantic strategy', () => {
    it('should create semantically meaningful chunks', () => {
      const content = `## Introduction

This is the introduction section with important background information.

## Features

Here are the main features:
- Feature one
- Feature two
- Feature three

## Conclusion

Final thoughts and summary.`;

      const input = createInput(content, {
        strategy: 'semantic',
        chunkSize: 200,
        chunkOverlap: 20,
      });

      const result = chunkText(input);

      expect(result.chunks.length).toBeGreaterThan(1);
      // Check that sections are somewhat preserved
      const hasIntro = result.chunks.some(c => c.content.includes('Introduction'));
      const hasFeatures = result.chunks.some(c => c.content.includes('Features'));
      expect(hasIntro || hasFeatures).toBe(true);
    });
  });

  describe('metadata', () => {
    it('should include correct metadata', () => {
      const input = createInput('Test content here.', {
        strategy: 'fixed',
        chunkSize: 100,
      });

      const result = chunkText(input);

      expect(result.chunks[0].metadata).toEqual(
        expect.objectContaining({
          documentId: 'test-doc-1',
          documentName: 'test.txt',
          chunkIndex: 0,
          totalChunks: 1,
        })
      );
    });

    it('should track chunk positions', () => {
      const input = createInput('First chunk. Second chunk.', {
        strategy: 'sentence',
        chunkSize: 15,
        chunkOverlap: 0,
        minChunkSize: 5,
      });

      const result = chunkText(input);

      result.chunks.forEach((chunk, index) => {
        expect(chunk.metadata.chunkIndex).toBe(index);
        expect(chunk.metadata.totalChunks).toBe(result.chunks.length);
      });
    });

    it('should estimate token count', () => {
      const input = createInput('This is a test with about twenty characters.', {
        strategy: 'fixed',
        chunkSize: 100,
      });

      const result = chunkText(input);

      // Token count should be roughly characters / 4
      expect(result.chunks[0].tokenCount).toBeGreaterThan(0);
      expect(result.chunks[0].tokenCount).toBeLessThan(result.chunks[0].characterCount);
    });
  });

  describe('edge cases', () => {
    it('should handle empty content', () => {
      const input = createInput('', {
        strategy: 'recursive',
        chunkSize: 100,
        removeEmpty: true,
      });

      const result = chunkText(input);

      expect(result.chunks.length).toBe(0);
    });

    it('should handle very short content', () => {
      const input = createInput('Hi', {
        strategy: 'recursive',
        chunkSize: 100,
        minChunkSize: 1,
      });

      const result = chunkText(input);

      expect(result.chunks.length).toBe(1);
      expect(result.chunks[0].content).toBe('Hi');
    });

    it('should handle content smaller than chunk size', () => {
      const input = createInput('Small content.', {
        strategy: 'fixed',
        chunkSize: 1000,
      });

      const result = chunkText(input);

      expect(result.chunks.length).toBe(1);
    });

    it('should handle whitespace-only content', () => {
      const input = createInput('   \n\n   ', {
        strategy: 'recursive',
        chunkSize: 100,
        trimWhitespace: true,
        removeEmpty: true,
      });

      const result = chunkText(input);

      expect(result.chunks.length).toBe(0);
    });
  });

  describe('result properties', () => {
    it('should include processing time', () => {
      const input = createInput('Test content.');

      const result = chunkText(input);

      expect(result.processingTime).toBeGreaterThanOrEqual(0);
    });

    it('should include original and chunked length', () => {
      const content = 'Test content for measuring.';
      const input = createInput(content);

      const result = chunkText(input);

      expect(result.originalLength).toBe(content.length);
      expect(result.chunkedLength).toBeGreaterThanOrEqual(content.length);
    });

    it('should include strategy and config', () => {
      const input = createInput('Test.', { strategy: 'sentence' });

      const result = chunkText(input);

      expect(result.strategy).toBe('sentence');
      expect(result.config).toBeDefined();
    });
  });
});

describe('getRecommendedConfig', () => {
  it('should recommend markdown config for markdown content', () => {
    const content = '# Heading\n\nSome **bold** text with [links](url).';

    const config = getRecommendedConfig(content);

    expect(config.strategy).toBe('markdown');
  });

  it('should recommend technical config for code content', () => {
    const content = `function hello() {
  console.log("Hello");
}

export const value = 42;`;

    const config = getRecommendedConfig(content);

    expect(config.strategy).toBe('recursive'); // Technical uses recursive
    expect(config.chunkSize).toBeGreaterThan(DEFAULT_CONFIGS.default.chunkSize);
  });

  it('should recommend precise config for short content', () => {
    const content = 'Short text.';

    const config = getRecommendedConfig(content);

    expect(config.chunkSize).toBeLessThanOrEqual(DEFAULT_CONFIGS.precise.chunkSize);
  });

  it('should recommend contextual config for long content', () => {
    const content = 'A'.repeat(60000);

    const config = getRecommendedConfig(content);

    expect(config.chunkSize).toBeGreaterThanOrEqual(DEFAULT_CONFIGS.contextual.chunkSize);
  });

  it('should use contentType hint when provided', () => {
    const content = 'Plain text content.';

    const markdownConfig = getRecommendedConfig(content, 'markdown');
    const codeConfig = getRecommendedConfig(content, 'code');

    expect(markdownConfig.strategy).toBe('markdown');
    expect(codeConfig).toEqual(DEFAULT_CONFIGS.technical);
  });
});

describe('DEFAULT_CONFIGS', () => {
  it('should have all required configs', () => {
    expect(DEFAULT_CONFIGS.default).toBeDefined();
    expect(DEFAULT_CONFIGS.marketing).toBeDefined();
    expect(DEFAULT_CONFIGS.technical).toBeDefined();
    expect(DEFAULT_CONFIGS.precise).toBeDefined();
    expect(DEFAULT_CONFIGS.contextual).toBeDefined();
  });

  it('should have valid chunk sizes', () => {
    Object.values(DEFAULT_CONFIGS).forEach(config => {
      expect(config.chunkSize).toBeGreaterThan(0);
      expect(config.chunkOverlap).toBeLessThan(config.chunkSize);
      if (config.minChunkSize) {
        expect(config.minChunkSize).toBeLessThan(config.chunkSize);
      }
      if (config.maxChunkSize) {
        expect(config.maxChunkSize).toBeGreaterThan(config.chunkSize);
      }
    });
  });
});
