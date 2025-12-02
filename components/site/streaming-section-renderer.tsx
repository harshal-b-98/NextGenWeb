'use client';

/**
 * Streaming Section Renderer
 * Phase 6: Conversational Marketing Platform
 *
 * Renders section content with streaming component reveal:
 * - Each item/component reveals one by one
 * - Smooth animations as content streams in
 * - Knowledge-grounded content display
 * - Contextual follow-up CTAs
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight,
  ArrowLeft,
  Loader2,
  Sparkles,
  ChevronDown,
  X,
  CheckCircle2,
  BookOpen,
  Lightbulb,
  Zap,
  Target,
  Users,
  BarChart3,
  Settings,
  HelpCircle,
  MessageSquare,
  DollarSign,
  Clock,
  Shield,
  Globe,
  Layers,
  Home,
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

export interface StreamingSectionRendererProps {
  sectionId: string;
  isLoading: boolean;
  streamingContent?: string;
  content: SectionContent | null;
  error?: string | null;
  suggestedFollowUps: SuggestedFollowUp[];
  knowledgeSourceCount: number;
  index: number;
  primaryColor: string;
  onFollowUpClick: (followUp: SuggestedFollowUp) => void;
  onItemClick?: (item: SectionItem, sectionType: string) => void;
  onClose: () => void;
  onBackToHero?: () => void;
  showBackButton?: boolean;
}

// Icon mapping for dynamic icons
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  'check': CheckCircle2,
  'book': BookOpen,
  'lightbulb': Lightbulb,
  'zap': Zap,
  'target': Target,
  'users': Users,
  'chart': BarChart3,
  'settings': Settings,
  'help': HelpCircle,
  'message': MessageSquare,
  'dollar': DollarSign,
  'clock': Clock,
  'shield': Shield,
  'globe': Globe,
  'layers': Layers,
  'sparkles': Sparkles,
};

// ============================================================================
// COMPONENT
// ============================================================================

export function StreamingSectionRenderer({
  sectionId,
  isLoading,
  streamingContent,
  content,
  error,
  suggestedFollowUps,
  knowledgeSourceCount,
  index,
  primaryColor,
  onFollowUpClick,
  onItemClick,
  onClose,
  onBackToHero,
  showBackButton = false,
}: StreamingSectionRendererProps) {
  const [revealedItems, setRevealedItems] = useState<number>(0);
  const [showFollowUps, setShowFollowUps] = useState(false);
  const itemsToReveal = content?.items?.length || 0;
  const revealIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Progressive reveal of items when content loads
  useEffect(() => {
    if (content && !isLoading && itemsToReveal > 0) {
      setRevealedItems(0);

      // Reveal items one by one with staggered delay
      revealIntervalRef.current = setInterval(() => {
        setRevealedItems((prev) => {
          if (prev >= itemsToReveal) {
            if (revealIntervalRef.current) {
              clearInterval(revealIntervalRef.current);
            }
            // Show follow-ups after all items revealed
            setTimeout(() => setShowFollowUps(true), 300);
            return prev;
          }
          return prev + 1;
        });
      }, 150); // 150ms between each item reveal

      return () => {
        if (revealIntervalRef.current) {
          clearInterval(revealIntervalRef.current);
        }
      };
    }
  }, [content, isLoading, itemsToReveal]);

  // Get icon component
  const getIcon = (iconName?: string) => {
    if (!iconName) return Sparkles;
    return iconMap[iconName.toLowerCase()] || Sparkles;
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -50, height: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className={`relative py-16 md:py-24 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
    >
      {/* Back to Hero Button */}
      {showBackButton && onBackToHero && (
        <motion.button
          onClick={onBackToHero}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="absolute top-4 left-4 flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium text-sm transition-all z-10"
        >
          <Home className="w-4 h-4" />
          <span>Back to Home</span>
        </motion.button>
      )}

      {/* AI Generated Badge with KB indicator */}
      <div className={`absolute top-4 ${showBackButton ? 'left-44' : 'left-4'} flex items-center gap-3 text-xs text-gray-400`}>
        <div className="flex items-center gap-1">
          <Sparkles className="w-3 h-3" />
          <span>AI Generated</span>
        </div>
        {knowledgeSourceCount > 0 && (
          <div className="flex items-center gap-1 text-green-500">
            <BookOpen className="w-3 h-3" />
            <span>{knowledgeSourceCount} sources</span>
          </div>
        )}
      </div>

      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 transition-colors"
      >
        <X className="w-5 h-5" />
      </button>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Loading State with streaming preview */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-16">
            <motion.div
              className="w-16 h-16 rounded-full flex items-center justify-center mb-6"
              style={{ backgroundColor: `${primaryColor}15` }}
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <Loader2
                className="w-8 h-8 animate-spin"
                style={{ color: primaryColor }}
              />
            </motion.div>
            <motion.p
              className="text-gray-500 mb-2"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              Searching knowledge base...
            </motion.p>
            {streamingContent && (
              <motion.div
                className="max-w-md text-center text-gray-400 text-sm mt-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <p className="italic">{streamingContent.slice(0, 100)}...</p>
              </motion.div>
            )}
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <X className="w-8 h-8 text-red-500" />
            </div>
            <p className="text-red-500 mb-4">{error}</p>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Content with progressive reveal */}
        {content && !isLoading && !error && (
          <>
            {/* Headline with animation */}
            {content.headline && (
              <motion.div
                className="text-center mb-12"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                  {content.headline}
                </h2>
                {content.subheadline && (
                  <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                    {content.subheadline}
                  </p>
                )}
              </motion.div>
            )}

            {/* Render content based on type with staggered reveal */}
            <AnimatePresence mode="popLayout">
              {renderContentWithReveal(
                content,
                revealedItems,
                primaryColor,
                getIcon,
                onItemClick
              )}
            </AnimatePresence>

            {/* Follow-up CTAs with delayed reveal */}
            <AnimatePresence>
              {showFollowUps && suggestedFollowUps.length > 0 && (
                <motion.div
                  className="mt-12 pt-8 border-t border-gray-200"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <p className="text-center text-gray-500 mb-6 flex items-center justify-center gap-2">
                    <Lightbulb className="w-4 h-4" />
                    <span>Explore related topics</span>
                  </p>
                  <div className="flex flex-wrap justify-center gap-3">
                    {suggestedFollowUps.map((followUp, i) => (
                      <motion.button
                        key={i}
                        onClick={() => onFollowUpClick(followUp)}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.1 }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className={`
                          px-5 py-2.5 rounded-lg font-medium text-sm
                          transition-all duration-200 flex items-center gap-2
                          ${
                            followUp.priority === 'high'
                              ? 'text-white shadow-lg hover:shadow-xl'
                              : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                          }
                        `}
                        style={
                          followUp.priority === 'high'
                            ? { backgroundColor: primaryColor }
                            : {}
                        }
                      >
                        {followUp.text}
                        <ArrowRight className="w-4 h-4" />
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </div>
    </motion.section>
  );
}

// ============================================================================
// CONTENT RENDERERS WITH REVEAL ANIMATION
// ============================================================================

function renderContentWithReveal(
  content: SectionContent,
  revealedItems: number,
  primaryColor: string,
  getIcon: (name?: string) => React.ComponentType<{ className?: string }>,
  onItemClick?: (item: SectionItem, sectionType: string) => void
): React.ReactNode {
  const visibleItems = content.items.slice(0, revealedItems);

  switch (content.type) {
    case 'features-grid':
    case 'features-cards':
      return (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {visibleItems.map((item, i) => {
            const Icon = getIcon(item.icon);
            const isClickable = !!onItemClick;
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
                onClick={() => onItemClick?.(item, content.type)}
                className={`bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-all border border-gray-100 group ${isClickable ? 'cursor-pointer hover:border-blue-300 hover:ring-2 hover:ring-blue-100' : ''}`}
              >
                <div
                  className="w-12 h-12 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform"
                  style={{ backgroundColor: `${primaryColor}15`, color: primaryColor }}
                >
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {item.title}
                </h3>
                <p className="text-gray-600">{item.description}</p>
                {isClickable && (
                  <div className="mt-4 flex items-center text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: primaryColor }}>
                    <span>Learn more</span>
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      );

    case 'timeline':
      return (
        <div className="max-w-3xl mx-auto">
          <div className="relative">
            {/* Vertical line */}
            <div
              className="absolute left-8 top-0 bottom-0 w-0.5"
              style={{ backgroundColor: `${primaryColor}30` }}
            />
            <div className="space-y-8">
              {visibleItems.map((item, i) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: i * 0.1 }}
                  className="relative flex items-start gap-6"
                >
                  <motion.div
                    className="w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-lg shrink-0 z-10"
                    style={{ backgroundColor: primaryColor }}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.3, delay: i * 0.1 + 0.1 }}
                  >
                    {item.label || i + 1}
                  </motion.div>
                  <div className="pt-3">
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

    case 'faq-accordion':
      return (
        <div className="max-w-3xl mx-auto space-y-4">
          {visibleItems.map((item, i) => (
            <motion.details
              key={item.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.1 }}
              className="group bg-white rounded-xl border border-gray-200 overflow-hidden"
            >
              <summary className="flex items-center justify-between p-6 cursor-pointer list-none hover:bg-gray-50 transition-colors">
                <h3 className="text-lg font-medium text-gray-900 pr-4">
                  {item.question || item.title}
                </h3>
                <ChevronDown className="w-5 h-5 text-gray-400 group-open:rotate-180 transition-transform shrink-0" />
              </summary>
              <div className="px-6 pb-6 text-gray-600 border-t border-gray-100 pt-4">
                {item.answer || item.description}
              </div>
            </motion.details>
          ))}
        </div>
      );

    case 'stats-display':
      return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {visibleItems.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              className="text-center"
            >
              <motion.div
                className="text-4xl md:text-5xl font-bold mb-2"
                style={{ color: primaryColor }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.1 + 0.2 }}
              >
                {item.value}
              </motion.div>
              <div className="text-gray-600 font-medium">{item.title}</div>
              {item.description && (
                <p className="text-gray-400 text-sm mt-1">{item.description}</p>
              )}
            </motion.div>
          ))}
        </div>
      );

    case 'pricing-table':
      return (
        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {visibleItems.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.15 }}
              className={`
                p-6 rounded-2xl border-2 transition-all hover:shadow-lg
                ${i === 1 ? 'border-opacity-100 scale-105' : 'border-gray-200'}
              `}
              style={{
                borderColor: i === 1 ? primaryColor : undefined,
                backgroundColor: i === 1 ? `${primaryColor}05` : 'white',
              }}
            >
              {item.label && (
                <motion.span
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.15 + 0.2 }}
                  className="inline-block px-3 py-1 rounded-full text-xs font-medium text-white mb-3"
                  style={{ backgroundColor: primaryColor }}
                >
                  {item.label}
                </motion.span>
              )}
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {item.title}
              </h3>
              <div
                className="text-3xl font-bold mb-4"
                style={{ color: primaryColor }}
              >
                {item.value}
              </div>
              <p className="text-gray-600 text-sm">{item.description}</p>
            </motion.div>
          ))}
        </div>
      );

    case 'testimonials':
      return (
        <div className="grid md:grid-cols-2 gap-6">
          {visibleItems.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              className="bg-white p-6 rounded-xl shadow-sm border border-gray-100"
            >
              <div className="text-4xl text-gray-200 mb-2">&ldquo;</div>
              <p className="text-gray-600 italic mb-4">
                {item.description}
              </p>
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                  style={{ backgroundColor: primaryColor }}
                >
                  {item.title?.charAt(0) || 'A'}
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{item.title}</p>
                  {item.label && (
                    <p className="text-gray-400 text-sm">{item.label}</p>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      );

    case 'comparison-table':
      return (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <tbody>
              {visibleItems.map((item, i) => (
                <motion.tr
                  key={item.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.08 }}
                  className="border-b border-gray-200 hover:bg-gray-50"
                >
                  <td className="py-4 px-4 font-medium text-gray-900 w-1/3">
                    {item.title}
                  </td>
                  <td className="py-4 px-4 text-gray-600">{item.description}</td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      );

    case 'cta-block':
      return (
        <motion.div
          className="text-center py-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {visibleItems.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.2 }}
              className="mb-4"
            >
              <p className="text-gray-600 mb-6">{item.description}</p>
            </motion.div>
          ))}
          {content.cta && (
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-4 rounded-xl font-semibold text-lg text-white transition-all hover:shadow-lg"
              style={{ backgroundColor: primaryColor }}
            >
              {content.cta.text}
            </motion.button>
          )}
        </motion.div>
      );

    case 'text-block':
    default:
      return (
        <div className="max-w-3xl mx-auto">
          {visibleItems.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              className="mb-6"
            >
              {item.title && (
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {item.title}
                </h3>
              )}
              <p className="text-gray-600 leading-relaxed text-lg">
                {item.description}
              </p>
            </motion.div>
          ))}
        </div>
      );
  }
}

export default StreamingSectionRenderer;
