'use client';

/**
 * ConversationalLanding Component
 * Phase 6: Conversational Marketing Platform
 *
 * The main conversational landing page that replaces the traditional landing page.
 * Features:
 * - Hero section with CTAs and chat input
 * - Streaming section generation with component reveal
 * - Knowledge-grounded content from the database
 * - Follow-up suggestions for continued conversation
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { ConversationalHero, type ConversationalCTA } from './ConversationalHero';
import { StreamingPageSection, type SectionContent, type SuggestedFollowUp } from './StreamingPageSection';
import { ChatProvider } from '@/lib/interactive/chat/chat-context';
import { PersonaProvider } from '@/lib/interactive/persona';

// ============================================================================
// TYPES
// ============================================================================

interface GeneratedSection {
  id: string;
  sourceCtaId: string;
  isLoading: boolean;
  streamingContent?: string;
  content: SectionContent | null;
  error?: string | null;
  suggestedFollowUps: SuggestedFollowUp[];
  knowledgeSourceCount: number;
}

export interface ConversationalLandingProps {
  /** Website ID for API calls */
  websiteId: string;
  /** Workspace ID */
  workspaceId: string;
  /** Company/Product name */
  title: string;
  /** Tagline */
  tagline?: string;
  /** Description */
  description?: string;
  /** Logo URL */
  logo?: string;
  /** Primary brand color */
  primaryColor?: string;
  /** Personalized CTAs */
  ctas: ConversationalCTA[];
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function ConversationalLanding(props: ConversationalLandingProps) {
  return (
    <PersonaProvider>
      <ChatProvider>
        <ConversationalLandingContent {...props} />
      </ChatProvider>
    </PersonaProvider>
  );
}

function ConversationalLandingContent({
  websiteId,
  workspaceId,
  title,
  tagline,
  description,
  logo,
  primaryColor = '#3B82F6',
  ctas,
}: ConversationalLandingProps) {
  const [sections, setSections] = useState<GeneratedSection[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeCtaId, setActiveCtaId] = useState<string | null>(null);
  const sectionsRef = useRef<HTMLDivElement>(null);

  // Clean up sections on unmount
  useEffect(() => {
    return () => {
      setSections([]);
    };
  }, []);

  /**
   * Generate a section using the streaming API
   */
  const generateSection = useCallback(
    async (ctaId: string, ctaText: string, topic: string, customMessage?: string) => {
      if (isGenerating) return;

      setIsGenerating(true);
      setActiveCtaId(customMessage ? null : ctaId);

      const sectionId = `section-${Date.now()}`;

      // Add placeholder section
      setSections((prev) => [
        ...prev,
        {
          id: sectionId,
          sourceCtaId: ctaId,
          isLoading: true,
          content: null,
          suggestedFollowUps: [],
          knowledgeSourceCount: 0,
        },
      ]);

      // Scroll to sections area after a short delay
      setTimeout(() => {
        sectionsRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
      }, 300);

      try {
        // Use streaming endpoint for real-time updates
        const response = await fetch('/api/generate/section/stream', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            websiteId,
            ctaSource: {
              ctaId,
              ctaType: customMessage ? 'chat-message' : 'landing-cta',
              ctaText: customMessage || ctaText,
              sectionId: 'landing-hero',
              metadata: {
                topic,
                query: customMessage,
              },
            },
            customMessage,
            renderMode: 'full-page',
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error('No response body');
        }

        const decoder = new TextDecoder();
        let streamingContent = '';
        let finalResult: {
          content: SectionContent;
          suggestedFollowUps: SuggestedFollowUp[];
          knowledgeSourceCount: number;
        } | null = null;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const text = decoder.decode(value, { stream: true });
          const lines = text.split('\n');

          for (const line of lines) {
            if (line.startsWith('event: ')) {
              const eventType = line.replace('event: ', '').trim();
              // Handle different event types
            } else if (line.startsWith('data: ')) {
              const dataStr = line.replace('data: ', '').trim();
              if (!dataStr) continue;

              try {
                const data = JSON.parse(dataStr);

                if (data.content) {
                  // Streaming chunk
                  streamingContent += data.content;
                  setSections((prev) =>
                    prev.map((s) =>
                      s.id === sectionId
                        ? { ...s, streamingContent }
                        : s
                    )
                  );
                }

                if (data.success && data.section) {
                  // Complete event
                  finalResult = {
                    content: data.section.content as SectionContent,
                    suggestedFollowUps: data.suggestedFollowUps || [],
                    knowledgeSourceCount: data.sources?.count || 0,
                  };
                }

                if (data.count !== undefined) {
                  // Sources event
                  setSections((prev) =>
                    prev.map((s) =>
                      s.id === sectionId
                        ? { ...s, knowledgeSourceCount: data.count }
                        : s
                    )
                  );
                }

                if (data.error) {
                  throw new Error(data.message || data.error);
                }
              } catch (parseError) {
                // Not JSON, might be partial data
              }
            }
          }
        }

        // Final update
        if (finalResult) {
          setSections((prev) =>
            prev.map((s) =>
              s.id === sectionId
                ? {
                    ...s,
                    isLoading: false,
                    content: finalResult!.content,
                    suggestedFollowUps: finalResult!.suggestedFollowUps,
                    knowledgeSourceCount: finalResult!.knowledgeSourceCount,
                  }
                : s
            )
          );
        } else {
          // Fallback to non-streaming endpoint
          await generateSectionFallback(sectionId, ctaId, ctaText, topic, customMessage);
        }
      } catch (error) {
        console.error('Section generation error:', error);
        // Try fallback
        await generateSectionFallback(sectionId, ctaId, ctaText, topic, customMessage);
      } finally {
        setIsGenerating(false);
        setActiveCtaId(null);
      }
    },
    [isGenerating, websiteId]
  );

  /**
   * Fallback to non-streaming endpoint
   */
  const generateSectionFallback = useCallback(
    async (
      sectionId: string,
      ctaId: string,
      ctaText: string,
      topic: string,
      customMessage?: string
    ) => {
      try {
        const response = await fetch('/api/generate/section', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            websiteId,
            ctaSource: {
              ctaId,
              ctaType: customMessage ? 'chat-message' : 'landing-cta',
              ctaText: customMessage || ctaText,
              sectionId: 'landing-hero',
              metadata: {
                topic,
                query: customMessage,
              },
            },
            customMessage,
            renderMode: 'full-page',
          }),
        });

        const data = await response.json();

        if (data.success) {
          setSections((prev) =>
            prev.map((s) =>
              s.id === sectionId
                ? {
                    ...s,
                    isLoading: false,
                    content: data.section.content as SectionContent,
                    suggestedFollowUps: data.suggestedFollowUps || [],
                    knowledgeSourceCount: data.knowledgeSourceCount || 0,
                  }
                : s
            )
          );
        } else {
          throw new Error(data.message || 'Generation failed');
        }
      } catch (error) {
        setSections((prev) =>
          prev.map((s) =>
            s.id === sectionId
              ? {
                  ...s,
                  isLoading: false,
                  error: error instanceof Error ? error.message : 'Unknown error',
                }
              : s
          )
        );
      }
    },
    [websiteId]
  );

  /**
   * Handle CTA click
   */
  const handleCTAClick = useCallback(
    (cta: ConversationalCTA) => {
      generateSection(cta.id, cta.text, cta.topic);
    },
    [generateSection]
  );

  /**
   * Handle chat submit
   */
  const handleChatSubmit = useCallback(
    (message: string) => {
      generateSection(`chat-${Date.now()}`, message, 'custom', message);
    },
    [generateSection]
  );

  /**
   * Handle follow-up click
   */
  const handleFollowUpClick = useCallback(
    (followUp: SuggestedFollowUp) => {
      generateSection(
        `followup-${Date.now()}`,
        followUp.text,
        followUp.topic
      );
    },
    [generateSection]
  );

  /**
   * Handle section close
   */
  const handleSectionClose = useCallback((sectionId: string) => {
    setSections((prev) => prev.filter((s) => s.id !== sectionId));
  }, []);

  /**
   * Scroll to content
   */
  const scrollToContent = useCallback(() => {
    sectionsRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <ConversationalHero
        title={title}
        tagline={tagline}
        description={description}
        logo={logo}
        primaryColor={primaryColor}
        ctas={ctas}
        isGenerating={isGenerating}
        activeCtaId={activeCtaId}
        onCTAClick={handleCTAClick}
        onChatSubmit={handleChatSubmit}
        hasGeneratedContent={sections.length > 0}
        onScrollToContent={scrollToContent}
      />

      {/* Generated Sections */}
      <div ref={sectionsRef}>
        <AnimatePresence mode="popLayout">
          {sections.map((section, index) => (
            <StreamingPageSection
              key={section.id}
              sectionId={section.id}
              isLoading={section.isLoading}
              streamingContent={section.streamingContent}
              content={section.content}
              error={section.error}
              suggestedFollowUps={section.suggestedFollowUps}
              index={index}
              primaryColor={primaryColor}
              knowledgeSourceCount={section.knowledgeSourceCount}
              onFollowUpClick={handleFollowUpClick}
              onClose={() => handleSectionClose(section.id)}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Footer (only shows after generated content) */}
      {sections.length > 0 && (
        <footer className="bg-gray-900 text-white py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h3 className="text-lg font-bold mb-2">{title}</h3>
            <p className="text-gray-400 text-sm">
              Powered by AI-driven conversational marketing
            </p>
          </div>
        </footer>
      )}
    </div>
  );
}

export default ConversationalLanding;
