/**
 * Conversation Context Manager
 *
 * Manages conversation state, tracks answers, extracts entities,
 * and determines when enough information has been gathered to generate.
 *
 * Epic: NextGenWeb Complete Product Reimplementation
 * Phase 1, Week 3-4
 */

import { createClient } from '@/lib/supabase/server';
import { completeJSON } from '@/lib/ai/client';
import type { DiscoveryQuestion } from './discovery-engine';

// ============================================================================
// Types
// ============================================================================

export interface ConversationContext {
  // Analysis from KB
  analysis?: any;

  // Questions queue
  questions?: string[]; // Question IDs
  answeredQuestions?: string[];

  // User answers
  answers: Record<string, {
    response: string;
    intent: string;
    entities: Record<string, any>;
    timestamp: string;
  }>;

  // Extracted preferences
  preferences: {
    brandColors?: string[];
    tone?: string;
    primaryCTA?: string;
    pages?: string[];
    features?: string[];
    audience?: string[];
  };

  // Readiness
  readyToGenerate: boolean;
  generationPlan?: string;
}

export interface EntityExtractionResult {
  intent: string;
  entities: Record<string, any>;
  confidence: number;
}

// ============================================================================
// Context Manager Class
// ============================================================================

export class ConversationContextManager {
  /**
   * Initialize new context
   */
  initializeContext(analysis: any, questionIds: string[]): ConversationContext {
    return {
      analysis,
      questions: questionIds,
      answeredQuestions: [],
      answers: {},
      preferences: {},
      readyToGenerate: false,
    };
  }

  /**
   * Update context with user response
   */
  async updateContext(
    context: ConversationContext,
    questionId: string,
    userMessage: string
  ): Promise<ConversationContext> {
    // Extract intent and entities
    const extraction = await this.extractFromResponse(userMessage, questionId, context);

    // Record answer
    context.answers[questionId] = {
      response: userMessage,
      intent: extraction.intent,
      entities: extraction.entities,
      timestamp: new Date().toISOString(),
    };

    // Mark question as answered
    context.answeredQuestions = [...(context.answeredQuestions || []), questionId];

    // Update preferences based on answer
    context.preferences = this.updatePreferences(context.preferences, questionId, extraction);

    // Check if ready to generate
    context.readyToGenerate = this.checkReadiness(context);

    return context;
  }

  /**
   * Extract intent and entities from user response
   */
  private async extractFromResponse(
    message: string,
    questionId: string,
    context: ConversationContext
  ): Promise<EntityExtractionResult> {
    const prompt = `Extract the user's intent and entities from this answer.

Question ID: ${questionId}
User's answer: "${message}"

Return JSON with:
- intent: what the user wants (e.g., "use_brand_colors", "modern_design", "book_demo_cta")
- entities: any specific values mentioned (e.g., {"colors": ["blue", "white"], "style": "modern"})
- confidence: 0-1 score of how clear the answer is

Format: { "intent": "string", "entities": {}, "confidence": 0.0 }`;

    const result = await completeJSON<EntityExtractionResult>({
      messages: [
        { role: 'system', content: 'You are an entity extraction expert.' },
        { role: 'user', content: prompt }
      ],
      config: { temperature: 0.2, maxTokens: 300 },
      jsonMode: true
    });

    return result.data;
  }

  /**
   * Update preferences from extracted entities
   */
  private updatePreferences(
    preferences: ConversationContext['preferences'],
    questionId: string,
    extraction: EntityExtractionResult
  ): ConversationContext['preferences'] {
    const updated = { ...preferences };

    // Map question IDs to preference keys
    switch (questionId) {
      case 'branding-colors':
        if (extraction.entities.colors) {
          updated.brandColors = extraction.entities.colors;
        }
        break;
      case 'tone-style':
        if (extraction.intent) {
          updated.tone = extraction.intent;
        }
        break;
      case 'primary-cta':
        if (extraction.entities.action || extraction.intent) {
          updated.primaryCTA = extraction.entities.action || extraction.intent;
        }
        break;
      case 'navigation-structure':
        if (extraction.entities.pages) {
          updated.pages = extraction.entities.pages;
        }
        break;
      case 'feature-ai-assistant':
        if (extraction.intent.includes('yes') || extraction.intent.includes('include')) {
          updated.features = [...(updated.features || []), 'ai-assistant'];
        }
        break;
    }

    return updated;
  }

  /**
   * Check if we have enough information to generate
   */
  private checkReadiness(context: ConversationContext): boolean {
    const answeredCount = context.answeredQuestions?.length || 0;
    const totalQuestions = context.questions?.length || 0;

    // Ready if answered at least 70% of questions
    const threshold = Math.ceil(totalQuestions * 0.7);
    return answeredCount >= threshold;
  }

  /**
   * Build generation plan from context
   */
  async buildGenerationPlan(context: ConversationContext): Promise<string> {
    const { preferences, analysis } = context;
    const planParts: string[] = [];

    // Pages
    const pages = preferences.pages || analysis?.contentSuggestions?.pages || ['Home', 'About', 'Contact'];
    planParts.push(`📄 ${pages.length}-page website: ${pages.join(', ')}`);

    // Branding
    if (preferences.brandColors && preferences.brandColors.length > 0) {
      planParts.push(`🎨 Brand colors: ${preferences.brandColors.join(', ')}`);
    } else {
      planParts.push(`🎨 Professional blue theme`);
    }

    // Tone
    if (preferences.tone) {
      planParts.push(`✍️ ${preferences.tone} tone`);
    }

    // CTA
    if (preferences.primaryCTA) {
      planParts.push(`🎯 Primary CTA: "${preferences.primaryCTA}"`);
    }

    // Features
    if (preferences.features && preferences.features.includes('ai-assistant')) {
      planParts.push(`🤖 AI assistant included`);
    }

    // Audience
    if (preferences.audience && preferences.audience.length > 0) {
      planParts.push(`👥 Target audience: ${preferences.audience.join(', ')}`);
    }

    return planParts.join('\n');
  }

  /**
   * Get conversation history
   */
  async getHistory(sessionId: string): Promise<Array<{ role: string; content: string }>> {
    const supabase = await createClient();

    const { data: messages } = await supabase
      .from('conversation_messages')
      .select('role, content')
      .eq('session_id', sessionId)
      .order('sequence_number', { ascending: true });

    return messages || [];
  }

  /**
   * Save context to session
   */
  async saveContext(sessionId: string, context: ConversationContext): Promise<void> {
    const supabase = await createClient();

    await supabase
      .from('conversation_sessions')
      .update({
        context: context as any,
        updated_at: new Date().toISOString(),
      } as any)
      .eq('id', sessionId);
  }

  /**
   * Load context from session
   */
  async loadContext(sessionId: string): Promise<ConversationContext | null> {
    const supabase = await createClient();

    const { data: session } = await supabase
      .from('conversation_sessions')
      .select('context')
      .eq('id', sessionId)
      .single();

    return (session?.context as any) as ConversationContext || null;
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

export const contextManager = new ConversationContextManager();
