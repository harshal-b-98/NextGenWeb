'use client';

/**
 * StreamingPageSection Component
 * Phase 6: Conversational Marketing Platform
 *
 * Renders AI-generated sections with a streaming component-by-component reveal effect.
 * Features:
 * - Progressive content reveal as JSON is parsed
 * - Skeleton loading states for each component type
 * - Smooth animations for item appearance
 * - Follow-up CTA suggestions
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Loader2,
  Sparkles,
  X,
  ChevronRight,
  ChevronDown,
  Check,
  ArrowRight,
  AlertCircle,
  Zap,
  Star,
  Quote,
} from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

export interface SectionItem {
  id: string;
  title: string;
  description: string;
  icon?: string;
  value?: string;
  label?: string;
  question?: string;
  answer?: string;
}

export interface SectionContent {
  type: string;
  headline?: string;
  subheadline?: string;
  items: SectionItem[];
  cta?: {
    text: string;
    action: string;
    variant: 'primary' | 'secondary';
  };
}

export interface SuggestedFollowUp {
  text: string;
  topic: string;
  priority: 'high' | 'medium' | 'low';
}

export interface StreamingPageSectionProps {
  /** Section ID */
  sectionId: string;
  /** Whether section is loading */
  isLoading: boolean;
  /** Streaming content text (raw JSON being built) */
  streamingContent?: string;
  /** Parsed final content */
  content: SectionContent | null;
  /** Error message */
  error?: string | null;
  /** Follow-up suggestions */
  suggestedFollowUps?: SuggestedFollowUp[];
  /** Section index (for alternating backgrounds) */
  index: number;
  /** Primary brand color */
  primaryColor?: string;
  /** Knowledge source count */
  knowledgeSourceCount?: number;
  /** Callback when follow-up is clicked */
  onFollowUpClick?: (followUp: SuggestedFollowUp) => void;
  /** Callback when close is clicked */
  onClose?: () => void;
}

// ============================================================================
// STREAMING PAGE SECTION
// ============================================================================

export function StreamingPageSection({
  sectionId,
  isLoading,
  streamingContent,
  content,
  error,
  suggestedFollowUps = [],
  index,
  primaryColor = '#3B82F6',
  knowledgeSourceCount = 0,
  onFollowUpClick,
  onClose,
}: StreamingPageSectionProps) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [parsedItems, setParsedItems] = useState<SectionItem[]>([]);
  const [parsedHeadline, setParsedHeadline] = useState<string>('');
  const [parsedType, setParsedType] = useState<string>('');

  // Try to parse streaming content progressively
  useEffect(() => {
    if (!streamingContent) return;

    try {
      // Try to extract headline
      const headlineMatch = streamingContent.match(/"headline"\s*:\s*"([^"]+)"/);
      if (headlineMatch) {
        setParsedHeadline(headlineMatch[1]);
      }

      // Try to extract type
      const typeMatch = streamingContent.match(/"type"\s*:\s*"([^"]+)"/);
      if (typeMatch) {
        setParsedType(typeMatch[1]);
      }

      // Try to extract items array progressively
      const itemsMatch = streamingContent.match(/"items"\s*:\s*\[([^\]]*)/);
      if (itemsMatch) {
        const itemsStr = itemsMatch[1];
        // Try to extract complete item objects
        const itemRegex = /\{\s*"id"\s*:\s*"[^"]+"\s*,\s*"title"\s*:\s*"([^"]+)"\s*,\s*"description"\s*:\s*"([^"]+)"[^}]*\}/g;
        const items: SectionItem[] = [];
        let match;
        while ((match = itemRegex.exec(itemsStr)) !== null) {
          items.push({
            id: `item-${items.length}`,
            title: match[1],
            description: match[2],
          });
        }
        if (items.length > 0) {
          setParsedItems(items);
        }
      }
    } catch {
      // Parsing failed, continue with what we have
    }
  }, [streamingContent]);

  // When final content arrives, use it
  useEffect(() => {
    if (content) {
      setParsedItems(content.items || []);
      setParsedHeadline(content.headline || '');
      setParsedType(content.type || '');
    }
  }, [content]);

  // Scroll into view when appearing
  useEffect(() => {
    if (sectionRef.current && (content || parsedItems.length > 0)) {
      setTimeout(() => {
        sectionRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
      }, 100);
    }
  }, [content, parsedItems.length]);

  const backgroundColor = index % 2 === 0 ? 'bg-white' : 'bg-gray-50';

  return (
    <motion.section
      ref={sectionRef}
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -30, height: 0 }}
      transition={{ duration: 0.5 }}
      className={`relative py-16 md:py-20 ${backgroundColor}`}
    >
      {/* AI Generated Badge */}
      <div className="absolute top-4 left-4 flex items-center gap-2 text-xs text-gray-400">
        <Sparkles className="w-3 h-3" style={{ color: primaryColor }} />
        <span>AI Generated</span>
        {knowledgeSourceCount > 0 && (
          <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-[10px]">
            {knowledgeSourceCount} sources
          </span>
        )}
      </div>

      {/* Close Button */}
      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-full hover:bg-gray-100"
        >
          <X className="w-5 h-5" />
        </button>
      )}

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Loading State with Skeleton */}
        {isLoading && !parsedHeadline && !parsedItems.length && (
          <LoadingSkeleton primaryColor={primaryColor} />
        )}

        {/* Error State */}
        {error && (
          <ErrorState error={error} onClose={onClose} primaryColor={primaryColor} />
        )}

        {/* Streaming/Final Content */}
        {!error && (parsedHeadline || parsedItems.length > 0 || content) && (
          <>
            {/* Headline */}
            <AnimatePresence mode="wait">
              {(parsedHeadline || content?.headline) && (
                <motion.div
                  key="headline"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center mb-12"
                >
                  <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                    {content?.headline || parsedHeadline}
                  </h2>
                  {(content?.subheadline) && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.2 }}
                      className="text-xl text-gray-600 max-w-2xl mx-auto"
                    >
                      {content.subheadline}
                    </motion.p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Items Grid with Staggered Animation */}
            <ContentRenderer
              type={content?.type || parsedType}
              items={content?.items || parsedItems}
              primaryColor={primaryColor}
              isStreaming={isLoading}
              cta={content?.cta}
            />

            {/* Loading indicator while more items coming */}
            {isLoading && parsedItems.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-center mt-8"
              >
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Loader2 className="w-4 h-4 animate-spin" style={{ color: primaryColor }} />
                  <span>Loading more...</span>
                </div>
              </motion.div>
            )}

            {/* Follow-up CTAs */}
            {!isLoading && suggestedFollowUps.length > 0 && (
              <FollowUpCTAs
                followUps={suggestedFollowUps}
                primaryColor={primaryColor}
                onFollowUpClick={onFollowUpClick}
              />
            )}
          </>
        )}
      </div>
    </motion.section>
  );
}

// ============================================================================
// LOADING SKELETON
// ============================================================================

function LoadingSkeleton({ primaryColor }: { primaryColor: string }) {
  return (
    <div className="animate-pulse">
      {/* Headline skeleton */}
      <div className="text-center mb-12">
        <div className="h-10 bg-gray-200 rounded-lg w-2/3 mx-auto mb-4" />
        <div className="h-6 bg-gray-200 rounded w-1/2 mx-auto" />
      </div>

      {/* Cards skeleton */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white p-6 rounded-xl border border-gray-200"
          >
            <div
              className="w-12 h-12 rounded-lg mb-4"
              style={{ backgroundColor: `${primaryColor}15` }}
            />
            <div className="h-5 bg-gray-200 rounded w-3/4 mb-3" />
            <div className="space-y-2">
              <div className="h-4 bg-gray-100 rounded" />
              <div className="h-4 bg-gray-100 rounded w-5/6" />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Progress indicator */}
      <div className="flex justify-center mt-8">
        <div className="flex items-center gap-3 px-4 py-2 rounded-full bg-white shadow-sm border border-gray-100">
          <Loader2 className="w-4 h-4 animate-spin" style={{ color: primaryColor }} />
          <span className="text-sm text-gray-600">Generating from knowledge base...</span>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// ERROR STATE
// ============================================================================

function ErrorState({
  error,
  onClose,
  primaryColor,
}: {
  error: string;
  onClose?: () => void;
  primaryColor: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
        <AlertCircle className="w-8 h-8 text-red-600" />
      </div>
      <h3 className="text-xl font-medium text-gray-900 mb-2">
        Unable to generate content
      </h3>
      <p className="text-gray-500 max-w-md mb-6">{error}</p>
      {onClose && (
        <button
          onClick={onClose}
          className="px-4 py-2 rounded-lg font-medium transition-colors"
          style={{ backgroundColor: `${primaryColor}15`, color: primaryColor }}
        >
          Dismiss
        </button>
      )}
    </div>
  );
}

// ============================================================================
// CONTENT RENDERER
// ============================================================================

interface ContentRendererProps {
  type: string;
  items: SectionItem[];
  primaryColor: string;
  isStreaming: boolean;
  cta?: SectionContent['cta'];
}

function ContentRenderer({
  type,
  items,
  primaryColor,
  isStreaming,
  cta,
}: ContentRendererProps) {
  switch (type) {
    case 'features-grid':
    case 'features-cards':
      return <FeaturesGrid items={items} primaryColor={primaryColor} isStreaming={isStreaming} />;
    case 'timeline':
      return <Timeline items={items} primaryColor={primaryColor} isStreaming={isStreaming} />;
    case 'faq-accordion':
      return <FAQAccordion items={items} primaryColor={primaryColor} isStreaming={isStreaming} />;
    case 'stats-display':
      return <StatsDisplay items={items} primaryColor={primaryColor} isStreaming={isStreaming} />;
    case 'pricing-table':
      return <PricingTable items={items} primaryColor={primaryColor} isStreaming={isStreaming} />;
    case 'testimonials':
      return <Testimonials items={items} primaryColor={primaryColor} isStreaming={isStreaming} />;
    case 'comparison-table':
      return <ComparisonTable items={items} primaryColor={primaryColor} isStreaming={isStreaming} />;
    case 'cta-block':
      return <CTABlock cta={cta} primaryColor={primaryColor} />;
    case 'text-block':
    default:
      return <TextBlock items={items} isStreaming={isStreaming} />;
  }
}

// ============================================================================
// SECTION TYPE COMPONENTS
// ============================================================================

function FeaturesGrid({
  items,
  primaryColor,
  isStreaming,
}: {
  items: SectionItem[];
  primaryColor: string;
  isStreaming: boolean;
}) {
  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      {items.map((item, index) => (
        <motion.div
          key={item.id}
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: index * 0.1, duration: 0.4 }}
          className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-all border border-gray-100 group"
        >
          <div
            className="w-12 h-12 rounded-lg flex items-center justify-center mb-4 transition-transform group-hover:scale-110"
            style={{ backgroundColor: `${primaryColor}15` }}
          >
            {item.icon ? (
              <span className="text-2xl">{item.icon}</span>
            ) : (
              <Zap className="w-6 h-6" style={{ color: primaryColor }} />
            )}
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {item.title}
          </h3>
          <p className="text-gray-600 leading-relaxed">{item.description}</p>
        </motion.div>
      ))}
      {/* Placeholder cards while streaming */}
      {isStreaming && items.length < 3 && (
        <>
          {Array.from({ length: 3 - items.length }).map((_, i) => (
            <motion.div
              key={`placeholder-${i}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              className="bg-gray-50 p-6 rounded-xl border border-gray-200 border-dashed"
            >
              <div className="w-12 h-12 rounded-lg bg-gray-200 mb-4 animate-pulse" />
              <div className="h-5 bg-gray-200 rounded w-3/4 mb-3 animate-pulse" />
              <div className="h-4 bg-gray-100 rounded animate-pulse" />
            </motion.div>
          ))}
        </>
      )}
    </div>
  );
}

function Timeline({
  items,
  primaryColor,
  isStreaming,
}: {
  items: SectionItem[];
  primaryColor: string;
  isStreaming: boolean;
}) {
  return (
    <div className="max-w-3xl mx-auto">
      <div className="relative">
        {/* Vertical line */}
        <div
          className="absolute left-8 top-0 bottom-0 w-0.5"
          style={{ backgroundColor: `${primaryColor}30` }}
        />
        <div className="space-y-8">
          {items.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.15 }}
              className="relative flex items-start gap-6"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: index * 0.15 + 0.1, type: 'spring' }}
                className="w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-lg shrink-0 z-10 shadow-lg"
                style={{ backgroundColor: primaryColor }}
              >
                {item.label || index + 1}
              </motion.div>
              <div className="pt-3 flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  {item.title}
                </h3>
                <p className="text-gray-600">{item.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

function FAQAccordion({
  items,
  primaryColor,
  isStreaming,
}: {
  items: SectionItem[];
  primaryColor: string;
  isStreaming: boolean;
}) {
  return (
    <div className="max-w-3xl mx-auto space-y-4">
      {items.map((item, index) => (
        <motion.details
          key={item.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="group bg-white rounded-xl border border-gray-200 overflow-hidden"
        >
          <summary className="flex items-center justify-between p-6 cursor-pointer list-none hover:bg-gray-50 transition-colors">
            <h3 className="text-lg font-medium text-gray-900 pr-4">
              {item.question || item.title}
            </h3>
            <ChevronDown
              className="w-5 h-5 text-gray-400 group-open:rotate-180 transition-transform flex-shrink-0"
              style={{ color: primaryColor }}
            />
          </summary>
          <div className="px-6 pb-6 text-gray-600 border-t border-gray-100 pt-4">
            {item.answer || item.description}
          </div>
        </motion.details>
      ))}
    </div>
  );
}

function StatsDisplay({
  items,
  primaryColor,
  isStreaming,
}: {
  items: SectionItem[];
  primaryColor: string;
  isStreaming: boolean;
}) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
      {items.map((item, index) => (
        <motion.div
          key={item.id}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: index * 0.1, type: 'spring' }}
          className="text-center"
        >
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 + 0.2 }}
            className="text-4xl md:text-5xl font-bold mb-2"
            style={{ color: primaryColor }}
          >
            {item.value}
          </motion.div>
          <div className="text-gray-800 font-medium">{item.title}</div>
          {item.description && (
            <p className="text-gray-500 text-sm mt-1">{item.description}</p>
          )}
        </motion.div>
      ))}
    </div>
  );
}

function PricingTable({
  items,
  primaryColor,
  isStreaming,
}: {
  items: SectionItem[];
  primaryColor: string;
  isStreaming: boolean;
}) {
  return (
    <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
      {items.map((item, index) => {
        const isHighlighted = item.label === 'Most Popular' || index === 1;
        return (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.15 }}
            className={`p-6 rounded-2xl border-2 relative ${
              isHighlighted
                ? 'scale-105 shadow-xl'
                : 'bg-white border-gray-200'
            }`}
            style={{
              borderColor: isHighlighted ? primaryColor : undefined,
              backgroundColor: isHighlighted ? `${primaryColor}05` : undefined,
            }}
          >
            {item.label && (
              <span
                className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-medium text-white"
                style={{ backgroundColor: primaryColor }}
              >
                {item.label}
              </span>
            )}
            <h3 className="text-xl font-bold text-gray-900 mb-2 mt-2">
              {item.title}
            </h3>
            <div
              className="text-3xl font-bold mb-4"
              style={{ color: primaryColor }}
            >
              {item.value}
            </div>
            <p className="text-gray-600 text-sm">{item.description}</p>
            <button
              className="w-full mt-6 py-3 rounded-lg font-medium transition-all"
              style={{
                backgroundColor: isHighlighted ? primaryColor : `${primaryColor}10`,
                color: isHighlighted ? 'white' : primaryColor,
              }}
            >
              Get Started
            </button>
          </motion.div>
        );
      })}
    </div>
  );
}

function Testimonials({
  items,
  primaryColor,
  isStreaming,
}: {
  items: SectionItem[];
  primaryColor: string;
  isStreaming: boolean;
}) {
  return (
    <div className="grid md:grid-cols-2 gap-6">
      {items.map((item, index) => (
        <motion.div
          key={item.id}
          initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.15 }}
          className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 relative"
        >
          <Quote
            className="absolute top-4 right-4 w-8 h-8 opacity-10"
            style={{ color: primaryColor }}
          />
          <div className="flex gap-1 mb-4">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className="w-4 h-4 fill-current"
                style={{ color: '#FBBF24' }}
              />
            ))}
          </div>
          <p className="text-gray-600 italic mb-4 leading-relaxed">
            &ldquo;{item.description}&rdquo;
          </p>
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-white font-medium"
              style={{ backgroundColor: primaryColor }}
            >
              {item.title.charAt(0)}
            </div>
            <div>
              <p className="font-semibold text-gray-900">{item.title}</p>
              {item.label && (
                <p className="text-gray-500 text-sm">{item.label}</p>
              )}
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

function ComparisonTable({
  items,
  primaryColor,
  isStreaming,
}: {
  items: SectionItem[];
  primaryColor: string;
  isStreaming: boolean;
}) {
  return (
    <div className="overflow-x-auto max-w-3xl mx-auto">
      <table className="w-full">
        <tbody>
          {items.map((item, index) => (
            <motion.tr
              key={item.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="border-b border-gray-200"
            >
              <td className="py-4 px-4 font-medium text-gray-900 flex items-center gap-2">
                <Check className="w-5 h-5" style={{ color: primaryColor }} />
                {item.title}
              </td>
              <td className="py-4 px-4 text-gray-600">{item.description}</td>
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CTABlock({
  cta,
  primaryColor,
}: {
  cta?: SectionContent['cta'];
  primaryColor: string;
}) {
  if (!cta) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="text-center py-8"
    >
      <button
        className="px-8 py-4 rounded-xl font-semibold text-lg text-white transition-all hover:shadow-lg hover:scale-105"
        style={{ backgroundColor: primaryColor }}
      >
        {cta.text}
        <ArrowRight className="w-5 h-5 inline-block ml-2" />
      </button>
    </motion.div>
  );
}

function TextBlock({
  items,
  isStreaming,
}: {
  items: SectionItem[];
  isStreaming: boolean;
}) {
  return (
    <div className="max-w-3xl mx-auto prose prose-lg">
      {items.map((item, index) => (
        <motion.div
          key={item.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          {item.title && (
            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              {item.title}
            </h3>
          )}
          <p className="text-gray-600 leading-relaxed">{item.description}</p>
        </motion.div>
      ))}
    </div>
  );
}

// ============================================================================
// FOLLOW-UP CTAS
// ============================================================================

function FollowUpCTAs({
  followUps,
  primaryColor,
  onFollowUpClick,
}: {
  followUps: SuggestedFollowUp[];
  primaryColor: string;
  onFollowUpClick?: (followUp: SuggestedFollowUp) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="mt-12 pt-8 border-t border-gray-200"
    >
      <p className="text-center text-gray-500 mb-4">Want to learn more?</p>
      <div className="flex flex-wrap justify-center gap-3">
        {followUps.map((followUp, index) => (
          <motion.button
            key={index}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 + index * 0.1 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onFollowUpClick?.(followUp)}
            className={`px-5 py-2.5 rounded-lg font-medium text-sm transition-all duration-200 ${
              followUp.priority === 'high'
                ? 'text-white shadow-md'
                : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
            style={
              followUp.priority === 'high'
                ? { backgroundColor: primaryColor }
                : {}
            }
          >
            {followUp.text}
            <ArrowRight className="w-4 h-4 inline-block ml-2" />
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}

export default StreamingPageSection;
