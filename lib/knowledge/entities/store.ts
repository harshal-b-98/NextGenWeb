/**
 * Entity Store
 *
 * Database operations for storing and retrieving extracted entities.
 */

import { createClient } from '@/lib/supabase/server';
import type { Json } from '@/types/database';
import type { Entity, EntityRelationship, EntityType } from '@/lib/ai/types';

/**
 * Entity record from database
 */
export interface EntityRecord {
  id: string;
  workspace_id: string;
  knowledge_item_id: string;
  entity_type: string;
  name: string;
  description: string | null;
  confidence: number;
  source_chunk_ids: string[];
  metadata: Json;
  created_at: string;
  updated_at: string;
}

/**
 * Relationship record from database
 */
export interface RelationshipRecord {
  id: string;
  workspace_id: string;
  source_entity_id: string;
  target_entity_id: string;
  relationship_type: string;
  confidence: number;
  metadata: Json;
  created_at: string;
}

/**
 * Store a single entity
 */
export async function storeEntity(
  workspaceId: string,
  knowledgeItemId: string,
  entity: Entity
): Promise<string> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('knowledge_entities')
    .insert({
      workspace_id: workspaceId,
      knowledge_item_id: knowledgeItemId,
      entity_type: entity.type,
      name: entity.name,
      description: entity.description || null,
      confidence: entity.confidence,
      source_chunk_ids: entity.sourceChunkIds,
      metadata: entityToMetadata(entity),
    })
    .select('id')
    .single();

  if (error) {
    throw new Error(`Failed to store entity: ${error.message}`);
  }

  return data.id;
}

/**
 * Store multiple entities in batch
 */
export async function storeEntitiesBatch(
  workspaceId: string,
  knowledgeItemId: string,
  entities: Entity[]
): Promise<string[]> {
  if (entities.length === 0) {
    return [];
  }

  const supabase = await createClient();

  const records = entities.map(entity => ({
    workspace_id: workspaceId,
    knowledge_item_id: knowledgeItemId,
    entity_type: entity.type,
    name: entity.name,
    description: entity.description || null,
    confidence: entity.confidence,
    source_chunk_ids: entity.sourceChunkIds,
    metadata: entityToMetadata(entity),
  }));

  const { data, error } = await supabase
    .from('knowledge_entities')
    .insert(records)
    .select('id');

  if (error) {
    throw new Error(`Failed to store entities batch: ${error.message}`);
  }

  return data.map(d => d.id);
}

/**
 * Get entities for a knowledge item
 */
export async function getEntitiesForItem(
  knowledgeItemId: string
): Promise<EntityRecord[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('knowledge_entities')
    .select('*')
    .eq('knowledge_item_id', knowledgeItemId)
    .order('confidence', { ascending: false });

  if (error) {
    throw new Error(`Failed to get entities: ${error.message}`);
  }

  return data || [];
}

/**
 * Get entities for a workspace
 */
export async function getEntitiesForWorkspace(
  workspaceId: string,
  options?: {
    entityType?: EntityType;
    minConfidence?: number;
    limit?: number;
    offset?: number;
  }
): Promise<EntityRecord[]> {
  const supabase = await createClient();
  const { entityType, minConfidence = 0, limit = 100, offset = 0 } = options || {};

  let query = supabase
    .from('knowledge_entities')
    .select('*')
    .eq('workspace_id', workspaceId)
    .gte('confidence', minConfidence)
    .order('confidence', { ascending: false })
    .range(offset, offset + limit - 1);

  if (entityType) {
    query = query.eq('entity_type', entityType);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to get workspace entities: ${error.message}`);
  }

  return data || [];
}

/**
 * Search entities by name
 */
export async function searchEntities(
  workspaceId: string,
  searchTerm: string,
  options?: {
    entityTypes?: EntityType[];
    minConfidence?: number;
    limit?: number;
  }
): Promise<EntityRecord[]> {
  const supabase = await createClient();
  const { entityTypes, minConfidence = 0, limit = 50 } = options || {};

  let query = supabase
    .from('knowledge_entities')
    .select('*')
    .eq('workspace_id', workspaceId)
    .gte('confidence', minConfidence)
    .ilike('name', `%${searchTerm}%`)
    .limit(limit);

  if (entityTypes && entityTypes.length > 0) {
    query = query.in('entity_type', entityTypes);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to search entities: ${error.message}`);
  }

  return data || [];
}

/**
 * Delete entities for a knowledge item
 */
export async function deleteEntitiesForItem(knowledgeItemId: string): Promise<number> {
  const supabase = await createClient();

  const { error, count } = await supabase
    .from('knowledge_entities')
    .delete()
    .eq('knowledge_item_id', knowledgeItemId);

  if (error) {
    throw new Error(`Failed to delete entities: ${error.message}`);
  }

  return count || 0;
}

/**
 * Store a relationship between entities
 */
export async function storeRelationship(
  workspaceId: string,
  relationship: EntityRelationship
): Promise<string> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('knowledge_entity_relationships')
    .insert({
      workspace_id: workspaceId,
      source_entity_id: relationship.sourceEntityId,
      target_entity_id: relationship.targetEntityId,
      relationship_type: relationship.relationshipType,
      confidence: relationship.confidence,
      metadata: (relationship.metadata || {}) as Json,
    })
    .select('id')
    .single();

  if (error) {
    throw new Error(`Failed to store relationship: ${error.message}`);
  }

  return data.id;
}

/**
 * Store multiple relationships in batch
 */
export async function storeRelationshipsBatch(
  workspaceId: string,
  relationships: EntityRelationship[]
): Promise<string[]> {
  if (relationships.length === 0) {
    return [];
  }

  const supabase = await createClient();

  const records = relationships.map(rel => ({
    workspace_id: workspaceId,
    source_entity_id: rel.sourceEntityId,
    target_entity_id: rel.targetEntityId,
    relationship_type: rel.relationshipType,
    confidence: rel.confidence,
    metadata: (rel.metadata || {}) as Json,
  }));

  const { data, error } = await supabase
    .from('knowledge_entity_relationships')
    .insert(records)
    .select('id');

  if (error) {
    throw new Error(`Failed to store relationships batch: ${error.message}`);
  }

  return data.map(d => d.id);
}

/**
 * Get relationships for an entity
 */
export async function getRelationshipsForEntity(
  entityId: string,
  options?: {
    direction?: 'outgoing' | 'incoming' | 'both';
    relationshipType?: string;
  }
): Promise<RelationshipRecord[]> {
  const supabase = await createClient();
  const { direction = 'both', relationshipType } = options || {};

  let query = supabase.from('knowledge_entity_relationships').select('*');

  if (direction === 'outgoing') {
    query = query.eq('source_entity_id', entityId);
  } else if (direction === 'incoming') {
    query = query.eq('target_entity_id', entityId);
  } else {
    query = query.or(`source_entity_id.eq.${entityId},target_entity_id.eq.${entityId}`);
  }

  if (relationshipType) {
    query = query.eq('relationship_type', relationshipType);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to get relationships: ${error.message}`);
  }

  return data || [];
}

/**
 * Get entity count by type for a workspace
 */
export async function getEntityCountsByType(
  workspaceId: string
): Promise<Record<string, number>> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('knowledge_entities')
    .select('entity_type')
    .eq('workspace_id', workspaceId);

  if (error) {
    throw new Error(`Failed to get entity counts: ${error.message}`);
  }

  const counts: Record<string, number> = {};
  for (const row of data || []) {
    counts[row.entity_type] = (counts[row.entity_type] || 0) + 1;
  }

  return counts;
}

/**
 * Convert entity to metadata JSON
 */
function entityToMetadata(entity: Entity): Json {
  // Extract type-specific fields
  const { id, type, name, description, confidence, sourceChunkIds, metadata, ...typeFields } = entity;
  return {
    ...typeFields,
    ...metadata,
  } as Json;
}

/**
 * Convert database record to Entity
 */
export function recordToEntity(record: EntityRecord): Entity {
  const base = {
    id: record.id,
    name: record.name,
    description: record.description || undefined,
    confidence: record.confidence,
    sourceChunkIds: record.source_chunk_ids,
    metadata: record.metadata as Record<string, unknown>,
  };

  const meta = record.metadata as Record<string, unknown>;
  const type = record.entity_type as EntityType;

  switch (type) {
    case 'product':
      return {
        ...base,
        type: 'product',
        features: meta.features as string[] | undefined,
        pricing: meta.pricing as string | undefined,
        category: meta.category as string | undefined,
      };
    case 'service':
      return {
        ...base,
        type: 'service',
        deliverables: meta.deliverables as string[] | undefined,
        pricing: meta.pricing as string | undefined,
        duration: meta.duration as string | undefined,
      };
    case 'feature':
      return {
        ...base,
        type: 'feature',
        benefit: meta.benefit as string | undefined,
        category: meta.category as string | undefined,
      };
    case 'benefit':
      return {
        ...base,
        type: 'benefit',
        targetAudience: meta.targetAudience as string | undefined,
        supportingEvidence: meta.supportingEvidence as string | undefined,
      };
    case 'pricing':
      return {
        ...base,
        type: 'pricing',
        amount: meta.amount as string | undefined,
        currency: meta.currency as string | undefined,
        period: meta.period as string | undefined,
        tier: meta.tier as string | undefined,
        features: meta.features as string[] | undefined,
      };
    case 'testimonial':
      return {
        ...base,
        type: 'testimonial',
        quote: (meta.quote as string) || '',
        author: meta.author as string | undefined,
        role: meta.role as string | undefined,
        company: meta.company as string | undefined,
        rating: meta.rating as number | undefined,
      };
    case 'company':
      return {
        ...base,
        type: 'company',
        industry: meta.industry as string | undefined,
        size: meta.size as string | undefined,
        location: meta.location as string | undefined,
        website: meta.website as string | undefined,
      };
    case 'person':
      return {
        ...base,
        type: 'person',
        role: meta.role as string | undefined,
        company: meta.company as string | undefined,
        email: meta.email as string | undefined,
        phone: meta.phone as string | undefined,
      };
    case 'statistic':
      return {
        ...base,
        type: 'statistic',
        value: (meta.value as string) || '',
        metric: meta.metric as string | undefined,
        context: meta.context as string | undefined,
        timeframe: meta.timeframe as string | undefined,
      };
    case 'faq':
      return {
        ...base,
        type: 'faq',
        question: (meta.question as string) || '',
        answer: (meta.answer as string) || '',
        category: meta.category as string | undefined,
      };
    case 'cta':
      return {
        ...base,
        type: 'cta',
        action: (meta.action as string) || '',
        urgency: meta.urgency as 'low' | 'medium' | 'high' | undefined,
        targetUrl: meta.targetUrl as string | undefined,
      };
    case 'process_step':
      return {
        ...base,
        type: 'process_step',
        stepNumber: (meta.stepNumber as number) || 1,
        action: (meta.action as string) || '',
        outcome: meta.outcome as string | undefined,
      };
    case 'use_case':
      return {
        ...base,
        type: 'use_case',
        scenario: (meta.scenario as string) || '',
        solution: meta.solution as string | undefined,
        outcome: meta.outcome as string | undefined,
        industry: meta.industry as string | undefined,
      };
    case 'integration':
      return {
        ...base,
        type: 'integration',
        platform: (meta.platform as string) || '',
        integrationType: meta.integrationType as string | undefined,
        capabilities: meta.capabilities as string[] | undefined,
      };
    case 'contact':
      return {
        ...base,
        type: 'contact',
        email: meta.email as string | undefined,
        phone: meta.phone as string | undefined,
        address: meta.address as string | undefined,
        socialMedia: meta.socialMedia as Record<string, string> | undefined,
      };
    default:
      // Return as generic entity
      return {
        ...base,
        type: type,
      } as Entity;
  }
}
