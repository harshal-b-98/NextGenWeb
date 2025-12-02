'use client';

/**
 * ConversationalPage Container Component
 * Phase 6: Conversational Marketing Platform
 *
 * The main container that orchestrates the conversational page experience.
 * Renders the hero section and dynamically generated inline sections.
 *
 * Features:
 * - Renders HeroConversational at the top
 * - Dynamically renders InlineGeneratedSections below
 * - Manages section ordering and animations
 * - Integrates with ChatContext and GeneratedSectionsStore
 * - Handles scroll management for new sections
 * - Provides context for child components
 */

import React, { useCallback, useEffect, useId, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HeroConversational,
  type HeroConversationalProps,
  type ConversationalCTAConfig,
} from '@/components/marketing/heroes';
import { InlineGeneratedSection } from './InlineGeneratedSection';
import {
  useVisibleSections,
  useSectionActions,
  useIsGenerating,
  type GeneratedSectionData,
} from '@/lib/stores';
import {
  ChatProvider,
  useChatContext,
  type CTASource,
} from '@/lib/interactive/chat/chat-context';
import { cn } from '@/lib/design-system';

// ============================================================================
// TYPES
// ============================================================================

export interface ConversationalPageProps {
  /** Website ID for API calls */
  websiteId: string;
  /** Hero configuration */
  hero: {
    headline: string;
    subheadline?: string;
    description?: string;
    badge?: string;
    backgroundVariant?: HeroConversationalProps['backgroundVariant'];
    chatPrompt?: string;
    showChatBubble?: boolean;
  };
  /** Initial CTAs to display in the hero */
  initialCTAs: ConversationalCTAConfig[];
  /** Optional children to render below generated sections */
  children?: ReactNode;
  /** Callback when a section is generated */
  onSectionGenerated?: (section: GeneratedSectionData) => void;
  /** Callback when an error occurs */
  onError?: (error: Error) => void;
  /** Additional CSS classes */
  className?: string;
}

// ============================================================================
// INNER COMPONENT (requires ChatContext)
// ============================================================================

interface ConversationalPageInnerProps extends ConversationalPageProps {
  uniqueId: string;
}

function ConversationalPageInner({
  websiteId,
  hero,
  initialCTAs,
  children,
  onSectionGenerated,
  onError,
  className,
  uniqueId,
}: ConversationalPageInnerProps) {
  const chatContext = useChatContext();
  const visibleSections = useVisibleSections();
  const isGenerating = useIsGenerating();
  const {
    startSectionGeneration,
    completeSectionGeneration,
    failSectionGeneration,
    hideSection,
  } = useSectionActions();

  /**
   * Handle CTA click from the hero
   * Triggers the section generation flow
   */
  const handleCTAClick = useCallback(
    async (cta: ConversationalCTAConfig, ctaSource: CTASource) => {
      const sectionId = `section-${uniqueId}-${Date.now()}`;

      // Start generation (shows loading placeholder)
      startSectionGeneration({
        sectionId,
        sourceCtaId: ctaSource.ctaId,
      });

      try {
        // Call the section generation API
        const response = await fetch('/api/generate/section', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            websiteId,
            ctaSource,
            customMessage: cta.promptOverride,
            renderMode: 'inline-section',
            personaHint: chatContext.getPersonaHint(),
            sessionId: chatContext.journey?.sessionId,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || `API error: ${response.status}`);
        }

        const data = await response.json();

        if (!data.success) {
          throw new Error(data.error || 'Failed to generate section');
        }

        // Complete generation with content
        completeSectionGeneration({
          sectionId,
          content: data.section.content,
          sectionType: data.section.sectionType,
          suggestedFollowUps: data.suggestedFollowUps || [],
          intent: data.intent,
          knowledgeSourceCount: data.knowledgeSourceCount || 0,
          tokensUsed: data.tokensUsed || 0,
        });

        // Track topic in journey
        if (cta.topic) {
          chatContext.addJourneyTopic(cta.topic);
        }

        // Increment engagement
        chatContext.incrementEngagement();

        // Notify callback
        const sectionData = {
          id: sectionId,
          sourceCtaId: ctaSource.ctaId,
          sectionType: data.section.sectionType,
          content: data.section.content,
          suggestedFollowUps: data.suggestedFollowUps || [],
          isLoading: false,
          error: null,
          animationState: 'visible' as const,
          createdAt: new Date().toISOString(),
          intent: data.intent,
          knowledgeSourceCount: data.knowledgeSourceCount || 0,
          tokensUsed: data.tokensUsed || 0,
        };
        onSectionGenerated?.(sectionData);
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error occurred';

        failSectionGeneration({
          sectionId,
          error: errorMessage,
        });

        onError?.(error instanceof Error ? error : new Error(errorMessage));
      }
    },
    [
      uniqueId,
      websiteId,
      chatContext,
      startSectionGeneration,
      completeSectionGeneration,
      failSectionGeneration,
      onSectionGenerated,
      onError,
    ]
  );

  /**
   * Handle follow-up CTA click from generated sections
   */
  const handleFollowUpClick = useCallback(
    async (followUp: { text: string; topic: string; priority: string }, sourceSection: GeneratedSectionData) => {
      const sectionId = `section-${uniqueId}-${Date.now()}`;
      const ctaSource: CTASource = {
        ctaId: `${sourceSection.id}-followup-${followUp.topic}`,
        ctaType: 'inline-cta',
        ctaText: followUp.text,
        sectionId: sourceSection.id,
        metadata: {
          topic: followUp.topic,
          priority: followUp.priority,
        },
      };

      // Start generation after the current section
      startSectionGeneration({
        sectionId,
        sourceCtaId: ctaSource.ctaId,
        afterCtaId: sourceSection.sourceCtaId,
      });

      try {
        const response = await fetch('/api/generate/section', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            websiteId,
            ctaSource,
            renderMode: 'inline-section',
            personaHint: chatContext.getPersonaHint(),
            sessionId: chatContext.journey?.sessionId,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || `API error: ${response.status}`);
        }

        const data = await response.json();

        if (!data.success) {
          throw new Error(data.error || 'Failed to generate section');
        }

        completeSectionGeneration({
          sectionId,
          content: data.section.content,
          sectionType: data.section.sectionType,
          suggestedFollowUps: data.suggestedFollowUps || [],
          intent: data.intent,
          knowledgeSourceCount: data.knowledgeSourceCount || 0,
          tokensUsed: data.tokensUsed || 0,
        });

        // Track topic in journey
        chatContext.addJourneyTopic(followUp.topic);
        chatContext.incrementEngagement();
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error occurred';

        failSectionGeneration({
          sectionId,
          error: errorMessage,
        });

        onError?.(error instanceof Error ? error : new Error(errorMessage));
      }
    },
    [
      uniqueId,
      websiteId,
      chatContext,
      startSectionGeneration,
      completeSectionGeneration,
      failSectionGeneration,
      onError,
    ]
  );

  /**
   * Handle section close
   */
  const handleSectionClose = useCallback(
    (sectionId: string) => {
      hideSection(sectionId);
    },
    [hideSection]
  );

  return (
    <div className={cn('relative min-h-screen', className)}>
      {/* Hero Section */}
      <HeroConversational
        headline={hero.headline}
        subheadline={hero.subheadline}
        description={hero.description}
        badge={hero.badge}
        backgroundVariant={hero.backgroundVariant}
        conversationalCTAs={initialCTAs}
        chatPrompt={hero.chatPrompt}
        showChatBubble={hero.showChatBubble}
        onCTAClick={handleCTAClick}
      />

      {/* Generated Sections Container */}
      <div className="relative">
        {/* Loading Indicator for New Section */}
        <AnimatePresence>
          {isGenerating && visibleSections.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex justify-center py-12"
            >
              <div className="flex items-center gap-3 px-6 py-3 rounded-full bg-white shadow-lg">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full"
                />
                <span className="text-sm text-gray-600">
                  Generating content...
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Rendered Sections */}
        <AnimatePresence mode="sync">
          {visibleSections.map((section) => (
            <InlineGeneratedSection
              key={section.id}
              sectionId={section.id}
              sourceCtaId={section.sourceCtaId}
              content={section.content}
              isLoading={section.isLoading}
              error={section.error}
              suggestedFollowUps={section.suggestedFollowUps}
              animationState={section.animationState}
              scrollIntoView={true}
              onFollowUpClick={(followUp) => handleFollowUpClick(followUp, section)}
              onClose={() => handleSectionClose(section.id)}
              showCloseButton={true}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Optional Children (footer, additional content) */}
      {children && (
        <div className="relative z-10">
          {children}
        </div>
      )}

      {/* Journey Progress Indicator */}
      {visibleSections.length > 0 && (
        <JourneyProgressIndicator
          sectionsCount={visibleSections.length}
          isHighIntent={chatContext.shouldSuggestHandoff()}
        />
      )}
    </div>
  );
}

// ============================================================================
// JOURNEY PROGRESS INDICATOR
// ============================================================================

interface JourneyProgressIndicatorProps {
  sectionsCount: number;
  isHighIntent: boolean;
}

function JourneyProgressIndicator({
  sectionsCount,
  isHighIntent,
}: JourneyProgressIndicatorProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed bottom-6 left-6 z-50"
    >
      <div className="flex items-center gap-3 px-4 py-2 rounded-full bg-white shadow-lg border border-gray-200">
        {/* Progress dots */}
        <div className="flex gap-1">
          {Array.from({ length: Math.min(sectionsCount, 5) }).map((_, i) => (
            <div
              key={i}
              className={cn(
                'w-2 h-2 rounded-full',
                i < sectionsCount ? 'bg-blue-600' : 'bg-gray-200'
              )}
            />
          ))}
          {sectionsCount > 5 && (
            <span className="text-xs text-gray-500 ml-1">+{sectionsCount - 5}</span>
          )}
        </div>

        {/* High intent indicator */}
        {isHighIntent && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="flex items-center gap-1.5 text-xs font-medium text-green-600"
          >
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            <span>Ready to connect</span>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

// ============================================================================
// MAIN COMPONENT (wraps with ChatProvider if needed)
// ============================================================================

export function ConversationalPage(props: ConversationalPageProps) {
  const uniqueId = useId();

  // Check if we're already inside a ChatProvider
  // If not, wrap with one
  return (
    <ChatProviderWrapper>
      <ConversationalPageInner {...props} uniqueId={uniqueId} />
    </ChatProviderWrapper>
  );
}

/**
 * Wrapper that provides ChatContext if not already available
 */
function ChatProviderWrapper({ children }: { children: ReactNode }) {
  // Try to use existing context
  try {
    // This will throw if not in a ChatProvider
    const context = useChatContext();
    // If we get here, we're already in a ChatProvider
    return <>{children}</>;
  } catch {
    // Not in a ChatProvider, wrap with one
    return <ChatProvider>{children}</ChatProvider>;
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export default ConversationalPage;
