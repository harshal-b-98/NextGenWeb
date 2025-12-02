/**
 * Storyline Generation Agent
 *
 * AI-powered agent that creates compelling narrative flows for marketing pages
 * by analyzing knowledge base content and adapting to target personas.
 */

import OpenAI from 'openai';
import { createClient } from '@/lib/supabase/server';
import { v4 as uuidv4 } from 'uuid';
import { PageType, NarrativeRole, EmotionalTone, StoryFlow, StoryStage } from '@/lib/layout/types';
import {
  CoreNarrative,
  ContentBlock,
  PersonaStoryVariation,
  PersonaNarrativeAdaptation,
  EmotionalJourney,
  StorylineGenerationInput,
  StorylineGenerationResult,
  HookStrategy,
  CTAStrategy,
  CoreNarrativeSchema,
} from './types';
import {
  NARRATIVE_TEMPLATES,
  getDefaultStoryFlow,
  generateEmotionalJourney,
  HOOK_STRATEGY_PROMPTS,
  CTA_STRATEGY_PROMPTS,
} from './templates';

// ============================================================================
// OPENAI CLIENT
// ============================================================================

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ============================================================================
// DATABASE INTERFACES
// ============================================================================

interface KnowledgeBaseItem {
  id: string;
  entity_type: string;
  content: string;
  metadata: Record<string, unknown>;
}

interface PersonaRecord {
  id: string;
  name: string;
  description: string | null;
  attributes: Record<string, unknown>;
  pain_points: string[];
  goals: string[];
  decision_criteria: string[];
  objections: string[];
  communication_style: string;
  buyer_journey_stage: string;
  content_preferences: Record<string, unknown>;
}

interface BrandConfigRecord {
  id: string;
  name: string;
  colors: Record<string, unknown>;
  typography: Record<string, unknown>;
  voice: Record<string, unknown>;
  industry: string | null;
  target_audience: string | null;
}

// ============================================================================
// STORYLINE GENERATION AGENT
// ============================================================================

export class StorylineGenerationAgent {
  private tokensUsed = 0;

  /**
   * Main entry point - generate complete storyline
   */
  async generateStoryline(input: StorylineGenerationInput): Promise<StorylineGenerationResult> {
    const startTime = Date.now();

    // 1. Fetch required data from database
    const [knowledgeItems, personas, brandConfig] = await Promise.all([
      this.fetchKnowledgeBase(input.workspaceId, input.knowledgeBaseId),
      this.fetchPersonas(input.workspaceId, input.personas),
      input.brandConfigId ? this.fetchBrandConfig(input.brandConfigId) : Promise.resolve(null),
    ]);

    // 2. Identify core narrative from knowledge base
    const narrative = await this.identifyNarrative(knowledgeItems, brandConfig);

    // 3. Build default story flow based on page type
    const defaultFlow = await this.buildStoryFlow(narrative, input.pageType, input.constraints);

    // 4. Generate content blocks mapped to story stages
    const contentBlocks = await this.generateContentBlocks(
      narrative,
      knowledgeItems,
      input.pageType,
      input.contentHints
    );

    // 5. Create persona-specific variations
    const personaVariations = await this.createPersonaVariations(
      narrative,
      defaultFlow,
      contentBlocks,
      personas
    );

    // 6. Generate emotional journey map
    const emotionalJourney = this.buildEmotionalJourney(input.pageType, narrative);

    const endTime = Date.now();

    return {
      narrative,
      defaultFlow,
      personaVariations,
      contentBlocks,
      emotionalJourney,
      metadata: {
        generatedAt: new Date().toISOString(),
        modelUsed: 'gpt-4-turbo',
        tokensUsed: this.tokensUsed,
        generationTimeMs: endTime - startTime,
        knowledgeItemsUsed: knowledgeItems.length,
      },
    };
  }

  // ==========================================================================
  // DATA FETCHING
  // ==========================================================================

  private async fetchKnowledgeBase(
    workspaceId: string,
    knowledgeBaseId: string
  ): Promise<KnowledgeBaseItem[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('knowledge_base_items')
      .select('id, entity_type, content, metadata')
      .eq('workspace_id', workspaceId)
      .limit(100);

    if (error) {
      console.error('Error fetching knowledge base:', error);
      return [];
    }

    return (data || []) as KnowledgeBaseItem[];
  }

  private async fetchPersonas(workspaceId: string, personaIds: string[]): Promise<PersonaRecord[]> {
    if (personaIds.length === 0) return [];

    const supabase = await createClient();

    const { data, error } = await supabase
      .from('personas')
      .select('*')
      .eq('workspace_id', workspaceId)
      .in('id', personaIds);

    if (error) {
      console.error('Error fetching personas:', error);
      return [];
    }

    return (data || []) as PersonaRecord[];
  }

  private async fetchBrandConfig(brandConfigId: string): Promise<BrandConfigRecord | null> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('brand_configs')
      .select('id, name, colors, typography, voice, industry, target_audience')
      .eq('id', brandConfigId)
      .single();

    if (error) {
      console.error('Error fetching brand config:', error);
      return null;
    }

    return data as BrandConfigRecord;
  }

  // ==========================================================================
  // NARRATIVE IDENTIFICATION
  // ==========================================================================

  private async identifyNarrative(
    knowledgeItems: KnowledgeBaseItem[],
    brandConfig: BrandConfigRecord | null
  ): Promise<CoreNarrative> {
    // Organize knowledge items by type
    const itemsByType = this.organizeByType(knowledgeItems);

    // Try LLM-based narrative identification
    try {
      return await this.identifyNarrativeWithLLM(itemsByType, brandConfig);
    } catch (error) {
      console.error('LLM narrative identification failed, using fallback:', error);
      return this.identifyNarrativeFallback(itemsByType);
    }
  }

  private organizeByType(items: KnowledgeBaseItem[]): Record<string, KnowledgeBaseItem[]> {
    const organized: Record<string, KnowledgeBaseItem[]> = {};

    for (const item of items) {
      const type = item.entity_type || 'general';
      if (!organized[type]) {
        organized[type] = [];
      }
      organized[type].push(item);
    }

    return organized;
  }

  private async identifyNarrativeWithLLM(
    itemsByType: Record<string, KnowledgeBaseItem[]>,
    brandConfig: BrandConfigRecord | null
  ): Promise<CoreNarrative> {
    // Prepare content summary for LLM
    const contentSummary = this.prepareContentSummary(itemsByType);
    const brandContext = brandConfig
      ? `Brand Voice: ${JSON.stringify(brandConfig.voice)}\nTarget Audience: ${brandConfig.target_audience || 'Not specified'}\nIndustry: ${brandConfig.industry || 'Not specified'}`
      : 'No specific brand guidelines provided.';

    const prompt = `Analyze the following knowledge base content and identify the core marketing narrative.

CONTENT SUMMARY:
${contentSummary}

BRAND CONTEXT:
${brandContext}

Based on this content, identify:
1. Central Theme: The main message or theme
2. Value Proposition: The unique value offered
3. Differentiators: What makes this offering unique (list 3-5)
4. Target Audience: Who this is for
5. Transformation: The before/after state for customers
6. Pain Points: Key problems addressed (list 3-5)
7. Benefits: Key benefits offered (list 3-5)
8. Proof Elements: Available social proof (testimonials, case studies, statistics, awards, certifications)

Respond in JSON format matching this structure:
{
  "centralTheme": "string",
  "valueProposition": "string",
  "differentiators": ["string"],
  "targetAudience": "string",
  "transformation": {
    "before": "string",
    "after": "string"
  },
  "painPoints": ["string"],
  "benefits": ["string"],
  "proofElements": [
    {"type": "testimonial|case_study|statistic|award|certification", "count": number, "strength": "high|medium|low"}
  ]
}`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo',
      messages: [
        {
          role: 'system',
          content:
            'You are an expert marketing strategist who identifies compelling narratives from content. Respond only with valid JSON.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 1500,
      response_format: { type: 'json_object' },
    });

    this.tokensUsed += response.usage?.total_tokens || 0;

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from LLM');
    }

    const parsed = JSON.parse(content);
    const validated = CoreNarrativeSchema.parse(parsed);

    return validated;
  }

  private prepareContentSummary(itemsByType: Record<string, KnowledgeBaseItem[]>): string {
    const summaries: string[] = [];

    for (const [type, items] of Object.entries(itemsByType)) {
      const itemSummaries = items.slice(0, 5).map((item) => {
        const meta = item.metadata as Record<string, unknown>;
        const name = (meta?.name as string) || (meta?.title as string) || 'Untitled';
        const desc =
          (meta?.description as string) || item.content.substring(0, 200) + '...';
        return `- ${name}: ${desc}`;
      });

      summaries.push(`\n${type.toUpperCase()} (${items.length} items):\n${itemSummaries.join('\n')}`);
    }

    return summaries.join('\n');
  }

  private identifyNarrativeFallback(
    itemsByType: Record<string, KnowledgeBaseItem[]>
  ): CoreNarrative {
    // Extract what we can from the knowledge items
    const features = itemsByType['feature'] || [];
    const benefits = itemsByType['benefit'] || [];
    const painPoints = itemsByType['pain_point'] || [];
    const testimonials = itemsByType['testimonial'] || [];
    const caseStudies = itemsByType['case_study'] || [];
    const statistics = itemsByType['statistic'] || [];

    const getName = (item: KnowledgeBaseItem): string => {
      const meta = item.metadata as Record<string, unknown>;
      return (meta?.name as string) || (meta?.title as string) || item.content.substring(0, 50);
    };

    return {
      centralTheme: 'Transform your business with our innovative solution',
      valueProposition:
        features.length > 0
          ? getName(features[0])
          : 'Comprehensive solution for your needs',
      differentiators: features.slice(0, 3).map((f) => getName(f)),
      targetAudience: 'Business professionals seeking efficiency and growth',
      transformation: {
        before:
          painPoints.length > 0 ? getName(painPoints[0]) : 'Manual, time-consuming processes',
        after:
          benefits.length > 0 ? getName(benefits[0]) : 'Streamlined, automated workflows',
      },
      painPoints: painPoints.slice(0, 5).map((p) => getName(p)),
      benefits: benefits.slice(0, 5).map((b) => getName(b)),
      proofElements: [
        ...(testimonials.length > 0
          ? [
              {
                type: 'testimonial' as const,
                count: testimonials.length,
                strength: (testimonials.length > 5 ? 'high' : 'medium') as 'high' | 'medium' | 'low',
              },
            ]
          : []),
        ...(caseStudies.length > 0
          ? [
              {
                type: 'case_study' as const,
                count: caseStudies.length,
                strength: (caseStudies.length > 3 ? 'high' : 'medium') as 'high' | 'medium' | 'low',
              },
            ]
          : []),
        ...(statistics.length > 0
          ? [
              {
                type: 'statistic' as const,
                count: statistics.length,
                strength: (statistics.length > 5 ? 'high' : 'medium') as 'high' | 'medium' | 'low',
              },
            ]
          : []),
      ],
    };
  }

  // ==========================================================================
  // STORY FLOW BUILDING
  // ==========================================================================

  private async buildStoryFlow(
    narrative: CoreNarrative,
    pageType: PageType,
    constraints?: StorylineGenerationInput['constraints']
  ): Promise<StoryFlow> {
    // Get base flow from template
    const baseFlow = getDefaultStoryFlow(pageType);
    const template = NARRATIVE_TEMPLATES[pageType];

    // Apply constraints if provided
    if (constraints?.requiredStages) {
      // Ensure required stages are included
      const existingRoles = new Set(baseFlow.stages.map((s) => s.narrativeRole));
      for (const requiredStage of constraints.requiredStages) {
        if (!existingRoles.has(requiredStage)) {
          baseFlow.stages.push({
            name: requiredStage,
            narrativeRole: requiredStage,
            emotionalTone: this.getEmotionalTone(requiredStage),
            description: template.stageGuidance[requiredStage]?.purpose || '',
          });
        }
      }
    }

    // Enhance stages with narrative-specific details
    const enhancedStages: StoryStage[] = baseFlow.stages.map((stage) => ({
      ...stage,
      description: this.enhanceStageDescription(stage, narrative),
    }));

    return { stages: enhancedStages };
  }

  private getEmotionalTone(stage: NarrativeRole): EmotionalTone {
    const mapping: Record<NarrativeRole, EmotionalTone> = {
      hook: 'curiosity',
      problem: 'empathy',
      solution: 'hope',
      proof: 'confidence',
      action: 'excitement',
    };
    return mapping[stage];
  }

  private enhanceStageDescription(stage: StoryStage, narrative: CoreNarrative): string {
    switch (stage.narrativeRole) {
      case 'hook':
        return `Capture attention with: "${narrative.valueProposition}"`;
      case 'problem':
        return `Address pain points: ${narrative.painPoints.slice(0, 2).join(', ')}`;
      case 'solution':
        return `Present solution leading to: "${narrative.transformation.after}"`;
      case 'proof':
        return `Build credibility with ${narrative.proofElements.map((p) => p.type).join(', ')}`;
      case 'action':
        return `Drive action with clear next steps`;
      default:
        return stage.description;
    }
  }

  // ==========================================================================
  // CONTENT BLOCK GENERATION
  // ==========================================================================

  private async generateContentBlocks(
    narrative: CoreNarrative,
    knowledgeItems: KnowledgeBaseItem[],
    pageType: PageType,
    contentHints?: StorylineGenerationInput['contentHints']
  ): Promise<ContentBlock[]> {
    const template = NARRATIVE_TEMPLATES[pageType];
    const contentBlocks: ContentBlock[] = [];

    // Map knowledge items to stages
    const itemsByStage = this.mapItemsToStages(knowledgeItems, narrative);

    // Generate blocks for each stage
    const stages: NarrativeRole[] = ['hook', 'problem', 'solution', 'proof', 'action'];

    for (const stage of stages) {
      const distribution = template.contentDistribution[stage];
      const stageItems = itemsByStage[stage] || [];
      const guidance = template.stageGuidance[stage];

      // Skip if not applicable
      if (distribution.recommended === 0 && stageItems.length === 0) {
        continue;
      }

      // Generate content blocks for this stage
      const stageBlocks = await this.generateStageBlocks(
        stage,
        stageItems,
        narrative,
        distribution.recommended,
        guidance.contentTypes,
        contentHints
      );

      contentBlocks.push(...stageBlocks);
    }

    return contentBlocks;
  }

  private mapItemsToStages(
    items: KnowledgeBaseItem[],
    narrative: CoreNarrative
  ): Record<NarrativeRole, KnowledgeBaseItem[]> {
    const mapping: Record<NarrativeRole, KnowledgeBaseItem[]> = {
      hook: [],
      problem: [],
      solution: [],
      proof: [],
      action: [],
    };

    // Map entity types to narrative stages
    const typeToStage: Record<string, NarrativeRole> = {
      value_proposition: 'hook',
      headline: 'hook',
      pain_point: 'problem',
      challenge: 'problem',
      feature: 'solution',
      benefit: 'solution',
      process: 'solution',
      comparison: 'solution',
      testimonial: 'proof',
      case_study: 'proof',
      statistic: 'proof',
      award: 'proof',
      certification: 'proof',
      cta: 'action',
      offer: 'action',
    };

    for (const item of items) {
      const stage = typeToStage[item.entity_type] || 'solution';
      mapping[stage].push(item);
    }

    return mapping;
  }

  private async generateStageBlocks(
    stage: NarrativeRole,
    items: KnowledgeBaseItem[],
    narrative: CoreNarrative,
    targetCount: number,
    contentTypes: string[],
    contentHints?: StorylineGenerationInput['contentHints']
  ): Promise<ContentBlock[]> {
    const blocks: ContentBlock[] = [];
    const emotionalTone = this.getEmotionalTone(stage);

    // Generate blocks from knowledge items
    for (let i = 0; i < Math.min(items.length, targetCount); i++) {
      const item = items[i];
      const meta = item.metadata as Record<string, unknown>;

      blocks.push({
        id: uuidv4(),
        stage,
        priority: i + 1,
        content: {
          headline: (meta?.name as string) || (meta?.title as string) || `${stage} content`,
          description:
            (meta?.description as string) ||
            item.content.substring(0, 300),
          bullets: (meta?.bullets as string[]) || undefined,
          entityIds: [item.id],
          contentType: this.mapToContentType(item.entity_type),
        },
        targetPersonas: [],
        emotionalTone,
        suggestedComponents: this.getSuggestedComponents(stage, item.entity_type),
      });
    }

    // If we need more blocks than we have items, generate placeholders
    if (blocks.length < targetCount) {
      const placeholderBlocks = this.generatePlaceholderBlocks(
        stage,
        narrative,
        targetCount - blocks.length,
        emotionalTone
      );
      blocks.push(...placeholderBlocks);
    }

    return blocks;
  }

  private mapToContentType(
    entityType: string
  ): ContentBlock['content']['contentType'] {
    const mapping: Record<string, ContentBlock['content']['contentType']> = {
      value_proposition: 'value_proposition',
      feature: 'feature',
      benefit: 'benefit',
      pain_point: 'pain_point',
      testimonial: 'testimonial',
      case_study: 'case_study',
      statistic: 'statistic',
      comparison: 'comparison',
      process: 'process',
      faq: 'faq',
      cta: 'cta',
    };
    return mapping[entityType] || 'feature';
  }

  private getSuggestedComponents(stage: NarrativeRole, entityType: string): string[] {
    // Suggest components based on stage and content type
    const suggestions: Record<NarrativeRole, Record<string, string[]>> = {
      hook: {
        default: ['hero-centered', 'hero-split', 'hero-video'],
        value_proposition: ['hero-centered', 'hero-split'],
        statistic: ['hero-stats', 'stats-grid'],
      },
      problem: {
        default: ['pain-points', 'problem-solution'],
        pain_point: ['pain-points', 'problem-agitation'],
        statistic: ['stats-impact', 'stats-grid'],
      },
      solution: {
        default: ['features-grid', 'features-alternating'],
        feature: ['features-grid', 'features-cards', 'features-tabs'],
        benefit: ['benefits-list', 'benefits-cards'],
        process: ['process-steps', 'timeline-vertical'],
        comparison: ['comparison-table', 'comparison-cards'],
      },
      proof: {
        default: ['testimonials-grid', 'social-proof'],
        testimonial: ['testimonials-carousel', 'testimonials-grid', 'testimonials-featured'],
        case_study: ['case-study-card', 'case-study-featured'],
        statistic: ['stats-grid', 'stats-counter'],
      },
      action: {
        default: ['cta-centered', 'cta-split'],
        cta: ['cta-centered', 'cta-banner', 'cta-floating'],
      },
    };

    const stageSuggestions = suggestions[stage];
    return stageSuggestions[entityType] || stageSuggestions['default'] || [];
  }

  private generatePlaceholderBlocks(
    stage: NarrativeRole,
    narrative: CoreNarrative,
    count: number,
    emotionalTone: EmotionalTone
  ): ContentBlock[] {
    const blocks: ContentBlock[] = [];

    for (let i = 0; i < count; i++) {
      const content = this.getPlaceholderContent(stage, narrative, i);

      blocks.push({
        id: uuidv4(),
        stage,
        priority: 100 + i,
        content: {
          headline: content.headline,
          description: content.description,
          entityIds: [],
          contentType: content.contentType,
        },
        targetPersonas: [],
        emotionalTone,
        suggestedComponents: this.getSuggestedComponents(stage, content.contentType),
      });
    }

    return blocks;
  }

  private getPlaceholderContent(
    stage: NarrativeRole,
    narrative: CoreNarrative,
    index: number
  ): { headline: string; description: string; contentType: ContentBlock['content']['contentType'] } {
    switch (stage) {
      case 'hook':
        return {
          headline: narrative.valueProposition,
          description: `Transform from "${narrative.transformation.before}" to "${narrative.transformation.after}"`,
          contentType: 'value_proposition',
        };
      case 'problem':
        return {
          headline: narrative.painPoints[index] || 'Common Challenge',
          description: `Many organizations struggle with ${narrative.painPoints[index] || 'efficiency'}.`,
          contentType: 'pain_point',
        };
      case 'solution':
        return {
          headline: narrative.benefits[index] || narrative.differentiators[index] || 'Key Feature',
          description: `Our solution provides ${narrative.benefits[index] || 'significant value'}.`,
          contentType: index < 2 ? 'benefit' : 'feature',
        };
      case 'proof':
        return {
          headline: 'Trusted by Industry Leaders',
          description: 'See how organizations have achieved success.',
          contentType: 'testimonial',
        };
      case 'action':
        return {
          headline: 'Ready to Get Started?',
          description: 'Take the first step towards transformation.',
          contentType: 'cta',
        };
      default:
        return {
          headline: 'Content Block',
          description: 'Additional content.',
          contentType: 'feature',
        };
    }
  }

  // ==========================================================================
  // PERSONA VARIATIONS
  // ==========================================================================

  private async createPersonaVariations(
    narrative: CoreNarrative,
    defaultFlow: StoryFlow,
    contentBlocks: ContentBlock[],
    personas: PersonaRecord[]
  ): Promise<PersonaStoryVariation[]> {
    const variations: PersonaStoryVariation[] = [];

    for (const persona of personas) {
      const adaptation = this.createPersonaAdaptation(persona, narrative);
      const adaptedFlow = this.adaptFlowForPersona(defaultFlow, adaptation);
      const adaptedBlocks = this.adaptContentBlocksForPersona(contentBlocks, persona, adaptation);
      const sectionOverrides = this.generateSectionOverrides(persona, narrative);

      variations.push({
        personaId: persona.id,
        storyFlow: adaptedFlow,
        adaptation,
        contentBlocks: adaptedBlocks,
        sectionOverrides,
      });
    }

    return variations;
  }

  private createPersonaAdaptation(
    persona: PersonaRecord,
    narrative: CoreNarrative
  ): PersonaNarrativeAdaptation {
    // Determine hook strategy based on persona
    const hookStrategy = this.selectHookStrategy(persona);
    const ctaApproach = this.selectCTAStrategy(persona);
    const languageStyle = (persona.communication_style as 'technical' | 'business' | 'executive') || 'business';

    return {
      personaId: persona.id,
      hookStrategy,
      problemFraming: {
        emphasis: persona.pain_points?.slice(0, 3) || [],
        languageStyle,
        quantification: languageStyle === 'executive' || languageStyle === 'business',
      },
      solutionEmphasis: this.selectSolutionEmphasis(persona, narrative),
      proofPriority: this.selectProofPriority(persona),
      ctaApproach,
      contentDensity: this.selectContentDensity(persona),
      emotionalArcAdjustments: this.calculateEmotionalAdjustments(persona),
    };
  }

  private selectHookStrategy(persona: PersonaRecord): HookStrategy {
    const style = persona.communication_style;
    const stage = persona.buyer_journey_stage;

    if (style === 'executive') {
      return 'social_proof_lead';
    } else if (style === 'technical') {
      return 'surprising_statistic';
    } else if (stage === 'awareness') {
      return 'problem_agitation';
    } else if (stage === 'decision') {
      return 'transformation_preview';
    }

    return 'bold_statement';
  }

  private selectCTAStrategy(persona: PersonaRecord): CTAStrategy {
    const stage = persona.buyer_journey_stage;

    if (stage === 'decision') {
      return 'direct_offer';
    } else if (stage === 'awareness') {
      return 'soft_commitment';
    }

    return 'value_recap';
  }

  private selectSolutionEmphasis(
    persona: PersonaRecord,
    narrative: CoreNarrative
  ): string[] {
    // Match persona goals with narrative benefits
    const emphasis: string[] = [];

    for (const goal of persona.goals || []) {
      const matchingBenefit = narrative.benefits.find(
        (b) => b.toLowerCase().includes(goal.toLowerCase().split(' ')[0])
      );
      if (matchingBenefit) {
        emphasis.push(matchingBenefit);
      }
    }

    // Add differentiators relevant to persona
    if (persona.communication_style === 'technical') {
      emphasis.push(...narrative.differentiators.filter((d) => d.toLowerCase().includes('tech')));
    }

    return emphasis.length > 0 ? emphasis : narrative.benefits.slice(0, 3);
  }

  private selectProofPriority(
    persona: PersonaRecord
  ): ('testimonial' | 'case_study' | 'statistic' | 'award' | 'certification')[] {
    const style = persona.communication_style;

    if (style === 'executive') {
      return ['case_study', 'statistic', 'award'];
    } else if (style === 'technical') {
      return ['statistic', 'certification', 'case_study'];
    }

    return ['testimonial', 'case_study', 'statistic'];
  }

  private selectContentDensity(persona: PersonaRecord): 'detailed' | 'balanced' | 'concise' {
    const style = persona.communication_style;
    const prefs = persona.content_preferences as Record<string, unknown> | undefined;

    if (prefs) {
      const format = prefs.preferredFormat as string | undefined;
      if (format === 'detailed') return 'detailed';
      if (format === 'summary') return 'concise';
    }

    if (style === 'technical') return 'detailed';
    if (style === 'executive') return 'concise';

    return 'balanced';
  }

  private calculateEmotionalAdjustments(
    persona: PersonaRecord
  ): PersonaNarrativeAdaptation['emotionalArcAdjustments'] {
    const adjustments: PersonaNarrativeAdaptation['emotionalArcAdjustments'] = [];
    const stage = persona.buyer_journey_stage;

    if (stage === 'awareness') {
      adjustments.push({ stage: 'problem', intensityMultiplier: 1.3 });
      adjustments.push({ stage: 'hook', intensityMultiplier: 1.2 });
    } else if (stage === 'consideration') {
      adjustments.push({ stage: 'solution', intensityMultiplier: 1.3 });
      adjustments.push({ stage: 'proof', intensityMultiplier: 1.2 });
    } else if (stage === 'decision') {
      adjustments.push({ stage: 'action', intensityMultiplier: 1.4 });
      adjustments.push({ stage: 'proof', intensityMultiplier: 1.3 });
    }

    return adjustments;
  }

  private adaptFlowForPersona(
    defaultFlow: StoryFlow,
    adaptation: PersonaNarrativeAdaptation
  ): StoryFlow {
    const adaptedStages = defaultFlow.stages.map((stage) => {
      // Find intensity adjustment for this stage
      const adjustment = adaptation.emotionalArcAdjustments.find(
        (a) => a.stage === stage.narrativeRole
      );

      return {
        ...stage,
        description: this.adaptStageDescription(stage, adaptation),
      };
    });

    return { stages: adaptedStages };
  }

  private adaptStageDescription(
    stage: StoryStage,
    adaptation: PersonaNarrativeAdaptation
  ): string {
    switch (stage.narrativeRole) {
      case 'hook':
        return `${HOOK_STRATEGY_PROMPTS[adaptation.hookStrategy]} (${adaptation.problemFraming.languageStyle} tone)`;
      case 'problem':
        return `Focus on: ${adaptation.problemFraming.emphasis.slice(0, 2).join(', ')}`;
      case 'solution':
        return `Emphasize: ${adaptation.solutionEmphasis.slice(0, 2).join(', ')}`;
      case 'proof':
        return `Prioritize: ${adaptation.proofPriority.slice(0, 2).join(', ')}`;
      case 'action':
        return CTA_STRATEGY_PROMPTS[adaptation.ctaApproach];
      default:
        return stage.description;
    }
  }

  private adaptContentBlocksForPersona(
    blocks: ContentBlock[],
    persona: PersonaRecord,
    adaptation: PersonaNarrativeAdaptation
  ): ContentBlock[] {
    return blocks.map((block) => ({
      ...block,
      targetPersonas: [persona.id],
      // Adjust priority based on persona preferences
      priority: this.adjustBlockPriority(block, adaptation),
    }));
  }

  private adjustBlockPriority(
    block: ContentBlock,
    adaptation: PersonaNarrativeAdaptation
  ): number {
    let priority = block.priority;

    // Boost priority for proof types that match persona preferences
    if (block.stage === 'proof') {
      const contentType = block.content.contentType;
      const proofIndex = adaptation.proofPriority.indexOf(
        contentType as 'testimonial' | 'case_study' | 'statistic'
      );
      if (proofIndex >= 0) {
        priority -= (3 - proofIndex) * 10; // Higher priority for preferred proof types
      }
    }

    return Math.max(1, priority);
  }

  private generateSectionOverrides(
    persona: PersonaRecord,
    narrative: CoreNarrative
  ): PersonaStoryVariation['sectionOverrides'] {
    const overrides: PersonaStoryVariation['sectionOverrides'] = {};

    // Hook override based on persona goals
    overrides['hook'] = {
      emphasis: persona.goals?.slice(0, 2) || [],
    };

    // Problem override based on persona pain points
    overrides['problem'] = {
      emphasis: persona.pain_points?.slice(0, 3) || narrative.painPoints.slice(0, 3),
    };

    // Solution override
    overrides['solution'] = {
      emphasis:
        persona.decision_criteria?.slice(0, 3) ||
        narrative.benefits.slice(0, 3),
    };

    // CTA override
    const ctaText = this.generatePersonaCTA(persona);
    overrides['action'] = {
      ctaText,
    };

    return overrides;
  }

  private generatePersonaCTA(persona: PersonaRecord): string {
    const stage = persona.buyer_journey_stage;
    const style = persona.communication_style;

    if (stage === 'decision') {
      return style === 'executive' ? 'Schedule Executive Briefing' : 'Start Free Trial';
    } else if (stage === 'awareness') {
      return 'Learn More';
    }

    return style === 'technical' ? 'View Documentation' : 'See How It Works';
  }

  // ==========================================================================
  // EMOTIONAL JOURNEY
  // ==========================================================================

  private buildEmotionalJourney(
    pageType: PageType,
    narrative: CoreNarrative
  ): EmotionalJourney {
    // Get base journey from template
    const baseJourney = generateEmotionalJourney(pageType);

    // Adjust based on narrative strength
    const hasStrongProof = narrative.proofElements.some((p) => p.strength === 'high');
    const hasMultiplePainPoints = narrative.painPoints.length >= 3;

    if (hasStrongProof) {
      // Boost confidence in proof section
      baseJourney.points = baseJourney.points.map((point) => {
        if (point.primaryEmotion === 'confidence') {
          return { ...point, intensity: Math.min(100, point.intensity + 10) };
        }
        return point;
      });
    }

    if (hasMultiplePainPoints) {
      // Enhance empathy in problem section
      baseJourney.points = baseJourney.points.map((point) => {
        if (point.primaryEmotion === 'empathy') {
          return { ...point, intensity: Math.min(100, point.intensity + 10) };
        }
        return point;
      });
    }

    return baseJourney;
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

/**
 * Generate a complete storyline for a page
 */
export async function generateStoryline(
  input: StorylineGenerationInput
): Promise<StorylineGenerationResult> {
  const agent = new StorylineGenerationAgent();
  return agent.generateStoryline(input);
}

/**
 * Save storyline result to database
 */
export async function saveStoryline(
  result: StorylineGenerationResult,
  websiteId: string,
  pageId: string
): Promise<void> {
  const supabase = await createClient();

  // Fetch existing page content to merge with
  const { data: existingPage } = await supabase
    .from('pages')
    .select('content')
    .eq('id', pageId)
    .single();

  const existingContent = (existingPage?.content as Record<string, unknown>) || {};

  // Update page with storyline data merged into existing content
  const { error } = await supabase
    .from('pages')
    .update({
      content: JSON.parse(JSON.stringify({
        ...existingContent,
        storyline: {
          narrative: result.narrative,
          defaultFlow: result.defaultFlow,
          emotionalJourney: result.emotionalJourney,
          contentBlocks: result.contentBlocks,
          personaVariations: result.personaVariations,
          generationMetadata: result.metadata,
        },
      })),
      updated_at: new Date().toISOString(),
    })
    .eq('id', pageId);

  if (error) {
    console.error('Error saving storyline:', error);
    throw error;
  }
}
