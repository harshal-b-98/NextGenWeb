'use client';

/**
 * CTACard Component
 *
 * A prominent card-style CTA with gradient background and optional pattern.
 * Best for high-impact conversion sections.
 */

import { motion } from 'framer-motion';
import { cn, container, sectionPadding, focusRing } from '@/lib/design-system';
import type { CTACardProps } from './types';

export function CTACard({
  headline,
  description,
  primaryButton,
  secondaryButton,
  background = 'gradient',
  pattern = true,
  badge,
  className,
}: CTACardProps) {
  const backgroundStyles = {
    gradient: 'bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-accent)]',
    primary: 'bg-[var(--color-primary)]',
    dark: 'bg-gray-900',
  };

  return (
    <section className={cn('bg-[var(--color-background)]', sectionPadding('md'), className)}>
      <div className={container('lg')}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className={cn(
            'relative overflow-hidden rounded-3xl',
            backgroundStyles[background],
            'px-6 py-16 sm:px-12 sm:py-20 lg:px-16 lg:py-24'
          )}
        >
          {/* Pattern */}
          {pattern && (
            <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
              <svg
                className="absolute -right-1/4 -top-1/4 w-[800px] h-[800px] opacity-10"
                fill="none"
                viewBox="0 0 800 800"
              >
                <circle cx="400" cy="400" r="400" stroke="white" strokeWidth="2" />
                <circle cx="400" cy="400" r="300" stroke="white" strokeWidth="2" />
                <circle cx="400" cy="400" r="200" stroke="white" strokeWidth="2" />
                <circle cx="400" cy="400" r="100" stroke="white" strokeWidth="2" />
              </svg>
              <svg
                className="absolute -left-1/4 -bottom-1/4 w-[600px] h-[600px] opacity-10"
                fill="none"
                viewBox="0 0 600 600"
              >
                <circle cx="300" cy="300" r="300" stroke="white" strokeWidth="2" />
                <circle cx="300" cy="300" r="200" stroke="white" strokeWidth="2" />
                <circle cx="300" cy="300" r="100" stroke="white" strokeWidth="2" />
              </svg>
            </div>
          )}

          {/* Content */}
          <div className="relative z-10 max-w-3xl mx-auto text-center">
            {/* Badge */}
            {badge && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
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
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
              {headline}
            </h2>

            {/* Description */}
            {description && (
              <p className="mt-4 text-lg text-white/80 sm:text-xl max-w-2xl mx-auto">
                {description}
              </p>
            )}

            {/* Buttons */}
            {(primaryButton || secondaryButton) && (
              <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
                {primaryButton && (
                  <a
                    href={primaryButton.href}
                    className={cn(
                      'inline-flex items-center justify-center',
                      'rounded-lg px-8 py-4',
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
                      'rounded-lg px-8 py-4',
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
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

CTACard.displayName = 'CTACard';
