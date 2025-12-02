/**
 * Section Generator Service
 * Phase 6: Conversational Marketing Platform
 *
 * Generates inline marketing sections in response to CTA clicks.
 * Uses knowledge base context and AI to create relevant, personalized content.
 *
 * Features:
 * - Intent-based section type selection
 * - Component selection from marketing library
 * - Knowledge-grounded content generation
 * - Persona-aware content adaptation
 * - Streaming support for real-time rendering
 */

import { v4 as uuidv4 } from 'uuid';
import { completeJSON, streamComplete } from '@/lib/ai/client';
import type { LLMMessage } from '@/lib/ai/client';
import { similaritySearch } from '@/lib/knowledge/embeddings/store';
import { generateEmbedding } from '@/lib/knowledge/embeddings/client';
import type { CTASource, GeneratedSection, ConversationalRenderMode } from './chat-context';
import type { KnowledgeContextItem, IntentCategory, ClassifiedIntent } from './types';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Section generation request
 */
export interface SectionGenerationRequest {
  /** Website ID for knowledge retrieval */
  websiteId: string;
  /** Workspace ID for knowledge retrieval */
  workspaceId: string;
  /** Source CTA that triggered generation */
  ctaSource: CTASource;
  /** Optional custom message/query */
  customMessage?: string;
  /** Preferred render mode */
  renderMode: ConversationalRenderMode;
  /** Persona hint for adaptation */
  personaHint?: string;
  /** Session ID for context */
  sessionId?: string;
  /** Topics to exclude to avoid repetition */
  excludeTopics?: string[];
  /** Existing section types to avoid repetition */
  existingSectionTypes?: string[];
}

/**
 * Generated section result
 */
export interface SectionGenerationResult {
  /** Generated section with content */
  section: GeneratedSection;
  /** Detected intent category */
  intent: ClassifiedIntent;
  /** Knowledge items used */
  knowledgeSources: KnowledgeContextItem[];
  /** Suggested follow-up CTAs */
  suggestedFollowUps: SuggestedCTA[];
  /** Tokens used in generation */
  tokensUsed: number;
}

/**
 * Suggested follow-up CTA
 */
export interface SuggestedCTA {
  text: string;
  topic: string;
  priority: 'high' | 'medium' | 'low';
}

/**
 * Section type determines the component and layout
 */
export type SectionType =
  | 'features-grid'
  | 'features-cards'
  | 'faq-accordion'
  | 'pricing-table'
  | 'comparison-table'
  | 'testimonials'
  | 'cta-block'
  | 'timeline'
  | 'stats-display'
  | 'text-block';

/**
 * Structured section content
 */
export interface SectionContent {
  type: SectionType;
  headline?: string;
  subheadline?: string;
  items: SectionItem[];
  cta?: {
    text: string;
    action: string;
    variant: 'primary' | 'secondary';
  };
}

export interface SectionItem {
  id: string;
  title: string;
  description: string;
  icon?: string;
  value?: string;
  label?: string;
  question?: string;
  answer?: string;
}

// ============================================================================
// SECTION GENERATOR SERVICE
// ============================================================================

export class SectionGeneratorService {
  /**
   * Generate a section based on CTA context
   */
  async generateSection(
    request: SectionGenerationRequest
  ): Promise<SectionGenerationResult> {
    const startTime = Date.now();

    // Build query from CTA context
    const query = this.buildQueryFromCTA(request.ctaSource, request.customMessage);

    // Retrieve relevant knowledge
    const knowledgeContext = await this.retrieveKnowledge(
      query,
      request.workspaceId
    );

    // Classify intent to determine section type
    const intent = await this.classifyIntent(query, knowledgeContext, request.ctaSource);

    // Select appropriate section type (pass metadata for deep-dive detection)
    const sectionType = this.selectSectionType(
      intent,
      request.renderMode,
      request.ctaSource.metadata as Record<string, unknown> | undefined
    );

    // Generate section content
    const { content, tokensUsed } = await this.generateSectionContent({
      sectionType,
      query,
      intent,
      knowledgeContext,
      personaHint: request.personaHint,
      ctaSource: request.ctaSource,
      excludeTopics: request.excludeTopics,
      existingSectionTypes: request.existingSectionTypes,
    });

    // Generate follow-up suggestions based on knowledge context
    const suggestedFollowUps = await this.generateFollowUps(
      query,
      intent,
      content,
      knowledgeContext
    );

    // Build the section object
    const section: GeneratedSection = {
      id: uuidv4(),
      sourceCtaId: request.ctaSource.ctaId,
      content: content as unknown as React.ReactNode, // Will be rendered by component
      sectionType,
      animationState: 'entering',
      createdAt: new Date(),
    };

    return {
      section,
      intent,
      knowledgeSources: knowledgeContext,
      suggestedFollowUps,
      tokensUsed,
    };
  }

  /**
   * Stream section generation for real-time UI
   */
  async *streamSectionGeneration(
    request: SectionGenerationRequest
  ): AsyncGenerator<string, SectionGenerationResult, unknown> {
    const query = this.buildQueryFromCTA(request.ctaSource, request.customMessage);
    const knowledgeContext = await this.retrieveKnowledge(query, request.workspaceId);
    const intent = await this.classifyIntent(query, knowledgeContext, request.ctaSource);
    // Select section type, passing metadata for deep-dive detection
    const sectionType = this.selectSectionType(
      intent,
      request.renderMode,
      request.ctaSource.metadata as Record<string, unknown> | undefined
    );

    const systemPrompt = this.buildSectionPrompt({
      sectionType,
      query,
      intent,
      knowledgeContext,
      personaHint: request.personaHint,
      ctaSource: request.ctaSource,
      excludeTopics: request.excludeTopics,
      existingSectionTypes: request.existingSectionTypes,
    });

    const messages: LLMMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: query },
    ];

    let fullContent = '';
    let tokensUsed = 0;
    for await (const chunk of streamComplete({ messages })) {
      fullContent += chunk;
      tokensUsed += 1; // Approximate token count
      yield chunk;
    }

    // Parse the final content
    let parsedContent: SectionContent;
    try {
      // Strip markdown code blocks if present (LLM sometimes wraps JSON in ```json ... ```)
      let cleanedContent = fullContent.trim();
      if (cleanedContent.startsWith('```json')) {
        cleanedContent = cleanedContent.slice(7); // Remove ```json
      } else if (cleanedContent.startsWith('```')) {
        cleanedContent = cleanedContent.slice(3); // Remove ```
      }
      if (cleanedContent.endsWith('```')) {
        cleanedContent = cleanedContent.slice(0, -3); // Remove trailing ```
      }
      cleanedContent = cleanedContent.trim();

      parsedContent = JSON.parse(cleanedContent) as SectionContent;
    } catch {
      parsedContent = {
        type: 'text-block',
        headline: 'Response',
        items: [{ id: uuidv4(), title: '', description: fullContent }],
      };
    }

    // Generate knowledge-grounded follow-ups
    const suggestedFollowUps = await this.generateFollowUps(
      query,
      intent,
      parsedContent,
      knowledgeContext
    );

    const section: GeneratedSection = {
      id: uuidv4(),
      sourceCtaId: request.ctaSource.ctaId,
      content: parsedContent as unknown as React.ReactNode,
      sectionType,
      animationState: 'visible',
      createdAt: new Date(),
    };

    return {
      section,
      intent,
      knowledgeSources: knowledgeContext,
      suggestedFollowUps,
      tokensUsed,
    };
  }

  /**
   * Build a query from CTA context
   * For deep-dives, focuses on the specific item to improve KB retrieval
   */
  private buildQueryFromCTA(ctaSource: CTASource, customMessage?: string): string {
    if (customMessage) {
      return customMessage;
    }

    const metadata = ctaSource.metadata as Record<string, unknown> | undefined;
    const ctaText = ctaSource.ctaText.toLowerCase();
    const topic = (metadata?.topic as string) || '';

    // Handle deep-dive requests specifically
    // Use the item title and description for more targeted KB search
    if (metadata?.isDeepDive && metadata?.itemTitle) {
      const itemTitle = metadata.itemTitle as string;
      const itemDescription = (metadata.itemDescription as string) || '';
      return `Give detailed information about ${itemTitle}. ${itemDescription ? `Context: ${itemDescription}` : ''} Include specifics, examples, and practical applications.`;
    }

    // Map common CTA patterns to queries
    const patterns: [RegExp, string][] = [
      [/learn more/i, `Tell me more about ${topic || 'your offerings'}`],
      [/get started/i, 'How do I get started with your product?'],
      [/see pricing|view pricing|pricing/i, 'What are your pricing options?'],
      [/book demo|request demo|schedule demo/i, 'I want to book a demo'],
      [/contact/i, 'How can I contact your team?'],
      [/features/i, 'What features does your product have?'],
      [/how it works/i, 'How does your product work?'],
      [/compare|vs|versus/i, 'How do you compare to alternatives?'],
      [/testimonials|reviews|customers/i, 'What do your customers say?'],
      [/faq|questions/i, 'What are common questions about your product?'],
      [/use cases?/i, 'What are the use cases for your product?'],
      [/integrations?/i, 'What integrations do you support?'],
      [/support|help/i, 'How can I get support?'],
      [/trial|free/i, 'Do you offer a free trial?'],
    ];

    for (const [pattern, query] of patterns) {
      if (pattern.test(ctaText)) {
        return topic ? `${query} specifically about ${topic}` : query;
      }
    }

    // Default query based on CTA text
    return `Tell me more about: ${ctaSource.ctaText}${topic ? ` (${topic})` : ''}`;
  }

  /**
   * Retrieve relevant knowledge from embeddings
   */
  private async retrieveKnowledge(
    query: string,
    workspaceId: string
  ): Promise<KnowledgeContextItem[]> {
    console.log('[Section Generator] Retrieving knowledge for query:', {
      query: query.slice(0, 150),
      workspaceId,
    });

    try {
      const embeddingResult = await generateEmbedding(query);
      console.log('[Section Generator] Generated embedding, length:', embeddingResult.embedding.length);

      const results = await similaritySearch(
        {
          workspaceId,
          query, // Include query for the interface
          limit: 8, // More context for section generation
          threshold: 0.4, // Lowered from 0.5 for broader matches
        },
        embeddingResult.embedding
      );

      console.log('[Section Generator] KB retrieval results:', {
        totalResults: results.length,
        results: results.map(r => ({
          id: r.id,
          similarity: r.similarity.toFixed(3),
          entityType: r.entityType,
          contentPreview: r.content.slice(0, 100) + '...',
        })),
      });

      return results.map(r => ({
        id: r.id,
        content: r.content,
        entityType: r.entityType || 'general',
        similarity: r.similarity,
      }));
    } catch (error) {
      console.error('[Section Generator] Knowledge retrieval failed:', error);
      return [];
    }
  }

  /**
   * Classify intent from query and CTA context
   */
  private async classifyIntent(
    query: string,
    knowledgeContext: KnowledgeContextItem[],
    ctaSource: CTASource
  ): Promise<ClassifiedIntent> {
    const systemPrompt = `You are an intent classifier for a conversational marketing system.
Based on the CTA clicked and the query, classify the user's intent.

Categories:
- product-info: Product features, capabilities, what it does
- pricing: Cost, plans, pricing tiers
- comparison: Comparing with alternatives
- how-it-works: Process, implementation, technical details
- use-case: Industry applications, examples
- integration: Connecting with other tools
- support: Help, troubleshooting
- demo-request: Wants demo or trial
- contact: Speak to human
- testimonials: Customer stories, reviews
- faq: Common questions
- general: Other/unclear

CTA Context:
- Text: "${ctaSource.ctaText}"
- Type: ${ctaSource.ctaType}
- Section: ${ctaSource.sectionId || 'unknown'}
${ctaSource.metadata?.topic ? `- Topic: ${ctaSource.metadata.topic}` : ''}

Suggest the best section type for the response:
- features-grid: Multiple features/capabilities
- features-cards: Clickable feature cards
- faq-accordion: Q&A format
- pricing-table: Pricing comparison
- comparison-table: Feature comparison
- testimonials: Customer quotes
- cta-block: Call to action
- timeline: Process steps
- stats-display: Numbers/metrics
- text-block: Simple text response

Respond in JSON:
{
  "category": "category-name",
  "confidence": 0.0-1.0,
  "suggestedContentType": "section-type",
  "entities": { "topic": "extracted topic" }
}`;

    try {
      const { data } = await completeJSON<{
        category: IntentCategory;
        confidence: number;
        suggestedContentType: SectionType;
        entities: Record<string, string>;
      }>({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: query },
        ],
        config: { maxTokens: 500 },
      });

      // Map to ChatContentType
      return {
        ...data,
        suggestedContentType: this.mapSectionTypeToContentType(data.suggestedContentType),
      };
    } catch (error) {
      console.error('Intent classification failed:', error);
      return {
        category: 'general',
        confidence: 0.5,
        suggestedContentType: 'text',
        entities: {},
      };
    }
  }

  /**
   * Map section type to chat content type
   */
  private mapSectionTypeToContentType(sectionType: SectionType): 'text' | 'card-grid' | 'faq-accordion' | 'comparison-table' | 'stats-display' | 'cta-block' | 'timeline' | 'form' {
    const mapping: Record<SectionType, 'text' | 'card-grid' | 'faq-accordion' | 'comparison-table' | 'stats-display' | 'cta-block' | 'timeline' | 'form'> = {
      'features-grid': 'card-grid',
      'features-cards': 'card-grid',
      'faq-accordion': 'faq-accordion',
      'pricing-table': 'comparison-table',
      'comparison-table': 'comparison-table',
      'testimonials': 'card-grid',
      'cta-block': 'cta-block',
      'timeline': 'timeline',
      'stats-display': 'stats-display',
      'text-block': 'text',
    };
    return mapping[sectionType] || 'text';
  }

  /**
   * Select appropriate section type based on intent, render mode, and context
   * For deep-dives, always uses a DIFFERENT layout from the source section
   */
  private selectSectionType(
    intent: ClassifiedIntent,
    renderMode: ConversationalRenderMode,
    ctaMetadata?: Record<string, unknown>
  ): SectionType {
    // For chat-bubble mode, prefer simpler types
    if (renderMode === 'chat-bubble') {
      return 'text-block';
    }

    // Check if this is a deep-dive (clicking on a feature card)
    const isDeepDive = ctaMetadata?.isDeepDive === true;
    const sourceSectionType = ctaMetadata?.sourceSectionType as string | undefined;

    // For deep-dives, choose a DIFFERENT layout from the source
    if (isDeepDive && sourceSectionType) {
      return this.selectDeepDiveLayout(sourceSectionType, intent);
    }

    // Map intent to section type with some randomization for variety
    const intentToSectionOptions: Record<IntentCategory, SectionType[]> = {
      'product-info': ['features-grid', 'features-cards', 'timeline'],
      'pricing': ['pricing-table', 'comparison-table', 'stats-display'],
      'comparison': ['comparison-table', 'features-grid'],
      'how-it-works': ['timeline', 'features-cards', 'faq-accordion'],
      'use-case': ['features-cards', 'testimonials', 'timeline'],
      'integration': ['features-grid', 'timeline', 'features-cards'],
      'support': ['faq-accordion', 'features-cards'],
      'demo-request': ['cta-block', 'features-grid'],
      'contact': ['cta-block', 'text-block'],
      'general': ['text-block', 'features-grid'],
    };

    const options = intentToSectionOptions[intent.category] || ['text-block'];
    // Pick the first option for now, could add more sophisticated selection
    return options[0];
  }

  /**
   * Select a different layout for deep-dive content
   * Always returns a layout DIFFERENT from the source section type
   */
  private selectDeepDiveLayout(sourceSectionType: string, intent: ClassifiedIntent): SectionType {
    // Define which layouts work well for deep-dives for each source type
    const deepDiveLayouts: Record<string, SectionType[]> = {
      'features-grid': ['timeline', 'faq-accordion', 'text-block', 'stats-display'],
      'features-cards': ['timeline', 'faq-accordion', 'text-block', 'stats-display'],
      'timeline': ['features-grid', 'faq-accordion', 'text-block'],
      'faq-accordion': ['timeline', 'features-grid', 'text-block'],
      'pricing-table': ['features-cards', 'comparison-table', 'text-block'],
      'comparison-table': ['features-grid', 'timeline', 'text-block'],
      'testimonials': ['features-grid', 'timeline', 'text-block'],
      'stats-display': ['features-grid', 'timeline', 'text-block'],
      'cta-block': ['features-grid', 'timeline', 'text-block'],
      'text-block': ['features-grid', 'timeline', 'faq-accordion'],
    };

    const availableLayouts = deepDiveLayouts[sourceSectionType] || ['text-block', 'timeline', 'faq-accordion'];

    // For deep-dives, prefer layouts that allow detailed explanation
    // Timeline is great for step-by-step details
    // FAQ is great for Q&A format
    // Text-block is fallback for prose content

    // Use intent to pick the best option
    if (intent.category === 'how-it-works' && availableLayouts.includes('timeline')) {
      return 'timeline';
    }
    if (intent.category === 'support' && availableLayouts.includes('faq-accordion')) {
      return 'faq-accordion';
    }

    // Default to first available option
    return availableLayouts[0];
  }

  /**
   * Generate section content using AI
   */
  private async generateSectionContent(params: {
    sectionType: SectionType;
    query: string;
    intent: ClassifiedIntent;
    knowledgeContext: KnowledgeContextItem[];
    personaHint?: string;
    ctaSource: CTASource;
    excludeTopics?: string[];
    existingSectionTypes?: string[];
  }): Promise<{ content: SectionContent; tokensUsed: number }> {
    const systemPrompt = this.buildSectionPrompt(params);

    const messages: LLMMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: params.query },
    ];

    try {
      const { data, tokensUsed } = await completeJSON<SectionContent>({
        messages,
        config: { maxTokens: 2000 },
      });

      // Ensure items have IDs
      if (data.items) {
        data.items = data.items.map((item, index) => ({
          ...item,
          id: item.id || `item-${index}`,
        }));
      }

      return { content: data, tokensUsed };
    } catch (error) {
      console.error('Section content generation failed:', error);
      return {
        content: {
          type: 'text-block',
          headline: 'Information',
          items: [{
            id: 'fallback',
            title: 'We can help',
            description: 'Please contact our team for more information.',
          }],
        },
        tokensUsed: 0,
      };
    }
  }

  /**
   * Build the prompt for section generation
   */
  private buildSectionPrompt(params: {
    sectionType: SectionType;
    query: string;
    intent: ClassifiedIntent;
    knowledgeContext: KnowledgeContextItem[];
    personaHint?: string;
    ctaSource: CTASource;
    excludeTopics?: string[];
    existingSectionTypes?: string[];
  }): string {
    const hasKnowledge = params.knowledgeContext.length > 0;
    const avgRelevance = hasKnowledge
      ? params.knowledgeContext.reduce((sum, k) => sum + k.similarity, 0) / params.knowledgeContext.length
      : 0;

    // Check if this is a deep-dive request
    const metadata = params.ctaSource.metadata as Record<string, unknown> | undefined;
    const isDeepDive = metadata?.isDeepDive === true;
    const itemTitle = metadata?.itemTitle as string | undefined;
    const itemDescription = metadata?.itemDescription as string | undefined;

    let prompt = `You are generating inline marketing content for a website visitor.
The visitor clicked a CTA and expects relevant, helpful information.

CONTEXT:
- CTA clicked: "${params.ctaSource.ctaText}"
- Section type to generate: ${params.sectionType}
- Intent: ${params.intent.category} (confidence: ${params.intent.confidence})`;

    if (isDeepDive && itemTitle) {
      prompt += `

DEEP-DIVE CONTEXT:
This is a DEEP-DIVE request. The visitor clicked on "${itemTitle}" to learn more details.
${itemDescription ? `- Brief description they saw: "${itemDescription}"` : ''}
- Generate DETAILED, IN-DEPTH content about this specific topic
- Go deeper than the initial overview - provide specifics, examples, use cases
- Use the ${params.sectionType} format to explain HOW this feature/topic works
- Include practical benefits and real-world applications`;
    }

    if (params.personaHint) {
      prompt += `\n- Visitor appears to be: ${params.personaHint}`;
    }

    // Add content uniqueness requirements if there are excluded topics
    const hasExcludedTopics = params.excludeTopics && params.excludeTopics.length > 0;
    const hasExistingSectionTypes = params.existingSectionTypes && params.existingSectionTypes.length > 0;

    if (hasExcludedTopics || hasExistingSectionTypes) {
      prompt += `\n\n=== CONTENT UNIQUENESS REQUIREMENTS ===
IMPORTANT: The visitor has already seen content on this page. Generate FRESH, UNIQUE content.`;

      if (hasExcludedTopics) {
        prompt += `\n\nPREVIOUSLY COVERED TOPICS (DO NOT repeat these):
${params.excludeTopics!.map((t, i) => `${i + 1}. ${t}`).join('\n')}

- Avoid generating content about these topics
- Focus on NEW aspects, angles, or details not yet covered
- If the CTA relates to a covered topic, go DEEPER or explore ADJACENT aspects`;
      }

      if (hasExistingSectionTypes) {
        prompt += `\n\nEXISTING SECTION TYPES ALREADY SHOWN:
${params.existingSectionTypes!.join(', ')}

- Prefer using DIFFERENT section types when possible
- If the same section type is necessary, ensure the content structure feels fresh
- Vary headlines, item counts, and presentation style`;
      }

      prompt += `\n=== END UNIQUENESS REQUIREMENTS ===`;
    }

    // Strongly enforce knowledge-grounded content
    if (hasKnowledge) {
      prompt += `\n\n=== KNOWLEDGE BASE CONTENT ===
CRITICAL INSTRUCTION: You MUST base your response ONLY on the following knowledge base content.
Do NOT make up information, features, pricing, or claims that are not explicitly stated below.
Average relevance score: ${(avgRelevance * 100).toFixed(0)}%
`;
      params.knowledgeContext.forEach((item, i) => {
        prompt += `\n--- SOURCE ${i + 1} (${item.entityType}, relevance: ${(item.similarity * 100).toFixed(0)}%) ---
${item.content}
`;
      });
      prompt += `\n=== END KNOWLEDGE BASE ===`;
    } else {
      // No knowledge found - generate a helpful fallback
      prompt += `\n\n=== NO KNOWLEDGE AVAILABLE ===
WARNING: No relevant information was found in the knowledge base for this query.
Generate a GENERIC, HELPFUL response that:
1. Acknowledges the visitor's interest in "${params.ctaSource.ctaText}"
2. Provides general guidance without making specific claims
3. Includes a CTA to contact the team for more specific information
4. Does NOT invent specific features, pricing, or capabilities
=== END WARNING ===`;
    }

    prompt += `\n\nGENERATE JSON for section type "${params.sectionType}":`;

    // Add schema based on section type
    const schemas: Record<SectionType, string> = {
      'features-grid': `{
  "type": "features-grid",
  "headline": "Section headline",
  "subheadline": "Optional subheadline",
  "items": [
    { "id": "1", "title": "Feature title", "description": "Feature description", "icon": "icon-name" }
  ]
}`,
      'features-cards': `{
  "type": "features-cards",
  "headline": "Section headline",
  "items": [
    { "id": "1", "title": "Card title", "description": "Card description", "icon": "icon-name" }
  ]
}`,
      'faq-accordion': `{
  "type": "faq-accordion",
  "headline": "Frequently Asked Questions",
  "items": [
    { "id": "1", "question": "Question text?", "answer": "Answer text" }
  ]
}`,
      'pricing-table': `{
  "type": "pricing-table",
  "headline": "Pricing Plans",
  "items": [
    { "id": "1", "title": "Plan name", "value": "$99/mo", "description": "Plan features", "label": "Most Popular" }
  ]
}`,
      'comparison-table': `{
  "type": "comparison-table",
  "headline": "Comparison",
  "items": [
    { "id": "1", "title": "Feature", "description": "Our product vs alternatives" }
  ]
}`,
      'testimonials': `{
  "type": "testimonials",
  "headline": "What Our Customers Say",
  "items": [
    { "id": "1", "title": "Customer Name", "description": "Testimonial quote", "label": "Company" }
  ]
}`,
      'cta-block': `{
  "type": "cta-block",
  "headline": "Ready to get started?",
  "subheadline": "Description",
  "items": [],
  "cta": { "text": "Button text", "action": "url-or-action", "variant": "primary" }
}`,
      'timeline': `{
  "type": "timeline",
  "headline": "How It Works",
  "items": [
    { "id": "1", "title": "Step 1", "description": "Step description", "label": "1" }
  ]
}`,
      'stats-display': `{
  "type": "stats-display",
  "headline": "By the Numbers",
  "items": [
    { "id": "1", "value": "100%", "title": "Stat title", "description": "Stat description" }
  ]
}`,
      'text-block': `{
  "type": "text-block",
  "headline": "Title",
  "items": [
    { "id": "1", "title": "", "description": "Main text content here" }
  ]
}`,
    };

    prompt += `\n${schemas[params.sectionType]}

CRITICAL GUIDELINES:
${hasKnowledge ? `- ONLY use information explicitly stated in the knowledge base sources above
- Do NOT invent features, pricing, statistics, or claims not in the sources
- Cite the source numbers in your reasoning (but not in the output)
- Paraphrase and summarize, but stay factually accurate to the sources
- If sources don't fully answer the query, acknowledge this and suggest contacting the team` :
`- Since no knowledge was found, keep claims generic and factual
- Do NOT make up specific features, pricing, or statistics
- Focus on acknowledging interest and encouraging contact`}
- Be concise and focused on what the visitor asked about
- Generate 3-6 items for grid/card layouts
- Generate 4-8 items for FAQ
- Make content compelling and action-oriented
- Always include appropriate CTAs for next steps

OUTPUT FORMAT:
- Return ONLY raw JSON, no markdown code blocks
- Do NOT wrap the response in \`\`\`json or \`\`\`
- Start directly with { and end with }`;

    return prompt;
  }

  /**
   * Generate follow-up CTA suggestions based on knowledge context
   * These should lead to OTHER topics available in the knowledge base
   */
  private async generateFollowUps(
    query: string,
    intent: ClassifiedIntent,
    content: SectionContent,
    knowledgeContext: KnowledgeContextItem[]
  ): Promise<SuggestedCTA[]> {
    try {
      // Extract topics from knowledge context that weren't the main focus
      const knowledgeTopics = knowledgeContext
        .filter(k => k.similarity < 0.85) // Get related but not exact matches
        .slice(0, 3)
        .map(k => k.content.slice(0, 200));

      const { data } = await completeJSON<{ followUps: SuggestedCTA[] }>({
        messages: [
          {
            role: 'system',
            content: `You are generating follow-up CTAs for a conversational marketing page.
The user just viewed content about one topic. Now suggest 2-3 CTAs to explore RELATED topics.

IMPORTANT RULES:
1. CTAs MUST be based on REAL content available in the knowledge base (see related topics below)
2. Do NOT suggest topics that aren't mentioned in the knowledge snippets
3. Each CTA should naturally lead the visitor deeper or to adjacent topics
4. Prioritize by how relevant/useful for someone who just viewed the current content
5. Make button text action-oriented and specific (e.g., "See Pricing Plans" not "Learn More")

${knowledgeTopics.length > 0 ? `
RELATED KNOWLEDGE BASE TOPICS (use these for CTAs):
${knowledgeTopics.map((t, i) => `${i + 1}. ${t}...`).join('\n')}
` : ''}

Respond in JSON:
{
  "followUps": [
    { "text": "Action-oriented CTA text", "topic": "specific-topic", "priority": "high|medium|low" }
  ]
}`,
          },
          {
            role: 'user',
            content: `Just shown: "${content.headline || content.type}"
Original query: "${query}"
Intent: ${intent.category}

What should they explore next?`,
          },
        ],
        config: { maxTokens: 400 },
      });

      return data.followUps?.slice(0, 3) || [];
    } catch (error) {
      console.error('Follow-up generation failed:', error);
      // Return generic fallbacks
      return [
        { text: 'Explore Features', topic: 'features', priority: 'medium' },
        { text: 'Contact Us', topic: 'contact', priority: 'low' },
      ];
    }
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

let sectionGeneratorInstance: SectionGeneratorService | null = null;

export function getSectionGenerator(): SectionGeneratorService {
  if (!sectionGeneratorInstance) {
    sectionGeneratorInstance = new SectionGeneratorService();
  }
  return sectionGeneratorInstance;
}

// ============================================================================
// HELPER: Get workspace ID for website
// ============================================================================

export async function getWorkspaceIdForWebsite(websiteIdOrSubdomain: string): Promise<string> {
  const { createClient } = await import('@/lib/supabase/server');
  const supabase = await createClient();

  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(websiteIdOrSubdomain);

  // Query the websites table directly instead of using RPC
  // This is more reliable and doesn't require special function permissions
  if (isUUID) {
    const { data, error } = await supabase
      .from('websites')
      .select('workspace_id')
      .eq('id', websiteIdOrSubdomain)
      .single();

    if (error || !data) {
      console.error('Website lookup error:', error);
      throw new Error(`Website not found: ${websiteIdOrSubdomain}`);
    }

    return data.workspace_id;
  } else {
    // Lookup by slug
    const { data, error } = await supabase
      .from('websites')
      .select('workspace_id')
      .eq('slug', websiteIdOrSubdomain)
      .single();

    if (error || !data) {
      console.error('Website lookup error:', error);
      throw new Error(`Website not found: ${websiteIdOrSubdomain}`);
    }

    return data.workspace_id;
  }
}
