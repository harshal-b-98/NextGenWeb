/**
 * Conversation Journey Module
 * Phase 6.4: Conversation Journey & Conversion Flow
 *
 * Exports for the conversation journey tracking, engagement scoring,
 * and lead capture with journey context.
 */

// Types
export * from './types';

// Engagement scoring
export {
  calculateEngagementScore,
  getEngagementTier,
  calculateConversionReadiness,
  generateEngagementRecommendations,
  analyzeEngagement,
  getTopEngagedTopics,
  calculateTopicInterestScore,
  getKeyInterests,
  detectFunnelStage,
  ENGAGEMENT_WEIGHTS,
  TIER_THRESHOLDS,
  READINESS_THRESHOLDS,
  type EngagementScoreBreakdown,
  type EngagementAnalysis,
} from './engagement-scorer';

// Depth tracking
export {
  calculateDepth,
  getNextDepth,
  calculateProgressToNextDepth,
  getJourneyProgress,
  analyzeDepthHistory,
  getDepthRecommendations,
  DEPTH_MILESTONES,
  DEPTH_THRESHOLDS,
  type DepthMilestone,
  type JourneyProgress,
  type DepthTransition,
  type DepthAnalytics,
} from './depth-tracker';

// Lead capture with journey
export {
  qualifyLead,
  enrichLeadWithJourney,
  captureLeadWithJourney,
  qualificationWeights,
  type EnrichedLeadData,
  type JourneyEnrichment,
  type LeadSignal,
  type LeadCaptureResult,
  type LeadQualificationResult,
} from './lead-capture-service';
