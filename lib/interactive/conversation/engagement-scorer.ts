/**
 * Engagement Scoring Algorithm
 * Phase 6.4: Conversation Journey & Conversion Flow - Task #117
 *
 * Calculates user engagement based on conversation behavior.
 * Used to determine conversion readiness and CTA prominence.
 *
 * Scoring Factors:
 * - Sections viewed: +10 per section
 * - Time on section: +1 per 10 seconds (max 30)
 * - CTA clicks: +15 per click
 * - Chat messages: +20 per message
 * - Deep topic exploration: +25 bonus
 * - Return visit: +30 bonus
 */

import type { ConversationState, FunnelStage, ConversionReadiness, TopicEngagement } from '@/lib/stores/conversation-state-store';
import { JourneyDepth } from '@/lib/stores/conversation-state-store';

// ============================================================================
// TYPES
// ============================================================================

export interface EngagementScoreBreakdown {
  baseScore: number;
  sectionBonus: number;
  ctaBonus: number;
  chatBonus: number;
  timeBonus: number;
  depthBonus: number;
  returnVisitBonus: number;
  formBonus: number;
  totalScore: number;
}

export interface EngagementAnalysis {
  score: number;
  breakdown: EngagementScoreBreakdown;
  tier: 'cold' | 'warm' | 'hot' | 'qualified';
  conversionReadiness: ConversionReadiness;
  recommendations: string[];
}

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Scoring weights for different engagement activities
 */
export const ENGAGEMENT_WEIGHTS = {
  // Base activities
  sectionView: 10,
  ctaClick: 15,
  chatMessage: 20,
  followUpClick: 12,

  // Time engagement
  timePerTenSeconds: 1,
  maxTimeBonus: 30,

  // Deep engagement bonuses
  deepTopicExploration: 25,
  returnVisit: 30,
  multiTopicExploration: 15,

  // Conversion activities
  formStart: 20,
  formComplete: 50,
  demoRequest: 40,
  pricingView: 20,
} as const;

/**
 * Score thresholds for tiers
 */
export const TIER_THRESHOLDS = {
  cold: 0,
  warm: 50,
  hot: 100,
  qualified: 150,
} as const;

/**
 * Conversion readiness thresholds
 */
export const READINESS_THRESHOLDS = {
  low: 0,
  medium: 50,
  high: 100,
  ready: 150,
} as const;

// ============================================================================
// ENGAGEMENT SCORER
// ============================================================================

/**
 * Calculate engagement score with detailed breakdown
 */
export function calculateEngagementScore(
  state: ConversationState
): EngagementScoreBreakdown {
  const breakdown: EngagementScoreBreakdown = {
    baseScore: 0,
    sectionBonus: 0,
    ctaBonus: 0,
    chatBonus: 0,
    timeBonus: 0,
    depthBonus: 0,
    returnVisitBonus: 0,
    formBonus: 0,
    totalScore: 0,
  };

  // Count interaction types
  const interactions = state.interactions;
  const ctaClicks = interactions.filter(i => i.type === 'cta-click').length;
  const chatMessages = interactions.filter(i => i.type === 'chat-message').length;
  const followUpClicks = interactions.filter(i => i.type === 'follow-up-click').length;
  const formStarts = interactions.filter(i => i.type === 'form-start').length;
  const formSubmits = interactions.filter(i => i.type === 'form-submit').length;

  // Section bonus
  breakdown.sectionBonus = state.sectionsGenerated * ENGAGEMENT_WEIGHTS.sectionView;

  // CTA and follow-up bonus
  breakdown.ctaBonus = (ctaClicks * ENGAGEMENT_WEIGHTS.ctaClick) +
    (followUpClicks * ENGAGEMENT_WEIGHTS.followUpClick);

  // Chat message bonus
  breakdown.chatBonus = chatMessages * ENGAGEMENT_WEIGHTS.chatMessage;

  // Time bonus (capped per section)
  const avgTimePerSection = state.sectionsGenerated > 0
    ? state.totalTimeSpentMs / state.sectionsGenerated / 1000
    : 0;
  const timeBonusPerSection = Math.min(
    ENGAGEMENT_WEIGHTS.maxTimeBonus,
    Math.floor(avgTimePerSection / 10) * ENGAGEMENT_WEIGHTS.timePerTenSeconds
  );
  breakdown.timeBonus = timeBonusPerSection * state.sectionsGenerated;

  // Deep engagement bonus
  const deepTopics = Object.values(state.topicsExplored).filter((t: TopicEngagement) => t.depth === 'deep');
  const multipleTopics = state.topicOrder.length >= 3;

  breakdown.depthBonus = (deepTopics.length * ENGAGEMENT_WEIGHTS.deepTopicExploration) +
    (multipleTopics ? ENGAGEMENT_WEIGHTS.multiTopicExploration : 0);

  // Check for return visit (session started before today)
  const sessionStart = new Date(state.startedAt);
  const now = new Date();
  const isReturnVisit = sessionStart.getTime() < (now.getTime() - 24 * 60 * 60 * 1000);
  breakdown.returnVisitBonus = isReturnVisit ? ENGAGEMENT_WEIGHTS.returnVisit : 0;

  // Form bonus
  breakdown.formBonus = (formStarts * ENGAGEMENT_WEIGHTS.formStart) +
    (formSubmits * ENGAGEMENT_WEIGHTS.formComplete);

  // Check for pricing/demo intent
  const hasPricingIntent = interactions.some(i =>
    i.topic?.toLowerCase().includes('pricing') ||
    i.ctaText?.toLowerCase().includes('pricing')
  );
  const hasDemoIntent = interactions.some(i =>
    i.ctaText?.toLowerCase().includes('demo') ||
    i.type === 'handoff-trigger'
  );

  if (hasPricingIntent) {
    breakdown.baseScore += ENGAGEMENT_WEIGHTS.pricingView;
  }
  if (hasDemoIntent) {
    breakdown.baseScore += ENGAGEMENT_WEIGHTS.demoRequest;
  }

  // Calculate total
  breakdown.totalScore =
    breakdown.baseScore +
    breakdown.sectionBonus +
    breakdown.ctaBonus +
    breakdown.chatBonus +
    breakdown.timeBonus +
    breakdown.depthBonus +
    breakdown.returnVisitBonus +
    breakdown.formBonus;

  return breakdown;
}

/**
 * Get engagement tier from score
 */
export function getEngagementTier(score: number): 'cold' | 'warm' | 'hot' | 'qualified' {
  if (score >= TIER_THRESHOLDS.qualified) return 'qualified';
  if (score >= TIER_THRESHOLDS.hot) return 'hot';
  if (score >= TIER_THRESHOLDS.warm) return 'warm';
  return 'cold';
}

/**
 * Calculate conversion readiness
 */
export function calculateConversionReadiness(
  score: number,
  depth: JourneyDepth,
  personaConfidence: number
): ConversionReadiness {
  // Ready if very high score or triggered conversion
  if (score >= READINESS_THRESHOLDS.ready && depth >= JourneyDepth.ENGAGED) {
    return 'ready';
  }

  // High if good score or deep engagement
  if (score >= READINESS_THRESHOLDS.high || depth >= JourneyDepth.DEEP) {
    return 'high';
  }

  // Medium if moderate score with some engagement
  if (score >= READINESS_THRESHOLDS.medium || depth >= JourneyDepth.EXPLORING) {
    return 'medium';
  }

  // Boost if persona is confident
  if (personaConfidence > 0.7 && score >= READINESS_THRESHOLDS.medium * 0.8) {
    return 'medium';
  }

  return 'low';
}

/**
 * Generate engagement recommendations
 */
export function generateEngagementRecommendations(
  state: ConversationState,
  score: number
): string[] {
  const recommendations: string[] = [];
  const topicsExplored = Object.keys(state.topicsExplored);

  // Low engagement recommendations
  if (score < TIER_THRESHOLDS.warm) {
    if (state.sectionsGenerated < 2) {
      recommendations.push('Encourage exploration with compelling CTAs');
    }
    if (topicsExplored.length < 2) {
      recommendations.push('Suggest related topics to broaden interest');
    }
  }

  // Medium engagement recommendations
  if (score >= TIER_THRESHOLDS.warm && score < TIER_THRESHOLDS.hot) {
    if (!topicsExplored.some(t => t.toLowerCase().includes('pricing'))) {
      recommendations.push('Introduce pricing information subtly');
    }
    if (state.totalTimeSpentMs < 60000) {
      recommendations.push('Add engaging content to increase time on site');
    }
  }

  // High engagement recommendations
  if (score >= TIER_THRESHOLDS.hot) {
    recommendations.push('Show conversion CTA prominently');
    if (state.detectedPersona) {
      recommendations.push(`Personalize messaging for ${state.detectedPersona}`);
    }
    if (!state.hasTriggeredConversion) {
      recommendations.push('Offer direct call-to-action (demo, contact)');
    }
  }

  return recommendations;
}

/**
 * Full engagement analysis
 */
export function analyzeEngagement(state: ConversationState): EngagementAnalysis {
  const breakdown = calculateEngagementScore(state);
  const tier = getEngagementTier(breakdown.totalScore);
  const readiness = calculateConversionReadiness(
    breakdown.totalScore,
    state.currentDepth,
    state.personaConfidence
  );
  const recommendations = generateEngagementRecommendations(state, breakdown.totalScore);

  return {
    score: breakdown.totalScore,
    breakdown,
    tier,
    conversionReadiness: readiness,
    recommendations,
  };
}

// ============================================================================
// TOPIC ENGAGEMENT ANALYSIS
// ============================================================================

/**
 * Get top engaged topics
 */
export function getTopEngagedTopics(
  topicsExplored: Record<string, TopicEngagement>,
  limit: number = 5
): TopicEngagement[] {
  return Object.values(topicsExplored)
    .sort((a, b) => {
      // Sort by depth first, then by sections, then by time
      const depthOrder = { deep: 3, moderate: 2, surface: 1 };
      const depthDiff = depthOrder[b.depth] - depthOrder[a.depth];
      if (depthDiff !== 0) return depthDiff;

      const sectionsDiff = b.sectionsGenerated - a.sectionsGenerated;
      if (sectionsDiff !== 0) return sectionsDiff;

      return b.timeSpentMs - a.timeSpentMs;
    })
    .slice(0, limit);
}

/**
 * Calculate topic interest score
 */
export function calculateTopicInterestScore(engagement: TopicEngagement): number {
  const depthMultiplier = { deep: 3, moderate: 2, surface: 1 };

  return (
    engagement.sectionsGenerated * 10 * depthMultiplier[engagement.depth] +
    engagement.ctasClicked.length * 5 +
    engagement.questionsAsked.length * 8 +
    Math.floor(engagement.timeSpentMs / 10000) // +1 per 10 seconds
  );
}

/**
 * Get key interests from topic engagement
 */
export function getKeyInterests(
  topicsExplored: Record<string, TopicEngagement>
): Array<{ topic: string; score: number }> {
  return Object.values(topicsExplored)
    .map(engagement => ({
      topic: engagement.topic,
      score: calculateTopicInterestScore(engagement),
    }))
    .sort((a, b) => b.score - a.score);
}

// ============================================================================
// FUNNEL STAGE DETECTION
// ============================================================================

/**
 * Detect funnel stage from conversation state
 */
export function detectFunnelStage(state: ConversationState): FunnelStage {
  const topics = Object.keys(state.topicsExplored);
  const interactions = state.interactions;

  // Check for action signals
  const hasActionIntent = interactions.some(i =>
    i.type === 'form-start' ||
    i.type === 'form-submit' ||
    i.type === 'handoff-trigger' ||
    i.ctaText?.toLowerCase().includes('demo') ||
    i.ctaText?.toLowerCase().includes('contact') ||
    i.ctaText?.toLowerCase().includes('talk to') ||
    i.ctaText?.toLowerCase().includes('get started')
  );

  if (hasActionIntent || state.hasTriggeredConversion) {
    return 'action';
  }

  // Check for decision signals
  const hasDecisionIntent = topics.some(t =>
    t.toLowerCase().includes('pricing') ||
    t.toLowerCase().includes('cost') ||
    t.toLowerCase().includes('plan') ||
    t.toLowerCase().includes('comparison')
  ) || state.currentDepth >= JourneyDepth.DEEP;

  if (hasDecisionIntent) {
    return 'decision';
  }

  // Check for consideration signals
  const hasConsiderationIntent = topics.some(t =>
    t.toLowerCase().includes('feature') ||
    t.toLowerCase().includes('benefit') ||
    t.toLowerCase().includes('use case') ||
    t.toLowerCase().includes('integration')
  ) || state.currentDepth >= JourneyDepth.EXPLORING;

  if (hasConsiderationIntent) {
    return 'consideration';
  }

  return 'awareness';
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  ENGAGEMENT_WEIGHTS as engagementWeights,
  TIER_THRESHOLDS as tierThresholds,
  READINESS_THRESHOLDS as readinessThresholds,
};
