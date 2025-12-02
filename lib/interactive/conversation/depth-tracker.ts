/**
 * Journey Depth Tracker
 * Phase 6.4: Conversation Journey & Conversion Flow - Task #119
 *
 * Tracks and analyzes the depth of user engagement in the conversational journey.
 * Provides utilities for depth calculation, milestone detection, and journey visualization.
 */

import type { ConversationState, TopicEngagement } from '@/lib/stores/conversation-state-store';
import { JourneyDepth } from '@/lib/stores/conversation-state-store';

// ============================================================================
// TYPES
// ============================================================================

export interface DepthMilestone {
  depth: JourneyDepth;
  label: string;
  description: string;
  icon: string;
  color: string;
  requirement: string;
}

export interface JourneyProgress {
  currentDepth: JourneyDepth;
  currentMilestone: DepthMilestone;
  nextMilestone: DepthMilestone | null;
  progressToNext: number; // 0-100
  sectionsUntilNext: number;
  totalSections: number;
  deepestTopic: string | null;
  deepTopicCount: number;
}

export interface DepthTransition {
  from: JourneyDepth;
  to: JourneyDepth;
  trigger: 'section' | 'time' | 'topic' | 'conversion';
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface DepthAnalytics {
  currentDepth: JourneyDepth;
  timeAtDepth: Record<JourneyDepth, number>;
  transitionHistory: DepthTransition[];
  averageTimeToDepth: Record<JourneyDepth, number>;
  topicContributions: Array<{ topic: string; contribution: number }>;
}

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Depth milestone definitions
 */
export const DEPTH_MILESTONES: Record<JourneyDepth, DepthMilestone> = {
  [JourneyDepth.SURFACE]: {
    depth: JourneyDepth.SURFACE,
    label: 'Exploring',
    description: 'Just getting started',
    icon: 'eye',
    color: 'blue',
    requirement: 'View your first section',
  },
  [JourneyDepth.EXPLORING]: {
    depth: JourneyDepth.EXPLORING,
    label: 'Curious',
    description: 'Showing interest',
    icon: 'compass',
    color: 'green',
    requirement: 'View 2+ sections',
  },
  [JourneyDepth.ENGAGED]: {
    depth: JourneyDepth.ENGAGED,
    label: 'Engaged',
    description: 'Actively learning',
    icon: 'book-open',
    color: 'purple',
    requirement: 'View 4+ sections',
  },
  [JourneyDepth.DEEP]: {
    depth: JourneyDepth.DEEP,
    label: 'Deep Dive',
    description: 'Thoroughly exploring',
    icon: 'layers',
    color: 'orange',
    requirement: 'View 6+ sections or explore 2+ sections per topic',
  },
  [JourneyDepth.CONVERSION_READY]: {
    depth: JourneyDepth.CONVERSION_READY,
    label: 'Ready',
    description: 'Ready to take action',
    icon: 'target',
    color: 'red',
    requirement: 'Trigger conversion CTA',
  },
};

/**
 * Section thresholds for each depth level
 */
export const DEPTH_THRESHOLDS = {
  [JourneyDepth.SURFACE]: 1,
  [JourneyDepth.EXPLORING]: 2,
  [JourneyDepth.ENGAGED]: 4,
  [JourneyDepth.DEEP]: 6,
  [JourneyDepth.CONVERSION_READY]: Infinity, // Only via explicit action
};

// ============================================================================
// DEPTH CALCULATION
// ============================================================================

/**
 * Calculate current journey depth from state
 */
export function calculateDepth(state: ConversationState): JourneyDepth {
  const { sectionsGenerated, topicsExplored, hasTriggeredConversion } = state;

  // Conversion ready takes precedence
  if (hasTriggeredConversion) {
    return JourneyDepth.CONVERSION_READY;
  }

  // Check for deep topic engagement (2+ sections on same topic)
  const hasDeepTopicEngagement = Object.values(topicsExplored).some(
    (t: TopicEngagement) => t.sectionsGenerated >= 2
  );

  // Determine depth based on sections and topic engagement
  if (sectionsGenerated >= 6 || hasDeepTopicEngagement) {
    return JourneyDepth.DEEP;
  }
  if (sectionsGenerated >= 4) {
    return JourneyDepth.ENGAGED;
  }
  if (sectionsGenerated >= 2) {
    return JourneyDepth.EXPLORING;
  }

  return JourneyDepth.SURFACE;
}

/**
 * Get the next depth level
 */
export function getNextDepth(currentDepth: JourneyDepth): JourneyDepth | null {
  if (currentDepth >= JourneyDepth.CONVERSION_READY) {
    return null;
  }
  return (currentDepth + 1) as JourneyDepth;
}

/**
 * Calculate progress towards next depth level
 */
export function calculateProgressToNextDepth(state: ConversationState): number {
  const currentDepth = calculateDepth(state);
  const nextDepth = getNextDepth(currentDepth);

  if (!nextDepth) {
    return 100; // Already at max depth
  }

  const currentThreshold = DEPTH_THRESHOLDS[currentDepth];
  const nextThreshold = DEPTH_THRESHOLDS[nextDepth];
  const sectionsGenerated = state.sectionsGenerated;

  // Special case for DEEP depth (can be achieved via topic depth)
  if (nextDepth === JourneyDepth.DEEP) {
    const maxTopicDepth = Math.max(
      ...Object.values(state.topicsExplored).map((t: TopicEngagement) => t.sectionsGenerated),
      0
    );
    const topicProgress = (maxTopicDepth / 2) * 50; // 50% progress at 2 sections on one topic
    const sectionProgress = ((sectionsGenerated - currentThreshold) / (nextThreshold - currentThreshold)) * 50;
    return Math.min(100, topicProgress + sectionProgress);
  }

  // Standard progress calculation
  const progress = ((sectionsGenerated - currentThreshold) / (nextThreshold - currentThreshold)) * 100;
  return Math.max(0, Math.min(100, progress));
}

// ============================================================================
// JOURNEY PROGRESS
// ============================================================================

/**
 * Get comprehensive journey progress info
 */
export function getJourneyProgress(state: ConversationState): JourneyProgress {
  const currentDepth = calculateDepth(state);
  const currentMilestone = DEPTH_MILESTONES[currentDepth];
  const nextDepthLevel = getNextDepth(currentDepth);
  const nextMilestone = nextDepthLevel ? DEPTH_MILESTONES[nextDepthLevel] : null;
  const progressToNext = calculateProgressToNextDepth(state);

  // Find deepest topic
  let deepestTopic: string | null = null;
  let maxSections = 0;
  for (const [topic, engagement] of Object.entries(state.topicsExplored)) {
    const e = engagement as TopicEngagement;
    if (e.sectionsGenerated > maxSections) {
      maxSections = e.sectionsGenerated;
      deepestTopic = topic;
    }
  }

  // Count deep topics
  const deepTopicCount = Object.values(state.topicsExplored).filter(
    (t: TopicEngagement) => t.depth === 'deep'
  ).length;

  // Calculate sections until next
  const currentThreshold = DEPTH_THRESHOLDS[currentDepth];
  const nextThreshold = nextDepthLevel ? DEPTH_THRESHOLDS[nextDepthLevel] : Infinity;
  const sectionsUntilNext = Math.max(0, nextThreshold - state.sectionsGenerated);

  return {
    currentDepth,
    currentMilestone,
    nextMilestone,
    progressToNext,
    sectionsUntilNext,
    totalSections: state.sectionsGenerated,
    deepestTopic,
    deepTopicCount,
  };
}

// ============================================================================
// DEPTH ANALYTICS
// ============================================================================

/**
 * Analyze depth transitions and time spent at each level
 */
export function analyzeDepthHistory(
  interactions: ConversationState['interactions'],
  startedAt: string
): DepthAnalytics {
  const transitions: DepthTransition[] = [];
  const timeAtDepth: Record<JourneyDepth, number> = {
    [JourneyDepth.SURFACE]: 0,
    [JourneyDepth.EXPLORING]: 0,
    [JourneyDepth.ENGAGED]: 0,
    [JourneyDepth.DEEP]: 0,
    [JourneyDepth.CONVERSION_READY]: 0,
  };

  // Track section views to determine depth at each point
  let sectionCount = 0;
  let currentDepth = JourneyDepth.SURFACE;
  let lastTimestamp = new Date(startedAt).getTime();

  for (const interaction of interactions) {
    const timestamp = new Date(interaction.timestamp).getTime();
    const timeDiff = timestamp - lastTimestamp;

    // Add time to current depth
    timeAtDepth[currentDepth] += timeDiff;

    // Check for section views
    if (interaction.type === 'section-view') {
      sectionCount++;

      // Calculate new depth
      let newDepth: JourneyDepth = currentDepth;
      if (sectionCount >= 6) newDepth = JourneyDepth.DEEP;
      else if (sectionCount >= 4) newDepth = JourneyDepth.ENGAGED;
      else if (sectionCount >= 2) newDepth = JourneyDepth.EXPLORING;

      // Record transition
      if (newDepth !== currentDepth) {
        transitions.push({
          from: currentDepth,
          to: newDepth,
          trigger: 'section',
          timestamp: interaction.timestamp,
          metadata: { sectionCount },
        });
        currentDepth = newDepth;
      }
    }

    // Check for conversion trigger
    if (interaction.type === 'handoff-trigger' && currentDepth !== JourneyDepth.CONVERSION_READY) {
      transitions.push({
        from: currentDepth,
        to: JourneyDepth.CONVERSION_READY,
        trigger: 'conversion',
        timestamp: interaction.timestamp,
      });
      currentDepth = JourneyDepth.CONVERSION_READY;
    }

    lastTimestamp = timestamp;
  }

  // Add remaining time to current depth
  const now = Date.now();
  timeAtDepth[currentDepth] += now - lastTimestamp;

  // Calculate average time to reach each depth
  const averageTimeToDepth: Record<JourneyDepth, number> = {
    [JourneyDepth.SURFACE]: 0,
    [JourneyDepth.EXPLORING]: 0,
    [JourneyDepth.ENGAGED]: 0,
    [JourneyDepth.DEEP]: 0,
    [JourneyDepth.CONVERSION_READY]: 0,
  };

  const sessionStart = new Date(startedAt).getTime();
  for (const transition of transitions) {
    const transitionTime = new Date(transition.timestamp).getTime();
    averageTimeToDepth[transition.to] = transitionTime - sessionStart;
  }

  // Topic contributions (placeholder - would need more complex calculation)
  const topicContributions: Array<{ topic: string; contribution: number }> = [];

  return {
    currentDepth,
    timeAtDepth,
    transitionHistory: transitions,
    averageTimeToDepth,
    topicContributions,
  };
}

// ============================================================================
// DEPTH-BASED RECOMMENDATIONS
// ============================================================================

/**
 * Get recommendations based on current depth
 */
export function getDepthRecommendations(
  state: ConversationState
): string[] {
  const depth = calculateDepth(state);
  const recommendations: string[] = [];

  switch (depth) {
    case JourneyDepth.SURFACE:
      recommendations.push('Encourage exploration with prominent CTAs');
      recommendations.push('Highlight popular topics to spark interest');
      break;

    case JourneyDepth.EXPLORING:
      recommendations.push('Suggest related topics based on initial interest');
      recommendations.push('Show social proof and testimonials');
      break;

    case JourneyDepth.ENGAGED:
      recommendations.push('Introduce conversion opportunities subtly');
      recommendations.push('Offer deeper content on interested topics');
      if (Object.keys(state.topicsExplored).length < 3) {
        recommendations.push('Suggest exploring related topics');
      }
      break;

    case JourneyDepth.DEEP:
      recommendations.push('Present conversion CTA prominently');
      recommendations.push('Offer personalized demo or consultation');
      recommendations.push('Show pricing information if relevant');
      break;

    case JourneyDepth.CONVERSION_READY:
      recommendations.push('Streamline conversion process');
      recommendations.push('Provide immediate next steps');
      recommendations.push('Capture contact information');
      break;
  }

  return recommendations;
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  JourneyDepth,
  DEPTH_THRESHOLDS as depthThresholds,
  DEPTH_MILESTONES as depthMilestones,
};
