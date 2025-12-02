/**
 * Human Handoff Detection Service
 * Phase 6.3: Rendering & UX (Wave 2)
 *
 * Detects when a visitor should be handed off to a human (sales, support).
 * Analyzes engagement patterns, intent signals, and journey context to
 * determine optimal handoff timing.
 *
 * Features:
 * - Multi-signal detection (engagement, intent, frustration, value)
 * - Configurable thresholds per workspace
 * - Handoff type recommendation (sales, support, specialist)
 * - Urgency scoring
 * - Lead qualification signals
 */

import { completeJSON } from '@/lib/ai/client';
import type { FunnelStage, JourneyContext } from './smart-cta-generator';
import type { IntentCategory } from './types';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Handoff recommendation type
 */
export type HandoffType =
  | 'sales'           // High-value lead, ready to buy
  | 'support'         // Needs help, frustrated
  | 'specialist'      // Technical questions
  | 'onboarding'      // Ready to start
  | 'none';           // Continue self-service

/**
 * Urgency level for handoff
 */
export type HandoffUrgency = 'immediate' | 'high' | 'medium' | 'low' | 'none';

/**
 * Signal types that indicate handoff need
 */
export interface HandoffSignals {
  /** High engagement (multiple sections viewed) */
  highEngagement: boolean;
  /** Reached decision/action funnel stage */
  decisionStage: boolean;
  /** Asked pricing/purchase questions */
  pricingIntent: boolean;
  /** Showed frustration signals */
  frustration: boolean;
  /** Repeated similar questions */
  repetition: boolean;
  /** Explicitly requested human */
  explicitRequest: boolean;
  /** High-value persona detected */
  highValuePersona: boolean;
  /** Complex technical questions */
  technicalDepth: boolean;
  /** Time spent on site */
  significantTime: boolean;
  /** Multiple pricing/comparison views */
  comparisonBehavior: boolean;
}

/**
 * Handoff detection result
 */
export interface HandoffDetectionResult {
  /** Should handoff be suggested */
  shouldHandoff: boolean;
  /** Type of handoff recommended */
  handoffType: HandoffType;
  /** Urgency level */
  urgency: HandoffUrgency;
  /** Confidence score (0-1) */
  confidence: number;
  /** Active signals that triggered detection */
  activeSignals: (keyof HandoffSignals)[];
  /** Suggested CTA text for handoff */
  suggestedCTA: {
    text: string;
    subtext?: string;
    icon?: string;
  };
  /** Lead qualification score (0-100) */
  leadScore: number;
  /** Reason for recommendation */
  reason: string;
}

/**
 * Handoff detection context
 */
export interface HandoffContext {
  /** Journey context */
  journey: JourneyContext;
  /** Recent messages/queries */
  recentQueries?: string[];
  /** Response satisfaction (if tracked) */
  satisfactionSignals?: SatisfactionSignal[];
  /** Time on page in seconds */
  timeOnPage?: number;
  /** Number of page visits */
  pageViews?: number;
  /** Workspace-specific thresholds */
  thresholds?: Partial<HandoffThresholds>;
}

/**
 * User satisfaction signal
 */
export interface SatisfactionSignal {
  type: 'positive' | 'negative' | 'neutral';
  source: 'explicit' | 'inferred';
  timestamp: Date;
}

/**
 * Configurable thresholds for handoff detection
 */
export interface HandoffThresholds {
  /** Min sections for high engagement */
  minSectionsForEngagement: number;
  /** Min time in seconds for significant visit */
  minTimeForSignificance: number;
  /** Min queries for repetition detection */
  minQueriesForRepetition: number;
  /** Min confidence to trigger handoff */
  minConfidenceForHandoff: number;
  /** Lead score threshold for sales handoff */
  leadScoreForSales: number;
}

// ============================================================================
// CONSTANTS
// ============================================================================

/** Default thresholds */
const DEFAULT_THRESHOLDS: HandoffThresholds = {
  minSectionsForEngagement: 3,
  minTimeForSignificance: 120, // 2 minutes
  minQueriesForRepetition: 2,
  minConfidenceForHandoff: 0.6,
  leadScoreForSales: 60,
};

/** Intent categories that indicate sales readiness */
const SALES_READY_INTENTS: IntentCategory[] = [
  'pricing',
  'demo-request',
  'contact',
  'comparison',
];

/** Intent categories that indicate support need */
const SUPPORT_INTENTS: IntentCategory[] = [
  'support',
  'integration',
];

/** Signal weights for scoring */
const SIGNAL_WEIGHTS: Record<keyof HandoffSignals, number> = {
  highEngagement: 15,
  decisionStage: 20,
  pricingIntent: 25,
  frustration: 30,
  repetition: 20,
  explicitRequest: 50,
  highValuePersona: 15,
  technicalDepth: 10,
  significantTime: 10,
  comparisonBehavior: 15,
};

/** Frustration keywords */
const FRUSTRATION_KEYWORDS = [
  'not working',
  'doesn\'t work',
  'frustrated',
  'confused',
  'don\'t understand',
  'help me',
  'stuck',
  'error',
  'problem',
  'issue',
  'wrong',
  'broken',
];

/** Human request keywords */
const HUMAN_REQUEST_KEYWORDS = [
  'talk to human',
  'speak to someone',
  'real person',
  'contact support',
  'call me',
  'sales rep',
  'representative',
  'agent',
  'live chat',
];

/** High-value persona indicators */
const HIGH_VALUE_INDICATORS = [
  'enterprise',
  'team',
  'company',
  'business',
  'organization',
  'manager',
  'director',
  'executive',
  'decision maker',
];

// ============================================================================
// HANDOFF DETECTOR SERVICE
// ============================================================================

export class HandoffDetector {
  /**
   * Detect if handoff should be triggered
   */
  async detectHandoff(context: HandoffContext): Promise<HandoffDetectionResult> {
    const thresholds = { ...DEFAULT_THRESHOLDS, ...context.thresholds };

    // Analyze signals
    const signals = this.analyzeSignals(context, thresholds);

    // Calculate scores
    const { confidence, leadScore } = this.calculateScores(signals);

    // Determine if handoff should occur
    const shouldHandoff = confidence >= thresholds.minConfidenceForHandoff;

    // Determine handoff type
    const handoffType = shouldHandoff
      ? this.determineHandoffType(signals, leadScore, thresholds)
      : 'none';

    // Determine urgency
    const urgency = this.determineUrgency(signals, confidence);

    // Get active signals
    const activeSignals = Object.entries(signals)
      .filter(([, value]) => value)
      .map(([key]) => key as keyof HandoffSignals);

    // Generate suggested CTA
    const suggestedCTA = this.getSuggestedCTA(handoffType, urgency);

    // Generate reason
    const reason = this.generateReason(activeSignals, handoffType);

    return {
      shouldHandoff,
      handoffType,
      urgency,
      confidence,
      activeSignals,
      suggestedCTA,
      leadScore,
      reason,
    };
  }

  /**
   * Quick check for explicit handoff request
   */
  hasExplicitRequest(query: string): boolean {
    const lowerQuery = query.toLowerCase();
    return HUMAN_REQUEST_KEYWORDS.some((keyword) => lowerQuery.includes(keyword));
  }

  /**
   * Check for frustration in message
   */
  hasFrustrationSignal(query: string): boolean {
    const lowerQuery = query.toLowerCase();
    return FRUSTRATION_KEYWORDS.some((keyword) => lowerQuery.includes(keyword));
  }

  /**
   * Analyze handoff signals from context
   */
  private analyzeSignals(
    context: HandoffContext,
    thresholds: HandoffThresholds
  ): HandoffSignals {
    const { journey, recentQueries, satisfactionSignals, timeOnPage } = context;

    // High engagement
    const highEngagement = journey.sectionCount >= thresholds.minSectionsForEngagement;

    // Decision stage
    const decisionStage =
      journey.currentStage === 'decision' || journey.currentStage === 'action';

    // Pricing intent
    const pricingIntent = journey.addressedIntents.some((intent) =>
      SALES_READY_INTENTS.includes(intent)
    );

    // Frustration detection
    const frustration =
      (recentQueries?.some((q) => this.hasFrustrationSignal(q)) ?? false) ||
      (satisfactionSignals?.filter((s) => s.type === 'negative').length ?? 0) >= 2;

    // Repetition detection
    const repetition = this.detectRepetition(recentQueries, thresholds);

    // Explicit request
    const explicitRequest =
      recentQueries?.some((q) => this.hasExplicitRequest(q)) ?? false;

    // High-value persona
    const highValuePersona = this.isHighValuePersona(journey.personaHint);

    // Technical depth
    const technicalDepth = journey.addressedIntents.some((intent) =>
      SUPPORT_INTENTS.includes(intent)
    );

    // Significant time
    const significantTime =
      (timeOnPage ?? 0) >= thresholds.minTimeForSignificance;

    // Comparison behavior
    const comparisonBehavior =
      journey.addressedIntents.filter(
        (intent) => intent === 'pricing' || intent === 'comparison'
      ).length >= 2;

    return {
      highEngagement,
      decisionStage,
      pricingIntent,
      frustration,
      repetition,
      explicitRequest,
      highValuePersona,
      technicalDepth,
      significantTime,
      comparisonBehavior,
    };
  }

  /**
   * Detect repeated similar queries
   */
  private detectRepetition(
    queries: string[] | undefined,
    thresholds: HandoffThresholds
  ): boolean {
    if (!queries || queries.length < thresholds.minQueriesForRepetition) {
      return false;
    }

    // Simple similarity check - look for similar word overlap
    const queryWords = queries.map((q) =>
      new Set(q.toLowerCase().split(/\s+/).filter((w) => w.length > 3))
    );

    for (let i = 0; i < queryWords.length - 1; i++) {
      for (let j = i + 1; j < queryWords.length; j++) {
        const overlap = [...queryWords[i]].filter((w) => queryWords[j].has(w));
        const similarity = overlap.length / Math.max(queryWords[i].size, queryWords[j].size);
        if (similarity > 0.5) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Check if persona indicates high value
   */
  private isHighValuePersona(personaHint?: string): boolean {
    if (!personaHint) return false;
    const lowerHint = personaHint.toLowerCase();
    return HIGH_VALUE_INDICATORS.some((indicator) => lowerHint.includes(indicator));
  }

  /**
   * Calculate confidence and lead scores
   */
  private calculateScores(signals: HandoffSignals): {
    confidence: number;
    leadScore: number;
  } {
    let totalWeight = 0;
    let activeWeight = 0;

    for (const [signal, isActive] of Object.entries(signals)) {
      const weight = SIGNAL_WEIGHTS[signal as keyof HandoffSignals];
      totalWeight += weight;
      if (isActive) {
        activeWeight += weight;
      }
    }

    // Confidence based on active signal weights
    const confidence = activeWeight / 100; // Normalize to 0-1

    // Lead score based on sales-relevant signals
    const salesSignals: (keyof HandoffSignals)[] = [
      'highEngagement',
      'decisionStage',
      'pricingIntent',
      'highValuePersona',
      'comparisonBehavior',
      'significantTime',
    ];

    const leadWeight = salesSignals
      .filter((signal) => signals[signal])
      .reduce((sum, signal) => sum + SIGNAL_WEIGHTS[signal], 0);

    const maxLeadWeight = salesSignals.reduce(
      (sum, signal) => sum + SIGNAL_WEIGHTS[signal],
      0
    );

    const leadScore = Math.round((leadWeight / maxLeadWeight) * 100);

    return { confidence: Math.min(1, confidence), leadScore };
  }

  /**
   * Determine the type of handoff needed
   */
  private determineHandoffType(
    signals: HandoffSignals,
    leadScore: number,
    thresholds: HandoffThresholds
  ): HandoffType {
    // Explicit request always wins
    if (signals.explicitRequest) {
      return signals.frustration ? 'support' : 'sales';
    }

    // Frustration suggests support
    if (signals.frustration || signals.repetition) {
      return 'support';
    }

    // Technical depth suggests specialist
    if (signals.technicalDepth && !signals.pricingIntent) {
      return 'specialist';
    }

    // High lead score suggests sales
    if (leadScore >= thresholds.leadScoreForSales) {
      return 'sales';
    }

    // Decision stage with engagement suggests onboarding
    if (signals.decisionStage && signals.highEngagement) {
      return 'onboarding';
    }

    // Default based on signals
    if (signals.pricingIntent || signals.comparisonBehavior) {
      return 'sales';
    }

    return 'none';
  }

  /**
   * Determine urgency level
   */
  private determineUrgency(
    signals: HandoffSignals,
    confidence: number
  ): HandoffUrgency {
    if (signals.explicitRequest) return 'immediate';
    if (signals.frustration) return 'high';
    if (confidence >= 0.8) return 'high';
    if (confidence >= 0.6) return 'medium';
    if (confidence >= 0.4) return 'low';
    return 'none';
  }

  /**
   * Get suggested CTA for handoff
   */
  private getSuggestedCTA(
    handoffType: HandoffType,
    urgency: HandoffUrgency
  ): { text: string; subtext?: string; icon?: string } {
    const ctaMap: Record<HandoffType, { text: string; subtext?: string; icon?: string }> = {
      sales: {
        text: 'Talk to Sales',
        subtext: 'Get personalized guidance',
        icon: 'phone',
      },
      support: {
        text: 'Get Help Now',
        subtext: 'Connect with our team',
        icon: 'headphones',
      },
      specialist: {
        text: 'Talk to an Expert',
        subtext: 'Get technical answers',
        icon: 'user-check',
      },
      onboarding: {
        text: 'Get Started Together',
        subtext: 'Free onboarding session',
        icon: 'rocket',
      },
      none: {
        text: 'Need Help?',
        icon: 'help-circle',
      },
    };

    const cta = ctaMap[handoffType];

    // Adjust text for urgency
    if (urgency === 'immediate' && handoffType !== 'none') {
      return {
        ...cta,
        text: `${cta.text} - We're Here`,
        subtext: 'Available right now',
      };
    }

    return cta;
  }

  /**
   * Generate human-readable reason for handoff
   */
  private generateReason(
    activeSignals: (keyof HandoffSignals)[],
    handoffType: HandoffType
  ): string {
    if (handoffType === 'none') {
      return 'Visitor appears to be self-serving successfully.';
    }

    const reasons: string[] = [];

    if (activeSignals.includes('explicitRequest')) {
      reasons.push('explicitly requested human assistance');
    }
    if (activeSignals.includes('frustration')) {
      reasons.push('showing signs of frustration');
    }
    if (activeSignals.includes('pricingIntent')) {
      reasons.push('interested in pricing');
    }
    if (activeSignals.includes('decisionStage')) {
      reasons.push('in decision stage');
    }
    if (activeSignals.includes('highEngagement')) {
      reasons.push('highly engaged');
    }
    if (activeSignals.includes('highValuePersona')) {
      reasons.push('high-value visitor');
    }
    if (activeSignals.includes('repetition')) {
      reasons.push('asking similar questions');
    }

    return `Visitor ${reasons.join(', ')}.`;
  }

  /**
   * Use AI to analyze complex handoff scenarios
   */
  async analyzeWithAI(
    context: HandoffContext,
    recentMessages: Array<{ role: string; content: string }>
  ): Promise<{
    recommendation: HandoffType;
    confidence: number;
    reason: string;
    tokensUsed: number;
  }> {
    try {
      const { data, tokensUsed } = await completeJSON<{
        recommendation: HandoffType;
        confidence: number;
        reason: string;
      }>({
        messages: [
          {
            role: 'system',
            content: `Analyze this conversation and determine if human handoff is needed.

Journey context:
- Sections viewed: ${context.journey.sectionCount}
- Topics explored: ${context.journey.exploredTopics.join(', ') || 'none'}
- Funnel stage: ${context.journey.currentStage}
- Persona hint: ${context.journey.personaHint || 'unknown'}

Respond in JSON:
{
  "recommendation": "sales|support|specialist|onboarding|none",
  "confidence": 0.0-1.0,
  "reason": "Brief explanation"
}`,
          },
          ...recentMessages.map((m) => ({
            role: m.role as 'user' | 'assistant',
            content: m.content,
          })),
        ],
        config: { maxTokens: 200 },
      });

      return { ...data, tokensUsed };
    } catch (error) {
      console.error('AI handoff analysis failed:', error);
      return {
        recommendation: 'none',
        confidence: 0,
        reason: 'Analysis failed',
        tokensUsed: 0,
      };
    }
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

let detectorInstance: HandoffDetector | null = null;

export function getHandoffDetector(): HandoffDetector {
  if (!detectorInstance) {
    detectorInstance = new HandoffDetector();
  }
  return detectorInstance;
}

// ============================================================================
// CONVENIENCE EXPORTS
// ============================================================================

export { DEFAULT_THRESHOLDS, SIGNAL_WEIGHTS };
