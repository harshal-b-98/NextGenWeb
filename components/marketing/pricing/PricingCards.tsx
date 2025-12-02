'use client';

/**
 * PricingCards Component
 *
 * Card-based pricing display with clear visual hierarchy.
 * Perfect for simple pricing with highlighted recommended plans.
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { cn, container, sectionPadding, focusRing } from '@/lib/design-system';
import type { PricingCardsProps } from './types';

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

export function PricingCards({
  headline,
  subheadline,
  tiers,
  showToggle = true,
  defaultBilling = 'monthly',
  yearlyDiscount = 'Save 20%',
  columns = 3,
  className,
}: PricingCardsProps) {
  const [billing, setBilling] = useState<'monthly' | 'yearly'>(defaultBilling);

  const formatPrice = (price: number | string, currency = '$') => {
    if (typeof price === 'string') return price;
    return `${currency}${price}`;
  };

  const gridCols = {
    2: 'md:grid-cols-2 max-w-4xl',
    3: 'md:grid-cols-2 lg:grid-cols-3 max-w-6xl',
    4: 'md:grid-cols-2 lg:grid-cols-4 max-w-7xl',
  };

  return (
    <section
      className={cn('bg-[var(--color-muted)]', sectionPadding('md'), className)}
    >
      <div className={container('lg')}>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-3xl mx-auto mb-12"
        >
          {headline && (
            <h2 className="text-3xl font-bold tracking-tight text-[var(--color-foreground)] sm:text-4xl">
              {headline}
            </h2>
          )}
          {subheadline && (
            <p className="mt-4 text-lg text-[var(--color-muted-foreground)]">
              {subheadline}
            </p>
          )}

          {/* Billing Toggle */}
          {showToggle && (
            <div className="mt-8 inline-flex items-center gap-1 p-1 rounded-lg bg-[var(--color-card)] border border-[var(--color-border)]">
              <button
                onClick={() => setBilling('monthly')}
                className={cn(
                  'px-4 py-2 rounded-md text-sm font-medium transition-all',
                  billing === 'monthly'
                    ? 'bg-[var(--color-primary)] text-white'
                    : 'text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]',
                  focusRing()
                )}
              >
                Monthly
              </button>
              <button
                onClick={() => setBilling('yearly')}
                className={cn(
                  'px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2',
                  billing === 'yearly'
                    ? 'bg-[var(--color-primary)] text-white'
                    : 'text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]',
                  focusRing()
                )}
              >
                Yearly
                {yearlyDiscount && billing !== 'yearly' && (
                  <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                    {yearlyDiscount}
                  </span>
                )}
              </button>
            </div>
          )}
        </motion.div>

        {/* Pricing Cards */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className={cn('grid gap-8 mx-auto', gridCols[columns])}
        >
          {tiers.map((tier) => (
            <motion.div
              key={tier.name}
              variants={cardVariants}
              className={cn(
                'relative rounded-2xl overflow-hidden',
                'flex flex-col',
                tier.highlighted
                  ? 'bg-[var(--color-primary)] text-white shadow-xl scale-105'
                  : 'bg-[var(--color-card)] border border-[var(--color-border)] shadow-sm'
              )}
            >
              {/* Badge */}
              {tier.badge && (
                <div
                  className={cn(
                    'absolute top-0 right-0 px-4 py-1 text-xs font-semibold',
                    tier.highlighted
                      ? 'bg-white/20 text-white'
                      : 'bg-[var(--color-primary)] text-white rounded-bl-lg'
                  )}
                >
                  {tier.badge}
                </div>
              )}

              {/* Header */}
              <div className="p-6 lg:p-8">
                <h3
                  className={cn(
                    'text-xl font-semibold',
                    tier.highlighted ? 'text-white' : 'text-[var(--color-foreground)]'
                  )}
                >
                  {tier.name}
                </h3>
                {tier.description && (
                  <p
                    className={cn(
                      'mt-2 text-sm',
                      tier.highlighted ? 'text-white/80' : 'text-[var(--color-muted-foreground)]'
                    )}
                  >
                    {tier.description}
                  </p>
                )}

                {/* Price */}
                <div className="mt-6 flex items-baseline gap-1">
                  <span
                    className={cn(
                      'text-5xl font-bold tracking-tight',
                      tier.highlighted ? 'text-white' : 'text-[var(--color-foreground)]'
                    )}
                  >
                    {formatPrice(
                      billing === 'yearly' && tier.price.yearly
                        ? tier.price.yearly
                        : tier.price.monthly,
                      tier.currency
                    )}
                  </span>
                  {typeof tier.price.monthly === 'number' && (
                    <span
                      className={cn(
                        'text-sm',
                        tier.highlighted ? 'text-white/70' : 'text-[var(--color-muted-foreground)]'
                      )}
                    >
                      /month
                    </span>
                  )}
                </div>

                {/* CTA Button */}
                <a
                  href={tier.buttonHref}
                  className={cn(
                    'mt-6 block w-full rounded-lg px-4 py-3',
                    'text-center text-sm font-semibold',
                    'transition-all duration-200',
                    tier.highlighted
                      ? 'bg-white text-[var(--color-primary)] hover:bg-white/90'
                      : 'bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)]',
                    focusRing()
                  )}
                >
                  {tier.buttonText}
                </a>
              </div>

              {/* Features */}
              <div
                className={cn(
                  'flex-1 p-6 lg:p-8 pt-0',
                  tier.highlighted
                    ? 'border-t border-white/20'
                    : 'border-t border-[var(--color-border)]'
                )}
              >
                <p
                  className={cn(
                    'text-sm font-medium mb-4',
                    tier.highlighted ? 'text-white' : 'text-[var(--color-foreground)]'
                  )}
                >
                  What&apos;s included:
                </p>
                <ul className="space-y-3">
                  {tier.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start gap-3">
                      {feature.included ? (
                        <svg
                          className={cn(
                            'h-5 w-5 flex-shrink-0',
                            tier.highlighted ? 'text-white' : 'text-green-500'
                          )}
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <svg
                          className={cn(
                            'h-5 w-5 flex-shrink-0',
                            tier.highlighted ? 'text-white/40' : 'text-gray-300'
                          )}
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      )}
                      <span
                        className={cn(
                          'text-sm',
                          feature.included
                            ? tier.highlighted
                              ? 'text-white'
                              : 'text-[var(--color-foreground)]'
                            : tier.highlighted
                            ? 'text-white/50'
                            : 'text-[var(--color-muted-foreground)]'
                        )}
                      >
                        {feature.text}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

PricingCards.displayName = 'PricingCards';
