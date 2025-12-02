/**
 * Conversation Analytics Widget
 * Phase 6.4: Conversation Journey & Conversion Flow - Task #122
 *
 * Dashboard widget that displays conversation journey analytics.
 * Shows engagement metrics, topic distribution, funnel stages, and conversion data.
 *
 * Features:
 * - Real-time engagement score display
 * - Topic exploration visualization
 * - Funnel stage progression
 * - Conversion readiness indicator
 * - Journey depth progress
 */

'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  useConversationStore,
  useEngagementMetrics,
  useTopicEngagement,
  usePersonaInfo,
  JourneyDepth,
} from '@/lib/stores';
import { getJourneyProgress, DEPTH_MILESTONES } from '@/lib/interactive/conversation/depth-tracker';
import { analyzeEngagement, getKeyInterests } from '@/lib/interactive/conversation/engagement-scorer';

// ============================================================================
// TYPES
// ============================================================================

export interface ConversationAnalyticsWidgetProps {
  className?: string;
  variant?: 'compact' | 'full' | 'minimal';
  showTopics?: boolean;
  showFunnel?: boolean;
  showDepth?: boolean;
  showRecommendations?: boolean;
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

/**
 * Score Ring - Circular progress indicator
 */
function ScoreRing({
  score,
  max = 150,
  label,
  sublabel,
  size = 100,
  strokeWidth = 8,
  className,
}: {
  score: number;
  max?: number;
  label: string;
  sublabel?: string;
  size?: number;
  strokeWidth?: number;
  className?: string;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const progress = Math.min(score / max, 1);
  const offset = circumference - progress * circumference;

  // Color based on progress
  const getColor = () => {
    if (progress >= 1) return 'text-purple-500';
    if (progress >= 0.67) return 'text-orange-500';
    if (progress >= 0.33) return 'text-green-500';
    return 'text-blue-500';
  };

  return (
    <div className={cn('flex flex-col items-center', className)}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg className="transform -rotate-90" width={size} height={size}>
          <circle
            className="text-muted stroke-current"
            strokeWidth={strokeWidth}
            fill="transparent"
            r={radius}
            cx={size / 2}
            cy={size / 2}
          />
          <motion.circle
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className={cn('stroke-current', getColor())}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            fill="transparent"
            r={radius}
            cx={size / 2}
            cy={size / 2}
            style={{ strokeDasharray: circumference }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold">{score}</span>
          <span className="text-xs text-muted-foreground">/{max}</span>
        </div>
      </div>
      <p className="mt-2 font-medium text-sm">{label}</p>
      {sublabel && (
        <p className="text-xs text-muted-foreground">{sublabel}</p>
      )}
    </div>
  );
}

/**
 * Metric Card
 */
function MetricCard({
  label,
  value,
  icon,
  trend,
  className,
}: {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  className?: string;
}) {
  return (
    <div className={cn('p-3 rounded-lg bg-muted/30 border', className)}>
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{label}</span>
        {icon && <span className="text-muted-foreground">{icon}</span>}
      </div>
      <div className="mt-1 flex items-baseline gap-1">
        <span className="text-xl font-semibold">{value}</span>
        {trend && (
          <span
            className={cn(
              'text-xs',
              trend === 'up' && 'text-green-500',
              trend === 'down' && 'text-red-500',
              trend === 'neutral' && 'text-muted-foreground'
            )}
          >
            {trend === 'up' && '+'}{trend === 'down' && '-'}
          </span>
        )}
      </div>
    </div>
  );
}

/**
 * Funnel Stage Indicator
 */
function FunnelIndicator({
  stage,
  className,
}: {
  stage: string;
  className?: string;
}) {
  const stages = ['awareness', 'consideration', 'decision', 'action'];
  const currentIndex = stages.indexOf(stage);

  return (
    <div className={cn('space-y-2', className)}>
      <p className="text-xs text-muted-foreground">Funnel Stage</p>
      <div className="flex items-center gap-1">
        {stages.map((s, i) => (
          <React.Fragment key={s}>
            <div
              className={cn(
                'px-2 py-1 text-xs rounded capitalize',
                i <= currentIndex
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground'
              )}
            >
              {s}
            </div>
            {i < stages.length - 1 && (
              <div
                className={cn(
                  'h-0.5 w-3',
                  i < currentIndex ? 'bg-primary' : 'bg-muted'
                )}
              />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

/**
 * Topic Badge List
 */
function TopicList({
  topics,
  maxDisplay = 5,
  className,
}: {
  topics: Array<{ topic: string; score: number }>;
  maxDisplay?: number;
  className?: string;
}) {
  const displayed = topics.slice(0, maxDisplay);
  const remaining = topics.length - maxDisplay;

  return (
    <div className={cn('space-y-2', className)}>
      <p className="text-xs text-muted-foreground">Topics Explored</p>
      <div className="flex flex-wrap gap-1.5">
        {displayed.map(({ topic, score }) => (
          <span
            key={topic}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-primary/10 text-primary"
          >
            {topic}
            <span className="text-[10px] opacity-60">{score}</span>
          </span>
        ))}
        {remaining > 0 && (
          <span className="text-xs text-muted-foreground self-center">
            +{remaining} more
          </span>
        )}
      </div>
    </div>
  );
}

/**
 * Depth Progress Bar
 */
function DepthProgress({
  currentDepth,
  progress,
  className,
}: {
  currentDepth: JourneyDepth;
  progress: number;
  className?: string;
}) {
  const milestone = DEPTH_MILESTONES[currentDepth];

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">Journey Depth</p>
        <span className="text-xs font-medium">{milestone.label}</span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
          className="h-full bg-primary rounded-full"
        />
      </div>
      <p className="text-xs text-muted-foreground">{milestone.description}</p>
    </div>
  );
}

/**
 * Readiness Badge
 */
function ReadinessBadge({
  readiness,
  className,
}: {
  readiness: string;
  className?: string;
}) {
  const colors: Record<string, string> = {
    low: 'bg-slate-100 text-slate-700',
    medium: 'bg-blue-100 text-blue-700',
    high: 'bg-orange-100 text-orange-700',
    ready: 'bg-green-100 text-green-700',
  };

  return (
    <span
      className={cn(
        'px-2.5 py-1 rounded-full text-xs font-medium capitalize',
        colors[readiness] || colors.low,
        className
      )}
    >
      {readiness} Readiness
    </span>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function ConversationAnalyticsWidget({
  className,
  variant = 'full',
  showTopics = true,
  showFunnel = true,
  showDepth = true,
  showRecommendations = true,
}: ConversationAnalyticsWidgetProps) {
  // Store hooks
  const conversationState = useConversationStore((state) => state);
  const { engagementScore, currentFunnelStage, conversionReadiness, sectionsGenerated, currentDepth } =
    useEngagementMetrics();
  const { topicsExplored, topicOrder } = useTopicEngagement();
  const { detectedPersona, personaConfidence } = usePersonaInfo();

  // Computed values
  const engagementAnalysis = useMemo(
    () => analyzeEngagement(conversationState),
    [conversationState]
  );

  const journeyProgress = useMemo(
    () => getJourneyProgress(conversationState),
    [conversationState]
  );

  const keyInterests = useMemo(
    () => getKeyInterests(topicsExplored),
    [topicsExplored]
  );

  const sessionDuration = useMemo(() => {
    const start = new Date(conversationState.startedAt).getTime();
    const now = Date.now();
    const seconds = Math.floor((now - start) / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ${minutes % 60}m`;
  }, [conversationState.startedAt]);

  // ============================================================================
  // MINIMAL VARIANT
  // ============================================================================

  if (variant === 'minimal') {
    return (
      <div className={cn('flex items-center gap-4', className)}>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Score:</span>
          <span className="font-semibold">{engagementScore}</span>
        </div>
        <ReadinessBadge readiness={conversionReadiness} />
      </div>
    );
  }

  // ============================================================================
  // COMPACT VARIANT
  // ============================================================================

  if (variant === 'compact') {
    return (
      <div className={cn('p-4 rounded-lg bg-card border', className)}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Journey Analytics</h3>
          <ReadinessBadge readiness={conversionReadiness} />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <MetricCard label="Score" value={engagementScore} />
          <MetricCard label="Sections" value={sectionsGenerated} />
          <MetricCard label="Topics" value={topicOrder.length} />
        </div>

        {showDepth && (
          <div className="mt-4">
            <DepthProgress
              currentDepth={currentDepth}
              progress={journeyProgress.progressToNext}
            />
          </div>
        )}
      </div>
    );
  }

  // ============================================================================
  // FULL VARIANT
  // ============================================================================

  return (
    <div className={cn('p-6 rounded-xl bg-card border', className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold">Conversation Analytics</h3>
          <p className="text-sm text-muted-foreground">
            Session: {sessionDuration}
          </p>
        </div>
        <ReadinessBadge readiness={conversionReadiness} />
      </div>

      {/* Main Score */}
      <div className="flex items-center justify-center mb-6">
        <ScoreRing
          score={engagementScore}
          max={150}
          label="Engagement Score"
          sublabel={engagementAnalysis.tier}
        />
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <MetricCard label="Sections" value={sectionsGenerated} />
        <MetricCard label="Topics" value={topicOrder.length} />
        <MetricCard label="Interactions" value={conversationState.totalInteractions} />
        <MetricCard
          label="Avg Time/Section"
          value={
            sectionsGenerated > 0
              ? `${Math.round(conversationState.totalTimeSpentMs / sectionsGenerated / 1000)}s`
              : '0s'
          }
        />
      </div>

      {/* Funnel Stage */}
      {showFunnel && (
        <div className="mb-6">
          <FunnelIndicator stage={currentFunnelStage} />
        </div>
      )}

      {/* Journey Depth */}
      {showDepth && (
        <div className="mb-6">
          <DepthProgress
            currentDepth={currentDepth}
            progress={journeyProgress.progressToNext}
          />
        </div>
      )}

      {/* Topics */}
      {showTopics && keyInterests.length > 0 && (
        <div className="mb-6">
          <TopicList topics={keyInterests} />
        </div>
      )}

      {/* Persona */}
      {detectedPersona && (
        <div className="mb-6 p-3 rounded-lg bg-muted/30 border">
          <p className="text-xs text-muted-foreground mb-1">Detected Persona</p>
          <div className="flex items-center justify-between">
            <span className="font-medium">{detectedPersona}</span>
            <span className="text-sm text-muted-foreground">
              {Math.round(personaConfidence * 100)}% confidence
            </span>
          </div>
        </div>
      )}

      {/* Recommendations */}
      {showRecommendations && engagementAnalysis.recommendations.length > 0 && (
        <div>
          <p className="text-xs text-muted-foreground mb-2">Recommendations</p>
          <ul className="space-y-1">
            {engagementAnalysis.recommendations.slice(0, 3).map((rec, i) => (
              <li key={i} className="text-sm flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// CONVENIENCE EXPORTS
// ============================================================================

export function ConversationAnalyticsCompact(
  props: Omit<ConversationAnalyticsWidgetProps, 'variant'>
) {
  return <ConversationAnalyticsWidget {...props} variant="compact" />;
}

export function ConversationAnalyticsMinimal(
  props: Omit<ConversationAnalyticsWidgetProps, 'variant'>
) {
  return <ConversationAnalyticsWidget {...props} variant="minimal" />;
}

export default ConversationAnalyticsWidget;
