'use client';

/**
 * HeroCentered Component
 *
 * A centered hero section with headline, subheadline, and CTA buttons.
 * Best for landing pages that need a strong, focused message.
 */

import { motion } from 'framer-motion';
import { cn, container, focusRing } from '@/lib/design-system';
import type { HeroCenteredProps } from './types';

export function HeroCentered({
  headline,
  subheadline,
  description,
  primaryButton,
  secondaryButton,
  badge,
  backgroundPattern = true,
  className,
}: HeroCenteredProps) {
  return (
    <section
      className={cn(
        'relative overflow-hidden bg-[var(--color-background)]',
        'py-20 sm:py-24 lg:py-32',
        className
      )}
    >
      {/* Background Pattern */}
      {backgroundPattern && (
        <div className="absolute inset-0 -z-10">
          <div
            className="absolute inset-0 bg-[linear-gradient(to_right,var(--color-border)_1px,transparent_1px),linear-gradient(to_bottom,var(--color-border)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,black_70%,transparent_110%)]"
            aria-hidden="true"
          />
        </div>
      )}

      <div className={cn(container('lg'), 'text-center')}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-3xl"
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
                  'inline-flex items-center rounded-full px-4 py-1.5',
                  'bg-[var(--color-primary-light)] text-[var(--color-primary)]',
                  'text-sm font-medium'
                )}
              >
                {badge}
              </span>
            </motion.div>
          )}

          {/* Headline */}
          <h1
            className={cn(
              'text-4xl font-bold tracking-tight text-[var(--color-foreground)]',
              'sm:text-5xl lg:text-6xl',
              'leading-tight'
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
                'mt-4 text-xl text-[var(--color-muted-foreground)]',
                'sm:text-2xl',
                'max-w-2xl mx-auto'
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
                'mt-6 text-base text-[var(--color-muted-foreground)]',
                'sm:text-lg',
                'max-w-xl mx-auto leading-relaxed'
              )}
            >
              {description}
            </motion.p>
          )}

          {/* CTA Buttons */}
          {(primaryButton || secondaryButton) && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              {primaryButton && (
                <a
                  href={primaryButton.href}
                  className={cn(
                    'inline-flex items-center justify-center',
                    'rounded-lg px-6 py-3',
                    'bg-[var(--color-primary)] text-white',
                    'text-base font-semibold',
                    'shadow-sm hover:bg-[var(--color-primary-hover)]',
                    'transition-all duration-200',
                    focusRing()
                  )}
                >
                  {primaryButton.text}
                </a>
              )}
              {secondaryButton && (
                <a
                  href={secondaryButton.href}
                  className={cn(
                    'inline-flex items-center justify-center',
                    'rounded-lg px-6 py-3',
                    'bg-transparent text-[var(--color-foreground)]',
                    'text-base font-semibold',
                    'border border-[var(--color-border)]',
                    'hover:bg-[var(--color-muted)] hover:border-[var(--color-border-hover)]',
                    'transition-all duration-200',
                    focusRing()
                  )}
                >
                  {secondaryButton.text}
                </a>
              )}
            </motion.div>
          )}
        </motion.div>
      </div>
    </section>
  );
}

HeroCentered.displayName = 'HeroCentered';
