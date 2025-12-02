'use client';

/**
 * FAQTwoColumn Component
 *
 * Grid-based FAQ layout showing all questions and answers at once.
 * Perfect for shorter FAQ sections where all content should be visible.
 */

import { motion } from 'framer-motion';
import { cn, container, sectionPadding } from '@/lib/design-system';
import type { FAQTwoColumnProps } from './types';

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

export function FAQTwoColumn({
  headline,
  subheadline,
  items,
  columns = 2,
  background = 'light',
  className,
}: FAQTwoColumnProps) {
  const bgStyles = {
    light: 'bg-[var(--color-background)]',
    muted: 'bg-[var(--color-muted)]',
    dark: 'bg-[var(--color-foreground)]',
  };

  const textStyles = {
    light: {
      headline: 'text-[var(--color-foreground)]',
      subheadline: 'text-[var(--color-muted-foreground)]',
      question: 'text-[var(--color-foreground)]',
      answer: 'text-[var(--color-muted-foreground)]',
    },
    muted: {
      headline: 'text-[var(--color-foreground)]',
      subheadline: 'text-[var(--color-muted-foreground)]',
      question: 'text-[var(--color-foreground)]',
      answer: 'text-[var(--color-muted-foreground)]',
    },
    dark: {
      headline: 'text-white',
      subheadline: 'text-white/70',
      question: 'text-white',
      answer: 'text-white/80',
    },
  };

  const styles = textStyles[background];

  return (
    <section className={cn(bgStyles[background], sectionPadding('md'), className)}>
      <div className={container('lg')}>
        {/* Header */}
        {(headline || subheadline) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center max-w-2xl mx-auto mb-12"
          >
            {headline && (
              <h2
                className={cn(
                  'text-3xl font-bold tracking-tight sm:text-4xl',
                  styles.headline
                )}
              >
                {headline}
              </h2>
            )}
            {subheadline && (
              <p className={cn('mt-4 text-lg', styles.subheadline)}>{subheadline}</p>
            )}
          </motion.div>
        )}

        {/* FAQ Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className={cn(
            'grid gap-x-12 gap-y-10',
            columns === 2 ? 'md:grid-cols-2' : 'grid-cols-1 max-w-3xl mx-auto'
          )}
        >
          {items.map((item, index) => (
            <motion.div key={index} variants={itemVariants}>
              {item.category && (
                <span
                  className={cn(
                    'inline-block text-xs font-semibold uppercase tracking-wider mb-2',
                    background === 'dark' ? 'text-white/50' : 'text-[var(--color-primary)]'
                  )}
                >
                  {item.category}
                </span>
              )}
              <h3 className={cn('text-lg font-semibold mb-3', styles.question)}>
                {item.question}
              </h3>
              <p className={cn('text-base leading-relaxed', styles.answer)}>{item.answer}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

FAQTwoColumn.displayName = 'FAQTwoColumn';
