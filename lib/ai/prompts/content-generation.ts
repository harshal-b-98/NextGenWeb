/**
 * Content Generation Prompts
 *
 * Prompt templates for generating marketing content, copywriting, and SEO metadata.
 */

import type { NarrativeRole } from '@/lib/layout/types';

/**
 * System prompt for marketing copywriting
 */
export const CONTENT_COPYWRITER_SYSTEM_PROMPT =
  'You are an expert marketing copywriter. Generate compelling, conversion-focused content. Respond only with valid JSON.';

/**
 * System prompt for persona content adaptation
 */
export const PERSONA_ADAPTATION_SYSTEM_PROMPT =
  'You are an expert at personalizing marketing content for different audience segments. Respond only with valid JSON.';

/**
 * Stage-specific guidance for narrative content
 */
export const NARRATIVE_STAGE_GUIDANCE: Record<NarrativeRole, string> = {
  hook: `PURPOSE: Capture attention immediately
EMOTIONAL TONE: Curiosity, intrigue
FOCUS: Value proposition, transformation promise
STYLE: Bold, direct, benefit-focused`,

  problem: `PURPOSE: Create resonance with audience pain
EMOTIONAL TONE: Empathy, understanding
FOCUS: Specific challenges, quantified impact
STYLE: Relatable, specific, validating`,

  solution: `PURPOSE: Present your offering as the answer
EMOTIONAL TONE: Hope, possibility
FOCUS: Features that solve problems, benefits
STYLE: Clear, benefit-focused, confident`,

  proof: `PURPOSE: Build credibility and trust
EMOTIONAL TONE: Confidence, trust
FOCUS: Social proof, results, testimonials
STYLE: Specific, quantified, authentic`,

  action: `PURPOSE: Drive conversion
EMOTIONAL TONE: Excitement, urgency
FOCUS: Clear next steps, value recap
STYLE: Direct, encouraging, low-friction`,
};

/**
 * Build content generation prompt for a section
 */
export function buildContentGenerationPrompt(params: {
  narrativeRole: NarrativeRole;
  componentType: string;
  availableContent: Record<string, unknown>;
  contentSlots: string[];
  brandVoice?: {
    tone: string;
    formality: string;
    personality?: string[];
  };
  personaContext?: string;
}): string {
  const { narrativeRole, componentType, availableContent, contentSlots, brandVoice, personaContext } =
    params;

  const stageGuidance = NARRATIVE_STAGE_GUIDANCE[narrativeRole] || NARRATIVE_STAGE_GUIDANCE.solution;

  return `Generate marketing content for a ${narrativeRole} section.

## Narrative Stage Guidance
${stageGuidance}

## Component Type
${componentType}

## Available Content Context
${JSON.stringify(availableContent, null, 2)}

## Content Slots to Fill
${contentSlots.map((slot) => `- ${slot}`).join('\n')}

${brandVoice ? `## Brand Voice Guidelines
- Tone: ${brandVoice.tone}
- Formality: ${brandVoice.formality}
${brandVoice.personality ? `- Personality traits: ${brandVoice.personality.join(', ')}` : ''}` : ''}

${personaContext ? `## Target Persona
${personaContext}` : ''}

## Instructions
Generate compelling marketing copy that:
1. Matches the ${narrativeRole} stage emotional tone
2. Follows brand voice guidelines
3. Fills all required content slots
4. Is concise but impactful
5. Uses specific details from available content when possible

Return JSON with the filled content slots.`;
}

/**
 * Build SEO metadata generation prompt
 */
export function buildSEOMetadataPrompt(params: {
  pageType: string;
  headline: string;
  description: string;
  brandName?: string;
  focusKeywords?: string[];
}): string {
  const { pageType, headline, description, brandName, focusKeywords } = params;

  return `Generate SEO metadata for a ${pageType} page.

Page headline: ${headline}
Page description: ${description}
${brandName ? `Brand name: ${brandName}` : ''}
${focusKeywords?.length ? `Focus keywords: ${focusKeywords.join(', ')}` : ''}

Return JSON:
{
  "title": "SEO-optimized title (50-60 chars)",
  "description": "Meta description (150-160 chars)",
  "keywords": ["keyword1", "keyword2", "..."]
}`;
}

/**
 * Build persona adaptation prompt
 */
export function buildPersonaAdaptationPrompt(params: {
  baseContent: Record<string, unknown>;
  persona: {
    name: string;
    communicationStyle: string;
    goals: string[];
    painPoints?: string[];
    decisionCriteria?: string[];
    journeyStage?: string;
  };
}): string {
  const { baseContent, persona } = params;

  return `Adapt the following marketing content for the ${persona.name} persona.

## Base Content
${JSON.stringify(baseContent, null, 2)}

## Persona Profile
- Communication style: ${persona.communicationStyle}
- Goals: ${persona.goals.join(', ')}
${persona.painPoints?.length ? `- Pain points: ${persona.painPoints.join(', ')}` : ''}
${persona.decisionCriteria?.length ? `- Decision criteria: ${persona.decisionCriteria.join(', ')}` : ''}
${persona.journeyStage ? `- Journey stage: ${persona.journeyStage}` : ''}

## Instructions
Adapt the content to:
1. Use language that resonates with this persona
2. Emphasize benefits relevant to their goals
3. Address their specific pain points
4. Match their preferred communication style
5. Consider their stage in the buyer journey

Return the adapted content in the same JSON structure as the base content.`;
}
