/**
 * Conversation Journey Types
 * Phase 6.4: Conversation Journey & Conversion Flow
 *
 * Shared types for the conversation journey tracking system.
 */

// Re-export types from the store for convenience
export type {
  ConversationState,
  Interaction,
  InteractionType,
  TopicEngagement,
  PersonaSignal,
  FunnelStage,
  ConversionReadiness,
  JourneyExportData,
} from '@/lib/stores/conversation-state-store';

export { JourneyDepth } from '@/lib/stores/conversation-state-store';

/**
 * Engagement tier based on score
 */
export type EngagementTier = 'cold' | 'warm' | 'hot' | 'qualified';

/**
 * Get engagement tier from score
 */
export function getEngagementTier(score: number): EngagementTier {
  if (score >= 150) return 'qualified';
  if (score >= 100) return 'hot';
  if (score >= 50) return 'warm';
  return 'cold';
}

/**
 * Conversion CTA prominence levels
 */
export type ConversionProminence = 'subtle' | 'secondary' | 'prominent' | 'primary';

/**
 * Conversion CTA configuration by prominence
 */
export const CONVERSION_CTA_CONFIG: Record<ConversionProminence, {
  size: 'sm' | 'md' | 'lg' | 'xl';
  showSubtext: boolean;
  animate: boolean;
  position: 'inline' | 'bottom' | 'sticky' | 'modal';
}> = {
  subtle: {
    size: 'sm',
    showSubtext: false,
    animate: false,
    position: 'inline',
  },
  secondary: {
    size: 'md',
    showSubtext: false,
    animate: false,
    position: 'bottom',
  },
  prominent: {
    size: 'lg',
    showSubtext: true,
    animate: true,
    position: 'bottom',
  },
  primary: {
    size: 'xl',
    showSubtext: true,
    animate: true,
    position: 'sticky',
  },
};

/**
 * Journey milestone events
 */
export type JourneyMilestone =
  | 'first_interaction'
  | 'explored_multiple_topics'
  | 'deep_engagement'
  | 'pricing_viewed'
  | 'demo_requested'
  | 'form_submitted'
  | 'conversion_complete';

/**
 * Journey analytics event
 */
export interface JourneyAnalyticsEvent {
  eventType: 'milestone' | 'interaction' | 'conversion';
  milestone?: JourneyMilestone;
  sessionId: string;
  websiteId: string;
  timestamp: string;
  metadata: Record<string, unknown>;
}

/**
 * Lead qualification criteria
 */
export interface LeadQualificationCriteria {
  minEngagementScore: number;
  minSectionsViewed: number;
  requiredTopics?: string[];
  minTimeOnSite?: number; // seconds
  mustHavePricing?: boolean;
}

/**
 * Default lead qualification criteria
 */
export const DEFAULT_LEAD_CRITERIA: LeadQualificationCriteria = {
  minEngagementScore: 75,
  minSectionsViewed: 3,
  minTimeOnSite: 60,
};

/**
 * Check if journey meets lead qualification criteria
 */
export function meetsLeadCriteria(
  journeyData: {
    engagementScore: number;
    sectionsViewed: number;
    topicsExplored: string[];
    duration: number;
  },
  criteria: LeadQualificationCriteria = DEFAULT_LEAD_CRITERIA
): boolean {
  if (journeyData.engagementScore < criteria.minEngagementScore) return false;
  if (journeyData.sectionsViewed < criteria.minSectionsViewed) return false;
  if (criteria.minTimeOnSite && journeyData.duration < criteria.minTimeOnSite) return false;

  if (criteria.requiredTopics) {
    const hasAllTopics = criteria.requiredTopics.every(topic =>
      journeyData.topicsExplored.some(t => t.toLowerCase().includes(topic.toLowerCase()))
    );
    if (!hasAllTopics) return false;
  }

  if (criteria.mustHavePricing) {
    const hasPricing = journeyData.topicsExplored.some(t =>
      t.toLowerCase().includes('pricing') || t.toLowerCase().includes('cost')
    );
    if (!hasPricing) return false;
  }

  return true;
}
