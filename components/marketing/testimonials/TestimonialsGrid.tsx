'use client';

/**
 * TestimonialsGrid Component
 *
 * A grid layout displaying multiple testimonials with author info and optional ratings.
 * Great for showcasing social proof from multiple customers.
 */

import { motion } from 'framer-motion';
import Image from 'next/image';
import { cn, container, sectionPadding } from '@/lib/design-system';
import type { TestimonialsGridProps } from './types';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5 },
  },
};

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-1" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          className={cn(
            'w-5 h-5',
            star <= rating
              ? 'text-yellow-400 fill-yellow-400'
              : 'text-gray-300 fill-gray-300'
          )}
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

export function TestimonialsGrid({
  headline,
  subheadline,
  testimonials,
  columns = 3,
  showRating = true,
  showLogos = false,
  className,
}: TestimonialsGridProps) {
  const gridCols = {
    2: 'md:grid-cols-2',
    3: 'md:grid-cols-2 lg:grid-cols-3',
  };

  return (
    <section
      className={cn(
        'bg-[var(--color-muted)]',
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

        {/* Testimonials Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className={cn('grid gap-6 lg:gap-8', gridCols[columns])}
        >
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              variants={cardVariants}
              className={cn(
                'bg-[var(--color-card)] rounded-xl p-6 lg:p-8',
                'border border-[var(--color-border)]',
                'shadow-sm'
              )}
            >
              {/* Rating */}
              {showRating && testimonial.rating && (
                <div className="mb-4">
                  <StarRating rating={testimonial.rating} />
                </div>
              )}

              {/* Quote */}
              <blockquote className="mb-6">
                <p
                  className={cn(
                    'text-base text-[var(--color-foreground)]',
                    'leading-relaxed'
                  )}
                >
                  &ldquo;{testimonial.quote}&rdquo;
                </p>
              </blockquote>

              {/* Author */}
              <div className="flex items-center gap-4">
                {testimonial.author.avatarSrc && (
                  <div className="relative w-12 h-12 rounded-full overflow-hidden flex-shrink-0">
                    <Image
                      src={testimonial.author.avatarSrc}
                      alt={testimonial.author.name}
                      fill
                      className="object-cover"
                      sizes="48px"
                    />
                  </div>
                )}
                <div className="min-w-0">
                  <p className="font-semibold text-[var(--color-foreground)] truncate">
                    {testimonial.author.name}
                  </p>
                  {(testimonial.author.title || testimonial.author.company) && (
                    <p className="text-sm text-[var(--color-muted-foreground)] truncate">
                      {testimonial.author.title}
                      {testimonial.author.title && testimonial.author.company && ', '}
                      {testimonial.author.company}
                    </p>
                  )}
                </div>
              </div>

              {/* Logo */}
              {showLogos && testimonial.logoSrc && (
                <div className="mt-6 pt-6 border-t border-[var(--color-border)]">
                  <div className="relative h-8 w-24">
                    <Image
                      src={testimonial.logoSrc}
                      alt={testimonial.author.company || 'Company logo'}
                      fill
                      className="object-contain object-left"
                      sizes="96px"
                    />
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

TestimonialsGrid.displayName = 'TestimonialsGrid';
