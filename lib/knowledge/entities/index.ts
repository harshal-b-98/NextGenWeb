/**
 * Entities Module
 *
 * Exports for the entity extraction and storage system.
 */

// Store
export {
  storeEntity,
  storeEntitiesBatch,
  getEntitiesForItem,
  getEntitiesForWorkspace,
  searchEntities,
  deleteEntitiesForItem,
  storeRelationship,
  storeRelationshipsBatch,
  getRelationshipsForEntity,
  getEntityCountsByType,
  recordToEntity,
  type EntityRecord,
  type RelationshipRecord,
} from './store';

// Pipeline
export {
  processKnowledgeItemEntities,
  reprocessKnowledgeItemEntities,
  getTypedEntitiesForItem,
  calculateEntityStats,
  type EntityPipelineOptions,
  type EntityPipelineResult,
  type EntityExtractionStats,
} from './pipeline';
