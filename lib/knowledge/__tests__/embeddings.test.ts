/**
 * Embedding Module Tests
 *
 * Tests for the embedding generation and caching system.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  EmbeddingCache,
  createEmbeddingCache,
  cosineSimilarity,
  normalizeVector,
  getModelConfig,
  EMBEDDING_MODELS,
} from '../embeddings';

describe('Embedding Module', () => {
  describe('EMBEDDING_MODELS', () => {
    it('should have correct configurations for text-embedding-3-small', () => {
      const config = EMBEDDING_MODELS['text-embedding-3-small'];
      expect(config.dimensions).toBe(1536);
      expect(config.maxTokens).toBe(8191);
      expect(config.costPer1kTokens).toBe(0.00002);
    });

    it('should have correct configurations for text-embedding-3-large', () => {
      const config = EMBEDDING_MODELS['text-embedding-3-large'];
      expect(config.dimensions).toBe(3072);
      expect(config.maxTokens).toBe(8191);
      expect(config.costPer1kTokens).toBe(0.00013);
    });

    it('should have correct configurations for text-embedding-ada-002', () => {
      const config = EMBEDDING_MODELS['text-embedding-ada-002'];
      expect(config.dimensions).toBe(1536);
      expect(config.maxTokens).toBe(8191);
      expect(config.costPer1kTokens).toBe(0.0001);
    });
  });

  describe('getModelConfig', () => {
    it('should return config for valid model', () => {
      const config = getModelConfig('text-embedding-3-small');
      expect(config.model).toBe('text-embedding-3-small');
      expect(config.dimensions).toBe(1536);
    });

    it('should return undefined for unknown model', () => {
      const config = getModelConfig('unknown-model' as never);
      expect(config).toBeUndefined();
    });
  });

  describe('cosineSimilarity', () => {
    it('should return 1 for identical vectors', () => {
      const v = [1, 0, 0];
      expect(cosineSimilarity(v, v)).toBeCloseTo(1, 5);
    });

    it('should return 0 for orthogonal vectors', () => {
      const v1 = [1, 0, 0];
      const v2 = [0, 1, 0];
      expect(cosineSimilarity(v1, v2)).toBeCloseTo(0, 5);
    });

    it('should return -1 for opposite vectors', () => {
      const v1 = [1, 0, 0];
      const v2 = [-1, 0, 0];
      expect(cosineSimilarity(v1, v2)).toBeCloseTo(-1, 5);
    });

    it('should handle high-dimensional vectors', () => {
      const dim = 1536;
      const v1 = new Array(dim).fill(1).map((_, i) => Math.sin(i));
      const v2 = new Array(dim).fill(1).map((_, i) => Math.sin(i));
      expect(cosineSimilarity(v1, v2)).toBeCloseTo(1, 5);
    });

    it('should throw for mismatched dimensions', () => {
      expect(() => cosineSimilarity([1, 2], [1, 2, 3])).toThrow();
    });
  });

  describe('normalizeVector', () => {
    it('should normalize to unit length', () => {
      const v = [3, 4];
      const normalized = normalizeVector(v);
      const magnitude = Math.sqrt(normalized.reduce((sum, x) => sum + x * x, 0));
      expect(magnitude).toBeCloseTo(1, 5);
    });

    it('should preserve direction', () => {
      const v = [3, 4];
      const normalized = normalizeVector(v);
      expect(normalized[0] / normalized[1]).toBeCloseTo(3 / 4, 5);
    });

    it('should handle zero vector', () => {
      const v = [0, 0, 0];
      const normalized = normalizeVector(v);
      expect(normalized).toEqual([0, 0, 0]);
    });
  });

  describe('EmbeddingCache', () => {
    let cache: EmbeddingCache;

    beforeEach(() => {
      cache = createEmbeddingCache(60000, 100); // 1 minute TTL, 100 max size
    });

    it('should store and retrieve embeddings', () => {
      const text = 'Hello world';
      const model = 'text-embedding-3-small';
      const embedding = [0.1, 0.2, 0.3];

      cache.set(text, model, embedding);
      const retrieved = cache.get(text, model);

      expect(retrieved).toEqual(embedding);
    });

    it('should return null for non-existent entries', () => {
      const result = cache.get('unknown', 'text-embedding-3-small');
      expect(result).toBeNull();
    });

    it('should track size correctly', () => {
      expect(cache.size()).toBe(0);

      cache.set('text1', 'text-embedding-3-small', [0.1]);
      expect(cache.size()).toBe(1);

      cache.set('text2', 'text-embedding-3-small', [0.2]);
      expect(cache.size()).toBe(2);
    });

    it('should clear all entries', () => {
      cache.set('text1', 'text-embedding-3-small', [0.1]);
      cache.set('text2', 'text-embedding-3-small', [0.2]);

      cache.clear();

      expect(cache.size()).toBe(0);
      expect(cache.get('text1', 'text-embedding-3-small')).toBeNull();
    });

    it('should delete specific entries', () => {
      cache.set('text1', 'text-embedding-3-small', [0.1]);
      cache.set('text2', 'text-embedding-3-small', [0.2]);

      cache.delete('text1', 'text-embedding-3-small');

      expect(cache.get('text1', 'text-embedding-3-small')).toBeNull();
      expect(cache.get('text2', 'text-embedding-3-small')).not.toBeNull();
    });

    it('should differentiate by model', () => {
      const text = 'Hello';
      cache.set(text, 'text-embedding-3-small', [0.1]);
      cache.set(text, 'text-embedding-3-large', [0.2]);

      expect(cache.get(text, 'text-embedding-3-small')).toEqual([0.1]);
      expect(cache.get(text, 'text-embedding-3-large')).toEqual([0.2]);
    });

    it('should report stats', () => {
      cache.set('text', 'text-embedding-3-small', [0.1]);

      const stats = cache.getStats();

      expect(stats.size).toBe(1);
      expect(stats.maxSize).toBe(100);
      expect(stats.ttl).toBe(60000);
    });

    it('should evict entries when full', () => {
      const smallCache = createEmbeddingCache(60000, 10);

      // Fill the cache
      for (let i = 0; i < 15; i++) {
        smallCache.set(`text${i}`, 'text-embedding-3-small', [i]);
      }

      // Should be at or below max size (with some evictions)
      expect(smallCache.size()).toBeLessThanOrEqual(10);
    });

    it('should check existence correctly', () => {
      cache.set('exists', 'text-embedding-3-small', [0.1]);

      expect(cache.has('exists', 'text-embedding-3-small')).toBe(true);
      expect(cache.has('missing', 'text-embedding-3-small')).toBe(false);
    });
  });
});
