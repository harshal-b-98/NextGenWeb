'use client';

/**
 * HeroConversational Component
 * Phase 6: Conversational Marketing Platform
 *
 * A hero section designed for conversational marketing experiences.
 * CTAs trigger inline content generation instead of navigation.
 * Features:
 * - Multiple conversational CTAs that generate inline sections
 * - Chat bubble integration for direct conversations
 * - Smooth scroll to generated sections
 * - Journey tracking for conversion optimization
 */

import { useCallback, useId } from 'react';
import { motion } from 'framer-motion';
import { MessageCircle, Sparkles, ArrowRight } from 'lucide-react';
import { cn, container, focusRing } from '@/lib/design-system';
import { useChatContextOptional, type CTASource } from '@/lib/interactive/chat/chat-context';
import type { HeroConversationalProps, ConversationalCTAConfig } from './types';

export function HeroConversational({
  headline,
  subheadline,
  description,
  conversationalCTAs = [],
  chatPrompt,
  badge,
  backgroundVariant = 'gradient',
  showChatBubble = true,
  onCTAClick,
  className,
}: HeroConversationalProps) {
  const uniqueId = useId();
  const chatContext = useChatContextOptional();

  /**
   * Handle CTA click - trigger inline content generation
   */
  const handleCTAClick = useCallback(
    (cta: ConversationalCTAConfig, index: number) => {
      const ctaSource: CTASource = {
        ctaId: `${uniqueId}-cta-${index}`,
        ctaType: 'hero-cta',
        ctaText: cta.text,
        sectionId: 'hero',
        metadata: {
          topic: cta.topic || cta.text,
          ...(cta.intent && { intent: cta.intent }),
          priority: String(cta.priority || index),
        },
      };

      // Trigger chat context for inline section generation
      if (chatContext) {
        chatContext.triggerFromCTA(ctaSource, {
          message: cta.promptOverride,
          renderMode: 'inline-section',
        });
      }

      // Call external handler if provided
      onCTAClick?.(cta, ctaSource);
    },
    [chatContext, onCTAClick, uniqueId]
  );

  /**
   * Handle chat bubble click - open chat with optional prompt
   */
  const handleChatClick = useCallback(() => {
    if (chatContext) {
      if (chatPrompt) {
        chatContext.triggerChat({
          message: chatPrompt,
          autoSend: false,
          renderMode: 'chat-bubble',
        });
      } else {
        chatContext.openChat();
      }
    }
  }, [chatContext, chatPrompt]);

  // Background variants
  const backgroundStyles = {
    gradient: 'bg-gradient-to-br from-[var(--color-primary)] via-[var(--color-primary-hover)] to-[var(--color-secondary)]',
    pattern: 'bg-[var(--color-background)]',
    solid: 'bg-[var(--color-primary)]',
    light: 'bg-[var(--color-muted)]',
  };

  const textStyles = {
    gradient: 'text-white',
    pattern: 'text-[var(--color-foreground)]',
    solid: 'text-white',
    light: 'text-[var(--color-foreground)]',
  };

  return (
    <section
      className={cn(
        'relative overflow-hidden',
        'py-20 sm:py-24 lg:py-32',
        backgroundStyles[backgroundVariant],
        className
      )}
    >
      {/* Background Pattern for 'pattern' variant */}
      {backgroundVariant === 'pattern' && (
        <div className="absolute inset-0 -z-10">
          <div
            className="absolute inset-0 bg-[linear-gradient(to_right,var(--color-border)_1px,transparent_1px),linear-gradient(to_bottom,var(--color-border)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,black_70%,transparent_110%)]"
            aria-hidden="true"
          />
        </div>
      )}

      {/* Decorative blobs for gradient variant */}
      {backgroundVariant === 'gradient' && (
        <>
          <div
            className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-white/10 blur-3xl"
            aria-hidden="true"
          />
          <div
            className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-white/10 blur-3xl"
            aria-hidden="true"
          />
        </>
      )}

      <div className={cn(container('lg'), 'text-center relative z-10')}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-4xl"
        >
          {/* Badge */}
          {badge && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="mb-6"
            >
              <span
                className={cn(
                  'inline-flex items-center gap-2 rounded-full px-4 py-1.5',
                  backgroundVariant === 'gradient' || backgroundVariant === 'solid'
                    ? 'bg-white/20 text-white'
                    : 'bg-[var(--color-primary-light)] text-[var(--color-primary)]',
                  'text-sm font-medium'
                )}
              >
                <Sparkles className="w-4 h-4" />
                {badge}
              </span>
            </motion.div>
          )}

          {/* Headline */}
          <h1
            className={cn(
              'text-4xl font-bold tracking-tight',
              'sm:text-5xl lg:text-6xl',
              'leading-tight',
              textStyles[backgroundVariant]
            )}
          >
            {headline}
          </h1>

          {/* Subheadline */}
          {subheadline && (
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className={cn(
                'mt-4 text-xl sm:text-2xl',
                'max-w-2xl mx-auto',
                backgroundVariant === 'gradient' || backgroundVariant === 'solid'
                  ? 'text-white/90'
                  : 'text-[var(--color-muted-foreground)]'
              )}
            >
              {subheadline}
            </motion.p>
          )}

          {/* Description */}
          {description && (
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className={cn(
                'mt-6 text-base sm:text-lg',
                'max-w-xl mx-auto leading-relaxed',
                backgroundVariant === 'gradient' || backgroundVariant === 'solid'
                  ? 'text-white/80'
                  : 'text-[var(--color-muted-foreground)]'
              )}
            >
              {description}
            </motion.p>
          )}

          {/* Conversational CTAs */}
          {conversationalCTAs.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="mt-10"
            >
              {/* Primary CTA (first one) */}
              {conversationalCTAs.length > 0 && (
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <ConversationalCTAButton
                    cta={conversationalCTAs[0]}
                    onClick={() => handleCTAClick(conversationalCTAs[0], 0)}
                    variant="primary"
                    backgroundVariant={backgroundVariant}
                  />

                  {/* Secondary CTA (second one) */}
                  {conversationalCTAs.length > 1 && (
                    <ConversationalCTAButton
                      cta={conversationalCTAs[1]}
                      onClick={() => handleCTAClick(conversationalCTAs[1], 1)}
                      variant="secondary"
                      backgroundVariant={backgroundVariant}
                    />
                  )}
                </div>
              )}

              {/* Additional CTAs as smaller buttons */}
              {conversationalCTAs.length > 2 && (
                <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                  {conversationalCTAs.slice(2).map((cta, index) => (
                    <ConversationalCTAButton
                      key={index + 2}
                      cta={cta}
                      onClick={() => handleCTAClick(cta, index + 2)}
                      variant="tertiary"
                      backgroundVariant={backgroundVariant}
                    />
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* Chat Bubble Prompt */}
          {showChatBubble && chatContext && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="mt-10"
            >
              <button
                onClick={handleChatClick}
                className={cn(
                  'inline-flex items-center gap-2 px-5 py-2.5 rounded-full',
                  'text-sm font-medium',
                  'transition-all duration-200',
                  backgroundVariant === 'gradient' || backgroundVariant === 'solid'
                    ? 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
                    : 'bg-[var(--color-background)] hover:bg-[var(--color-muted)] text-[var(--color-foreground)] border border-[var(--color-border)]',
                  focusRing()
                )}
              >
                <MessageCircle className="w-4 h-4" />
                {chatPrompt || 'Ask me anything...'}
              </button>
            </motion.div>
          )}
        </motion.div>
      </div>
    </section>
  );
}

/**
 * Individual CTA Button for the conversational hero
 */
interface ConversationalCTAButtonProps {
  cta: ConversationalCTAConfig;
  onClick: () => void;
  variant: 'primary' | 'secondary' | 'tertiary';
  backgroundVariant: 'gradient' | 'pattern' | 'solid' | 'light';
}

function ConversationalCTAButton({
  cta,
  onClick,
  variant,
  backgroundVariant,
}: ConversationalCTAButtonProps) {
  const isDarkBg = backgroundVariant === 'gradient' || backgroundVariant === 'solid';

  const variantStyles = {
    primary: isDarkBg
      ? 'bg-white text-[var(--color-primary)] hover:bg-white/90 shadow-lg'
      : 'bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)] shadow-sm',
    secondary: isDarkBg
      ? 'bg-white/10 text-white hover:bg-white/20 border border-white/30'
      : 'bg-transparent text-[var(--color-foreground)] hover:bg-[var(--color-muted)] border border-[var(--color-border)]',
    tertiary: isDarkBg
      ? 'bg-transparent text-white/90 hover:text-white hover:bg-white/10'
      : 'bg-transparent text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] hover:bg-[var(--color-muted)]',
  };

  const sizeStyles = {
    primary: 'px-6 py-3 text-base font-semibold rounded-lg',
    secondary: 'px-6 py-3 text-base font-semibold rounded-lg',
    tertiary: 'px-4 py-2 text-sm font-medium rounded-full',
  };

  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        'inline-flex items-center justify-center gap-2',
        'transition-all duration-200',
        variantStyles[variant],
        sizeStyles[variant],
        focusRing()
      )}
    >
      {cta.icon && <span className="w-5 h-5">{cta.icon}</span>}
      {cta.text}
      {variant !== 'tertiary' && (
        <ArrowRight className="w-4 h-4" />
      )}
    </motion.button>
  );
}

HeroConversational.displayName = 'HeroConversational';
