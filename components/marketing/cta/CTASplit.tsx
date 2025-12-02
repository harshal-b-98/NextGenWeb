'use client';

/**
 * CTASplit Component
 *
 * A split-layout CTA with content on one side and optional image on the other.
 * Ideal for detailed CTAs with visual support.
 */

import { motion } from 'framer-motion';
import Image from 'next/image';
import { cn, container, sectionPadding, focusRing } from '@/lib/design-system';
import type { CTASplitProps } from './types';

export function CTASplit({
  headline,
  description,
  primaryButton,
  secondaryButton,
  imageSrc,
  imageAlt,
  imagePosition = 'right',
  background = 'light',
  className,
}: CTASplitProps) {
  const backgroundStyles = {
    light: 'bg-[var(--color-background)]',
    muted: 'bg-[var(--color-muted)]',
    dark: 'bg-gray-900',
  };

  const textStyles = {
    light: {
      headline: 'text-[var(--color-foreground)]',
      description: 'text-[var(--color-muted-foreground)]',
    },
    muted: {
      headline: 'text-[var(--color-foreground)]',
      description: 'text-[var(--color-muted-foreground)]',
    },
    dark: {
      headline: 'text-white',
      description: 'text-gray-300',
    },
  };

  const buttonStyles = {
    light: {
      primary: 'bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)]',
      secondary: 'bg-transparent text-[var(--color-foreground)] border border-[var(--color-border)] hover:bg-[var(--color-muted)]',
    },
    muted: {
      primary: 'bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)]',
      secondary: 'bg-transparent text-[var(--color-foreground)] border border-[var(--color-border)] hover:bg-[var(--color-card)]',
    },
    dark: {
      primary: 'bg-white text-gray-900 hover:bg-gray-100',
      secondary: 'bg-transparent text-white border border-white/30 hover:bg-white/10',
    },
  };

  const styles = textStyles[background];
  const buttons = buttonStyles[background];
  const isImageLeft = imagePosition === 'left';

  return (
    <section
      className={cn(backgroundStyles[background], sectionPadding('md'), className)}
    >
      <div className={container('lg')}>
        <div
          className={cn(
            'grid gap-8 lg:gap-16 items-center',
            imageSrc ? 'lg:grid-cols-2' : '',
            isImageLeft && imageSrc && 'lg:[&>*:first-child]:order-2'
          )}
        >
          {/* Content */}
          <motion.div
            initial={{ opacity: 0, x: isImageLeft ? 20 : -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className={cn(!imageSrc && 'max-w-2xl mx-auto text-center')}
          >
            <h2
              className={cn(
                'text-3xl font-bold tracking-tight sm:text-4xl',
                styles.headline
              )}
            >
              {headline}
            </h2>
            {description && (
              <p
                className={cn(
                  'mt-4 text-lg leading-relaxed',
                  styles.description
                )}
              >
                {description}
              </p>
            )}

            {/* Buttons */}
            {(primaryButton || secondaryButton) && (
              <div
                className={cn(
                  'mt-8 flex flex-col sm:flex-row gap-4',
                  !imageSrc && 'justify-center'
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

          {/* Image */}
          {imageSrc && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-xl"
            >
              <Image
                src={imageSrc}
                alt={imageAlt || headline}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </motion.div>
          )}
        </div>
      </div>
    </section>
  );
}

CTASplit.displayName = 'CTASplit';
