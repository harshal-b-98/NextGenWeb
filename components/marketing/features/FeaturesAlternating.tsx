'use client';

/**
 * FeaturesAlternating Component
 *
 * Alternating image and text sections that create visual rhythm.
 * Ideal for detailed feature explanations with supporting visuals.
 */

import { motion } from 'framer-motion';
import Image from 'next/image';
import { cn, container, sectionPadding } from '@/lib/design-system';
import type { FeaturesAlternatingProps } from './types';

export function FeaturesAlternating({
  headline,
  subheadline,
  features,
  imagePosition = 'alternating',
  className,
}: FeaturesAlternatingProps) {
  const getImagePosition = (index: number): 'left' | 'right' => {
    if (imagePosition === 'alternating') {
      return index % 2 === 0 ? 'right' : 'left';
    }
    return imagePosition;
  };

  return (
    <section
      className={cn(
        'bg-[var(--color-background)]',
        sectionPadding('md'),
        className
      )}
    >
      <div className={container('lg')}>
        {/* Section Header */}
        {(headline || subheadline) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center max-w-3xl mx-auto mb-16 lg:mb-20"
          >
            {headline && (
              <h2
                className={cn(
                  'text-3xl font-bold tracking-tight text-[var(--color-foreground)]',
                  'sm:text-4xl'
                )}
              >
                {headline}
              </h2>
            )}
            {subheadline && (
              <p
                className={cn(
                  'mt-4 text-lg text-[var(--color-muted-foreground)]',
                  'leading-relaxed'
                )}
              >
                {subheadline}
              </p>
            )}
          </motion.div>
        )}

        {/* Features */}
        <div className="space-y-16 lg:space-y-24">
          {features.map((feature, index) => {
            const isImageLeft = getImagePosition(index) === 'left';

            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-100px' }}
                transition={{ duration: 0.6 }}
                className={cn(
                  'grid gap-8 lg:gap-16 items-center',
                  'lg:grid-cols-2',
                  isImageLeft && 'lg:[&>*:first-child]:order-2'
                )}
              >
                {/* Content */}
                <div className={cn(isImageLeft ? 'lg:pl-8' : 'lg:pr-8')}>
                  {/* Icon */}
                  {feature.icon && (
                    <div
                      className={cn(
                        'inline-flex items-center justify-center w-12 h-12 mb-6',
                        'rounded-lg bg-[var(--color-primary-light)]',
                        'text-[var(--color-primary)]'
                      )}
                    >
                      {feature.icon}
                    </div>
                  )}

                  {/* Title */}
                  <h3
                    className={cn(
                      'text-2xl font-bold text-[var(--color-foreground)]',
                      'sm:text-3xl',
                      'mb-4'
                    )}
                  >
                    {feature.title}
                  </h3>

                  {/* Description */}
                  <p
                    className={cn(
                      'text-base text-[var(--color-muted-foreground)]',
                      'sm:text-lg',
                      'leading-relaxed'
                    )}
                  >
                    {feature.description}
                  </p>

                  {/* Link */}
                  {feature.href && (
                    <a
                      href={feature.href}
                      className={cn(
                        'inline-flex items-center mt-6',
                        'text-base font-medium text-[var(--color-primary)]',
                        'hover:text-[var(--color-primary-hover)]',
                        'transition-colors duration-200',
                        'group'
                      )}
                    >
                      Learn more
                      <svg
                        className="ml-2 w-5 h-5 transition-transform group-hover:translate-x-1"
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
                </div>

                {/* Image */}
                {feature.imageSrc && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className={cn(
                      'relative aspect-[4/3] rounded-2xl overflow-hidden',
                      'bg-[var(--color-muted)]',
                      'shadow-lg'
                    )}
                  >
                    <Image
                      src={feature.imageSrc}
                      alt={feature.imageAlt || feature.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 1024px) 100vw, 50vw"
                    />
                  </motion.div>
                )}

                {/* Placeholder if no image */}
                {!feature.imageSrc && (
                  <div
                    className={cn(
                      'relative aspect-[4/3] rounded-2xl overflow-hidden',
                      'bg-gradient-to-br from-[var(--color-primary-light)] to-[var(--color-muted)]',
                      'flex items-center justify-center'
                    )}
                  >
                    {feature.icon && (
                      <div className="text-[var(--color-primary)] opacity-30 scale-[3]">
                        {feature.icon}
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

FeaturesAlternating.displayName = 'FeaturesAlternating';
