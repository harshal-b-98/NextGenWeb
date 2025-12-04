/**
 * AI Refinement Agent
 * Epic #146: Iterative Website Feedback & Refinement System
 *
 * Story #150: AI-powered agent for refining website section content
 * based on user feedback, with knowledge base grounding.
 */

import { createClient } from '@/lib/supabase/server';
import { completeJSON, complete } from '@/lib/ai/client';
import type { PopulatedContent } from '@/lib/content/types';
import type {
  RefinementContext,
  RefinementResult,
  BrandVoiceConfig,
  SectionSnapshot,
  FeedbackType,
} from './types';

// ============================================================================
// PROMPTS
// ============================================================================

const REFINEMENT_SYSTEM_PROMPT = `You are an expert marketing copywriter and website content specialist.
Your task is to refine website section content based on user feedback.

Key principles:
1. Only modify what the user explicitly asked for
2. Maintain brand voice consistency
3. Ground content in provided knowledge when possible
4. Keep marketing copy concise and impactful
5. Preserve the overall structure unless told otherwise
6. Use action-oriented language for CTAs
7. Ensure headlines are compelling and benefit-focused

You must respond with valid JSON only.`;

const STYLE_REFINEMENT_PROMPT = `You are a UI/UX design specialist helping refine website styling.
Suggest Tailwind CSS classes and design improvements based on user feedback.

Guidelines:
1. Use Tailwind CSS class names
2. Consider responsive design (mobile-first)
3. Maintain accessibility (contrast ratios, readable fonts)
4. Keep changes minimal and focused
5. Consider visual hierarchy

Respond with valid JSON only.`;

const ALTERNATIVE_OPTIONS_PROMPT = `You are a creative marketing specialist.
Generate alternative content options that address the user's feedback in different ways.
Each alternative should take a slightly different approach or tone.

Respond with valid JSON containing an array of alternative content objects.`;

// ============================================================================
// REFINEMENT AGENT CLASS
// ============================================================================

export class RefinementAgent {
  /**
   * Refine section content based on feedback
   */
  async refineContent(
    context: RefinementContext,
    feedbackText: string,
    feedbackType: FeedbackType
  ): Promise<RefinementResult> {
    const startTime = Date.now();

    // Get knowledge context from the workspace
    const knowledgeContext = await this.getKnowledgeContext(
      context.workspaceId,
      feedbackText
    );

    // Select refinement strategy based on feedback type
    switch (feedbackType) {
      case 'content':
        return this.refineContentText(context, feedbackText, knowledgeContext);
      case 'style':
        return this.refineStyle(context, feedbackText);
      case 'layout':
        return this.refineLayout(context, feedbackText);
      default:
        return this.refineContentText(context, feedbackText, knowledgeContext);
    }
  }

  /**
   * Refine text content (headlines, descriptions, etc.)
   */
  private async refineContentText(
    context: RefinementContext,
    feedbackText: string,
    knowledgeContext: string
  ): Promise<RefinementResult> {
    const prompt = this.buildContentRefinementPrompt(
      context,
      feedbackText,
      knowledgeContext
    );

    const result = await completeJSON<{
      refinedContent: PopulatedContent;
      changesSummary: string;
      confidence: number;
      reasoning: string;
    }>({
      messages: [
        { role: 'system', content: REFINEMENT_SYSTEM_PROMPT },
        { role: 'user', content: prompt },
      ],
    });

    return {
      refinedContent: result.data.refinedContent,
      changesSummary: result.data.changesSummary,
      confidence: result.data.confidence,
      reasoning: result.data.reasoning,
    };
  }

  /**
   * Refine visual styling
   */
  private async refineStyle(
    context: RefinementContext,
    feedbackText: string
  ): Promise<RefinementResult> {
    const prompt = `
SECTION: ${context.currentSection.componentId}
CURRENT CONTENT: ${JSON.stringify(context.currentSection.content, null, 2)}
CURRENT STYLING: ${JSON.stringify(context.currentSection.styling || {}, null, 2)}

USER FEEDBACK: "${feedbackText}"

Generate style recommendations. Return JSON:
{
  "refinedContent": { the current content with any necessary adjustments },
  "styleRecommendations": {
    "backgroundColor": "tailwind class or color",
    "textColor": "tailwind class or color",
    "spacing": "tailwind padding/margin classes",
    "typography": "font size/weight classes",
    "customClasses": "additional tailwind classes"
  },
  "changesSummary": "what styling changes were made",
  "confidence": 0.0-1.0,
  "reasoning": "why these changes address the feedback"
}
`;

    const result = await completeJSON<{
      refinedContent: PopulatedContent;
      styleRecommendations: Record<string, string>;
      changesSummary: string;
      confidence: number;
      reasoning: string;
    }>({
      messages: [
        { role: 'system', content: STYLE_REFINEMENT_PROMPT },
        { role: 'user', content: prompt },
      ],
    });

    return {
      refinedContent: result.data.refinedContent,
      changesSummary: result.data.changesSummary,
      confidence: result.data.confidence,
      reasoning: result.data.reasoning,
    };
  }

  /**
   * Refine layout/structure
   */
  private async refineLayout(
    context: RefinementContext,
    feedbackText: string
  ): Promise<RefinementResult> {
    const prompt = `
SECTION TYPE: ${context.currentSection.componentId}
CURRENT CONTENT: ${JSON.stringify(context.currentSection.content, null, 2)}

USER FEEDBACK: "${feedbackText}"

Suggest layout modifications. Consider:
- Content hierarchy
- Visual flow
- Component arrangement
- Mobile responsiveness

Return JSON:
{
  "refinedContent": { content with structural changes },
  "layoutChanges": [
    { "change": "description of layout change", "reason": "why" }
  ],
  "changesSummary": "summary of layout modifications",
  "confidence": 0.0-1.0,
  "reasoning": "how changes address the feedback"
}
`;

    const result = await completeJSON<{
      refinedContent: PopulatedContent;
      layoutChanges: Array<{ change: string; reason: string }>;
      changesSummary: string;
      confidence: number;
      reasoning: string;
    }>({
      messages: [
        { role: 'system', content: REFINEMENT_SYSTEM_PROMPT },
        { role: 'user', content: prompt },
      ],
    });

    return {
      refinedContent: result.data.refinedContent,
      changesSummary: result.data.changesSummary,
      confidence: result.data.confidence,
      reasoning: result.data.reasoning,
    };
  }

  /**
   * Generate alternative content options
   */
  async generateAlternatives(
    context: RefinementContext,
    feedbackText: string,
    count: number = 3
  ): Promise<PopulatedContent[]> {
    const knowledgeContext = await this.getKnowledgeContext(
      context.workspaceId,
      feedbackText
    );

    const prompt = `
SECTION TYPE: ${context.currentSection.componentId}
CURRENT CONTENT: ${JSON.stringify(context.currentSection.content, null, 2)}
USER FEEDBACK: "${feedbackText}"

KNOWLEDGE BASE CONTEXT:
${knowledgeContext}

${context.brandVoice ? `BRAND VOICE: ${JSON.stringify(context.brandVoice)}` : ''}

Generate ${count} alternative versions of the content that address the feedback.
Each version should take a slightly different approach:
1. More direct/action-oriented
2. More emotional/storytelling
3. More data-driven/specific

Return JSON:
{
  "alternatives": [
    { content object 1 },
    { content object 2 },
    { content object 3 }
  ]
}
`;

    const result = await completeJSON<{ alternatives: PopulatedContent[] }>({
      messages: [
        { role: 'system', content: ALTERNATIVE_OPTIONS_PROMPT },
        { role: 'user', content: prompt },
      ],
    });

    return result.data.alternatives;
  }

  /**
   * Refine specific field only
   */
  async refineField(
    context: RefinementContext,
    fieldPath: string,
    feedbackText: string
  ): Promise<RefinementResult> {
    const currentValue = this.getNestedValue(
      context.currentSection.content as unknown as Record<string, unknown>,
      fieldPath
    );

    const knowledgeContext = await this.getKnowledgeContext(
      context.workspaceId,
      feedbackText
    );

    const prompt = `
FIELD: ${fieldPath}
CURRENT VALUE: ${JSON.stringify(currentValue)}
USER FEEDBACK: "${feedbackText}"

KNOWLEDGE CONTEXT:
${knowledgeContext}

${context.brandVoice ? `BRAND VOICE: ${JSON.stringify(context.brandVoice)}` : ''}

Refine ONLY this specific field based on the feedback.

Return JSON:
{
  "newValue": "the refined value for this field",
  "changesSummary": "what was changed and why",
  "confidence": 0.0-1.0,
  "reasoning": "reasoning for the change"
}
`;

    const result = await completeJSON<{
      newValue: unknown;
      changesSummary: string;
      confidence: number;
      reasoning: string;
    }>({
      messages: [
        { role: 'system', content: REFINEMENT_SYSTEM_PROMPT },
        { role: 'user', content: prompt },
      ],
    });

    // Build refined content with only the targeted field changed
    const refinedContent = {
      ...context.currentSection.content,
    };
    this.setNestedValue(refinedContent, fieldPath, result.data.newValue);

    return {
      refinedContent,
      changesSummary: result.data.changesSummary,
      confidence: result.data.confidence,
      reasoning: result.data.reasoning,
    };
  }

  /**
   * Get knowledge context from workspace for grounding
   */
  private async getKnowledgeContext(
    workspaceId: string,
    query: string
  ): Promise<string> {
    const supabase = await createClient();

    // Get relevant knowledge items (simplified - in production would use embeddings)
    const { data: items } = await supabase
      .from('knowledge_base_items')
      .select('content, entity_type, metadata')
      .eq('workspace_id', workspaceId)
      .limit(5);

    if (!items || items.length === 0) {
      return 'No specific knowledge base context available.';
    }

    // Format knowledge context
    return items
      .map(item => {
        const content = item.content as string;
        const metadata = item.metadata as Record<string, unknown>;
        const name = metadata?.documentName || item.entity_type;
        return `[${name}]: ${content.slice(0, 500)}...`;
      })
      .join('\n\n');
  }

  /**
   * Build the content refinement prompt
   */
  private buildContentRefinementPrompt(
    context: RefinementContext,
    feedbackText: string,
    knowledgeContext: string
  ): string {
    const brandVoiceSection = context.brandVoice
      ? `
BRAND VOICE CONFIGURATION:
- Tone: ${context.brandVoice.tone}
- Personality: ${context.brandVoice.personality.join(', ')}
- Avoid: ${context.brandVoice.avoidTerms.join(', ')}
- Preferred phrases: ${context.brandVoice.preferredPhrases.join(', ')}
`
      : '';

    return `
SECTION TYPE: ${context.currentSection.componentId}
NARRATIVE ROLE: ${context.currentSection.narrativeRole}

CURRENT CONTENT:
${JSON.stringify(context.currentSection.content, null, 2)}

USER FEEDBACK: "${feedbackText}"

KNOWLEDGE BASE CONTEXT:
${knowledgeContext}
${brandVoiceSection}

${context.previousFeedback && context.previousFeedback.length > 0
  ? `
PREVIOUS FEEDBACK ON THIS SECTION:
${context.previousFeedback.map(f => `- ${f.feedbackText}`).join('\n')}
`
  : ''}

INSTRUCTIONS:
1. Analyze what the user wants changed
2. Make ONLY the requested changes
3. Ground new content in the knowledge base when relevant
4. Maintain the same JSON structure as the current content
5. Keep marketing copy concise and impactful

Return JSON:
{
  "refinedContent": {
    // Complete content object with changes applied
    // Use the same structure as CURRENT CONTENT
  },
  "changesSummary": "Brief description of what was changed",
  "confidence": 0.0-1.0,
  "reasoning": "Why these changes address the user's feedback"
}
`;
  }

  /**
   * Get nested value from object using dot notation path
   */
  private getNestedValue(obj: Record<string, unknown>, path: string): unknown {
    const keys = path.split('.');
    let current: unknown = obj;

    for (const key of keys) {
      if (current === null || current === undefined) {
        return undefined;
      }
      // Handle array notation like "features[0]"
      const arrayMatch = key.match(/^(\w+)\[(\d+)\]$/);
      if (arrayMatch) {
        const [, arrayKey, index] = arrayMatch;
        current = (current as Record<string, unknown[]>)[arrayKey]?.[parseInt(index)];
      } else {
        current = (current as Record<string, unknown>)[key];
      }
    }

    return current;
  }

  /**
   * Set nested value in object using dot notation path
   */
  private setNestedValue(
    obj: Record<string, unknown>,
    path: string,
    value: unknown
  ): void {
    const keys = path.split('.');
    let current: Record<string, unknown> = obj;

    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      const arrayMatch = key.match(/^(\w+)\[(\d+)\]$/);

      if (arrayMatch) {
        const [, arrayKey, index] = arrayMatch;
        if (!current[arrayKey]) {
          current[arrayKey] = [];
        }
        const arr = current[arrayKey] as unknown[];
        if (!arr[parseInt(index)]) {
          arr[parseInt(index)] = {};
        }
        current = arr[parseInt(index)] as Record<string, unknown>;
      } else {
        if (!current[key]) {
          current[key] = {};
        }
        current = current[key] as Record<string, unknown>;
      }
    }

    const lastKey = keys[keys.length - 1];
    const arrayMatch = lastKey.match(/^(\w+)\[(\d+)\]$/);

    if (arrayMatch) {
      const [, arrayKey, index] = arrayMatch;
      if (!current[arrayKey]) {
        current[arrayKey] = [];
      }
      (current[arrayKey] as unknown[])[parseInt(index)] = value;
    } else {
      current[lastKey] = value;
    }
  }
}

// ============================================================================
// SPECIALIZED REFINEMENT FUNCTIONS
// ============================================================================

/**
 * Refine a headline to be more compelling
 */
export async function refineHeadline(
  currentHeadline: string,
  feedback: string,
  context?: { tone?: string; maxLength?: number }
): Promise<{ headline: string; reasoning: string }> {
  const prompt = `
CURRENT HEADLINE: "${currentHeadline}"
FEEDBACK: "${feedback}"
${context?.tone ? `TONE: ${context.tone}` : ''}
${context?.maxLength ? `MAX LENGTH: ${context.maxLength} characters` : ''}

Write an improved headline that addresses the feedback.

Return JSON:
{
  "headline": "the improved headline",
  "reasoning": "why this headline is better"
}
`;

  const result = await completeJSON<{ headline: string; reasoning: string }>({
    messages: [
      { role: 'system', content: 'You are an expert copywriter specializing in compelling headlines.' },
      { role: 'user', content: prompt },
    ],
  });

  return result.data;
}

/**
 * Refine a CTA to be more action-oriented
 */
export async function refineCTA(
  currentCTA: { text: string; link: string },
  feedback: string,
  context?: { stage?: string; urgency?: boolean }
): Promise<{ text: string; reasoning: string }> {
  const prompt = `
CURRENT CTA TEXT: "${currentCTA.text}"
FEEDBACK: "${feedback}"
${context?.stage ? `BUYER STAGE: ${context.stage}` : ''}
${context?.urgency ? 'URGENCY: Include urgency element' : ''}

Write an improved CTA button text that addresses the feedback.
Keep it concise (2-5 words).

Return JSON:
{
  "text": "the improved CTA text",
  "reasoning": "why this CTA is more effective"
}
`;

  const result = await completeJSON<{ text: string; reasoning: string }>({
    messages: [
      { role: 'system', content: 'You are a conversion optimization specialist.' },
      { role: 'user', content: prompt },
    ],
  });

  return result.data;
}

/**
 * Refine description text
 */
export async function refineDescription(
  currentDescription: string,
  feedback: string,
  context?: { maxLength?: number; includeStats?: boolean }
): Promise<{ description: string; reasoning: string }> {
  const prompt = `
CURRENT DESCRIPTION: "${currentDescription}"
FEEDBACK: "${feedback}"
${context?.maxLength ? `MAX LENGTH: ${context.maxLength} characters` : ''}
${context?.includeStats ? 'INCLUDE: Specific statistics or numbers where possible' : ''}

Write an improved description that addresses the feedback.

Return JSON:
{
  "description": "the improved description",
  "reasoning": "why this description is better"
}
`;

  const result = await completeJSON<{ description: string; reasoning: string }>({
    messages: [
      { role: 'system', content: 'You are an expert marketing copywriter.' },
      { role: 'user', content: prompt },
    ],
  });

  return result.data;
}

// ============================================================================
// EXPORTS
// ============================================================================

export const refinementAgent = new RefinementAgent();

export async function refineContent(
  context: RefinementContext,
  feedbackText: string,
  feedbackType: FeedbackType
): Promise<RefinementResult> {
  return refinementAgent.refineContent(context, feedbackText, feedbackType);
}

export async function generateAlternatives(
  context: RefinementContext,
  feedbackText: string,
  count?: number
): Promise<PopulatedContent[]> {
  return refinementAgent.generateAlternatives(context, feedbackText, count);
}

export async function refineField(
  context: RefinementContext,
  fieldPath: string,
  feedbackText: string
): Promise<RefinementResult> {
  return refinementAgent.refineField(context, fieldPath, feedbackText);
}
