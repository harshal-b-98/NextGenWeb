/**
 * CTA Component Types
 *
 * Shared types and interfaces for all call-to-action component variants.
 */

import type { ComponentMetadata } from '@/lib/design-system/tokens';

export interface CTAButton {
  text: string;
  href: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
}

export interface CTABaseProps {
  headline: string;
  description?: string;
  primaryButton?: CTAButton;
  secondaryButton?: CTAButton;
  className?: string;
}

export interface CTABannerProps extends CTABaseProps {
  background?: 'primary' | 'dark' | 'gradient' | 'light';
  alignment?: 'left' | 'center' | 'between';
}

export interface CTASplitProps extends CTABaseProps {
  imageSrc?: string;
  imageAlt?: string;
  imagePosition?: 'left' | 'right';
  background?: 'light' | 'muted' | 'dark';
}

export interface CTACardProps extends CTABaseProps {
  background?: 'gradient' | 'primary' | 'dark';
  pattern?: boolean;
  badge?: string;
}

export interface CTANewsletterProps {
  headline: string;
  description?: string;
  placeholder?: string;
  buttonText?: string;
  privacyText?: string;
  background?: 'light' | 'muted' | 'dark';
  onSubmit?: (email: string) => void | Promise<void>;
  className?: string;
}

// AI Component Metadata for each CTA variant
export const ctaMetadata: Record<string, ComponentMetadata> = {
  'cta-banner': {
    id: 'cta-banner',
    name: 'CTA Banner',
    category: 'cta',
    variant: 'banner',
    description:
      'A horizontal call-to-action banner with headline and buttons. Perfect for site-wide promotions or simple conversion points.',
    bestFor: [
      'Site-wide promotions',
      'Simple CTAs',
      'Page separators',
      'Quick conversions',
    ],
    contentRequirements: {
      required: ['headline', 'primaryButton'],
      optional: ['description', 'secondaryButton'],
    },
    styleTags: ['compact', 'prominent', 'action-focused', 'versatile'],
    conversionFocus: 'decision',
  },
  'cta-split': {
    id: 'cta-split',
    name: 'CTA Split',
    category: 'cta',
    variant: 'split',
    description:
      'A split-layout CTA with content on one side and optional image on the other. Ideal for detailed CTAs with visual support.',
    bestFor: [
      'Product promotions',
      'Service offerings',
      'Event registrations',
      'Demo requests',
    ],
    contentRequirements: {
      required: ['headline'],
      optional: ['description', 'primaryButton', 'secondaryButton', 'imageSrc'],
    },
    styleTags: ['visual', 'balanced', 'detailed', 'engaging'],
    conversionFocus: 'decision',
  },
  'cta-card': {
    id: 'cta-card',
    name: 'CTA Card',
    category: 'cta',
    variant: 'card',
    description:
      'A prominent card-style CTA with gradient background and optional pattern. Best for high-impact conversion sections.',
    bestFor: [
      'Primary conversions',
      'Free trials',
      'Demo requests',
      'High-value actions',
    ],
    contentRequirements: {
      required: ['headline', 'primaryButton'],
      optional: ['description', 'secondaryButton', 'badge'],
    },
    styleTags: ['impactful', 'bold', 'prominent', 'conversion-focused'],
    conversionFocus: 'decision',
  },
  'cta-newsletter': {
    id: 'cta-newsletter',
    name: 'CTA Newsletter',
    category: 'cta',
    variant: 'newsletter',
    description:
      'A newsletter signup CTA with email input field. Perfect for building email lists and nurturing leads.',
    bestFor: [
      'Email signups',
      'Newsletter subscriptions',
      'Lead generation',
      'Content updates',
    ],
    contentRequirements: {
      required: ['headline'],
      optional: ['description', 'placeholder', 'buttonText', 'privacyText'],
    },
    styleTags: ['lead-generation', 'form-based', 'nurturing', 'engagement'],
    conversionFocus: 'consideration',
  },
};

// Export all CTA component IDs for the AI selection system
export const ctaComponentIds = Object.keys(ctaMetadata);
