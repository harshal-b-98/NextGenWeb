/**
 * FAQ Component Types
 *
 * Shared types and interfaces for all FAQ component variants.
 */

import type { ComponentMetadata } from '@/lib/design-system/tokens';

export interface FAQItem {
  question: string;
  answer: string;
  category?: string;
}

export interface FAQBaseProps {
  headline?: string;
  subheadline?: string;
  items: FAQItem[];
  className?: string;
}

export interface FAQAccordionProps extends FAQBaseProps {
  allowMultiple?: boolean;
  defaultOpen?: number[];
  background?: 'light' | 'muted' | 'dark';
}

export interface FAQTwoColumnProps extends FAQBaseProps {
  columns?: 1 | 2;
  background?: 'light' | 'muted' | 'dark';
}

// AI Component Metadata for each FAQ variant
export const faqMetadata: Record<string, ComponentMetadata> = {
  'faq-accordion': {
    id: 'faq-accordion',
    name: 'FAQ Accordion',
    category: 'faq',
    variant: 'accordion',
    description:
      'Expandable FAQ section with smooth animations. Users can click to reveal answers one at a time or multiple simultaneously.',
    bestFor: [
      'Long FAQ lists',
      'Detailed answers',
      'Space-efficient design',
      'Mobile-friendly',
    ],
    contentRequirements: {
      required: ['items'],
      optional: ['headline', 'subheadline'],
    },
    styleTags: ['interactive', 'compact', 'organized', 'accessible'],
    conversionFocus: 'support',
  },
  'faq-two-column': {
    id: 'faq-two-column',
    name: 'FAQ Two Column',
    category: 'faq',
    variant: 'two-column',
    description:
      'Grid-based FAQ layout showing all questions and answers at once. Perfect for shorter FAQ sections where all content should be visible.',
    bestFor: [
      'Short FAQ lists',
      'Quick scanning',
      'Desktop layouts',
      'Marketing pages',
    ],
    contentRequirements: {
      required: ['items'],
      optional: ['headline', 'subheadline'],
    },
    styleTags: ['open', 'scannable', 'grid', 'informative'],
    conversionFocus: 'support',
  },
};

// Export all FAQ component IDs for the AI selection system
export const faqComponentIds = Object.keys(faqMetadata);
