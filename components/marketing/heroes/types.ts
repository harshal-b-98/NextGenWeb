/**
 * Hero Component Types
 *
 * Shared types and interfaces for all hero component variants.
 */

import type { ReactNode } from 'react';
import type { ComponentMetadata } from '@/lib/design-system/tokens';
import type { CTASource } from '@/lib/interactive/chat/chat-context';
import type { IntentCategory } from '@/lib/interactive/chat/types';

export interface HeroButton {
  text: string;
  href: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
}

export interface HeroBaseProps {
  headline: string;
  subheadline?: string;
  description?: string;
  primaryButton?: HeroButton;
  secondaryButton?: HeroButton;
  className?: string;
}

export interface HeroCenteredProps extends HeroBaseProps {
  badge?: string;
  backgroundPattern?: boolean;
}

export interface HeroSplitProps extends HeroBaseProps {
  imageSrc: string;
  imageAlt: string;
  imagePosition?: 'left' | 'right';
  imageOverlay?: boolean;
}

export interface HeroGradientProps extends HeroBaseProps {
  gradientFrom?: string;
  gradientTo?: string;
  gradientDirection?: 'to-r' | 'to-l' | 'to-b' | 'to-t' | 'to-br' | 'to-bl';
  badge?: string;
}

export interface HeroVideoProps extends HeroBaseProps {
  videoSrc: string;
  videoPoster?: string;
  overlayOpacity?: number;
}

export interface HeroMinimalProps extends HeroBaseProps {
  align?: 'left' | 'center' | 'right';
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl';
}

// ============================================================================
// PHASE 6: CONVERSATIONAL HERO TYPES
// ============================================================================

/**
 * Configuration for a conversational CTA in the hero section
 */
export interface ConversationalCTAConfig {
  /** Display text for the CTA button */
  text: string;
  /** Topic this CTA addresses (for AI context) */
  topic?: string;
  /** Intent category hint for faster classification */
  intent?: IntentCategory;
  /** Priority for display order (1 = highest) */
  priority?: number;
  /** Custom prompt to override auto-generated one */
  promptOverride?: string;
  /** Optional icon to display */
  icon?: ReactNode;
}

/**
 * Props for the HeroConversational component
 */
export interface HeroConversationalProps {
  /** Main headline text */
  headline: string;
  /** Secondary headline text */
  subheadline?: string;
  /** Supporting description text */
  description?: string;
  /** Array of conversational CTAs (first is primary, second is secondary) */
  conversationalCTAs?: ConversationalCTAConfig[];
  /** Optional pre-filled chat prompt when clicking the chat bubble */
  chatPrompt?: string;
  /** Optional badge text above headline */
  badge?: string;
  /** Background style variant */
  backgroundVariant?: 'gradient' | 'pattern' | 'solid' | 'light';
  /** Whether to show the chat bubble trigger */
  showChatBubble?: boolean;
  /** Callback when a CTA is clicked (for custom handling) */
  onCTAClick?: (cta: ConversationalCTAConfig, ctaSource: CTASource) => void;
  /** Additional CSS classes */
  className?: string;
}

// AI Component Metadata for each hero variant
export const heroMetadata: Record<string, ComponentMetadata> = {
  'hero-centered': {
    id: 'hero-centered',
    name: 'Hero Centered',
    category: 'hero',
    variant: 'centered',
    description:
      'A centered hero section with headline, subheadline, and CTA buttons. Best for landing pages that need a strong, focused message.',
    bestFor: [
      'SaaS products',
      'Product launches',
      'App landing pages',
      'Single product focus',
    ],
    contentRequirements: {
      required: ['headline', 'primaryButton'],
      optional: ['subheadline', 'description', 'secondaryButton', 'badge'],
    },
    styleTags: ['modern', 'clean', 'professional', 'focused'],
    conversionFocus: 'decision',
  },
  'hero-split': {
    id: 'hero-split',
    name: 'Hero Split',
    category: 'hero',
    variant: 'split',
    description:
      'A split-screen hero with content on one side and an image on the other. Ideal for showcasing products or services visually.',
    bestFor: [
      'E-commerce',
      'Portfolio sites',
      'Product showcases',
      'Agency websites',
    ],
    contentRequirements: {
      required: ['headline', 'imageSrc', 'imageAlt'],
      optional: ['subheadline', 'description', 'primaryButton', 'secondaryButton'],
    },
    styleTags: ['visual', 'balanced', 'professional', 'showcase'],
    conversionFocus: 'consideration',
  },
  'hero-gradient': {
    id: 'hero-gradient',
    name: 'Hero Gradient',
    category: 'hero',
    variant: 'gradient',
    description:
      'A vibrant hero with gradient background and centered content. Creates visual impact for brand-focused pages.',
    bestFor: [
      'Brand pages',
      'Creative agencies',
      'Tech startups',
      'Event pages',
    ],
    contentRequirements: {
      required: ['headline'],
      optional: ['subheadline', 'description', 'primaryButton', 'secondaryButton', 'badge'],
    },
    styleTags: ['vibrant', 'modern', 'creative', 'bold'],
    conversionFocus: 'awareness',
  },
  'hero-video': {
    id: 'hero-video',
    name: 'Hero Video',
    category: 'hero',
    variant: 'video',
    description:
      'A hero section with video background for maximum visual engagement. Perfect for immersive brand experiences.',
    bestFor: [
      'Brand storytelling',
      'Product demos',
      'Entertainment',
      'Lifestyle brands',
    ],
    contentRequirements: {
      required: ['headline', 'videoSrc'],
      optional: ['subheadline', 'description', 'primaryButton', 'secondaryButton', 'videoPoster'],
    },
    styleTags: ['immersive', 'cinematic', 'engaging', 'premium'],
    conversionFocus: 'awareness',
  },
  'hero-minimal': {
    id: 'hero-minimal',
    name: 'Hero Minimal',
    category: 'hero',
    variant: 'minimal',
    description:
      'A clean, minimal hero focusing on typography and whitespace. Best for content-focused or editorial sites.',
    bestFor: [
      'Blogs',
      'Editorial sites',
      'Documentation',
      'Personal sites',
    ],
    contentRequirements: {
      required: ['headline'],
      optional: ['subheadline', 'description', 'primaryButton'],
    },
    styleTags: ['minimal', 'elegant', 'clean', 'typography-focused'],
    conversionFocus: 'consideration',
  },
  'hero-conversational': {
    id: 'hero-conversational',
    name: 'Hero Conversational',
    category: 'hero',
    variant: 'conversational',
    description:
      'A conversational marketing hero where CTAs trigger inline content generation instead of navigation. Ideal for guided exploration and higher engagement.',
    bestFor: [
      'Lead generation',
      'Product exploration',
      'Guided selling',
      'Interactive landing pages',
      'Conversational marketing',
    ],
    contentRequirements: {
      required: ['headline', 'conversationalCTAs'],
      optional: ['subheadline', 'description', 'badge', 'chatPrompt'],
    },
    styleTags: ['interactive', 'modern', 'engaging', 'conversion-focused'],
    conversionFocus: 'decision',
  },
};

// Export all hero component IDs for the AI selection system
export const heroComponentIds = Object.keys(heroMetadata);
