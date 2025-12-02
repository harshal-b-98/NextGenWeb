/**
 * Embedding Cache
 *
 * In-memory cache for embeddings to avoid redundant API calls.
 * Can be extended to use Redis or other persistent storage.
 */

import crypto from 'crypto';
import type { EmbeddingCacheEntry, EmbeddingModel } from './types';

/**
 * Default cache TTL in milliseconds (24 hours)
 */
const DEFAULT_CACHE_TTL = 24 * 60 * 60 * 1000;

/**
 * Maximum cache size (number of entries)
 */
const MAX_CACHE_SIZE = 10000;

/**
 * In-memory embedding cache
 */
class EmbeddingCache {
  private cache: Map<string, EmbeddingCacheEntry> = new Map();
  private ttl: number;
  private maxSize: number;

  constructor(ttl: number = DEFAULT_CACHE_TTL, maxSize: number = MAX_CACHE_SIZE) {
    this.ttl = ttl;
    this.maxSize = maxSize;
  }

  /**
   * Generate a hash key for the text and model combination
   */
  private generateKey(text: string, model: EmbeddingModel): string {
    const content = `${model}:${text}`;
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  /**
   * Get a cached embedding if it exists and hasn't expired
   */
  get(text: string, model: EmbeddingModel): number[] | null {
    const key = this.generateKey(text, model);
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // Check if expired
    if (new Date() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.embedding;
  }

  /**
   * Store an embedding in the cache
   */
  set(text: string, model: EmbeddingModel, embedding: number[]): void {
    // Evict oldest entries if cache is full
    if (this.cache.size >= this.maxSize) {
      this.evictOldest();
    }

    const key = this.generateKey(text, model);
    const now = new Date();

    const entry: EmbeddingCacheEntry = {
      textHash: key,
      embedding,
      model,
      createdAt: now,
      expiresAt: new Date(now.getTime() + this.ttl),
    };

    this.cache.set(key, entry);
  }

  /**
   * Check if a text is cached
   */
  has(text: string, model: EmbeddingModel): boolean {
    return this.get(text, model) !== null;
  }

  /**
   * Remove a specific entry from the cache
   */
  delete(text: string, model: EmbeddingModel): boolean {
    const key = this.generateKey(text, model);
    return this.cache.delete(key);
  }

  /**
   * Clear all cached entries
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get the current cache size
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * Remove expired entries
   */
  cleanup(): number {
    const now = new Date();
    let removed = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
        removed++;
      }
    }

    return removed;
  }

  /**
   * Evict oldest entries to make room for new ones
   */
  private evictOldest(): void {
    // Remove 10% of cache when full
    const toRemove = Math.ceil(this.maxSize * 0.1);

    // Sort entries by creation time
    const entries = Array.from(this.cache.entries())
      .sort((a, b) => a[1].createdAt.getTime() - b[1].createdAt.getTime());

    // Remove oldest entries
    for (let i = 0; i < toRemove && i < entries.length; i++) {
      this.cache.delete(entries[i][0]);
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    size: number;
    maxSize: number;
    ttl: number;
    hitRate: number;
  } {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      ttl: this.ttl,
      hitRate: 0, // Would need to track hits/misses for this
    };
  }
}

// Singleton instance
let cacheInstance: EmbeddingCache | null = null;

/**
 * Get the singleton cache instance
 */
export function getEmbeddingCache(): EmbeddingCache {
  if (!cacheInstance) {
    cacheInstance = new EmbeddingCache();
  }
  return cacheInstance;
}

/**
 * Create a new cache instance with custom settings
 */
export function createEmbeddingCache(ttl?: number, maxSize?: number): EmbeddingCache {
  return new EmbeddingCache(ttl, maxSize);
}

export { EmbeddingCache };
