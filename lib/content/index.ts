/**
 * Content Generation Module
 * Phase 3.3: Content Generation & Mapping
 *
 * Exports all content generation functionality including:
 * - ContentGenerationAgent for AI-powered content creation
 * - Content slot definitions and validation
 * - Copy generation utilities
 */

// Types
export type {
  ContentSlot,
  ComponentContentRequirements,
  CTAContent,
  ImageContent,
  VideoContent,
  FeatureItemContent,
  TestimonialContent,
  StatisticContent,
  FAQContent,
  PricingTierContent,
  ProcessStepContent,
  LogoContent,
  PopulatedContent,
  PersonaContentVariation,
  PopulatedSection,
  ContentGenerationInput,
  ContentGenerationResult,
  CopyStrategy,
  HeadlineOptions,
  DescriptionOptions,
  CTAOptions,
  SourcedContent,
  ContentSourceQuery,
} from './types';

// Schemas
export {
  CTAContentSchema,
  ImageContentSchema,
  FeatureItemContentSchema,
  TestimonialContentSchema,
  StatisticContentSchema,
  PopulatedContentSchema,
  ContentGenerationInputSchema,
} from './types';

// Content Generation Agent
export {
  ContentGenerationAgent,
  generateContent,
  saveGeneratedContent,
  generateHeadline,
  generateDescription,
  generateCTA,
} from './generation';

// Slot Definitions
export {
  COMPONENT_SLOT_DEFINITIONS,
  getComponentSlots,
  getRequiredSlots,
  getOptionalSlots,
  getSlotConstraints,
  getComponentContentRequirements,
  validateContent,
  getSuggestedContentStructure,
} from './slots';
