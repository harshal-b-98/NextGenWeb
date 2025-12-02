'use client';

/**
 * FeaturesBento Component
 *
 * A modern bento box layout with varying sizes to create visual hierarchy.
 * Perfect for highlighting key features with different levels of importance.
 */

import { motion } from 'framer-motion';
import Image from 'next/image';
import { cn, container, sectionPadding } from '@/lib/design-system';
import type { FeaturesBentoProps } from './types';

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
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.5 },
  },
};

export function FeaturesBento({
  headline,
  subheadline,
  features,
  variant = 'default',
  className,
}: FeaturesBentoProps) {
  // Different grid layouts based on variant
  const getGridClasses = () => {
    switch (variant) {
      case 'asymmetric':
        return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';
      case 'hero-left':
      case 'hero-right':
        return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';
      default:
        return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4';
    }
  };

  // Get item size based on index and variant
  const getItemClasses = (index: number) => {
    switch (variant) {
      case 'asymmetric':
        // First item spans 2 columns, rest are single
        if (index === 0) return 'md:col-span-2 lg:col-span-2 lg:row-span-2';
        return '';
      case 'hero-left':
        // First item is large on left
        if (index === 0) return 'md:col-span-2 md:row-span-2';
        return '';
      case 'hero-right':
        // Second and third items are regular, first is large
        if (index === 2) return 'md:col-span-2 md:row-span-2 md:order-first lg:order-none';
        return '';
      default:
        // Default: first two span 2 columns each
        if (index < 2) return 'md:col-span-2';
        return '';
    }
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

        {/* Bento Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className={cn('grid gap-4 lg:gap-6', getGridClasses())}
        >
          {features.map((feature, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              className={cn(
                'group relative overflow-hidden rounded-2xl',
                'bg-[var(--color-card)] border border-[var(--color-border)]',
                'transition-all duration-300',
                'hover:shadow-lg hover:border-[var(--color-border-hover)]',
                getItemClasses(index)
              )}
            >
              {/* Background Image */}
              {feature.imageSrc && (
                <div className="absolute inset-0">
                  <Image
                    src={feature.imageSrc}
                    alt={feature.imageAlt || feature.title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
                </div>
              )}

              {/* Content */}
              <div
                className={cn(
                  'relative p-6 lg:p-8 h-full flex flex-col',
                  feature.imageSrc ? 'text-white min-h-[240px] justify-end' : 'min-h-[200px]'
                )}
              >
                {/* Icon */}
                {feature.icon && !feature.imageSrc && (
                  <div
                    className={cn(
                      'inline-flex items-center justify-center w-10 h-10 mb-4',
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
                    'text-lg font-semibold mb-2',
                    feature.imageSrc
                      ? 'text-white'
                      : 'text-[var(--color-foreground)]'
                  )}
                >
                  {feature.title}
                </h3>

                {/* Description */}
                <p
                  className={cn(
                    'text-sm leading-relaxed',
                    feature.imageSrc
                      ? 'text-white/80'
                      : 'text-[var(--color-muted-foreground)]'
                  )}
                >
                  {feature.description}
                </p>

                {/* Link Arrow */}
                {feature.href && (
                  <a
                    href={feature.href}
                    className={cn(
                      'absolute top-4 right-4',
                      'w-8 h-8 rounded-full flex items-center justify-center',
                      'transition-all duration-200',
                      feature.imageSrc
                        ? 'bg-white/20 text-white hover:bg-white/30'
                        : 'bg-[var(--color-muted)] text-[var(--color-muted-foreground)] hover:bg-[var(--color-primary-light)] hover:text-[var(--color-primary)]',
                      'opacity-0 group-hover:opacity-100'
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
                        d="M7 17L17 7M17 7H7M17 7V17"
                      />
                    </svg>
                  </a>
                )}
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

FeaturesBento.displayName = 'FeaturesBento';
