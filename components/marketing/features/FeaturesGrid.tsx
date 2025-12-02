'use client';

/**
 * FeaturesGrid Component
 *
 * A clean grid layout showcasing features with icons and descriptions.
 * Best for highlighting multiple product features or services.
 */

import { motion } from 'framer-motion';
import { cn, container, sectionPadding } from '@/lib/design-system';
import type { FeaturesGridProps } from './types';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5 },
  },
};

export function FeaturesGrid({
  headline,
  subheadline,
  features,
  columns = 3,
  iconStyle = 'circle',
  alignment = 'center',
  className,
}: FeaturesGridProps) {
  const gridCols = {
    2: 'md:grid-cols-2',
    3: 'md:grid-cols-2 lg:grid-cols-3',
    4: 'md:grid-cols-2 lg:grid-cols-4',
  };

  const iconStyles = {
    circle: 'rounded-full bg-[var(--color-primary-light)]',
    square: 'rounded-lg bg-[var(--color-primary-light)]',
    none: '',
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
            className={cn(
              'mb-12 lg:mb-16',
              alignment === 'center' ? 'text-center max-w-2xl mx-auto' : 'max-w-3xl'
            )}
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

        {/* Features Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className={cn('grid gap-8 lg:gap-12', gridCols[columns])}
        >
          {features.map((feature, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              className={cn(
                alignment === 'center' && 'text-center'
              )}
            >
              {/* Icon */}
              {feature.icon && iconStyle !== 'none' && (
                <div
                  className={cn(
                    'inline-flex items-center justify-center w-12 h-12 mb-4',
                    'text-[var(--color-primary)]',
                    iconStyles[iconStyle]
                  )}
                >
                  {feature.icon}
                </div>
              )}
              {feature.icon && iconStyle === 'none' && (
                <div className="mb-4 text-[var(--color-primary)]">
                  {feature.icon}
                </div>
              )}

              {/* Title */}
              <h3
                className={cn(
                  'text-lg font-semibold text-[var(--color-foreground)]',
                  'mb-2'
                )}
              >
                {feature.title}
              </h3>

              {/* Description */}
              <p
                className={cn(
                  'text-base text-[var(--color-muted-foreground)]',
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
                    'inline-flex items-center mt-4',
                    'text-sm font-medium text-[var(--color-primary)]',
                    'hover:text-[var(--color-primary-hover)]',
                    'transition-colors duration-200',
                    'group'
                  )}
                >
                  Learn more
                  <svg
                    className="ml-1 w-4 h-4 transition-transform group-hover:translate-x-1"
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
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

FeaturesGrid.displayName = 'FeaturesGrid';
