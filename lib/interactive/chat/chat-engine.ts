/**
 * Chat Engine
 * Phase 4.4: AI-Powered Conversational Interface
 *
 * Main engine for handling chat conversations with AI,
 * including intent classification, knowledge retrieval,
 * and response generation.
 */

import { v4 as uuidv4 } from 'uuid';
import { complete, completeJSON, streamComplete } from '@/lib/ai/client';
import type { LLMMessage } from '@/lib/ai/client';
import { similaritySearch } from '@/lib/knowledge/embeddings/store';
import { generateEmbedding } from '@/lib/knowledge/embeddings/client';
import type {
  ChatMessage,
  ChatSession,
  ChatContext,
  ChatContentType,
  IntentCategory,
  ClassifiedIntent,
  RenderDecision,
  ChatStructuredContent,
  KnowledgeContextItem,
  SendMessageRequest,
  ChatResponse,
} from './types';
import { MessageService } from './message-service';

// ============================================================================
// CHAT ENGINE
// ============================================================================

export class ChatEngine {
  private messageService: MessageService;

  constructor() {
    this.messageService = new MessageService();
  }

  /**
   * Process a user message and generate AI response
   */
  async processMessage(request: SendMessageRequest): Promise<ChatResponse> {
    const startTime = Date.now();

    // Get or create session
    let sessionId = request.sessionId;
    if (!sessionId) {
      sessionId = uuidv4();
    }

    // Get conversation history
    const history = await this.messageService.getHistory(sessionId, 10);

    // Store user message
    const userMessage = await this.messageService.saveMessage({
      sessionId,
      websiteId: request.websiteId,
      role: 'user',
      content: request.message,
      contentType: 'text',
      metadata: {
        sectionContext: request.sectionContext,
      },
    });

    // Get workspace ID for KB retrieval
    const workspaceId = await this.getWorkspaceIdForWebsite(request.websiteId);

    // Retrieve relevant knowledge
    const knowledgeContext = await this.retrieveKnowledge(
      request.message,
      workspaceId
    );

    // Classify intent
    const intent = await this.classifyIntent(request.message, knowledgeContext);

    // Decide render mode and content type
    const renderDecision = this.decideRender(intent, request.sectionContext);

    // Generate AI response
    const aiResponse = await this.generateResponse({
      userMessage: request.message,
      history: history.map(m => ({
        role: m.role,
        content: m.content,
      })),
      knowledgeContext,
      intent,
      renderDecision,
      personaHint: request.personaHint,
      adaptationHints: request.adaptationHints,
    });

    const responseTimeMs = Date.now() - startTime;

    // Store assistant message
    const assistantMessage = await this.messageService.saveMessage({
      sessionId,
      websiteId: request.websiteId,
      role: 'assistant',
      content: aiResponse.textContent,
      contentType: renderDecision.contentType,
      structuredContent: aiResponse.structuredContent,
      metadata: {
        intentCategory: intent.category,
        knowledgeSourceIds: knowledgeContext.map(k => k.id),
        tokensUsed: aiResponse.tokensUsed,
        responseTimeMs,
        sectionContext: request.sectionContext,
      },
    });

    // Generate follow-up suggestions
    const suggestedFollowUps = await this.generateFollowUps(
      request.message,
      aiResponse.textContent,
      intent
    );

    return {
      message: assistantMessage,
      sessionId,
      suggestedFollowUps,
      detectedIntent: {
        category: intent.category,
        confidence: intent.confidence,
      },
    };
  }

  /**
   * Stream a response for real-time display
   */
  async *streamResponse(request: SendMessageRequest): AsyncGenerator<string, void, unknown> {
    const sessionId = request.sessionId || uuidv4();
    const history = await this.messageService.getHistory(sessionId, 10);
    const workspaceId = await this.getWorkspaceIdForWebsite(request.websiteId);
    const knowledgeContext = await this.retrieveKnowledge(request.message, workspaceId);

    const systemPrompt = this.buildSystemPrompt(knowledgeContext, request.personaHint);
    const messages: LLMMessage[] = [
      { role: 'system', content: systemPrompt },
      ...history.map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
      { role: 'user', content: request.message },
    ];

    for await (const chunk of streamComplete({ messages })) {
      yield chunk;
    }
  }

  /**
   * Retrieve relevant knowledge from embeddings
   */
  private async retrieveKnowledge(
    query: string,
    workspaceId: string
  ): Promise<KnowledgeContextItem[]> {
    try {
      // Generate embedding for the query
      const embeddingResult = await generateEmbedding(query);

      // Search for similar content (extract the embedding array from the result)
      const results = await similaritySearch(
        {
          workspaceId,
          query,
          limit: 5,
          threshold: 0.6,
        },
        embeddingResult.embedding
      );

      return results.map(r => ({
        id: r.id,
        content: r.content,
        entityType: r.entityType || 'general',
        similarity: r.similarity,
      }));
    } catch (error) {
      console.error('Knowledge retrieval failed:', error);
      return [];
    }
  }

  /**
   * Classify user intent
   */
  private async classifyIntent(
    message: string,
    knowledgeContext: KnowledgeContextItem[]
  ): Promise<ClassifiedIntent> {
    const systemPrompt = `You are an intent classifier for a business website chatbot.
Classify the user's message into one of these categories:
- product-info: Questions about what the product does, features, capabilities
- pricing: Questions about cost, plans, pricing tiers
- comparison: Comparing with alternatives or competitors
- how-it-works: Technical questions, implementation, process
- use-case: Industry-specific applications, examples
- integration: Questions about connecting with other tools
- support: Help with issues, troubleshooting
- demo-request: Wants to see a demo or trial
- contact: Wants to speak to a human
- general: Other/unclear

Also suggest the best content type for the response:
- text: Simple text response
- card-grid: Multiple related items/features
- comparison-table: Side-by-side comparison
- stats-display: Numbers and metrics
- cta-block: Call to action
- faq-accordion: Multiple Q&A items
- timeline: Sequential steps/process

Respond in JSON format:
{
  "category": "category-name",
  "confidence": 0.0-1.0,
  "suggestedContentType": "content-type",
  "entities": { "key": "extracted entity" }
}`;

    try {
      const { data } = await completeJSON<{
        category: IntentCategory;
        confidence: number;
        suggestedContentType: ChatContentType;
        entities: Record<string, string>;
      }>({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message },
        ],
        config: { maxTokens: 500 },
      });

      return data;
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
   * Decide how to render the response
   */
  private decideRender(
    intent: ClassifiedIntent,
    sectionContext?: string
  ): RenderDecision {
    // Map intent to render mode
    const modeMap: Record<IntentCategory, {
      mode: RenderDecision['mode'];
      animation: RenderDecision['animation'];
    }> = {
      'product-info': { mode: 'inline', animation: 'fade' },
      'pricing': { mode: 'inline-expansion', animation: 'slide-up' },
      'comparison': { mode: 'inline-expansion', animation: 'slide-up' },
      'how-it-works': { mode: 'inline-expansion', animation: 'slide-up' },
      'use-case': { mode: 'inline', animation: 'fade' },
      'integration': { mode: 'inline', animation: 'fade' },
      'support': { mode: 'inline', animation: 'fade' },
      'demo-request': { mode: 'modal', animation: 'scale' },
      'contact': { mode: 'modal', animation: 'scale' },
      'testimonials': { mode: 'inline-expansion', animation: 'slide-up' },
      'faq': { mode: 'inline-expansion', animation: 'slide-up' },
      'general': { mode: 'inline', animation: 'fade' },
    };

    const { mode, animation } = modeMap[intent.category] || modeMap.general;

    return {
      mode,
      contentType: intent.suggestedContentType,
      animation,
      maxHeight: mode === 'inline' ? '400px' : undefined,
    };
  }

  /**
   * Generate AI response
   */
  private async generateResponse(params: {
    userMessage: string;
    history: { role: string; content: string }[];
    knowledgeContext: KnowledgeContextItem[];
    intent: ClassifiedIntent;
    renderDecision: RenderDecision;
    personaHint?: string;
    adaptationHints?: string;
  }): Promise<{
    textContent: string;
    structuredContent?: ChatStructuredContent;
    tokensUsed: number;
  }> {
    const systemPrompt = this.buildSystemPrompt(
      params.knowledgeContext,
      params.personaHint,
      params.intent,
      params.renderDecision,
      params.adaptationHints
    );

    const messages: LLMMessage[] = [
      { role: 'system', content: systemPrompt },
      ...params.history.map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
      { role: 'user', content: params.userMessage },
    ];

    // For structured content types, use JSON mode
    if (params.renderDecision.contentType !== 'text') {
      try {
        const { data, tokensUsed } = await completeJSON<{
          textSummary: string;
          structured: ChatStructuredContent;
        }>({
          messages,
          config: { maxTokens: 2000 },
        });

        return {
          textContent: data.textSummary,
          structuredContent: data.structured,
          tokensUsed,
        };
      } catch (error) {
        // Fall back to text response
        console.error('Structured response failed, falling back to text:', error);
      }
    }

    // Text response
    const result = await complete({ messages });
    return {
      textContent: result.content,
      tokensUsed: result.tokensUsed,
    };
  }

  /**
   * Build system prompt for AI
   */
  private buildSystemPrompt(
    knowledgeContext: KnowledgeContextItem[],
    personaHint?: string,
    intent?: ClassifiedIntent,
    renderDecision?: RenderDecision,
    adaptationHints?: string
  ): string {
    let prompt = `You are a helpful AI assistant for a business website. Your role is to help visitors learn about the company, its products, and services.

GUIDELINES:
- Be helpful, professional, and concise
- Answer based on the knowledge context provided
- If you don't know something, say so honestly
- Avoid making up information not in the context
- Be conversational but professional`;

    if (personaHint) {
      prompt += `\n\nUSER CONTEXT: The user appears to be a ${personaHint}. Adjust your tone and examples accordingly.`;
    }

    // Add detailed adaptation hints if available
    if (adaptationHints) {
      prompt += `\n\nADAPTATION CONTEXT: ${adaptationHints}
Use this context to personalize your response. If they've recently viewed specific sections, reference that content. If their persona is known with high confidence, tailor your language and examples to match their needs.`;
    }

    if (knowledgeContext.length > 0) {
      prompt += `\n\nKNOWLEDGE CONTEXT (use this to answer questions):\n`;
      knowledgeContext.forEach((item, i) => {
        prompt += `\n[${i + 1}] (${item.entityType}, relevance: ${(item.similarity * 100).toFixed(0)}%)\n${item.content}\n`;
      });
    }

    if (intent && renderDecision && renderDecision.contentType !== 'text') {
      prompt += `\n\nRESPONSE FORMAT:
You must respond in JSON format with:
{
  "textSummary": "A brief text summary of your response",
  "structured": {
    "type": "${renderDecision.contentType}",
    ... (appropriate fields for this content type)
  }
}

Content type schemas:
- card-grid: { type: "card-grid", title?: string, cards: [{ id, icon?, title, description, link? }] }
- comparison-table: { type: "comparison-table", title?: string, headers: string[], rows: [{ label, values: [] }] }
- stats-display: { type: "stats-display", stats: [{ value, label, description? }] }
- cta-block: { type: "cta-block", title, description, primaryButton: { text, action, target? }, secondaryButton? }
- faq-accordion: { type: "faq-accordion", title?: string, items: [{ question, answer }] }
- timeline: { type: "timeline", title?: string, items: [{ title, description, date?, status? }] }`;
    }

    return prompt;
  }

  /**
   * Generate follow-up question suggestions
   */
  private async generateFollowUps(
    userMessage: string,
    response: string,
    intent: ClassifiedIntent
  ): Promise<string[]> {
    try {
      const { data } = await completeJSON<{ followUps: string[] }>({
        messages: [
          {
            role: 'system',
            content: `Based on the conversation, suggest 2-3 relevant follow-up questions the user might want to ask. Keep them short and specific.
Respond in JSON: { "followUps": ["question1", "question2", "question3"] }`,
          },
          {
            role: 'user',
            content: `User asked: "${userMessage}"
Assistant responded about: ${intent.category}
Generate follow-up suggestions.`,
          },
        ],
        config: { maxTokens: 300 },
      });

      return data.followUps?.slice(0, 3) || [];
    } catch (error) {
      console.error('Follow-up generation failed:', error);
      return [];
    }
  }

  /**
   * Get workspace ID for a website (supports both UUID and slug)
   * Uses SECURITY DEFINER functions to bypass RLS for public chat access
   */
  private async getWorkspaceIdForWebsite(websiteIdOrSubdomain: string): Promise<string> {
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();

    // Check if it looks like a UUID (contains hyphens and is 36 chars)
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(websiteIdOrSubdomain);

    // Use SECURITY DEFINER functions to bypass RLS
    const functionName = isUUID ? 'get_workspace_id_for_website' : 'get_workspace_id_for_website_slug';
    const { data, error } = await supabase.rpc(functionName, isUUID
      ? { website_id_param: websiteIdOrSubdomain }
      : { slug_param: websiteIdOrSubdomain }
    );

    if (error || !data) {
      console.error('Website lookup failed:', { websiteIdOrSubdomain, isUUID, error });
      throw new Error(`Website not found: ${websiteIdOrSubdomain}`);
    }

    return data as string;
  }

  /**
   * Get chat history for a session
   */
  async getHistory(sessionId: string, limit?: number): Promise<ChatMessage[]> {
    return this.messageService.getHistory(sessionId, limit);
  }

  /**
   * Clear chat history for a session
   */
  async clearHistory(sessionId: string): Promise<void> {
    return this.messageService.clearHistory(sessionId);
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

let chatEngineInstance: ChatEngine | null = null;

export function getChatEngine(): ChatEngine {
  if (!chatEngineInstance) {
    chatEngineInstance = new ChatEngine();
  }
  return chatEngineInstance;
}
