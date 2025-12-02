/**
 * Runtime Module
 * Phase 4.3: Dynamic Page Runtime
 *
 * Exports for dynamic page rendering with persona-aware content adaptation.
 */

// Types
export type {
  // State types
  RuntimeState,
  // Page content types
  RuntimePageData,
  RuntimeSection,
  SectionVisibility,
  PageMetadata,
  RuntimeBrandConfig,
  RuntimeAnimationConfig,
  // Selection types
  ContentSelectionConfig,
  ContentSelectionResult,
  ContentSelectionReason,
  // Event types
  ContentAdaptationEvent,
  ContentSwapCompleteEvent,
  // Render types
  SectionRenderData,
  DynamicPageRendererProps,
  // API types
  RuntimePageResponse,
  AdaptationEventResponse,
  // Helper types
  SectionContentMap,
  TransitionState,
} from './types';

// Constants
export {
  DEFAULT_RUNTIME_STATE,
  DEFAULT_ANIMATION_CONFIG,
  DEFAULT_SELECTION_CONFIG,
} from './types';

// Content selector
export {
  ContentSelector,
  createContentSelector,
  selectContentVariant,
  getBestContent,
} from './content-selector';

// Adaptation engine
export {
  ContentAdaptationEngine,
  createAdaptationEngine,
} from './adaptation-engine';

// Page service
export {
  PageService,
  createPageService,
  getPageData,
} from './page-service';
