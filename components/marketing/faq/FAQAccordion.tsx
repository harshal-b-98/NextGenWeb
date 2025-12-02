'use client';

/**
 * FAQAccordion Component
 *
 * Expandable FAQ section with smooth animations.
 * Users can click to reveal answers one at a time or multiple simultaneously.
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn, container, sectionPadding } from '@/lib/design-system';
import type { FAQAccordionProps } from './types';

export function FAQAccordion({
  headline,
  subheadline,
  items,
  allowMultiple = false,
  defaultOpen = [],
  background = 'light',
  className,
}: FAQAccordionProps) {
  const [openItems, setOpenItems] = useState<number[]>(defaultOpen);

  const toggleItem = (index: number) => {
    if (allowMultiple) {
      setOpenItems((prev) =>
        prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
      );
    } else {
      setOpenItems((prev) => (prev.includes(index) ? [] : [index]));
    }
  };

  const isOpen = (index: number) => openItems.includes(index);

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
      border: 'border-[var(--color-border)]',
      hover: 'hover:bg-[var(--color-muted)]',
    },
    muted: {
      headline: 'text-[var(--color-foreground)]',
      subheadline: 'text-[var(--color-muted-foreground)]',
      question: 'text-[var(--color-foreground)]',
      answer: 'text-[var(--color-muted-foreground)]',
      border: 'border-[var(--color-border)]',
      hover: 'hover:bg-[var(--color-background)]',
    },
    dark: {
      headline: 'text-white',
      subheadline: 'text-white/70',
      question: 'text-white',
      answer: 'text-white/80',
      border: 'border-white/20',
      hover: 'hover:bg-white/5',
    },
  };

  const styles = textStyles[background];

  return (
    <section className={cn(bgStyles[background], sectionPadding('md'), className)}>
      <div className={container('md')}>
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

        {/* Accordion Items */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="max-w-3xl mx-auto divide-y divide-[var(--color-border)]"
        >
          {items.map((item, index) => (
            <div key={index} className={cn('border-b', styles.border)}>
              <button
                onClick={() => toggleItem(index)}
                className={cn(
                  'flex w-full items-center justify-between py-5 text-left',
                  'transition-colors duration-200',
                  styles.hover
                )}
                aria-expanded={isOpen(index)}
                aria-controls={`faq-answer-${index}`}
              >
                <span className={cn('text-base font-medium pr-4', styles.question)}>
                  {item.question}
                </span>
                <motion.span
                  animate={{ rotate: isOpen(index) ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex-shrink-0"
                >
                  <svg
                    className={cn('h-5 w-5', styles.question)}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </motion.span>
              </button>
              <AnimatePresence initial={false}>
                {isOpen(index) && (
                  <motion.div
                    id={`faq-answer-${index}`}
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                    className="overflow-hidden"
                  >
                    <p className={cn('pb-5 text-base leading-relaxed', styles.answer)}>
                      {item.answer}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

FAQAccordion.displayName = 'FAQAccordion';
