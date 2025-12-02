'use client';

/**
 * FeaturesCards Component
 *
 * Card-based feature showcase with hover effects and optional links.
 * Great for clickable feature sections that lead to detail pages.
 */

import { motion } from 'framer-motion';
import Image from 'next/image';
import { cn, container, sectionPadding, focusRing } from '@/lib/design-system';
import type { FeaturesCardsProps } from './types';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4 },
  },
};

export function FeaturesCards({
  headline,
  subheadline,
  features,
  columns = 3,
  cardStyle = 'elevated',
  showArrows = true,
  className,
}: FeaturesCardsProps) {
  const gridCols = {
    2: 'md:grid-cols-2',
    3: 'md:grid-cols-2 lg:grid-cols-3',
    4: 'md:grid-cols-2 lg:grid-cols-4',
  };

  const cardStyles = {
    elevated: cn(
      'bg-[var(--color-card)]',
      'shadow-sm hover:shadow-lg',
      'border border-transparent'
    ),
    bordered: cn(
      'bg-[var(--color-card)]',
      'border border-[var(--color-border)]',
      'hover:border-[var(--color-primary)]'
    ),
    filled: cn(
      'bg-[var(--color-muted)]',
      'border border-transparent',
      'hover:bg-[var(--color-card)] hover:shadow-md'
    ),
  };

  const CardWrapper = ({ feature, children }: { feature: typeof features[0]; children: React.ReactNode }) => {
    if (feature.href) {
      return (
        <a href={feature.href} className={cn('block h-full', focusRing())}>
          {children}
        </a>
      );
    }
    return <>{children}</>;
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
            className="text-center max-w-3xl mx-auto mb-12 lg:mb-16"
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

        {/* Cards Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className={cn('grid gap-6 lg:gap-8', gridCols[columns])}
        >
          {features.map((feature, index) => (
            <motion.div
              key={index}
              variants={cardVariants}
              className="h-full"
            >
              <CardWrapper feature={feature}>
                <div
                  className={cn(
                    'group relative h-full rounded-xl overflow-hidden',
                    'transition-all duration-300',
                    cardStyles[cardStyle],
                    feature.href && 'cursor-pointer'
                  )}
                >
                  {/* Image */}
                  {feature.imageSrc && (
                    <div className="relative h-48 overflow-hidden">
                      <Image
                        src={feature.imageSrc}
                        alt={feature.imageAlt || feature.title}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      />
                    </div>
                  )}

                  {/* Content */}
                  <div className="p-6">
                    {/* Icon (when no image) */}
                    {feature.icon && !feature.imageSrc && (
                      <div
                        className={cn(
                          'inline-flex items-center justify-center w-12 h-12 mb-4',
                          'rounded-lg bg-[var(--color-primary-light)]',
                          'text-[var(--color-primary)]',
                          'transition-colors duration-200',
                          'group-hover:bg-[var(--color-primary)] group-hover:text-white'
                        )}
                      >
                        {feature.icon}
                      </div>
                    )}

                    {/* Title & Arrow */}
                    <div className="flex items-start justify-between gap-4">
                      <h3
                        className={cn(
                          'text-lg font-semibold text-[var(--color-foreground)]',
                          'group-hover:text-[var(--color-primary)]',
                          'transition-colors duration-200'
                        )}
                      >
                        {feature.title}
                      </h3>

                      {/* Arrow */}
                      {showArrows && feature.href && (
                        <div
                          className={cn(
                            'flex-shrink-0 w-8 h-8 rounded-full',
                            'flex items-center justify-center',
                            'bg-[var(--color-muted)]',
                            'text-[var(--color-muted-foreground)]',
                            'transition-all duration-200',
                            'group-hover:bg-[var(--color-primary)] group-hover:text-white',
                            'translate-x-0 group-hover:translate-x-1'
                          )}
                        >
                          <svg
                            className="w-4 h-4"
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
                        </div>
                      )}
                    </div>

                    {/* Description */}
                    <p
                      className={cn(
                        'mt-2 text-sm text-[var(--color-muted-foreground)]',
                        'leading-relaxed'
                      )}
                    >
                      {feature.description}
                    </p>
                  </div>
                </div>
              </CardWrapper>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

FeaturesCards.displayName = 'FeaturesCards';
