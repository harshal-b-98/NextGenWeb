'use client';

/**
 * HeroGradient Component
 *
 * A vibrant hero with gradient background and centered content.
 * Creates visual impact for brand-focused pages.
 */

import { motion } from 'framer-motion';
import { cn, container, focusRing } from '@/lib/design-system';
import type { HeroGradientProps } from './types';

export function HeroGradient({
  headline,
  subheadline,
  description,
  primaryButton,
  secondaryButton,
  badge,
  gradientFrom = 'from-[var(--color-primary)]',
  gradientTo = 'to-[var(--color-accent)]',
  gradientDirection = 'to-br',
  className,
}: HeroGradientProps) {
  return (
    <section
      className={cn(
        'relative overflow-hidden',
        `bg-gradient-${gradientDirection}`,
        gradientFrom,
        gradientTo,
        'py-20 sm:py-24 lg:py-32',
        className
      )}
    >
      {/* Decorative Elements */}
      <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -top-1/2 -right-1/4 w-[800px] h-[800px] rounded-full bg-white/5 blur-3xl" />
        <div className="absolute -bottom-1/2 -left-1/4 w-[600px] h-[600px] rounded-full bg-white/5 blur-3xl" />
      </div>

      <div className={cn(container('lg'), 'relative z-10 text-center')}>
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
                  'bg-white/20 text-white backdrop-blur-sm',
                  'text-sm font-medium',
                  'border border-white/20'
                )}
              >
                {badge}
              </span>
            </motion.div>
          )}

          {/* Headline */}
          <h1
            className={cn(
              'text-4xl font-bold tracking-tight text-white',
              'sm:text-5xl lg:text-6xl',
              'leading-tight',
              'drop-shadow-sm'
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
                'mt-4 text-xl text-white/90',
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
                'mt-6 text-base text-white/80',
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
                    'bg-white text-[var(--color-primary)]',
                    'text-base font-semibold',
                    'shadow-lg hover:bg-white/90',
                    'transition-all duration-200',
                    focusRing('white')
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
                    'bg-transparent text-white',
                    'text-base font-semibold',
                    'border-2 border-white/30',
                    'hover:bg-white/10 hover:border-white/50',
                    'transition-all duration-200',
                    focusRing('white')
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

HeroGradient.displayName = 'HeroGradient';
