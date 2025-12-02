/**
 * Adaptive Conversion CTA
 * Phase 6.4: Conversation Journey & Conversion Flow - Task #120
 *
 * A conversion CTA that adapts its prominence, styling, and messaging
 * based on the user's journey depth and engagement level.
 *
 * Features:
 * - Dynamic prominence levels (subtle -> primary)
 * - Position adaptation (inline -> sticky)
 * - Personalized messaging based on topics explored
 * - Animation intensity based on engagement
 */

'use client';

import React, { useMemo, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  useConversationStore,
  useEngagementMetrics,
  useTopicEngagement,
  usePersonaInfo,
  useShouldShowConversion,
  useConversionProminence,
} from '@/lib/stores';
import { getJourneyProgress, DEPTH_MILESTONES } from '@/lib/interactive/conversation/depth-tracker';
import type { ConversionProminence } from '@/lib/interactive/conversation/types';
import { CONVERSION_CTA_CONFIG } from '@/lib/interactive/conversation/types';

// ============================================================================
// TYPES
// ============================================================================

export interface AdaptiveConversionCTAProps {
  websiteId?: string;
  onConvert?: () => void;
  onDismiss?: () => void;
  className?: string;
  forceProminence?: ConversionProminence;
  customCTA?: {
    text?: string;
    subtext?: string;
    action?: string;
  };
  variant?: 'floating' | 'inline' | 'banner' | 'modal-trigger';
  position?: 'bottom-right' | 'bottom-center' | 'bottom-left' | 'top-center';
  showProgress?: boolean;
  allowDismiss?: boolean;
}

// ============================================================================
// CTA CONTENT BY PROMINENCE
// ============================================================================

const CTA_CONTENT: Record<ConversionProminence, {
  defaultText: string;
  defaultSubtext: string;
  icon: string;
}> = {
  subtle: {
    defaultText: 'Learn More',
    defaultSubtext: '',
    icon: 'arrow-right',
  },
  secondary: {
    defaultText: 'Get Started',
    defaultSubtext: 'See how we can help',
    icon: 'arrow-right',
  },
  prominent: {
    defaultText: 'Schedule a Demo',
    defaultSubtext: "You've explored a lot - let's talk",
    icon: 'calendar',
  },
  primary: {
    defaultText: 'Talk to Sales',
    defaultSubtext: "Ready to take the next step?",
    icon: 'phone',
  },
};

// ============================================================================
// COMPONENT
// ============================================================================

export function AdaptiveConversionCTA({
  websiteId,
  onConvert,
  onDismiss,
  className,
  forceProminence,
  customCTA,
  variant = 'floating',
  position = 'bottom-right',
  showProgress = true,
  allowDismiss = true,
}: AdaptiveConversionCTAProps) {
  // State
  const [isDismissed, setIsDismissed] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  // Store hooks
  const conversationState = useConversationStore((state) => state);
  const { engagementScore, currentDepth, sectionsGenerated } = useEngagementMetrics();
  const { topicOrder } = useTopicEngagement();
  const { detectedPersona } = usePersonaInfo();
  const shouldShow = useShouldShowConversion();
  const computedProminence = useConversionProminence();
  const markConversionPromptShown = useConversationStore((s) => s.markConversionPromptShown);
  const markConversionTriggered = useConversationStore((s) => s.markConversionTriggered);

  // Use forced prominence or computed
  const prominence = forceProminence || computedProminence;
  const config = CONVERSION_CTA_CONFIG[prominence];
  const content = CTA_CONTENT[prominence];

  // Journey progress
  const journeyProgress = useMemo(
    () => getJourneyProgress(conversationState),
    [conversationState]
  );

  // Generate personalized CTA text
  const ctaText = useMemo(() => {
    if (customCTA?.text) return customCTA.text;

    // Personalize based on topics
    if (topicOrder.length > 0 && prominence !== 'subtle') {
      const topTopic = topicOrder[0];
      if (prominence === 'primary') {
        return `Let's discuss ${topTopic}`;
      }
    }

    // Personalize based on persona
    if (detectedPersona && prominence === 'prominent') {
      return `Perfect for ${detectedPersona}s`;
    }

    return content.defaultText;
  }, [customCTA?.text, topicOrder, detectedPersona, prominence, content.defaultText]);

  // Generate personalized subtext
  const subtext = useMemo(() => {
    if (customCTA?.subtext) return customCTA.subtext;

    if (sectionsGenerated >= 4) {
      return `You've explored ${sectionsGenerated} topics - let's make it personal`;
    }

    return content.defaultSubtext;
  }, [customCTA?.subtext, sectionsGenerated, content.defaultSubtext]);

  // Mark as shown when rendered at prominent or higher
  useEffect(() => {
    if ((prominence === 'prominent' || prominence === 'primary') && shouldShow) {
      markConversionPromptShown();
    }
  }, [prominence, shouldShow, markConversionPromptShown]);

  // Handle conversion click
  const handleConvert = () => {
    markConversionTriggered();
    onConvert?.();
  };

  // Handle dismiss
  const handleDismiss = () => {
    setIsDismissed(true);
    onDismiss?.();
  };

  // Don't render if dismissed or shouldn't show
  if (isDismissed || (!shouldShow && !forceProminence)) {
    return null;
  }

  // ============================================================================
  // RENDER VARIANTS
  // ============================================================================

  // Inline variant
  if (variant === 'inline') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          'flex items-center gap-4 p-4 rounded-lg',
          prominence === 'subtle' && 'bg-muted/30',
          prominence === 'secondary' && 'bg-muted/50 border',
          prominence === 'prominent' && 'bg-primary/5 border border-primary/20',
          prominence === 'primary' && 'bg-primary/10 border-2 border-primary/30',
          className
        )}
      >
        <div className="flex-1">
          <p className={cn(
            'font-medium',
            prominence === 'primary' && 'text-lg'
          )}>
            {ctaText}
          </p>
          {config.showSubtext && subtext && (
            <p className="text-sm text-muted-foreground">{subtext}</p>
          )}
        </div>
        <Button
          onClick={handleConvert}
          size={config.size === 'xl' ? 'lg' : config.size === 'md' ? 'default' : config.size}
          variant={prominence === 'subtle' ? 'outline' : 'default'}
          className={cn(
            config.animate && 'animate-pulse'
          )}
        >
          {ctaText}
        </Button>
      </motion.div>
    );
  }

  // Banner variant
  if (variant === 'banner') {
    return (
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        exit={{ opacity: 0, height: 0 }}
        className={cn(
          'w-full py-3 px-4',
          prominence === 'subtle' && 'bg-muted',
          prominence === 'secondary' && 'bg-primary/5',
          prominence === 'prominent' && 'bg-primary/10',
          prominence === 'primary' && 'bg-primary text-primary-foreground',
          className
        )}
      >
        <div className="container mx-auto flex items-center justify-between">
          <div>
            <p className="font-medium">{ctaText}</p>
            {config.showSubtext && subtext && (
              <p className="text-sm opacity-80">{subtext}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={handleConvert}
              size="sm"
              variant={prominence === 'primary' ? 'secondary' : 'default'}
            >
              Get Started
            </Button>
            {allowDismiss && (
              <button
                onClick={handleDismiss}
                className="p-1 hover:opacity-80"
                aria-label="Dismiss"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}
          </div>
        </div>
      </motion.div>
    );
  }

  // Floating variant (default)
  const positionClasses = {
    'bottom-right': 'bottom-4 right-4',
    'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2',
    'bottom-left': 'bottom-4 left-4',
    'top-center': 'top-4 left-1/2 -translate-x-1/2',
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className={cn(
          'fixed z-50',
          config.position === 'sticky' && positionClasses[position],
          className
        )}
      >
        {/* Collapsed state for subtle */}
        {prominence === 'subtle' && !isExpanded && (
          <motion.button
            onClick={() => setIsExpanded(true)}
            whileHover={{ scale: 1.05 }}
            className="flex items-center gap-2 px-4 py-2 bg-background border rounded-full shadow-lg hover:shadow-xl transition-shadow"
          >
            <span className="text-sm font-medium">Need help?</span>
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
          </motion.button>
        )}

        {/* Expanded/prominent states */}
        {(prominence !== 'subtle' || isExpanded) && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              'bg-background rounded-xl shadow-xl border overflow-hidden',
              prominence === 'primary' && 'ring-2 ring-primary',
              config.size === 'xl' ? 'w-80' : 'w-72'
            )}
          >
            {/* Progress indicator */}
            {showProgress && (
              <div className="h-1 bg-muted">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${journeyProgress.progressToNext}%` }}
                  className="h-full bg-primary"
                  transition={{ duration: 1, ease: 'easeOut' }}
                />
              </div>
            )}

            <div className="p-4">
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className={cn(
                    'font-semibold',
                    config.size === 'xl' ? 'text-lg' : 'text-base'
                  )}>
                    {ctaText}
                  </h3>
                  {config.showSubtext && subtext && (
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {subtext}
                    </p>
                  )}
                </div>
                {allowDismiss && (
                  <button
                    onClick={handleDismiss}
                    className="p-1 text-muted-foreground hover:text-foreground"
                    aria-label="Dismiss"
                  >
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                )}
              </div>

              {/* Journey milestone badge */}
              {showProgress && journeyProgress.currentMilestone && (
                <div className="flex items-center gap-2 mb-3 text-sm">
                  <span
                    className={cn(
                      'px-2 py-0.5 rounded-full text-xs font-medium',
                      `bg-${journeyProgress.currentMilestone.color}-100`,
                      `text-${journeyProgress.currentMilestone.color}-700`
                    )}
                    style={{
                      backgroundColor: `var(--${journeyProgress.currentMilestone.color}-100, #e0e7ff)`,
                      color: `var(--${journeyProgress.currentMilestone.color}-700, #4338ca)`,
                    }}
                  >
                    {journeyProgress.currentMilestone.label}
                  </span>
                  <span className="text-muted-foreground">
                    {journeyProgress.totalSections} sections explored
                  </span>
                </div>
              )}

              {/* CTA Button */}
              <Button
                onClick={handleConvert}
                size={config.size === 'xl' ? 'lg' : config.size === 'md' ? 'default' : config.size}
                className={cn(
                  'w-full',
                  config.animate && prominence === 'primary' && 'animate-pulse'
                )}
              >
                {prominence === 'primary' ? "Let's Talk" : 'Get Started'}
                <svg
                  className="ml-2 h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M14 5l7 7m0 0l-7 7m7-7H3"
                  />
                </svg>
              </Button>

              {/* Secondary action */}
              {prominence !== 'subtle' && (
                <button
                  onClick={() => setIsExpanded(false)}
                  className="w-full text-center text-sm text-muted-foreground hover:text-foreground mt-2 py-1"
                >
                  Maybe later
                </button>
              )}
            </div>
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}

// ============================================================================
// CONVENIENCE EXPORTS
// ============================================================================

export function FloatingConversionCTA(props: Omit<AdaptiveConversionCTAProps, 'variant'>) {
  return <AdaptiveConversionCTA {...props} variant="floating" />;
}

export function InlineConversionCTA(props: Omit<AdaptiveConversionCTAProps, 'variant'>) {
  return <AdaptiveConversionCTA {...props} variant="inline" />;
}

export function BannerConversionCTA(props: Omit<AdaptiveConversionCTAProps, 'variant'>) {
  return <AdaptiveConversionCTA {...props} variant="banner" />;
}

export default AdaptiveConversionCTA;
