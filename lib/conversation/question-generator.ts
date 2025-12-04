/**
 * Question Generator
 *
 * Generates adaptive, context-aware questions for discovery conversations.
 * Uses AI to create relevant questions based on knowledge base analysis.
 *
 * Epic: NextGenWeb Complete Product Reimplementation
 * Phase 1, Week 3-4
 */

import { completeJSON } from '@/lib/ai/client';
import type { KnowledgeBaseAnalysis, DiscoveryQuestion } from './discovery-engine';

// ============================================================================
// Question Templates
// ============================================================================

const QUESTION_TEMPLATES = {
  branding: {
    colors: {
      id: 'branding-colors',
      question: 'Do you have brand guidelines? Preferred colors, fonts, or visual style? Or should I infer from your materials?',
      category: 'branding' as const,
      priority: 1,
      suggestedAnswers: [
        'Use colors from my logo',
        'Modern and minimal',
        'Professional and trustworthy',
        'Bold and vibrant',
        'Just pick something that works',
      ],
      skipIfFoundInDocs: true,
    },
    logo: {
      id: 'branding-logo',
      question: 'Do you have a logo you\'d like to use? You can upload it now or I can generate a simple one.',
      category: 'branding' as const,
      priority: 2,
      suggestedAnswers: [
        'I\'ll upload my logo',
        'Generate a simple one',
        'Skip for now',
      ],
      skipIfFoundInDocs: false,
    },
  },
  tone: {
    style: {
      id: 'tone-style',
      question: 'What tone should your website have?',
      category: 'tone' as const,
      priority: 3,
      suggestedAnswers: [
        'Professional and authoritative',
        'Friendly and approachable',
        'Technical and detailed',
        'Casual and conversational',
        'Bold and energetic',
      ],
      skipIfFoundInDocs: false,
    },
  },
  audience: {
    personas: {
      id: 'audience-personas',
      question: 'Who is your primary audience?',
      category: 'audience' as const,
      priority: 4,
      suggestedAnswers: [
        'B2B decision makers',
        'Small business owners',
        'Consumers/individuals',
        'Technical professionals',
        'Multiple audiences',
      ],
      skipIfFoundInDocs: false,
    },
    behavior: {
      id: 'persona-behavior',
      question: 'Should the website adapt automatically to different visitor types, or show the same content to everyone?',
      category: 'audience' as const,
      priority: 7,
      suggestedAnswers: [
        'Automatic detection and adaptation',
        'Let visitors choose their path',
        'Show same content to everyone',
      ],
      skipIfFoundInDocs: false,
    },
  },
  navigation: {
    structure: {
      id: 'navigation-structure',
      question: 'Which pages should your website include?',
      category: 'navigation' as const,
      priority: 5,
      suggestedAnswers: [
        'Use suggested pages',
        'Add Blog/Resources',
        'Add Case Studies',
        'Add Integrations/Partners',
        'Keep it minimal (3-4 pages)',
      ],
      skipIfFoundInDocs: false,
    },
  },
  cta: {
    primary: {
      id: 'primary-cta',
      question: 'What\'s the primary action you want visitors to take?',
      category: 'cta' as const,
      priority: 6,
      suggestedAnswers: [
        'Book a demo',
        'Start free trial',
        'Contact sales',
        'Download resource',
        'Sign up / Register',
        'Request quote',
      ],
      skipIfFoundInDocs: false,
    },
  },
  features: {
    aiAssistant: {
      id: 'feature-ai-assistant',
      question: 'Should your website include an AI assistant that can answer visitor questions from your knowledge base?',
      category: 'features' as const,
      priority: 8,
      suggestedAnswers: [
        'Yes, include AI chat',
        'No, keep it simple',
        'Maybe later',
      ],
      skipIfFoundInDocs: false,
    },
  },
};

// ============================================================================
// Question Generator Class
// ============================================================================

export class QuestionGenerator {
  /**
   * Generate adaptive questions based on KB analysis
   */
  async generateQuestions(analysis: KnowledgeBaseAnalysis): Promise<DiscoveryQuestion[]> {
    const questions: DiscoveryQuestion[] = [];
    const gaps = analysis.gaps || [];

    // Always ask about branding if not clear
    if (gaps.includes('branding') || gaps.includes('colors') || !this.hasBrandInfo(analysis)) {
      questions.push(QUESTION_TEMPLATES.branding.colors);
    }

    // Always ask about tone
    const toneQuestion = { ...QUESTION_TEMPLATES.tone.style };
    if (analysis.tone) {
      toneQuestion.question = `Your content has a ${analysis.tone} tone. Should the website maintain this style, or shift toward something different?`;
    }
    questions.push(toneQuestion);

    // Ask about navigation - customize with analyzed pages
    const navQuestion = { ...QUESTION_TEMPLATES.navigation.structure };
    if (analysis.contentSuggestions.pages.length > 0) {
      const suggestedPages = analysis.contentSuggestions.pages.join(', ');
      navQuestion.question = `Based on your content, I can generate these pages: ${suggestedPages}. Would you add, remove, or rename any?`;
    }
    questions.push(navQuestion);

    // Ask about audience if multiple detected
    if (analysis.targetAudiences && analysis.targetAudiences.length > 1) {
      const audienceQuestion = { ...QUESTION_TEMPLATES.audience.behavior };
      audienceQuestion.question = `I identified ${analysis.targetAudiences.length} target audiences: ${analysis.targetAudiences.join(', ')}. Should visitors self-select their path, or should the site detect and adapt automatically?`;
      questions.push(audienceQuestion);
    }

    // Always ask about primary CTA
    questions.push(QUESTION_TEMPLATES.cta.primary);

    // Ask about AI assistant
    questions.push(QUESTION_TEMPLATES.features.aiAssistant);

    // Re-prioritize based on analysis
    return this.prioritizeQuestions(questions, analysis);
  }

  /**
   * Check if brand information exists in analysis
   */
  private hasBrandInfo(analysis: KnowledgeBaseAnalysis): boolean {
    // Check metadata for brand-related content
    return false; // For MVP, always ask
  }

  /**
   * Prioritize questions based on analysis
   */
  private prioritizeQuestions(
    questions: DiscoveryQuestion[],
    analysis: KnowledgeBaseAnalysis
  ): DiscoveryQuestion[] {
    // Re-sort by priority
    return questions.sort((a, b) => a.priority - b.priority);
  }

  /**
   * Generate follow-up question based on user's answer
   */
  async generateFollowUp(
    previousQuestion: DiscoveryQuestion,
    userAnswer: string,
    context: any
  ): Promise<DiscoveryQuestion | null> {
    // For MVP, no follow-ups
    // Can be enhanced to ask clarifying questions based on vague answers
    return null;
  }

  /**
   * Validate if user answer is sufficient
   */
  validateAnswer(question: DiscoveryQuestion, answer: string): {
    valid: boolean;
    reason?: string;
  } {
    // Basic validation
    if (!answer || answer.trim().length === 0) {
      return { valid: false, reason: 'Please provide an answer' };
    }

    if (answer.trim().length < 3) {
      return { valid: false, reason: 'Please provide more detail' };
    }

    return { valid: true };
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

export const questionGenerator = new QuestionGenerator();
