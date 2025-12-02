/**
 * Content Generation Agent
 * Phase 3.3: Content Generation & Mapping
 *
 * AI-powered agent that generates and maps content to component slots,
 * with persona-specific variations and brand voice application.
 */

import OpenAI from 'openai';
import { createClient } from '@/lib/supabase/server';
import { v4 as uuidv4 } from 'uuid';
import { NarrativeRole, PageType, EmotionalTone } from '@/lib/layout/types';
import { ContentBlock } from '@/lib/storyline/types';
import {
  ContentSlot,
  ComponentContentRequirements,
  PopulatedContent,
  PersonaContentVariation,
  PopulatedSection,
  ContentGenerationInput,
  ContentGenerationResult,
  CopyStrategy,
  HeadlineOptions,
  DescriptionOptions,
  CTAOptions,
  CTAContent,
  ImageContent,
  FeatureItemContent,
  TestimonialContent,
  StatisticContent,
  FAQContent,
  PricingTierContent,
  ProcessStepContent,
  LogoContent,
  SourcedContent,
  ContentSourceQuery,
  PopulatedContentSchema,
} from './types';
import {
  COMPONENT_SLOT_DEFINITIONS,
  getComponentSlots,
  getRequiredSlots,
  getSlotConstraints,
} from './slots';

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
  embedding?: number[];
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
// CONTENT GENERATION AGENT
// ============================================================================

export class ContentGenerationAgent {
  private tokensUsed = 0;
  private startTime = 0;

  /**
   * Main entry point - generate content for all sections
   */
  async generateContent(input: ContentGenerationInput): Promise<ContentGenerationResult> {
    this.startTime = Date.now();
    this.tokensUsed = 0;

    // 1. Fetch required data
    const [knowledgeItems, personas, brandConfig] = await Promise.all([
      this.fetchKnowledgeBase(input.workspaceId, input.knowledgeBaseId),
      this.fetchPersonas(input.workspaceId, input.personas),
      input.brandConfigId ? this.fetchBrandConfig(input.brandConfigId) : Promise.resolve(null),
    ]);

    // 2. Source relevant content from knowledge base
    const sourcedContent = await this.sourceContent(knowledgeItems, input.sections);

    // 3. Generate content for each section
    const populatedSections: PopulatedSection[] = [];
    let fallbacksUsed = 0;

    for (const section of input.sections) {
      const sectionContent = sourcedContent.filter((s) =>
        s.suggestedStage === section.narrativeRole
      );

      try {
        const populated = await this.generateSectionContent(
          section,
          sectionContent,
          personas,
          brandConfig,
          input.hints
        );
        populatedSections.push(populated);
      } catch (error) {
        console.error(`Error generating content for section ${section.sectionId}:`, error);
        // Use fallback content
        const fallback = this.generateFallbackContent(section, sectionContent);
        populatedSections.push(fallback);
        fallbacksUsed++;
      }
    }

    // 4. Generate page metadata
    const pageMetadata = await this.generatePageMetadata(
      input.pageType,
      populatedSections,
      brandConfig,
      input.hints?.focusKeywords
    );

    const endTime = Date.now();

    // Calculate average confidence
    const totalConfidence = populatedSections.reduce(
      (sum, s) => sum + s.metadata.confidenceScore,
      0
    );
    const averageConfidence = populatedSections.length > 0
      ? totalConfidence / populatedSections.length
      : 0;

    return {
      pageId: input.pageId,
      sections: populatedSections,
      pageMetadata,
      generationStats: {
        totalSections: input.sections.length,
        sectionsGenerated: populatedSections.length,
        totalTokensUsed: this.tokensUsed,
        totalTimeMs: endTime - this.startTime,
        averageConfidence,
        fallbacksUsed,
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
      .limit(200);

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
  // CONTENT SOURCING
  // ==========================================================================

  private async sourceContent(
    knowledgeItems: KnowledgeBaseItem[],
    sections: ContentGenerationInput['sections']
  ): Promise<SourcedContent[]> {
    const sourcedContent: SourcedContent[] = [];

    // Map entity types to narrative stages
    const typeToStage: Record<string, NarrativeRole> = {
      value_proposition: 'hook',
      headline: 'hook',
      tagline: 'hook',
      pain_point: 'problem',
      challenge: 'problem',
      problem: 'problem',
      feature: 'solution',
      benefit: 'solution',
      process: 'solution',
      comparison: 'solution',
      service: 'solution',
      product: 'solution',
      testimonial: 'proof',
      case_study: 'proof',
      statistic: 'proof',
      award: 'proof',
      certification: 'proof',
      metric: 'proof',
      cta: 'action',
      offer: 'action',
      pricing: 'action',
    };

    for (const item of knowledgeItems) {
      const stage = typeToStage[item.entity_type] || 'solution';
      const meta = item.metadata as Record<string, unknown>;

      sourcedContent.push({
        entityId: item.id,
        entityType: item.entity_type,
        rawContent: item.content,
        metadata: item.metadata,
        relevanceScore: 0.8, // Default score; could be enhanced with embeddings
        suggestedStage: stage,
        personaRelevance: {}, // Could be populated based on content analysis
      });
    }

    return sourcedContent;
  }

  // ==========================================================================
  // SECTION CONTENT GENERATION
  // ==========================================================================

  private async generateSectionContent(
    section: ContentGenerationInput['sections'][0],
    sourcedContent: SourcedContent[],
    personas: PersonaRecord[],
    brandConfig: BrandConfigRecord | null,
    hints?: ContentGenerationInput['hints']
  ): Promise<PopulatedSection> {
    // Get component slot requirements
    const slots = getComponentSlots(section.componentId);
    const requiredSlots = getRequiredSlots(section.componentId);

    // Generate base content
    const baseContent = await this.generateBaseContent(
      section,
      sourcedContent,
      slots,
      requiredSlots,
      brandConfig,
      hints
    );

    // Generate persona variations
    const personaVariations: Record<string, PersonaContentVariation> = {};

    for (const persona of personas) {
      const variation = await this.generatePersonaVariation(
        baseContent,
        persona,
        section.narrativeRole,
        brandConfig
      );
      personaVariations[persona.id] = variation;
    }

    return {
      sectionId: section.sectionId,
      componentId: section.componentId,
      narrativeRole: section.narrativeRole,
      order: section.order,
      content: baseContent,
      personaVariations,
      metadata: {
        generatedAt: new Date().toISOString(),
        modelUsed: 'gpt-4-turbo',
        tokensUsed: this.tokensUsed,
        confidenceScore: this.calculateConfidenceScore(baseContent, requiredSlots),
        sourceEntityIds: sourcedContent.map((s) => s.entityId),
      },
    };
  }

  private async generateBaseContent(
    section: ContentGenerationInput['sections'][0],
    sourcedContent: SourcedContent[],
    slots: ContentSlot[],
    requiredSlots: string[],
    brandConfig: BrandConfigRecord | null,
    hints?: ContentGenerationInput['hints']
  ): Promise<PopulatedContent> {
    // Prepare context for LLM
    const contentContext = this.prepareContentContext(sourcedContent);
    const brandContext = this.prepareBrandContext(brandConfig);
    const slotContext = this.prepareSlotContext(slots, requiredSlots);

    try {
      return await this.generateContentWithLLM(
        section,
        contentContext,
        brandContext,
        slotContext,
        hints
      );
    } catch (error) {
      console.error('LLM content generation failed, using fallback:', error);
      return this.generateContentFallback(section, sourcedContent);
    }
  }

  private prepareContentContext(sourcedContent: SourcedContent[]): string {
    if (sourcedContent.length === 0) {
      return 'No specific content available.';
    }

    const contextItems = sourcedContent.slice(0, 10).map((item) => {
      const meta = item.metadata as Record<string, unknown>;
      const name = (meta?.name as string) || (meta?.title as string) || 'Untitled';
      const desc = (meta?.description as string) || item.rawContent.substring(0, 200);
      return `- [${item.entityType}] ${name}: ${desc}`;
    });

    return contextItems.join('\n');
  }

  private prepareBrandContext(brandConfig: BrandConfigRecord | null): string {
    if (!brandConfig) {
      return 'No specific brand guidelines.';
    }

    const voice = brandConfig.voice as Record<string, unknown>;
    return `Brand: ${brandConfig.name}
Voice: ${voice?.tone || 'professional'} tone, ${voice?.personality || 'approachable'} personality
Industry: ${brandConfig.industry || 'general'}
Target Audience: ${brandConfig.target_audience || 'business professionals'}`;
  }

  private prepareSlotContext(slots: ContentSlot[], requiredSlots: string[]): string {
    const slotDescriptions = slots.map((slot) => {
      const required = requiredSlots.includes(slot.name) ? '(REQUIRED)' : '(optional)';
      let constraints = '';
      if (slot.minLength || slot.maxLength) {
        constraints = ` [${slot.minLength || 0}-${slot.maxLength || '∞'} chars]`;
      }
      if (slot.minItems || slot.maxItems) {
        constraints = ` [${slot.minItems || 0}-${slot.maxItems || '∞'} items]`;
      }
      return `- ${slot.name} ${required}${constraints}: ${slot.label}`;
    });

    return slotDescriptions.join('\n');
  }

  private async generateContentWithLLM(
    section: ContentGenerationInput['sections'][0],
    contentContext: string,
    brandContext: string,
    slotContext: string,
    hints?: ContentGenerationInput['hints']
  ): Promise<PopulatedContent> {
    const hintsContext = hints
      ? `
Focus Keywords: ${hints.focusKeywords?.join(', ') || 'none'}
Avoid Terms: ${hints.avoidTerms?.join(', ') || 'none'}
Tone Override: ${hints.toneOverride || 'default'}
Include Stats: ${hints.includeStats ? 'yes' : 'no'}
CTA Preference: ${hints.ctaPreference || 'default'}`
      : '';

    const stageGuidance = this.getStageGuidance(section.narrativeRole);

    const prompt = `Generate marketing content for a ${section.narrativeRole} section.

NARRATIVE STAGE: ${section.narrativeRole}
${stageGuidance}

AVAILABLE CONTENT:
${contentContext}

BRAND GUIDELINES:
${brandContext}

REQUIRED CONTENT SLOTS:
${slotContext}
${hintsContext}

Generate compelling marketing copy that:
1. Matches the ${section.narrativeRole} stage emotional tone
2. Follows brand voice guidelines
3. Fills all required content slots
4. Is concise but impactful

Respond with JSON in this format:
{
  "headline": "string (max 100 chars)",
  "subheadline": "string (max 150 chars)",
  "description": "string (max 500 chars)",
  "bullets": ["string (max 5 items)"],
  "primaryCTA": {"text": "string (max 50 chars)", "link": "#", "variant": "primary"},
  "secondaryCTA": {"text": "string (max 50 chars)", "link": "#", "variant": "secondary"},
  "features": [{"title": "string", "description": "string", "icon": "string"}],
  "statistics": [{"value": "string", "label": "string"}]
}

Only include fields that are relevant to this section type. Include null for unused fields.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo',
      messages: [
        {
          role: 'system',
          content:
            'You are an expert marketing copywriter. Generate compelling, conversion-focused content. Respond only with valid JSON.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 2000,
      response_format: { type: 'json_object' },
    });

    this.tokensUsed += response.usage?.total_tokens || 0;

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from LLM');
    }

    const parsed = JSON.parse(content);
    return this.normalizeContent(parsed);
  }

  private getStageGuidance(stage: NarrativeRole): string {
    const guidance: Record<NarrativeRole, string> = {
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

    return guidance[stage] || guidance.solution;
  }

  private normalizeContent(raw: Record<string, unknown>): PopulatedContent {
    const content: PopulatedContent = {};

    // Text fields
    if (raw.headline && typeof raw.headline === 'string') {
      content.headline = raw.headline;
    }
    if (raw.subheadline && typeof raw.subheadline === 'string') {
      content.subheadline = raw.subheadline;
    }
    if (raw.description && typeof raw.description === 'string') {
      content.description = raw.description;
    }
    if (raw.sectionTitle && typeof raw.sectionTitle === 'string') {
      content.sectionTitle = raw.sectionTitle;
    }
    if (raw.sectionDescription && typeof raw.sectionDescription === 'string') {
      content.sectionDescription = raw.sectionDescription;
    }

    // Bullets
    if (Array.isArray(raw.bullets)) {
      content.bullets = raw.bullets.filter((b): b is string => typeof b === 'string');
    }

    // CTAs
    if (raw.primaryCTA && typeof raw.primaryCTA === 'object') {
      const cta = raw.primaryCTA as Record<string, unknown>;
      if (cta.text && cta.link) {
        content.primaryCTA = {
          text: String(cta.text),
          link: String(cta.link),
          variant: (cta.variant as CTAContent['variant']) || 'primary',
          icon: cta.icon as string | undefined,
        };
      }
    }
    if (raw.secondaryCTA && typeof raw.secondaryCTA === 'object') {
      const cta = raw.secondaryCTA as Record<string, unknown>;
      if (cta.text && cta.link) {
        content.secondaryCTA = {
          text: String(cta.text),
          link: String(cta.link),
          variant: (cta.variant as CTAContent['variant']) || 'secondary',
          icon: cta.icon as string | undefined,
        };
      }
    }

    // Features
    if (Array.isArray(raw.features)) {
      content.features = raw.features
        .filter((f): f is Record<string, unknown> => typeof f === 'object' && f !== null)
        .map((f) => ({
          title: String(f.title || ''),
          description: String(f.description || ''),
          icon: f.icon as string | undefined,
          image: f.image as ImageContent | undefined,
          link: f.link as string | undefined,
        }));
    }

    // Testimonials
    if (Array.isArray(raw.testimonials)) {
      content.testimonials = raw.testimonials
        .filter((t): t is Record<string, unknown> => typeof t === 'object' && t !== null)
        .map((t) => ({
          quote: String(t.quote || ''),
          author: String(t.author || ''),
          role: String(t.role || ''),
          company: String(t.company || ''),
          avatar: t.avatar as ImageContent | undefined,
          rating: t.rating as number | undefined,
          logo: t.logo as ImageContent | undefined,
        }));
    }

    // Statistics
    if (Array.isArray(raw.statistics)) {
      content.statistics = raw.statistics
        .filter((s): s is Record<string, unknown> => typeof s === 'object' && s !== null)
        .map((s) => ({
          value: String(s.value || ''),
          label: String(s.label || ''),
          description: s.description as string | undefined,
          icon: s.icon as string | undefined,
          prefix: s.prefix as string | undefined,
          suffix: s.suffix as string | undefined,
        }));
    }

    // FAQs
    if (Array.isArray(raw.faqs)) {
      content.faqs = raw.faqs
        .filter((f): f is Record<string, unknown> => typeof f === 'object' && f !== null)
        .map((f) => ({
          question: String(f.question || ''),
          answer: String(f.answer || ''),
        }));
    }

    // Pricing tiers
    if (Array.isArray(raw.pricingTiers)) {
      content.pricingTiers = raw.pricingTiers
        .filter((p): p is Record<string, unknown> => typeof p === 'object' && p !== null)
        .map((p) => ({
          name: String(p.name || ''),
          price: String(p.price || ''),
          period: p.period as string | undefined,
          description: String(p.description || ''),
          features: Array.isArray(p.features)
            ? p.features.filter((f): f is string => typeof f === 'string')
            : [],
          cta: {
            text: String((p.cta as Record<string, unknown>)?.text || 'Get Started'),
            link: String((p.cta as Record<string, unknown>)?.link || '#'),
          },
          highlighted: p.highlighted as boolean | undefined,
          badge: p.badge as string | undefined,
        }));
    }

    // Process steps
    if (Array.isArray(raw.processSteps)) {
      content.processSteps = raw.processSteps
        .filter((s): s is Record<string, unknown> => typeof s === 'object' && s !== null)
        .map((s, index) => ({
          step: (s.step as number) || index + 1,
          title: String(s.title || ''),
          description: String(s.description || ''),
          icon: s.icon as string | undefined,
          image: s.image as ImageContent | undefined,
        }));
    }

    // Logos
    if (Array.isArray(raw.logos)) {
      content.logos = raw.logos
        .filter((l): l is Record<string, unknown> => typeof l === 'object' && l !== null)
        .map((l) => ({
          name: String(l.name || ''),
          image: l.image as ImageContent || { src: '', alt: '' },
          link: l.link as string | undefined,
        }));
    }

    // Images
    if (raw.image && typeof raw.image === 'object') {
      const img = raw.image as Record<string, unknown>;
      content.image = {
        src: String(img.src || ''),
        alt: String(img.alt || ''),
        width: img.width as number | undefined,
        height: img.height as number | undefined,
        caption: img.caption as string | undefined,
      };
    }
    if (raw.backgroundImage && typeof raw.backgroundImage === 'object') {
      const img = raw.backgroundImage as Record<string, unknown>;
      content.backgroundImage = {
        src: String(img.src || ''),
        alt: String(img.alt || ''),
        width: img.width as number | undefined,
        height: img.height as number | undefined,
      };
    }

    // Custom fields
    if (raw.custom && typeof raw.custom === 'object') {
      content.custom = raw.custom as Record<string, unknown>;
    }

    return content;
  }

  private generateContentFallback(
    section: ContentGenerationInput['sections'][0],
    sourcedContent: SourcedContent[]
  ): PopulatedContent {
    const content: PopulatedContent = {};
    const firstSource = sourcedContent[0];
    const meta = (firstSource?.metadata || {}) as Record<string, unknown>;

    switch (section.narrativeRole) {
      case 'hook':
        content.headline = (meta.name as string) || 'Transform Your Business';
        content.subheadline = (meta.description as string) || 'Discover a better way forward';
        content.description =
          'Take the next step towards efficiency and growth with our proven solution.';
        content.primaryCTA = { text: 'Get Started', link: '#contact', variant: 'primary' };
        content.secondaryCTA = { text: 'Learn More', link: '#features', variant: 'secondary' };
        break;

      case 'problem':
        content.sectionTitle = 'Common Challenges';
        content.sectionDescription =
          "We understand the obstacles you face. Here's what we help you overcome.";
        content.features = sourcedContent.slice(0, 4).map((s) => ({
          title: ((s.metadata as Record<string, unknown>).name as string) || 'Challenge',
          description:
            ((s.metadata as Record<string, unknown>).description as string) ||
            s.rawContent.substring(0, 150),
        }));
        break;

      case 'solution':
        content.sectionTitle = 'Our Solution';
        content.sectionDescription = 'See how we address your challenges.';
        content.features = sourcedContent.slice(0, 6).map((s) => ({
          title: ((s.metadata as Record<string, unknown>).name as string) || 'Feature',
          description:
            ((s.metadata as Record<string, unknown>).description as string) ||
            s.rawContent.substring(0, 150),
        }));
        break;

      case 'proof':
        content.sectionTitle = 'Trusted by Industry Leaders';
        content.sectionDescription = 'See what our customers have achieved.';
        if (sourcedContent.some((s) => s.entityType === 'testimonial')) {
          content.testimonials = sourcedContent
            .filter((s) => s.entityType === 'testimonial')
            .slice(0, 3)
            .map((s) => {
              const m = s.metadata as Record<string, unknown>;
              return {
                quote: (m.quote as string) || s.rawContent.substring(0, 200),
                author: (m.author as string) || 'Customer',
                role: (m.role as string) || '',
                company: (m.company as string) || '',
              };
            });
        }
        if (sourcedContent.some((s) => s.entityType === 'statistic')) {
          content.statistics = sourcedContent
            .filter((s) => s.entityType === 'statistic')
            .slice(0, 4)
            .map((s) => {
              const m = s.metadata as Record<string, unknown>;
              return {
                value: (m.value as string) || '95%',
                label: (m.label as string) || 'Success Rate',
              };
            });
        }
        break;

      case 'action':
        content.headline = 'Ready to Get Started?';
        content.description = 'Take the first step towards transformation.';
        content.primaryCTA = { text: 'Start Free Trial', link: '#signup', variant: 'primary' };
        content.secondaryCTA = { text: 'Schedule Demo', link: '#demo', variant: 'secondary' };
        break;
    }

    return content;
  }

  // ==========================================================================
  // PERSONA VARIATIONS
  // ==========================================================================

  private async generatePersonaVariation(
    baseContent: PopulatedContent,
    persona: PersonaRecord,
    stage: NarrativeRole,
    brandConfig: BrandConfigRecord | null
  ): Promise<PersonaContentVariation> {
    const emotionalTone = this.getPersonaEmotionalTone(persona, stage);

    try {
      const adaptedContent = await this.adaptContentForPersona(
        baseContent,
        persona,
        stage,
        brandConfig
      );

      return {
        personaId: persona.id,
        content: adaptedContent,
        emotionalTone,
        emphasis: this.getPersonaEmphasis(persona, stage),
        ctaApproach: this.getPersonaCTAApproach(persona),
      };
    } catch (error) {
      console.error(`Error adapting content for persona ${persona.id}:`, error);
      // Return base content with persona metadata
      return {
        personaId: persona.id,
        content: baseContent,
        emotionalTone,
        emphasis: this.getPersonaEmphasis(persona, stage),
        ctaApproach: this.getPersonaCTAApproach(persona),
      };
    }
  }

  private getPersonaEmotionalTone(persona: PersonaRecord, stage: NarrativeRole): EmotionalTone {
    const style = persona.communication_style;
    const journeyStage = persona.buyer_journey_stage;

    // Executive personas respond to confidence and trust
    if (style === 'executive') {
      return stage === 'proof' ? 'confidence' : 'trust';
    }

    // Technical personas respond to curiosity and confidence
    if (style === 'technical') {
      return stage === 'solution' ? 'curiosity' : 'confidence';
    }

    // Default emotional tones by narrative stage
    const stageTones: Record<NarrativeRole, EmotionalTone> = {
      hook: 'curiosity',
      problem: 'empathy',
      solution: 'hope',
      proof: 'confidence',
      action: 'excitement',
    };

    return stageTones[stage];
  }

  private getPersonaEmphasis(persona: PersonaRecord, stage: NarrativeRole): string[] {
    switch (stage) {
      case 'hook':
        return persona.goals?.slice(0, 2) || [];
      case 'problem':
        return persona.pain_points?.slice(0, 3) || [];
      case 'solution':
        return persona.decision_criteria?.slice(0, 3) || [];
      case 'proof':
        return ['ROI', 'reliability', 'peer validation'];
      case 'action':
        return ['low risk', 'quick start', 'support'];
      default:
        return [];
    }
  }

  private getPersonaCTAApproach(persona: PersonaRecord): string {
    const stage = persona.buyer_journey_stage;
    const style = persona.communication_style;

    if (stage === 'decision') {
      return 'direct_offer';
    } else if (stage === 'awareness') {
      return 'soft_commitment';
    }

    if (style === 'executive') {
      return 'value_recap';
    } else if (style === 'technical') {
      return 'soft_commitment';
    }

    return 'multiple_options';
  }

  private async adaptContentForPersona(
    baseContent: PopulatedContent,
    persona: PersonaRecord,
    stage: NarrativeRole,
    brandConfig: BrandConfigRecord | null
  ): Promise<PopulatedContent> {
    const prompt = `Adapt the following marketing content for a specific persona.

PERSONA:
Name: ${persona.name}
Communication Style: ${persona.communication_style}
Journey Stage: ${persona.buyer_journey_stage}
Pain Points: ${persona.pain_points?.join(', ') || 'general challenges'}
Goals: ${persona.goals?.join(', ') || 'growth and efficiency'}
Decision Criteria: ${persona.decision_criteria?.join(', ') || 'value and ROI'}

NARRATIVE STAGE: ${stage}

BASE CONTENT:
${JSON.stringify(baseContent, null, 2)}

Adapt this content to:
1. Use ${persona.communication_style} language style
2. Emphasize points relevant to their ${persona.buyer_journey_stage} journey stage
3. Address their specific pain points
4. Align with their decision criteria
5. Keep the same structure but adjust messaging

Respond with the adapted content in the same JSON format.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo',
      messages: [
        {
          role: 'system',
          content:
            'You are an expert at personalizing marketing content for different audience segments. Respond only with valid JSON.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.6,
      max_tokens: 1500,
      response_format: { type: 'json_object' },
    });

    this.tokensUsed += response.usage?.total_tokens || 0;

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from LLM');
    }

    const parsed = JSON.parse(content);
    return this.normalizeContent(parsed);
  }

  // ==========================================================================
  // PAGE METADATA
  // ==========================================================================

  private async generatePageMetadata(
    pageType: PageType,
    sections: PopulatedSection[],
    brandConfig: BrandConfigRecord | null,
    focusKeywords?: string[]
  ): Promise<ContentGenerationResult['pageMetadata']> {
    // Extract key content from sections
    const hookSection = sections.find((s) => s.narrativeRole === 'hook');
    const headline = hookSection?.content.headline || '';
    const description = hookSection?.content.description || '';

    // Generate SEO-optimized metadata
    const brandName = brandConfig?.name || '';
    const keywords = [
      ...(focusKeywords || []),
      ...(brandConfig?.industry ? [brandConfig.industry] : []),
    ];

    try {
      const prompt = `Generate SEO metadata for a ${pageType} page.

HEADLINE: ${headline}
DESCRIPTION: ${description}
BRAND: ${brandName}
KEYWORDS: ${keywords.join(', ')}

Generate:
1. SEO title (50-60 chars)
2. Meta description (150-160 chars)
3. Keywords (5-10 terms)

Respond with JSON:
{
  "title": "string",
  "description": "string",
  "keywords": ["string"]
}`;

      const response = await openai.chat.completions.create({
        model: 'gpt-4-turbo',
        messages: [
          { role: 'system', content: 'You are an SEO expert. Respond only with valid JSON.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.5,
        max_tokens: 500,
        response_format: { type: 'json_object' },
      });

      this.tokensUsed += response.usage?.total_tokens || 0;

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response');
      }

      const parsed = JSON.parse(content) as {
        title: string;
        description: string;
        keywords: string[];
      };

      return {
        title: parsed.title || headline.substring(0, 60),
        description: parsed.description || description.substring(0, 160),
        keywords: parsed.keywords || keywords,
      };
    } catch (error) {
      // Fallback metadata
      return {
        title: headline.substring(0, 60) || `${brandName} - ${pageType}`,
        description: description.substring(0, 160) || `Discover what ${brandName} can do for you.`,
        keywords: keywords.length > 0 ? keywords : [brandName, pageType],
      };
    }
  }

  // ==========================================================================
  // FALLBACK CONTENT
  // ==========================================================================

  private generateFallbackContent(
    section: ContentGenerationInput['sections'][0],
    sourcedContent: SourcedContent[]
  ): PopulatedSection {
    const baseContent = this.generateContentFallback(section, sourcedContent);

    return {
      sectionId: section.sectionId,
      componentId: section.componentId,
      narrativeRole: section.narrativeRole,
      order: section.order,
      content: baseContent,
      personaVariations: {},
      metadata: {
        generatedAt: new Date().toISOString(),
        modelUsed: 'fallback',
        tokensUsed: 0,
        confidenceScore: 0.5,
        sourceEntityIds: sourcedContent.map((s) => s.entityId),
      },
    };
  }

  // ==========================================================================
  // UTILITY METHODS
  // ==========================================================================

  private calculateConfidenceScore(content: PopulatedContent, requiredSlots: string[]): number {
    let filledRequired = 0;
    let totalRequired = requiredSlots.length;

    for (const slot of requiredSlots) {
      const value = content[slot as keyof PopulatedContent];
      if (value !== undefined && value !== null && value !== '') {
        if (Array.isArray(value) && value.length > 0) {
          filledRequired++;
        } else if (!Array.isArray(value)) {
          filledRequired++;
        }
      }
    }

    return totalRequired > 0 ? filledRequired / totalRequired : 1;
  }
}

// ============================================================================
// COPY GENERATION UTILITIES
// ============================================================================

/**
 * Generate headline based on options
 */
export async function generateHeadline(
  content: string,
  options: HeadlineOptions
): Promise<string> {
  const openaiClient = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  const strategyGuide: Record<CopyStrategy, string> = {
    benefit_focused: 'Lead with the primary benefit to the user',
    feature_focused: 'Highlight the key feature or capability',
    problem_solution: 'Frame as solving a specific problem',
    social_proof: 'Reference credibility or social validation',
    story_driven: 'Use narrative or storytelling approach',
    data_driven: 'Lead with a compelling statistic or metric',
  };

  const prompt = `Generate a headline for marketing content.

STAGE: ${options.stage}
TONE: ${options.tone}
MAX LENGTH: ${options.maxLength} characters
STRATEGY: ${strategyGuide[options.strategy]}
FORMALITY: ${options.formality}
KEYWORDS: ${options.keywords?.join(', ') || 'none'}

CONTENT TO SUMMARIZE:
${content}

Generate a single, compelling headline that captures attention and drives engagement.`;

  const response = await openaiClient.chat.completions.create({
    model: 'gpt-4-turbo',
    messages: [
      {
        role: 'system',
        content: 'You are an expert copywriter. Generate only the headline, no explanations.',
      },
      { role: 'user', content: prompt },
    ],
    temperature: 0.8,
    max_tokens: 100,
  });

  return response.choices[0]?.message?.content?.trim() || 'Discover the Difference';
}

/**
 * Generate description based on options
 */
export async function generateDescription(
  content: string,
  options: DescriptionOptions
): Promise<string> {
  const openaiClient = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  const prompt = `Generate a description for marketing content.

MAX LENGTH: ${options.maxLength} characters
STAGE: ${options.stage}
TONE: ${options.tone}
DENSITY: ${options.density}
INCLUDE STATS: ${options.includeStats}
KEYWORDS: ${options.keywords?.join(', ') || 'none'}

CONTENT TO SUMMARIZE:
${content}

Generate a compelling description that supports the headline and drives action.`;

  const response = await openaiClient.chat.completions.create({
    model: 'gpt-4-turbo',
    messages: [
      {
        role: 'system',
        content: 'You are an expert copywriter. Generate only the description, no explanations.',
      },
      { role: 'user', content: prompt },
    ],
    temperature: 0.7,
    max_tokens: 300,
  });

  return response.choices[0]?.message?.content?.trim() || 'Learn more about our solution.';
}

/**
 * Generate CTA based on options
 */
export async function generateCTA(options: CTAOptions): Promise<CTAContent> {
  const strategyMap: Record<CTAOptions['strategy'], string> = {
    direct_offer: 'Start Free Trial',
    soft_commitment: 'Learn More',
    scarcity_urgency: 'Claim Your Spot',
    value_recap: 'Get Started Now',
    multiple_options: 'Explore Options',
    social_momentum: 'Join 10,000+ Users',
  };

  return {
    text: strategyMap[options.strategy] || 'Get Started',
    link: '#',
    variant: options.variant,
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

/**
 * Generate content for a page
 */
export async function generateContent(
  input: ContentGenerationInput
): Promise<ContentGenerationResult> {
  const agent = new ContentGenerationAgent();
  return agent.generateContent(input);
}

/**
 * Save generated content to database
 */
export async function saveGeneratedContent(
  result: ContentGenerationResult,
  websiteId: string
): Promise<void> {
  const supabase = await createClient();

  // Fetch existing page content
  const { data: existingPage } = await supabase
    .from('pages')
    .select('content')
    .eq('id', result.pageId)
    .single();

  const existingContent = (existingPage?.content as Record<string, unknown>) || {};

  // Merge generated content into existing page content
  const { error } = await supabase
    .from('pages')
    .update({
      content: JSON.parse(
        JSON.stringify({
          ...existingContent,
          generatedContent: {
            sections: result.sections,
            pageMetadata: result.pageMetadata,
            generationStats: result.generationStats,
          },
        })
      ),
      updated_at: new Date().toISOString(),
    })
    .eq('id', result.pageId);

  if (error) {
    console.error('Error saving generated content:', error);
    throw error;
  }
}
