/**
 * Contextual Lead Capture Service
 * Phase 6.4: Conversation Journey & Conversion Flow - Task #121
 *
 * Service for capturing leads with full journey context.
 * Enriches lead data with engagement metrics, topics explored,
 * and conversion readiness signals.
 */

import type { ConversationState, JourneyExportData } from '@/lib/stores/conversation-state-store';
import type { LeadCaptureInput } from '@/lib/leads/types';
import { analyzeEngagement, getKeyInterests } from './engagement-scorer';
import { getJourneyProgress, analyzeDepthHistory } from './depth-tracker';

// ============================================================================
// TYPES
// ============================================================================

export interface EnrichedLeadData extends LeadCaptureInput {
  journeyData: JourneyEnrichment;
  qualificationScore: number;
  qualificationTier: 'cold' | 'warm' | 'hot' | 'qualified';
  signals: LeadSignal[];
}

export interface JourneyEnrichment {
  sessionId: string;
  duration: number;
  sectionsViewed: number;
  topicsExplored: string[];
  engagementScore: number;
  engagementTier: string;
  funnelStage: string;
  conversionReadiness: string;
  journeyDepth: number;
  depthLabel: string;
  detectedPersona?: string;
  personaConfidence: number;
  keyInterests: Array<{ topic: string; score: number }>;
  questionsAsked: string[];
  interactionSummary: {
    totalInteractions: number;
    ctaClicks: number;
    chatMessages: number;
    avgTimePerSection: number;
  };
  depthAnalytics: {
    timeAtCurrentDepth: number;
    transitionCount: number;
  };
}

export interface LeadSignal {
  type: 'engagement' | 'intent' | 'persona' | 'behavior' | 'timing';
  signal: string;
  strength: 'weak' | 'moderate' | 'strong';
  description: string;
}

export interface LeadCaptureResult {
  success: boolean;
  leadId?: string;
  enrichedData?: EnrichedLeadData;
  error?: string;
  recommendations?: string[];
}

export interface LeadQualificationResult {
  score: number;
  tier: 'cold' | 'warm' | 'hot' | 'qualified';
  signals: LeadSignal[];
  recommendations: string[];
  isHighValue: boolean;
}

// ============================================================================
// QUALIFICATION SCORING
// ============================================================================

const QUALIFICATION_WEIGHTS = {
  // Engagement-based
  engagementScore: 0.3,
  sectionsViewed: 0.15,
  topicsExplored: 0.1,
  timeSpent: 0.1,

  // Intent signals
  pricingViewed: 0.15,
  demoRequested: 0.1,
  formInteraction: 0.05,

  // Persona match
  personaConfidence: 0.05,
};

const TIER_THRESHOLDS = {
  cold: 0,
  warm: 40,
  hot: 70,
  qualified: 85,
};

// ============================================================================
// LEAD QUALIFICATION
// ============================================================================

/**
 * Calculate lead qualification score and signals
 */
export function qualifyLead(
  journeyData: JourneyEnrichment,
  additionalContext?: {
    hasCompany?: boolean;
    hasPhone?: boolean;
    matchesTargetPersona?: boolean;
  }
): LeadQualificationResult {
  const signals: LeadSignal[] = [];
  let score = 0;

  // Engagement score contribution (0-30 points)
  const engagementContribution = Math.min(30, (journeyData.engagementScore / 150) * 30);
  score += engagementContribution;

  if (journeyData.engagementScore >= 100) {
    signals.push({
      type: 'engagement',
      signal: 'high-engagement',
      strength: 'strong',
      description: 'Highly engaged with multiple sections',
    });
  } else if (journeyData.engagementScore >= 50) {
    signals.push({
      type: 'engagement',
      signal: 'moderate-engagement',
      strength: 'moderate',
      description: 'Shows active interest',
    });
  }

  // Sections viewed contribution (0-15 points)
  const sectionsContribution = Math.min(15, journeyData.sectionsViewed * 2.5);
  score += sectionsContribution;

  if (journeyData.sectionsViewed >= 5) {
    signals.push({
      type: 'behavior',
      signal: 'deep-exploration',
      strength: 'strong',
      description: 'Explored multiple content areas thoroughly',
    });
  }

  // Topics explored contribution (0-10 points)
  const topicsContribution = Math.min(10, journeyData.topicsExplored.length * 2.5);
  score += topicsContribution;

  if (journeyData.topicsExplored.length >= 3) {
    signals.push({
      type: 'behavior',
      signal: 'broad-interest',
      strength: 'moderate',
      description: 'Interested in multiple topics',
    });
  }

  // Time spent contribution (0-10 points)
  const minutesSpent = journeyData.duration / 60;
  const timeContribution = Math.min(10, minutesSpent * 2);
  score += timeContribution;

  if (minutesSpent >= 3) {
    signals.push({
      type: 'timing',
      signal: 'invested-time',
      strength: 'moderate',
      description: 'Spent significant time exploring',
    });
  }

  // Intent signals (0-25 points)
  const hasPricingIntent = journeyData.topicsExplored.some(
    t => t.toLowerCase().includes('pricing') || t.toLowerCase().includes('cost')
  );
  const hasDemoIntent = journeyData.questionsAsked.some(
    q => q.toLowerCase().includes('demo') || q.toLowerCase().includes('trial')
  );

  if (hasPricingIntent) {
    score += 15;
    signals.push({
      type: 'intent',
      signal: 'pricing-interest',
      strength: 'strong',
      description: 'Showed interest in pricing',
    });
  }

  if (hasDemoIntent) {
    score += 10;
    signals.push({
      type: 'intent',
      signal: 'demo-interest',
      strength: 'strong',
      description: 'Expressed interest in demo/trial',
    });
  }

  // Conversion readiness bonus (0-10 points)
  if (journeyData.conversionReadiness === 'ready') {
    score += 10;
    signals.push({
      type: 'intent',
      signal: 'conversion-ready',
      strength: 'strong',
      description: 'Ready to convert based on journey',
    });
  } else if (journeyData.conversionReadiness === 'high') {
    score += 5;
  }

  // Persona confidence bonus (0-5 points)
  if (journeyData.personaConfidence >= 0.7) {
    score += 5;
    signals.push({
      type: 'persona',
      signal: 'persona-identified',
      strength: 'moderate',
      description: `Identified as ${journeyData.detectedPersona}`,
    });
  }

  // Additional context bonuses (0-10 points)
  if (additionalContext?.hasCompany) {
    score += 5;
    signals.push({
      type: 'behavior',
      signal: 'company-provided',
      strength: 'moderate',
      description: 'Provided company information',
    });
  }

  if (additionalContext?.hasPhone) {
    score += 5;
    signals.push({
      type: 'behavior',
      signal: 'phone-provided',
      strength: 'strong',
      description: 'Provided phone number',
    });
  }

  // Determine tier
  let tier: 'cold' | 'warm' | 'hot' | 'qualified' = 'cold';
  if (score >= TIER_THRESHOLDS.qualified) tier = 'qualified';
  else if (score >= TIER_THRESHOLDS.hot) tier = 'hot';
  else if (score >= TIER_THRESHOLDS.warm) tier = 'warm';

  // Generate recommendations
  const recommendations: string[] = [];

  if (tier === 'qualified' || tier === 'hot') {
    recommendations.push('Prioritize for immediate follow-up');
    recommendations.push('Schedule discovery call within 24 hours');
  } else if (tier === 'warm') {
    recommendations.push('Add to nurture sequence');
    recommendations.push('Send personalized content based on interests');
  } else {
    recommendations.push('Add to general marketing list');
    recommendations.push('Monitor for re-engagement');
  }

  if (hasPricingIntent) {
    recommendations.push('Include pricing information in follow-up');
  }

  if (journeyData.keyInterests.length > 0) {
    const topInterest = journeyData.keyInterests[0].topic;
    recommendations.push(`Focus messaging on ${topInterest}`);
  }

  const isHighValue = tier === 'qualified' || (tier === 'hot' && Boolean(additionalContext?.hasCompany));

  return {
    score: Math.round(score),
    tier,
    signals,
    recommendations,
    isHighValue,
  };
}

// ============================================================================
// JOURNEY ENRICHMENT
// ============================================================================

/**
 * Enrich lead data with full journey context
 */
export function enrichLeadWithJourney(
  baseData: LeadCaptureInput,
  state: ConversationState
): EnrichedLeadData {
  // Get engagement analysis
  const engagementAnalysis = analyzeEngagement(state);

  // Get journey progress
  const journeyProgress = getJourneyProgress(state);

  // Get depth analytics
  const depthAnalytics = analyzeDepthHistory(state.interactions, state.startedAt);

  // Get key interests
  const keyInterests = getKeyInterests(state.topicsExplored);

  // Build journey enrichment
  const journeyData: JourneyEnrichment = {
    sessionId: state.sessionId,
    duration: Math.floor((Date.now() - new Date(state.startedAt).getTime()) / 1000),
    sectionsViewed: state.sectionsGenerated,
    topicsExplored: state.topicOrder,
    engagementScore: engagementAnalysis.score,
    engagementTier: engagementAnalysis.tier,
    funnelStage: state.currentFunnelStage,
    conversionReadiness: state.conversionReadiness,
    journeyDepth: journeyProgress.currentDepth,
    depthLabel: journeyProgress.currentMilestone.label,
    detectedPersona: state.detectedPersona || undefined,
    personaConfidence: state.personaConfidence,
    keyInterests: keyInterests.slice(0, 5),
    questionsAsked: Object.values(state.topicsExplored).flatMap(t => t.questionsAsked),
    interactionSummary: {
      totalInteractions: state.totalInteractions,
      ctaClicks: state.interactions.filter(i => i.type === 'cta-click').length,
      chatMessages: state.interactions.filter(i => i.type === 'chat-message').length,
      avgTimePerSection: state.sectionsGenerated > 0
        ? Math.round(state.totalTimeSpentMs / state.sectionsGenerated / 1000)
        : 0,
    },
    depthAnalytics: {
      timeAtCurrentDepth: depthAnalytics.timeAtDepth[journeyProgress.currentDepth],
      transitionCount: depthAnalytics.transitionHistory.length,
    },
  };

  // Qualify the lead
  const qualification = qualifyLead(journeyData, {
    hasCompany: !!baseData.company,
    hasPhone: !!baseData.phone,
  });

  return {
    ...baseData,
    journeyData,
    qualificationScore: qualification.score,
    qualificationTier: qualification.tier,
    signals: qualification.signals,
  };
}

// ============================================================================
// LEAD CAPTURE API
// ============================================================================

/**
 * Capture lead with journey enrichment
 */
export async function captureLeadWithJourney(
  baseData: LeadCaptureInput,
  state: ConversationState
): Promise<LeadCaptureResult> {
  try {
    // Enrich the lead data
    const enrichedData = enrichLeadWithJourney(baseData, state);

    // Send to API
    const response = await fetch('/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...enrichedData,
        data: {
          ...baseData.data,
          journey: enrichedData.journeyData,
          qualification: {
            score: enrichedData.qualificationScore,
            tier: enrichedData.qualificationTier,
            signals: enrichedData.signals,
          },
        },
        formData: {
          ...baseData.formData,
          journeyEnriched: true,
          enrichedAt: new Date().toISOString(),
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: errorData.error || 'Failed to capture lead',
      };
    }

    const result = await response.json();

    // Get qualification recommendations
    const qualification = qualifyLead(enrichedData.journeyData, {
      hasCompany: !!baseData.company,
      hasPhone: !!baseData.phone,
    });

    return {
      success: true,
      leadId: result.leadId,
      enrichedData,
      recommendations: qualification.recommendations,
    };
  } catch (error) {
    console.error('Lead capture error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to capture lead',
    };
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  QUALIFICATION_WEIGHTS as qualificationWeights,
  TIER_THRESHOLDS as qualificationTierThresholds,
};
