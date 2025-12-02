/**
 * Full Page Generation Pipeline Types
 * Phase 3.4: Full Page Generation Pipeline
 *
 * Types for orchestrating the complete page generation workflow
 * that integrates Layout, Storyline, and Content generation.
 */

import { z } from 'zod';
import { PageType, NarrativeRole, EmotionalTone, StoryFlow } from '@/lib/layout/types';
import { PageLayout, Section, PageMetadata, PersonaPageVariant } from '@/lib/layout/types';
import {
  CoreNarrative,
  ContentBlock,
  PersonaStoryVariation,
  EmotionalJourney,
  StorylineGenerationResult,
} from '@/lib/storyline/types';
import {
  PopulatedSection,
  PopulatedContent,
  PersonaContentVariation,
} from '@/lib/content/types';

// ============================================================================
// PIPELINE INPUT TYPES
// ============================================================================

/**
 * Full page generation input
 */
export interface FullPageGenerationInput {
  /** Workspace ID */
  workspaceId: string;

  /** Website ID */
  websiteId: string;

  /** Page ID (existing or will be created) */
  pageId?: string;

  /** Page type determines structure and templates */
  pageType: PageType;

  /** Knowledge base ID to source content from */
  knowledgeBaseId: string;

  /** Target personas for personalization */
  personas?: string[];

  /** Brand configuration ID for voice/style */
  brandConfigId?: string;

  /** Layout generation constraints */
  constraints?: {
    maxSections?: number;
    minSections?: number;
    requiredComponents?: string[];
    excludedComponents?: string[];
    forcedOrder?: string[];
  };

  /** Content generation hints */
  contentHints?: {
    focusAreas?: string[];
    avoidTopics?: string[];
    tonePreference?: 'formal' | 'conversational' | 'bold';
    includeStats?: boolean;
    ctaPreference?: string;
  };

  /** Whether to save to database (default: true) */
  save?: boolean;

  /** Whether to return full output (default: false) */
  returnFullOutput?: boolean;
}

// ============================================================================
// PIPELINE STAGE RESULTS
// ============================================================================

/**
 * Result from layout generation stage
 */
export interface LayoutStageResult {
  status: 'completed' | 'failed' | 'skipped';
  layout?: PageLayout;
  error?: string;
  metrics: {
    sectionsCount: number;
    confidenceScore: number;
    timeMs: number;
    tokensUsed: number;
  };
}

/**
 * Result from storyline generation stage
 */
export interface StorylineStageResult {
  status: 'completed' | 'failed' | 'skipped';
  storyline?: StorylineGenerationResult;
  error?: string;
  metrics: {
    contentBlocksCount: number;
    personaVariationsCount: number;
    timeMs: number;
    tokensUsed: number;
  };
}

/**
 * Result from content generation stage
 */
export interface ContentStageResult {
  status: 'completed' | 'failed' | 'skipped';
  sections?: PopulatedSection[];
  pageMetadata?: {
    title: string;
    description: string;
    keywords: string[];
  };
  error?: string;
  metrics: {
    sectionsPopulated: number;
    averageConfidence: number;
    fallbacksUsed: number;
    timeMs: number;
    tokensUsed: number;
  };
}

// ============================================================================
// PIPELINE OUTPUT TYPES
// ============================================================================

/**
 * Render-ready section combining layout + content
 */
export interface RenderSection {
  /** Section ID */
  sectionId: string;

  /** Component variant to render */
  componentId: string;

  /** Narrative role */
  narrativeRole: NarrativeRole;

  /** Section order */
  order: number;

  /** Emotional tone for styling */
  emotionalTone: EmotionalTone;

  /** Content to display */
  content: PopulatedContent;

  /** Animation settings */
  animations?: {
    entry?: string;
    scroll?: string;
    delay?: number;
  };

  /** Confidence score for this section */
  confidenceScore: number;
}

/**
 * Complete render data for a page
 */
export interface PageRenderData {
  /** Default variant (no persona) */
  defaultVariant: RenderSection[];

  /** Persona-specific variants */
  personaVariants: Record<string, RenderSection[]>;

  /** Page metadata */
  metadata: {
    title: string;
    description: string;
    keywords: string[];
    ogImage?: string;
  };
}

/**
 * Full page generation output
 */
export interface FullPageGenerationOutput {
  /** Generated or existing page ID */
  pageId: string;

  /** Page slug */
  slug: string;

  /** Layout generation result */
  layout: LayoutStageResult;

  /** Storyline generation result */
  storyline: StorylineStageResult;

  /** Content generation result */
  content: ContentStageResult;

  /** Composed render data */
  renderData: PageRenderData;

  /** Overall generation statistics */
  stats: {
    totalTimeMs: number;
    totalTokensUsed: number;
    overallConfidence: number;
    stagesCompleted: number;
    stagesFailed: number;
  };
}

/**
 * Summary response for API (without full data)
 */
export interface FullPageGenerationSummary {
  success: boolean;
  pageId: string;
  slug: string;
  status: {
    layoutGeneration: {
      status: 'completed' | 'failed' | 'skipped';
      sectionsCount: number;
      confidenceScore: number;
      timeMs: number;
    };
    storylineGeneration: {
      status: 'completed' | 'failed' | 'skipped';
      contentBlocksCount: number;
      personaVariationsCount: number;
      timeMs: number;
    };
    contentGeneration: {
      status: 'completed' | 'failed' | 'skipped';
      sectionsPopulated: number;
      averageConfidence: number;
      fallbacksUsed: number;
      timeMs: number;
    };
  };
  pageMetadata: {
    title: string;
    description: string;
    keywords: string[];
  };
  totalTimeMs: number;
  totalTokensUsed: number;
}

// ============================================================================
// GENERATION STATUS TYPES
// ============================================================================

/**
 * Pipeline execution status
 */
export type PipelineStatus =
  | 'pending'
  | 'initializing'
  | 'layout'
  | 'storyline'
  | 'content'
  | 'assembling'
  | 'saving'
  | 'complete'
  | 'failed';

/**
 * Generation progress tracking
 */
export interface GenerationProgress {
  pageId: string;
  status: PipelineStatus;
  progress: number; // 0-100
  currentStage: string;
  completedStages: string[];
  startedAt: string;
  updatedAt: string;
  error?: string;
  estimatedTimeRemaining?: number;
}

// ============================================================================
// DATABASE CONTENT STRUCTURE
// ============================================================================

/**
 * Structure stored in pages.content JSONB
 */
export interface PageContentStructure {
  /** Layout sections */
  sections: Section[];

  /** Page metadata from layout */
  metadata: PageMetadata;

  /** Persona layout variants */
  personaVariants?: PersonaPageVariant[];

  /** Storyline data */
  storyline?: {
    narrative: CoreNarrative;
    defaultFlow: StoryFlow;
    contentBlocks: ContentBlock[];
    personaVariations: PersonaStoryVariation[];
    emotionalJourney: EmotionalJourney;
    generationMetadata: {
      generatedAt: string;
      modelUsed: string;
      tokensUsed: number;
      generationTimeMs: number;
    };
  };

  /** Generated content */
  generatedContent?: {
    sections: PopulatedSection[];
    pageMetadata: {
      title: string;
      description: string;
      keywords: string[];
      ogImage?: string;
    };
    generationStats: {
      totalSections: number;
      sectionsGenerated: number;
      totalTokensUsed: number;
      totalTimeMs: number;
      averageConfidence: number;
      fallbacksUsed: number;
    };
  };

  /** Full pipeline metadata */
  pipelineMetadata?: {
    generatedAt: string;
    pipelineVersion: string;
    totalTimeMs: number;
    totalTokensUsed: number;
    overallConfidence: number;
    stagesCompleted: string[];
  };
}

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

export const FullPageGenerationInputSchema = z.object({
  workspaceId: z.string().uuid(),
  websiteId: z.string().uuid(),
  pageId: z.string().uuid().optional(),
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
  personas: z.array(z.string().uuid()).optional(),
  brandConfigId: z.string().uuid().optional(),
  constraints: z
    .object({
      maxSections: z.number().min(1).max(20).optional(),
      minSections: z.number().min(1).max(10).optional(),
      requiredComponents: z.array(z.string()).optional(),
      excludedComponents: z.array(z.string()).optional(),
      forcedOrder: z.array(z.string()).optional(),
    })
    .optional(),
  contentHints: z
    .object({
      focusAreas: z.array(z.string()).optional(),
      avoidTopics: z.array(z.string()).optional(),
      tonePreference: z.enum(['formal', 'conversational', 'bold']).optional(),
      includeStats: z.boolean().optional(),
      ctaPreference: z.string().optional(),
    })
    .optional(),
  save: z.boolean().optional(),
  returnFullOutput: z.boolean().optional(),
});

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type FullPageGenerationInputType = z.infer<typeof FullPageGenerationInputSchema>;
