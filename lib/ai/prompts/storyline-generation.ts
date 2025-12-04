/**
 * Storyline Generation Prompts
 *
 * Prompt templates for generating narrative storylines and content strategies.
 */

import type { NarrativeRole } from '@/lib/layout/types';

/**
 * Page types for storyline generation
 */
export type PageType = 'home' | 'landing' | 'product' | 'pricing' | 'about' | 'contact' | 'features';

/**
 * System prompt for storyline generation
 */
export const STORYLINE_GENERATION_SYSTEM_PROMPT =
  'You are an expert marketing strategist who identifies compelling narratives from content. Respond only with valid JSON.';

/**
 * Narrative flow templates by page type
 */
export const NARRATIVE_FLOWS: Record<PageType, NarrativeRole[]> = {
  home: ['hook', 'problem', 'solution', 'proof', 'action'],
  landing: ['hook', 'problem', 'solution', 'proof', 'action'],
  product: ['hook', 'problem', 'solution', 'proof', 'action'],
  pricing: ['hook', 'solution', 'proof', 'action'],
  about: ['hook', 'proof', 'solution', 'action'],
  contact: ['hook', 'action'],
  features: ['hook', 'solution', 'proof', 'action'],
};

/**
 * Build storyline extraction prompt
 */
export function buildStorylineExtractionPrompt(params: {
  pageType: PageType;
  contentSummary: string;
  brandVoice?: {
    tone: string;
    personality?: string[];
  };
  targetPersonas?: Array<{
    name: string;
    goals: string[];
    painPoints?: string[];
  }>;
}): string {
  const { pageType, contentSummary, brandVoice, targetPersonas } = params;
  const narrativeFlow = NARRATIVE_FLOWS[pageType];

  return `Analyze the following content and create a narrative storyline for a ${pageType} page.

## Content Summary
${contentSummary}

## Required Narrative Flow
${narrativeFlow.join(' → ')}

${brandVoice ? `## Brand Voice
- Tone: ${brandVoice.tone}
${brandVoice.personality ? `- Personality: ${brandVoice.personality.join(', ')}` : ''}` : ''}

${
  targetPersonas?.length
    ? `## Target Personas
${targetPersonas.map((p) => `- ${p.name}: Goals: ${p.goals.join(', ')}${p.painPoints?.length ? `; Pain points: ${p.painPoints.join(', ')}` : ''}`).join('\n')}`
    : ''
}

## Instructions
1. Identify the core narrative from the content
2. Map content to each narrative stage
3. Ensure emotional progression through stages
4. Create compelling transitions between stages

Return JSON:
{
  "coreNarrative": {
    "hook": {
      "headline": "Attention-grabbing headline",
      "subheadline": "Supporting statement",
      "emotionalTone": "curiosity|excitement|urgency"
    },
    "problem": {
      "mainProblem": "The core problem being solved",
      "painPoints": ["Pain point 1", "Pain point 2"],
      "emotionalTone": "empathy|understanding"
    },
    "solution": {
      "mainSolution": "How the product/service solves the problem",
      "keyBenefits": ["Benefit 1", "Benefit 2"],
      "emotionalTone": "hope|confidence"
    },
    "proof": {
      "socialProof": ["Testimonial/stat 1", "Testimonial/stat 2"],
      "credibilityMarkers": ["Trust signal 1", "Trust signal 2"],
      "emotionalTone": "trust|confidence"
    },
    "action": {
      "primaryCTA": "Main call to action",
      "secondaryCTA": "Alternative action",
      "urgencyDriver": "Why act now",
      "emotionalTone": "excitement|urgency"
    }
  },
  "contentDistribution": {
    "hook": 0.15,
    "problem": 0.20,
    "solution": 0.30,
    "proof": 0.20,
    "action": 0.15
  }
}`;
}

/**
 * Stage-specific content guidance
 */
export const STAGE_CONTENT_GUIDANCE: Record<
  NarrativeRole,
  {
    purpose: string;
    emotionalGoal: string;
    contentTypes: string[];
    duration: string;
  }
> = {
  hook: {
    purpose: 'Capture attention and create curiosity',
    emotionalGoal: 'Intrigue, curiosity, excitement',
    contentTypes: ['hero', 'headline', 'value-prop', 'video-hero'],
    duration: '3-5 seconds to engage',
  },
  problem: {
    purpose: 'Create resonance with audience pain',
    emotionalGoal: 'Recognition, empathy, validation',
    contentTypes: ['pain-points', 'challenges', 'before-state', 'stats'],
    duration: 'Build tension before solution',
  },
  solution: {
    purpose: 'Present offering as the answer',
    emotionalGoal: 'Hope, possibility, relief',
    contentTypes: ['features', 'benefits', 'how-it-works', 'comparison'],
    duration: 'Detailed but scannable',
  },
  proof: {
    purpose: 'Build credibility and trust',
    emotionalGoal: 'Confidence, trust, reassurance',
    contentTypes: ['testimonials', 'case-studies', 'logos', 'stats', 'awards'],
    duration: 'Multiple proof points',
  },
  action: {
    purpose: 'Drive conversion',
    emotionalGoal: 'Excitement, urgency, confidence',
    contentTypes: ['cta', 'pricing', 'signup', 'contact', 'trial'],
    duration: 'Clear, immediate next step',
  },
};
