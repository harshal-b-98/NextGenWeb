/**
 * Smart CTA Generator Service
 * Phase 6.3: Rendering & UX (Wave 2)
 *
 * Generates intelligent CTAs based on knowledge depth, user journey,
 * and persona context. Ensures suggested follow-ups lead to content
 * that actually exists in the knowledge base.
 *
 * Features:
 * - Knowledge-grounded CTA suggestions
 * - Journey-aware recommendations
 * - Persona-aware prioritization
 * - Fallback handling for low-coverage topics
 * - Funnel progression logic
 */

import { completeJSON } from '@/lib/ai/client';
import {
  getKnowledgeDepthAnalyzer,
  type TopicCoverage,
  type KnowledgeDepthAnalysis,
  DEPTH_THRESHOLDS,
} from './knowledge-depth-analyzer';
import type { IntentCategory } from './types';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Generated CTA with metadata
 */
export interface SmartCTA {
  /** Unique identifier */
  id: string;
  /** Display text for the CTA */
  text: string;
  /** Topic this CTA addresses */
  topic: string;
  /** Intent category */
  intent: IntentCategory;
  /** Priority for display ordering */
  priority: 'high' | 'medium' | 'low';
  /** Confidence that we have content to answer */
  confidenceScore: number;
  /** Optional prompt override for generation */
  promptOverride?: string;
  /** Visual variant suggestion */
  variant?: 'primary' | 'secondary' | 'tertiary';
  /** Icon suggestion */
  icon?: string;
  /** Whether this leads to high-intent action */
  isHighIntent: boolean;
  /** Funnel stage this targets */
  funnelStage: FunnelStage;
}

/**
 * Funnel stages for CTA progression
 */
export type FunnelStage =
  | 'awareness'     // Learning about the problem/solution
  | 'consideration' // Evaluating options
  | 'decision'      // Ready to act
  | 'action';       // Taking action (demo, contact, signup)

/**
 * User journey context for CTA generation
 */
export interface JourneyContext {
  /** Topics already explored */
  exploredTopics: string[];
  /** Intents already addressed */
  addressedIntents: IntentCategory[];
  /** Number of sections generated */
  sectionCount: number;
  /** Current estimated funnel stage */
  currentStage: FunnelStage;
  /** Detected persona hint */
  personaHint?: string;
  /** Session duration in seconds */
  sessionDuration?: number;
}

/**
 * CTA generation request
 */
export interface CTAGenerationRequest {
  /** Workspace ID */
  workspaceId: string;
  /** Number of CTAs to generate */
  count?: number;
  /** Journey context */
  journeyContext?: JourneyContext;
  /** Topics to exclude (already shown) */
  excludeTopics?: string[];
  /** Preferred intent categories */
  preferredIntents?: IntentCategory[];
  /** Force include high-intent CTAs */
  includeHighIntent?: boolean;
}

/**
 * CTA generation result
 */
export interface CTAGenerationResult {
  /** Generated CTAs */
  ctas: SmartCTA[];
  /** Knowledge analysis used */
  knowledgeAnalysis: KnowledgeDepthAnalysis;
  /** Tokens used */
  tokensUsed: number;
}

// ============================================================================
// CONSTANTS
// ============================================================================

/** CTA text templates by topic */
const CTA_TEMPLATES: Record<string, { texts: string[]; icon: string }> = {
  'product-features': {
    texts: ['See All Features', 'Explore Capabilities', 'What Can It Do?'],
    icon: 'sparkles',
  },
  'pricing': {
    texts: ['View Pricing', 'See Plans', 'Compare Plans'],
    icon: 'credit-card',
  },
  'how-it-works': {
    texts: ['How It Works', 'See the Process', 'Learn How'],
    icon: 'play-circle',
  },
  'use-cases': {
    texts: ['Use Cases', 'See Examples', 'Who Uses This?'],
    icon: 'briefcase',
  },
  'integrations': {
    texts: ['Integrations', 'Connect Your Tools', 'See Integrations'],
    icon: 'puzzle',
  },
  'comparisons': {
    texts: ['Compare Options', 'See Comparison', 'How We Compare'],
    icon: 'scale',
  },
  'testimonials': {
    texts: ['Customer Stories', 'See Reviews', 'Success Stories'],
    icon: 'star',
  },
  'support': {
    texts: ['Get Help', 'Support Options', 'FAQ'],
    icon: 'help-circle',
  },
  'company': {
    texts: ['About Us', 'Our Story', 'Meet the Team'],
    icon: 'users',
  },
  'security': {
    texts: ['Security Info', 'Trust & Security', 'Data Protection'],
    icon: 'shield',
  },
};

/** High-intent CTA options */
const HIGH_INTENT_CTAS: SmartCTA[] = [
  {
    id: 'high-intent-demo',
    text: 'Request a Demo',
    topic: 'demo-request',
    intent: 'demo-request',
    priority: 'high',
    confidenceScore: 1,
    variant: 'primary',
    icon: 'calendar',
    isHighIntent: true,
    funnelStage: 'action',
  },
  {
    id: 'high-intent-contact',
    text: 'Talk to Sales',
    topic: 'contact',
    intent: 'contact',
    priority: 'high',
    confidenceScore: 1,
    variant: 'primary',
    icon: 'phone',
    isHighIntent: true,
    funnelStage: 'action',
  },
  {
    id: 'high-intent-trial',
    text: 'Start Free Trial',
    topic: 'signup',
    intent: 'demo-request',
    priority: 'high',
    confidenceScore: 1,
    variant: 'primary',
    icon: 'rocket',
    isHighIntent: true,
    funnelStage: 'action',
  },
];

/** Funnel stage progression */
const FUNNEL_PROGRESSION: Record<FunnelStage, FunnelStage[]> = {
  'awareness': ['awareness', 'consideration'],
  'consideration': ['consideration', 'decision'],
  'decision': ['decision', 'action'],
  'action': ['action'],
};

// ============================================================================
// SMART CTA GENERATOR SERVICE
// ============================================================================

export class SmartCTAGenerator {
  private depthAnalyzer = getKnowledgeDepthAnalyzer();

  /**
   * Generate smart CTAs based on knowledge and journey context
   */
  async generateCTAs(request: CTAGenerationRequest): Promise<CTAGenerationResult> {
    const count = request.count || 4;
    const journeyContext = request.journeyContext || this.getDefaultJourneyContext();
    let tokensUsed = 0;

    // Get knowledge analysis
    const analysis = await this.depthAnalyzer.analyzeWorkspaceKnowledge(request.workspaceId);

    // Filter to topics with good coverage
    const availableTopics = analysis.topics.filter(
      (t) =>
        t.hasRichContent &&
        !request.excludeTopics?.includes(t.topic) &&
        !journeyContext.exploredTopics.includes(t.topic)
    );

    // Score and rank topics
    const scoredTopics = this.scoreTopics(availableTopics, journeyContext, request.preferredIntents);

    // Generate CTAs from top topics
    const ctas: SmartCTA[] = [];

    // Add knowledge-grounded CTAs
    const topTopics = scoredTopics.slice(0, count - (request.includeHighIntent ? 1 : 0));
    for (const scoredTopic of topTopics) {
      const cta = this.createCTAFromTopic(scoredTopic.topic, scoredTopic.score, journeyContext);
      ctas.push(cta);
    }

    // Add high-intent CTA if appropriate
    if (request.includeHighIntent || this.shouldIncludeHighIntent(journeyContext)) {
      const highIntentCTA = this.selectHighIntentCTA(journeyContext);
      if (highIntentCTA) {
        ctas.push(highIntentCTA);
      }
    }

    // If not enough CTAs, generate AI suggestions
    if (ctas.length < count && availableTopics.length > 0) {
      const { additionalCTAs, tokens } = await this.generateAICTAs(
        analysis,
        journeyContext,
        count - ctas.length,
        ctas.map((c) => c.topic)
      );
      ctas.push(...additionalCTAs);
      tokensUsed += tokens;
    }

    // Sort by priority and assign variants
    const sortedCTAs = this.sortAndAssignVariants(ctas.slice(0, count));

    return {
      ctas: sortedCTAs,
      knowledgeAnalysis: analysis,
      tokensUsed,
    };
  }

  /**
   * Generate follow-up CTAs after a section is displayed
   */
  async generateFollowUpCTAs(
    workspaceId: string,
    currentTopic: string,
    currentIntent: IntentCategory,
    journeyContext: JourneyContext
  ): Promise<SmartCTA[]> {
    // Update journey context
    const updatedContext: JourneyContext = {
      ...journeyContext,
      exploredTopics: [...journeyContext.exploredTopics, currentTopic],
      addressedIntents: [...journeyContext.addressedIntents, currentIntent],
      sectionCount: journeyContext.sectionCount + 1,
      currentStage: this.progressFunnelStage(journeyContext.currentStage, currentIntent),
    };

    // Get recommendations excluding current topic
    const result = await this.generateCTAs({
      workspaceId,
      count: 3,
      journeyContext: updatedContext,
      excludeTopics: [currentTopic],
      includeHighIntent: updatedContext.sectionCount >= 2,
    });

    return result.ctas;
  }

  /**
   * Get initial hero CTAs for a website
   */
  async getHeroCTAs(workspaceId: string, count: number = 4): Promise<SmartCTA[]> {
    const result = await this.generateCTAs({
      workspaceId,
      count,
      journeyContext: this.getDefaultJourneyContext(),
      includeHighIntent: true,
      preferredIntents: ['product-info', 'pricing', 'how-it-works'],
    });
    return result.ctas;
  }

  /**
   * Score topics based on relevance to current journey
   */
  private scoreTopics(
    topics: TopicCoverage[],
    journeyContext: JourneyContext,
    preferredIntents?: IntentCategory[]
  ): Array<{ topic: TopicCoverage; score: number }> {
    return topics
      .map((topic) => {
        let score = topic.depthScore;

        // Boost for preferred intents
        if (preferredIntents?.some((intent) => topic.intents.includes(intent))) {
          score += 0.2;
        }

        // Boost for appropriate funnel stage
        const appropriateStages = FUNNEL_PROGRESSION[journeyContext.currentStage];
        const topicStage = this.getTopicFunnelStage(topic.topic);
        if (appropriateStages.includes(topicStage)) {
          score += 0.15;
        }

        // Slight penalty for similar to already explored
        const similarExplored = journeyContext.exploredTopics.filter((t) =>
          topic.subTopics.includes(t) || t.includes(topic.topic)
        );
        score -= similarExplored.length * 0.1;

        return { topic, score: Math.max(0, Math.min(1, score)) };
      })
      .sort((a, b) => b.score - a.score);
  }

  /**
   * Create a CTA from a topic coverage
   */
  private createCTAFromTopic(
    topic: TopicCoverage,
    score: number,
    journeyContext: JourneyContext
  ): SmartCTA {
    const templates = CTA_TEMPLATES[topic.topic] || {
      texts: [`Learn about ${topic.label}`],
      icon: 'info',
    };

    // Select text based on variety
    const textIndex = journeyContext.sectionCount % templates.texts.length;

    return {
      id: `cta-${topic.topic}-${Date.now()}`,
      text: templates.texts[textIndex],
      topic: topic.topic,
      intent: topic.intents[0] || 'general',
      priority: score >= 0.7 ? 'high' : score >= 0.4 ? 'medium' : 'low',
      confidenceScore: topic.depthScore,
      icon: templates.icon,
      isHighIntent: false,
      funnelStage: this.getTopicFunnelStage(topic.topic),
    };
  }

  /**
   * Determine funnel stage for a topic
   */
  private getTopicFunnelStage(topic: string): FunnelStage {
    const stageMap: Record<string, FunnelStage> = {
      'product-features': 'awareness',
      'how-it-works': 'awareness',
      'use-cases': 'consideration',
      'comparisons': 'consideration',
      'testimonials': 'consideration',
      'pricing': 'decision',
      'integrations': 'decision',
      'security': 'decision',
      'support': 'consideration',
      'company': 'awareness',
    };
    return stageMap[topic] || 'awareness';
  }

  /**
   * Progress funnel stage based on intent addressed
   */
  private progressFunnelStage(current: FunnelStage, intent: IntentCategory): FunnelStage {
    const progressionTriggers: Record<IntentCategory, FunnelStage> = {
      'product-info': 'consideration',
      'pricing': 'decision',
      'comparison': 'decision',
      'how-it-works': 'consideration',
      'use-case': 'consideration',
      'integration': 'decision',
      'support': 'consideration',
      'demo-request': 'action',
      'contact': 'action',
      'general': current,
    };

    const triggered = progressionTriggers[intent];
    const stages: FunnelStage[] = ['awareness', 'consideration', 'decision', 'action'];
    const currentIndex = stages.indexOf(current);
    const triggeredIndex = stages.indexOf(triggered);

    return triggeredIndex > currentIndex ? triggered : current;
  }

  /**
   * Determine if high-intent CTA should be included
   */
  private shouldIncludeHighIntent(journeyContext: JourneyContext): boolean {
    // Include high-intent CTA after 2+ sections or decision stage
    return (
      journeyContext.sectionCount >= 2 ||
      journeyContext.currentStage === 'decision' ||
      journeyContext.currentStage === 'action'
    );
  }

  /**
   * Select appropriate high-intent CTA
   */
  private selectHighIntentCTA(journeyContext: JourneyContext): SmartCTA | null {
    // Prefer demo for technical personas
    if (journeyContext.personaHint?.toLowerCase().includes('technical')) {
      return HIGH_INTENT_CTAS.find((c) => c.topic === 'demo-request') || HIGH_INTENT_CTAS[0];
    }

    // Prefer trial for individual users
    if (journeyContext.personaHint?.toLowerCase().includes('individual')) {
      return HIGH_INTENT_CTAS.find((c) => c.topic === 'signup') || HIGH_INTENT_CTAS[2];
    }

    // Default to demo request
    return HIGH_INTENT_CTAS[0];
  }

  /**
   * Generate additional CTAs using AI
   */
  private async generateAICTAs(
    analysis: KnowledgeDepthAnalysis,
    journeyContext: JourneyContext,
    count: number,
    excludeTopics: string[]
  ): Promise<{ additionalCTAs: SmartCTA[]; tokens: number }> {
    try {
      const strongTopics = analysis.topics
        .filter((t) => t.hasRichContent && !excludeTopics.includes(t.topic))
        .map((t) => `${t.label} (${t.subTopics.slice(0, 3).join(', ')})`)
        .join('\n');

      const { data, tokensUsed } = await completeJSON<{
        ctas: Array<{ text: string; topic: string; intent: string }>;
      }>({
        messages: [
          {
            role: 'system',
            content: `Generate ${count} compelling CTA button texts based on available topics.
Each CTA should be action-oriented and conversational.

Available topics with sub-topics:
${strongTopics}

Already explored: ${journeyContext.exploredTopics.join(', ') || 'none'}
Current funnel stage: ${journeyContext.currentStage}

Respond in JSON:
{
  "ctas": [
    { "text": "Button text", "topic": "topic-key", "intent": "intent-category" }
  ]
}`,
          },
        ],
        config: { maxTokens: 300 },
      });

      const additionalCTAs: SmartCTA[] = (data.ctas || []).map((cta, index) => ({
        id: `ai-cta-${Date.now()}-${index}`,
        text: cta.text,
        topic: cta.topic,
        intent: (cta.intent as IntentCategory) || 'general',
        priority: 'medium' as const,
        confidenceScore: 0.6,
        isHighIntent: false,
        funnelStage: this.getTopicFunnelStage(cta.topic),
      }));

      return { additionalCTAs, tokens: tokensUsed };
    } catch (error) {
      console.error('AI CTA generation failed:', error);
      return { additionalCTAs: [], tokens: 0 };
    }
  }

  /**
   * Sort CTAs and assign visual variants
   */
  private sortAndAssignVariants(ctas: SmartCTA[]): SmartCTA[] {
    // Sort: high-intent first, then by priority and confidence
    const sorted = [...ctas].sort((a, b) => {
      if (a.isHighIntent !== b.isHighIntent) return a.isHighIntent ? -1 : 1;
      if (a.priority !== b.priority) {
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }
      return b.confidenceScore - a.confidenceScore;
    });

    // Assign variants based on position
    return sorted.map((cta, index) => ({
      ...cta,
      variant: index === 0 ? 'primary' : index === 1 ? 'secondary' : 'tertiary',
    }));
  }

  /**
   * Get default journey context for new visitors
   */
  private getDefaultJourneyContext(): JourneyContext {
    return {
      exploredTopics: [],
      addressedIntents: [],
      sectionCount: 0,
      currentStage: 'awareness',
    };
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

let generatorInstance: SmartCTAGenerator | null = null;

export function getSmartCTAGenerator(): SmartCTAGenerator {
  if (!generatorInstance) {
    generatorInstance = new SmartCTAGenerator();
  }
  return generatorInstance;
}

// ============================================================================
// CONVENIENCE EXPORTS
// ============================================================================

export { HIGH_INTENT_CTAS, CTA_TEMPLATES };
