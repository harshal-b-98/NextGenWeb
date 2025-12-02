'use client';

/**
 * ConversationalHero Component
 * Phase 6: Conversational Marketing Platform
 *
 * The main landing page hero with conversational CTAs.
 * Features:
 * - Gradient hero section
 * - Personalized CTA buttons
 * - Chat input for custom queries
 * - Streaming section generation
 * - Component-by-component reveal animation
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageCircle,
  Loader2,
  Sparkles,
  ChevronDown,
  ArrowRight,
  Zap,
  Box,
  Users,
  BarChart3,
  HelpCircle,
  Mail,
  Send,
} from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

export interface ConversationalCTA {
  id: string;
  text: string;
  topic: string;
  description?: string;
  icon?: string;
  variant: 'primary' | 'secondary' | 'tertiary';
}

export interface ConversationalHeroProps {
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
  /** CTA buttons to display */
  ctas: ConversationalCTA[];
  /** Whether content is being generated */
  isGenerating?: boolean;
  /** Currently active CTA ID */
  activeCtaId?: string | null;
  /** Callback when CTA is clicked */
  onCTAClick?: (cta: ConversationalCTA) => void;
  /** Callback when chat message is submitted */
  onChatSubmit?: (message: string) => void;
  /** Whether there are generated sections below */
  hasGeneratedContent?: boolean;
  /** Scroll to content callback */
  onScrollToContent?: () => void;
}

// Icon mapping
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  zap: Zap,
  box: Box,
  users: Users,
  chart: BarChart3,
  help: HelpCircle,
  mail: Mail,
  sparkles: Sparkles,
  default: ArrowRight,
};

// ============================================================================
// COMPONENT
// ============================================================================

export function ConversationalHero({
  title,
  tagline,
  description,
  logo,
  primaryColor = '#3B82F6',
  ctas,
  isGenerating = false,
  activeCtaId = null,
  onCTAClick,
  onChatSubmit,
  hasGeneratedContent = false,
  onScrollToContent,
}: ConversationalHeroProps) {
  const [chatInput, setChatInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Group CTAs by variant
  const primaryCTAs = ctas.filter((c) => c.variant === 'primary');
  const secondaryCTAs = ctas.filter((c) => c.variant === 'secondary');
  const tertiaryCTAs = ctas.filter((c) => c.variant === 'tertiary');

  const handleSubmit = useCallback(() => {
    if (chatInput.trim() && onChatSubmit) {
      onChatSubmit(chatInput.trim());
      setChatInput('');
    }
  }, [chatInput, onChatSubmit]);

  const getIcon = (iconName?: string) => {
    const Icon = iconMap[iconName || 'default'] || ArrowRight;
    return Icon;
  };

  return (
    <section className="relative min-h-screen flex flex-col justify-center items-center overflow-hidden">
      {/* Background gradient */}
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(135deg, ${primaryColor} 0%, ${adjustColor(primaryColor, -40)} 100%)`,
        }}
      />

      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-white/10"
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.1, 0.15, 0.1],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-white/10"
          animate={{
            scale: [1.1, 1, 1.1],
            opacity: [0.15, 0.1, 0.15],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-white/5 blur-3xl" />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white py-20">
        {/* Logo or Title */}
        {logo ? (
          <motion.img
            src={logo}
            alt={title}
            className="h-16 mx-auto mb-8"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          />
        ) : (
          <motion.h1
            className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {title}
          </motion.h1>
        )}

        {/* Tagline */}
        {tagline && (
          <motion.p
            className="text-2xl md:text-3xl text-white/90 mb-4 font-light"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            {tagline}
          </motion.p>
        )}

        {/* Description */}
        {description && (
          <motion.p
            className="text-lg md:text-xl text-white/70 mb-12 max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            {description}
          </motion.p>
        )}

        {/* Primary CTAs */}
        {primaryCTAs.length > 0 && (
          <motion.div
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            {primaryCTAs.map((cta) => {
              const Icon = getIcon(cta.icon);
              const isActive = activeCtaId === cta.id;
              return (
                <motion.button
                  key={cta.id}
                  onClick={() => onCTAClick?.(cta)}
                  disabled={isGenerating}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed bg-white shadow-xl hover:shadow-2xl min-w-[200px]"
                  style={{ color: primaryColor }}
                >
                  {isGenerating && isActive ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Icon className="w-5 h-5" />
                  )}
                  {cta.text}
                </motion.button>
              );
            })}
          </motion.div>
        )}

        {/* Secondary CTAs */}
        {secondaryCTAs.length > 0 && (
          <motion.div
            className="flex flex-wrap items-center justify-center gap-3 mb-8"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            {secondaryCTAs.map((cta) => {
              const Icon = getIcon(cta.icon);
              const isActive = activeCtaId === cta.id;
              return (
                <motion.button
                  key={cta.id}
                  onClick={() => onCTAClick?.(cta)}
                  disabled={isGenerating}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium text-base transition-all duration-200 bg-white/10 hover:bg-white/20 border border-white/30 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isGenerating && isActive ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Icon className="w-4 h-4" />
                  )}
                  {cta.text}
                </motion.button>
              );
            })}
          </motion.div>
        )}

        {/* Tertiary CTAs (link-style) */}
        {tertiaryCTAs.length > 0 && (
          <motion.div
            className="flex flex-wrap items-center justify-center gap-6 mb-12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            {tertiaryCTAs.map((cta) => (
              <button
                key={cta.id}
                onClick={() => onCTAClick?.(cta)}
                disabled={isGenerating}
                className="text-sm font-medium text-white/80 hover:text-white underline-offset-4 hover:underline transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
                ref={inputRef}
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && chatInput.trim()) {
                    handleSubmit();
                  }
                }}
                placeholder="Ask me anything..."
                className="flex-1 bg-transparent border-none outline-none text-white placeholder:text-white/50 py-3 px-2 text-base"
                disabled={isGenerating}
              />
              <button
                onClick={handleSubmit}
                disabled={!chatInput.trim() || isGenerating}
                className="p-3 rounded-xl font-medium bg-white transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg"
                style={{ color: primaryColor }}
              >
                {isGenerating && !activeCtaId ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
          <p className="text-white/50 text-sm mt-3">
            Ask questions or click a button above to explore
          </p>
        </motion.div>

        {/* Scroll indicator */}
        <AnimatePresence>
          {hasGeneratedContent && (
            <motion.div
              className="absolute bottom-8 left-1/2 -translate-x-1/2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, y: [0, 10, 0] }}
              exit={{ opacity: 0 }}
              transition={{
                opacity: { duration: 0.3 },
                y: { repeat: Infinity, duration: 2 },
              }}
            >
              <button
                onClick={onScrollToContent}
                className="text-white/60 hover:text-white transition-colors"
              >
                <ChevronDown className="w-8 h-8" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}

// ============================================================================
// UTILITY
// ============================================================================

function adjustColor(hex: string, amount: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.min(255, Math.max(0, (num >> 16) + amount));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00ff) + amount));
  const b = Math.min(255, Math.max(0, (num & 0x0000ff) + amount));
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

export default ConversationalHero;
