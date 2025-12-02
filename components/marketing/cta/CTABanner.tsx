'use client';

/**
 * CTABanner Component
 *
 * A horizontal call-to-action banner with headline and buttons.
 * Perfect for site-wide promotions or simple conversion points.
 */

import { motion } from 'framer-motion';
import { cn, container, focusRing } from '@/lib/design-system';
import type { CTABannerProps } from './types';

export function CTABanner({
  headline,
  description,
  primaryButton,
  secondaryButton,
  background = 'primary',
  alignment = 'center',
  className,
}: CTABannerProps) {
  const backgroundStyles = {
    primary: 'bg-[var(--color-primary)]',
    dark: 'bg-gray-900',
    gradient: 'bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-accent)]',
    light: 'bg-[var(--color-muted)]',
  };

  const textStyles = {
    primary: { headline: 'text-white', description: 'text-white/80' },
    dark: { headline: 'text-white', description: 'text-gray-300' },
    gradient: { headline: 'text-white', description: 'text-white/80' },
    light: { headline: 'text-[var(--color-foreground)]', description: 'text-[var(--color-muted-foreground)]' },
  };

  const buttonStyles = {
    primary: {
      primary: 'bg-white text-[var(--color-primary)] hover:bg-white/90',
      secondary: 'bg-transparent text-white border-2 border-white/30 hover:bg-white/10',
    },
    dark: {
      primary: 'bg-white text-gray-900 hover:bg-gray-100',
      secondary: 'bg-transparent text-white border-2 border-white/30 hover:bg-white/10',
    },
    gradient: {
      primary: 'bg-white text-[var(--color-primary)] hover:bg-white/90',
      secondary: 'bg-transparent text-white border-2 border-white/30 hover:bg-white/10',
    },
    light: {
      primary: 'bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)]',
      secondary: 'bg-transparent text-[var(--color-foreground)] border border-[var(--color-border)] hover:bg-[var(--color-card)]',
    },
  };

  const alignmentStyles = {
    left: 'text-left',
    center: 'text-center',
    between: 'text-left',
  };

  const styles = textStyles[background];
  const buttons = buttonStyles[background];

  return (
    <section className={cn(backgroundStyles[background], 'py-12 lg:py-16', className)}>
      <div className={container('lg')}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className={cn(
            'flex flex-col gap-6',
            alignment === 'between'
              ? 'lg:flex-row lg:items-center lg:justify-between'
              : alignment === 'center'
              ? 'items-center'
              : 'items-start',
            alignmentStyles[alignment]
          )}
        >
          {/* Content */}
          <div className={cn(alignment === 'between' ? 'lg:max-w-2xl' : 'max-w-2xl')}>
            <h2 className={cn('text-2xl font-bold sm:text-3xl', styles.headline)}>
              {headline}
            </h2>
            {description && (
              <p className={cn('mt-2 text-base sm:text-lg', styles.description)}>
                {description}
              </p>
            )}
          </div>

          {/* Buttons */}
          {(primaryButton || secondaryButton) && (
            <div
              className={cn(
                'flex flex-col sm:flex-row gap-3',
                alignment === 'center' && 'justify-center'
              )}
            >
              {primaryButton && (
                <a
                  href={primaryButton.href}
                  className={cn(
                    'inline-flex items-center justify-center',
                    'rounded-lg px-6 py-3',
                    'text-base font-semibold',
                    'shadow-sm transition-all duration-200',
                    buttons.primary,
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
                    'text-base font-semibold',
                    'transition-all duration-200',
                    buttons.secondary,
                    focusRing()
                  )}
                >
                  {secondaryButton.text}
                </a>
              )}
            </div>
          )}
        </motion.div>
      </div>
    </section>
  );
}

CTABanner.displayName = 'CTABanner';
