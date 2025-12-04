/**
 * Component Selector Agent
 *
 * AI agent that selects the best component templates based on:
 * - Knowledge base context
 * - Industry/tone analysis
 * - Page type
 * - Brand configuration
 *
 * Uses Claude Sonnet 4 to make intelligent template selections
 */

import { completeJSON } from '../client';
import { getTemplatesByType, getCatalogStats } from '@/lib/components/templates/catalog';
import type {
  ComponentTemplate,
  SectionType,
  TemplateSelectionRequest,
  TemplateSelectionResponse,
} from '@/lib/components/templates/types';

interface SelectionContext {
  sectionType: SectionType;
  kbSummary: string;
  industry?: string;
  tone?: string;
  pageType: 'home' | 'features' | 'pricing' | 'about' | 'contact';
  brandConfig?: {
    primaryColor?: string;
    style?: string;
  };
}

interface SelectionResult {
  selectedTemplate: ComponentTemplate;
  reasoning: string;
  confidence: number;
  alternatives: Array<{
    templateId: string;
    reason: string;
  }>;
}

/**
 * Select the best component template using AI
 */
export async function selectComponentTemplate(
  context: SelectionContext
): Promise<SelectionResult> {
  // Get available templates for this section type
  const availableTemplates = getTemplatesByType(context.sectionType);

  if (availableTemplates.length === 0) {
    throw new Error(`No templates available for type: ${context.sectionType}`);
  }

  // Build template descriptions for Claude
  const templateDescriptions = availableTemplates.map((t) => ({
    id: t.id,
    name: t.name,
    bestFor: t.aiMetadata.bestFor,
    tone: t.aiMetadata.tone,
    industries: t.aiMetadata.industries,
    complexity: t.aiMetadata.complexity,
    features: t.aiMetadata.features,
  }));

  // Ask Claude to select the best template
  const selection = await completeJSON<{
    selectedTemplateId: string;
    reasoning: string;
    confidence: number;
    alternatives: Array<{
      templateId: string;
      reason: string;
    }>;
  }>({
    messages: [
      {
        role: 'system',
        content: `You are an expert UI/UX designer selecting the best component template for a website.

Analyze the business context and select the most appropriate template that:
1. Matches the industry and tone
2. Fits the page type and purpose
3. Aligns with brand style
4. Provides the best user experience

Return JSON with your selection and reasoning.`,
      },
      {
        role: 'user',
        content: `Select the best ${context.sectionType} template for this context:

**Business Context:**
${context.kbSummary}

**Page Type:** ${context.pageType}
${context.industry ? `**Industry:** ${context.industry}` : ''}
${context.tone ? `**Desired Tone:** ${context.tone}` : ''}
${context.brandConfig?.style ? `**Brand Style:** ${context.brandConfig.style}` : ''}

**Available Templates:**
${JSON.stringify(templateDescriptions, null, 2)}

Select the BEST template and explain why. Also suggest 1-2 alternatives.

Return JSON:
{
  "selectedTemplateId": "template-id",
  "reasoning": "Why this template is the best fit (2-3 sentences)",
  "confidence": 0.85,
  "alternatives": [
    {
      "templateId": "alt-template-id",
      "reason": "Why this could also work"
    }
  ]
}`,
      },
    ],
    config: {
      provider: 'anthropic',
      model: 'claude-sonnet-4-20250514',
      temperature: 0.3, // Lower temperature for more consistent selection
      maxTokens: 1024,
    },
  });

  const selectedTemplate = availableTemplates.find((t) => t.id === selection.data.selectedTemplateId);

  if (!selectedTemplate) {
    // Fallback to first template if selection fails
    console.warn('Selected template not found, using fallback');
    return {
      selectedTemplate: availableTemplates[0],
      reasoning: 'Fallback selection',
      confidence: 0.5,
      alternatives: [],
    };
  }

  return {
    selectedTemplate,
    reasoning: selection.data.reasoning,
    confidence: selection.data.confidence,
    alternatives: selection.data.alternatives,
  };
}

/**
 * Select multiple templates for a complete page
 */
export async function selectPageTemplates(context: {
  pageType: 'home' | 'features' | 'pricing' | 'about' | 'contact';
  kbSummary: string;
  industry?: string;
  tone?: string;
  brandConfig?: any;
}): Promise<Array<{ sectionType: SectionType; template: ComponentTemplate; reasoning: string }>> {
  // Define typical section structure for each page type
  const pageSections: Record<string, SectionType[]> = {
    home: ['hero', 'features', 'testimonials', 'cta'],
    features: ['hero', 'features', 'cta'],
    pricing: ['hero', 'pricing', 'faq', 'cta'],
    about: ['hero', 'team', 'timeline', 'cta'],
    contact: ['hero', 'contact', 'cta'],
  };

  const sections = pageSections[context.pageType] || ['hero', 'features', 'cta'];

  const selections = [];

  for (const sectionType of sections) {
    const result = await selectComponentTemplate({
      sectionType,
      kbSummary: context.kbSummary,
      industry: context.industry,
      tone: context.tone,
      pageType: context.pageType,
      brandConfig: context.brandConfig,
    });

    selections.push({
      sectionType,
      template: result.selectedTemplate,
      reasoning: result.reasoning,
    });
  }

  return selections;
}

/**
 * Get catalog statistics
 */
export function getStats() {
  return getCatalogStats();
}
