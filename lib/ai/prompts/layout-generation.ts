/**
 * Layout Generation Prompts
 *
 * Prompt templates for generating page layouts and component selections.
 */

import type { NarrativeRole } from '@/lib/layout/types';

/**
 * System prompt for layout generation
 */
export const LAYOUT_GENERATION_SYSTEM_PROMPT =
  'You are an expert web page layout generator. Always respond with valid JSON.';

/**
 * Build a detailed layout generation prompt with all context
 */
export function buildLayoutGenerationPrompt(params: {
  pageType: string;
  componentList: string;
  pageConfig: {
    name: string;
    description: string;
    requiredSections: string[];
    minSections: number;
    maxSections: number;
    recommendedComponents: string[];
  };
  storyFlow: NarrativeRole[];
  availableContent: Record<string, unknown>;
  personas: Array<{
    name: string;
    communication_style?: string;
    goals: string[];
  }>;
  brandConfig?: {
    voice: {
      tone: string;
      formality: string;
    };
  };
  constraints?: Record<string, unknown>;
}): string {
  const {
    pageType,
    componentList,
    pageConfig,
    storyFlow,
    availableContent,
    personas,
    brandConfig,
    constraints,
  } = params;

  return `
You are an expert web page layout generator. Generate a layout for a ${pageType} page.

## Available Components
${componentList}

## Page Configuration
- Type: ${pageType}
- Name: ${pageConfig.name}
- Description: ${pageConfig.description}
- Required sections: ${pageConfig.requiredSections.join(', ')}
- Min sections: ${pageConfig.minSections}
- Max sections: ${pageConfig.maxSections}
- Recommended components: ${pageConfig.recommendedComponents.join(', ')}

## Storytelling Flow
Follow this narrative structure: ${storyFlow.join(' → ')}

## Available Content
${JSON.stringify(availableContent, null, 2)}

## Target Personas
${personas.map((p) => `- ${p.name}: ${p.communication_style || 'general'} style, goals: ${p.goals.join(', ')}`).join('\n')}

## Brand Voice
${brandConfig ? `Tone: ${brandConfig.voice.tone}, Formality: ${brandConfig.voice.formality}` : 'Professional, modern'}

## Constraints
${constraints ? JSON.stringify(constraints) : 'None'}

## Instructions
1. Select the most appropriate components for each narrative stage
2. Map available content to component requirements
3. Ensure visual variety (no repeated component types)
4. Follow the storytelling flow strictly
5. Consider persona preferences for component selection

Return a JSON object with:
{
  "sections": [
    {
      "componentId": "component-name",
      "narrativeRole": "hook|problem|solution|proof|action",
      "contentMapping": { "contentKey": "componentProp" },
      "reasoning": "Why this component was selected"
    }
  ],
  "metadata": {
    "title": "Page title for SEO",
    "description": "Meta description",
    "keywords": ["keyword1", "keyword2"]
  }
}`;
}
