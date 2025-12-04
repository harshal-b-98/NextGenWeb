/**
 * Entity Extraction Agent
 *
 * AI agent for extracting structured entities from document content.
 */

import { v4 as uuidv4 } from 'uuid';
import { completeJSON } from '../client';
import type {
  Entity,
  EntityType,
  EntityExtractionResult,
  EntityRelationship,
  LLMConfig,
} from '../types';
import {
  ENTITY_EXTRACTION_SYSTEM_PROMPT,
  RELATIONSHIP_EXTRACTION_SYSTEM_PROMPT,
  createEntityExtractionPrompt,
  createRelationshipExtractionPrompt,
} from '../prompts/entity-extraction';

/**
 * Options for entity extraction
 */
export interface EntityExtractionOptions {
  /** Focus on specific entity types */
  focusTypes?: EntityType[];
  /** Additional context about the document */
  context?: string;
  /** LLM configuration override */
  llmConfig?: Partial<LLMConfig>;
  /** Minimum confidence threshold for entities */
  minConfidence?: number;
  /** Maximum entities to extract */
  maxEntities?: number;
  /** Extract relationships between entities */
  extractRelationships?: boolean;
}

/**
 * Raw extraction result from LLM
 */
interface RawExtractionResult {
  entities: Array<{
    id: string;
    type: string;
    name: string;
    description?: string;
    confidence: number;
    sourceChunkIds: string[];
    metadata?: Record<string, unknown>;
  }>;
  summary?: string;
  documentType?: string;
  primaryTopic?: string;
}

/**
 * Raw relationship result from LLM
 */
interface RawRelationshipResult {
  relationships: Array<{
    id: string;
    sourceEntityId: string;
    targetEntityId: string;
    relationshipType: string;
    confidence: number;
  }>;
}

/**
 * Extract entities from text content
 */
export async function extractEntities(
  content: string,
  chunkIds: string[],
  options: EntityExtractionOptions = {}
): Promise<EntityExtractionResult> {
  const startTime = Date.now();
  const {
    focusTypes,
    context,
    llmConfig,
    minConfidence = 0.5,
    maxEntities = 100,
  } = options;

  const userPrompt = createEntityExtractionPrompt(content, chunkIds, {
    focusTypes,
    additionalContext: context,
  });

  const result = await completeJSON<RawExtractionResult>({
    messages: [
      { role: 'system', content: ENTITY_EXTRACTION_SYSTEM_PROMPT },
      { role: 'user', content: userPrompt },
    ],
    config: llmConfig,
  });

  // Validate and transform entities
  const validEntities: Entity[] = [];

  for (const raw of result.data.entities) {
    // Skip low confidence entities
    if (raw.confidence < minConfidence) {
      continue;
    }

    // Validate entity type
    if (!isValidEntityType(raw.type)) {
      console.warn(`Invalid entity type: ${raw.type}`);
      continue;
    }

    // Transform to proper entity structure
    const entity = transformToEntity(raw);
    if (entity) {
      validEntities.push(entity);
    }

    // Respect max entities limit
    if (validEntities.length >= maxEntities) {
      break;
    }
  }

  return {
    entities: validEntities,
    summary: result.data.summary,
    documentType: result.data.documentType,
    primaryTopic: result.data.primaryTopic,
    tokensUsed: result.tokensUsed,
    processingTime: Date.now() - startTime,
  };
}

/**
 * Extract relationships between entities
 */
export async function extractRelationships(
  entities: Entity[],
  options: { llmConfig?: Partial<LLMConfig>; minConfidence?: number } = {}
): Promise<EntityRelationship[]> {
  const { llmConfig, minConfidence = 0.6 } = options;

  if (entities.length < 2) {
    return [];
  }

  const entityList = entities.map(e => ({
    id: e.id,
    type: e.type,
    name: e.name,
    description: e.description,
  }));

  const result = await completeJSON<RawRelationshipResult>({
    messages: [
      { role: 'system', content: RELATIONSHIP_EXTRACTION_SYSTEM_PROMPT },
      { role: 'user', content: createRelationshipExtractionPrompt(entityList) },
    ],
    config: llmConfig,
  });

  // Validate and filter relationships
  const validRelationships: EntityRelationship[] = [];
  const entityIds = new Set(entities.map(e => e.id));

  for (const raw of result.data.relationships) {
    // Skip low confidence relationships
    if (raw.confidence < minConfidence) {
      continue;
    }

    // Validate entity IDs exist
    if (!entityIds.has(raw.sourceEntityId) || !entityIds.has(raw.targetEntityId)) {
      continue;
    }

    validRelationships.push({
      id: raw.id || `rel_${uuidv4().slice(0, 8)}`,
      sourceEntityId: raw.sourceEntityId,
      targetEntityId: raw.targetEntityId,
      relationshipType: raw.relationshipType as EntityRelationship['relationshipType'],
      confidence: raw.confidence,
    });
  }

  return validRelationships;
}

/**
 * Process multiple chunks and merge entities
 */
export async function extractEntitiesFromChunks(
  chunks: Array<{ id: string; content: string }>,
  options: EntityExtractionOptions = {}
): Promise<EntityExtractionResult> {
  const startTime = Date.now();
  let totalTokens = 0;

  // Process chunks in batches to avoid context limits
  const batchSize = 5;
  const allEntities: Entity[] = [];
  const summaries: string[] = [];
  let documentType: string | undefined;
  let primaryTopic: string | undefined;

  for (let i = 0; i < chunks.length; i += batchSize) {
    const batch = chunks.slice(i, i + batchSize);
    const combinedContent = batch.map(c => `[Chunk ${c.id}]\n${c.content}`).join('\n\n---\n\n');
    const chunkIds = batch.map(c => c.id);

    const result = await extractEntities(combinedContent, chunkIds, {
      ...options,
      extractRelationships: false, // We'll do this after merging
    });

    totalTokens += result.tokensUsed;
    allEntities.push(...result.entities);

    if (result.summary) {
      summaries.push(result.summary);
    }
    if (result.documentType && !documentType) {
      documentType = result.documentType;
    }
    if (result.primaryTopic && !primaryTopic) {
      primaryTopic = result.primaryTopic;
    }
  }

  // Deduplicate entities by merging similar ones
  const mergedEntities = deduplicateEntities(allEntities);

  return {
    entities: mergedEntities,
    summary: summaries.length > 0 ? summaries[0] : undefined,
    documentType,
    primaryTopic,
    tokensUsed: totalTokens,
    processingTime: Date.now() - startTime,
  };
}

/**
 * Check if a string is a valid entity type
 */
function isValidEntityType(type: string): type is EntityType {
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
    // Phase 7: New entity types for KB-grounded generation
    'company_name',
    'company_tagline',
    'company_description',
    'mission_statement',
    'social_link',
    'nav_category',
    'brand_voice',
  ];
  return validTypes.includes(type as EntityType);
}

/**
 * Transform raw entity to typed entity
 */
function transformToEntity(raw: {
  id: string;
  type: string;
  name: string;
  description?: string;
  confidence: number;
  sourceChunkIds: string[];
  metadata?: Record<string, unknown>;
}): Entity | null {
  const base = {
    id: raw.id || `${raw.type}_${uuidv4().slice(0, 8)}`,
    name: raw.name,
    description: raw.description,
    confidence: raw.confidence,
    sourceChunkIds: raw.sourceChunkIds || [],
    metadata: raw.metadata,
  };

  const type = raw.type as EntityType;

  switch (type) {
    case 'product':
      return {
        ...base,
        type: 'product',
        features: raw.metadata?.features as string[] | undefined,
        pricing: raw.metadata?.pricing as string | undefined,
        category: raw.metadata?.category as string | undefined,
      };

    case 'service':
      return {
        ...base,
        type: 'service',
        deliverables: raw.metadata?.deliverables as string[] | undefined,
        pricing: raw.metadata?.pricing as string | undefined,
        duration: raw.metadata?.duration as string | undefined,
      };

    case 'feature':
      return {
        ...base,
        type: 'feature',
        benefit: raw.metadata?.benefit as string | undefined,
        category: raw.metadata?.category as string | undefined,
      };

    case 'benefit':
      return {
        ...base,
        type: 'benefit',
        targetAudience: raw.metadata?.targetAudience as string | undefined,
        supportingEvidence: raw.metadata?.supportingEvidence as string | undefined,
      };

    case 'pricing':
      return {
        ...base,
        type: 'pricing',
        amount: raw.metadata?.amount as string | undefined,
        currency: raw.metadata?.currency as string | undefined,
        period: raw.metadata?.period as string | undefined,
        tier: raw.metadata?.tier as string | undefined,
        features: raw.metadata?.features as string[] | undefined,
      };

    case 'testimonial':
      return {
        ...base,
        type: 'testimonial',
        quote: (raw.metadata?.quote as string) || raw.description || '',
        author: raw.metadata?.author as string | undefined,
        role: raw.metadata?.role as string | undefined,
        company: raw.metadata?.company as string | undefined,
        rating: raw.metadata?.rating as number | undefined,
      };

    case 'company':
      return {
        ...base,
        type: 'company',
        industry: raw.metadata?.industry as string | undefined,
        size: raw.metadata?.size as string | undefined,
        location: raw.metadata?.location as string | undefined,
        website: raw.metadata?.website as string | undefined,
      };

    case 'person':
      return {
        ...base,
        type: 'person',
        role: raw.metadata?.role as string | undefined,
        company: raw.metadata?.company as string | undefined,
        email: raw.metadata?.email as string | undefined,
        phone: raw.metadata?.phone as string | undefined,
      };

    case 'statistic':
      return {
        ...base,
        type: 'statistic',
        value: (raw.metadata?.value as string) || raw.name,
        metric: raw.metadata?.metric as string | undefined,
        context: raw.metadata?.context as string | undefined,
        timeframe: raw.metadata?.timeframe as string | undefined,
      };

    case 'faq':
      return {
        ...base,
        type: 'faq',
        question: (raw.metadata?.question as string) || raw.name,
        answer: (raw.metadata?.answer as string) || raw.description || '',
        category: raw.metadata?.category as string | undefined,
      };

    case 'cta':
      return {
        ...base,
        type: 'cta',
        action: (raw.metadata?.action as string) || raw.name,
        urgency: raw.metadata?.urgency as 'low' | 'medium' | 'high' | undefined,
        targetUrl: raw.metadata?.targetUrl as string | undefined,
      };

    case 'process_step':
      return {
        ...base,
        type: 'process_step',
        stepNumber: (raw.metadata?.stepNumber as number) || 1,
        action: (raw.metadata?.action as string) || raw.name,
        outcome: raw.metadata?.outcome as string | undefined,
      };

    case 'use_case':
      return {
        ...base,
        type: 'use_case',
        scenario: (raw.metadata?.scenario as string) || raw.description || '',
        solution: raw.metadata?.solution as string | undefined,
        outcome: raw.metadata?.outcome as string | undefined,
        industry: raw.metadata?.industry as string | undefined,
      };

    case 'integration':
      return {
        ...base,
        type: 'integration',
        platform: (raw.metadata?.platform as string) || raw.name,
        integrationType: raw.metadata?.integrationType as string | undefined,
        capabilities: raw.metadata?.capabilities as string[] | undefined,
      };

    case 'contact':
      return {
        ...base,
        type: 'contact',
        email: raw.metadata?.email as string | undefined,
        phone: raw.metadata?.phone as string | undefined,
        address: raw.metadata?.address as string | undefined,
        socialMedia: raw.metadata?.socialMedia as Record<string, string> | undefined,
      };

    // Phase 7: New entity types for KB-grounded generation
    case 'company_name':
      return {
        ...base,
        type: 'company_name',
        legalName: raw.metadata?.legalName as string | undefined,
        shortName: raw.metadata?.shortName as string | undefined,
        logoUrl: raw.metadata?.logoUrl as string | undefined,
      };

    case 'company_tagline':
      return {
        ...base,
        type: 'company_tagline',
        slogan: (raw.metadata?.slogan as string) || raw.name,
        isPrimary: raw.metadata?.isPrimary as boolean | undefined,
      };

    case 'company_description':
      return {
        ...base,
        type: 'company_description',
        aboutText: (raw.metadata?.aboutText as string) || raw.description || '',
        foundedYear: raw.metadata?.foundedYear as string | undefined,
        industry: raw.metadata?.industry as string | undefined,
      };

    case 'mission_statement':
      return {
        ...base,
        type: 'mission_statement',
        missionText: (raw.metadata?.missionText as string) || raw.description || '',
        visionText: raw.metadata?.visionText as string | undefined,
        values: raw.metadata?.values as string[] | undefined,
      };

    case 'social_link': {
      const platformValue = raw.metadata?.platform as string | undefined;
      const validPlatforms = ['linkedin', 'twitter', 'facebook', 'instagram', 'youtube', 'other'] as const;
      const platform = validPlatforms.includes(platformValue as typeof validPlatforms[number])
        ? (platformValue as typeof validPlatforms[number])
        : 'other';
      return {
        ...base,
        type: 'social_link',
        platform,
        url: (raw.metadata?.url as string) || '',
        handle: raw.metadata?.handle as string | undefined,
      };
    }

    case 'nav_category':
      return {
        ...base,
        type: 'nav_category',
        category: (raw.metadata?.category as string) || raw.name,
        subcategories: raw.metadata?.subcategories as string[] | undefined,
        priority: raw.metadata?.priority as number | undefined,
      };

    case 'brand_voice': {
      const toneValue = raw.metadata?.tone as string | undefined;
      const validTones = ['professional', 'casual', 'friendly', 'bold', 'technical'] as const;
      const tone = validTones.includes(toneValue as typeof validTones[number])
        ? (toneValue as typeof validTones[number])
        : 'professional';
      return {
        ...base,
        type: 'brand_voice',
        tone,
        traits: raw.metadata?.traits as string[] | undefined,
        avoidWords: raw.metadata?.avoidWords as string[] | undefined,
      };
    }

    default:
      return null;
  }
}

/**
 * Deduplicate entities by merging similar ones
 */
function deduplicateEntities(entities: Entity[]): Entity[] {
  const merged: Map<string, Entity> = new Map();

  for (const entity of entities) {
    // Create a key based on type and normalized name
    const key = `${entity.type}:${entity.name.toLowerCase().trim()}`;

    if (merged.has(key)) {
      // Merge with existing entity
      const existing = merged.get(key)!;
      merged.set(key, {
        ...existing,
        confidence: Math.max(existing.confidence, entity.confidence),
        sourceChunkIds: [...new Set([...existing.sourceChunkIds, ...entity.sourceChunkIds])],
        description: existing.description || entity.description,
        metadata: { ...existing.metadata, ...entity.metadata },
      } as Entity);
    } else {
      merged.set(key, entity);
    }
  }

  return Array.from(merged.values());
}

/**
 * Filter entities by type
 */
export function filterEntitiesByType<T extends Entity>(
  entities: Entity[],
  type: EntityType
): T[] {
  return entities.filter(e => e.type === type) as T[];
}

/**
 * Get entity statistics
 */
export function getEntityStats(entities: Entity[]): Record<EntityType, number> {
  const stats: Partial<Record<EntityType, number>> = {};

  for (const entity of entities) {
    stats[entity.type] = (stats[entity.type] || 0) + 1;
  }

  return stats as Record<EntityType, number>;
}
