/**
 * Tailwind UI Marketing Section Templates
 *
 * Professional marketing section templates from Tailwind UI
 * Reference: https://tailwindui.com/components/marketing
 */

import type { ComponentTemplate } from './types';

export const TAILWIND_FEATURE_TEMPLATES: ComponentTemplate[] = [
  {
    id: 'tailwind-features-grid-3col',
    name: 'Three Column Feature Grid',
    type: 'features',
    source: 'tailwindui',
    structure: {
      layout: 'grid',
      columns: 3,
      hasImage: false,
      hasIcon: true,
      hasCTA: false,
    },
    contentSlots: {
      headline: true,
      subheadline: true,
      features: 6,
    },
    aiMetadata: {
      bestFor: 'Feature overviews, product capabilities, service listings',
      tone: ['professional', 'modern'],
      industries: ['saas', 'tech', 'general'],
      complexity: 'simple',
      features: ['Icon grid', 'Equal spacing', 'Scannable layout'],
      keywords: ['features', 'grid', 'overview', 'capabilities'],
    },
    componentRef: 'components/marketing/features/GridFeatures',
    defaultClasses: 'py-24 bg-white',
  },

  {
    id: 'tailwind-features-alternating',
    name: 'Alternating Feature Blocks',
    type: 'features',
    source: 'tailwindui',
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
      features: 3,
      cta: {
        primary: true,
        secondary: false,
      },
    },
    aiMetadata: {
      bestFor: 'Detailed feature explanations, storytelling, visual products',
      tone: ['professional', 'elegant'],
      industries: ['saas', 'ecommerce', 'agency'],
      complexity: 'medium',
      features: ['Image + text pairs', 'Visual storytelling', 'Detailed descriptions'],
      keywords: ['detailed', 'visual', 'storytelling', 'in-depth'],
    },
    componentRef: 'components/marketing/features/AlternatingFeatures',
    defaultClasses: 'py-24 space-y-24',
  },
];

export const TAILWIND_TESTIMONIAL_TEMPLATES: ComponentTemplate[] = [
  {
    id: 'tailwind-testimonials-grid',
    name: 'Testimonial Grid',
    type: 'testimonials',
    source: 'tailwindui',
    structure: {
      layout: 'grid',
      columns: 3,
      hasImage: true,
      hasIcon: false,
      hasCTA: false,
    },
    contentSlots: {
      headline: true,
      subheadline: true,
      testimonials: 6,
    },
    aiMetadata: {
      bestFor: 'Social proof, customer stories, trust building',
      tone: ['professional', 'modern'],
      industries: ['saas', 'ecommerce', 'general'],
      complexity: 'simple',
      features: ['Multiple testimonials', 'Avatar images', 'Company logos'],
      keywords: ['testimonials', 'reviews', 'social proof', 'customers'],
    },
    componentRef: 'components/marketing/testimonials/GridTestimonials',
    defaultClasses: 'py-24 bg-gray-50',
  },

  {
    id: 'tailwind-testimonials-featured',
    name: 'Featured Testimonial with Image',
    type: 'testimonials',
    source: 'tailwindui',
    structure: {
      layout: 'split',
      columns: 2,
      hasImage: true,
      hasIcon: false,
      hasCTA: false,
    },
    contentSlots: {
      headline: true,
      testimonials: 1,
    },
    aiMetadata: {
      bestFor: 'Single powerful testimonial, case study highlight, success story',
      tone: ['professional', 'elegant', 'bold'],
      industries: ['saas', 'agency', 'finance'],
      complexity: 'medium',
      features: ['Large format', 'Photo emphasis', 'Detailed quote'],
      keywords: ['featured', 'case study', 'success', 'highlight', 'detailed'],
    },
    componentRef: 'components/marketing/testimonials/FeaturedTestimonial',
    defaultClasses: 'py-24 bg-white',
  },
];

export const TAILWIND_PRICING_TEMPLATES: ComponentTemplate[] = [
  {
    id: 'tailwind-pricing-three-tier',
    name: 'Three Tier Pricing',
    type: 'pricing',
    source: 'tailwindui',
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
      pricing: 3,
      cta: {
        primary: true,
        secondary: false,
      },
    },
    aiMetadata: {
      bestFor: 'SaaS pricing, subscription tiers, clear value comparison',
      tone: ['professional', 'modern'],
      industries: ['saas', 'tech'],
      complexity: 'medium',
      features: ['Highlighted popular plan', 'Feature comparison', 'Clear CTAs'],
      keywords: ['pricing', 'plans', 'tiers', 'subscription', 'comparison'],
    },
    componentRef: 'components/marketing/pricing/ThreeTierPricing',
    defaultClasses: 'py-24 bg-gray-50',
  },
];

export const TAILWIND_CTA_TEMPLATES: ComponentTemplate[] = [
  {
    id: 'tailwind-cta-centered',
    name: 'Centered CTA',
    type: 'cta',
    source: 'tailwindui',
    structure: {
      layout: 'single',
      columns: 1,
      hasImage: false,
      hasIcon: false,
      hasCTA: true,
    },
    contentSlots: {
      headline: true,
      description: true,
      cta: {
        primary: true,
        secondary: true,
      },
    },
    aiMetadata: {
      bestFor: 'Page conversion, sign-up encouragement, final push',
      tone: ['bold', 'professional'],
      industries: ['general'],
      complexity: 'simple',
      features: ['Strong headline', 'Dual CTAs', 'Simple message'],
      keywords: ['signup', 'convert', 'action', 'get started'],
    },
    componentRef: 'components/marketing/cta/CenteredCTA',
    defaultClasses: 'py-24 bg-blue-600 text-white text-center',
  },

  {
    id: 'tailwind-cta-split-image',
    name: 'CTA with Side Image',
    type: 'cta',
    source: 'tailwindui',
    structure: {
      layout: 'split',
      columns: 2,
      hasImage: true,
      hasIcon: false,
      hasCTA: true,
    },
    contentSlots: {
      headline: true,
      description: true,
      cta: {
        primary: true,
        secondary: false,
      },
    },
    aiMetadata: {
      bestFor: 'Visual products, app downloads, demo requests',
      tone: ['professional', 'modern'],
      industries: ['saas', 'ecommerce', 'tech'],
      complexity: 'medium',
      features: ['Visual emphasis', 'Detailed copy', 'Single strong CTA'],
      keywords: ['demo', 'download', 'visual', 'detailed'],
    },
    componentRef: 'components/marketing/cta/SplitCTA',
    defaultClasses: 'py-24 bg-gradient-to-r from-blue-600 to-purple-600 text-white',
  },
];

export const TAILWIND_FAQ_TEMPLATES: ComponentTemplate[] = [
  {
    id: 'tailwind-faq-accordion',
    name: 'FAQ Accordion',
    type: 'faq',
    source: 'tailwindui',
    structure: {
      layout: 'single',
      columns: 1,
      hasImage: false,
      hasIcon: false,
      hasCTA: false,
    },
    contentSlots: {
      headline: true,
      subheadline: true,
    },
    aiMetadata: {
      bestFor: 'Common questions, support content, detailed answers',
      tone: ['professional', 'minimal'],
      industries: ['general'],
      complexity: 'simple',
      features: ['Collapsible items', 'Clean layout', 'Easy scanning'],
      keywords: ['faq', 'questions', 'answers', 'help', 'support'],
    },
    componentRef: 'components/marketing/faq/AccordionFAQ',
    defaultClasses: 'py-24 bg-white',
  },
];
