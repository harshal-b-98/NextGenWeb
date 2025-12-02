/**
 * Pricing Component Types
 *
 * Shared types and interfaces for all pricing component variants.
 */

import type { ComponentMetadata } from '@/lib/design-system/tokens';

export interface PricingFeature {
  text: string;
  included: boolean;
  tooltip?: string;
}

export interface PricingTier {
  name: string;
  description?: string;
  price: {
    monthly: number | string;
    yearly?: number | string;
  };
  currency?: string;
  features: PricingFeature[];
  buttonText: string;
  buttonHref: string;
  highlighted?: boolean;
  badge?: string;
}

export interface PricingBaseProps {
  headline?: string;
  subheadline?: string;
  tiers: PricingTier[];
  className?: string;
}

export interface PricingTableProps extends PricingBaseProps {
  showToggle?: boolean;
  defaultBilling?: 'monthly' | 'yearly';
  yearlyDiscount?: string;
}

export interface PricingCardsProps extends PricingBaseProps {
  showToggle?: boolean;
  defaultBilling?: 'monthly' | 'yearly';
  yearlyDiscount?: string;
  columns?: 2 | 3 | 4;
}

// AI Component Metadata for each pricing variant
export const pricingMetadata: Record<string, ComponentMetadata> = {
  'pricing-table': {
    id: 'pricing-table',
    name: 'Pricing Table',
    category: 'pricing',
    variant: 'table',
    description:
      'A traditional pricing table layout comparing multiple tiers side by side. Best for detailed feature comparisons across plans.',
    bestFor: [
      'SaaS pricing',
      'Feature comparison',
      'Multiple tiers',
      'Enterprise plans',
    ],
    contentRequirements: {
      required: ['tiers'],
      optional: ['headline', 'subheadline'],
    },
    styleTags: ['comparison', 'detailed', 'organized', 'enterprise'],
    conversionFocus: 'decision',
  },
  'pricing-cards': {
    id: 'pricing-cards',
    name: 'Pricing Cards',
    category: 'pricing',
    variant: 'cards',
    description:
      'Card-based pricing display with clear visual hierarchy. Perfect for simple pricing with highlighted recommended plans.',
    bestFor: [
      'Simple pricing',
      'Consumer products',
      'Subscription services',
      'Clean layouts',
    ],
    contentRequirements: {
      required: ['tiers'],
      optional: ['headline', 'subheadline'],
    },
    styleTags: ['clean', 'visual', 'focused', 'consumer-friendly'],
    conversionFocus: 'decision',
  },
};

// Export all pricing component IDs for the AI selection system
export const pricingComponentIds = Object.keys(pricingMetadata);
