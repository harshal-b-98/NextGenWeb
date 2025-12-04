/**
 * shadcn/ui Hero Component Templates
 *
 * Catalog of hero section variants using shadcn/ui components
 * Reference: https://ui.shadcn.com/
 */

import type { ComponentTemplate } from './types';

export const SHADCN_HERO_TEMPLATES: ComponentTemplate[] = [
  {
    id: 'shadcn-hero-centered',
    name: 'Centered Hero',
    type: 'hero',
    source: 'shadcn',
    previewUrl: 'https://ui.shadcn.com/examples/cards',
    structure: {
      layout: 'single',
      columns: 1,
      hasImage: false,
      hasIcon: true,
      hasCTA: true,
    },
    contentSlots: {
      headline: true,
      subheadline: true,
      description: true,
      cta: {
        primary: true,
        secondary: true,
      },
    },
    aiMetadata: {
      bestFor: 'Clean SaaS product launches, simple value propositions',
      tone: ['modern', 'minimal', 'professional'],
      industries: ['saas', 'tech', 'general'],
      complexity: 'simple',
      features: ['Centered alignment', 'Dual CTAs', 'Clean typography'],
      keywords: ['simple', 'clean', 'focused', 'minimal', 'saas'],
    },
    componentRef: 'components/marketing/heroes/CenteredHero',
    defaultClasses: 'container mx-auto px-4 py-24 text-center',
  },

  {
    id: 'shadcn-hero-split',
    name: 'Split Hero with Image',
    type: 'hero',
    source: 'shadcn',
    structure: {
      layout: 'split',
      columns: 2,
      hasImage: true,
      hasIcon: false,
      hasCTA: true,
    },
    contentSlots: {
      headline: true,
      subheadline: true,
      description: true,
      cta: {
        primary: true,
        secondary: false,
      },
    },
    aiMetadata: {
      bestFor: 'Product showcases, visual-heavy launches, feature-rich products',
      tone: ['professional', 'modern', 'bold'],
      industries: ['saas', 'ecommerce', 'tech'],
      complexity: 'medium',
      features: ['50/50 split', 'Image showcase', 'Feature bullets'],
      keywords: ['visual', 'product', 'showcase', 'features', 'image'],
    },
    componentRef: 'components/marketing/heroes/SplitHero',
    defaultClasses: 'container mx-auto px-4 py-16 grid md:grid-cols-2 gap-12 items-center',
  },

  {
    id: 'shadcn-hero-gradient',
    name: 'Gradient Hero',
    type: 'hero',
    source: 'shadcn',
    structure: {
      layout: 'single',
      columns: 1,
      hasImage: false,
      hasIcon: true,
      hasCTA: true,
    },
    contentSlots: {
      headline: true,
      subheadline: true,
      description: true,
      cta: {
        primary: true,
        secondary: true,
      },
    },
    aiMetadata: {
      bestFor: 'Modern SaaS, tech products, innovative services',
      tone: ['modern', 'bold', 'playful'],
      industries: ['tech', 'saas', 'agency'],
      complexity: 'simple',
      features: ['Gradient background', 'Animated elements', 'Eye-catching'],
      keywords: ['modern', 'vibrant', 'colorful', 'gradient', 'animated'],
    },
    componentRef: 'components/marketing/heroes/GradientHero',
    defaultClasses: 'relative overflow-hidden bg-gradient-to-br from-blue-600 to-purple-600 text-white py-32',
  },

  {
    id: 'shadcn-hero-video',
    name: 'Hero with Background Video',
    type: 'hero',
    source: 'shadcn',
    structure: {
      layout: 'single',
      columns: 1,
      hasImage: true,
      hasIcon: false,
      hasCTA: true,
    },
    contentSlots: {
      headline: true,
      subheadline: true,
      description: false,
      cta: {
        primary: true,
        secondary: false,
      },
    },
    aiMetadata: {
      bestFor: 'High-end products, premium services, lifestyle brands',
      tone: ['elegant', 'bold', 'professional'],
      industries: ['ecommerce', 'agency', 'general'],
      complexity: 'complex',
      features: ['Video background', 'Overlay text', 'Premium feel'],
      keywords: ['video', 'premium', 'luxury', 'high-end', 'lifestyle'],
    },
    componentRef: 'components/marketing/heroes/VideoHero',
    defaultClasses: 'relative h-screen flex items-center justify-center text-white',
  },

  {
    id: 'shadcn-hero-with-stats',
    name: 'Hero with Stats Bar',
    type: 'hero',
    source: 'shadcn',
    structure: {
      layout: 'single',
      columns: 1,
      hasImage: false,
      hasIcon: false,
      hasCTA: true,
    },
    contentSlots: {
      headline: true,
      subheadline: true,
      description: true,
      cta: {
        primary: true,
        secondary: true,
      },
    },
    aiMetadata: {
      bestFor: 'Data-driven products, enterprise solutions, B2B SaaS',
      tone: ['professional', 'modern'],
      industries: ['saas', 'finance', 'healthcare', 'tech'],
      complexity: 'medium',
      features: ['Stats showcase', 'Social proof', 'Trust indicators'],
      keywords: ['data', 'stats', 'metrics', 'proof', 'enterprise', 'b2b'],
    },
    componentRef: 'components/marketing/heroes/StatsHero',
    defaultClasses: 'container mx-auto px-4 py-20 text-center',
  },

  {
    id: 'shadcn-hero-three-column',
    name: 'Three Column Feature Hero',
    type: 'hero',
    source: 'shadcn',
    structure: {
      layout: 'grid',
      columns: 3,
      hasImage: false,
      hasIcon: true,
      hasCTA: true,
    },
    contentSlots: {
      headline: true,
      subheadline: true,
      description: true,
      features: 3,
      cta: {
        primary: true,
        secondary: false,
      },
    },
    aiMetadata: {
      bestFor: 'Multi-feature products, platform launches, all-in-one solutions',
      tone: ['professional', 'modern'],
      industries: ['saas', 'tech', 'general'],
      complexity: 'medium',
      features: ['Three value props', 'Icon grid', 'Structured layout'],
      keywords: ['features', 'platform', 'all-in-one', 'multi', 'grid'],
    },
    componentRef: 'components/marketing/heroes/ThreeColumnHero',
    defaultClasses: 'container mx-auto px-4 py-16',
  },
];
