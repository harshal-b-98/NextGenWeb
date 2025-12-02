/**
 * Entity Extraction Pipeline
 *
 * End-to-end pipeline for extracting entities from knowledge base items.
 */

import {
  extractEntities,
  extractEntitiesFromChunks,
  extractRelationships,
  type EntityExtractionOptions,
} from '@/lib/ai/agents/entity-extraction';
import type { Entity, EntityRelationship, LLMConfig } from '@/lib/ai/types';
import { getEmbeddingsForItem } from '../embeddings/store';
import {
  storeEntitiesBatch,
  storeRelationshipsBatch,
  deleteEntitiesForItem,
  getEntitiesForItem,
  recordToEntity,
} from './store';

/**
 * Pipeline options
 */
export interface EntityPipelineOptions {
  /** Workspace ID */
  workspaceId: string;
  /** Knowledge item ID */
  knowledgeItemId: string;
  /** Extract relationships between entities */
  extractRelationships?: boolean;
  /** Entity extraction options */
  extractionOptions?: Omit<EntityExtractionOptions, 'extractRelationships'>;
  /** LLM configuration */
  llmConfig?: Partial<LLMConfig>;
}

/**
 * Pipeline result
 */
export interface EntityPipelineResult {
  /** Extracted entities */
  entities: Entity[];
  /** Entity relationships (if extracted) */
  relationships?: EntityRelationship[];
  /** Number of entities stored */
  entityCount: number;
  /** Number of relationships stored */
  relationshipCount: number;
  /** Document summary */
  summary?: string;
  /** Document type classification */
  documentType?: string;
  /** Primary topic */
  primaryTopic?: string;
  /** Total tokens used */
  tokensUsed: number;
  /** Processing time in ms */
  processingTime: number;
}

/**
 * Process a knowledge item to extract entities
 *
 * This pipeline:
 * 1. Retrieves the chunks/embeddings for a knowledge item
 * 2. Extracts entities using the LLM
 * 3. Optionally extracts relationships
 * 4. Stores everything in the database
 */
export async function processKnowledgeItemEntities(
  content: string,
  options: EntityPipelineOptions
): Promise<EntityPipelineResult> {
  const startTime = Date.now();
  const {
    workspaceId,
    knowledgeItemId,
    extractRelationships: shouldExtractRelationships = true,
    extractionOptions = {},
    llmConfig,
  } = options;

  let totalTokens = 0;

  // Get existing chunks for the knowledge item
  const embeddings = await getEmbeddingsForItem(knowledgeItemId);

  let entities: Entity[];
  let summary: string | undefined;
  let documentType: string | undefined;
  let primaryTopic: string | undefined;

  if (embeddings.length > 0) {
    // Use chunk-based extraction
    const chunks = embeddings.map(e => ({
      id: e.id,
      content: e.chunk_text,
    }));

    const result = await extractEntitiesFromChunks(chunks, {
      ...extractionOptions,
      llmConfig,
    });

    entities = result.entities;
    summary = result.summary;
    documentType = result.documentType;
    primaryTopic = result.primaryTopic;
    totalTokens += result.tokensUsed;
  } else {
    // Fall back to full content extraction
    const result = await extractEntities(content, [knowledgeItemId], {
      ...extractionOptions,
      llmConfig,
    });

    entities = result.entities;
    summary = result.summary;
    documentType = result.documentType;
    primaryTopic = result.primaryTopic;
    totalTokens += result.tokensUsed;
  }

  // Extract relationships if requested
  let relationships: EntityRelationship[] = [];
  if (shouldExtractRelationships && entities.length >= 2) {
    relationships = await extractRelationships(entities, { llmConfig });
  }

  // Store entities in database
  const entityIds = await storeEntitiesBatch(workspaceId, knowledgeItemId, entities);

  // Map entity IDs from extraction to database IDs
  const idMap = new Map<string, string>();
  entities.forEach((entity, index) => {
    idMap.set(entity.id, entityIds[index]);
  });

  // Update relationship IDs and store
  let relationshipCount = 0;
  if (relationships.length > 0) {
    const updatedRelationships = relationships
      .map(rel => ({
        ...rel,
        sourceEntityId: idMap.get(rel.sourceEntityId) || rel.sourceEntityId,
        targetEntityId: idMap.get(rel.targetEntityId) || rel.targetEntityId,
      }))
      .filter(rel =>
        // Only store relationships where both entities were successfully stored
        idMap.has(rel.sourceEntityId) || entityIds.includes(rel.sourceEntityId)
      );

    if (updatedRelationships.length > 0) {
      await storeRelationshipsBatch(workspaceId, updatedRelationships);
      relationshipCount = updatedRelationships.length;
    }
  }

  return {
    entities,
    relationships: relationships.length > 0 ? relationships : undefined,
    entityCount: entityIds.length,
    relationshipCount,
    summary,
    documentType,
    primaryTopic,
    tokensUsed: totalTokens,
    processingTime: Date.now() - startTime,
  };
}

/**
 * Reprocess entities for a knowledge item
 *
 * Deletes existing entities and re-extracts from content
 */
export async function reprocessKnowledgeItemEntities(
  content: string,
  options: EntityPipelineOptions
): Promise<EntityPipelineResult> {
  // Delete existing entities
  await deleteEntitiesForItem(options.knowledgeItemId);

  // Re-extract entities
  return processKnowledgeItemEntities(content, options);
}

/**
 * Get entities for a knowledge item as typed Entity objects
 */
export async function getTypedEntitiesForItem(knowledgeItemId: string): Promise<Entity[]> {
  const records = await getEntitiesForItem(knowledgeItemId);
  return records.map(recordToEntity);
}

/**
 * Entity extraction statistics
 */
export interface EntityExtractionStats {
  totalEntities: number;
  byType: Record<string, number>;
  averageConfidence: number;
  highConfidenceCount: number;
  lowConfidenceCount: number;
}

/**
 * Get statistics about extracted entities
 */
export function calculateEntityStats(entities: Entity[]): EntityExtractionStats {
  const byType: Record<string, number> = {};
  let totalConfidence = 0;
  let highConfidenceCount = 0;
  let lowConfidenceCount = 0;

  for (const entity of entities) {
    byType[entity.type] = (byType[entity.type] || 0) + 1;
    totalConfidence += entity.confidence;

    if (entity.confidence >= 0.8) {
      highConfidenceCount++;
    } else if (entity.confidence < 0.6) {
      lowConfidenceCount++;
    }
  }

  return {
    totalEntities: entities.length,
    byType,
    averageConfidence: entities.length > 0 ? totalConfidence / entities.length : 0,
    highConfidenceCount,
    lowConfidenceCount,
  };
}
