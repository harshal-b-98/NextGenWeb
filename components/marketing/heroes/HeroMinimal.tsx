'use client';

/**
 * HeroMinimal Component
 *
 * A clean, minimal hero focusing on typography and whitespace.
 * Best for content-focused or editorial sites.
 */

import { motion } from 'framer-motion';
import { cn, container, focusRing } from '@/lib/design-system';
import type { HeroMinimalProps } from './types';

export function HeroMinimal({
  headline,
  subheadline,
  description,
  primaryButton,
  secondaryButton,
  align = 'left',
  maxWidth = 'lg',
  className,
}: HeroMinimalProps) {
  const alignmentClasses = {
    left: 'text-left',
    center: 'text-center mx-auto',
    right: 'text-right ml-auto',
  };

  const maxWidthClasses = {
    sm: 'max-w-xl',
    md: 'max-w-2xl',
    lg: 'max-w-3xl',
    xl: 'max-w-4xl',
  };

  return (
    <section
      className={cn(
        'bg-[var(--color-background)]',
        'py-16 sm:py-20 lg:py-28',
        className
      )}
    >
      <div className={container('lg')}>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
          className={cn(alignmentClasses[align], maxWidthClasses[maxWidth])}
        >
          {/* Headline */}
          <h1
            className={cn(
              'text-3xl font-semibold tracking-tight text-[var(--color-foreground)]',
              'sm:text-4xl lg:text-5xl',
              'leading-snug'
            )}
          >
            {headline}
          </h1>

          {/* Subheadline */}
          {subheadline && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className={cn(
                'mt-4 text-lg text-[var(--color-muted-foreground)]',
                'sm:text-xl',
                'leading-relaxed'
              )}
            >
              {subheadline}
            </motion.p>
          )}

          {/* Description */}
          {description && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.15 }}
              className={cn(
                'mt-6 text-base text-[var(--color-muted-foreground)]',
                'leading-relaxed'
              )}
            >
              {description}
            </motion.p>
          )}

          {/* CTA Buttons */}
          {(primaryButton || secondaryButton) && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className={cn(
                'mt-8 flex gap-4',
                align === 'center' && 'justify-center',
                align === 'right' && 'justify-end'
              )}
            >
              {primaryButton && (
                <a
                  href={primaryButton.href}
                  className={cn(
                    'inline-flex items-center',
                    'text-base font-medium text-[var(--color-primary)]',
                    'hover:text-[var(--color-primary-hover)]',
                    'transition-colors duration-200',
                    focusRing(),
                    'group'
                  )}
                >
                  {primaryButton.text}
                  <svg
                    className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M17 8l4 4m0 0l-4 4m4-4H3"
                    />
                  </svg>
                </a>
              )}
              {secondaryButton && (
                <a
                  href={secondaryButton.href}
                  className={cn(
                    'inline-flex items-center',
                    'text-base font-medium text-[var(--color-muted-foreground)]',
                    'hover:text-[var(--color-foreground)]',
                    'transition-colors duration-200',
                    focusRing()
                  )}
                >
                  {secondaryButton.text}
                </a>
              )}
            </motion.div>
          )}

          {/* Decorative line */}
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className={cn(
              'mt-12 h-px bg-[var(--color-border)]',
              align === 'center' && 'origin-center',
              align === 'left' && 'origin-left',
              align === 'right' && 'origin-right'
            )}
          />
        </motion.div>
      </div>
    </section>
  );
}

HeroMinimal.displayName = 'HeroMinimal';
