/**
 * Full Page Generation Pipeline Module
 * Phase 3.4: Full Page Generation Pipeline
 *
 * Exports all page generation pipeline functionality including:
 * - PageGenerationOrchestrator for end-to-end page generation
 * - Page assembly and validation utilities
 * - Types and schemas for pipeline operations
 */

// Types
export type {
  FullPageGenerationInput,
  LayoutStageResult,
  StorylineStageResult,
  ContentStageResult,
  RenderSection,
  PageRenderData,
  FullPageGenerationOutput,
  FullPageGenerationSummary,
  PipelineStatus,
  GenerationProgress,
  PageContentStructure,
} from './types';

// Schemas
export { FullPageGenerationInputSchema } from './types';

// Orchestrator
export {
  PageGenerationOrchestrator,
  generateFullPage,
  generateFullPageSummary,
} from './orchestrator';

// Assembler utilities
export {
  extractRenderData,
  getRenderDataForPersona,
  getEmotionalToneForRole,
  validatePageContent,
  validateRenderData,
  serializePageOutput,
  preparePagePreview,
  comparePageVersions,
  mergeContentEdits,
} from './assembler';
export type { PageValidationResult } from './assembler';
