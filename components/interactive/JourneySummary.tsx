/**
 * Journey Summary Component
 * Phase 6.4: Conversation Journey & Conversion Flow - Task #118
 *
 * Displays a visual summary of the user's conversation journey.
 * Used in lead capture forms to show context and build trust.
 */

'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  useEngagementMetrics,
  useTopicEngagement,
  useConversationStore,
} from '@/lib/stores';
import { getEngagementTier } from '@/lib/interactive/conversation/types';

// ============================================================================
// TYPES
// ============================================================================

export interface JourneySummaryProps {
  topics?: string[];
  engagementScore?: number;
  sectionsViewed?: number;
  timeSpentMs?: number;
  className?: string;
  variant?: 'compact' | 'detailed' | 'inline' | 'visual';
  showScore?: boolean;
  showTopics?: boolean;
  showTime?: boolean;
  showProgress?: boolean;
  maxTopics?: number;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ${seconds % 60}s`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ${minutes % 60}m`;
}

function getTierColor(tier: string): string {
  switch (tier) {
    case 'qualified':
      return 'text-purple-600 bg-purple-100';
    case 'hot':
      return 'text-red-600 bg-red-100';
    case 'warm':
      return 'text-orange-600 bg-orange-100';
    default:
      return 'text-blue-600 bg-blue-100';
  }
}

function getTierLabel(tier: string): string {
  switch (tier) {
    case 'qualified':
      return 'Highly Engaged';
    case 'hot':
      return 'Very Interested';
    case 'warm':
      return 'Interested';
    default:
      return 'Exploring';
  }
}

// ============================================================================
// COMPONENTS
// ============================================================================

/**
 * Topic Badge
 */
function TopicBadge({
  topic,
  index,
}: {
  topic: string;
  index: number;
}) {
  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.1 }}
      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary"
    >
      {topic}
    </motion.span>
  );
}

/**
 * Progress Ring
 */
function ProgressRing({
  progress,
  size = 48,
  strokeWidth = 4,
}: {
  progress: number;
  size?: number;
  strokeWidth?: number;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  return (
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
          className="text-primary stroke-current"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
          style={{
            strokeDasharray: circumference,
          }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xs font-semibold">{Math.round(progress)}%</span>
      </div>
    </div>
  );
}

/**
 * Stat Card
 */
function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2 text-sm">
      {icon && <span className="text-muted-foreground">{icon}</span>}
      <span className="text-muted-foreground">{label}:</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function JourneySummary({
  topics: propTopics,
  engagementScore: propScore,
  sectionsViewed: propSections,
  timeSpentMs: propTime,
  className,
  variant = 'compact',
  showScore = true,
  showTopics = true,
  showTime = true,
  showProgress = false,
  maxTopics = 5,
}: JourneySummaryProps) {
  // Get data from store if not provided
  const storeMetrics = useEngagementMetrics();
  const storeTopics = useTopicEngagement();
  const conversationState = useConversationStore((state) => state);

  // Use props or store values
  const engagementScore = propScore ?? storeMetrics.engagementScore;
  const sectionsViewed = propSections ?? conversationState.sectionsGenerated;
  const timeSpentMs = propTime ?? conversationState.totalTimeSpentMs;
  const topics = propTopics ?? storeTopics.topicOrder;

  // Compute tier
  const tier = useMemo(() => getEngagementTier(engagementScore), [engagementScore]);
  const tierColor = getTierColor(tier);
  const tierLabel = getTierLabel(tier);

  // Progress percentage (capped at 100)
  const progressPercent = useMemo(() => {
    const maxScore = 150; // qualified threshold
    return Math.min(100, (engagementScore / maxScore) * 100);
  }, [engagementScore]);

  // Displayed topics
  const displayedTopics = useMemo(
    () => topics.slice(0, maxTopics),
    [topics, maxTopics]
  );

  const remainingTopics = topics.length - maxTopics;

  // ============================================================================
  // RENDER VARIANTS
  // ============================================================================

  // Inline variant - single line
  if (variant === 'inline') {
    return (
      <div className={cn('flex items-center gap-2 text-sm', className)}>
        {showTopics && displayedTopics.length > 0 && (
          <>
            <span className="text-muted-foreground">Interested in:</span>
            <span className="font-medium">
              {displayedTopics.join(', ')}
              {remainingTopics > 0 && ` +${remainingTopics} more`}
            </span>
          </>
        )}
        {showScore && (
          <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', tierColor)}>
            {tierLabel}
          </span>
        )}
      </div>
    );
  }

  // Visual variant - with progress ring
  if (variant === 'visual') {
    return (
      <div
        className={cn(
          'flex items-center gap-4 p-4 rounded-lg bg-muted/30 border',
          className
        )}
      >
        {showProgress && <ProgressRing progress={progressPercent} />}

        <div className="flex-1 min-w-0">
          {showTopics && displayedTopics.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-2">
              {displayedTopics.map((topic, index) => (
                <TopicBadge key={topic} topic={topic} index={index} />
              ))}
              {remainingTopics > 0 && (
                <span className="text-xs text-muted-foreground self-center">
                  +{remainingTopics} more
                </span>
              )}
            </div>
          )}

          <div className="flex items-center gap-4 text-sm">
            {sectionsViewed > 0 && (
              <StatCard label="Sections" value={sectionsViewed} />
            )}
            {showTime && timeSpentMs > 0 && (
              <StatCard label="Time" value={formatDuration(timeSpentMs)} />
            )}
            {showScore && (
              <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', tierColor)}>
                {tierLabel}
              </span>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Detailed variant - full breakdown
  if (variant === 'detailed') {
    return (
      <div className={cn('space-y-4 p-4 rounded-lg bg-muted/30 border', className)}>
        <div className="flex items-center justify-between">
          <h4 className="font-medium">Your Journey</h4>
          {showScore && (
            <span className={cn('px-2.5 py-1 rounded-full text-xs font-medium', tierColor)}>
              {tierLabel}
            </span>
          )}
        </div>

        {showTopics && displayedTopics.length > 0 && (
          <div>
            <p className="text-sm text-muted-foreground mb-2">Topics explored:</p>
            <div className="flex flex-wrap gap-1.5">
              {displayedTopics.map((topic, index) => (
                <TopicBadge key={topic} topic={topic} index={index} />
              ))}
              {remainingTopics > 0 && (
                <span className="text-xs text-muted-foreground self-center">
                  +{remainingTopics} more
                </span>
              )}
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 pt-2 border-t">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{sectionsViewed}</div>
            <div className="text-xs text-muted-foreground">Sections Viewed</div>
          </div>
          {showTime && (
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {formatDuration(timeSpentMs)}
              </div>
              <div className="text-xs text-muted-foreground">Time Spent</div>
            </div>
          )}
        </div>

        {showProgress && (
          <div className="pt-2 border-t">
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>Engagement Progress</span>
              <span>{Math.round(progressPercent)}%</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
                className="h-full bg-primary rounded-full"
              />
            </div>
          </div>
        )}
      </div>
    );
  }

  // Compact variant (default)
  return (
    <div
      className={cn(
        'flex items-center gap-3 p-3 rounded-lg bg-muted/30 border text-sm',
        className
      )}
    >
      <div className="flex-shrink-0">
        <svg
          className="h-5 w-5 text-primary"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </div>

      <div className="flex-1 min-w-0">
        {showTopics && displayedTopics.length > 0 ? (
          <p className="truncate">
            <span className="text-muted-foreground">Your interests: </span>
            <span className="font-medium">{displayedTopics.join(', ')}</span>
            {remainingTopics > 0 && (
              <span className="text-muted-foreground"> +{remainingTopics} more</span>
            )}
          </p>
        ) : (
          <p className="text-muted-foreground">
            You&apos;ve viewed {sectionsViewed} section{sectionsViewed !== 1 ? 's' : ''}
          </p>
        )}
      </div>

      {showScore && (
        <span className={cn('flex-shrink-0 px-2 py-0.5 rounded-full text-xs font-medium', tierColor)}>
          {tierLabel}
        </span>
      )}
    </div>
  );
}

// ============================================================================
// NAMED EXPORTS FOR CONVENIENCE
// ============================================================================

export function JourneySummaryCompact(props: Omit<JourneySummaryProps, 'variant'>) {
  return <JourneySummary {...props} variant="compact" />;
}

export function JourneySummaryDetailed(props: Omit<JourneySummaryProps, 'variant'>) {
  return <JourneySummary {...props} variant="detailed" />;
}

export function JourneySummaryVisual(props: Omit<JourneySummaryProps, 'variant'>) {
  return <JourneySummary {...props} variant="visual" showProgress />;
}

export function JourneySummaryInline(props: Omit<JourneySummaryProps, 'variant'>) {
  return <JourneySummary {...props} variant="inline" />;
}

export default JourneySummary;
