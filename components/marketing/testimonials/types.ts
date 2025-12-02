/**
 * Testimonial Component Types
 *
 * Shared types and interfaces for all testimonial component variants.
 */

import type { ComponentMetadata } from '@/lib/design-system/tokens';

export interface Testimonial {
  quote: string;
  author: {
    name: string;
    title?: string;
    company?: string;
    avatarSrc?: string;
  };
  rating?: number;
  logoSrc?: string;
}

export interface TestimonialsBaseProps {
  headline?: string;
  subheadline?: string;
  testimonials: Testimonial[];
  className?: string;
}

export interface TestimonialsGridProps extends TestimonialsBaseProps {
  columns?: 2 | 3;
  showRating?: boolean;
  showLogos?: boolean;
}

export interface TestimonialsCarouselProps extends TestimonialsBaseProps {
  autoPlay?: boolean;
  autoPlayInterval?: number;
  showDots?: boolean;
  showArrows?: boolean;
}

export interface TestimonialsQuoteProps {
  headline?: string;
  testimonial: Testimonial;
  background?: 'light' | 'dark' | 'gradient';
  className?: string;
}

// AI Component Metadata for each testimonial variant
export const testimonialMetadata: Record<string, ComponentMetadata> = {
  'testimonials-grid': {
    id: 'testimonials-grid',
    name: 'Testimonials Grid',
    category: 'testimonials',
    variant: 'grid',
    description:
      'A grid layout displaying multiple testimonials with author info and optional ratings. Great for showcasing social proof from multiple customers.',
    bestFor: [
      'Multiple testimonials',
      'Customer reviews',
      'Social proof sections',
      'B2B websites',
    ],
    contentRequirements: {
      required: ['testimonials'],
      optional: ['headline', 'subheadline'],
    },
    styleTags: ['organized', 'professional', 'trustworthy', 'comprehensive'],
    conversionFocus: 'consideration',
  },
  'testimonials-carousel': {
    id: 'testimonials-carousel',
    name: 'Testimonials Carousel',
    category: 'testimonials',
    variant: 'carousel',
    description:
      'A carousel/slider showcasing testimonials one at a time with navigation. Perfect for highlighting individual customer stories.',
    bestFor: [
      'Featured testimonials',
      'Customer stories',
      'Case studies preview',
      'Space-efficient layouts',
    ],
    contentRequirements: {
      required: ['testimonials'],
      optional: ['headline', 'subheadline'],
    },
    styleTags: ['interactive', 'engaging', 'focused', 'dynamic'],
    conversionFocus: 'consideration',
  },
  'testimonials-quote': {
    id: 'testimonials-quote',
    name: 'Testimonials Quote',
    category: 'testimonials',
    variant: 'quote',
    description:
      'A single large, impactful testimonial quote. Ideal for featuring your best customer endorsement prominently.',
    bestFor: [
      'Hero testimonials',
      'Featured quotes',
      'Brand endorsements',
      'Prominent social proof',
    ],
    contentRequirements: {
      required: ['testimonial'],
      optional: ['headline'],
    },
    styleTags: ['impactful', 'prominent', 'focused', 'bold'],
    conversionFocus: 'decision',
  },
};

// Export all testimonial component IDs for the AI selection system
export const testimonialComponentIds = Object.keys(testimonialMetadata);
