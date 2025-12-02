/**
 * Content Generation & Mapping Types
 * Phase 3.3: Content Generation Agent
 *
 * Types for generating and mapping content to component slots,
 * with persona-specific variations and brand voice application.
 */

import { z } from 'zod';
import { NarrativeRole, PageType, EmotionalTone } from '@/lib/layout/types';
import { ContentBlock } from '@/lib/storyline/types';

// ============================================================================
// CONTENT SLOT TYPES
// ============================================================================

/**
 * Content slot definition for a component
 */
export interface ContentSlot {
  /** Slot identifier */
  name: string;

  /** Human-readable label */
  label: string;

  /** Slot type */
  type: 'text' | 'richtext' | 'image' | 'video' | 'link' | 'array' | 'object';

  /** Whether this slot is required */
  required: boolean;

  /** Minimum character/item count */
  minLength?: number;

  /** Maximum character/item count */
  maxLength?: number;

  /** Minimum items for array type */
  minItems?: number;

  /** Maximum items for array type */
  maxItems?: number;

  /** Default value if not provided */
  defaultValue?: unknown;

  /** Nested slots for object/array types */
  children?: ContentSlot[];
}

/**
 * Component content requirements
 */
export interface ComponentContentRequirements {
  /** Component variant ID */
  componentId: string;

  /** Required content slots */
  required: string[];

  /** Optional content slots */
  optional: string[];

  /** Full slot definitions */
  slots: ContentSlot[];

  /** Length constraints by slot name */
  lengthConstraints: Record<string, { min?: number; max?: number }>;

  /** Count constraints for array slots */
  countConstraints: Record<string, { min?: number; max?: number }>;
}

// ============================================================================
// GENERATED CONTENT TYPES
// ============================================================================

/**
 * CTA (Call-to-Action) content
 */
export interface CTAContent {
  text: string;
  link: string;
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline';
  icon?: string;
}

/**
 * Image content reference
 */
export interface ImageContent {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  caption?: string;
}

/**
 * Video content reference
 */
export interface VideoContent {
  src: string;
  poster?: string;
  title?: string;
  duration?: number;
}

/**
 * Feature item content
 */
export interface FeatureItemContent {
  title: string;
  description: string;
  icon?: string;
  image?: ImageContent;
  link?: string;
}

/**
 * Testimonial item content
 */
export interface TestimonialContent {
  quote: string;
  author: string;
  role: string;
  company: string;
  avatar?: ImageContent;
  rating?: number;
  logo?: ImageContent;
}

/**
 * Statistic item content
 */
export interface StatisticContent {
  value: string;
  label: string;
  description?: string;
  icon?: string;
  prefix?: string;
  suffix?: string;
}

/**
 * FAQ item content
 */
export interface FAQContent {
  question: string;
  answer: string;
}

/**
 * Pricing tier content
 */
export interface PricingTierContent {
  name: string;
  price: string;
  period?: string;
  description: string;
  features: string[];
  cta: CTAContent;
  highlighted?: boolean;
  badge?: string;
}

/**
 * Process step content
 */
export interface ProcessStepContent {
  step: number;
  title: string;
  description: string;
  icon?: string;
  image?: ImageContent;
}

/**
 * Logo item content
 */
export interface LogoContent {
  name: string;
  image: ImageContent;
  link?: string;
}

// ============================================================================
// POPULATED SECTION TYPES
// ============================================================================

/**
 * Populated content for a section
 */
export interface PopulatedContent {
  /** Primary headline */
  headline?: string;

  /** Secondary headline/subheadline */
  subheadline?: string;

  /** Body description text */
  description?: string;

  /** Bullet points */
  bullets?: string[];

  /** Primary CTA */
  primaryCTA?: CTAContent;

  /** Secondary CTA */
  secondaryCTA?: CTAContent;

  /** Hero/main image */
  image?: ImageContent;

  /** Background image */
  backgroundImage?: ImageContent;

  /** Video content */
  video?: VideoContent;

  /** Feature items */
  features?: FeatureItemContent[];

  /** Testimonial items */
  testimonials?: TestimonialContent[];

  /** Statistics */
  statistics?: StatisticContent[];

  /** FAQ items */
  faqs?: FAQContent[];

  /** Pricing tiers */
  pricingTiers?: PricingTierContent[];

  /** Process steps */
  processSteps?: ProcessStepContent[];

  /** Trust logos */
  logos?: LogoContent[];

  /** Section title (for lists) */
  sectionTitle?: string;

  /** Section description (for lists) */
  sectionDescription?: string;

  /** Additional custom fields */
  custom?: Record<string, unknown>;
}

/**
 * Persona-specific content variation
 */
export interface PersonaContentVariation {
  /** Persona ID */
  personaId: string;

  /** Adapted content for this persona */
  content: PopulatedContent;

  /** Emotional tone applied */
  emotionalTone: EmotionalTone;

  /** Areas of emphasis */
  emphasis?: string[];

  /** CTA approach used */
  ctaApproach?: string;
}

/**
 * Fully populated section ready for rendering
 */
export interface PopulatedSection {
  /** Section ID */
  sectionId: string;

  /** Component variant used */
  componentId: string;

  /** Narrative role/stage */
  narrativeRole: NarrativeRole;

  /** Order in page */
  order: number;

  /** Default content (used when no persona detected) */
  content: PopulatedContent;

  /** Persona-specific content variations */
  personaVariations: Record<string, PersonaContentVariation>;

  /** Generation metadata */
  metadata: {
    generatedAt: string;
    modelUsed: string;
    tokensUsed: number;
    confidenceScore: number;
    sourceEntityIds: string[];
  };
}

// ============================================================================
// CONTENT GENERATION INPUT/OUTPUT
// ============================================================================

/**
 * Input for content generation
 */
export interface ContentGenerationInput {
  /** Workspace ID */
  workspaceId: string;

  /** Website ID */
  websiteId: string;

  /** Page ID */
  pageId: string;

  /** Page type */
  pageType: PageType;

  /** Knowledge base ID */
  knowledgeBaseId: string;

  /** Selected component for each section */
  sections: {
    sectionId: string;
    componentId: string;
    narrativeRole: NarrativeRole;
    order: number;
    contentBlock?: ContentBlock;
  }[];

  /** Target personas */
  personas: string[];

  /** Brand config ID for voice/tone */
  brandConfigId?: string;

  /** Content generation hints */
  hints?: {
    focusKeywords?: string[];
    avoidTerms?: string[];
    toneOverride?: 'formal' | 'conversational' | 'bold';
    includeStats?: boolean;
    ctaPreference?: string;
  };
}

/**
 * Output from content generation
 */
export interface ContentGenerationResult {
  /** Page ID */
  pageId: string;

  /** All populated sections */
  sections: PopulatedSection[];

  /** Overall page metadata */
  pageMetadata: {
    title: string;
    description: string;
    keywords: string[];
    ogImage?: string;
  };

  /** Generation statistics */
  generationStats: {
    totalSections: number;
    sectionsGenerated: number;
    totalTokensUsed: number;
    totalTimeMs: number;
    averageConfidence: number;
    fallbacksUsed: number;
  };
}

// ============================================================================
// COPY GENERATION TYPES
// ============================================================================

/**
 * Copy generation strategy
 */
export type CopyStrategy =
  | 'benefit_focused' // Lead with benefits
  | 'feature_focused' // Lead with features
  | 'problem_solution' // Start with problem
  | 'social_proof' // Lead with credibility
  | 'story_driven' // Narrative approach
  | 'data_driven'; // Statistics and metrics

/**
 * Headline generation options
 */
export interface HeadlineOptions {
  /** Narrative stage */
  stage: NarrativeRole;

  /** Emotional tone */
  tone: EmotionalTone;

  /** Maximum length */
  maxLength: number;

  /** Strategy to use */
  strategy: CopyStrategy;

  /** Keywords to include */
  keywords?: string[];

  /** Brand voice formality */
  formality: 'formal' | 'neutral' | 'informal';
}

/**
 * Description generation options
 */
export interface DescriptionOptions {
  /** Maximum length */
  maxLength: number;

  /** Narrative stage */
  stage: NarrativeRole;

  /** Emotional tone */
  tone: EmotionalTone;

  /** Content density */
  density: 'concise' | 'balanced' | 'detailed';

  /** Include statistics */
  includeStats: boolean;

  /** Keywords to include */
  keywords?: string[];
}

/**
 * CTA generation options
 */
export interface CTAOptions {
  /** CTA strategy */
  strategy:
    | 'direct_offer'
    | 'soft_commitment'
    | 'scarcity_urgency'
    | 'value_recap'
    | 'multiple_options'
    | 'social_momentum';

  /** Buyer journey stage */
  journeyStage: 'awareness' | 'consideration' | 'decision';

  /** Primary or secondary CTA */
  variant: 'primary' | 'secondary';

  /** Communication style */
  communicationStyle: 'technical' | 'business' | 'executive';
}

// ============================================================================
// CONTENT SOURCING TYPES
// ============================================================================

/**
 * Sourced content from knowledge base
 */
export interface SourcedContent {
  /** Entity ID from knowledge base */
  entityId: string;

  /** Entity type */
  entityType: string;

  /** Raw content */
  rawContent: string;

  /** Extracted metadata */
  metadata: Record<string, unknown>;

  /** Relevance score (0-1) */
  relevanceScore: number;

  /** Suggested narrative stage */
  suggestedStage: NarrativeRole;

  /** Persona relevance scores */
  personaRelevance: Record<string, number>;
}

/**
 * Content source query
 */
export interface ContentSourceQuery {
  /** Workspace ID */
  workspaceId: string;

  /** Knowledge base ID */
  knowledgeBaseId: string;

  /** Entity types to include */
  entityTypes?: string[];

  /** Narrative stage filter */
  stage?: NarrativeRole;

  /** Persona ID for relevance */
  personaId?: string;

  /** Maximum results */
  limit?: number;
}

// ============================================================================
// ZOD SCHEMAS
// ============================================================================

export const CTAContentSchema = z.object({
  text: z.string().min(1).max(50),
  link: z.string(),
  variant: z.enum(['primary', 'secondary', 'ghost', 'outline']).optional(),
  icon: z.string().optional(),
});

export const ImageContentSchema = z.object({
  src: z.string(),
  alt: z.string(),
  width: z.number().optional(),
  height: z.number().optional(),
  caption: z.string().optional(),
});

export const FeatureItemContentSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().min(1).max(500),
  icon: z.string().optional(),
  image: ImageContentSchema.optional(),
  link: z.string().optional(),
});

export const TestimonialContentSchema = z.object({
  quote: z.string().min(10).max(500),
  author: z.string().min(1).max(100),
  role: z.string().min(1).max(100),
  company: z.string().min(1).max(100),
  avatar: ImageContentSchema.optional(),
  rating: z.number().min(1).max(5).optional(),
  logo: ImageContentSchema.optional(),
});

export const StatisticContentSchema = z.object({
  value: z.string().min(1).max(20),
  label: z.string().min(1).max(50),
  description: z.string().max(200).optional(),
  icon: z.string().optional(),
  prefix: z.string().optional(),
  suffix: z.string().optional(),
});

export const PopulatedContentSchema = z.object({
  headline: z.string().optional(),
  subheadline: z.string().optional(),
  description: z.string().optional(),
  bullets: z.array(z.string()).optional(),
  primaryCTA: CTAContentSchema.optional(),
  secondaryCTA: CTAContentSchema.optional(),
  image: ImageContentSchema.optional(),
  backgroundImage: ImageContentSchema.optional(),
  features: z.array(FeatureItemContentSchema).optional(),
  testimonials: z.array(TestimonialContentSchema).optional(),
  statistics: z.array(StatisticContentSchema).optional(),
  sectionTitle: z.string().optional(),
  sectionDescription: z.string().optional(),
  custom: z.record(z.string(), z.unknown()).optional(),
});

export const ContentGenerationInputSchema = z.object({
  workspaceId: z.string().uuid(),
  websiteId: z.string().uuid(),
  pageId: z.string().uuid(),
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
  knowledgeBaseId: z.string().uuid(),
  sections: z.array(
    z.object({
      sectionId: z.string(),
      componentId: z.string(),
      narrativeRole: z.enum(['hook', 'problem', 'solution', 'proof', 'action']),
      order: z.number(),
    })
  ),
  personas: z.array(z.string()),
  brandConfigId: z.string().uuid().optional(),
  hints: z
    .object({
      focusKeywords: z.array(z.string()).optional(),
      avoidTerms: z.array(z.string()).optional(),
      toneOverride: z.enum(['formal', 'conversational', 'bold']).optional(),
      includeStats: z.boolean().optional(),
      ctaPreference: z.string().optional(),
    })
    .optional(),
});

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type ContentGenerationInputType = z.infer<typeof ContentGenerationInputSchema>;
