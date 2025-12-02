/**
 * Layout Generation Types
 * Phase 3.1: Layout Generation Agent
 *
 * Comprehensive type definitions for the layout generation system
 * including component selection, page layouts, and storytelling flow.
 */

import { z } from 'zod';

// =============================================================================
// COMPONENT CATEGORIES & TYPES
// =============================================================================

export type ComponentCategory =
  | 'hero'
  | 'features'
  | 'social-proof'
  | 'pricing'
  | 'cta'
  | 'content'
  | 'interactive'
  | 'forms'
  | 'navigation'
  | 'footer';

export type HeroVariant =
  | 'hero-split'
  | 'hero-centered'
  | 'hero-video'
  | 'hero-animated'
  | 'hero-product'
  | 'hero-minimal'
  | 'hero-interactive'
  | 'hero-stats';

export type FeaturesVariant =
  | 'features-grid'
  | 'features-alternating'
  | 'features-tabs'
  | 'features-carousel'
  | 'features-bento'
  | 'features-comparison'
  | 'features-timeline'
  | 'features-showcase'
  | 'features-icon-list'
  | 'features-accordion';

export type SocialProofVariant =
  | 'testimonials-carousel'
  | 'testimonials-grid'
  | 'logo-cloud'
  | 'case-studies'
  | 'stats-section'
  | 'awards-badges';

export type PricingVariant =
  | 'pricing-cards'
  | 'pricing-table'
  | 'pricing-calculator'
  | 'pricing-simple'
  | 'pricing-enterprise';

export type CTAVariant =
  | 'cta-banner'
  | 'cta-inline'
  | 'cta-sticky'
  | 'cta-card'
  | 'cta-email'
  | 'cta-demo'
  | 'cta-exit-intent'
  | 'cta-scroll-triggered';

export type ContentVariant =
  | 'content-rich-text'
  | 'content-columns'
  | 'content-image-text'
  | 'content-video'
  | 'content-quote'
  | 'content-faq'
  | 'content-steps'
  | 'content-glossary'
  | 'content-table'
  | 'content-code'
  | 'content-callout'
  | 'content-divider';

export type InteractiveVariant =
  | 'interactive-quiz'
  | 'interactive-survey'
  | 'interactive-calculator'
  | 'interactive-comparison'
  | 'interactive-timeline'
  | 'interactive-carousel'
  | 'interactive-map'
  | 'interactive-tabs'
  | 'interactive-modal'
  | 'interactive-drawer';

export type FormsVariant =
  | 'form-contact'
  | 'form-newsletter'
  | 'form-demo-request'
  | 'form-multi-step'
  | 'form-inline'
  | 'form-survey';

export type NavigationVariant =
  | 'nav-header'
  | 'nav-mega-menu'
  | 'nav-sidebar'
  | 'nav-breadcrumb';

export type FooterVariant =
  | 'footer-standard'
  | 'footer-minimal'
  | 'footer-cta'
  | 'footer-sitemap';

export type ComponentVariant =
  | HeroVariant
  | FeaturesVariant
  | SocialProofVariant
  | PricingVariant
  | CTAVariant
  | ContentVariant
  | InteractiveVariant
  | FormsVariant
  | NavigationVariant
  | FooterVariant;

// =============================================================================
// NARRATIVE & STORYTELLING
// =============================================================================

export type NarrativeRole = 'hook' | 'problem' | 'solution' | 'proof' | 'action';

export type EmotionalTone =
  | 'curiosity'
  | 'empathy'
  | 'urgency'
  | 'hope'
  | 'confidence'
  | 'excitement'
  | 'trust'
  | 'relief';

export interface StoryStage {
  name: string;
  narrativeRole: NarrativeRole;
  emotionalTone: EmotionalTone;
  description: string;
}

export interface StoryFlow {
  stages: StoryStage[];
}

// Default storytelling flow
export const DEFAULT_STORY_FLOW: StoryFlow = {
  stages: [
    {
      name: 'hook',
      narrativeRole: 'hook',
      emotionalTone: 'curiosity',
      description: 'Capture attention with compelling headline and value proposition',
    },
    {
      name: 'problem',
      narrativeRole: 'problem',
      emotionalTone: 'empathy',
      description: 'Acknowledge the pain points and challenges the visitor faces',
    },
    {
      name: 'agitation',
      narrativeRole: 'problem',
      emotionalTone: 'urgency',
      description: 'Amplify the cost of inaction and missed opportunities',
    },
    {
      name: 'solution',
      narrativeRole: 'solution',
      emotionalTone: 'hope',
      description: 'Present the product/service as the answer to their problems',
    },
    {
      name: 'proof',
      narrativeRole: 'proof',
      emotionalTone: 'confidence',
      description: 'Provide social proof, testimonials, and evidence of results',
    },
    {
      name: 'action',
      narrativeRole: 'action',
      emotionalTone: 'excitement',
      description: 'Drive conversion with clear call-to-action',
    },
  ],
};

// =============================================================================
// COMPONENT CONTENT REQUIREMENTS
// =============================================================================

export interface ContentRequirements {
  required: string[];
  optional: string[];
  minLength?: Record<string, number>;
  maxLength?: Record<string, number>;
  minCount?: Record<string, number>;
  maxCount?: Record<string, number>;
}

export interface PersonaFitScore {
  persona: string;
  score: number; // 0.0 - 1.0
}

export type PreferredPosition = 'top' | 'middle' | 'bottom' | 'any';

export interface PositionHints {
  preferredPosition: PreferredPosition;
  avoidAfter?: ComponentVariant[];
  preferAfter?: ComponentVariant[];
  avoidBefore?: ComponentVariant[];
  preferBefore?: ComponentVariant[];
}

// =============================================================================
// AI METADATA FOR COMPONENT SELECTION
// =============================================================================

export interface AIMetadata {
  // When AI should use this component
  useCases: string[];

  // Content requirements
  contentRequirements: ContentRequirements;

  // Best fits with personas
  personaFit: PersonaFitScore[];

  // Position preferences
  positionHints: PositionHints;

  // Storytelling role
  narrativeRole: NarrativeRole;

  // Suggested component variants based on content
  variantSelectionRules?: VariantSelectionRule[];
}

export interface VariantSelectionRule {
  condition: string;
  variant: string;
  priority: number;
}

// =============================================================================
// COMPONENT DEFINITION
// =============================================================================

export interface ComponentDefinition {
  id: ComponentVariant;
  name: string;
  category: ComponentCategory;
  description: string;
  aiMetadata: AIMetadata;
  defaultProps: Record<string, unknown>;
  responsiveConfig: ResponsiveComponentConfig;
  animationPreset?: AnimationPreset;
}

// =============================================================================
// RESPONSIVE DESIGN
// =============================================================================

export interface Breakpoints {
  sm: number; // 640 - Mobile landscape
  md: number; // 768 - Tablet
  lg: number; // 1024 - Desktop
  xl: number; // 1280 - Large desktop
  '2xl': number; // 1536 - Extra large
}

export const DEFAULT_BREAKPOINTS: Breakpoints = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
};

export interface GridConfig {
  columns: {
    mobile: number;
    tablet: number;
    desktop: number;
  };
  gutter: {
    mobile: string;
    tablet: string;
    desktop: string;
  };
  maxWidth: string;
  padding: {
    mobile: string;
    tablet: string;
    desktop: string;
  };
}

export const DEFAULT_GRID_CONFIG: GridConfig = {
  columns: {
    mobile: 4,
    tablet: 8,
    desktop: 12,
  },
  gutter: {
    mobile: '16px',
    tablet: '24px',
    desktop: '32px',
  },
  maxWidth: '1280px',
  padding: {
    mobile: '16px',
    tablet: '32px',
    desktop: '64px',
  },
};

export interface ResponsiveComponentConfig {
  stackOnMobile: boolean;
  hideOnMobile?: string[];
  showOnMobile?: string[];
  columnSpan?: {
    mobile: number;
    tablet: number;
    desktop: number;
  };
}

// =============================================================================
// ANIMATIONS
// =============================================================================

export type AnimationPreset =
  | 'fadeIn'
  | 'slideUp'
  | 'slideDown'
  | 'slideInLeft'
  | 'slideInRight'
  | 'scaleIn'
  | 'staggerChildren'
  | 'hover'
  | 'none';

export interface AnimationConfig {
  preset: AnimationPreset;
  duration?: number;
  delay?: number;
  staggerDelay?: number;
  threshold?: number; // Intersection observer threshold
}

export const ANIMATION_PRESETS: Record<
  AnimationPreset,
  {
    initial: Record<string, number>;
    animate: Record<string, number>;
    duration: number;
  }
> = {
  fadeIn: { initial: { opacity: 0 }, animate: { opacity: 1 }, duration: 0.5 },
  slideUp: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    duration: 0.5,
  },
  slideDown: {
    initial: { opacity: 0, y: -20 },
    animate: { opacity: 1, y: 0 },
    duration: 0.5,
  },
  slideInLeft: {
    initial: { opacity: 0, x: -20 },
    animate: { opacity: 1, x: 0 },
    duration: 0.5,
  },
  slideInRight: {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    duration: 0.5,
  },
  scaleIn: {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    duration: 0.3,
  },
  staggerChildren: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    duration: 0.1,
  },
  hover: { initial: { scale: 1 }, animate: { scale: 1.02 }, duration: 0.2 },
  none: { initial: {}, animate: {}, duration: 0 },
};

// =============================================================================
// PAGE TYPES
// =============================================================================

export type PageType =
  | 'home'
  | 'landing'
  | 'product'
  | 'pricing'
  | 'about'
  | 'contact'
  | 'blog'
  | 'blog-post'
  | 'case-study'
  | 'features'
  | 'solutions'
  | 'resources'
  | 'careers'
  | 'legal'
  | 'custom';

export interface PageTypeConfig {
  type: PageType;
  name: string;
  description: string;
  requiredSections: NarrativeRole[];
  recommendedComponents: ComponentVariant[];
  minSections: number;
  maxSections: number;
}

export const PAGE_TYPE_CONFIGS: Record<PageType, PageTypeConfig> = {
  home: {
    type: 'home',
    name: 'Homepage',
    description: 'Main landing page with full storytelling flow',
    requiredSections: ['hook', 'solution', 'proof', 'action'],
    recommendedComponents: [
      'hero-split',
      'features-grid',
      'testimonials-carousel',
      'cta-banner',
    ],
    minSections: 5,
    maxSections: 10,
  },
  landing: {
    type: 'landing',
    name: 'Landing Page',
    description: 'Focused conversion page for campaigns',
    requiredSections: ['hook', 'solution', 'action'],
    recommendedComponents: [
      'hero-centered',
      'features-alternating',
      'form-demo-request',
    ],
    minSections: 4,
    maxSections: 8,
  },
  product: {
    type: 'product',
    name: 'Product Page',
    description: 'Detailed product showcase',
    requiredSections: ['hook', 'solution', 'proof'],
    recommendedComponents: [
      'hero-product',
      'features-tabs',
      'pricing-cards',
      'testimonials-grid',
    ],
    minSections: 5,
    maxSections: 12,
  },
  pricing: {
    type: 'pricing',
    name: 'Pricing Page',
    description: 'Pricing plans and comparison',
    requiredSections: ['solution', 'action'],
    recommendedComponents: ['pricing-cards', 'content-faq', 'cta-inline'],
    minSections: 3,
    maxSections: 6,
  },
  about: {
    type: 'about',
    name: 'About Page',
    description: 'Company story and team',
    requiredSections: ['hook', 'proof'],
    recommendedComponents: [
      'hero-minimal',
      'content-rich-text',
      'stats-section',
    ],
    minSections: 4,
    maxSections: 8,
  },
  contact: {
    type: 'contact',
    name: 'Contact Page',
    description: 'Contact information and form',
    requiredSections: ['action'],
    recommendedComponents: ['form-contact', 'content-columns'],
    minSections: 2,
    maxSections: 4,
  },
  blog: {
    type: 'blog',
    name: 'Blog Index',
    description: 'Blog listing page',
    requiredSections: ['hook'],
    recommendedComponents: ['hero-minimal', 'content-columns'],
    minSections: 2,
    maxSections: 4,
  },
  'blog-post': {
    type: 'blog-post',
    name: 'Blog Post',
    description: 'Individual blog article',
    requiredSections: ['hook'],
    recommendedComponents: ['content-rich-text', 'cta-inline'],
    minSections: 2,
    maxSections: 5,
  },
  'case-study': {
    type: 'case-study',
    name: 'Case Study',
    description: 'Customer success story',
    requiredSections: ['problem', 'solution', 'proof'],
    recommendedComponents: [
      'hero-minimal',
      'stats-section',
      'content-quote',
      'cta-banner',
    ],
    minSections: 4,
    maxSections: 8,
  },
  features: {
    type: 'features',
    name: 'Features Page',
    description: 'Detailed features overview',
    requiredSections: ['hook', 'solution'],
    recommendedComponents: [
      'hero-split',
      'features-bento',
      'features-alternating',
    ],
    minSections: 4,
    maxSections: 10,
  },
  solutions: {
    type: 'solutions',
    name: 'Solutions Page',
    description: 'Industry or use-case solutions',
    requiredSections: ['problem', 'solution', 'proof'],
    recommendedComponents: [
      'hero-centered',
      'features-grid',
      'case-studies',
      'cta-demo',
    ],
    minSections: 5,
    maxSections: 10,
  },
  resources: {
    type: 'resources',
    name: 'Resources Page',
    description: 'Resource library and downloads',
    requiredSections: ['hook'],
    recommendedComponents: ['hero-minimal', 'content-columns', 'form-newsletter'],
    minSections: 2,
    maxSections: 5,
  },
  careers: {
    type: 'careers',
    name: 'Careers Page',
    description: 'Job listings and company culture',
    requiredSections: ['hook', 'solution'],
    recommendedComponents: [
      'hero-centered',
      'content-columns',
      'testimonials-grid',
    ],
    minSections: 4,
    maxSections: 8,
  },
  legal: {
    type: 'legal',
    name: 'Legal Page',
    description: 'Terms, privacy, and legal content',
    requiredSections: [],
    recommendedComponents: ['content-rich-text'],
    minSections: 1,
    maxSections: 2,
  },
  custom: {
    type: 'custom',
    name: 'Custom Page',
    description: 'Fully customizable page',
    requiredSections: [],
    recommendedComponents: [],
    minSections: 1,
    maxSections: 20,
  },
};

// =============================================================================
// SECTION & PAGE LAYOUT
// =============================================================================

export interface SectionContent {
  [key: string]: unknown;
}

export interface SectionStyling {
  backgroundColor?: string;
  textColor?: string;
  padding?: {
    top: string;
    bottom: string;
  };
  maxWidth?: string;
  customClasses?: string;
}

export interface InteractionConfig {
  type: 'click' | 'hover' | 'scroll' | 'form-submit';
  action: string;
  payload?: Record<string, unknown>;
}

export interface Section {
  id: string;
  componentId: ComponentVariant;
  variant?: string;
  content: SectionContent;
  styling?: SectionStyling;
  animations?: AnimationConfig;
  interactions?: InteractionConfig[];
  narrativeRole: NarrativeRole;
  order: number;
}

export interface PageMetadata {
  title: string;
  description: string;
  keywords?: string[];
  ogImage?: string;
  canonical?: string;
  noIndex?: boolean;
}

export interface PageLayout {
  pageId: string;
  slug: string;
  type: PageType;
  sections: Section[];
  metadata: PageMetadata;
  personaVariants?: PersonaPageVariant[];
}

export interface PersonaPageVariant {
  personaId: string;
  sectionOverrides: Record<string, Partial<Section>>;
  metadataOverrides: Partial<PageMetadata>;
}

// =============================================================================
// NAVIGATION STRUCTURE
// =============================================================================

export interface NavigationItem {
  id: string;
  label: string;
  href: string;
  children?: NavigationItem[];
  icon?: string;
  highlight?: boolean;
}

export interface NavigationStructure {
  primary: NavigationItem[];
  secondary?: NavigationItem[];
  footer?: NavigationItem[];
  cta?: {
    label: string;
    href: string;
    variant: 'primary' | 'secondary' | 'outline';
  };
}

// =============================================================================
// GLOBAL COMPONENTS
// =============================================================================

export interface GlobalComponent {
  id: string;
  type: 'header' | 'footer' | 'announcement-bar' | 'cookie-banner' | 'chat-widget';
  componentId: ComponentVariant;
  content: SectionContent;
  styling?: SectionStyling;
  visibility: {
    showOn: PageType[] | 'all';
    hideOn?: PageType[];
  };
}

// =============================================================================
// SITE ARCHITECTURE
// =============================================================================

export interface SiteArchitecture {
  websiteId: string;
  pages: PageLayout[];
  navigation: NavigationStructure;
  globalComponents: GlobalComponent[];
  createdAt: string;
  updatedAt: string;
}

// =============================================================================
// COMPONENT SELECTION & SCORING
// =============================================================================

export interface ComponentScore {
  componentId: ComponentVariant;
  totalScore: number;
  breakdown: {
    contentMatch: number; // 30%
    useCaseMatch: number; // 25%
    personaFit: number; // 20%
    positionMatch: number; // 15%
    narrativeFit: number; // 10%
  };
}

export interface ComponentSelectionContext {
  pageType: PageType;
  availableContent: Record<string, unknown>;
  targetPersona?: string;
  currentPosition: number;
  totalSections: number;
  previousComponents: ComponentVariant[];
  narrativeStage: NarrativeRole;
}

export interface ComponentSelectionResult {
  selected: ComponentVariant;
  score: ComponentScore;
  alternates: ComponentScore[];
  contentMapping: Record<string, string>;
}

// =============================================================================
// LAYOUT GENERATION INPUT/OUTPUT
// =============================================================================

export interface LayoutGenerationInput {
  websiteId: string;
  workspaceId: string;
  pageType: PageType;
  knowledgeBaseId?: string;
  personas?: string[];
  brandConfigId?: string;
  contentHints?: Record<string, unknown>;
  constraints?: LayoutConstraints;
}

export interface LayoutConstraints {
  maxSections?: number;
  minSections?: number;
  requiredComponents?: ComponentVariant[];
  excludedComponents?: ComponentVariant[];
  forcedOrder?: ComponentVariant[];
}

export interface LayoutGenerationResult {
  layout: PageLayout;
  componentSelections: ComponentSelectionResult[];
  generationMetadata: {
    processingTimeMs: number;
    tokensUsed: number;
    modelUsed: string;
    confidenceScore: number;
  };
}

// =============================================================================
// ZOD SCHEMAS FOR VALIDATION
// =============================================================================

export const SectionContentSchema = z.record(z.string(), z.unknown());

export const SectionStylingSchema = z.object({
  backgroundColor: z.string().optional(),
  textColor: z.string().optional(),
  padding: z
    .object({
      top: z.string(),
      bottom: z.string(),
    })
    .optional(),
  maxWidth: z.string().optional(),
  customClasses: z.string().optional(),
});

export const AnimationConfigSchema = z.object({
  preset: z.enum([
    'fadeIn',
    'slideUp',
    'slideDown',
    'slideInLeft',
    'slideInRight',
    'scaleIn',
    'staggerChildren',
    'hover',
    'none',
  ]),
  duration: z.number().optional(),
  delay: z.number().optional(),
  staggerDelay: z.number().optional(),
  threshold: z.number().optional(),
});

export const SectionSchema = z.object({
  id: z.string(),
  componentId: z.string(),
  variant: z.string().optional(),
  content: SectionContentSchema,
  styling: SectionStylingSchema.optional(),
  animations: AnimationConfigSchema.optional(),
  interactions: z
    .array(
      z.object({
        type: z.enum(['click', 'hover', 'scroll', 'form-submit']),
        action: z.string(),
        payload: z.record(z.string(), z.unknown()).optional(),
      })
    )
    .optional(),
  narrativeRole: z.enum(['hook', 'problem', 'solution', 'proof', 'action']),
  order: z.number(),
});

export const PageMetadataSchema = z.object({
  title: z.string(),
  description: z.string(),
  keywords: z.array(z.string()).optional(),
  ogImage: z.string().optional(),
  canonical: z.string().optional(),
  noIndex: z.boolean().optional(),
});

export const PageLayoutSchema = z.object({
  pageId: z.string(),
  slug: z.string(),
  type: z.enum([
    'home',
    'landing',
    'product',
    'pricing',
    'about',
    'contact',
    'blog',
    'blog-post',
    'case-study',
    'features',
    'solutions',
    'resources',
    'careers',
    'legal',
    'custom',
  ]),
  sections: z.array(SectionSchema),
  metadata: PageMetadataSchema,
  personaVariants: z
    .array(
      z.object({
        personaId: z.string(),
        sectionOverrides: z.record(z.string(), z.record(z.string(), z.unknown())),
        metadataOverrides: PageMetadataSchema.partial(),
      })
    )
    .optional(),
});

export const LayoutGenerationInputSchema = z.object({
  websiteId: z.string().uuid(),
  workspaceId: z.string().uuid(),
  pageType: z.enum([
    'home',
    'landing',
    'product',
    'pricing',
    'about',
    'contact',
    'blog',
    'blog-post',
    'case-study',
    'features',
    'solutions',
    'resources',
    'careers',
    'legal',
    'custom',
  ]),
  knowledgeBaseId: z.string().uuid().optional(),
  personas: z.array(z.string()).optional(),
  brandConfigId: z.string().uuid().optional(),
  contentHints: z.record(z.string(), z.unknown()).optional(),
  constraints: z
    .object({
      maxSections: z.number().optional(),
      minSections: z.number().optional(),
      requiredComponents: z.array(z.string()).optional(),
      excludedComponents: z.array(z.string()).optional(),
      forcedOrder: z.array(z.string()).optional(),
    })
    .optional(),
});

export type LayoutGenerationInputType = z.infer<typeof LayoutGenerationInputSchema>;
