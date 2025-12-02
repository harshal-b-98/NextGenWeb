/**
 * Entity Extraction Tests
 *
 * Tests for entity extraction agent and storage functions.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type {
  Entity,
  EntityType,
  ProductEntity,
  TestimonialEntity,
  FAQEntity,
  EntityRelationship,
} from '@/lib/ai/types';

// Mock the LLM client
vi.mock('@/lib/ai/client', () => ({
  completeJSON: vi.fn(),
}));

// Mock Supabase
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({
    from: vi.fn().mockReturnValue({
      insert: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { id: 'test-entity-id' },
            error: null,
          }),
        }),
      }),
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
          gte: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              range: vi.fn().mockResolvedValue({
                data: [],
                error: null,
              }),
            }),
          }),
        }),
      }),
      delete: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          count: 0,
          error: null,
        }),
      }),
    }),
  }),
}));

import { completeJSON } from '@/lib/ai/client';
import {
  extractEntities,
  extractRelationships,
  extractEntitiesFromChunks,
  filterEntitiesByType,
  getEntityStats,
} from '@/lib/ai/agents/entity-extraction';
import {
  recordToEntity,
  type EntityRecord,
} from '@/lib/knowledge/entities/store';

describe('Entity Extraction Agent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('extractEntities', () => {
    it('should extract entities from content', async () => {
      const mockResponse = {
        data: {
          entities: [
            {
              id: 'prod_1',
              type: 'product',
              name: 'NextGenWeb',
              description: 'AI-powered website builder',
              confidence: 0.9,
              sourceChunkIds: ['chunk_1'],
              metadata: {
                features: ['AI generation', 'Multi-tenant'],
                category: 'SaaS',
              },
            },
          ],
          summary: 'Product overview document',
          documentType: 'marketing',
          primaryTopic: 'NextGenWeb platform',
        },
        tokensUsed: 500,
        model: 'claude-3-5-sonnet-latest',
        provider: 'anthropic',
      };

      vi.mocked(completeJSON).mockResolvedValue(mockResponse);

      const result = await extractEntities(
        'NextGenWeb is an AI-powered website builder...',
        ['chunk_1']
      );

      expect(result.entities).toHaveLength(1);
      expect(result.entities[0].type).toBe('product');
      expect(result.entities[0].name).toBe('NextGenWeb');
      expect(result.summary).toBe('Product overview document');
      expect(result.tokensUsed).toBe(500);
    });

    it('should filter entities below confidence threshold', async () => {
      const mockResponse = {
        data: {
          entities: [
            {
              id: 'prod_1',
              type: 'product',
              name: 'HighConfidence',
              confidence: 0.9,
              sourceChunkIds: ['chunk_1'],
            },
            {
              id: 'prod_2',
              type: 'product',
              name: 'LowConfidence',
              confidence: 0.3,
              sourceChunkIds: ['chunk_1'],
            },
          ],
        },
        tokensUsed: 400,
        model: 'claude-3-5-sonnet-latest',
        provider: 'anthropic',
      };

      vi.mocked(completeJSON).mockResolvedValue(mockResponse);

      const result = await extractEntities('Test content', ['chunk_1'], {
        minConfidence: 0.5,
      });

      expect(result.entities).toHaveLength(1);
      expect(result.entities[0].name).toBe('HighConfidence');
    });

    it('should skip invalid entity types', async () => {
      const mockResponse = {
        data: {
          entities: [
            {
              id: 'valid_1',
              type: 'product',
              name: 'ValidProduct',
              confidence: 0.9,
              sourceChunkIds: ['chunk_1'],
            },
            {
              id: 'invalid_1',
              type: 'invalid_type',
              name: 'InvalidEntity',
              confidence: 0.9,
              sourceChunkIds: ['chunk_1'],
            },
          ],
        },
        tokensUsed: 300,
        model: 'gpt-4o',
        provider: 'openai',
      };

      vi.mocked(completeJSON).mockResolvedValue(mockResponse);

      const result = await extractEntities('Test content', ['chunk_1']);

      expect(result.entities).toHaveLength(1);
      expect(result.entities[0].name).toBe('ValidProduct');
    });

    it('should respect maxEntities limit', async () => {
      const mockResponse = {
        data: {
          entities: Array(10)
            .fill(null)
            .map((_, i) => ({
              id: `entity_${i}`,
              type: 'feature',
              name: `Feature ${i}`,
              confidence: 0.9,
              sourceChunkIds: ['chunk_1'],
            })),
        },
        tokensUsed: 600,
        model: 'claude-3-5-sonnet-latest',
        provider: 'anthropic',
      };

      vi.mocked(completeJSON).mockResolvedValue(mockResponse);

      const result = await extractEntities('Test content', ['chunk_1'], {
        maxEntities: 5,
      });

      expect(result.entities).toHaveLength(5);
    });
  });

  describe('extractRelationships', () => {
    it('should extract relationships between entities', async () => {
      const entities: Entity[] = [
        {
          id: 'prod_1',
          type: 'product',
          name: 'NextGenWeb',
          confidence: 0.9,
          sourceChunkIds: ['chunk_1'],
        },
        {
          id: 'feat_1',
          type: 'feature',
          name: 'AI Generation',
          confidence: 0.9,
          sourceChunkIds: ['chunk_1'],
        },
      ];

      const mockResponse = {
        data: {
          relationships: [
            {
              id: 'rel_1',
              sourceEntityId: 'prod_1',
              targetEntityId: 'feat_1',
              relationshipType: 'has_feature',
              confidence: 0.85,
            },
          ],
        },
        tokensUsed: 200,
        model: 'claude-3-5-sonnet-latest',
        provider: 'anthropic',
      };

      vi.mocked(completeJSON).mockResolvedValue(mockResponse);

      const result = await extractRelationships(entities);

      expect(result).toHaveLength(1);
      expect(result[0].sourceEntityId).toBe('prod_1');
      expect(result[0].targetEntityId).toBe('feat_1');
      expect(result[0].relationshipType).toBe('has_feature');
    });

    it('should return empty array for single entity', async () => {
      const entities: Entity[] = [
        {
          id: 'prod_1',
          type: 'product',
          name: 'Solo',
          confidence: 0.9,
          sourceChunkIds: ['chunk_1'],
        },
      ];

      const result = await extractRelationships(entities);

      expect(result).toHaveLength(0);
      expect(completeJSON).not.toHaveBeenCalled();
    });

    it('should filter relationships with invalid entity IDs', async () => {
      const entities: Entity[] = [
        {
          id: 'prod_1',
          type: 'product',
          name: 'Product',
          confidence: 0.9,
          sourceChunkIds: ['chunk_1'],
        },
        {
          id: 'feat_1',
          type: 'feature',
          name: 'Feature',
          confidence: 0.9,
          sourceChunkIds: ['chunk_1'],
        },
      ];

      const mockResponse = {
        data: {
          relationships: [
            {
              id: 'rel_1',
              sourceEntityId: 'prod_1',
              targetEntityId: 'feat_1',
              relationshipType: 'has_feature',
              confidence: 0.85,
            },
            {
              id: 'rel_2',
              sourceEntityId: 'prod_1',
              targetEntityId: 'nonexistent_id',
              relationshipType: 'related_to',
              confidence: 0.8,
            },
          ],
        },
        tokensUsed: 250,
        model: 'claude-3-5-sonnet-latest',
        provider: 'anthropic',
      };

      vi.mocked(completeJSON).mockResolvedValue(mockResponse);

      const result = await extractRelationships(entities);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('rel_1');
    });

    it('should filter low confidence relationships', async () => {
      const entities: Entity[] = [
        {
          id: 'prod_1',
          type: 'product',
          name: 'Product',
          confidence: 0.9,
          sourceChunkIds: ['chunk_1'],
        },
        {
          id: 'feat_1',
          type: 'feature',
          name: 'Feature',
          confidence: 0.9,
          sourceChunkIds: ['chunk_1'],
        },
      ];

      const mockResponse = {
        data: {
          relationships: [
            {
              id: 'rel_1',
              sourceEntityId: 'prod_1',
              targetEntityId: 'feat_1',
              relationshipType: 'has_feature',
              confidence: 0.8,
            },
            {
              id: 'rel_2',
              sourceEntityId: 'prod_1',
              targetEntityId: 'feat_1',
              relationshipType: 'related_to',
              confidence: 0.4,
            },
          ],
        },
        tokensUsed: 200,
        model: 'claude-3-5-sonnet-latest',
        provider: 'anthropic',
      };

      vi.mocked(completeJSON).mockResolvedValue(mockResponse);

      const result = await extractRelationships(entities, { minConfidence: 0.6 });

      expect(result).toHaveLength(1);
      expect(result[0].confidence).toBe(0.8);
    });
  });

  describe('extractEntitiesFromChunks', () => {
    it('should process multiple chunks', async () => {
      const mockResponse = {
        data: {
          entities: [
            {
              id: 'entity_1',
              type: 'product',
              name: 'ChunkProduct',
              confidence: 0.9,
              sourceChunkIds: ['chunk_1'],
            },
          ],
          summary: 'Chunk summary',
          documentType: 'technical',
        },
        tokensUsed: 300,
        model: 'claude-3-5-sonnet-latest',
        provider: 'anthropic',
      };

      vi.mocked(completeJSON).mockResolvedValue(mockResponse);

      const chunks = [
        { id: 'chunk_1', content: 'Content 1' },
        { id: 'chunk_2', content: 'Content 2' },
      ];

      const result = await extractEntitiesFromChunks(chunks);

      expect(result.entities.length).toBeGreaterThan(0);
      expect(result.tokensUsed).toBeGreaterThan(0);
    });

    it('should deduplicate entities across chunks', async () => {
      // When both chunks are in same batch, the mock returns entities from both
      // that get deduplicated within the same extraction result
      vi.mocked(completeJSON).mockResolvedValueOnce({
        data: {
          entities: [
            {
              id: 'entity_1',
              type: 'product',
              name: 'SameProduct',
              confidence: 0.8,
              sourceChunkIds: ['chunk_1'],
            },
            {
              id: 'entity_2',
              type: 'product',
              name: 'SameProduct',
              confidence: 0.95,
              sourceChunkIds: ['chunk_2'],
            },
          ],
        },
        tokensUsed: 200,
        model: 'claude-3-5-sonnet-latest',
        provider: 'anthropic',
      });

      const chunks = [
        { id: 'chunk_1', content: 'Content about SameProduct' },
        { id: 'chunk_2', content: 'More about SameProduct' },
      ];

      const result = await extractEntitiesFromChunks(chunks);

      // Should merge to one entity with highest confidence
      expect(result.entities).toHaveLength(1);
      expect(result.entities[0].confidence).toBe(0.95);
      expect(result.entities[0].sourceChunkIds).toContain('chunk_1');
      expect(result.entities[0].sourceChunkIds).toContain('chunk_2');
    });
  });

  describe('filterEntitiesByType', () => {
    it('should filter entities by type', () => {
      const entities: Entity[] = [
        {
          id: 'prod_1',
          type: 'product',
          name: 'Product 1',
          confidence: 0.9,
          sourceChunkIds: [],
        },
        {
          id: 'feat_1',
          type: 'feature',
          name: 'Feature 1',
          confidence: 0.9,
          sourceChunkIds: [],
        },
        {
          id: 'prod_2',
          type: 'product',
          name: 'Product 2',
          confidence: 0.8,
          sourceChunkIds: [],
        },
      ];

      const products = filterEntitiesByType<ProductEntity>(entities, 'product');

      expect(products).toHaveLength(2);
      expect(products.every(p => p.type === 'product')).toBe(true);
    });

    it('should return empty array when no matches', () => {
      const entities: Entity[] = [
        {
          id: 'prod_1',
          type: 'product',
          name: 'Product 1',
          confidence: 0.9,
          sourceChunkIds: [],
        },
      ];

      const testimonials = filterEntitiesByType<TestimonialEntity>(entities, 'testimonial');

      expect(testimonials).toHaveLength(0);
    });
  });

  describe('getEntityStats', () => {
    it('should count entities by type', () => {
      const entities: Entity[] = [
        {
          id: '1',
          type: 'product',
          name: 'P1',
          confidence: 0.9,
          sourceChunkIds: [],
        },
        {
          id: '2',
          type: 'product',
          name: 'P2',
          confidence: 0.9,
          sourceChunkIds: [],
        },
        {
          id: '3',
          type: 'feature',
          name: 'F1',
          confidence: 0.9,
          sourceChunkIds: [],
        },
        {
          id: '4',
          type: 'testimonial',
          name: 'T1',
          quote: 'Great!',
          confidence: 0.9,
          sourceChunkIds: [],
        },
      ];

      const stats = getEntityStats(entities);

      expect(stats.product).toBe(2);
      expect(stats.feature).toBe(1);
      expect(stats.testimonial).toBe(1);
    });

    it('should handle empty array', () => {
      const stats = getEntityStats([]);

      expect(Object.keys(stats)).toHaveLength(0);
    });
  });
});

describe('Entity Store', () => {
  describe('recordToEntity', () => {
    it('should convert product record to entity', () => {
      const record: EntityRecord = {
        id: 'prod_123',
        workspace_id: 'ws_1',
        knowledge_item_id: 'ki_1',
        entity_type: 'product',
        name: 'NextGenWeb',
        description: 'AI website builder',
        confidence: 0.9,
        source_chunk_ids: ['chunk_1', 'chunk_2'],
        metadata: {
          features: ['AI', 'Multi-tenant'],
          category: 'SaaS',
        },
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      const entity = recordToEntity(record) as ProductEntity;

      expect(entity.id).toBe('prod_123');
      expect(entity.type).toBe('product');
      expect(entity.name).toBe('NextGenWeb');
      expect(entity.description).toBe('AI website builder');
      expect(entity.confidence).toBe(0.9);
      expect(entity.sourceChunkIds).toEqual(['chunk_1', 'chunk_2']);
      expect(entity.features).toEqual(['AI', 'Multi-tenant']);
      expect(entity.category).toBe('SaaS');
    });

    it('should convert testimonial record to entity', () => {
      const record: EntityRecord = {
        id: 'test_123',
        workspace_id: 'ws_1',
        knowledge_item_id: 'ki_1',
        entity_type: 'testimonial',
        name: 'Customer Review',
        description: null,
        confidence: 0.85,
        source_chunk_ids: ['chunk_3'],
        metadata: {
          quote: 'Amazing product!',
          author: 'John Doe',
          company: 'TechCorp',
          rating: 5,
        },
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      const entity = recordToEntity(record) as TestimonialEntity;

      expect(entity.type).toBe('testimonial');
      expect(entity.quote).toBe('Amazing product!');
      expect(entity.author).toBe('John Doe');
      expect(entity.company).toBe('TechCorp');
      expect(entity.rating).toBe(5);
    });

    it('should convert FAQ record to entity', () => {
      const record: EntityRecord = {
        id: 'faq_123',
        workspace_id: 'ws_1',
        knowledge_item_id: 'ki_1',
        entity_type: 'faq',
        name: 'Common Question',
        description: null,
        confidence: 0.92,
        source_chunk_ids: ['chunk_4'],
        metadata: {
          question: 'How does it work?',
          answer: 'It uses AI to generate websites.',
          category: 'General',
        },
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      const entity = recordToEntity(record) as FAQEntity;

      expect(entity.type).toBe('faq');
      expect(entity.question).toBe('How does it work?');
      expect(entity.answer).toBe('It uses AI to generate websites.');
      expect(entity.category).toBe('General');
    });

    it('should handle all entity types', () => {
      const entityTypes: EntityType[] = [
        'product',
        'service',
        'feature',
        'benefit',
        'pricing',
        'testimonial',
        'company',
        'person',
        'statistic',
        'faq',
        'cta',
        'process_step',
        'use_case',
        'integration',
        'contact',
      ];

      for (const type of entityTypes) {
        const record: EntityRecord = {
          id: `${type}_123`,
          workspace_id: 'ws_1',
          knowledge_item_id: 'ki_1',
          entity_type: type,
          name: `Test ${type}`,
          description: `Description for ${type}`,
          confidence: 0.9,
          source_chunk_ids: ['chunk_1'],
          metadata: {},
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        };

        const entity = recordToEntity(record);

        expect(entity.type).toBe(type);
        expect(entity.name).toBe(`Test ${type}`);
      }
    });

    it('should handle undefined description', () => {
      const record: EntityRecord = {
        id: 'prod_123',
        workspace_id: 'ws_1',
        knowledge_item_id: 'ki_1',
        entity_type: 'product',
        name: 'NoDescProduct',
        description: null,
        confidence: 0.9,
        source_chunk_ids: [],
        metadata: {},
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      const entity = recordToEntity(record);

      expect(entity.description).toBeUndefined();
    });
  });
});

describe('Entity Types Validation', () => {
  it('should have all required entity type fields', () => {
    const validTypes: EntityType[] = [
      'product',
      'service',
      'feature',
      'benefit',
      'pricing',
      'testimonial',
      'company',
      'person',
      'statistic',
      'faq',
      'cta',
      'process_step',
      'use_case',
      'integration',
      'contact',
    ];

    expect(validTypes).toHaveLength(15);
  });
});
