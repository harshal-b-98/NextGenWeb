'use client';

/**
 * InlineGeneratedSection Component
 * Phase 6: Conversational Marketing Platform
 *
 * Renders AI-generated marketing sections inline on the page.
 * Supports smooth animations, scroll-into-view, and follow-up CTAs.
 *
 * Features:
 * - Animated entry/exit transitions
 * - Automatic scroll into view
 * - Support for multiple section types (features, FAQ, pricing, etc.)
 * - Follow-up CTA buttons for continued conversation
 * - Loading and error states
 */

import React, { useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Loader2,
  AlertCircle,
  CheckCircle,
  ChevronRight,
  Sparkles,
  X,
} from 'lucide-react';
import { cn, container } from '@/lib/design-system';
import type { SectionContent, SuggestedCTA } from '@/lib/stores/generated-sections-store';
import { useChatContextOptional, type CTASource } from '@/lib/interactive/chat';

// ============================================================================
// TYPES
// ============================================================================

export interface InlineGeneratedSectionProps {
  /** Unique section ID */
  sectionId: string;
  /** CTA ID that triggered this section */
  sourceCtaId: string;
  /** Section content from AI generation */
  content: SectionContent | null;
  /** Whether the section is currently loading */
  isLoading?: boolean;
  /** Error message if generation failed */
  error?: string | null;
  /** Follow-up CTA suggestions */
  suggestedFollowUps?: SuggestedCTA[];
  /** Animation state */
  animationState?: 'entering' | 'visible' | 'exiting' | 'hidden';
  /** Whether to scroll into view when appearing */
  scrollIntoView?: boolean;
  /** Callback when a follow-up CTA is clicked */
  onFollowUpClick?: (followUp: SuggestedCTA) => void;
  /** Callback when close button is clicked */
  onClose?: () => void;
  /** Whether to show close button */
  showCloseButton?: boolean;
  /** Additional CSS classes */
  className?: string;
}

// ============================================================================
// INLINE GENERATED SECTION COMPONENT
// ============================================================================

export function InlineGeneratedSection({
  sectionId,
  sourceCtaId,
  content,
  isLoading = false,
  error = null,
  suggestedFollowUps = [],
  animationState = 'visible',
  scrollIntoView = true,
  onFollowUpClick,
  onClose,
  showCloseButton = true,
  className,
}: InlineGeneratedSectionProps) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const chatContext = useChatContextOptional();

  // Scroll into view when section appears
  useEffect(() => {
    if (scrollIntoView && sectionRef.current && !isLoading && content) {
      // Slight delay to allow animation to start
      const timeout = setTimeout(() => {
        sectionRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
      }, 100);
      return () => clearTimeout(timeout);
    }
  }, [scrollIntoView, isLoading, content]);

  // Handle follow-up CTA click
  const handleFollowUpClick = useCallback(
    (followUp: SuggestedCTA) => {
      if (onFollowUpClick) {
        onFollowUpClick(followUp);
        return;
      }

      // Default behavior: trigger chat context
      if (chatContext) {
        const ctaSource: CTASource = {
          ctaId: `${sectionId}-followup-${followUp.topic}`,
          ctaType: 'inline-cta',
          ctaText: followUp.text,
          sectionId,
          metadata: {
            topic: followUp.topic,
            priority: followUp.priority,
          },
        };

        chatContext.triggerFromCTA(ctaSource, {
          renderMode: 'inline-section',
        });
      }
    },
    [sectionId, chatContext, onFollowUpClick]
  );

  // Animation variants
  const containerVariants = {
    entering: { opacity: 0, y: 20, scale: 0.98 },
    visible: { opacity: 1, y: 0, scale: 1 },
    exiting: { opacity: 0, y: -10, scale: 0.98 },
    hidden: { opacity: 0, height: 0, margin: 0, padding: 0 },
  };

  return (
    <AnimatePresence mode="wait">
      {animationState !== 'hidden' && (
        <motion.div
          ref={sectionRef}
          key={sectionId}
          variants={containerVariants}
          initial="entering"
          animate={animationState}
          exit="exiting"
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className={cn(
            'relative overflow-hidden',
            'my-8 rounded-xl border border-[var(--color-border)]',
            'bg-gradient-to-br from-[var(--color-muted)]/30 to-[var(--color-background)]',
            'shadow-sm',
            className
          )}
          data-section-id={sectionId}
          data-source-cta={sourceCtaId}
        >
          {/* Generated Badge */}
          <div className="absolute top-3 left-3 flex items-center gap-1.5 text-xs text-[var(--color-muted-foreground)]">
            <Sparkles className="w-3 h-3 text-[var(--color-primary)]" />
            <span>AI Generated</span>
          </div>

          {/* Close Button */}
          {showCloseButton && onClose && (
            <button
              onClick={onClose}
              className={cn(
                'absolute top-3 right-3 p-1.5 rounded-full',
                'text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]',
                'hover:bg-[var(--color-muted)]',
                'transition-colors'
              )}
              aria-label="Close section"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          {/* Content Area */}
          <div className={cn(container('md'), 'py-10 px-6')}>
            {/* Loading State */}
            {isLoading && (
              <LoadingState />
            )}

            {/* Error State */}
            {error && !isLoading && (
              <ErrorState error={error} />
            )}

            {/* Content */}
            {content && !isLoading && !error && (
              <>
                <SectionContentRenderer content={content} />

                {/* Follow-up CTAs */}
                {suggestedFollowUps.length > 0 && (
                  <FollowUpCTAs
                    followUps={suggestedFollowUps}
                    onFollowUpClick={handleFollowUpClick}
                  />
                )}
              </>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ============================================================================
// LOADING STATE
// ============================================================================

function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
      >
        <Loader2 className="w-8 h-8 text-[var(--color-primary)]" />
      </motion.div>
      <p className="mt-4 text-sm text-[var(--color-muted-foreground)]">
        Generating personalized content...
      </p>
      <div className="mt-6 flex gap-2">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-2 h-2 rounded-full bg-[var(--color-primary)]"
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{
              duration: 1.2,
              repeat: Infinity,
              delay: i * 0.2,
            }}
          />
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// ERROR STATE
// ============================================================================

function ErrorState({ error }: { error: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
        <AlertCircle className="w-6 h-6 text-red-600" />
      </div>
      <h3 className="mt-4 text-lg font-medium text-[var(--color-foreground)]">
        Unable to generate content
      </h3>
      <p className="mt-2 text-sm text-[var(--color-muted-foreground)] max-w-md">
        {error}
      </p>
      <button className="mt-4 px-4 py-2 text-sm font-medium text-[var(--color-primary)] hover:bg-[var(--color-primary-light)] rounded-lg transition-colors">
        Try again
      </button>
    </div>
  );
}

// ============================================================================
// SECTION CONTENT RENDERER
// ============================================================================

interface SectionContentRendererProps {
  content: SectionContent;
}

function SectionContentRenderer({ content }: SectionContentRendererProps) {
  switch (content.type) {
    case 'features-grid':
    case 'features-cards':
      return <FeaturesSection content={content} />;

    case 'faq-accordion':
      return <FAQSection content={content} />;

    case 'pricing-table':
      return <PricingSection content={content} />;

    case 'comparison-table':
      return <ComparisonSection content={content} />;

    case 'testimonials':
      return <TestimonialsSection content={content} />;

    case 'timeline':
      return <TimelineSection content={content} />;

    case 'stats-display':
      return <StatsSection content={content} />;

    case 'cta-block':
      return <CTABlockSection content={content} />;

    case 'text-block':
    default:
      return <TextBlockSection content={content} />;
  }
}

// ============================================================================
// SECTION TYPE COMPONENTS
// ============================================================================

function FeaturesSection({ content }: { content: SectionContent }) {
  return (
    <div className="text-center">
      {content.headline && (
        <h2 className="text-2xl font-bold text-[var(--color-foreground)]">
          {content.headline}
        </h2>
      )}
      {content.subheadline && (
        <p className="mt-2 text-[var(--color-muted-foreground)]">
          {content.subheadline}
        </p>
      )}
      <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {content.items.map((item) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="p-6 rounded-lg bg-[var(--color-background)] border border-[var(--color-border)] text-left"
          >
            {item.icon && (
              <div className="w-10 h-10 rounded-lg bg-[var(--color-primary-light)] flex items-center justify-center text-[var(--color-primary)] mb-4">
                <CheckCircle className="w-5 h-5" />
              </div>
            )}
            <h3 className="font-semibold text-[var(--color-foreground)]">
              {item.title}
            </h3>
            <p className="mt-2 text-sm text-[var(--color-muted-foreground)]">
              {item.description}
            </p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function FAQSection({ content }: { content: SectionContent }) {
  return (
    <div>
      {content.headline && (
        <h2 className="text-2xl font-bold text-[var(--color-foreground)] text-center mb-8">
          {content.headline}
        </h2>
      )}
      <div className="space-y-3 max-w-2xl mx-auto">
        {content.items.map((item) => (
          <details
            key={item.id}
            className="group rounded-lg border border-[var(--color-border)] bg-[var(--color-background)]"
          >
            <summary className="px-5 py-4 cursor-pointer text-[var(--color-foreground)] font-medium list-none flex items-center justify-between">
              {item.question || item.title}
              <ChevronRight className="w-5 h-5 text-[var(--color-muted-foreground)] transition-transform group-open:rotate-90" />
            </summary>
            <div className="px-5 pb-4 text-[var(--color-muted-foreground)]">
              {item.answer || item.description}
            </div>
          </details>
        ))}
      </div>
    </div>
  );
}

function PricingSection({ content }: { content: SectionContent }) {
  return (
    <div className="text-center">
      {content.headline && (
        <h2 className="text-2xl font-bold text-[var(--color-foreground)]">
          {content.headline}
        </h2>
      )}
      <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {content.items.map((item) => (
          <div
            key={item.id}
            className={cn(
              'p-6 rounded-lg border bg-[var(--color-background)]',
              item.label === 'Most Popular'
                ? 'border-[var(--color-primary)] ring-2 ring-[var(--color-primary)]'
                : 'border-[var(--color-border)]'
            )}
          >
            {item.label && (
              <span className="inline-block px-3 py-1 text-xs font-medium rounded-full bg-[var(--color-primary)] text-white mb-4">
                {item.label}
              </span>
            )}
            <h3 className="text-lg font-semibold text-[var(--color-foreground)]">
              {item.title}
            </h3>
            {item.value && (
              <p className="mt-2 text-3xl font-bold text-[var(--color-primary)]">
                {item.value}
              </p>
            )}
            <p className="mt-4 text-sm text-[var(--color-muted-foreground)]">
              {item.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function ComparisonSection({ content }: { content: SectionContent }) {
  return (
    <div>
      {content.headline && (
        <h2 className="text-2xl font-bold text-[var(--color-foreground)] text-center mb-8">
          {content.headline}
        </h2>
      )}
      <div className="overflow-x-auto">
        <table className="w-full">
          <tbody>
            {content.items.map((item) => (
              <tr key={item.id} className="border-b border-[var(--color-border)]">
                <td className="py-3 px-4 font-medium text-[var(--color-foreground)]">
                  {item.title}
                </td>
                <td className="py-3 px-4 text-[var(--color-muted-foreground)]">
                  {item.description}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function TestimonialsSection({ content }: { content: SectionContent }) {
  return (
    <div className="text-center">
      {content.headline && (
        <h2 className="text-2xl font-bold text-[var(--color-foreground)] mb-8">
          {content.headline}
        </h2>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {content.items.map((item) => (
          <div
            key={item.id}
            className="p-6 rounded-lg bg-[var(--color-background)] border border-[var(--color-border)] text-left"
          >
            <p className="text-[var(--color-foreground)] italic">
              &ldquo;{item.description}&rdquo;
            </p>
            <div className="mt-4">
              <p className="font-medium text-[var(--color-foreground)]">
                {item.title}
              </p>
              {item.label && (
                <p className="text-sm text-[var(--color-muted-foreground)]">
                  {item.label}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TimelineSection({ content }: { content: SectionContent }) {
  return (
    <div>
      {content.headline && (
        <h2 className="text-2xl font-bold text-[var(--color-foreground)] text-center mb-8">
          {content.headline}
        </h2>
      )}
      <div className="relative max-w-2xl mx-auto">
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-[var(--color-border)]" />
        <div className="space-y-8">
          {content.items.map((item, index) => (
            <div key={item.id} className="relative pl-12">
              <div className="absolute left-0 w-8 h-8 rounded-full bg-[var(--color-primary)] text-white flex items-center justify-center text-sm font-medium">
                {item.label || index + 1}
              </div>
              <h3 className="font-semibold text-[var(--color-foreground)]">
                {item.title}
              </h3>
              <p className="mt-1 text-[var(--color-muted-foreground)]">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatsSection({ content }: { content: SectionContent }) {
  return (
    <div className="text-center">
      {content.headline && (
        <h2 className="text-2xl font-bold text-[var(--color-foreground)] mb-8">
          {content.headline}
        </h2>
      )}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {content.items.map((item) => (
          <div key={item.id} className="p-4">
            <p className="text-3xl font-bold text-[var(--color-primary)]">
              {item.value}
            </p>
            <p className="mt-1 text-sm font-medium text-[var(--color-foreground)]">
              {item.title}
            </p>
            {item.description && (
              <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">
                {item.description}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function CTABlockSection({ content }: { content: SectionContent }) {
  return (
    <div className="text-center py-8 px-6 rounded-lg bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-hover)]">
      {content.headline && (
        <h2 className="text-2xl font-bold text-white">
          {content.headline}
        </h2>
      )}
      {content.subheadline && (
        <p className="mt-2 text-white/90">
          {content.subheadline}
        </p>
      )}
      {content.cta && (
        <button
          className={cn(
            'mt-6 px-6 py-3 rounded-lg font-semibold transition-colors',
            content.cta.variant === 'primary'
              ? 'bg-white text-[var(--color-primary)] hover:bg-white/90'
              : 'bg-transparent border-2 border-white text-white hover:bg-white/10'
          )}
        >
          {content.cta.text}
        </button>
      )}
    </div>
  );
}

function TextBlockSection({ content }: { content: SectionContent }) {
  return (
    <div className="prose prose-lg max-w-none">
      {content.headline && (
        <h2 className="text-2xl font-bold text-[var(--color-foreground)] mb-4">
          {content.headline}
        </h2>
      )}
      {content.items.map((item) => (
        <div key={item.id}>
          {item.title && (
            <h3 className="text-lg font-semibold text-[var(--color-foreground)] mt-4">
              {item.title}
            </h3>
          )}
          <p className="text-[var(--color-muted-foreground)]">
            {item.description}
          </p>
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// FOLLOW-UP CTAS
// ============================================================================

interface FollowUpCTAsProps {
  followUps: SuggestedCTA[];
  onFollowUpClick: (followUp: SuggestedCTA) => void;
}

function FollowUpCTAs({ followUps, onFollowUpClick }: FollowUpCTAsProps) {
  return (
    <div className="mt-10 pt-6 border-t border-[var(--color-border)]">
      <p className="text-sm text-[var(--color-muted-foreground)] text-center mb-4">
        Want to learn more?
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        {followUps.map((followUp, index) => (
          <motion.button
            key={index}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            onClick={() => onFollowUpClick(followUp)}
            className={cn(
              'inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium',
              'transition-all duration-200',
              followUp.priority === 'high'
                ? 'bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)]'
                : 'bg-[var(--color-muted)] text-[var(--color-foreground)] hover:bg-[var(--color-border)]'
            )}
          >
            {followUp.text}
            <ChevronRight className="w-4 h-4" />
          </motion.button>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// EXPORTS
// ============================================================================

export default InlineGeneratedSection;
