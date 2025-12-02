/**
 * Storyline Module Exports
 *
 * Re-exports all storyline-related types, functions, and constants.
 */

// Types
export type {
  CoreNarrative,
  ContentBlock,
  PersonaStoryVariation,
  PersonaNarrativeAdaptation,
  EmotionalJourney,
  EmotionalPoint,
  StorylineGenerationInput,
  StorylineGenerationResult,
  NarrativeTemplate,
  HookStrategy,
  CTAStrategy,
  ProblemArticulation,
  SolutionPositioning,
  ProofStrategy,
} from './types';

// Schemas
export {
  CoreNarrativeSchema,
  ContentBlockSchema,
  PersonaNarrativeAdaptationSchema,
  EmotionalJourneySchema,
  StorylineGenerationInputSchema,
} from './types';

// Templates
export {
  NARRATIVE_TEMPLATES,
  EMOTIONAL_JOURNEY_TEMPLATES,
  HOOK_STRATEGY_PROMPTS,
  CTA_STRATEGY_PROMPTS,
  getDefaultStoryFlow,
  generateEmotionalJourney,
} from './templates';

// Generation
export {
  StorylineGenerationAgent,
  generateStoryline,
  saveStoryline,
} from './generation';

// Optimizer
export type {
  OptimizationRule,
  OptimizationViolation,
  OptimizationResult,
  ContentDistributionAnalysis,
} from './optimizer';

export {
  NarrativeFlowOptimizer,
  sortContentBlocks,
  validateStoryline,
  optimizePersonaVariations,
  analyzeContentDistribution,
  optimizationRules,
} from './optimizer';
