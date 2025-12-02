/**
 * Layout Generation Agent
 * Phase 3.1: Layout Generation Agent
 *
 * AI-powered layout generation using LLM for intelligent component
 * selection, content mapping, and storytelling flow optimization.
 */

import { createClient } from '@/lib/supabase/server';
import { componentRegistry, COMPONENT_DEFINITIONS } from './component-registry';
import {
  LayoutGenerationInput,
  LayoutGenerationResult,
  PageLayout,
  PageType,
  Section,
  SectionContent,
  ComponentVariant,
  ComponentSelectionContext,
  ComponentSelectionResult,
  NarrativeRole,
  PageMetadata,
  NavigationStructure,
  GlobalComponent,
  SiteArchitecture,
  DEFAULT_STORY_FLOW,
  PAGE_TYPE_CONFIGS,
  AnimationConfig,
} from './types';

// =============================================================================
// TYPES FOR INTERNAL USE
// =============================================================================

interface KnowledgeBaseItem {
  id: string;
  entity_type: string;
  content: string;
  metadata: Record<string, unknown>;
}

interface Persona {
  id: string;
  name: string;
  title: string | null;
  communication_style: string | null;
  goals: string[];
  pain_points: string[];
}

interface BrandConfig {
  id: string;
  name: string;
  colors: Record<string, unknown>;
  typography: Record<string, unknown>;
  voice: {
    tone?: string;
    formality?: string;
    personality?: string[];
  };
}

interface LLMResponse {
  sections: LLMSectionSuggestion[];
  metadata: {
    title: string;
    description: string;
    keywords: string[];
  };
  tokensUsed: number;
}

interface LLMSectionSuggestion {
  componentId: string;
  narrativeRole: NarrativeRole;
  contentMapping: Record<string, string>;
  reasoning: string;
}

// =============================================================================
// LAYOUT GENERATION AGENT
// =============================================================================

export class LayoutGenerationAgent {
  private modelName: string = 'gpt-4-turbo-preview';

  /**
   * Generate a page layout based on input parameters
   */
  async generateLayout(input: LayoutGenerationInput): Promise<LayoutGenerationResult> {
    const startTime = Date.now();
    let tokensUsed = 0;

    // 1. Fetch required data
    const [knowledgeBase, personas, brandConfig] = await Promise.all([
      input.knowledgeBaseId ? this.fetchKnowledgeBase(input.workspaceId) : null,
      input.personas ? this.fetchPersonas(input.workspaceId, input.personas) : [],
      input.brandConfigId ? this.fetchBrandConfig(input.brandConfigId) : null,
    ]);

    // 2. Extract relevant content from knowledge base
    const availableContent = await this.extractRelevantContent(
      input.pageType,
      knowledgeBase
    );

    // 3. Determine storytelling flow for page type
    const storyFlow = this.getStoryFlowForPageType(input.pageType);

    // 4. Use LLM to generate layout suggestions
    const llmResponse = await this.generateLayoutWithLLM(
      input,
      availableContent,
      storyFlow,
      personas,
      brandConfig
    );
    tokensUsed += llmResponse.tokensUsed;

    // 5. Validate and score component selections
    const componentSelections = await this.validateAndScoreSelections(
      llmResponse.sections,
      input.pageType,
      availableContent,
      personas[0]?.communication_style || undefined
    );

    // 6. Build final page layout
    const layout = this.buildPageLayout(
      input,
      componentSelections,
      llmResponse.metadata,
      brandConfig
    );

    // 7. Calculate confidence score
    const confidenceScore = this.calculateConfidenceScore(componentSelections);

    const processingTimeMs = Date.now() - startTime;

    return {
      layout,
      componentSelections,
      generationMetadata: {
        processingTimeMs,
        tokensUsed,
        modelUsed: this.modelName,
        confidenceScore,
      },
    };
  }

  /**
   * Generate a complete site architecture
   */
  async generateSiteArchitecture(
    websiteId: string,
    workspaceId: string,
    pages: PageType[]
  ): Promise<SiteArchitecture> {
    const pageLayouts: PageLayout[] = [];

    for (const pageType of pages) {
      const result = await this.generateLayout({
        websiteId,
        workspaceId,
        pageType,
      });
      pageLayouts.push(result.layout);
    }

    // Generate navigation structure
    const navigation = this.generateNavigationStructure(pageLayouts);

    // Generate global components
    const globalComponents = this.generateGlobalComponents(pageLayouts);

    return {
      websiteId,
      pages: pageLayouts,
      navigation,
      globalComponents,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  // ===========================================================================
  // PRIVATE METHODS - DATA FETCHING
  // ===========================================================================

  private async fetchKnowledgeBase(
    workspaceId: string
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

    return (data || []) as unknown as KnowledgeBaseItem[];
  }

  private async fetchPersonas(
    workspaceId: string,
    personaIds: string[]
  ): Promise<Persona[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('personas')
      .select('id, name, title, communication_style, goals, pain_points')
      .eq('workspace_id', workspaceId)
      .in('id', personaIds);

    if (error) {
      console.error('Error fetching personas:', error);
      return [];
    }

    return (data || []) as Persona[];
  }

  private async fetchBrandConfig(brandConfigId: string): Promise<BrandConfig | null> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('brand_configs')
      .select('id, name, colors, typography, voice')
      .eq('id', brandConfigId)
      .single();

    if (error) {
      console.error('Error fetching brand config:', error);
      return null;
    }

    return data as BrandConfig;
  }

  // ===========================================================================
  // PRIVATE METHODS - CONTENT EXTRACTION
  // ===========================================================================

  private async extractRelevantContent(
    pageType: PageType,
    knowledgeBase: KnowledgeBaseItem[] | null
  ): Promise<Record<string, unknown>> {
    if (!knowledgeBase) {
      return this.getDefaultContent(pageType);
    }

    const content: Record<string, unknown> = {};

    // Helper to get name/title from metadata or content
    const getName = (item: KnowledgeBaseItem): string => {
      const meta = item.metadata as Record<string, unknown>;
      return (meta?.name as string) || (meta?.title as string) || item.content.substring(0, 80);
    };

    const getDescription = (item: KnowledgeBaseItem): string => {
      const meta = item.metadata as Record<string, unknown>;
      return (meta?.description as string) || item.content;
    };

    // Extract headlines and taglines
    const headlines = knowledgeBase
      .filter((item) => item.entity_type === 'tagline' || item.entity_type === 'headline')
      .map((item) => item.content);
    if (headlines.length > 0) {
      content.headline = headlines[0];
      content.subheadline = headlines[1] || headlines[0];
    }

    // Extract features
    const features = knowledgeBase
      .filter((item) => item.entity_type === 'feature' || item.entity_type === 'capability')
      .map((item) => ({
        title: getName(item),
        description: getDescription(item),
        icon: (item.metadata as Record<string, unknown>)?.icon || 'star',
      }));
    if (features.length > 0) {
      content.features = features;
    }

    // Extract testimonials
    const testimonials = knowledgeBase
      .filter((item) => item.entity_type === 'testimonial')
      .map((item) => ({
        quote: item.content,
        author: (item.metadata as Record<string, unknown>)?.author || 'Customer',
        role: (item.metadata as Record<string, unknown>)?.role,
        company: (item.metadata as Record<string, unknown>)?.company,
      }));
    if (testimonials.length > 0) {
      content.testimonials = testimonials;
    }

    // Extract stats/metrics
    const stats = knowledgeBase
      .filter((item) => item.entity_type === 'statistic' || item.entity_type === 'metric')
      .map((item) => ({
        value: (item.metadata as Record<string, unknown>)?.value || getName(item),
        label: getDescription(item),
      }));
    if (stats.length > 0) {
      content.stats = stats;
    }

    // Extract FAQs
    const faqs = knowledgeBase
      .filter((item) => item.entity_type === 'faq')
      .map((item) => ({
        question: (item.metadata as Record<string, unknown>)?.question || getName(item),
        answer: item.content,
      }));
    if (faqs.length > 0) {
      content.questions = faqs;
    }

    // Extract pricing
    const pricing = knowledgeBase
      .filter((item) => item.entity_type === 'pricing' || item.entity_type === 'plan')
      .map((item) => ({
        name: getName(item),
        price: (item.metadata as Record<string, unknown>)?.price,
        features: (item.metadata as Record<string, unknown>)?.features || [],
      }));
    if (pricing.length > 0) {
      content.plans = pricing;
    }

    // Extract company info
    const companyInfo = knowledgeBase.find(
      (item) => item.entity_type === 'company' || item.entity_type === 'about'
    );
    if (companyInfo) {
      content.companyDescription = companyInfo.content;
    }

    // Add CTAs
    content.primaryCTA = { text: 'Get Started', href: '/signup' };
    content.secondaryCTA = { text: 'Learn More', href: '/features' };

    return content;
  }

  private getDefaultContent(pageType: PageType): Record<string, unknown> {
    // Default content for when knowledge base is empty
    const defaults: Record<PageType, Record<string, unknown>> = {
      home: {
        headline: 'Welcome to Our Platform',
        subheadline: 'The best solution for your needs',
        primaryCTA: { text: 'Get Started', href: '/signup' },
        secondaryCTA: { text: 'Learn More', href: '/features' },
      },
      landing: {
        headline: 'Transform Your Business',
        subheadline: 'Start your journey today',
        primaryCTA: { text: 'Sign Up Free', href: '/signup' },
      },
      product: {
        headline: 'Our Product',
        subheadline: 'Powerful features for modern teams',
        primaryCTA: { text: 'Try Free', href: '/trial' },
      },
      pricing: {
        headline: 'Simple, Transparent Pricing',
        subheadline: 'Choose the plan that works for you',
      },
      about: {
        headline: 'About Us',
        subheadline: 'Our story and mission',
      },
      contact: {
        headline: 'Get in Touch',
        subheadline: 'We\'d love to hear from you',
      },
      blog: {
        headline: 'Blog',
        subheadline: 'Latest insights and updates',
      },
      'blog-post': {
        headline: 'Article Title',
      },
      'case-study': {
        headline: 'Customer Success Story',
        subheadline: 'How we helped achieve results',
      },
      features: {
        headline: 'Features',
        subheadline: 'Everything you need to succeed',
      },
      solutions: {
        headline: 'Solutions',
        subheadline: 'Tailored for your industry',
      },
      resources: {
        headline: 'Resources',
        subheadline: 'Learn and grow with us',
      },
      careers: {
        headline: 'Join Our Team',
        subheadline: 'Build the future with us',
      },
      legal: {
        headline: 'Legal',
      },
      custom: {
        headline: 'Page Title',
      },
    };

    return defaults[pageType] || defaults.custom;
  }

  // ===========================================================================
  // PRIVATE METHODS - STORY FLOW
  // ===========================================================================

  private getStoryFlowForPageType(pageType: PageType): NarrativeRole[] {
    const config = PAGE_TYPE_CONFIGS[pageType];
    if (!config) return ['hook', 'solution', 'proof', 'action'];

    // Build story flow based on page type requirements
    const flow: NarrativeRole[] = [];

    // Always start with hook if required
    if (config.requiredSections.includes('hook')) {
      flow.push('hook');
    }

    // Add problem section if required
    if (config.requiredSections.includes('problem')) {
      flow.push('problem');
    }

    // Add solution section
    if (config.requiredSections.includes('solution')) {
      flow.push('solution');
    }

    // Add proof section
    if (config.requiredSections.includes('proof')) {
      flow.push('proof');
    }

    // Always end with action if required
    if (config.requiredSections.includes('action')) {
      flow.push('action');
    }

    // If no flow built, use default
    if (flow.length === 0) {
      return ['hook', 'solution', 'action'];
    }

    return flow;
  }

  // ===========================================================================
  // PRIVATE METHODS - LLM GENERATION
  // ===========================================================================

  private async generateLayoutWithLLM(
    input: LayoutGenerationInput,
    availableContent: Record<string, unknown>,
    storyFlow: NarrativeRole[],
    personas: Persona[],
    brandConfig: BrandConfig | null
  ): Promise<LLMResponse> {
    // Build prompt for LLM
    const prompt = this.buildLayoutPrompt(
      input,
      availableContent,
      storyFlow,
      personas,
      brandConfig
    );

    // In production, this would call the actual LLM
    // For now, we'll use rule-based generation as fallback
    try {
      const response = await this.callLLM(prompt);
      return response;
    } catch {
      console.warn('LLM call failed, using rule-based generation');
      return this.generateLayoutRuleBased(input, availableContent, storyFlow, personas);
    }
  }

  private buildLayoutPrompt(
    input: LayoutGenerationInput,
    availableContent: Record<string, unknown>,
    storyFlow: NarrativeRole[],
    personas: Persona[],
    brandConfig: BrandConfig | null
  ): string {
    const componentList = Object.keys(COMPONENT_DEFINITIONS).join(', ');
    const pageConfig = PAGE_TYPE_CONFIGS[input.pageType];

    return `
You are an expert web page layout generator. Generate a layout for a ${input.pageType} page.

## Available Components
${componentList}

## Page Configuration
- Type: ${input.pageType}
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
${input.constraints ? JSON.stringify(input.constraints) : 'None'}

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
}
`;
  }

  private async callLLM(prompt: string): Promise<LLMResponse> {
    // Check for OpenAI API key
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: this.modelName,
        messages: [
          {
            role: 'system',
            content:
              'You are an expert web page layout generator. Always respond with valid JSON.',
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 2000,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      throw new Error(`LLM API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
      throw new Error('Empty LLM response');
    }

    const parsed = JSON.parse(content);
    return {
      sections: parsed.sections || [],
      metadata: parsed.metadata || {
        title: 'Page Title',
        description: 'Page description',
        keywords: [],
      },
      tokensUsed: data.usage?.total_tokens || 0,
    };
  }

  private generateLayoutRuleBased(
    input: LayoutGenerationInput,
    availableContent: Record<string, unknown>,
    storyFlow: NarrativeRole[],
    personas: Persona[]
  ): LLMResponse {
    const sections: LLMSectionSuggestion[] = [];
    const pageConfig = PAGE_TYPE_CONFIGS[input.pageType];
    const usedComponents: ComponentVariant[] = [];

    // Get target persona style
    const targetStyle = personas[0]?.communication_style || 'business';

    for (const role of storyFlow) {
      const context: ComponentSelectionContext = {
        pageType: input.pageType,
        availableContent,
        targetPersona: targetStyle,
        currentPosition: sections.length,
        totalSections: storyFlow.length,
        previousComponents: usedComponents,
        narrativeStage: role,
      };

      // Find best component for this role
      const matches = componentRegistry.findBestMatch(context, 3);

      if (matches.length > 0) {
        const selected = matches[0];
        usedComponents.push(selected.componentId);

        // Map content to component
        const contentMapping = this.mapContentToComponent(
          selected.componentId,
          availableContent
        );

        sections.push({
          componentId: selected.componentId,
          narrativeRole: role,
          contentMapping,
          reasoning: `Selected based on ${role} narrative role with score ${selected.totalScore.toFixed(2)}`,
        });
      }
    }

    // Generate metadata
    const metadata = {
      title:
        (availableContent.headline as string) ||
        `${pageConfig.name} | Your Brand`,
      description:
        (availableContent.subheadline as string) ||
        pageConfig.description,
      keywords: this.extractKeywords(availableContent),
    };

    return {
      sections,
      metadata,
      tokensUsed: 0,
    };
  }

  private mapContentToComponent(
    componentId: ComponentVariant,
    availableContent: Record<string, unknown>
  ): Record<string, string> {
    const component = COMPONENT_DEFINITIONS[componentId];
    if (!component) return {};

    const mapping: Record<string, string> = {};
    const requirements = component.aiMetadata.contentRequirements;

    // Map required fields
    for (const field of requirements.required) {
      if (availableContent[field] !== undefined) {
        mapping[field] = field;
      }
    }

    // Map optional fields
    for (const field of requirements.optional) {
      if (availableContent[field] !== undefined) {
        mapping[field] = field;
      }
    }

    return mapping;
  }

  private extractKeywords(content: Record<string, unknown>): string[] {
    const keywords: string[] = [];

    // Extract from headline
    if (typeof content.headline === 'string') {
      keywords.push(
        ...content.headline
          .toLowerCase()
          .split(/\s+/)
          .filter((w) => w.length > 4)
      );
    }

    // Extract from features
    if (Array.isArray(content.features)) {
      for (const feature of content.features.slice(0, 3)) {
        if ((feature as Record<string, string>).title) {
          keywords.push((feature as Record<string, string>).title.toLowerCase());
        }
      }
    }

    return [...new Set(keywords)].slice(0, 10);
  }

  // ===========================================================================
  // PRIVATE METHODS - VALIDATION & SCORING
  // ===========================================================================

  private async validateAndScoreSelections(
    llmSections: LLMSectionSuggestion[],
    pageType: PageType,
    availableContent: Record<string, unknown>,
    targetPersona?: string
  ): Promise<ComponentSelectionResult[]> {
    const results: ComponentSelectionResult[] = [];
    const usedComponents: ComponentVariant[] = [];

    for (let i = 0; i < llmSections.length; i++) {
      const section = llmSections[i];
      const componentId = section.componentId as ComponentVariant;

      // Validate component exists
      const component = componentRegistry.getComponent(componentId);
      if (!component) {
        console.warn(`Component ${componentId} not found, skipping`);
        continue;
      }

      // Build context for scoring
      const context: ComponentSelectionContext = {
        pageType,
        availableContent,
        targetPersona,
        currentPosition: i,
        totalSections: llmSections.length,
        previousComponents: usedComponents,
        narrativeStage: section.narrativeRole,
      };

      // Calculate score
      const score = componentRegistry.calculateScore(component, context);

      // Find alternates
      const alternates = componentRegistry
        .findBestMatch(context, 5)
        .filter((s) => s.componentId !== componentId);

      results.push({
        selected: componentId,
        score,
        alternates,
        contentMapping: section.contentMapping,
      });

      usedComponents.push(componentId);
    }

    return results;
  }

  // ===========================================================================
  // PRIVATE METHODS - LAYOUT BUILDING
  // ===========================================================================

  private buildPageLayout(
    input: LayoutGenerationInput,
    selections: ComponentSelectionResult[],
    metadata: { title: string; description: string; keywords: string[] },
    brandConfig: BrandConfig | null
  ): PageLayout {
    const sections: Section[] = selections.map((selection, index) => {
      const component = COMPONENT_DEFINITIONS[selection.selected];

      // Build section content
      const content: SectionContent = {};
      for (const [contentKey, propKey] of Object.entries(selection.contentMapping)) {
        content[propKey] = contentKey;
      }

      // Determine animation
      const animation: AnimationConfig = {
        preset: component?.animationPreset || 'fadeIn',
        delay: index * 0.1,
      };

      return {
        id: `section-${index}-${selection.selected}`,
        componentId: selection.selected,
        content,
        narrativeRole: component?.aiMetadata.narrativeRole || 'solution',
        order: index,
        animations: animation,
        styling: {
          padding: { top: '4rem', bottom: '4rem' },
        },
      };
    });

    // Build page metadata
    const pageMetadata: PageMetadata = {
      title: metadata.title,
      description: metadata.description,
      keywords: metadata.keywords,
    };

    return {
      pageId: `${input.websiteId}-${input.pageType}-${Date.now()}`,
      slug: this.generateSlug(input.pageType),
      type: input.pageType,
      sections,
      metadata: pageMetadata,
    };
  }

  private generateSlug(pageType: PageType): string {
    const slugMap: Record<PageType, string> = {
      home: '/',
      landing: '/landing',
      product: '/product',
      pricing: '/pricing',
      about: '/about',
      contact: '/contact',
      blog: '/blog',
      'blog-post': '/blog/post',
      'case-study': '/case-studies/story',
      features: '/features',
      solutions: '/solutions',
      resources: '/resources',
      careers: '/careers',
      legal: '/legal',
      custom: '/page',
    };

    return slugMap[pageType] || '/page';
  }

  private calculateConfidenceScore(selections: ComponentSelectionResult[]): number {
    if (selections.length === 0) return 0;

    const avgScore =
      selections.reduce((sum, s) => sum + s.score.totalScore, 0) / selections.length;

    return Math.round(avgScore * 100) / 100;
  }

  // ===========================================================================
  // PRIVATE METHODS - NAVIGATION & GLOBAL COMPONENTS
  // ===========================================================================

  private generateNavigationStructure(pages: PageLayout[]): NavigationStructure {
    const primary = pages
      .filter((p) => ['home', 'features', 'pricing', 'about', 'contact'].includes(p.type))
      .map((p) => ({
        id: p.pageId,
        label: PAGE_TYPE_CONFIGS[p.type].name,
        href: p.slug,
      }));

    const secondary = pages
      .filter((p) => ['blog', 'resources', 'careers'].includes(p.type))
      .map((p) => ({
        id: p.pageId,
        label: PAGE_TYPE_CONFIGS[p.type].name,
        href: p.slug,
      }));

    const footer = pages
      .filter((p) => ['legal', 'contact', 'about'].includes(p.type))
      .map((p) => ({
        id: p.pageId,
        label: PAGE_TYPE_CONFIGS[p.type].name,
        href: p.slug,
      }));

    return {
      primary,
      secondary,
      footer,
      cta: {
        label: 'Get Started',
        href: '/signup',
        variant: 'primary',
      },
    };
  }

  private generateGlobalComponents(pages: PageLayout[]): GlobalComponent[] {
    return [
      {
        id: 'global-header',
        type: 'header',
        componentId: 'nav-header',
        content: {
          logo: { src: '/logo.svg', alt: 'Logo' },
          navigation: pages.slice(0, 5).map((p) => ({
            label: PAGE_TYPE_CONFIGS[p.type].name,
            href: p.slug,
          })),
        },
        visibility: { showOn: 'all' },
      },
      {
        id: 'global-footer',
        type: 'footer',
        componentId: 'footer-standard',
        content: {
          columns: [
            { title: 'Product', links: [{ label: 'Features', href: '/features' }] },
            { title: 'Company', links: [{ label: 'About', href: '/about' }] },
            { title: 'Resources', links: [{ label: 'Blog', href: '/blog' }] },
          ],
          copyright: `© ${new Date().getFullYear()} Company. All rights reserved.`,
        },
        visibility: { showOn: 'all' },
      },
    ];
  }
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Generate a page layout
 */
export async function generatePageLayout(
  input: LayoutGenerationInput
): Promise<LayoutGenerationResult> {
  const agent = new LayoutGenerationAgent();
  return agent.generateLayout(input);
}

/**
 * Generate complete site architecture
 */
export async function generateSiteArchitecture(
  websiteId: string,
  workspaceId: string,
  pages: PageType[] = ['home', 'features', 'pricing', 'about', 'contact']
): Promise<SiteArchitecture> {
  const agent = new LayoutGenerationAgent();
  return agent.generateSiteArchitecture(websiteId, workspaceId, pages);
}

/**
 * Save a page layout to the database
 */
export async function savePageLayout(layout: PageLayout): Promise<PageLayout> {
  const supabase = await createClient();

  // Extract websiteId from pageId (format: websiteId-pageType-timestamp)
  const websiteId = layout.pageId.split('-')[0];

  // Check if page exists
  const { data: existingPage } = await supabase
    .from('pages')
    .select('id')
    .eq('website_id', websiteId)
    .eq('slug', layout.slug)
    .single();

  // Convert layout to JSON-compatible format
  const contentJson = JSON.parse(
    JSON.stringify({
      sections: layout.sections,
      metadata: layout.metadata,
      personaVariants: layout.personaVariants,
    })
  );

  if (existingPage) {
    // Update existing page
    const { error } = await supabase
      .from('pages')
      .update({
        title: layout.metadata.title,
        content: contentJson,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existingPage.id);

    if (error) throw error;
  } else {
    // Create new page
    const { error } = await supabase.from('pages').insert({
      website_id: websiteId,
      slug: layout.slug,
      path: layout.slug,
      title: layout.metadata.title,
      content: contentJson,
    });

    if (error) throw error;
  }

  return layout;
}

/**
 * Get a page layout from the database
 */
export async function getPageLayout(
  websiteId: string,
  slug: string
): Promise<PageLayout | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('pages')
    .select('*')
    .eq('website_id', websiteId)
    .eq('slug', slug)
    .single();

  if (error || !data) return null;

  const content = data.content as Record<string, unknown>;
  const dbData = data as Record<string, unknown>;

  // Get page type from content metadata or default to 'custom'
  const pageType =
    (dbData.type as PageType) ||
    (content.type as PageType) ||
    'custom';

  return {
    pageId: data.id,
    slug: data.slug,
    type: pageType,
    sections: (content.sections as Section[]) || [],
    metadata: (content.metadata as PageMetadata) || {
      title: data.title,
      description: '',
    },
    personaVariants: content.personaVariants as PageLayout['personaVariants'],
  };
}
