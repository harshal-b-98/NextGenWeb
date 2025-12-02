'use client';

/**
 * PricingTable Component
 *
 * A traditional pricing table layout comparing multiple tiers side by side.
 * Best for detailed feature comparisons across plans.
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { cn, container, sectionPadding, focusRing } from '@/lib/design-system';
import type { PricingTableProps } from './types';

export function PricingTable({
  headline,
  subheadline,
  tiers,
  showToggle = true,
  defaultBilling = 'monthly',
  yearlyDiscount = 'Save 20%',
  className,
}: PricingTableProps) {
  const [billing, setBilling] = useState<'monthly' | 'yearly'>(defaultBilling);

  const formatPrice = (price: number | string, currency = '$') => {
    if (typeof price === 'string') return price;
    return `${currency}${price}`;
  };

  return (
    <section
      className={cn('bg-[var(--color-background)]', sectionPadding('md'), className)}
    >
      <div className={container('xl')}>
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
            <div className="mt-8 flex items-center justify-center gap-4">
              <span
                className={cn(
                  'text-sm font-medium transition-colors',
                  billing === 'monthly'
                    ? 'text-[var(--color-foreground)]'
                    : 'text-[var(--color-muted-foreground)]'
                )}
              >
                Monthly
              </span>
              <button
                onClick={() => setBilling(billing === 'monthly' ? 'yearly' : 'monthly')}
                className={cn(
                  'relative inline-flex h-6 w-11 items-center rounded-full',
                  'transition-colors duration-200',
                  billing === 'yearly'
                    ? 'bg-[var(--color-primary)]'
                    : 'bg-[var(--color-muted)]',
                  focusRing()
                )}
                role="switch"
                aria-checked={billing === 'yearly'}
              >
                <span
                  className={cn(
                    'inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform',
                    billing === 'yearly' ? 'translate-x-6' : 'translate-x-1'
                  )}
                />
              </button>
              <span
                className={cn(
                  'text-sm font-medium transition-colors',
                  billing === 'yearly'
                    ? 'text-[var(--color-foreground)]'
                    : 'text-[var(--color-muted-foreground)]'
                )}
              >
                Yearly
              </span>
              {yearlyDiscount && (
                <span className="ml-2 rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
                  {yearlyDiscount}
                </span>
              )}
            </div>
          )}
        </motion.div>

        {/* Pricing Table */}
        <div className="overflow-x-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className={cn(
              'grid gap-0',
              tiers.length === 2 && 'md:grid-cols-2 max-w-4xl mx-auto',
              tiers.length === 3 && 'md:grid-cols-3',
              tiers.length >= 4 && 'md:grid-cols-4'
            )}
          >
            {tiers.map((tier, index) => (
              <div
                key={tier.name}
                className={cn(
                  'relative flex flex-col',
                  'border border-[var(--color-border)]',
                  index === 0 && 'rounded-l-xl md:rounded-l-xl rounded-r-xl md:rounded-r-none',
                  index === tiers.length - 1 && 'rounded-r-xl md:rounded-r-xl rounded-l-xl md:rounded-l-none',
                  index > 0 && index < tiers.length - 1 && 'rounded-xl md:rounded-none',
                  tier.highlighted && 'border-[var(--color-primary)] border-2 z-10 shadow-lg md:-my-4 md:py-4',
                  !tier.highlighted && 'bg-[var(--color-card)]',
                  tier.highlighted && 'bg-[var(--color-card)]'
                )}
              >
                {/* Badge */}
                {tier.badge && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="inline-flex rounded-full bg-[var(--color-primary)] px-4 py-1 text-xs font-semibold text-white">
                      {tier.badge}
                    </span>
                  </div>
                )}

                {/* Header */}
                <div className={cn('p-6 text-center', tier.badge && 'pt-8')}>
                  <h3 className="text-lg font-semibold text-[var(--color-foreground)]">
                    {tier.name}
                  </h3>
                  {tier.description && (
                    <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
                      {tier.description}
                    </p>
                  )}
                  <div className="mt-4">
                    <span className="text-4xl font-bold text-[var(--color-foreground)]">
                      {formatPrice(
                        billing === 'yearly' && tier.price.yearly
                          ? tier.price.yearly
                          : tier.price.monthly,
                        tier.currency
                      )}
                    </span>
                    {typeof tier.price.monthly === 'number' && (
                      <span className="text-[var(--color-muted-foreground)]">/mo</span>
                    )}
                  </div>
                  <a
                    href={tier.buttonHref}
                    className={cn(
                      'mt-6 block w-full rounded-lg px-4 py-2.5',
                      'text-sm font-semibold text-center',
                      'transition-all duration-200',
                      tier.highlighted
                        ? 'bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)]'
                        : 'bg-[var(--color-muted)] text-[var(--color-foreground)] hover:bg-[var(--color-border)]',
                      focusRing()
                    )}
                  >
                    {tier.buttonText}
                  </a>
                </div>

                {/* Features */}
                <div className="flex-1 border-t border-[var(--color-border)] p-6">
                  <ul className="space-y-3">
                    {tier.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start gap-3">
                        {feature.included ? (
                          <svg
                            className="h-5 w-5 flex-shrink-0 text-green-500"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <svg
                            className="h-5 w-5 flex-shrink-0 text-gray-300"
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
                              ? 'text-[var(--color-foreground)]'
                              : 'text-[var(--color-muted-foreground)]'
                          )}
                        >
                          {feature.text}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}

PricingTable.displayName = 'PricingTable';
