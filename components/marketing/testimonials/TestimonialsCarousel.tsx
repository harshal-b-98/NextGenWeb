'use client';

/**
 * TestimonialsCarousel Component
 *
 * A carousel/slider showcasing testimonials one at a time with navigation.
 * Perfect for highlighting individual customer stories.
 */

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { cn, container, sectionPadding, focusRing } from '@/lib/design-system';
import type { TestimonialsCarouselProps } from './types';

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction < 0 ? 300 : -300,
    opacity: 0,
  }),
};

export function TestimonialsCarousel({
  headline,
  subheadline,
  testimonials,
  autoPlay = true,
  autoPlayInterval = 5000,
  showDots = true,
  showArrows = true,
  className,
}: TestimonialsCarouselProps) {
  const [[currentIndex, direction], setCurrentIndex] = useState([0, 0]);

  const paginate = useCallback(
    (newDirection: number) => {
      const newIndex =
        (currentIndex + newDirection + testimonials.length) % testimonials.length;
      setCurrentIndex([newIndex, newDirection]);
    },
    [currentIndex, testimonials.length]
  );

  const goToSlide = (index: number) => {
    const direction = index > currentIndex ? 1 : -1;
    setCurrentIndex([index, direction]);
  };

  // Auto-play
  useEffect(() => {
    if (!autoPlay) return;

    const interval = setInterval(() => {
      paginate(1);
    }, autoPlayInterval);

    return () => clearInterval(interval);
  }, [autoPlay, autoPlayInterval, paginate]);

  const currentTestimonial = testimonials[currentIndex];

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
            className="text-center max-w-3xl mx-auto mb-12"
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

        {/* Carousel */}
        <div className="relative max-w-4xl mx-auto">
          {/* Arrows */}
          {showArrows && (
            <>
              <button
                onClick={() => paginate(-1)}
                className={cn(
                  'absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 lg:-translate-x-12',
                  'w-10 h-10 rounded-full flex items-center justify-center',
                  'bg-[var(--color-card)] border border-[var(--color-border)]',
                  'text-[var(--color-muted-foreground)]',
                  'hover:bg-[var(--color-muted)] hover:text-[var(--color-foreground)]',
                  'transition-all duration-200',
                  'shadow-sm',
                  'z-10',
                  focusRing()
                )}
                aria-label="Previous testimonial"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>
              <button
                onClick={() => paginate(1)}
                className={cn(
                  'absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 lg:translate-x-12',
                  'w-10 h-10 rounded-full flex items-center justify-center',
                  'bg-[var(--color-card)] border border-[var(--color-border)]',
                  'text-[var(--color-muted-foreground)]',
                  'hover:bg-[var(--color-muted)] hover:text-[var(--color-foreground)]',
                  'transition-all duration-200',
                  'shadow-sm',
                  'z-10',
                  focusRing()
                )}
                aria-label="Next testimonial"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
            </>
          )}

          {/* Slide Content */}
          <div className="overflow-hidden px-4 lg:px-8">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={currentIndex}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{
                  x: { type: 'spring', stiffness: 300, damping: 30 },
                  opacity: { duration: 0.2 },
                }}
                className="text-center"
              >
                {/* Quote Icon */}
                <svg
                  className="w-12 h-12 mx-auto mb-6 text-[var(--color-primary)] opacity-30"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                </svg>

                {/* Quote */}
                <blockquote>
                  <p
                    className={cn(
                      'text-xl lg:text-2xl text-[var(--color-foreground)]',
                      'leading-relaxed font-medium'
                    )}
                  >
                    &ldquo;{currentTestimonial.quote}&rdquo;
                  </p>
                </blockquote>

                {/* Author */}
                <div className="mt-8 flex flex-col items-center gap-4">
                  {currentTestimonial.author.avatarSrc && (
                    <div className="relative w-16 h-16 rounded-full overflow-hidden">
                      <Image
                        src={currentTestimonial.author.avatarSrc}
                        alt={currentTestimonial.author.name}
                        fill
                        className="object-cover"
                        sizes="64px"
                      />
                    </div>
                  )}
                  <div>
                    <p className="font-semibold text-[var(--color-foreground)]">
                      {currentTestimonial.author.name}
                    </p>
                    {(currentTestimonial.author.title ||
                      currentTestimonial.author.company) && (
                      <p className="text-sm text-[var(--color-muted-foreground)]">
                        {currentTestimonial.author.title}
                        {currentTestimonial.author.title &&
                          currentTestimonial.author.company &&
                          ', '}
                        {currentTestimonial.author.company}
                      </p>
                    )}
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Dots */}
          {showDots && testimonials.length > 1 && (
            <div className="flex justify-center gap-2 mt-8">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToSlide(index)}
                  className={cn(
                    'w-2.5 h-2.5 rounded-full transition-all duration-200',
                    index === currentIndex
                      ? 'bg-[var(--color-primary)] w-8'
                      : 'bg-[var(--color-border)] hover:bg-[var(--color-muted-foreground)]',
                    focusRing()
                  )}
                  aria-label={`Go to testimonial ${index + 1}`}
                  aria-current={index === currentIndex ? 'true' : 'false'}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

TestimonialsCarousel.displayName = 'TestimonialsCarousel';
