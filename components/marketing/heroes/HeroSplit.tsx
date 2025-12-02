'use client';

/**
 * HeroSplit Component
 *
 * A split-screen hero with content on one side and an image on the other.
 * Ideal for showcasing products or services visually.
 */

import { motion } from 'framer-motion';
import Image from 'next/image';
import { cn, container, focusRing } from '@/lib/design-system';
import type { HeroSplitProps } from './types';

export function HeroSplit({
  headline,
  subheadline,
  description,
  primaryButton,
  secondaryButton,
  imageSrc,
  imageAlt,
  imagePosition = 'right',
  imageOverlay = false,
  className,
}: HeroSplitProps) {
  const isImageLeft = imagePosition === 'left';

  return (
    <section
      className={cn(
        'relative overflow-hidden bg-[var(--color-background)]',
        'py-16 sm:py-20 lg:py-0',
        className
      )}
    >
      <div className={cn(container('xl'), 'lg:h-screen lg:min-h-[600px] lg:max-h-[800px]')}>
        <div
          className={cn(
            'grid gap-8 lg:gap-0 lg:grid-cols-2 items-center h-full',
            isImageLeft && 'lg:[&>*:first-child]:order-2'
          )}
        >
          {/* Content */}
          <motion.div
            initial={{ opacity: 0, x: isImageLeft ? 20 : -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className={cn(
              'flex flex-col justify-center',
              'py-8 lg:py-16',
              isImageLeft ? 'lg:pl-12 xl:pl-20' : 'lg:pr-12 xl:pr-20'
            )}
          >
            {/* Headline */}
            <h1
              className={cn(
                'text-3xl font-bold tracking-tight text-[var(--color-foreground)]',
                'sm:text-4xl lg:text-5xl xl:text-6xl',
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
                  'mt-4 text-lg text-[var(--color-muted-foreground)]',
                  'sm:text-xl lg:text-2xl',
                  'max-w-lg'
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
                  'max-w-md leading-relaxed'
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
                className="mt-8 flex flex-col sm:flex-row gap-4"
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

          {/* Image */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className={cn(
              'relative h-64 sm:h-80 lg:h-full',
              'rounded-2xl lg:rounded-none overflow-hidden'
            )}
          >
            <Image
              src={imageSrc}
              alt={imageAlt}
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
              priority
            />
            {imageOverlay && (
              <div
                className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"
                aria-hidden="true"
              />
            )}
          </motion.div>
        </div>
      </div>
    </section>
  );
}

HeroSplit.displayName = 'HeroSplit';
