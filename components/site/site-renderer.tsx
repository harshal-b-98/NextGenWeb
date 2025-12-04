'use client';

/**
 * Site Renderer Component
 * Renders a generated website page with all its sections
 *
 * Phase 6: Now supports Conversational Marketing with inline section generation
 * Story #127: Integrated GlobalHeader and GlobalFooter components
 * Epic #146: Added preview mode with section selection for feedback
 */

import Link from 'next/link';
import { ArrowRight, MessageCircle, Loader2 } from 'lucide-react';
import { useState, useCallback, useId, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChatWidget } from '@/components/chat/ChatWidget';
import { ChatProvider, useChatContext, type CTASource } from '@/lib/interactive/chat/chat-context';
import { PersonaProvider, usePersonaContext } from '@/lib/interactive/persona';
import {
  RolePicker,
  ChatInputField,
  SectionChatTrigger,
  QuickQuestion,
} from '@/components/interactive/SectionTriggers';
import {
  AdaptiveText,
  AdaptiveSection,
  PersonaBanner,
  AdaptiveCTA,
} from '@/components/interactive/AdaptiveContent';
import {
  useGeneratedSectionsStore,
  useVisibleSections,
  useSectionActions,
  type SectionContent,
  type SuggestedCTA,
} from '@/lib/stores/generated-sections-store';
import { InlineGeneratedSection } from '@/components/interactive/InlineGeneratedSection';
import { GlobalHeader, DefaultHeader } from '@/components/site/GlobalHeader';
import { GlobalFooter, DefaultFooter } from '@/components/site/GlobalFooter';
import { SectionWithOverlay } from '@/components/preview/SectionOverlay';
import type { HeaderContent, FooterContent } from '@/lib/layout/global-components';

interface PageContent {
  sections?: Section[];
  metadata?: {
    title?: string;
    description?: string;
  };
}

interface Section {
  id: string;
  type?: string;
  componentId?: string;
  content: Record<string, unknown>;
  order: number;
}

interface Page {
  id: string;
  title: string;
  slug: string;
  is_homepage: boolean;
  content: PageContent | null;
}

interface Website {
  id: string;
  name: string;
  slug: string;
  brand_config?: {
    primaryColor?: string;
    secondaryColor?: string;
    logo?: string;
  };
}

interface SiteRendererProps {
  website: Website;
  page: Page;
  pages: Page[];
  /** Header content from database (optional - uses DefaultHeader if not provided) */
  headerContent?: HeaderContent;
  /** Footer content from database (optional - uses DefaultFooter if not provided) */
  footerContent?: FooterContent;
  /** Navigation style: 'simple' or 'mega-menu' */
  navStyle?: 'simple' | 'mega-menu';
  /** Current page path for active state highlighting */
  currentPath?: string;
  /** Preview mode: enables section selection and feedback UI */
  previewMode?: boolean;
  /** Feedback mode: enables section click handlers */
  feedbackMode?: boolean;
  /** Callback when section is clicked (preview mode only) */
  onSectionClick?: (sectionId: string) => void;
  /** Currently selected section ID */
  selectedSection?: string | null;
}

export function SiteRenderer({
  website,
  page,
  pages,
  headerContent,
  footerContent,
  navStyle = 'simple',
  currentPath,
  previewMode = false,
  feedbackMode = false,
  onSectionClick,
  selectedSection = null,
}: SiteRendererProps) {
  return (
    <PersonaProvider>
      <ChatProvider>
        <SiteRendererContent
          website={website}
          page={page}
          pages={pages}
          headerContent={headerContent}
          footerContent={footerContent}
          navStyle={navStyle}
          currentPath={currentPath}
          previewMode={previewMode}
          feedbackMode={feedbackMode}
          onSectionClick={onSectionClick}
          selectedSection={selectedSection}
        />
      </ChatProvider>
    </PersonaProvider>
  );
}

function SiteRendererContent({
  website,
  page,
  pages,
  headerContent,
  footerContent,
  navStyle = 'simple',
  currentPath,
  previewMode = false,
  feedbackMode = false,
  onSectionClick,
  selectedSection = null,
}: SiteRendererProps) {
  const chatContext = useChatContext();
  const personaContext = usePersonaContext();
  const content = page.content as PageContent | null;
  const sections = content?.sections || [];
  const uniqueId = useId();
  const generatedSectionsRef = useRef<HTMLDivElement>(null);

  // Phase 6: Conversational Marketing - Generated sections store
  const visibleSections = useVisibleSections();
  const {
    startSectionGeneration,
    completeSectionGeneration,
    failSectionGeneration,
    hideSection,
    clearSections,
  } = useSectionActions();

  // Navigation pages (exclude current page from nav if it's the homepage)
  const navPages = pages.filter(p => !p.is_homepage || p.id !== page.id);
  const primaryColor = website.brand_config?.primaryColor || '#3B82F6';

  // Clear sections on unmount
  useEffect(() => {
    return () => {
      clearSections();
    };
  }, [clearSections]);

  /**
   * Phase 6: Handle conversational CTA click - generates inline content
   */
  const handleConversationalCTAClick = useCallback(
    async (ctaText: string, topic: string, ctaIndex: number) => {
      const sectionId = `${uniqueId}-section-${Date.now()}`;
      const ctaId = `${uniqueId}-cta-${ctaIndex}`;

      // Start generation (shows loading state)
      startSectionGeneration({
        sectionId,
        sourceCtaId: ctaId,
      });

      // Scroll to generated sections area
      setTimeout(() => {
        generatedSectionsRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
      }, 100);

      try {
        // Call the section generation API
        const response = await fetch('/api/generate/section', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            websiteId: website.id,
            ctaSource: {
              ctaId,
              ctaType: 'hero-cta',
              ctaText,
              sectionId: 'hero',
              metadata: { topic },
            },
            renderMode: 'inline-section',
          }),
        });

        if (!response.ok) {
          throw new Error(`Generation failed: ${response.statusText}`);
        }

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
      } catch (error) {
        console.error('Section generation error:', error);
        failSectionGeneration({
          sectionId,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    },
    [
      uniqueId,
      website.id,
      startSectionGeneration,
      completeSectionGeneration,
      failSectionGeneration,
    ]
  );

  /**
   * Handle follow-up CTA click from generated section
   */
  const handleFollowUpClick = useCallback(
    async (followUp: SuggestedCTA) => {
      await handleConversationalCTAClick(
        followUp.text,
        followUp.topic,
        Date.now() // Use timestamp for unique index
      );
    },
    [handleConversationalCTAClick]
  );

  // Handlers for interactive triggers
  const handleRoleSelect = (personaId: string, personaLabel: string) => {
    // Update persona context for UI adaptation
    personaContext.setPersona(personaId, personaLabel);

    // Record the interaction
    personaContext.recordInteraction({
      type: 'role_select',
      target: personaId,
      value: personaLabel,
    });

    // Also update chat context for AI responses
    chatContext.setPersona(personaId, personaLabel);
    chatContext.triggerChat({
      message: `Hi! I'm a ${personaLabel}. What can you tell me that would be most relevant for someone like me?`,
      autoSend: true,
      personaId,
      personaLabel,
    });
  };

  const handleChatInput = (message: string, context?: string) => {
    // Record the chat interaction for persona analysis
    personaContext.recordInteraction({
      type: 'chat_message',
      target: context || 'general',
      value: message,
    });

    if (context) {
      chatContext.setSectionContext(context);
    }
    chatContext.triggerChat({
      message,
      autoSend: true,
      sectionContext: context,
    });
  };

  const handleQuickQuestion = (question: string, context?: string) => {
    // Record the quick question interaction
    personaContext.recordInteraction({
      type: 'chat_message',
      target: context || 'quick-question',
      value: question,
    });

    if (context) {
      chatContext.setSectionContext(context);
    }
    chatContext.triggerChat({
      message: question,
      autoSend: true,
      sectionContext: context,
    });
  };

  const handleChatTrigger = (prefilledMessage?: string, context?: string) => {
    // Record the section click interaction
    personaContext.recordInteraction({
      type: 'click',
      target: context || 'chat-trigger',
      value: prefilledMessage,
    });

    if (context) {
      chatContext.setSectionContext(context);
    }
    chatContext.triggerChat({
      message: prefilledMessage,
      autoSend: false,
      sectionContext: context,
    });
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation - uses GlobalHeader if content provided, otherwise DefaultHeader */}
      {headerContent ? (
        <GlobalHeader
          websiteSlug={website.slug}
          content={headerContent}
          navStyle={navStyle}
          primaryColor={primaryColor}
          currentPath={currentPath}
        />
      ) : (
        <DefaultHeader
          websiteSlug={website.slug}
          websiteName={website.name}
          pages={pages.map((p) => ({
            title: p.title,
            slug: p.slug,
            is_homepage: p.is_homepage,
          }))}
          primaryColor={primaryColor}
          currentPath={currentPath}
        />
      )}

      {/* Persona Banner - shows personalized greeting when persona is detected */}
      {personaContext.activePersonaId && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
          <PersonaBanner
            primaryColor={primaryColor}
            dismissible={true}
            position="inline"
          />
        </div>
      )}

      {/* Page Content */}
      <main>
        {sections.length === 0 ? (
          <div className="py-20 text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">{page.title}</h1>
            <p className="text-gray-600">Content is being generated...</p>
          </div>
        ) : (
          <>
            {sections
              .sort((a, b) => a.order - b.order)
              .map((section, index) => (
                <SectionWithOverlay
                  key={section.id}
                  section={section}
                  isSelected={selectedSection === section.id}
                  feedbackMode={feedbackMode || false}
                  onSectionClick={onSectionClick || (() => {})}
                >
                  <SectionRenderer
                    section={section}
                    primaryColor={primaryColor}
                    websiteId={website.id}
                    onRoleSelect={handleRoleSelect}
                    onChatInput={handleChatInput}
                    onQuickQuestion={handleQuickQuestion}
                    onChatTrigger={handleChatTrigger}
                    onConversationalCTAClick={handleConversationalCTAClick}
                    isFirstSection={index === 0}
                  />
                </SectionWithOverlay>
              ))}

            {/* Phase 6: Generated Sections Container */}
            <div ref={generatedSectionsRef} className="relative">
              <AnimatePresence mode="popLayout">
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
                    scrollIntoView={false}
                    onFollowUpClick={handleFollowUpClick}
                    onClose={() => hideSection(section.id)}
                    showCloseButton={true}
                  />
                ))}
              </AnimatePresence>
            </div>
          </>
        )}
      </main>

      {/* Footer - uses GlobalFooter if content provided, otherwise DefaultFooter */}
      {footerContent ? (
        <GlobalFooter
          websiteSlug={website.slug}
          content={footerContent}
          primaryColor={primaryColor}
        />
      ) : (
        <DefaultFooter
          websiteSlug={website.slug}
          websiteName={website.name}
          pages={pages.map((p) => ({
            title: p.title,
            slug: p.slug,
            is_homepage: p.is_homepage,
          }))}
          primaryColor={primaryColor}
        />
      )}

      {/* AI Chat Widget */}
      <ChatWidget
        websiteId={website.id}
        companyName={website.name}
        primaryColor={website.brand_config?.primaryColor || '#3B82F6'}
        welcomeMessage={`Hi there! I'm here to help you learn more about ${website.name}. What would you like to know?`}
        suggestedQuestions={[
          'What services do you offer?',
          'How can I get started?',
          'Tell me about pricing',
          'How can I contact you?'
        ]}
      />
    </div>
  );
}

/**
 * Get section type from either 'type' field or 'componentId' field
 * componentId format: 'hero-centered', 'features-grid' etc.
 */
function getSectionType(section: Section): string {
  // If type is specified directly, use it
  if (section.type) {
    return section.type;
  }
  // If componentId is specified, extract the base type (e.g., 'hero-centered' -> 'hero')
  if (section.componentId) {
    return section.componentId.split('-')[0];
  }
  return 'generic';
}

// Props for section renderer with interactive triggers
interface SectionRendererProps {
  section: Section;
  primaryColor: string;
  websiteId?: string;
  onRoleSelect?: (personaId: string, personaLabel: string) => void;
  onChatInput?: (message: string, context?: string) => void;
  onQuickQuestion?: (question: string, context?: string) => void;
  onChatTrigger?: (prefilledMessage?: string, context?: string) => void;
  onConversationalCTAClick?: (ctaText: string, topic: string, ctaIndex: number) => void;
  isFirstSection?: boolean;
}

/**
 * Section Renderer - renders individual page sections
 */
function SectionRenderer({
  section,
  primaryColor,
  websiteId,
  onRoleSelect,
  onChatInput,
  onQuickQuestion,
  onChatTrigger,
  onConversationalCTAClick,
  isFirstSection,
}: SectionRendererProps) {
  const content = section.content || {};
  const sectionType = getSectionType(section);

  switch (sectionType) {
    case 'hero':
      return (
        <HeroSection
          content={content}
          primaryColor={primaryColor}
          onRoleSelect={isFirstSection ? onRoleSelect : undefined}
          onChatInput={onChatInput}
          onConversationalCTAClick={isFirstSection ? onConversationalCTAClick : undefined}
        />
      );
    case 'features':
      return (
        <FeaturesSection
          content={content}
          onChatTrigger={onChatTrigger}
          primaryColor={primaryColor}
        />
      );
    case 'pricing':
      return (
        <PricingSection
          content={content}
          onQuickQuestion={onQuickQuestion}
          onChatTrigger={onChatTrigger}
          primaryColor={primaryColor}
        />
      );
    case 'testimonials':
      return <TestimonialsSection content={content} />;
    case 'cta':
      return <CTASection content={content} />;
    case 'about':
      return <AboutSection content={content} />;
    case 'contact':
      return <ContactSection content={content} />;
    case 'stats':
      return <StatsSection content={content} />;
    case 'faq':
      return (
        <FAQSection
          content={content}
          onChatTrigger={onChatTrigger}
          primaryColor={primaryColor}
        />
      );
    default:
      return <GenericSection section={section} />;
  }
}

// Hero Section with Interactive Triggers and Conversational Marketing CTAs
interface HeroSectionProps {
  content: Record<string, unknown>;
  primaryColor?: string;
  onRoleSelect?: (personaId: string, personaLabel: string) => void;
  onChatInput?: (message: string, context?: string) => void;
  onConversationalCTAClick?: (ctaText: string, topic: string, ctaIndex: number) => void;
}

interface ConversationalCTA {
  text: string;
  topic: string;
  variant?: 'primary' | 'secondary' | 'tertiary';
}

function HeroSection({
  content,
  primaryColor = '#3B82F6',
  onRoleSelect,
  onChatInput,
  onConversationalCTAClick,
}: HeroSectionProps) {
  const headline = (content.headline as string) || 'Welcome to Our Website';
  const subheadline = (content.subheadline as string) || 'Discover amazing products and services';
  const ctaText = (content.ctaText as string) || 'Get Started';
  const showRolePicker = (content.showRolePicker as boolean) ?? true;
  const [isGenerating, setIsGenerating] = useState(false);

  // Default conversational CTAs if not provided in content
  const conversationalCTAs: ConversationalCTA[] =
    (content.conversationalCTAs as ConversationalCTA[]) || [
      { text: 'See How It Works', topic: 'how-it-works', variant: 'primary' },
      { text: 'View Pricing', topic: 'pricing', variant: 'secondary' },
      { text: 'Success Stories', topic: 'case-studies', variant: 'tertiary' },
      { text: 'Request a Demo', topic: 'demo-request', variant: 'tertiary' },
    ];

  const handleCTAClick = (cta: ConversationalCTA, index: number) => {
    if (onConversationalCTAClick) {
      setIsGenerating(true);
      onConversationalCTAClick(cta.text, cta.topic, index);
      // Reset generating state after a delay (actual state is in store)
      setTimeout(() => setIsGenerating(false), 1000);
    }
  };

  return (
    <section className="relative bg-gradient-to-br from-blue-600 to-purple-700 text-white py-20 lg:py-32">
      {/* Decorative elements */}
      <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-white/10 blur-3xl" />
      <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-white/10 blur-3xl" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
            {headline}
          </h1>
          <p className="text-xl md:text-2xl text-blue-100 mb-8 max-w-3xl mx-auto">
            {subheadline}
          </p>

          {/* Phase 6: Conversational Marketing CTAs */}
          {onConversationalCTAClick && conversationalCTAs.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mt-8"
            >
              {/* Primary and Secondary CTAs */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                {conversationalCTAs.slice(0, 2).map((cta, index) => (
                  <motion.button
                    key={index}
                    onClick={() => handleCTAClick(cta, index)}
                    disabled={isGenerating}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`
                      inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg
                      font-semibold text-base transition-all duration-200
                      disabled:opacity-50 disabled:cursor-not-allowed
                      ${
                        cta.variant === 'primary' || index === 0
                          ? 'bg-white text-blue-600 hover:bg-blue-50 shadow-lg'
                          : 'bg-white/10 text-white hover:bg-white/20 border border-white/30'
                      }
                    `}
                  >
                    {isGenerating ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <ArrowRight className="w-4 h-4" />
                    )}
                    {cta.text}
                  </motion.button>
                ))}
              </div>

              {/* Tertiary CTAs */}
              {conversationalCTAs.length > 2 && (
                <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                  {conversationalCTAs.slice(2).map((cta, index) => (
                    <motion.button
                      key={index + 2}
                      onClick={() => handleCTAClick(cta, index + 2)}
                      disabled={isGenerating}
                      whileHover={{ scale: 1.02 }}
                      className="
                        px-4 py-2 text-sm font-medium text-white/90
                        hover:text-white hover:bg-white/10 rounded-full
                        transition-all duration-200
                        disabled:opacity-50 disabled:cursor-not-allowed
                      "
                    >
                      {cta.text}
                    </motion.button>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* Fallback to original CTA button if no conversational handler */}
          {!onConversationalCTAClick && (
            <button
              className="bg-white px-8 py-3 rounded-lg font-semibold text-lg hover:bg-blue-50 transition-colors"
              style={{ color: primaryColor }}
            >
              {ctaText}
            </button>
          )}

          {/* Chat Input Field for Hero */}
          {onChatInput && (
            <div className="mt-12 max-w-2xl mx-auto">
              <ChatInputField
                placeholder="Ask me anything about our product..."
                sectionContext="hero"
                onSubmit={(message) => onChatInput(message, 'hero')}
                variant="prominent"
                primaryColor="#FFFFFF"
                buttonText="Ask"
              />
            </div>
          )}

          {/* Chat bubble prompt */}
          {onConversationalCTAClick && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="mt-10"
            >
              <button
                onClick={() => onChatInput?.('', 'hero')}
                className="
                  inline-flex items-center gap-2 px-5 py-2.5 rounded-full
                  text-sm font-medium bg-white/10 hover:bg-white/20
                  text-white border border-white/20 transition-all duration-200
                "
              >
                <MessageCircle className="w-4 h-4" />
                Ask me anything about our platform...
              </button>
            </motion.div>
          )}

          {/* Role Picker for personalization */}
          {showRolePicker && onRoleSelect && !onConversationalCTAClick && (
            <div className="mt-16">
              <RolePicker
                title="Tell us about yourself"
                subtitle="Help us personalize your experience"
                variant="pills"
                primaryColor="#FFFFFF"
                onSelect={(personaId: string, personaLabel: string) => {
                  onRoleSelect(personaId, personaLabel);
                }}
              />
            </div>
          )}
        </motion.div>
      </div>
    </section>
  );
}

// Features Section with Interactive Triggers
interface FeaturesSectionProps {
  content: Record<string, unknown>;
  primaryColor?: string;
  onChatTrigger?: (prefilledMessage?: string, context?: string) => void;
}

function FeaturesSection({ content, primaryColor = '#3B82F6', onChatTrigger }: FeaturesSectionProps) {
  const title = (content.title as string) || 'Our Features';
  const subtitle = (content.subtitle as string) || 'Everything you need to succeed';
  const features = (content.features as Array<{ title: string; description: string }>) || [
    { title: 'Feature 1', description: 'Description of feature 1' },
    { title: 'Feature 2', description: 'Description of feature 2' },
    { title: 'Feature 3', description: 'Description of feature 3' },
  ];

  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">{title}</h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">{subtitle}</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow group">
              <div
                className="w-12 h-12 rounded-lg flex items-center justify-center mb-4"
                style={{ backgroundColor: `${primaryColor}20` }}
              >
                <span className="font-bold text-xl" style={{ color: primaryColor }}>{index + 1}</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
              <p className="text-gray-600 mb-4">{feature.description}</p>

              {/* Feature-specific chat trigger */}
              {onChatTrigger && (
                <SectionChatTrigger
                  text="Learn more"
                  context={`features - ${feature.title}`}
                  prefilledMessage={`Tell me more about ${feature.title}`}
                  onClick={(prefilled, ctx) => onChatTrigger(prefilled, ctx)}
                  variant="link"
                  primaryColor={primaryColor}
                />
              )}
            </div>
          ))}
        </div>

        {/* Section-level chat trigger */}
        {onChatTrigger && (
          <div className="mt-12 text-center">
            <SectionChatTrigger
              text="Have questions about our features?"
              context="features"
              onClick={(prefilled, ctx) => onChatTrigger(prefilled, ctx)}
              variant="button"
              primaryColor={primaryColor}
            />
          </div>
        )}
      </div>
    </section>
  );
}

// Pricing Section with Interactive Triggers
interface PricingSectionProps {
  content: Record<string, unknown>;
  primaryColor?: string;
  onQuickQuestion?: (question: string, context?: string) => void;
  onChatTrigger?: (prefilledMessage?: string, context?: string) => void;
}

function PricingSection({ content, primaryColor = '#3B82F6', onQuickQuestion, onChatTrigger }: PricingSectionProps) {
  const title = (content.title as string) || 'Pricing Plans';
  const subtitle = (content.subtitle as string) || 'Choose the plan that works for you';
  const plans = (content.plans as Array<{ name: string; price: string; features: string[] }>) || [
    { name: 'Starter', price: '$9/mo', features: ['Feature 1', 'Feature 2'] },
    { name: 'Pro', price: '$29/mo', features: ['All Starter features', 'Feature 3', 'Feature 4'] },
    { name: 'Enterprise', price: 'Contact us', features: ['All Pro features', 'Custom solutions'] },
  ];

  // Default pricing questions
  const pricingQuestions = [
    'Which plan is best for a small team?',
    'Do you offer annual discounts?',
    'Can I upgrade later?',
    'What payment methods do you accept?',
  ];

  return (
    <section className="py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">{title}</h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">{subtitle}</p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`p-8 rounded-2xl border-2 ${
                index === 1
                  ? 'bg-blue-50'
                  : 'border-gray-200 bg-white'
              }`}
              style={{
                borderColor: index === 1 ? primaryColor : undefined,
              }}
            >
              <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
              <p className="text-4xl font-bold mb-6" style={{ color: primaryColor }}>{plan.price}</p>
              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-center text-gray-600">
                    <span className="text-green-500 mr-2">&#10003;</span>
                    {feature}
                  </li>
                ))}
              </ul>
              <button
                className={`w-full py-3 rounded-lg font-semibold transition-colors ${
                  index === 1
                    ? 'text-white hover:opacity-90'
                    : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                }`}
                style={{
                  backgroundColor: index === 1 ? primaryColor : undefined,
                }}
              >
                Get Started
              </button>

              {/* Plan-specific chat trigger */}
              {onChatTrigger && (
                <div className="mt-4">
                  <SectionChatTrigger
                    text={`Questions about ${plan.name}?`}
                    context={`pricing - ${plan.name} plan`}
                    prefilledMessage={`Tell me more about the ${plan.name} plan`}
                    onClick={(prefilled, ctx) => onChatTrigger(prefilled, ctx)}
                    variant="link"
                    primaryColor={primaryColor}
                  />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Quick Questions for Pricing */}
        {onQuickQuestion && (
          <div className="mt-16">
            <QuickQuestion
              questions={pricingQuestions}
              sectionContext="pricing"
              onSelect={(question) => onQuickQuestion(question, 'pricing')}
              variant="chips"
              primaryColor={primaryColor}
            />
          </div>
        )}
      </div>
    </section>
  );
}

// Testimonials Section
function TestimonialsSection({ content }: { content: Record<string, unknown> }) {
  const title = (content.title as string) || 'What Our Customers Say';
  const testimonials = (content.testimonials as Array<{ quote: string; author: string; role: string }>) || [
    { quote: 'Amazing product!', author: 'John Doe', role: 'CEO' },
    { quote: 'Highly recommended!', author: 'Jane Smith', role: 'CTO' },
  ];

  return (
    <section className="py-20 bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">{title}</h2>
        <div className="grid md:grid-cols-2 gap-8">
          {testimonials.map((t, index) => (
            <div key={index} className="bg-gray-800 p-8 rounded-xl">
              <p className="text-lg text-gray-300 mb-6 italic">&ldquo;{t.quote}&rdquo;</p>
              <div>
                <p className="font-semibold">{t.author}</p>
                <p className="text-gray-400 text-sm">{t.role}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// CTA Section
function CTASection({ content }: { content: Record<string, unknown> }) {
  const title = (content.title as string) || 'Ready to Get Started?';
  const subtitle = (content.subtitle as string) || 'Join thousands of satisfied customers today';
  const buttonText = (content.buttonText as string) || 'Start Free Trial';

  return (
    <section className="py-20 bg-blue-600 text-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">{title}</h2>
        <p className="text-xl text-blue-100 mb-8">{subtitle}</p>
        <button className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold text-lg hover:bg-blue-50 transition-colors">
          {buttonText}
        </button>
      </div>
    </section>
  );
}

// About Section
function AboutSection({ content }: { content: Record<string, unknown> }) {
  const title = (content.title as string) || 'About Us';
  const description = (content.description as string) || 'We are a team dedicated to delivering exceptional value.';
  const mission = (content.mission as string) || 'Our mission is to help businesses succeed.';

  return (
    <section className="py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">{title}</h2>
            <p className="text-lg text-gray-600 mb-6">{description}</p>
            <p className="text-lg text-gray-600">{mission}</p>
          </div>
          <div className="bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl p-12 flex items-center justify-center">
            <div className="text-6xl">&#128187;</div>
          </div>
        </div>
      </div>
    </section>
  );
}

// Contact Section
function ContactSection({ content }: { content: Record<string, unknown> }) {
  const title = (content.title as string) || 'Contact Us';
  const subtitle = (content.subtitle as string) || 'We would love to hear from you';
  const email = (content.email as string) || 'contact@example.com';

  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">{title}</h2>
          <p className="text-xl text-gray-600">{subtitle}</p>
        </div>
        <div className="bg-white p-8 rounded-2xl shadow-sm">
          <form className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                <input
                  type="text"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Your name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="your@email.com"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
              <textarea
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Your message..."
              />
            </div>
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Send Message
            </button>
          </form>
          <p className="text-center text-gray-500 mt-6">
            Or email us directly at <a href={`mailto:${email}`} className="text-blue-600 hover:underline">{email}</a>
          </p>
        </div>
      </div>
    </section>
  );
}

// Stats Section
function StatsSection({ content }: { content: Record<string, unknown> }) {
  const stats = (content.stats as Array<{ value: string; label: string }>) || [
    { value: '10K+', label: 'Customers' },
    { value: '99%', label: 'Satisfaction' },
    { value: '24/7', label: 'Support' },
    { value: '50+', label: 'Countries' },
  ];

  return (
    <section className="py-16 bg-blue-600 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-4xl md:text-5xl font-bold mb-2">{stat.value}</div>
              <div className="text-blue-200">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// FAQ Section with Interactive Triggers
interface FAQSectionProps {
  content: Record<string, unknown>;
  primaryColor?: string;
  onChatTrigger?: (prefilledMessage?: string, context?: string) => void;
}

function FAQSection({ content, primaryColor = '#3B82F6', onChatTrigger }: FAQSectionProps) {
  const title = (content.title as string) || 'Frequently Asked Questions';
  const faqs = (content.faqs as Array<{ question: string; answer: string }>) || [
    { question: 'How does it work?', answer: 'It is simple to get started...' },
    { question: 'What is the pricing?', answer: 'We offer flexible pricing plans...' },
  ];

  return (
    <section className="py-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 text-center mb-12">{title}</h2>
        <div className="space-y-6">
          {faqs.map((faq, index) => (
            <div key={index} className="bg-gray-50 p-6 rounded-xl">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{faq.question}</h3>
              <p className="text-gray-600">{faq.answer}</p>
            </div>
          ))}
        </div>

        {/* Can't find your question? Chat trigger */}
        {onChatTrigger && (
          <div className="mt-12 text-center">
            <p className="text-gray-600 mb-4">Can&apos;t find what you&apos;re looking for?</p>
            <SectionChatTrigger
              text="Ask us anything"
              context="faq"
              onClick={(prefilled, ctx) => onChatTrigger(prefilled, ctx)}
              variant="button"
              primaryColor={primaryColor}
            />
          </div>
        )}
      </div>
    </section>
  );
}

// Generic Section (fallback)
function GenericSection({ section }: { section: Section }) {
  const content = section.content || {};
  const title = (content.title as string) || section.type;
  const text = (content.text as string) || (content.description as string) || '';

  return (
    <section className="py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4 capitalize">{title}</h2>
        {text && <p className="text-gray-600">{text}</p>}
      </div>
    </section>
  );
}
