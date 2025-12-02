/**
 * Storyline & Narrative Agent Types
 *
 * This module defines types for the AI-powered narrative generation system
 * that creates compelling story flows for marketing pages.
 */

import { z } from 'zod';
import { PageType, NarrativeRole, EmotionalTone, StoryFlow, StoryStage } from '@/lib/layout/types';

// ============================================================================
// NARRATIVE IDENTIFICATION
// ============================================================================

/**
 * Core narrative elements extracted from knowledge base
 */
export interface CoreNarrative {
  /** The central theme/message of the content */
  centralTheme: string;

  /** The unique value proposition */
  valueProposition: string;

  /** Key differentiators from competitors */
  differentiators: string[];

  /** Target audience description */
  targetAudience: string;

  /** The transformation promise (before → after) */
  transformation: {
    before: string;
    after: string;
  };

  /** Core pain points addressed */
  painPoints: string[];

  /** Key benefits offered */
  benefits: string[];

  /** Proof elements available */
  proofElements: {
    type: 'testimonial' | 'case_study' | 'statistic' | 'award' | 'certification';
    count: number;
    strength: 'high' | 'medium' | 'low';
  }[];
}

/**
 * Hook strategies for capturing attention
 */
export type HookStrategy =
  | 'surprising_statistic' // Lead with a shocking number
  | 'provocative_question' // Ask a thought-provoking question
  | 'bold_statement' // Make a strong claim
  | 'story_opener' // Begin with a mini-story
  | 'problem_agitation' // Start with the pain
  | 'transformation_preview' // Show the end result first
  | 'social_proof_lead' // Lead with credibility
  | 'contrarian_view'; // Challenge conventional wisdom

/**
 * Problem articulation approaches
 */
export type ProblemArticulation =
  | 'symptom_focus' // Focus on visible symptoms
  | 'root_cause' // Dig into underlying issues
  | 'cost_of_inaction' // Quantify the pain
  | 'missed_opportunity' // What they're missing
  | 'comparison_gap' // Gap vs. competitors/industry
  | 'future_risk'; // What could go wrong

/**
 * Solution positioning strategies
 */
export type SolutionPositioning =
  | 'unique_mechanism' // How it uniquely works
  | 'comprehensive_solution' // All-in-one approach
  | 'simplicity_focus' // Easy to implement
  | 'innovation_highlight' // Cutting-edge technology
  | 'proven_methodology' // Battle-tested approach
  | 'customization_emphasis'; // Tailored to needs

/**
 * Proof strategies for building credibility
 */
export type ProofStrategy =
  | 'social_proof_stack' // Multiple testimonials
  | 'case_study_deep_dive' // Detailed success story
  | 'metrics_showcase' // Numbers and data
  | 'authority_endorsement' // Expert/celebrity backing
  | 'peer_validation' // Similar companies/roles
  | 'risk_reversal'; // Guarantees and assurances

/**
 * Call-to-action approaches
 */
export type CTAStrategy =
  | 'direct_offer' // Clear, immediate action
  | 'soft_commitment' // Low-friction first step
  | 'scarcity_urgency' // Limited time/availability
  | 'value_recap' // Summarize before asking
  | 'multiple_options' // Different entry points
  | 'social_momentum'; // Join others who've acted

// ============================================================================
// CONTENT BLOCKS
// ============================================================================

/**
 * A content block mapped to a story stage
 */
export interface ContentBlock {
  /** Unique identifier */
  id: string;

  /** The narrative stage this content belongs to */
  stage: NarrativeRole;

  /** Priority within the stage (lower = higher priority) */
  priority: number;

  /** The actual content */
  content: {
    /** Primary headline/title */
    headline: string;

    /** Supporting text/description */
    description: string;

    /** Bullet points if applicable */
    bullets?: string[];

    /** Related knowledge base entity IDs */
    entityIds: string[];

    /** Content type hint */
    contentType:
      | 'value_proposition'
      | 'feature'
      | 'benefit'
      | 'pain_point'
      | 'testimonial'
      | 'case_study'
      | 'statistic'
      | 'comparison'
      | 'process'
      | 'faq'
      | 'cta';
  };

  /** Target personas for this content */
  targetPersonas: string[];

  /** Emotional tone to convey */
  emotionalTone: EmotionalTone;

  /** Suggested component types for this content */
  suggestedComponents: string[];
}

// ============================================================================
// PERSONA ADAPTATION
// ============================================================================

/**
 * Persona-specific narrative adaptation
 */
export interface PersonaNarrativeAdaptation {
  /** Persona ID */
  personaId: string;

  /** Adapted hook strategy */
  hookStrategy: HookStrategy;

  /** How to frame the problem */
  problemFraming: {
    emphasis: string[];
    languageStyle: 'technical' | 'business' | 'executive';
    quantification: boolean;
  };

  /** Solution emphasis points */
  solutionEmphasis: string[];

  /** Proof types to prioritize */
  proofPriority: ('testimonial' | 'case_study' | 'statistic' | 'award' | 'certification')[];

  /** CTA approach */
  ctaApproach: CTAStrategy;

  /** Content density preference */
  contentDensity: 'detailed' | 'balanced' | 'concise';

  /** Emotional arc adjustments */
  emotionalArcAdjustments: {
    stage: NarrativeRole;
    intensityMultiplier: number; // 0.5 to 1.5
  }[];
}

/**
 * Complete persona story variation
 */
export interface PersonaStoryVariation {
  /** Persona ID */
  personaId: string;

  /** Adapted story flow */
  storyFlow: StoryFlow;

  /** Narrative adaptation details */
  adaptation: PersonaNarrativeAdaptation;

  /** Persona-specific content blocks */
  contentBlocks: ContentBlock[];

  /** Section overrides for layout */
  sectionOverrides: Record<
    string,
    {
      headline?: string;
      description?: string;
      ctaText?: string;
      emphasis?: string[];
    }
  >;
}

// ============================================================================
// EMOTIONAL JOURNEY
// ============================================================================

/**
 * Emotional intensity at a point in the narrative
 */
export interface EmotionalPoint {
  /** Position in the page (0-100 percentage) */
  position: number;

  /** Primary emotion at this point */
  primaryEmotion: EmotionalTone;

  /** Intensity level (0-100) */
  intensity: number;

  /** Secondary emotion if applicable */
  secondaryEmotion?: EmotionalTone;

  /** Content pacing recommendation */
  pacing: 'slow' | 'medium' | 'fast';
}

/**
 * Complete emotional journey map
 */
export interface EmotionalJourney {
  /** Sequence of emotional points */
  points: EmotionalPoint[];

  /** Overall arc type */
  arcType:
    | 'standard' // Steady build to action
    | 'dramatic' // High peaks and valleys
    | 'reassuring' // Calm, confidence-building
    | 'urgent'; // Fast-paced urgency

  /** Peak emotional moment position */
  peakPosition: number;

  /** Recommended pacing zones */
  pacingZones: {
    start: number;
    end: number;
    pacing: 'slow' | 'medium' | 'fast';
    purpose: string;
  }[];
}

// ============================================================================
// STORYLINE GENERATION
// ============================================================================

/**
 * Input for storyline generation
 */
export interface StorylineGenerationInput {
  /** Workspace ID */
  workspaceId: string;

  /** Website ID */
  websiteId: string;

  /** Knowledge base ID to draw content from */
  knowledgeBaseId: string;

  /** Page type determines narrative template */
  pageType: PageType;

  /** Target personas */
  personas: string[];

  /** Optional brand configuration for tone alignment */
  brandConfigId?: string;

  /** Content hints from user */
  contentHints?: {
    focusAreas?: string[];
    avoidTopics?: string[];
    primaryGoal?: 'awareness' | 'consideration' | 'conversion';
    tonePreference?: 'formal' | 'conversational' | 'bold';
  };

  /** Generation constraints */
  constraints?: {
    maxContentBlocks?: number;
    requiredStages?: NarrativeRole[];
    hookStrategy?: HookStrategy;
    ctaStrategy?: CTAStrategy;
  };
}

/**
 * Complete storyline generation result
 */
export interface StorylineGenerationResult {
  /** Core narrative identified */
  narrative: CoreNarrative;

  /** Default story flow (base template) */
  defaultFlow: StoryFlow;

  /** Persona-specific story variations */
  personaVariations: PersonaStoryVariation[];

  /** All content blocks organized by stage */
  contentBlocks: ContentBlock[];

  /** Emotional journey map */
  emotionalJourney: EmotionalJourney;

  /** Generation metadata */
  metadata: {
    generatedAt: string;
    modelUsed: string;
    tokensUsed: number;
    generationTimeMs: number;
    knowledgeItemsUsed: number;
  };
}

// ============================================================================
// PAGE TYPE NARRATIVE TEMPLATES
// ============================================================================

/**
 * Narrative template for a page type
 */
export interface NarrativeTemplate {
  /** Page type this template applies to */
  pageType: PageType;

  /** Required narrative stages */
  requiredStages: NarrativeRole[];

  /** Optional stages that enhance the narrative */
  optionalStages: NarrativeRole[];

  /** Default stage order */
  stageOrder: NarrativeRole[];

  /** Recommended hook strategies */
  recommendedHooks: HookStrategy[];

  /** Recommended CTA strategies */
  recommendedCTAs: CTAStrategy[];

  /** Target content block counts per stage */
  contentDistribution: Record<NarrativeRole, { min: number; max: number; recommended: number }>;

  /** Emotional arc type recommendation */
  recommendedArc: EmotionalJourney['arcType'];

  /** Stage-specific guidance */
  stageGuidance: Record<
    NarrativeRole,
    {
      purpose: string;
      duration: string; // e.g., "15-20% of page"
      contentTypes: string[];
      emotionalGoal: string;
    }
  >;
}

// ============================================================================
// ZOD SCHEMAS FOR VALIDATION
// ============================================================================

export const CoreNarrativeSchema = z.object({
  centralTheme: z.string(),
  valueProposition: z.string(),
  differentiators: z.array(z.string()),
  targetAudience: z.string(),
  transformation: z.object({
    before: z.string(),
    after: z.string(),
  }),
  painPoints: z.array(z.string()),
  benefits: z.array(z.string()),
  proofElements: z.array(
    z.object({
      type: z.enum(['testimonial', 'case_study', 'statistic', 'award', 'certification']),
      count: z.number(),
      strength: z.enum(['high', 'medium', 'low']),
    })
  ),
});

export const ContentBlockSchema = z.object({
  id: z.string(),
  stage: z.enum(['hook', 'problem', 'solution', 'proof', 'action']),
  priority: z.number(),
  content: z.object({
    headline: z.string(),
    description: z.string(),
    bullets: z.array(z.string()).optional(),
    entityIds: z.array(z.string()),
    contentType: z.enum([
      'value_proposition',
      'feature',
      'benefit',
      'pain_point',
      'testimonial',
      'case_study',
      'statistic',
      'comparison',
      'process',
      'faq',
      'cta',
    ]),
  }),
  targetPersonas: z.array(z.string()),
  emotionalTone: z.enum([
    'curiosity',
    'empathy',
    'urgency',
    'hope',
    'confidence',
    'excitement',
    'trust',
    'relief',
  ]),
  suggestedComponents: z.array(z.string()),
});

export const PersonaNarrativeAdaptationSchema = z.object({
  personaId: z.string(),
  hookStrategy: z.enum([
    'surprising_statistic',
    'provocative_question',
    'bold_statement',
    'story_opener',
    'problem_agitation',
    'transformation_preview',
    'social_proof_lead',
    'contrarian_view',
  ]),
  problemFraming: z.object({
    emphasis: z.array(z.string()),
    languageStyle: z.enum(['technical', 'business', 'executive']),
    quantification: z.boolean(),
  }),
  solutionEmphasis: z.array(z.string()),
  proofPriority: z.array(
    z.enum(['testimonial', 'case_study', 'statistic', 'award', 'certification'])
  ),
  ctaApproach: z.enum([
    'direct_offer',
    'soft_commitment',
    'scarcity_urgency',
    'value_recap',
    'multiple_options',
    'social_momentum',
  ]),
  contentDensity: z.enum(['detailed', 'balanced', 'concise']),
  emotionalArcAdjustments: z.array(
    z.object({
      stage: z.enum(['hook', 'problem', 'solution', 'proof', 'action']),
      intensityMultiplier: z.number().min(0.5).max(1.5),
    })
  ),
});

export const EmotionalJourneySchema = z.object({
  points: z.array(
    z.object({
      position: z.number().min(0).max(100),
      primaryEmotion: z.enum([
        'curiosity',
        'empathy',
        'urgency',
        'hope',
        'confidence',
        'excitement',
        'trust',
        'relief',
      ]),
      intensity: z.number().min(0).max(100),
      secondaryEmotion: z
        .enum([
          'curiosity',
          'empathy',
          'urgency',
          'hope',
          'confidence',
          'excitement',
          'trust',
          'relief',
        ])
        .optional(),
      pacing: z.enum(['slow', 'medium', 'fast']),
    })
  ),
  arcType: z.enum(['standard', 'dramatic', 'reassuring', 'urgent']),
  peakPosition: z.number().min(0).max(100),
  pacingZones: z.array(
    z.object({
      start: z.number().min(0).max(100),
      end: z.number().min(0).max(100),
      pacing: z.enum(['slow', 'medium', 'fast']),
      purpose: z.string(),
    })
  ),
});

export const StorylineGenerationInputSchema = z.object({
  workspaceId: z.string().uuid(),
  websiteId: z.string().uuid(),
  knowledgeBaseId: z.string().uuid(),
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
  personas: z.array(z.string()),
  brandConfigId: z.string().uuid().optional(),
  contentHints: z
    .object({
      focusAreas: z.array(z.string()).optional(),
      avoidTopics: z.array(z.string()).optional(),
      primaryGoal: z.enum(['awareness', 'consideration', 'conversion']).optional(),
      tonePreference: z.enum(['formal', 'conversational', 'bold']).optional(),
    })
    .optional(),
  constraints: z
    .object({
      maxContentBlocks: z.number().optional(),
      requiredStages: z.array(z.enum(['hook', 'problem', 'solution', 'proof', 'action'])).optional(),
      hookStrategy: z
        .enum([
          'surprising_statistic',
          'provocative_question',
          'bold_statement',
          'story_opener',
          'problem_agitation',
          'transformation_preview',
          'social_proof_lead',
          'contrarian_view',
        ])
        .optional(),
      ctaStrategy: z
        .enum([
          'direct_offer',
          'soft_commitment',
          'scarcity_urgency',
          'value_recap',
          'multiple_options',
          'social_momentum',
        ])
        .optional(),
    })
    .optional(),
});

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type StorylineGenerationInputType = z.infer<typeof StorylineGenerationInputSchema>;
