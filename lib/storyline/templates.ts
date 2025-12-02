/**
 * Narrative Templates
 *
 * Pre-defined narrative templates for different page types.
 * These templates guide the storyline generation process.
 */

import { PageType, NarrativeRole, EmotionalTone, StoryFlow, StoryStage } from '@/lib/layout/types';
import {
  NarrativeTemplate,
  HookStrategy,
  CTAStrategy,
  EmotionalJourney,
  EmotionalPoint,
} from './types';

// ============================================================================
// PAGE TYPE NARRATIVE TEMPLATES
// ============================================================================

export const NARRATIVE_TEMPLATES: Record<PageType, NarrativeTemplate> = {
  home: {
    pageType: 'home',
    requiredStages: ['hook', 'solution', 'proof', 'action'],
    optionalStages: ['problem'],
    stageOrder: ['hook', 'problem', 'solution', 'proof', 'action'],
    recommendedHooks: ['bold_statement', 'transformation_preview', 'social_proof_lead'],
    recommendedCTAs: ['soft_commitment', 'multiple_options'],
    contentDistribution: {
      hook: { min: 1, max: 2, recommended: 1 },
      problem: { min: 0, max: 2, recommended: 1 },
      solution: { min: 2, max: 5, recommended: 3 },
      proof: { min: 2, max: 4, recommended: 3 },
      action: { min: 1, max: 2, recommended: 1 },
    },
    recommendedArc: 'standard',
    stageGuidance: {
      hook: {
        purpose: 'Capture attention and establish brand relevance immediately',
        duration: '10-15% of page',
        contentTypes: ['value_proposition', 'statistic'],
        emotionalGoal: 'Spark curiosity and interest',
      },
      problem: {
        purpose: 'Acknowledge visitor pain points to build empathy',
        duration: '10-15% of page',
        contentTypes: ['pain_point', 'statistic'],
        emotionalGoal: 'Create recognition and validation',
      },
      solution: {
        purpose: 'Present offerings as the answer to their needs',
        duration: '35-45% of page',
        contentTypes: ['feature', 'benefit', 'process'],
        emotionalGoal: 'Generate hope and excitement',
      },
      proof: {
        purpose: 'Build credibility with evidence and social proof',
        duration: '20-25% of page',
        contentTypes: ['testimonial', 'case_study', 'statistic'],
        emotionalGoal: 'Establish trust and confidence',
      },
      action: {
        purpose: 'Guide visitors to take the next step',
        duration: '10-15% of page',
        contentTypes: ['cta'],
        emotionalGoal: 'Create excitement and momentum',
      },
    },
  },

  landing: {
    pageType: 'landing',
    requiredStages: ['hook', 'solution', 'action'],
    optionalStages: ['problem', 'proof'],
    stageOrder: ['hook', 'problem', 'solution', 'proof', 'action'],
    recommendedHooks: ['surprising_statistic', 'problem_agitation', 'bold_statement'],
    recommendedCTAs: ['direct_offer', 'scarcity_urgency'],
    contentDistribution: {
      hook: { min: 1, max: 1, recommended: 1 },
      problem: { min: 0, max: 2, recommended: 1 },
      solution: { min: 2, max: 4, recommended: 3 },
      proof: { min: 1, max: 3, recommended: 2 },
      action: { min: 2, max: 3, recommended: 2 },
    },
    recommendedArc: 'urgent',
    stageGuidance: {
      hook: {
        purpose: 'Immediately capture attention with compelling offer',
        duration: '15-20% of page',
        contentTypes: ['value_proposition', 'statistic'],
        emotionalGoal: 'Create immediate interest and urgency',
      },
      problem: {
        purpose: 'Agitate the pain point to increase desire for solution',
        duration: '15-20% of page',
        contentTypes: ['pain_point', 'comparison'],
        emotionalGoal: 'Amplify problem awareness',
      },
      solution: {
        purpose: 'Present the offer as the perfect solution',
        duration: '30-35% of page',
        contentTypes: ['feature', 'benefit'],
        emotionalGoal: 'Build excitement for the solution',
      },
      proof: {
        purpose: 'Quickly establish credibility',
        duration: '15-20% of page',
        contentTypes: ['testimonial', 'statistic'],
        emotionalGoal: 'Remove doubt',
      },
      action: {
        purpose: 'Drive conversion with clear, compelling CTA',
        duration: '15-20% of page',
        contentTypes: ['cta'],
        emotionalGoal: 'Create urgency to act now',
      },
    },
  },

  product: {
    pageType: 'product',
    requiredStages: ['hook', 'solution', 'proof'],
    optionalStages: ['problem', 'action'],
    stageOrder: ['hook', 'problem', 'solution', 'proof', 'action'],
    recommendedHooks: ['transformation_preview', 'bold_statement'],
    recommendedCTAs: ['soft_commitment', 'value_recap'],
    contentDistribution: {
      hook: { min: 1, max: 1, recommended: 1 },
      problem: { min: 0, max: 1, recommended: 1 },
      solution: { min: 4, max: 8, recommended: 6 },
      proof: { min: 2, max: 4, recommended: 3 },
      action: { min: 1, max: 2, recommended: 1 },
    },
    recommendedArc: 'standard',
    stageGuidance: {
      hook: {
        purpose: 'Showcase the product and its primary value',
        duration: '15-20% of page',
        contentTypes: ['value_proposition'],
        emotionalGoal: 'Generate interest in the product',
      },
      problem: {
        purpose: 'Connect product to real-world challenges',
        duration: '10-15% of page',
        contentTypes: ['pain_point'],
        emotionalGoal: 'Create relevance',
      },
      solution: {
        purpose: 'Detail features, capabilities, and benefits',
        duration: '40-50% of page',
        contentTypes: ['feature', 'benefit', 'comparison', 'process'],
        emotionalGoal: 'Build comprehensive understanding',
      },
      proof: {
        purpose: 'Show real-world success and validation',
        duration: '15-20% of page',
        contentTypes: ['testimonial', 'case_study', 'statistic'],
        emotionalGoal: 'Validate purchase consideration',
      },
      action: {
        purpose: 'Guide to trial, demo, or purchase',
        duration: '10-15% of page',
        contentTypes: ['cta'],
        emotionalGoal: 'Encourage next step',
      },
    },
  },

  pricing: {
    pageType: 'pricing',
    requiredStages: ['solution', 'action'],
    optionalStages: ['hook', 'proof'],
    stageOrder: ['hook', 'solution', 'proof', 'action'],
    recommendedHooks: ['transformation_preview'],
    recommendedCTAs: ['direct_offer', 'multiple_options'],
    contentDistribution: {
      hook: { min: 0, max: 1, recommended: 1 },
      problem: { min: 0, max: 0, recommended: 0 },
      solution: { min: 1, max: 3, recommended: 2 },
      proof: { min: 0, max: 2, recommended: 1 },
      action: { min: 1, max: 2, recommended: 1 },
    },
    recommendedArc: 'reassuring',
    stageGuidance: {
      hook: {
        purpose: 'Reinforce value before showing price',
        duration: '10-15% of page',
        contentTypes: ['value_proposition'],
        emotionalGoal: 'Affirm value before cost discussion',
      },
      problem: {
        purpose: 'N/A for pricing pages',
        duration: '0%',
        contentTypes: [],
        emotionalGoal: 'N/A',
      },
      solution: {
        purpose: 'Present pricing tiers and what each includes',
        duration: '50-60% of page',
        contentTypes: ['comparison', 'feature'],
        emotionalGoal: 'Make decision easy',
      },
      proof: {
        purpose: 'Address objections and build confidence',
        duration: '15-20% of page',
        contentTypes: ['testimonial', 'faq'],
        emotionalGoal: 'Remove purchase anxiety',
      },
      action: {
        purpose: 'Clear path to purchase for each tier',
        duration: '15-20% of page',
        contentTypes: ['cta'],
        emotionalGoal: 'Confidence in selection',
      },
    },
  },

  about: {
    pageType: 'about',
    requiredStages: ['hook', 'solution', 'proof'],
    optionalStages: ['action'],
    stageOrder: ['hook', 'solution', 'proof', 'action'],
    recommendedHooks: ['story_opener', 'bold_statement'],
    recommendedCTAs: ['soft_commitment'],
    contentDistribution: {
      hook: { min: 1, max: 1, recommended: 1 },
      problem: { min: 0, max: 1, recommended: 0 },
      solution: { min: 2, max: 4, recommended: 3 },
      proof: { min: 2, max: 4, recommended: 3 },
      action: { min: 0, max: 1, recommended: 1 },
    },
    recommendedArc: 'reassuring',
    stageGuidance: {
      hook: {
        purpose: 'Tell the company story and mission',
        duration: '20-25% of page',
        contentTypes: ['value_proposition'],
        emotionalGoal: 'Create connection and trust',
      },
      problem: {
        purpose: 'Why the company was founded (optional)',
        duration: '0-10% of page',
        contentTypes: ['pain_point'],
        emotionalGoal: 'Show understanding of market',
      },
      solution: {
        purpose: 'Team, values, culture, approach',
        duration: '40-50% of page',
        contentTypes: ['feature', 'process'],
        emotionalGoal: 'Build familiarity and trust',
      },
      proof: {
        purpose: 'Achievements, press, partnerships',
        duration: '20-25% of page',
        contentTypes: ['statistic', 'testimonial'],
        emotionalGoal: 'Establish credibility',
      },
      action: {
        purpose: 'Invite to connect or learn more',
        duration: '10-15% of page',
        contentTypes: ['cta'],
        emotionalGoal: 'Warmth and invitation',
      },
    },
  },

  contact: {
    pageType: 'contact',
    requiredStages: ['hook', 'action'],
    optionalStages: ['proof'],
    stageOrder: ['hook', 'proof', 'action'],
    recommendedHooks: ['bold_statement'],
    recommendedCTAs: ['direct_offer', 'multiple_options'],
    contentDistribution: {
      hook: { min: 1, max: 1, recommended: 1 },
      problem: { min: 0, max: 0, recommended: 0 },
      solution: { min: 0, max: 1, recommended: 0 },
      proof: { min: 0, max: 2, recommended: 1 },
      action: { min: 1, max: 2, recommended: 1 },
    },
    recommendedArc: 'reassuring',
    stageGuidance: {
      hook: {
        purpose: "Welcome and encourage contact",
        duration: '20-30% of page',
        contentTypes: ['value_proposition'],
        emotionalGoal: 'Welcoming and approachable',
      },
      problem: {
        purpose: 'N/A for contact pages',
        duration: '0%',
        contentTypes: [],
        emotionalGoal: 'N/A',
      },
      solution: {
        purpose: 'Contact options and expectations',
        duration: '0-15% of page',
        contentTypes: ['process'],
        emotionalGoal: 'Clarity on what happens next',
      },
      proof: {
        purpose: 'Quick trust signals',
        duration: '15-25% of page',
        contentTypes: ['testimonial', 'statistic'],
        emotionalGoal: 'Confidence in reaching out',
      },
      action: {
        purpose: 'Contact form and methods',
        duration: '40-50% of page',
        contentTypes: ['cta'],
        emotionalGoal: 'Easy to take action',
      },
    },
  },

  blog: {
    pageType: 'blog',
    requiredStages: ['hook', 'solution'],
    optionalStages: ['action'],
    stageOrder: ['hook', 'solution', 'action'],
    recommendedHooks: ['provocative_question', 'surprising_statistic'],
    recommendedCTAs: ['soft_commitment'],
    contentDistribution: {
      hook: { min: 1, max: 1, recommended: 1 },
      problem: { min: 0, max: 1, recommended: 0 },
      solution: { min: 1, max: 3, recommended: 2 },
      proof: { min: 0, max: 1, recommended: 0 },
      action: { min: 0, max: 1, recommended: 1 },
    },
    recommendedArc: 'standard',
    stageGuidance: {
      hook: {
        purpose: 'Featured content and value proposition',
        duration: '20-25% of page',
        contentTypes: ['value_proposition'],
        emotionalGoal: 'Interest in content',
      },
      problem: {
        purpose: 'Topic categories (optional)',
        duration: '0-10% of page',
        contentTypes: ['feature'],
        emotionalGoal: 'Navigation clarity',
      },
      solution: {
        purpose: 'Blog post listings and categories',
        duration: '60-70% of page',
        contentTypes: ['feature'],
        emotionalGoal: 'Discovery and exploration',
      },
      proof: {
        purpose: 'Popular posts, social proof (optional)',
        duration: '0-10% of page',
        contentTypes: ['statistic'],
        emotionalGoal: 'Validation of content quality',
      },
      action: {
        purpose: 'Newsletter signup',
        duration: '10-15% of page',
        contentTypes: ['cta'],
        emotionalGoal: 'Stay connected',
      },
    },
  },

  'case-study': {
    pageType: 'case-study',
    requiredStages: ['hook', 'problem', 'solution', 'proof'],
    optionalStages: ['action'],
    stageOrder: ['hook', 'problem', 'solution', 'proof', 'action'],
    recommendedHooks: ['transformation_preview', 'surprising_statistic'],
    recommendedCTAs: ['soft_commitment', 'value_recap'],
    contentDistribution: {
      hook: { min: 1, max: 1, recommended: 1 },
      problem: { min: 1, max: 2, recommended: 2 },
      solution: { min: 2, max: 4, recommended: 3 },
      proof: { min: 2, max: 4, recommended: 3 },
      action: { min: 0, max: 1, recommended: 1 },
    },
    recommendedArc: 'dramatic',
    stageGuidance: {
      hook: {
        purpose: 'Headline result and client introduction',
        duration: '15-20% of page',
        contentTypes: ['value_proposition', 'statistic'],
        emotionalGoal: "Interest in the client's journey",
      },
      problem: {
        purpose: "Detail the client's challenges before",
        duration: '20-25% of page',
        contentTypes: ['pain_point', 'statistic'],
        emotionalGoal: 'Empathy with similar challenges',
      },
      solution: {
        purpose: 'How the solution was implemented',
        duration: '25-30% of page',
        contentTypes: ['process', 'feature'],
        emotionalGoal: 'Understanding of approach',
      },
      proof: {
        purpose: 'Results, metrics, and testimonials',
        duration: '25-30% of page',
        contentTypes: ['statistic', 'testimonial', 'case_study'],
        emotionalGoal: 'Confidence in results',
      },
      action: {
        purpose: 'Invite similar results',
        duration: '10-15% of page',
        contentTypes: ['cta'],
        emotionalGoal: 'Desire for similar outcome',
      },
    },
  },

  solutions: {
    pageType: 'solutions',
    requiredStages: ['hook', 'problem', 'solution', 'proof'],
    optionalStages: ['action'],
    stageOrder: ['hook', 'problem', 'solution', 'proof', 'action'],
    recommendedHooks: ['problem_agitation', 'transformation_preview'],
    recommendedCTAs: ['soft_commitment', 'multiple_options'],
    contentDistribution: {
      hook: { min: 1, max: 1, recommended: 1 },
      problem: { min: 1, max: 3, recommended: 2 },
      solution: { min: 3, max: 6, recommended: 4 },
      proof: { min: 2, max: 3, recommended: 2 },
      action: { min: 1, max: 2, recommended: 1 },
    },
    recommendedArc: 'standard',
    stageGuidance: {
      hook: {
        purpose: 'Industry/use-case specific value proposition',
        duration: '15-20% of page',
        contentTypes: ['value_proposition'],
        emotionalGoal: 'Relevance to their situation',
      },
      problem: {
        purpose: 'Industry-specific challenges',
        duration: '20-25% of page',
        contentTypes: ['pain_point', 'statistic'],
        emotionalGoal: 'Recognition of their pain',
      },
      solution: {
        purpose: 'How solution addresses their needs',
        duration: '35-40% of page',
        contentTypes: ['feature', 'benefit', 'process'],
        emotionalGoal: 'Hope for resolution',
      },
      proof: {
        purpose: 'Industry-relevant case studies',
        duration: '15-20% of page',
        contentTypes: ['case_study', 'testimonial'],
        emotionalGoal: 'Peer validation',
      },
      action: {
        purpose: 'Industry-specific next steps',
        duration: '10-15% of page',
        contentTypes: ['cta'],
        emotionalGoal: 'Confidence to engage',
      },
    },
  },

  features: {
    pageType: 'features',
    requiredStages: ['hook', 'solution'],
    optionalStages: ['proof', 'action'],
    stageOrder: ['hook', 'solution', 'proof', 'action'],
    recommendedHooks: ['bold_statement', 'transformation_preview'],
    recommendedCTAs: ['soft_commitment'],
    contentDistribution: {
      hook: { min: 1, max: 1, recommended: 1 },
      problem: { min: 0, max: 1, recommended: 0 },
      solution: { min: 5, max: 10, recommended: 7 },
      proof: { min: 0, max: 2, recommended: 1 },
      action: { min: 0, max: 1, recommended: 1 },
    },
    recommendedArc: 'standard',
    stageGuidance: {
      hook: {
        purpose: 'Overview of capabilities',
        duration: '15-20% of page',
        contentTypes: ['value_proposition'],
        emotionalGoal: 'Excitement about capabilities',
      },
      problem: {
        purpose: 'Optional challenges features solve',
        duration: '0-10% of page',
        contentTypes: ['pain_point'],
        emotionalGoal: 'Relevance',
      },
      solution: {
        purpose: 'Comprehensive feature showcase',
        duration: '55-65% of page',
        contentTypes: ['feature', 'benefit', 'comparison'],
        emotionalGoal: 'Appreciation for depth',
      },
      proof: {
        purpose: 'Feature-specific testimonials',
        duration: '10-15% of page',
        contentTypes: ['testimonial'],
        emotionalGoal: 'Feature validation',
      },
      action: {
        purpose: 'Try or learn more',
        duration: '10-15% of page',
        contentTypes: ['cta'],
        emotionalGoal: 'Desire to experience',
      },
    },
  },

  'blog-post': {
    pageType: 'blog-post',
    requiredStages: ['hook', 'solution'],
    optionalStages: ['proof', 'action'],
    stageOrder: ['hook', 'solution', 'proof', 'action'],
    recommendedHooks: ['provocative_question', 'surprising_statistic', 'story_opener'],
    recommendedCTAs: ['soft_commitment'],
    contentDistribution: {
      hook: { min: 1, max: 1, recommended: 1 },
      problem: { min: 0, max: 1, recommended: 0 },
      solution: { min: 1, max: 3, recommended: 2 },
      proof: { min: 0, max: 2, recommended: 1 },
      action: { min: 0, max: 1, recommended: 1 },
    },
    recommendedArc: 'standard',
    stageGuidance: {
      hook: {
        purpose: 'Engaging article introduction',
        duration: '15-20% of page',
        contentTypes: ['value_proposition'],
        emotionalGoal: 'Interest in reading',
      },
      problem: {
        purpose: 'Context for the topic (optional)',
        duration: '0-15% of page',
        contentTypes: ['pain_point'],
        emotionalGoal: 'Relevance',
      },
      solution: {
        purpose: 'Main article content and insights',
        duration: '55-65% of page',
        contentTypes: ['feature', 'process'],
        emotionalGoal: 'Value and learning',
      },
      proof: {
        purpose: 'Supporting evidence or examples',
        duration: '10-15% of page',
        contentTypes: ['testimonial', 'statistic'],
        emotionalGoal: 'Credibility',
      },
      action: {
        purpose: 'Related content or newsletter signup',
        duration: '10-15% of page',
        contentTypes: ['cta'],
        emotionalGoal: 'Continue engagement',
      },
    },
  },

  resources: {
    pageType: 'resources',
    requiredStages: ['hook', 'solution'],
    optionalStages: ['action'],
    stageOrder: ['hook', 'solution', 'action'],
    recommendedHooks: ['bold_statement'],
    recommendedCTAs: ['soft_commitment'],
    contentDistribution: {
      hook: { min: 1, max: 1, recommended: 1 },
      problem: { min: 0, max: 0, recommended: 0 },
      solution: { min: 2, max: 5, recommended: 3 },
      proof: { min: 0, max: 1, recommended: 0 },
      action: { min: 0, max: 1, recommended: 1 },
    },
    recommendedArc: 'reassuring',
    stageGuidance: {
      hook: {
        purpose: 'Resource hub introduction',
        duration: '15-20% of page',
        contentTypes: ['value_proposition'],
        emotionalGoal: 'Discovery excitement',
      },
      problem: {
        purpose: 'N/A',
        duration: '0%',
        contentTypes: [],
        emotionalGoal: 'N/A',
      },
      solution: {
        purpose: 'Resource categories and featured items',
        duration: '65-75% of page',
        contentTypes: ['feature'],
        emotionalGoal: 'Easy navigation',
      },
      proof: {
        purpose: 'Resource usage stats (optional)',
        duration: '0-10% of page',
        contentTypes: ['statistic'],
        emotionalGoal: 'Validation',
      },
      action: {
        purpose: 'Newsletter or updates signup',
        duration: '10-15% of page',
        contentTypes: ['cta'],
        emotionalGoal: 'Stay informed',
      },
    },
  },

  careers: {
    pageType: 'careers',
    requiredStages: ['hook', 'solution', 'proof'],
    optionalStages: ['action'],
    stageOrder: ['hook', 'solution', 'proof', 'action'],
    recommendedHooks: ['story_opener', 'bold_statement'],
    recommendedCTAs: ['direct_offer'],
    contentDistribution: {
      hook: { min: 1, max: 1, recommended: 1 },
      problem: { min: 0, max: 0, recommended: 0 },
      solution: { min: 2, max: 4, recommended: 3 },
      proof: { min: 2, max: 4, recommended: 3 },
      action: { min: 1, max: 1, recommended: 1 },
    },
    recommendedArc: 'standard',
    stageGuidance: {
      hook: {
        purpose: 'Company culture and mission',
        duration: '20-25% of page',
        contentTypes: ['value_proposition'],
        emotionalGoal: 'Excitement about the opportunity',
      },
      problem: {
        purpose: 'N/A',
        duration: '0%',
        contentTypes: [],
        emotionalGoal: 'N/A',
      },
      solution: {
        purpose: 'Benefits, growth opportunities, values',
        duration: '35-40% of page',
        contentTypes: ['feature', 'benefit'],
        emotionalGoal: 'Desire to join',
      },
      proof: {
        purpose: 'Employee stories, awards, culture',
        duration: '25-30% of page',
        contentTypes: ['testimonial', 'statistic'],
        emotionalGoal: 'Trust in culture',
      },
      action: {
        purpose: 'View open positions',
        duration: '15-20% of page',
        contentTypes: ['cta'],
        emotionalGoal: 'Ready to apply',
      },
    },
  },

  legal: {
    pageType: 'legal',
    requiredStages: ['hook', 'solution'],
    optionalStages: [],
    stageOrder: ['hook', 'solution'],
    recommendedHooks: ['bold_statement'],
    recommendedCTAs: ['soft_commitment'],
    contentDistribution: {
      hook: { min: 1, max: 1, recommended: 1 },
      problem: { min: 0, max: 0, recommended: 0 },
      solution: { min: 1, max: 2, recommended: 1 },
      proof: { min: 0, max: 0, recommended: 0 },
      action: { min: 0, max: 1, recommended: 0 },
    },
    recommendedArc: 'reassuring',
    stageGuidance: {
      hook: {
        purpose: 'Legal page header',
        duration: '10-15% of page',
        contentTypes: ['value_proposition'],
        emotionalGoal: 'Professional and clear',
      },
      problem: {
        purpose: 'N/A',
        duration: '0%',
        contentTypes: [],
        emotionalGoal: 'N/A',
      },
      solution: {
        purpose: 'Legal content and navigation',
        duration: '80-90% of page',
        contentTypes: ['feature'],
        emotionalGoal: 'Transparency and trust',
      },
      proof: {
        purpose: 'N/A',
        duration: '0%',
        contentTypes: [],
        emotionalGoal: 'N/A',
      },
      action: {
        purpose: 'Contact for questions (optional)',
        duration: '0-10% of page',
        contentTypes: ['cta'],
        emotionalGoal: 'Accessibility',
      },
    },
  },

  custom: {
    pageType: 'custom',
    requiredStages: ['hook', 'solution'],
    optionalStages: ['problem', 'proof', 'action'],
    stageOrder: ['hook', 'problem', 'solution', 'proof', 'action'],
    recommendedHooks: ['bold_statement', 'transformation_preview'],
    recommendedCTAs: ['soft_commitment', 'value_recap'],
    contentDistribution: {
      hook: { min: 1, max: 2, recommended: 1 },
      problem: { min: 0, max: 2, recommended: 1 },
      solution: { min: 2, max: 6, recommended: 3 },
      proof: { min: 0, max: 3, recommended: 2 },
      action: { min: 0, max: 2, recommended: 1 },
    },
    recommendedArc: 'standard',
    stageGuidance: {
      hook: {
        purpose: 'Capture attention with main message',
        duration: '15-20% of page',
        contentTypes: ['value_proposition'],
        emotionalGoal: 'Interest and relevance',
      },
      problem: {
        purpose: 'Address relevant challenges (optional)',
        duration: '10-20% of page',
        contentTypes: ['pain_point'],
        emotionalGoal: 'Recognition',
      },
      solution: {
        purpose: 'Present main content and value',
        duration: '35-45% of page',
        contentTypes: ['feature', 'benefit'],
        emotionalGoal: 'Understanding and hope',
      },
      proof: {
        purpose: 'Supporting evidence (optional)',
        duration: '15-25% of page',
        contentTypes: ['testimonial', 'statistic'],
        emotionalGoal: 'Credibility',
      },
      action: {
        purpose: 'Guide to next steps',
        duration: '10-15% of page',
        contentTypes: ['cta'],
        emotionalGoal: 'Motivation to act',
      },
    },
  },
};

// ============================================================================
// DEFAULT STORY FLOWS
// ============================================================================

/**
 * Generate default story flow for a page type
 */
export function getDefaultStoryFlow(pageType: PageType): StoryFlow {
  const template = NARRATIVE_TEMPLATES[pageType];

  const stages: StoryStage[] = template.stageOrder
    .filter((stage) => template.requiredStages.includes(stage) || template.optionalStages.includes(stage))
    .map((stage) => ({
      name: stage,
      narrativeRole: stage,
      emotionalTone: getEmotionalToneForStage(stage),
      description: template.stageGuidance[stage].purpose,
    }));

  return { stages };
}

/**
 * Get the default emotional tone for a narrative stage
 */
function getEmotionalToneForStage(stage: NarrativeRole): EmotionalTone {
  const mapping: Record<NarrativeRole, EmotionalTone> = {
    hook: 'curiosity',
    problem: 'empathy',
    solution: 'hope',
    proof: 'confidence',
    action: 'excitement',
  };
  return mapping[stage];
}

// ============================================================================
// EMOTIONAL JOURNEY TEMPLATES
// ============================================================================

/**
 * Default emotional journeys for different arc types
 */
export const EMOTIONAL_JOURNEY_TEMPLATES: Record<EmotionalJourney['arcType'], EmotionalPoint[]> = {
  standard: [
    { position: 0, primaryEmotion: 'curiosity', intensity: 85, pacing: 'fast' },
    { position: 15, primaryEmotion: 'empathy', intensity: 70, pacing: 'medium' },
    { position: 30, primaryEmotion: 'urgency', intensity: 75, pacing: 'medium' },
    { position: 50, primaryEmotion: 'hope', intensity: 90, pacing: 'medium' },
    { position: 70, primaryEmotion: 'confidence', intensity: 85, pacing: 'slow' },
    { position: 85, primaryEmotion: 'trust', intensity: 80, pacing: 'slow' },
    { position: 100, primaryEmotion: 'excitement', intensity: 90, pacing: 'fast' },
  ],

  dramatic: [
    { position: 0, primaryEmotion: 'curiosity', intensity: 95, pacing: 'fast' },
    { position: 15, primaryEmotion: 'empathy', intensity: 60, pacing: 'slow' },
    { position: 25, primaryEmotion: 'urgency', intensity: 90, pacing: 'fast' },
    { position: 40, primaryEmotion: 'hope', intensity: 50, pacing: 'slow' },
    { position: 55, primaryEmotion: 'hope', intensity: 95, pacing: 'fast' },
    { position: 75, primaryEmotion: 'confidence', intensity: 90, pacing: 'medium' },
    { position: 100, primaryEmotion: 'excitement', intensity: 100, pacing: 'fast' },
  ],

  reassuring: [
    { position: 0, primaryEmotion: 'trust', intensity: 80, pacing: 'slow' },
    { position: 20, primaryEmotion: 'confidence', intensity: 75, pacing: 'slow' },
    { position: 40, primaryEmotion: 'hope', intensity: 80, pacing: 'medium' },
    { position: 60, primaryEmotion: 'confidence', intensity: 85, pacing: 'medium' },
    { position: 80, primaryEmotion: 'trust', intensity: 90, pacing: 'slow' },
    { position: 100, primaryEmotion: 'relief', intensity: 85, pacing: 'slow' },
  ],

  urgent: [
    { position: 0, primaryEmotion: 'curiosity', intensity: 90, pacing: 'fast' },
    { position: 10, primaryEmotion: 'urgency', intensity: 85, pacing: 'fast' },
    { position: 25, primaryEmotion: 'urgency', intensity: 95, pacing: 'fast' },
    { position: 45, primaryEmotion: 'hope', intensity: 90, pacing: 'fast' },
    { position: 65, primaryEmotion: 'confidence', intensity: 85, pacing: 'medium' },
    { position: 80, primaryEmotion: 'excitement', intensity: 95, pacing: 'fast' },
    { position: 100, primaryEmotion: 'excitement', intensity: 100, pacing: 'fast' },
  ],
};

/**
 * Generate emotional journey for a page type
 */
export function generateEmotionalJourney(pageType: PageType): EmotionalJourney {
  const template = NARRATIVE_TEMPLATES[pageType];
  const arcType = template.recommendedArc;
  const points = EMOTIONAL_JOURNEY_TEMPLATES[arcType];

  // Find peak position
  let peakPosition = 0;
  let maxIntensity = 0;
  for (const point of points) {
    if (point.intensity > maxIntensity) {
      maxIntensity = point.intensity;
      peakPosition = point.position;
    }
  }

  // Generate pacing zones
  const pacingZones = generatePacingZones(points);

  return {
    points,
    arcType,
    peakPosition,
    pacingZones,
  };
}

/**
 * Generate pacing zones from emotional points
 */
function generatePacingZones(
  points: EmotionalPoint[]
): { start: number; end: number; pacing: 'slow' | 'medium' | 'fast'; purpose: string }[] {
  const zones: { start: number; end: number; pacing: 'slow' | 'medium' | 'fast'; purpose: string }[] =
    [];

  for (let i = 0; i < points.length - 1; i++) {
    const current = points[i];
    const next = points[i + 1];

    zones.push({
      start: current.position,
      end: next.position,
      pacing: current.pacing,
      purpose: getPacingPurpose(current.primaryEmotion, current.pacing),
    });
  }

  return zones;
}

/**
 * Get purpose description for a pacing zone
 */
function getPacingPurpose(emotion: EmotionalTone, pacing: 'slow' | 'medium' | 'fast'): string {
  const purposes: Record<EmotionalTone, Record<'slow' | 'medium' | 'fast', string>> = {
    curiosity: {
      fast: 'Capture attention quickly',
      medium: 'Build intrigue steadily',
      slow: 'Let interest develop naturally',
    },
    empathy: {
      fast: 'Acknowledge pain quickly',
      medium: 'Build emotional connection',
      slow: 'Deep emotional resonance',
    },
    urgency: {
      fast: 'Create immediate pressure',
      medium: 'Build sense of importance',
      slow: 'Sustained urgency',
    },
    hope: {
      fast: 'Quick relief and excitement',
      medium: 'Building optimism',
      slow: 'Thoughtful consideration of benefits',
    },
    confidence: {
      fast: 'Rapid credibility building',
      medium: 'Steady trust building',
      slow: 'Deep credibility establishment',
    },
    excitement: {
      fast: 'Drive to action',
      medium: 'Building momentum',
      slow: 'Sustained enthusiasm',
    },
    trust: {
      fast: 'Quick reassurance',
      medium: 'Building reliability',
      slow: 'Deep trust establishment',
    },
    relief: {
      fast: 'Quick resolution',
      medium: 'Comfortable conclusion',
      slow: 'Peaceful satisfaction',
    },
  };

  return purposes[emotion][pacing];
}

// ============================================================================
// HOOK STRATEGY TEMPLATES
// ============================================================================

export const HOOK_STRATEGY_PROMPTS: Record<HookStrategy, string> = {
  surprising_statistic:
    'Lead with a surprising or counter-intuitive statistic that challenges assumptions and demands attention.',
  provocative_question:
    'Open with a thought-provoking question that the reader cannot help but want answered.',
  bold_statement:
    'Make a strong, confident claim about the value or transformation you provide.',
  story_opener:
    'Begin with a brief, compelling story that illustrates the transformation or journey.',
  problem_agitation:
    'Start by vividly describing the pain point or problem, making it feel urgent.',
  transformation_preview:
    'Show the end result first - the transformed state the visitor can achieve.',
  social_proof_lead:
    'Lead with impressive credibility signals - numbers, logos, or achievements.',
  contrarian_view:
    'Challenge conventional wisdom or common approaches in the industry.',
};

// ============================================================================
// CTA STRATEGY TEMPLATES
// ============================================================================

export const CTA_STRATEGY_PROMPTS: Record<CTAStrategy, string> = {
  direct_offer: 'Clear, specific action with immediate value proposition. No ambiguity.',
  soft_commitment:
    'Low-friction first step that feels easy and risk-free (e.g., "Learn more", "See how it works").',
  scarcity_urgency:
    'Time-limited or availability-limited offer that creates pressure to act now.',
  value_recap:
    'Summarize key benefits before the ask, reminding them why they should act.',
  multiple_options:
    'Offer different entry points for different readiness levels (demo, trial, contact).',
  social_momentum:
    'Emphasize that others are taking action - join the movement.',
};
