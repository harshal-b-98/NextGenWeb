'use client';

/**
 * TestimonialsQuote Component
 *
 * A single large, impactful testimonial quote.
 * Ideal for featuring your best customer endorsement prominently.
 */

import { motion } from 'framer-motion';
import Image from 'next/image';
import { cn, container, sectionPadding } from '@/lib/design-system';
import type { TestimonialsQuoteProps } from './types';

export function TestimonialsQuote({
  headline,
  testimonial,
  background = 'light',
  className,
}: TestimonialsQuoteProps) {
  const backgroundStyles = {
    light: 'bg-[var(--color-background)]',
    dark: 'bg-gray-900',
    gradient: 'bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-accent)]',
  };

  const textStyles = {
    light: {
      headline: 'text-[var(--color-foreground)]',
      quote: 'text-[var(--color-foreground)]',
      author: 'text-[var(--color-foreground)]',
      role: 'text-[var(--color-muted-foreground)]',
      icon: 'text-[var(--color-primary)] opacity-20',
    },
    dark: {
      headline: 'text-white',
      quote: 'text-white',
      author: 'text-white',
      role: 'text-gray-400',
      icon: 'text-white opacity-20',
    },
    gradient: {
      headline: 'text-white',
      quote: 'text-white',
      author: 'text-white',
      role: 'text-white/70',
      icon: 'text-white opacity-20',
    },
  };

  const styles = textStyles[background];

  return (
    <section
      className={cn(
        backgroundStyles[background],
        sectionPadding('lg'),
        className
      )}
    >
      <div className={container('lg')}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-4xl mx-auto text-center"
        >
          {/* Headline */}
          {headline && (
            <h2
              className={cn(
                'text-sm font-semibold uppercase tracking-wider mb-8',
                styles.headline,
                'opacity-60'
              )}
            >
              {headline}
            </h2>
          )}

          {/* Quote Icon */}
          <svg
            className={cn('w-16 h-16 mx-auto mb-8', styles.icon)}
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
          </svg>

          {/* Quote */}
          <blockquote>
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className={cn(
                'text-2xl sm:text-3xl lg:text-4xl',
                'font-medium leading-relaxed',
                styles.quote
              )}
            >
              &ldquo;{testimonial.quote}&rdquo;
            </motion.p>
          </blockquote>

          {/* Author */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mt-10 flex flex-col items-center gap-4"
          >
            {testimonial.author.avatarSrc && (
              <div
                className={cn(
                  'relative w-20 h-20 rounded-full overflow-hidden',
                  'ring-4',
                  background === 'light'
                    ? 'ring-[var(--color-border)]'
                    : 'ring-white/20'
                )}
              >
                <Image
                  src={testimonial.author.avatarSrc}
                  alt={testimonial.author.name}
                  fill
                  className="object-cover"
                  sizes="80px"
                />
              </div>
            )}
            <div>
              <p className={cn('text-xl font-semibold', styles.author)}>
                {testimonial.author.name}
              </p>
              {(testimonial.author.title || testimonial.author.company) && (
                <p className={cn('text-base mt-1', styles.role)}>
                  {testimonial.author.title}
                  {testimonial.author.title && testimonial.author.company && ' at '}
                  {testimonial.author.company}
                </p>
              )}
            </div>

            {/* Company Logo */}
            {testimonial.logoSrc && (
              <div
                className={cn(
                  'mt-4 relative h-10 w-32',
                  background !== 'light' && 'brightness-0 invert opacity-70'
                )}
              >
                <Image
                  src={testimonial.logoSrc}
                  alt={testimonial.author.company || 'Company logo'}
                  fill
                  className="object-contain"
                  sizes="128px"
                />
              </div>
            )}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

TestimonialsQuote.displayName = 'TestimonialsQuote';
