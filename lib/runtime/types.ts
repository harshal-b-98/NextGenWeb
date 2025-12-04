/**
 * Dynamic Page Runtime Types
 * Phase 4.3: Dynamic Page Runtime
 *
 * Types for runtime content adaptation and persona-aware page rendering.
 */

import type { PopulatedContent, PopulatedSection } from '@/lib/content/types';
import type { PersonaMatch } from '@/lib/personas/types';

// ============================================================================
// RUNTIME STATE TYPES
// ============================================================================

/**
 * Current state of the dynamic page runtime
 */
export interface RuntimeState {
  /** Current page ID */
  pageId: string;

  /** Website ID */
  websiteId: string;

  /** Tracking session ID */
  sessionId: string | null;

  /** Visitor ID */
  visitorId: string | null;

  /** Whether runtime is initialized */
  isInitialized: boolean;

  /** Current loading state */
  isLoading: boolean;

  /** Active persona variant being displayed */
  activeVariant: 'default' | string;

  /** Current persona detection result */
  currentPersona: PersonaMatch | null;

  /** Previous persona (for transition tracking) */
  previousPersona: PersonaMatch | null;

  /** Whether a content transition is in progress */
  isTransitioning: boolean;

  /** Last adaptation timestamp */
  lastAdaptationAt: string | null;

  /** Error if any */
  error: string | null;
}

/**
 * Default runtime state
 */
export const DEFAULT_RUNTIME_STATE: RuntimeState = {
  pageId: '',
  websiteId: '',
  sessionId: null,
  visitorId: null,
  isInitialized: false,
  isLoading: true,
  activeVariant: 'default',
  currentPersona: null,
  previousPersona: null,
  isTransitioning: false,
  lastAdaptationAt: null,
  error: null,
};

// ============================================================================
// PAGE CONTENT TYPES
// ============================================================================

/**
 * Complete page data for runtime rendering
 */
export interface RuntimePageData {
  /** Page ID */
  pageId: string;

  /** Website ID */
  websiteId: string;

  /** Page title */
  title: string;

  /** Page slug */
  slug: string;

  /** Page path */
  path: string;

  /** All sections with content */
  sections: RuntimeSection[];

  /** Page metadata for SEO */
  metadata: PageMetadata;

  /** Available persona variants */
  availablePersonas: string[];

  /** Brand configuration */
  brandConfig?: RuntimeBrandConfig;

  /** Animation configuration */
  animationConfig?: RuntimeAnimationConfig;
}

/**
 * Section data for runtime
 */
export interface RuntimeSection {
  /** Section ID */
  sectionId: string;

  /** Component to render */
  componentId: string;

  /** Section order */
  order: number;

  /** Narrative role */
  narrativeRole: string;

  /** Default content */
  defaultContent: PopulatedContent;

  /** Persona-specific content variations */
  personaVariants: Record<string, PopulatedContent>;

  /** Which content fields differ between variants */
  variantFields: string[];

  /** Section visibility rules */
  visibility?: SectionVisibility;
}

/**
 * Section visibility configuration
 */
export interface SectionVisibility {
  /** Show to all by default */
  defaultVisible: boolean;

  /** Personas for which this section should be hidden */
  hideForPersonas?: string[];

  /** Personas for which this section should be shown */
  showOnlyForPersonas?: string[];
}

/**
 * Page metadata
 */
export interface PageMetadata {
  /** Page title */
  title: string;

  /** Meta description */
  description: string;

  /** Meta keywords */
  keywords: string[];

  /** Open Graph image */
  ogImage?: string;

  /** Canonical URL */
  canonicalUrl?: string;
}

/**
 * Brand configuration for runtime
 */
export interface RuntimeBrandConfig {
  /** Primary brand color */
  primaryColor: string;

  /** Secondary brand color */
  secondaryColor: string;

  /** Accent color */
  accentColor: string;

  /** Font family */
  fontFamily: string;

  /** Heading font */
  headingFont?: string;

  /** Logo URL */
  logoUrl?: string;
}

/**
 * Animation configuration for runtime
 */
export interface RuntimeAnimationConfig {
  /** Global animation enabled */
  enabled: boolean;

  /** Default transition duration (ms) */
  transitionDuration: number;

  /** Content swap animation type */
  swapAnimation: 'fade' | 'slide' | 'crossfade' | 'none';

  /** Section entrance animation */
  entranceAnimation?: 'fade-up' | 'fade-in' | 'slide-in' | 'none';

  /** Stagger delay for section animations (ms) */
  staggerDelay: number;
}

/**
 * Default animation config
 */
export const DEFAULT_ANIMATION_CONFIG: RuntimeAnimationConfig = {
  enabled: true,
  transitionDuration: 300,
  swapAnimation: 'crossfade',
  entranceAnimation: 'fade-up',
  staggerDelay: 100,
};

// ============================================================================
// CONTENT SELECTION TYPES
// ============================================================================

/**
 * Configuration for content selection
 */
export interface ContentSelectionConfig {
  /** Minimum confidence to trigger content swap */
  confidenceThreshold: number;

  /** Minimum confidence increase to trigger re-swap */
  confidenceHysteresis: number;

  /** Whether to use fallback content on low confidence */
  useFallback: boolean;

  /** Fallback persona ID (usually 'default') */
  fallbackVariant: string;

  /** Whether to track content selections */
  trackSelections: boolean;
}

/**
 * Default content selection config
 */
export const DEFAULT_SELECTION_CONFIG: ContentSelectionConfig = {
  confidenceThreshold: 0.5,
  confidenceHysteresis: 0.05,
  useFallback: true,
  fallbackVariant: 'default',
  trackSelections: true,
};

/**
 * Result of content selection
 */
export interface ContentSelectionResult {
  /** Selected variant ID */
  variantId: string;

  /** Whether this was a swap from previous content */
  wasSwapped: boolean;

  /** Previous variant (if swapped) */
  previousVariant?: string;

  /** Selection reason */
  reason: ContentSelectionReason;

  /** Confidence score at selection time */
  confidence: number;

  /** Sections that changed */
  changedSections: string[];
}

/**
 * Reason for content selection
 */
export type ContentSelectionReason =
  | 'initial_load'
  | 'persona_detected'
  | 'persona_changed'
  | 'confidence_increased'
  | 'manual_override'
  | 'fallback_used'
  | 'no_variant_available';

// ============================================================================
// CONTENT ADAPTATION EVENT TYPES
// ============================================================================

/**
 * Event emitted when content is adapted
 */
export interface ContentAdaptationEvent {
  /** Event type */
  type: 'content_adaptation';

  /** Page ID */
  pageId: string;

  /** Website ID */
  websiteId: string;

  /** Session ID */
  sessionId: string;

  /** Persona ID (optional, maps to detected persona) */
  personaId?: string;

  /** Previous persona ID (or 'default') */
  fromVariant: string;

  /** New persona ID */
  toVariant: string;

  /** Section IDs that were adapted */
  adaptedSections: string[];

  /** Detection confidence */
  confidence: number;

  /** Selection reason */
  reason: ContentSelectionReason;

  /** Transition duration used (ms) */
  transitionDuration: number;

  /** Event timestamp */
  timestamp: string;
}

/**
 * Event emitted when content swap completes
 */
export interface ContentSwapCompleteEvent {
  /** Event type */
  type: 'content_swap_complete';

  /** Page ID */
  pageId: string;

  /** Session ID */
  sessionId: string;

  /** Active variant after swap */
  activeVariant: string;

  /** Time taken for swap (ms) */
  swapDuration: number;

  /** Timestamp */
  timestamp: string;
}

// ============================================================================
// RENDER DATA TYPES
// ============================================================================

/**
 * Data passed to section renderer
 */
export interface SectionRenderData {
  /** Section configuration */
  section: RuntimeSection;

  /** Content to render (already selected for current persona) */
  content: PopulatedContent;

  /** Brand configuration */
  brandConfig?: RuntimeBrandConfig;

  /** Animation configuration */
  animationConfig?: RuntimeAnimationConfig;

  /** Whether this section is transitioning */
  isTransitioning: boolean;

  /** Section index for stagger animations */
  index: number;
}

/**
 * Props for section wrapper component (used for feedback overlays)
 */
export interface SectionWrapperProps {
  sectionId: string;
  componentId: string;
  children: React.ReactNode;
}

/**
 * Props for dynamic page renderer
 */
export interface DynamicPageRendererProps {
  /** Page data */
  pageData: RuntimePageData;

  /** Initial tracking session ID */
  initialSessionId?: string;

  /** Initial visitor ID */
  initialVisitorId?: string;

  /** Whether to auto-initialize tracking */
  autoInitTracking?: boolean;

  /** Force a specific persona ID for preview mode */
  forcedPersonaId?: string;

  /** Content selection configuration override */
  selectionConfig?: Partial<ContentSelectionConfig>;

  /** Animation configuration override */
  animationConfig?: Partial<RuntimeAnimationConfig>;

  /** Callback when persona is detected */
  onPersonaDetected?: (persona: PersonaMatch) => void;

  /** Callback when content is adapted */
  onContentAdapted?: (event: ContentAdaptationEvent) => void;

  /** Callback on error */
  onError?: (error: string) => void;

  /** Optional wrapper component for each section (used for feedback overlays) */
  sectionWrapper?: React.ComponentType<SectionWrapperProps>;
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

/**
 * Response from page data API
 */
export interface RuntimePageResponse {
  success: boolean;
  data?: RuntimePageData;
  error?: string;
}

/**
 * Response from adaptation event API
 */
export interface AdaptationEventResponse {
  success: boolean;
  eventId?: string;
  error?: string;
}

// ============================================================================
// HELPER TYPES
// ============================================================================

/**
 * Map of section ID to selected content
 */
export type SectionContentMap = Record<string, PopulatedContent>;

/**
 * Transition state for animations
 */
export interface TransitionState {
  /** Whether currently transitioning */
  isActive: boolean;

  /** Sections currently transitioning */
  transitioningSections: string[];

  /** Start timestamp */
  startTime: number;

  /** Expected duration */
  duration: number;
}
