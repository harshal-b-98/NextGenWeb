/**
 * Conversational Discovery Engine
 *
 * The heart of NextGenWeb's simplified user experience.
 * Analyzes uploaded documents, generates AI understanding summary,
 * and asks targeted clarifying questions before website generation.
 *
 * Epic: NextGenWeb Complete Product Reimplementation
 * Phase 1, Week 3-4
 */

import { createClient } from '@/lib/supabase/server';
import { completeJSON } from '@/lib/ai/client';

// ============================================================================
// Types
// ============================================================================

export interface KnowledgeBaseAnalysis {
  businessType: string;
  offerings: string[];
  targetAudiences: string[];
  keyFeatures: string[];
  tone: 'technical' | 'conversational' | 'professional' | 'casual';
  contentSuggestions: {
    pages: string[];
    sections: string[];
  };
  gaps: string[]; // What's missing that we need to ask about
}

export interface DiscoveryQuestion {
  id: string;
  question: string;
  category: 'branding' | 'tone' | 'audience' | 'navigation' | 'cta' | 'features';
  priority: number; // 1-5, higher = more important
  suggestedAnswers?: string[];
  skipIfFoundInDocs: boolean;
}

export interface ConversationSession {
  id: string;
  workspace_id: string;
  type: 'discovery' | 'refinement';
  status: 'active' | 'completed' | 'abandoned';
  current_stage: string | null;
  context: Record<string, any>;
  generated_website_id?: string | null;
  created_by?: string | null;
  created_at: string;
  updated_at: string;
  completed_at?: string | null;
}

export interface DiscoveryResponse {
  message: string; // AI's next message
  question?: DiscoveryQuestion;
  readyToGenerate: boolean;
  context: Record<string, any>; // Updated conversation context
}

// ============================================================================
// Discovery Engine Class
// ============================================================================

export class DiscoveryEngine {
  /**
   * Start a new discovery conversation
   * Analyzes knowledge base and creates initial understanding summary
   */
  async startDiscovery(workspaceId: string): Promise<{
    session: ConversationSession;
    understandingSummary: string;
    firstQuestion: DiscoveryQuestion | null;
  }> {
    const supabase = await createClient();

    // Step 1: Analyze knowledge base
    const analysis = await this.analyzeKnowledgeBase(workspaceId);

    // Step 2: Generate understanding summary
    const summary = await this.generateUnderstandingSummary(analysis);

    // Step 3: Generate clarifying questions
    const questions = await this.generateClarifyingQuestions(analysis);

    // Step 4: Create conversation session
    const { data: session, error } = await supabase
      .from('conversation_sessions')
      .insert({
        workspace_id: workspaceId,
        type: 'discovery',
        status: 'active',
        current_stage: 'clarifying',
        context: {
          analysis,
          questions: questions.map((q) => q.id),
          answeredQuestions: [],
          answers: {},
        } as any,
      })
      .select()
      .single();

    if (error || !session) {
      throw new Error('Failed to create conversation session');
    }

    // Step 5: Save understanding summary as first message
    await supabase.from('conversation_messages').insert({
      session_id: session.id,
      role: 'assistant',
      content: summary,
      metadata: { type: 'understanding_summary', analysis } as any,
      sequence_number: 1,
    });

    // Step 6: Save first question if exists
    const firstQuestion = questions.find((q) => q.priority === 1) || questions[0] || null;

    if (firstQuestion) {
      await supabase.from('conversation_messages').insert({
        session_id: session.id,
        role: 'assistant',
        content: firstQuestion.question,
        metadata: { type: 'question', questionId: firstQuestion.id, category: firstQuestion.category } as any,
        sequence_number: 2,
      });
    }

    return {
      session: session as ConversationSession,
      understandingSummary: summary,
      firstQuestion,
    };
  }

  /**
   * Process user response and continue conversation
   */
  async processUserResponse(
    sessionId: string,
    userMessage: string
  ): Promise<DiscoveryResponse> {
    const supabase = await createClient();

    // Get current session
    const { data: session } = await supabase
      .from('conversation_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (!session) {
      throw new Error('Session not found');
    }

    const context = session.context as any;

    // Save user message
    const nextSeq = await this.getNextSequence(sessionId);
    await supabase.from('conversation_messages').insert({
      session_id: sessionId,
      role: 'user',
      content: userMessage,
      sequence_number: nextSeq,
    });

    // Extract intent and update context
    const { intent, entities } = await this.extractIntentAndEntities(userMessage, context);

    // Mark current question as answered
    const currentQuestionIndex = context.answeredQuestions?.length || 0;
    const currentQuestionId = context.questions?.[currentQuestionIndex];

    if (currentQuestionId) {
      context.answeredQuestions = [...(context.answeredQuestions || []), currentQuestionId];
      context.answers[currentQuestionId] = {
        response: userMessage,
        intent,
        entities,
      };
    }

    // Update session context
    await supabase
      .from('conversation_sessions')
      .update({ context, updated_at: new Date().toISOString() })
      .eq('id', sessionId);

    // Determine next step
    const allQuestions = context.questions || [];
    const answeredCount = context.answeredQuestions?.length || 0;
    const hasMoreQuestions = answeredCount < allQuestions.length;

    if (hasMoreQuestions) {
      // Ask next question
      const nextQuestionId = allQuestions[answeredCount];
      const nextQuestion = await this.getQuestionById(nextQuestionId, session.workspace_id);

      if (nextQuestion) {
        // Save next question
        await supabase.from('conversation_messages').insert({
          session_id: sessionId,
          role: 'assistant',
          content: nextQuestion.question,
          metadata: { type: 'question', questionId: nextQuestion.id } as any,
          sequence_number: nextSeq + 1,
        });

        return {
          message: nextQuestion.question,
          question: nextQuestion,
          readyToGenerate: false,
          context,
        };
      }
    }

    // All questions answered - ready to generate
    const generationPlan = await this.buildGenerationPlan(context);

    const confirmationMessage = `Perfect! Here's what I'll build:\n\n${generationPlan}\n\nReady to generate your website?`;

    await supabase.from('conversation_messages').insert({
      session_id: sessionId,
      role: 'assistant',
      content: confirmationMessage,
      metadata: { type: 'generation_plan', plan: generationPlan } as any,
      sequence_number: nextSeq + 1,
    });

    return {
      message: confirmationMessage,
      readyToGenerate: true,
      context,
    };
  }

  /**
   * Analyze knowledge base to understand business
   */
  private async analyzeKnowledgeBase(workspaceId: string): Promise<KnowledgeBaseAnalysis> {
    const supabase = await createClient();

    // Get all knowledge base items
    const { data: kbItems } = await supabase
      .from('knowledge_base_items')
      .select('entity_type, content, metadata')
      .eq('workspace_id', workspaceId)
      .limit(100);

    if (!kbItems || kbItems.length === 0) {
      throw new Error('No knowledge base found. Please upload documents first.');
    }

    // Get entities for deeper analysis
    const { data: entities } = await supabase
      .from('knowledge_entities')
      .select('entity_type, name, description, confidence, metadata')
      .eq('workspace_id', workspaceId)
      .gte('confidence', 0.6)
      .limit(200);

    // Use AI to analyze and extract business understanding
    const analysisPrompt = `Analyze this business knowledge base and provide a structured understanding.

Knowledge Base Items: ${JSON.stringify(kbItems?.slice(0, 20))}
Entities: ${JSON.stringify(entities?.slice(0, 50))}

Provide analysis in this JSON format:
{
  "businessType": "brief description of what this business does",
  "offerings": ["product/service 1", "product/service 2"],
  "targetAudiences": ["persona 1", "persona 2"],
  "keyFeatures": ["feature 1", "feature 2"],
  "tone": "technical|conversational|professional|casual",
  "contentSuggestions": {
    "pages": ["Home", "Products", "About"],
    "sections": ["Hero", "Features", "Pricing"]
  },
  "gaps": ["what information is missing that we need to ask about"]
}`;

    const result = await completeJSON<KnowledgeBaseAnalysis>({
      messages: [
        { role: 'system', content: 'You are a business analyst.' },
        { role: 'user', content: analysisPrompt }
      ],
      config: { temperature: 0.3, maxTokens: 1500 },
      jsonMode: true
    });

    return result.data;
  }

  /**
   * Generate understanding summary to show user
   */
  private async generateUnderstandingSummary(
    analysis: KnowledgeBaseAnalysis
  ): Promise<string> {
    const prompt = `Based on this business analysis, generate a friendly, conversational summary that demonstrates understanding.

Analysis: ${JSON.stringify(analysis)}

Write 3-4 sentences that show you understand:
- What their business does
- Who they serve
- What makes them unique

End with: "Does this align with your vision?"

Keep it conversational and warm, not robotic.`;

    const summary = await completeJSON<{ summary: string }>({
      messages: [
        { role: 'system', content: 'You are a friendly AI assistant.' },
        { role: 'user', content: prompt }
      ],
      config: { temperature: 0.7, maxTokens: 300 },
      jsonMode: true
    });

    return summary.data.summary;
  }

  /**
   * Generate targeted clarifying questions
   */
  private async generateClarifyingQuestions(
    analysis: KnowledgeBaseAnalysis
  ): Promise<DiscoveryQuestion[]> {
    const gaps = analysis.gaps || [];
    const questions: DiscoveryQuestion[] = [];

    // Priority 1: Branding (if not found in docs)
    if (gaps.includes('branding') || gaps.includes('colors')) {
      questions.push({
        id: 'branding-colors',
        question: 'Do you have brand guidelines? Preferred colors, fonts, or visual style? Or should I infer from your materials?',
        category: 'branding',
        priority: 1,
        suggestedAnswers: [
          'Use colors from my logo',
          'Modern and minimal',
          'Professional and trustworthy',
          'Just pick something that works',
        ],
        skipIfFoundInDocs: true,
      });
    }

    // Priority 2: Tone
    questions.push({
      id: 'tone-style',
      question: `Your content ${analysis.tone === 'technical' ? 'uses fairly technical language' : `has a ${analysis.tone} tone`}. Should the website maintain this style, or shift toward something different?`,
      category: 'tone',
      priority: 2,
      suggestedAnswers: [
        'Keep it technical',
        'Make it more accessible',
        'Professional but friendly',
        'Conversational and casual',
      ],
      skipIfFoundInDocs: false,
    });

    // Priority 3: Navigation
    const suggestedPages = analysis.contentSuggestions.pages.join(', ');
    questions.push({
      id: 'navigation-structure',
      question: `Based on your content, I can generate these pages: ${suggestedPages}. Would you add, remove, or rename any?`,
      category: 'navigation',
      priority: 3,
      suggestedAnswers: [
        'That works perfectly',
        'Add a Blog/Resources page',
        'Add a Case Studies page',
        'Remove some pages',
      ],
      skipIfFoundInDocs: false,
    });

    // Priority 4: Call to Action
    questions.push({
      id: 'primary-cta',
      question: "What's the primary action you want visitors to take?",
      category: 'cta',
      priority: 4,
      suggestedAnswers: [
        'Book a demo',
        'Start free trial',
        'Contact sales',
        'Download resource',
        'Sign up',
      ],
      skipIfFoundInDocs: false,
    });

    // Priority 5: Dynamic behavior
    if (analysis.targetAudiences.length > 1) {
      questions.push({
        id: 'persona-behavior',
        question: `I identified ${analysis.targetAudiences.length} target audiences: ${analysis.targetAudiences.join(', ')}. Should visitors self-select their path, or should the site detect and adapt automatically?`,
        category: 'audience',
        priority: 5,
        suggestedAnswers: [
          'Automatic detection and adaptation',
          'Let visitors choose',
          'Show the same content to everyone',
        ],
        skipIfFoundInDocs: false,
      });
    }

    return questions.sort((a, b) => a.priority - b.priority);
  }

  /**
   * Build generation plan from conversation context
   */
  private async buildGenerationPlan(context: any): Promise<string> {
    const answers = context.answers || {};
    const analysis = context.analysis as KnowledgeBaseAnalysis;

    const planParts: string[] = [];

    // Pages
    const pages = analysis.contentSuggestions.pages;
    planParts.push(`📄 ${pages.length}-page website: ${pages.join(', ')}`);

    // Branding
    const brandingAnswer = answers['branding-colors'];
    if (brandingAnswer) {
      planParts.push(`🎨 ${brandingAnswer.response}`);
    }

    // Tone
    const toneAnswer = answers['tone-style'];
    if (toneAnswer) {
      planParts.push(`✍️ ${toneAnswer.response}`);
    }

    // CTA
    const ctaAnswer = answers['primary-cta'];
    if (ctaAnswer) {
      planParts.push(`🎯 Primary CTA: "${ctaAnswer.response}"`);
    }

    // Dynamic behavior
    const personaAnswer = answers['persona-behavior'];
    if (personaAnswer) {
      planParts.push(`🧠 ${personaAnswer.response}`);
    }

    return planParts.join('\n');
  }

  /**
   * Extract intent and entities from user message
   */
  private async extractIntentAndEntities(
    message: string,
    context: any
  ): Promise<{ intent: string; entities: Record<string, any> }> {
    // Simple extraction for MVP - can be enhanced with better NLP
    const prompt = `Extract the user's intent and any entities from this message.

User message: "${message}"
Current context: ${JSON.stringify(context.answers || {})}

Return JSON: { "intent": "string", "entities": { "key": "value" } }`;

    const result = await completeJSON<{ intent: string; entities: Record<string, any> }>({
      messages: [
        { role: 'system', content: 'You are an intent classification expert.' },
        { role: 'user', content: prompt }
      ],
      config: { temperature: 0.2, maxTokens: 200 },
      jsonMode: true
    });

    return result.data;
  }

  /**
   * Get question by ID from predefined list
   */
  private async getQuestionById(
    questionId: string,
    workspaceId: string
  ): Promise<DiscoveryQuestion | null> {
    // For MVP, regenerate questions
    // In production, cache questions in session context
    const analysis = await this.analyzeKnowledgeBase(workspaceId);
    const questions = await this.generateClarifyingQuestions(analysis);
    return questions.find((q) => q.id === questionId) || null;
  }

  /**
   * Get next message sequence number
   */
  private async getNextSequence(sessionId: string): Promise<number> {
    const supabase = await createClient();
    const { data } = await supabase
      .from('conversation_messages')
      .select('sequence_number')
      .eq('session_id', sessionId)
      .order('sequence_number', { ascending: false })
      .limit(1);

    return (data?.[0]?.sequence_number || 0) + 1;
  }

  /**
   * Trigger website generation from completed conversation
   */
  async triggerGeneration(sessionId: string): Promise<{ websiteId: string }> {
    const supabase = await createClient();

    const { data: session } = await supabase
      .from('conversation_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (!session) {
      throw new Error('Session not found');
    }

    const context = session.context as any;

    // Create website with conversation context
    const { data: website, error } = await supabase
      .from('websites_v2')
      .insert({
        workspace_id: session.workspace_id,
        name: context.answers?.['name'] || 'My Website',
        status: 'creating',
        creation_conversation_id: sessionId,
        brand_config: {
          primaryColor: '#3B82F6',
          tone: context.answers?.['tone-style']?.response || 'professional',
          industry: context.analysis?.businessType || 'general',
        },
      })
      .select()
      .single();

    if (error || !website) {
      throw new Error('Failed to create website');
    }

    // Update session
    await supabase
      .from('conversation_sessions')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        generated_website_id: website.id,
      })
      .eq('id', sessionId);

    return { websiteId: website.id };
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

export const discoveryEngine = new DiscoveryEngine();
