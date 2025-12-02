/**
 * Feature Component Types
 *
 * Shared types and interfaces for all feature component variants.
 */

import type { ComponentMetadata } from '@/lib/design-system/tokens';
import type { ReactNode } from 'react';

export interface Feature {
  title: string;
  description: string;
  icon?: ReactNode;
  imageSrc?: string;
  imageAlt?: string;
  href?: string;
}

export interface FeaturesBaseProps {
  headline?: string;
  subheadline?: string;
  features: Feature[];
  className?: string;
}

export interface FeaturesGridProps extends FeaturesBaseProps {
  columns?: 2 | 3 | 4;
  iconStyle?: 'circle' | 'square' | 'none';
  alignment?: 'left' | 'center';
}

export interface FeaturesAlternatingProps extends FeaturesBaseProps {
  imagePosition?: 'alternating' | 'left' | 'right';
}

export interface FeaturesBentoProps extends FeaturesBaseProps {
  variant?: 'default' | 'asymmetric' | 'hero-left' | 'hero-right';
}

export interface FeaturesCardsProps extends FeaturesBaseProps {
  columns?: 2 | 3 | 4;
  cardStyle?: 'elevated' | 'bordered' | 'filled';
  showArrows?: boolean;
}

// AI Component Metadata for each feature variant
export const featureMetadata: Record<string, ComponentMetadata> = {
  'features-grid': {
    id: 'features-grid',
    name: 'Features Grid',
    category: 'features',
    variant: 'grid',
    description:
      'A clean grid layout showcasing features with icons and descriptions. Best for highlighting multiple product features or services.',
    bestFor: [
      'Product features',
      'Service offerings',
      'Capability lists',
      'Comparison points',
    ],
    contentRequirements: {
      required: ['features'],
      optional: ['headline', 'subheadline'],
    },
    styleTags: ['organized', 'professional', 'scalable', 'clean'],
    conversionFocus: 'consideration',
  },
  'features-alternating': {
    id: 'features-alternating',
    name: 'Features Alternating',
    category: 'features',
    variant: 'alternating',
    description:
      'Alternating image and text sections that create visual rhythm. Ideal for detailed feature explanations with supporting visuals.',
    bestFor: [
      'Detailed features',
      'Process explanations',
      'Product tours',
      'Educational content',
    ],
    contentRequirements: {
      required: ['features'],
      optional: ['headline', 'subheadline'],
    },
    styleTags: ['detailed', 'visual', 'storytelling', 'engaging'],
    conversionFocus: 'consideration',
  },
  'features-bento': {
    id: 'features-bento',
    name: 'Features Bento',
    category: 'features',
    variant: 'bento',
    description:
      'A modern bento box layout with varying sizes to create visual hierarchy. Perfect for highlighting key features with different levels of importance.',
    bestFor: [
      'Modern products',
      'Tech companies',
      'Dashboard features',
      'App showcases',
    ],
    contentRequirements: {
      required: ['features'],
      optional: ['headline', 'subheadline'],
    },
    styleTags: ['modern', 'dynamic', 'creative', 'tech-forward'],
    conversionFocus: 'awareness',
  },
  'features-cards': {
    id: 'features-cards',
    name: 'Features Cards',
    category: 'features',
    variant: 'cards',
    description:
      'Card-based feature showcase with hover effects and optional links. Great for clickable feature sections that lead to detail pages.',
    bestFor: [
      'Clickable features',
      'Pricing tiers preview',
      'Category navigation',
      'Service cards',
    ],
    contentRequirements: {
      required: ['features'],
      optional: ['headline', 'subheadline'],
    },
    styleTags: ['interactive', 'clickable', 'organized', 'navigational'],
    conversionFocus: 'decision',
  },
};

// Export all feature component IDs for the AI selection system
export const featureComponentIds = Object.keys(featureMetadata);
