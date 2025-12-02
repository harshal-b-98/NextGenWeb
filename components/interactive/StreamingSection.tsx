/**
 * StreamingSection Component
 * Phase 6: Conversational Marketing Platform
 *
 * Renders AI-generated marketing sections with real-time streaming support.
 * Shows content progressively as it's generated for better user experience.
 *
 * Features:
 * - Real-time streaming display with typing effect
 * - Progressive JSON parsing for structured content
 * - Smooth transitions between streaming and final states
 * - Knowledge source attribution
 * - Fallback to InlineGeneratedSection for final render
 */

'use client';

import React, { useEffect, useRef, useCallback, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Loader2,
  AlertCircle,
  Sparkles,
  X,
  Database,
  CheckCircle2,
} from 'lucide-react';
import { cn, container } from '@/lib/design-system';
import {
  useStreamingSection,
  parsePartialContent,
  type StreamingSectionRequest,
  type KnowledgeSource,
} from '@/lib/hooks/use-streaming-section';
import { InlineGeneratedSection } from './InlineGeneratedSection';
import type { SectionContent, SuggestedCTA } from '@/lib/stores/generated-sections-store';
import type { CTASource } from '@/lib/interactive/chat';

// ============================================================================
// TYPES
// ============================================================================

export interface StreamingSectionProps {
  /** Unique section ID */
  sectionId: string;
  /** Website ID for knowledge retrieval */
  websiteId: string;
  /** CTA source that triggered generation */
  ctaSource: CTASource;
  /** Optional custom message/query */
  customMessage?: string;
  /** Persona hint for adaptation */
  personaHint?: string;
  /** Session ID for context */
  sessionId?: string;
  /** Whether to auto-start generation */
  autoStart?: boolean;
  /** Whether to scroll into view when appearing */
  scrollIntoView?: boolean;
  /** Callback when generation completes */
  onComplete?: (result: {
    section: SectionContent;
    sources: KnowledgeSource[];
    followUps: SuggestedCTA[];
  }) => void;
  /** Callback when error occurs */
  onError?: (error: string) => void;
  /** Callback when a follow-up CTA is clicked */
  onFollowUpClick?: (followUp: SuggestedCTA) => void;
  /** Callback when close button is clicked */
  onClose?: () => void;
  /** Whether to show close button */
  showCloseButton?: boolean;
  /** Whether to show knowledge sources */
  showSources?: boolean;
  /** Additional CSS classes */
  className?: string;
}

// ============================================================================
// STREAMING SECTION COMPONENT
// ============================================================================

export function StreamingSection({
  sectionId,
  websiteId,
  ctaSource,
  customMessage,
  personaHint,
  sessionId,
  autoStart = true,
  scrollIntoView = true,
  onComplete,
  onError,
  onFollowUpClick,
  onClose,
  showCloseButton = true,
  showSources = false,
  className,
}: StreamingSectionProps) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [hasStarted, setHasStarted] = useState(false);

  // Use the streaming hook
  const { state, generate, abort, reset, isStreaming, isComplete, hasError } =
    useStreamingSection();

  // Build request
  const request: StreamingSectionRequest = useMemo(
    () => ({
      websiteId,
      ctaSource,
      customMessage,
      renderMode: 'inline-section',
      personaHint,
      sessionId,
    }),
    [websiteId, ctaSource, customMessage, personaHint, sessionId]
  );

  // Auto-start generation if enabled
  useEffect(() => {
    if (autoStart && !hasStarted) {
      setHasStarted(true);
      generate(request);
    }
  }, [autoStart, hasStarted, generate, request]);

  // Handle completion
  useEffect(() => {
    if (isComplete && state.section && onComplete) {
      // Parse the section content
      const { parsed } = parsePartialContent(
        typeof state.section.content === 'string'
          ? state.section.content
          : JSON.stringify(state.section.content)
      );

      onComplete({
        section: (parsed as SectionContent) || {
          type: 'text-block',
          items: [{ id: '1', title: '', description: state.content }],
        },
        sources: state.sources,
        followUps: state.suggestedFollowUps as SuggestedCTA[],
      });
    }
  }, [isComplete, state.section, state.sources, state.suggestedFollowUps, state.content, onComplete]);

  // Handle error
  useEffect(() => {
    if (hasError && state.error && onError) {
      onError(state.error);
    }
  }, [hasError, state.error, onError]);

  // Scroll into view when streaming starts
  useEffect(() => {
    if (scrollIntoView && isStreaming && sectionRef.current) {
      const timeout = setTimeout(() => {
        sectionRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
      }, 100);
      return () => clearTimeout(timeout);
    }
  }, [scrollIntoView, isStreaming]);

  // Manual start
  const handleStart = useCallback(() => {
    generate(request);
  }, [generate, request]);

  // Handle close
  const handleClose = useCallback(() => {
    abort();
    reset();
    onClose?.();
  }, [abort, reset, onClose]);

  // Parse streaming content for preview
  const parsedPreview = useMemo(() => {
    if (!state.content) return null;
    const { parsed, isComplete: isJsonComplete } = parsePartialContent(state.content);
    return { parsed, isJsonComplete };
  }, [state.content]);

  // When complete, render the final InlineGeneratedSection
  if (isComplete && state.section) {
    const finalContent =
      parsedPreview?.parsed ||
      (typeof state.section.content === 'string'
        ? JSON.parse(state.section.content)
        : state.section.content);

    return (
      <InlineGeneratedSection
        sectionId={sectionId}
        sourceCtaId={ctaSource.ctaId}
        content={finalContent as SectionContent}
        suggestedFollowUps={state.suggestedFollowUps as SuggestedCTA[]}
        onFollowUpClick={onFollowUpClick}
        onClose={onClose}
        showCloseButton={showCloseButton}
        className={className}
      />
    );
  }

  return (
    <motion.div
      ref={sectionRef}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className={cn(
        'relative overflow-hidden',
        'my-8 rounded-xl border border-[var(--color-border)]',
        'bg-gradient-to-br from-[var(--color-muted)]/30 to-[var(--color-background)]',
        'shadow-sm',
        className
      )}
      data-section-id={sectionId}
      data-source-cta={ctaSource.ctaId}
    >
      {/* Generated Badge */}
      <div className="absolute top-3 left-3 flex items-center gap-1.5 text-xs text-[var(--color-muted-foreground)]">
        <Sparkles className="w-3 h-3 text-[var(--color-primary)]" />
        <span>{isStreaming ? 'Generating...' : 'AI Generated'}</span>
      </div>

      {/* Close Button */}
      {showCloseButton && (
        <button
          onClick={handleClose}
          className={cn(
            'absolute top-3 right-3 p-1.5 rounded-full',
            'text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]',
            'hover:bg-[var(--color-muted)]',
            'transition-colors z-10'
          )}
          aria-label="Close section"
        >
          <X className="w-4 h-4" />
        </button>
      )}

      {/* Content Area */}
      <div className={cn(container('md'), 'py-10 px-6')}>
        {/* Initial/Idle State */}
        {state.status === 'idle' && !autoStart && (
          <IdleState onStart={handleStart} ctaText={ctaSource.ctaText} />
        )}

        {/* Connecting State */}
        {state.status === 'connecting' && <ConnectingState />}

        {/* Streaming State */}
        {isStreaming && state.content && (
          <StreamingContent
            content={state.content}
            parsedPreview={parsedPreview?.parsed}
            metadata={state.metadata}
            chunkCount={state.chunkCount}
          />
        )}

        {/* Error State */}
        {hasError && (
          <ErrorState error={state.error || 'Unknown error'} onRetry={handleStart} />
        )}

        {/* Knowledge Sources */}
        {showSources && state.sources.length > 0 && (
          <SourcesIndicator sources={state.sources} />
        )}
      </div>
    </motion.div>
  );
}

// ============================================================================
// IDLE STATE
// ============================================================================

function IdleState({
  onStart,
  ctaText,
}: {
  onStart: () => void;
  ctaText: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="w-16 h-16 rounded-full bg-[var(--color-primary-light)] flex items-center justify-center mb-4">
        <Sparkles className="w-8 h-8 text-[var(--color-primary)]" />
      </div>
      <h3 className="text-lg font-semibold text-[var(--color-foreground)]">
        Ready to Generate
      </h3>
      <p className="mt-2 text-sm text-[var(--color-muted-foreground)] max-w-md">
        Click below to generate personalized content about &ldquo;{ctaText}&rdquo;
      </p>
      <button
        onClick={onStart}
        className="mt-6 px-6 py-2.5 bg-[var(--color-primary)] text-white rounded-lg font-medium hover:bg-[var(--color-primary-hover)] transition-colors"
      >
        Generate Content
      </button>
    </div>
  );
}

// ============================================================================
// CONNECTING STATE
// ============================================================================

function ConnectingState() {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
      >
        <Loader2 className="w-8 h-8 text-[var(--color-primary)]" />
      </motion.div>
      <p className="mt-4 text-sm text-[var(--color-muted-foreground)]">
        Connecting to AI...
      </p>
    </div>
  );
}

// ============================================================================
// STREAMING CONTENT
// ============================================================================

interface StreamingContentProps {
  content: string;
  parsedPreview: unknown | null;
  metadata: { intent: { category: string; confidence: number }; sectionType: string } | null;
  chunkCount: number;
}

function StreamingContent({
  content,
  parsedPreview,
  metadata,
  chunkCount,
}: StreamingContentProps) {
  // If we can parse the content as structured data, show a preview
  if (parsedPreview && typeof parsedPreview === 'object') {
    const preview = parsedPreview as Partial<SectionContent>;

    return (
      <div className="space-y-4">
        {/* Streaming indicator */}
        <div className="flex items-center gap-2 text-sm text-[var(--color-muted-foreground)]">
          <motion.div
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="w-2 h-2 rounded-full bg-green-500"
          />
          <span>Generating content ({chunkCount} chunks received)</span>
          {metadata && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--color-muted)]">
              {metadata.sectionType}
            </span>
          )}
        </div>

        {/* Preview content */}
        <div className="animate-pulse-subtle">
          {preview.headline && (
            <h2 className="text-2xl font-bold text-[var(--color-foreground)] mb-4">
              {preview.headline}
            </h2>
          )}
          {preview.subheadline && (
            <p className="text-[var(--color-muted-foreground)] mb-4">
              {preview.subheadline}
            </p>
          )}
          {preview.items && preview.items.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {preview.items.slice(0, 6).map((item, i) => (
                <div
                  key={item.id || i}
                  className="p-4 rounded-lg bg-[var(--color-background)] border border-[var(--color-border)]"
                >
                  <h3 className="font-semibold text-[var(--color-foreground)]">
                    {item.title || 'Loading...'}
                  </h3>
                  <p className="mt-2 text-sm text-[var(--color-muted-foreground)]">
                    {item.description || '...'}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Raw text streaming display
  return (
    <div className="space-y-4">
      {/* Streaming indicator */}
      <div className="flex items-center gap-2 text-sm text-[var(--color-muted-foreground)]">
        <motion.div
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="w-2 h-2 rounded-full bg-green-500"
        />
        <span>Generating content...</span>
      </div>

      {/* Raw content with typing effect */}
      <div className="font-mono text-sm text-[var(--color-muted-foreground)] bg-[var(--color-muted)]/30 p-4 rounded-lg overflow-auto max-h-64">
        <pre className="whitespace-pre-wrap break-words">
          {content}
          <motion.span
            animate={{ opacity: [1, 0] }}
            transition={{ duration: 0.5, repeat: Infinity }}
            className="inline-block w-2 h-4 bg-[var(--color-primary)] ml-0.5"
          />
        </pre>
      </div>
    </div>
  );
}

// ============================================================================
// ERROR STATE
// ============================================================================

function ErrorState({ error, onRetry }: { error: string; onRetry: () => void }) {
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
      <button
        onClick={onRetry}
        className="mt-4 px-4 py-2 text-sm font-medium text-[var(--color-primary)] hover:bg-[var(--color-primary-light)] rounded-lg transition-colors"
      >
        Try again
      </button>
    </div>
  );
}

// ============================================================================
// SOURCES INDICATOR
// ============================================================================

function SourcesIndicator({ sources }: { sources: KnowledgeSource[] }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="mt-6 pt-4 border-t border-[var(--color-border)]">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 text-sm text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] transition-colors"
      >
        <Database className="w-4 h-4" />
        <span>
          {sources.length} knowledge source{sources.length !== 1 ? 's' : ''} used
        </span>
        <CheckCircle2 className="w-4 h-4 text-green-500" />
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="mt-3 space-y-2 overflow-hidden"
          >
            {sources.map((source) => (
              <div
                key={source.id}
                className="flex items-center gap-2 text-xs text-[var(--color-muted-foreground)]"
              >
                <span className="px-2 py-0.5 rounded bg-[var(--color-muted)]">
                  {source.entityType}
                </span>
                <span>{source.relevance}% relevance</span>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================================================
// EXPORTS
// ============================================================================

export default StreamingSection;
