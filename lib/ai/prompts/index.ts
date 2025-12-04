/**
 * AI Prompts Module
 *
 * Centralized exports for all AI prompt templates used in the application.
 * This module provides a single source of truth for all LLM prompts.
 *
 * Categories:
 * - Entity Extraction: Extract structured data from documents
 * - Layout Generation: Generate page layouts and component selections
 * - Content Generation: Generate marketing copy and content
 * - Chat Engine: Conversational AI and intent classification
 * - Section Generation: Dynamic website section content
 * - CTA Generation: Personalized calls-to-action
 * - Brand Extraction: Brand system generation
 * - Storyline Generation: Narrative and content strategy
 */

// Entity Extraction
export {
  ENTITY_EXTRACTION_SYSTEM_PROMPT,
  createEntityExtractionPrompt,
  RELATIONSHIP_EXTRACTION_SYSTEM_PROMPT,
  createRelationshipExtractionPrompt,
  DOCUMENT_CLASSIFICATION_PROMPT,
} from './entity-extraction';

// Layout Generation
export {
  LAYOUT_GENERATION_SYSTEM_PROMPT,
  buildLayoutGenerationPrompt,
} from './layout-generation';

// Content Generation
export {
  CONTENT_COPYWRITER_SYSTEM_PROMPT,
  PERSONA_ADAPTATION_SYSTEM_PROMPT,
  NARRATIVE_STAGE_GUIDANCE,
  buildContentGenerationPrompt,
  buildSEOMetadataPrompt,
  buildPersonaAdaptationPrompt,
} from './content-generation';

// Chat Engine
export {
  INTENT_CLASSIFICATION_SYSTEM_PROMPT,
  buildChatSystemPrompt,
  FOLLOW_UP_SUGGESTIONS_SYSTEM_PROMPT,
  buildFollowUpSuggestionsPrompt,
} from './chat-engine';
export type { IntentCategory, ChatContentType } from './chat-engine';

// Section Generation
export {
  SECTION_INTENT_CLASSIFICATION_PROMPT,
  buildSectionGenerationPrompt,
  AVAILABLE_ICONS,
} from './section-generation';
export type { SectionType } from './section-generation';

// CTA Generation
export {
  BUSINESS_ANALYSIS_SYSTEM_PROMPT,
  buildCTAGenerationPrompt,
  buildWorkspaceConfigPrompt,
  DEFAULT_CTAS,
} from './cta-generation';
export type { CTAVariant, CTACategory } from './cta-generation';

// Brand Extraction
export {
  buildBrandGenerationPrompt,
  COLOR_PALETTE_GUIDELINES,
  TYPOGRAPHY_PAIRINGS,
} from './brand-extraction';
export type { IndustryCategory, BrandTone } from './brand-extraction';

// Storyline Generation
export {
  STORYLINE_GENERATION_SYSTEM_PROMPT,
  NARRATIVE_FLOWS,
  buildStorylineExtractionPrompt,
  STAGE_CONTENT_GUIDANCE,
} from './storyline-generation';
export type { PageType } from './storyline-generation';

// Global Components Generation (Headers, Footers, Navigation)
export {
  GLOBAL_COMPONENTS_SYSTEM_PROMPT,
  determineNavigationStyle,
  buildNavigationGenerationPrompt,
  buildFooterGenerationPrompt,
  buildGlobalComponentsPrompt,
  parseHeaderContent,
  parseFooterContent,
  generateDefaultHeader,
  generateDefaultFooter,
} from './global-components';
export type { NavigationStyle, NavigationDecisionContext } from './global-components';
