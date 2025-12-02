'use client';

/**
 * Conversational Landing Page Component
 * Phase 6: Conversational Marketing Platform
 *
 * A minimal, single-screen landing experience where:
 * - One hero screen with company branding and personalized CTAs
 * - Each CTA click or chat message generates a NEW PAGE section below
 * - Creates a scrolling journey of AI-generated content
 * - CTAs are personalized based on workspace knowledge base
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight,
  MessageCircle,
  Loader2,
  Sparkles,
  ChevronDown,
} from 'lucide-react';
import { ChatWidget } from '@/components/chat/ChatWidget';
import { ChatProvider, useChatContext } from '@/lib/interactive/chat/chat-context';
import { PersonaProvider } from '@/lib/interactive/persona';
import {
  useVisibleSections,
  useSectionActions,
  type SectionContent,
} from '@/lib/stores/generated-sections-store';
import {
  StreamingSectionRenderer,
  type SuggestedFollowUp,
} from './streaming-section-renderer';

// ============================================================================
// TYPES
// ============================================================================

export interface PersonalizedCTA {
  id: string;
  text: string;
  topic: string;
  description?: string;
  icon?: string;
  variant: 'primary' | 'secondary' | 'tertiary';
  category: 'sales' | 'marketing' | 'product' | 'support' | 'general' | 'deep-dive';
  /** Additional metadata for special CTAs like deep-dives */
  metadata?: {
    isDeepDive?: boolean;
    sourceSectionType?: string;
    itemTitle?: string;
    itemDescription?: string;
    [key: string]: unknown;
  };
}

export interface WorkspaceConfig {
  name: string;
  tagline?: string;
  description?: string;
  logo?: string;
  primaryColor?: string;
  secondaryColor?: string;
}

export interface ConversationalLandingPageProps {
  websiteId: string;
  workspaceId: string;
  workspaceConfig: WorkspaceConfig;
  personalizedCTAs: PersonalizedCTA[];
  slug: string;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function ConversationalLandingPage(props: ConversationalLandingPageProps) {
  return (
    <PersonaProvider>
      <ChatProvider>
        <ConversationalLandingPageContent {...props} />
      </ChatProvider>
    </PersonaProvider>
  );
}

function ConversationalLandingPageContent({
  websiteId,
  workspaceId,
  workspaceConfig,
  personalizedCTAs,
  slug,
}: ConversationalLandingPageProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeCtaId, setActiveCtaId] = useState<string | null>(null);
  const [chatInputValue, setChatInputValue] = useState('');
  const [showHero, setShowHero] = useState(true); // Control hero visibility
  const [currentSectionId, setCurrentSectionId] = useState<string | null>(null); // Track current full-page section
  // Track previously generated topics to avoid repetition
  const [generatedTopics, setGeneratedTopics] = useState<Set<string>>(new Set());
  const generatedPagesRef = useRef<HTMLDivElement>(null);
  const chatContext = useChatContext();

  // Generated sections store
  const visibleSections = useVisibleSections();
  const {
    startSectionGeneration,
    completeSectionGeneration,
    failSectionGeneration,
    hideSection,
    clearSections,
  } = useSectionActions();

  const primaryColor = workspaceConfig.primaryColor || '#3B82F6';

  // Clear sections on unmount
  useEffect(() => {
    return () => {
      clearSections();
    };
  }, [clearSections]);

  /**
   * Generate a full page section when CTA is clicked
   * Uses streaming API for real-time content reveal
   * Keeps previous sections accessible
   */
  const handleCTAClick = useCallback(
    async (cta: PersonalizedCTA) => {
      if (isGenerating) return;

      setIsGenerating(true);
      setActiveCtaId(cta.id);
      setShowHero(false); // Hide hero immediately to show loading

      const sectionId = `page-${Date.now()}`;
      setCurrentSectionId(sectionId);

      // Track this topic to avoid repetition
      setGeneratedTopics(prev => new Set([...prev, cta.topic]));

      // Start generation (shows loading state) - DO NOT clear previous sections
      startSectionGeneration({
        sectionId,
        sourceCtaId: cta.id,
      });

      // Scroll to the new section being generated (after a small delay)
      // Use block: 'start' so the new section fills the viewport and previous pages are scrollable above
      setTimeout(() => {
        const container = generatedPagesRef.current;
        if (container) {
          const lastChild = container.lastElementChild;
          if (lastChild) {
            lastChild.scrollIntoView({ behavior: 'smooth', block: 'start' });
          } else {
            container.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }
      }, 100);

      try {
        // Use streaming API for real-time updates
        // Pass previously generated topics to avoid content repetition
        const response = await fetch('/api/generate/section/stream', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            websiteId,
            ctaSource: {
              ctaId: cta.id,
              ctaType: 'landing-cta',
              ctaText: cta.text,
              sectionId: 'landing-hero',
              metadata: {
                topic: cta.topic,
                category: cta.category,
                description: cta.description,
                // Pass deep-dive metadata if present
                ...(cta.metadata || {}),
              },
            },
            renderMode: 'full-page',
            // Pass previously generated topics to avoid repetition
            excludeTopics: Array.from(generatedTopics),
            // Pass existing section types to ensure variety
            existingSectionTypes: visibleSections.map(s => s.sectionType).filter(Boolean),
          }),
        });

        if (!response.ok) {
          throw new Error(`Generation failed: ${response.statusText}`);
        }

        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error('No response body');
        }

        const decoder = new TextDecoder();
        let buffer = '';
        let knowledgeSourceCount = 0;
        let finalResult: {
          content: SectionContent;
          sectionType: string;
          suggestedFollowUps: SuggestedFollowUp[];
          knowledgeSourceCount: number;
          tokensUsed: number;
        } | null = null;

        // Process the stream - SSE format: "event: type\ndata: {...}\n\n"
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          // Process complete SSE messages (split by double newline)
          const messages = buffer.split('\n\n');
          buffer = messages.pop() || ''; // Keep incomplete message in buffer

          for (const message of messages) {
            if (!message.trim()) continue;

            // Parse SSE format: event: type\ndata: {...}
            const lines = message.split('\n');
            let eventType = '';
            let dataStr = '';

            for (const line of lines) {
              if (line.startsWith('event: ')) {
                eventType = line.replace('event: ', '').trim();
              } else if (line.startsWith('data: ')) {
                dataStr = line.replace('data: ', '').trim();
              }
            }

            if (!dataStr) continue;

            try {
              const data = JSON.parse(dataStr);

              switch (eventType) {
                case 'sources':
                  // Track knowledge sources count
                  knowledgeSourceCount = data.count || 0;
                  break;

                case 'complete':
                  // Final result with full section content
                  if (data.success && data.section) {
                    finalResult = {
                      content: data.section.content as SectionContent,
                      sectionType: data.section.sectionType,
                      suggestedFollowUps: data.suggestedFollowUps || [],
                      knowledgeSourceCount,
                      tokensUsed: data.tokensUsed || 0,
                    };
                  }
                  break;

                case 'error':
                  throw new Error(data.message || data.error);
              }
            } catch (parseError) {
              if (parseError instanceof Error && parseError.message !== 'Unexpected end of JSON input') {
                throw parseError;
              }
              // Ignore JSON parse errors for partial data
            }
          }
        }

        // Complete the section with final result
        if (finalResult) {
          completeSectionGeneration({
            sectionId,
            content: finalResult.content,
            sectionType: finalResult.sectionType,
            suggestedFollowUps: finalResult.suggestedFollowUps,
            intent: { category: 'general', confidence: 0.8 },
            knowledgeSourceCount: finalResult.knowledgeSourceCount,
            tokensUsed: finalResult.tokensUsed,
          });
        } else {
          // Fallback to non-streaming if stream didn't complete properly
          await generateSectionFallback(sectionId, cta);
        }
      } catch (error) {
        console.error('Page generation error:', error);
        // Try non-streaming fallback
        try {
          await generateSectionFallback(sectionId, cta);
        } catch (fallbackError) {
          failSectionGeneration({
            sectionId,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      } finally {
        setIsGenerating(false);
        setActiveCtaId(null);
      }
    },
    [
      isGenerating,
      websiteId,
      startSectionGeneration,
      completeSectionGeneration,
      failSectionGeneration,
      generatedTopics,
      visibleSections,
    ]
  );

  /**
   * Fallback to non-streaming API
   */
  const generateSectionFallback = useCallback(
    async (sectionId: string, cta: PersonalizedCTA) => {
      const response = await fetch('/api/generate/section', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          websiteId,
          ctaSource: {
            ctaId: cta.id,
            ctaType: 'landing-cta',
            ctaText: cta.text,
            sectionId: 'landing-hero',
            metadata: {
              topic: cta.topic,
              category: cta.category,
              description: cta.description,
            },
          },
          renderMode: 'full-page',
        }),
      });

      const data = await response.json();

      if (data.success) {
        completeSectionGeneration({
          sectionId,
          content: data.section.content as SectionContent,
          sectionType: data.section.sectionType,
          suggestedFollowUps: data.suggestedFollowUps,
          intent: data.intent,
          knowledgeSourceCount: data.knowledgeSourceCount,
          tokensUsed: data.tokensUsed,
        });
      } else {
        throw new Error(data.message || 'Generation failed');
      }
    },
    [websiteId, completeSectionGeneration]
  );

  /**
   * Handle chat input submission with streaming
   * Keeps previous sections accessible
   */
  const handleChatSubmit = useCallback(
    async (message: string) => {
      if (!message.trim() || isGenerating) return;

      setIsGenerating(true);
      setChatInputValue('');
      setShowHero(false); // Hide hero immediately

      const sectionId = `chat-page-${Date.now()}`;
      setCurrentSectionId(sectionId);

      // Track chat topic to avoid repetition
      const chatTopic = message.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 50);
      setGeneratedTopics(prev => new Set([...prev, chatTopic]));

      // Start generation - DO NOT clear previous sections
      startSectionGeneration({
        sectionId,
        sourceCtaId: 'chat-input',
      });

      // Scroll to the new section being generated
      // Use block: 'start' so the new section fills the viewport and previous pages are scrollable above
      setTimeout(() => {
        const container = generatedPagesRef.current;
        if (container) {
          const lastChild = container.lastElementChild;
          if (lastChild) {
            lastChild.scrollIntoView({ behavior: 'smooth', block: 'start' });
          } else {
            container.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }
      }, 100);

      try {
        // Use streaming API for real-time updates
        // Pass previously generated topics to avoid content repetition
        const response = await fetch('/api/generate/section/stream', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            websiteId,
            ctaSource: {
              ctaId: 'chat-input',
              ctaType: 'chat-message',
              ctaText: message,
              sectionId: 'landing-chat',
              metadata: { query: message },
            },
            customMessage: message,
            renderMode: 'full-page',
            // Pass previously generated topics to avoid repetition
            excludeTopics: Array.from(generatedTopics),
            // Pass existing section types to ensure variety
            existingSectionTypes: visibleSections.map(s => s.sectionType).filter(Boolean),
          }),
        });

        if (!response.ok) {
          throw new Error(`Generation failed: ${response.statusText}`);
        }

        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error('No response body');
        }

        const decoder = new TextDecoder();
        let buffer = '';
        let knowledgeSourceCount = 0;
        let finalResult: {
          content: SectionContent;
          sectionType: string;
          suggestedFollowUps: SuggestedFollowUp[];
          knowledgeSourceCount: number;
          tokensUsed: number;
        } | null = null;

        // Process the stream - SSE format: "event: type\ndata: {...}\n\n"
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          // Process complete SSE messages (split by double newline)
          const messages = buffer.split('\n\n');
          buffer = messages.pop() || ''; // Keep incomplete message in buffer

          for (const message of messages) {
            if (!message.trim()) continue;

            // Parse SSE format: event: type\ndata: {...}
            const lines = message.split('\n');
            let eventType = '';
            let dataStr = '';

            for (const line of lines) {
              if (line.startsWith('event: ')) {
                eventType = line.replace('event: ', '').trim();
              } else if (line.startsWith('data: ')) {
                dataStr = line.replace('data: ', '').trim();
              }
            }

            if (!dataStr) continue;

            try {
              const data = JSON.parse(dataStr);

              switch (eventType) {
                case 'sources':
                  knowledgeSourceCount = data.count || 0;
                  break;

                case 'complete':
                  if (data.success && data.section) {
                    finalResult = {
                      content: data.section.content as SectionContent,
                      sectionType: data.section.sectionType,
                      suggestedFollowUps: data.suggestedFollowUps || [],
                      knowledgeSourceCount,
                      tokensUsed: data.tokensUsed || 0,
                    };
                  }
                  break;

                case 'error':
                  throw new Error(data.message || data.error);
              }
            } catch (parseError) {
              if (parseError instanceof Error && parseError.message !== 'Unexpected end of JSON input') {
                throw parseError;
              }
            }
          }
        }

        // Complete the section with final result
        if (finalResult) {
          completeSectionGeneration({
            sectionId,
            content: finalResult.content,
            sectionType: finalResult.sectionType,
            suggestedFollowUps: finalResult.suggestedFollowUps,
            intent: { category: 'general', confidence: 0.8 },
            knowledgeSourceCount: finalResult.knowledgeSourceCount,
            tokensUsed: finalResult.tokensUsed,
          });
        } else {
          // Fallback to non-streaming if stream didn't complete properly
          await generateChatSectionFallback(sectionId, message);
        }
      } catch (error) {
        console.error('Chat page generation error:', error);
        // Try non-streaming fallback
        try {
          await generateChatSectionFallback(sectionId, message);
        } catch (fallbackError) {
          failSectionGeneration({
            sectionId,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      } finally {
        setIsGenerating(false);
      }
    },
    [
      isGenerating,
      websiteId,
      startSectionGeneration,
      completeSectionGeneration,
      failSectionGeneration,
      generatedTopics,
      visibleSections,
    ]
  );

  /**
   * Fallback to non-streaming API for chat messages
   */
  const generateChatSectionFallback = useCallback(
    async (sectionId: string, message: string) => {
      const response = await fetch('/api/generate/section', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          websiteId,
          ctaSource: {
            ctaId: 'chat-input',
            ctaType: 'chat-message',
            ctaText: message,
            sectionId: 'landing-chat',
            metadata: { query: message },
          },
          customMessage: message,
          renderMode: 'full-page',
        }),
      });

      const data = await response.json();

      if (data.success) {
        completeSectionGeneration({
          sectionId,
          content: data.section.content as SectionContent,
          sectionType: data.section.sectionType,
          suggestedFollowUps: data.suggestedFollowUps,
          intent: data.intent,
          knowledgeSourceCount: data.knowledgeSourceCount,
          tokensUsed: data.tokensUsed,
        });
      } else {
        throw new Error(data.message || 'Generation failed');
      }
    },
    [websiteId, completeSectionGeneration]
  );

  /**
   * Handle follow-up CTA from generated section
   */
  const handleFollowUpClick = useCallback(
    async (followUp: { text: string; topic: string }) => {
      await handleCTAClick({
        id: `followup-${Date.now()}`,
        text: followUp.text,
        topic: followUp.topic,
        variant: 'primary',
        category: 'general',
      });
    },
    [handleCTAClick]
  );

  /**
   * Handle item click from generated section (deep-dive into specific item)
   * This generates a new section with detailed information about the clicked item
   * Uses a DIFFERENT layout from the source section to provide variety
   */
  const handleItemClick = useCallback(
    async (item: { id: string; title: string; description: string }, sectionType: string) => {
      // Generate a deep-dive CTA for this specific item
      // Pass the source section type so the generator can choose a different layout
      await handleCTAClick({
        id: `item-${item.id}-${Date.now()}`,
        text: `Tell me more about ${item.title}`,
        topic: item.title.toLowerCase().replace(/\s+/g, '-'),
        description: `Deep dive into: ${item.description}`,
        variant: 'primary',
        category: 'deep-dive', // Special category for deep-dive to trigger different layout
        metadata: {
          isDeepDive: true,
          sourceSectionType: sectionType,
          itemTitle: item.title,
          itemDescription: item.description,
        },
      });
    },
    [handleCTAClick]
  );

  /**
   * Handle UI generation from chat questions
   * This creates a dynamic UI section in response to a chat question
   */
  const handleChatGenerateUI = useCallback(
    async (question: string, topic: string) => {
      // Generate a UI section for the chat question
      await handleCTAClick({
        id: `chat-${Date.now()}`,
        text: question,
        topic: topic,
        description: `User asked: ${question}`,
        variant: 'primary',
        category: 'general',
        metadata: {
          fromChat: true,
        },
      });
    },
    [handleCTAClick]
  );

  // Group CTAs by category for better organization
  const primaryCTAs = personalizedCTAs.filter(
    (cta) => cta.variant === 'primary'
  );
  const secondaryCTAs = personalizedCTAs.filter(
    (cta) => cta.variant === 'secondary'
  );
  const tertiaryCTAs = personalizedCTAs.filter(
    (cta) => cta.variant === 'tertiary'
  );

  // Function to go back to hero
  const handleBackToHero = useCallback(() => {
    setShowHero(true);
    setCurrentSectionId(null);
    clearSections();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [clearSections]);

  return (
    <div className="min-h-screen bg-white">
      {/* Full-screen Loading State when generating */}
      <AnimatePresence>
        {!showHero && isGenerating && (
          <motion.section
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 h-screen flex flex-col justify-center items-center overflow-hidden"
            style={{
              background: `linear-gradient(135deg, ${primaryColor} 0%, ${adjustColor(primaryColor, -30)} 100%)`,
            }}
          >
            {/* Decorative elements */}
            <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-white/10 blur-3xl" />
            <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-white/10 blur-3xl" />

            <div className="relative z-10 text-center text-white">
              <motion.div
                className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-6"
                animate={{ scale: [1, 1.1, 1], rotate: [0, 180, 360] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              >
                <Sparkles className="w-10 h-10" />
              </motion.div>
              <h2 className="text-3xl font-bold mb-4">{workspaceConfig.name}</h2>
              <motion.p
                className="text-white/80 text-lg flex items-center justify-center gap-2"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Loader2 className="w-5 h-5 animate-spin" />
                Generating your personalized experience...
              </motion.p>
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* Hero Section - conditionally shown */}
      <AnimatePresence>
        {showHero && (
          <motion.section
            key="hero"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className="relative h-screen flex flex-col justify-center items-center overflow-hidden"
          >
            {/* Background gradient */}
            <div
              className="absolute inset-0"
              style={{
                background: `linear-gradient(135deg, ${primaryColor} 0%, ${adjustColor(primaryColor, -30)} 100%)`,
              }}
            />

            {/* Decorative elements */}
            <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-white/10 blur-3xl" />
            <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-white/10 blur-3xl" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-white/5 blur-3xl" />

        {/* Content */}
        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white py-20">
          {/* Logo/Brand */}
          {workspaceConfig.logo ? (
            <motion.img
              src={workspaceConfig.logo}
              alt={workspaceConfig.name}
              className="h-16 mx-auto mb-8"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            />
          ) : (
            <motion.div
              className="mb-8"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight">
                {workspaceConfig.name}
              </h1>
            </motion.div>
          )}

          {/* Tagline */}
          {workspaceConfig.tagline && (
            <motion.p
              className="text-2xl md:text-3xl text-white/90 mb-4 font-light"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              {workspaceConfig.tagline}
            </motion.p>
          )}

          {/* Brief description */}
          {workspaceConfig.description && (
            <motion.p
              className="text-lg md:text-xl text-white/70 mb-12 max-w-2xl mx-auto"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              {workspaceConfig.description}
            </motion.p>
          )}

          {/* Primary CTAs */}
          <motion.div
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            {primaryCTAs.map((cta) => (
              <motion.button
                key={cta.id}
                onClick={() => handleCTAClick(cta)}
                disabled={isGenerating}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`
                  inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl
                  font-semibold text-lg transition-all duration-200
                  disabled:opacity-50 disabled:cursor-not-allowed
                  bg-white shadow-xl hover:shadow-2xl
                `}
                style={{ color: primaryColor }}
              >
                {isGenerating && activeCtaId === cta.id ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Sparkles className="w-5 h-5" />
                )}
                {cta.text}
              </motion.button>
            ))}
          </motion.div>

          {/* Secondary CTAs */}
          {secondaryCTAs.length > 0 && (
            <motion.div
              className="flex flex-wrap items-center justify-center gap-3 mb-8"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              {secondaryCTAs.map((cta) => (
                <motion.button
                  key={cta.id}
                  onClick={() => handleCTAClick(cta)}
                  disabled={isGenerating}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="
                    inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg
                    font-medium text-base transition-all duration-200
                    bg-white/10 hover:bg-white/20 border border-white/30
                    disabled:opacity-50 disabled:cursor-not-allowed
                  "
                >
                  {isGenerating && activeCtaId === cta.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <ArrowRight className="w-4 h-4" />
                  )}
                  {cta.text}
                </motion.button>
              ))}
            </motion.div>
          )}

          {/* Tertiary CTAs (smaller, link-style) */}
          {tertiaryCTAs.length > 0 && (
            <motion.div
              className="flex flex-wrap items-center justify-center gap-4 mb-12"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              {tertiaryCTAs.map((cta) => (
                <button
                  key={cta.id}
                  onClick={() => handleCTAClick(cta)}
                  disabled={isGenerating}
                  className="
                    text-sm font-medium text-white/80 hover:text-white
                    underline-offset-4 hover:underline transition-all
                    disabled:opacity-50 disabled:cursor-not-allowed
                  "
                >
                  {cta.text}
                </button>
              ))}
            </motion.div>
          )}

          {/* Chat Input */}
          <motion.div
            className="max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            <div className="relative">
              <div className="absolute inset-0 bg-white/10 backdrop-blur-sm rounded-2xl" />
              <div className="relative flex items-center gap-2 p-2">
                <MessageCircle className="w-5 h-5 text-white/60 ml-4" />
                <input
                  type="text"
                  value={chatInputValue}
                  onChange={(e) => setChatInputValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && chatInputValue.trim()) {
                      handleChatSubmit(chatInputValue);
                    }
                  }}
                  placeholder="Ask me anything about our platform..."
                  className="
                    flex-1 bg-transparent border-none outline-none
                    text-white placeholder:text-white/50
                    py-3 px-2 text-base
                  "
                  disabled={isGenerating}
                />
                <button
                  onClick={() => handleChatSubmit(chatInputValue)}
                  disabled={!chatInputValue.trim() || isGenerating}
                  className="
                    px-6 py-3 rounded-xl font-medium
                    bg-white transition-all
                    disabled:opacity-50 disabled:cursor-not-allowed
                    hover:shadow-lg
                  "
                  style={{ color: primaryColor }}
                >
                  {isGenerating && activeCtaId === null ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    'Ask'
                  )}
                </button>
              </div>
            </div>
            <p className="text-white/50 text-sm mt-3">
              Ask questions or click a button above to explore
            </p>
          </motion.div>

          {/* Scroll Indicator */}
          <motion.div
            className="absolute bottom-8 left-1/2 -translate-x-1/2"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.8 }}
          >
            <motion.div
              className="flex flex-col items-center cursor-pointer group"
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              <span className="text-white/60 text-xs mb-2 group-hover:text-white/80 transition-colors">
                Scroll or click to explore
              </span>
              <ChevronDown className="w-6 h-6 text-white/60 group-hover:text-white transition-colors" />
            </motion.div>
          </motion.div>

        </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* Generated Pages Container - Full screen when hero is hidden */}
      <div
        ref={generatedPagesRef}
        className={!showHero && !isGenerating ? 'min-h-screen' : ''}
      >
        <AnimatePresence mode="popLayout">
          {visibleSections.map((section, index) => (
            <StreamingSectionRenderer
              key={section.id}
              sectionId={section.id}
              isLoading={section.isLoading}
              content={section.content as SectionContent | null}
              error={section.error}
              suggestedFollowUps={section.suggestedFollowUps || []}
              knowledgeSourceCount={section.knowledgeSourceCount || 0}
              index={index}
              primaryColor={primaryColor}
              onFollowUpClick={handleFollowUpClick}
              onItemClick={handleItemClick}
              onClose={() => hideSection(section.id)}
              onBackToHero={handleBackToHero}
              showBackButton={!showHero}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Enhanced Footer */}
      {visibleSections.length > 0 && (
        <footer className="bg-gray-900 text-white">
          {/* Main Footer Content */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="grid md:grid-cols-4 gap-12">
              {/* Brand Column */}
              <div className="md:col-span-2">
                <div className="flex items-center gap-3 mb-4">
                  {workspaceConfig.logo ? (
                    <img
                      src={workspaceConfig.logo}
                      alt={workspaceConfig.name}
                      className="h-10 w-auto"
                    />
                  ) : (
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-lg"
                      style={{ backgroundColor: primaryColor }}
                    >
                      {workspaceConfig.name.charAt(0)}
                    </div>
                  )}
                  <span className="text-xl font-bold">{workspaceConfig.name}</span>
                </div>
                {workspaceConfig.description && (
                  <p className="text-gray-400 max-w-md mb-6">
                    {workspaceConfig.description}
                  </p>
                )}
                {/* Social Links Placeholder */}
                <div className="flex gap-4">
                  {['twitter', 'linkedin', 'github'].map((social) => (
                    <motion.a
                      key={social}
                      href="#"
                      whileHover={{ scale: 1.1 }}
                      className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-gray-700 transition-colors"
                    >
                      <span className="sr-only">{social}</span>
                      <div className="w-5 h-5 bg-gray-600 rounded" />
                    </motion.a>
                  ))}
                </div>
              </div>

              {/* Quick Links */}
              <div>
                <h4 className="font-semibold text-sm uppercase tracking-wider mb-4 text-gray-400">
                  Explore
                </h4>
                <ul className="space-y-3">
                  {personalizedCTAs.slice(0, 4).map((cta) => (
                    <li key={cta.id}>
                      <button
                        onClick={() => handleCTAClick(cta)}
                        className="text-gray-300 hover:text-white transition-colors text-sm"
                      >
                        {cta.text}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Contact/CTA Column */}
              <div>
                <h4 className="font-semibold text-sm uppercase tracking-wider mb-4 text-gray-400">
                  Get Started
                </h4>
                <p className="text-gray-400 text-sm mb-4">
                  Ready to learn more? Our team is here to help.
                </p>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleBackToHero}
                  className="px-6 py-2.5 rounded-lg font-medium text-sm transition-all"
                  style={{ backgroundColor: primaryColor }}
                >
                  Start Over
                </motion.button>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-gray-800">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
              <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <p className="text-gray-500 text-sm">
                  &copy; {new Date().getFullYear()} {workspaceConfig.name}. All rights reserved.
                </p>
                <div className="flex items-center gap-2 text-gray-500 text-sm">
                  <Sparkles className="w-4 h-4" />
                  <span>Powered by AI-driven conversational marketing</span>
                </div>
              </div>
            </div>
          </div>
        </footer>
      )}

      {/* Chat Widget - questions trigger both chat response AND UI generation */}
      <ChatWidget
        websiteId={websiteId}
        companyName={workspaceConfig.name}
        primaryColor={primaryColor}
        welcomeMessage={`Hi! I'm here to help you learn more about ${workspaceConfig.name}. What would you like to know?`}
        suggestedQuestions={personalizedCTAs.slice(0, 4).map((cta) => cta.text)}
        onGenerateUI={handleChatGenerateUI}
      />
    </div>
  );
}


// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Adjust color brightness
 */
function adjustColor(hex: string, amount: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.min(255, Math.max(0, (num >> 16) + amount));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00ff) + amount));
  const b = Math.min(255, Math.max(0, (num & 0x0000ff) + amount));
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

export default ConversationalLandingPage;
