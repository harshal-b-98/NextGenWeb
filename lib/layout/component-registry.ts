/**
 * Component Registry
 * Phase 3.1: Layout Generation Agent
 *
 * Registry of all available marketing components with AI metadata
 * for intelligent component selection during layout generation.
 */

import {
  ComponentDefinition,
  ComponentVariant,
  ComponentCategory,
  ComponentScore,
  ComponentSelectionContext,
  NarrativeRole,
  PersonaFitScore,
  PositionHints,
} from './types';

// =============================================================================
// COMPONENT DEFINITIONS
// =============================================================================

export const COMPONENT_DEFINITIONS: Record<ComponentVariant, ComponentDefinition> = {
  // ---------------------------------------------------------------------------
  // HERO COMPONENTS
  // ---------------------------------------------------------------------------
  'hero-split': {
    id: 'hero-split',
    name: 'Hero Split',
    category: 'hero',
    description: 'Split-screen hero with content on one side and media on the other',
    aiMetadata: {
      useCases: [
        'Product launch pages',
        'SaaS landing pages',
        'Feature announcements',
        'High-impact homepages',
      ],
      contentRequirements: {
        required: ['headline', 'media'],
        optional: ['subheadline', 'primaryCTA', 'secondaryCTA', 'trustedByLogos'],
        minLength: { headline: 20 },
        maxLength: { headline: 80, subheadline: 200 },
      },
      personaFit: [
        { persona: 'technical', score: 0.8 },
        { persona: 'business', score: 0.9 },
        { persona: 'executive', score: 0.7 },
      ],
      positionHints: {
        preferredPosition: 'top',
        avoidAfter: ['hero-centered', 'hero-video', 'hero-animated'],
      },
      narrativeRole: 'hook',
    },
    defaultProps: {
      mediaPosition: 'right',
      showTrustedBy: false,
    },
    responsiveConfig: {
      stackOnMobile: true,
      columnSpan: { mobile: 4, tablet: 8, desktop: 6 },
    },
    animationPreset: 'fadeIn',
  },

  'hero-centered': {
    id: 'hero-centered',
    name: 'Hero Centered',
    category: 'hero',
    description: 'Full-width centered hero with prominent headline',
    aiMetadata: {
      useCases: [
        'Brand-focused homepages',
        'Campaign landing pages',
        'Event pages',
        'Company announcements',
      ],
      contentRequirements: {
        required: ['headline'],
        optional: ['subheadline', 'primaryCTA', 'secondaryCTA', 'backgroundMedia', 'trustedByLogos'],
        minLength: { headline: 15 },
        maxLength: { headline: 100, subheadline: 250 },
      },
      personaFit: [
        { persona: 'technical', score: 0.6 },
        { persona: 'business', score: 0.9 },
        { persona: 'executive', score: 0.9 },
      ],
      positionHints: {
        preferredPosition: 'top',
        avoidAfter: ['hero-split', 'hero-video'],
      },
      narrativeRole: 'hook',
    },
    defaultProps: {
      textAlignment: 'center',
      showTrustedBy: true,
    },
    responsiveConfig: {
      stackOnMobile: false,
      columnSpan: { mobile: 4, tablet: 8, desktop: 12 },
    },
    animationPreset: 'slideUp',
  },

  'hero-video': {
    id: 'hero-video',
    name: 'Hero Video',
    category: 'hero',
    description: 'Full-screen video background hero with overlaid content',
    aiMetadata: {
      useCases: [
        'Brand storytelling',
        'Product demos',
        'Immersive experiences',
        'Entertainment sites',
      ],
      contentRequirements: {
        required: ['headline', 'videoUrl'],
        optional: ['subheadline', 'primaryCTA', 'posterImage'],
        minLength: { headline: 10 },
        maxLength: { headline: 60 },
      },
      personaFit: [
        { persona: 'technical', score: 0.5 },
        { persona: 'business', score: 0.7 },
        { persona: 'executive', score: 0.8 },
      ],
      positionHints: {
        preferredPosition: 'top',
        avoidAfter: ['hero-split', 'hero-centered'],
      },
      narrativeRole: 'hook',
    },
    defaultProps: {
      autoPlay: true,
      muted: true,
      loop: true,
    },
    responsiveConfig: {
      stackOnMobile: false,
      hideOnMobile: ['video'],
      showOnMobile: ['posterImage'],
    },
    animationPreset: 'fadeIn',
  },

  'hero-animated': {
    id: 'hero-animated',
    name: 'Hero Animated',
    category: 'hero',
    description: 'Hero with scroll-triggered animations and interactive elements',
    aiMetadata: {
      useCases: [
        'Creative agencies',
        'Tech products',
        'Interactive showcases',
        'Modern brands',
      ],
      contentRequirements: {
        required: ['headline'],
        optional: ['subheadline', 'primaryCTA', 'animatedElements'],
        minLength: { headline: 15 },
        maxLength: { headline: 80 },
      },
      personaFit: [
        { persona: 'technical', score: 0.9 },
        { persona: 'business', score: 0.6 },
        { persona: 'executive', score: 0.5 },
      ],
      positionHints: {
        preferredPosition: 'top',
      },
      narrativeRole: 'hook',
    },
    defaultProps: {
      animationType: 'parallax',
    },
    responsiveConfig: {
      stackOnMobile: false,
    },
    animationPreset: 'scaleIn',
  },

  'hero-product': {
    id: 'hero-product',
    name: 'Hero Product',
    category: 'hero',
    description: 'Product screenshot/mockup-focused hero',
    aiMetadata: {
      useCases: [
        'SaaS products',
        'App launches',
        'Software demos',
        'Product pages',
      ],
      contentRequirements: {
        required: ['headline', 'productImage'],
        optional: ['subheadline', 'primaryCTA', 'secondaryCTA', 'featureBadges'],
        minLength: { headline: 20 },
        maxLength: { headline: 80, subheadline: 180 },
      },
      personaFit: [
        { persona: 'technical', score: 0.95 },
        { persona: 'business', score: 0.8 },
        { persona: 'executive', score: 0.6 },
      ],
      positionHints: {
        preferredPosition: 'top',
      },
      narrativeRole: 'hook',
    },
    defaultProps: {
      mockupStyle: 'browser',
      showShadow: true,
    },
    responsiveConfig: {
      stackOnMobile: true,
      columnSpan: { mobile: 4, tablet: 8, desktop: 7 },
    },
    animationPreset: 'slideUp',
  },

  'hero-minimal': {
    id: 'hero-minimal',
    name: 'Hero Minimal',
    category: 'hero',
    description: 'Clean, typography-focused minimal hero',
    aiMetadata: {
      useCases: [
        'Blog pages',
        'About pages',
        'Legal pages',
        'Content-focused pages',
      ],
      contentRequirements: {
        required: ['headline'],
        optional: ['subheadline', 'breadcrumb'],
        minLength: { headline: 10 },
        maxLength: { headline: 120 },
      },
      personaFit: [
        { persona: 'technical', score: 0.7 },
        { persona: 'business', score: 0.7 },
        { persona: 'executive', score: 0.8 },
      ],
      positionHints: {
        preferredPosition: 'top',
      },
      narrativeRole: 'hook',
    },
    defaultProps: {
      showDivider: true,
    },
    responsiveConfig: {
      stackOnMobile: false,
    },
    animationPreset: 'fadeIn',
  },

  'hero-interactive': {
    id: 'hero-interactive',
    name: 'Hero Interactive',
    category: 'hero',
    description: 'Hero with interactive demo or playground',
    aiMetadata: {
      useCases: [
        'Developer tools',
        'API products',
        'Interactive demos',
        'Try-before-buy',
      ],
      contentRequirements: {
        required: ['headline', 'interactiveElement'],
        optional: ['subheadline', 'primaryCTA'],
      },
      personaFit: [
        { persona: 'technical', score: 1.0 },
        { persona: 'business', score: 0.5 },
        { persona: 'executive', score: 0.3 },
      ],
      positionHints: {
        preferredPosition: 'top',
      },
      narrativeRole: 'hook',
    },
    defaultProps: {
      interactionType: 'code-playground',
    },
    responsiveConfig: {
      stackOnMobile: true,
      hideOnMobile: ['interactiveElement'],
    },
    animationPreset: 'fadeIn',
  },

  'hero-stats': {
    id: 'hero-stats',
    name: 'Hero Stats',
    category: 'hero',
    description: 'Hero with key metrics and statistics prominently displayed',
    aiMetadata: {
      useCases: [
        'Data-driven companies',
        'Results-focused pages',
        'Enterprise solutions',
        'Industry leaders',
      ],
      contentRequirements: {
        required: ['headline', 'stats'],
        optional: ['subheadline', 'primaryCTA'],
        minCount: { stats: 3 },
        maxCount: { stats: 5 },
      },
      personaFit: [
        { persona: 'technical', score: 0.7 },
        { persona: 'business', score: 0.95 },
        { persona: 'executive', score: 0.95 },
      ],
      positionHints: {
        preferredPosition: 'top',
      },
      narrativeRole: 'proof',
    },
    defaultProps: {
      animateNumbers: true,
    },
    responsiveConfig: {
      stackOnMobile: true,
    },
    animationPreset: 'staggerChildren',
  },

  // ---------------------------------------------------------------------------
  // FEATURES COMPONENTS
  // ---------------------------------------------------------------------------
  'features-grid': {
    id: 'features-grid',
    name: 'Features Grid',
    category: 'features',
    description: 'Card-based grid layout for displaying features',
    aiMetadata: {
      useCases: [
        'Displaying multiple features equally',
        'Product capabilities overview',
        'Service offerings',
        'Feature comparison',
      ],
      contentRequirements: {
        required: ['features'],
        optional: ['sectionTitle', 'sectionDescription'],
        minCount: { features: 3 },
        maxCount: { features: 12 },
      },
      personaFit: [
        { persona: 'technical', score: 0.8 },
        { persona: 'business', score: 0.9 },
        { persona: 'executive', score: 0.7 },
      ],
      positionHints: {
        preferredPosition: 'middle',
        preferAfter: ['hero-split', 'hero-centered', 'hero-product'],
      },
      narrativeRole: 'solution',
    },
    defaultProps: {
      columns: 3,
      showIcons: true,
    },
    responsiveConfig: {
      stackOnMobile: false,
      columnSpan: { mobile: 2, tablet: 4, desktop: 4 },
    },
    animationPreset: 'staggerChildren',
  },

  'features-alternating': {
    id: 'features-alternating',
    name: 'Features Alternating',
    category: 'features',
    description: 'Left/right alternating layout with media',
    aiMetadata: {
      useCases: [
        'Deep-dive features',
        'Process explanation',
        'Step-by-step guides',
        'Product walkthrough',
      ],
      contentRequirements: {
        required: ['features'],
        optional: ['sectionTitle'],
        minCount: { features: 2 },
        maxCount: { features: 6 },
      },
      personaFit: [
        { persona: 'technical', score: 0.85 },
        { persona: 'business', score: 0.85 },
        { persona: 'executive', score: 0.6 },
      ],
      positionHints: {
        preferredPosition: 'middle',
        preferAfter: ['hero-split', 'features-grid'],
      },
      narrativeRole: 'solution',
    },
    defaultProps: {
      startPosition: 'left',
    },
    responsiveConfig: {
      stackOnMobile: true,
    },
    animationPreset: 'slideUp',
  },

  'features-tabs': {
    id: 'features-tabs',
    name: 'Features Tabs',
    category: 'features',
    description: 'Tabbed interface for feature categories',
    aiMetadata: {
      useCases: [
        'Multiple feature categories',
        'Product modules',
        'Use case demos',
        'Feature deep-dives',
      ],
      contentRequirements: {
        required: ['tabs'],
        optional: ['sectionTitle', 'sectionDescription'],
        minCount: { tabs: 2 },
        maxCount: { tabs: 6 },
      },
      personaFit: [
        { persona: 'technical', score: 0.9 },
        { persona: 'business', score: 0.8 },
        { persona: 'executive', score: 0.5 },
      ],
      positionHints: {
        preferredPosition: 'middle',
      },
      narrativeRole: 'solution',
    },
    defaultProps: {
      orientation: 'horizontal',
    },
    responsiveConfig: {
      stackOnMobile: true,
    },
    animationPreset: 'fadeIn',
  },

  'features-carousel': {
    id: 'features-carousel',
    name: 'Features Carousel',
    category: 'features',
    description: 'Sliding carousel for feature showcase',
    aiMetadata: {
      useCases: [
        'Visual feature showcase',
        'Portfolio display',
        'Product gallery',
        'Screenshot tours',
      ],
      contentRequirements: {
        required: ['slides'],
        optional: ['sectionTitle'],
        minCount: { slides: 3 },
        maxCount: { slides: 10 },
      },
      personaFit: [
        { persona: 'technical', score: 0.6 },
        { persona: 'business', score: 0.8 },
        { persona: 'executive', score: 0.7 },
      ],
      positionHints: {
        preferredPosition: 'middle',
      },
      narrativeRole: 'solution',
    },
    defaultProps: {
      autoPlay: true,
      showDots: true,
    },
    responsiveConfig: {
      stackOnMobile: false,
    },
    animationPreset: 'fadeIn',
  },

  'features-bento': {
    id: 'features-bento',
    name: 'Features Bento',
    category: 'features',
    description: 'Bento grid with varied card sizes',
    aiMetadata: {
      useCases: [
        'Feature highlights',
        'Mixed importance features',
        'Visual hierarchy',
        'Modern product pages',
      ],
      contentRequirements: {
        required: ['items'],
        optional: ['sectionTitle'],
        minCount: { items: 4 },
        maxCount: { items: 8 },
      },
      personaFit: [
        { persona: 'technical', score: 0.85 },
        { persona: 'business', score: 0.75 },
        { persona: 'executive', score: 0.6 },
      ],
      positionHints: {
        preferredPosition: 'middle',
      },
      narrativeRole: 'solution',
    },
    defaultProps: {
      layout: 'asymmetric',
    },
    responsiveConfig: {
      stackOnMobile: true,
    },
    animationPreset: 'staggerChildren',
  },

  'features-comparison': {
    id: 'features-comparison',
    name: 'Features Comparison',
    category: 'features',
    description: 'Comparison table layout',
    aiMetadata: {
      useCases: [
        'Competitive comparison',
        'Plan comparison',
        'Before/after',
        'Feature matrix',
      ],
      contentRequirements: {
        required: ['columns', 'rows'],
        optional: ['sectionTitle', 'sectionDescription'],
        minCount: { columns: 2, rows: 3 },
      },
      personaFit: [
        { persona: 'technical', score: 0.9 },
        { persona: 'business', score: 0.95 },
        { persona: 'executive', score: 0.7 },
      ],
      positionHints: {
        preferredPosition: 'middle',
        preferAfter: ['features-grid', 'pricing-cards'],
      },
      narrativeRole: 'solution',
    },
    defaultProps: {
      highlightColumn: 1,
    },
    responsiveConfig: {
      stackOnMobile: true,
      hideOnMobile: ['column-3', 'column-4'],
    },
    animationPreset: 'fadeIn',
  },

  'features-timeline': {
    id: 'features-timeline',
    name: 'Features Timeline',
    category: 'features',
    description: 'Timeline-based feature presentation',
    aiMetadata: {
      useCases: [
        'Process flow',
        'Roadmap',
        'History',
        'Step progression',
      ],
      contentRequirements: {
        required: ['events'],
        optional: ['sectionTitle'],
        minCount: { events: 3 },
        maxCount: { events: 10 },
      },
      personaFit: [
        { persona: 'technical', score: 0.7 },
        { persona: 'business', score: 0.8 },
        { persona: 'executive', score: 0.85 },
      ],
      positionHints: {
        preferredPosition: 'middle',
      },
      narrativeRole: 'solution',
    },
    defaultProps: {
      orientation: 'vertical',
    },
    responsiveConfig: {
      stackOnMobile: true,
    },
    animationPreset: 'slideUp',
  },

  'features-showcase': {
    id: 'features-showcase',
    name: 'Features Showcase',
    category: 'features',
    description: 'Large interactive feature showcase',
    aiMetadata: {
      useCases: [
        'Hero feature highlight',
        'Main product feature',
        'Key differentiator',
        'Interactive demo',
      ],
      contentRequirements: {
        required: ['title', 'description', 'media'],
        optional: ['features', 'cta'],
      },
      personaFit: [
        { persona: 'technical', score: 0.85 },
        { persona: 'business', score: 0.8 },
        { persona: 'executive', score: 0.7 },
      ],
      positionHints: {
        preferredPosition: 'middle',
        preferAfter: ['hero-split', 'hero-product'],
      },
      narrativeRole: 'solution',
    },
    defaultProps: {
      showInteraction: true,
    },
    responsiveConfig: {
      stackOnMobile: true,
    },
    animationPreset: 'scaleIn',
  },

  'features-icon-list': {
    id: 'features-icon-list',
    name: 'Features Icon List',
    category: 'features',
    description: 'Simple icon + text list',
    aiMetadata: {
      useCases: [
        'Quick feature list',
        'Benefits summary',
        'Checklist',
        'Supporting features',
      ],
      contentRequirements: {
        required: ['items'],
        optional: ['sectionTitle'],
        minCount: { items: 4 },
        maxCount: { items: 12 },
      },
      personaFit: [
        { persona: 'technical', score: 0.7 },
        { persona: 'business', score: 0.8 },
        { persona: 'executive', score: 0.9 },
      ],
      positionHints: {
        preferredPosition: 'middle',
        preferAfter: ['hero-centered', 'content-rich-text'],
      },
      narrativeRole: 'solution',
    },
    defaultProps: {
      columns: 2,
    },
    responsiveConfig: {
      stackOnMobile: true,
    },
    animationPreset: 'staggerChildren',
  },

  'features-accordion': {
    id: 'features-accordion',
    name: 'Features Accordion',
    category: 'features',
    description: 'Expandable accordion for feature details',
    aiMetadata: {
      useCases: [
        'Detailed feature explanations',
        'FAQ-style features',
        'Space-efficient display',
        'Technical specifications',
      ],
      contentRequirements: {
        required: ['items'],
        optional: ['sectionTitle'],
        minCount: { items: 3 },
        maxCount: { items: 10 },
      },
      personaFit: [
        { persona: 'technical', score: 0.9 },
        { persona: 'business', score: 0.7 },
        { persona: 'executive', score: 0.5 },
      ],
      positionHints: {
        preferredPosition: 'middle',
      },
      narrativeRole: 'solution',
    },
    defaultProps: {
      allowMultiple: false,
    },
    responsiveConfig: {
      stackOnMobile: false,
    },
    animationPreset: 'slideDown',
  },

  // ---------------------------------------------------------------------------
  // SOCIAL PROOF COMPONENTS
  // ---------------------------------------------------------------------------
  'testimonials-carousel': {
    id: 'testimonials-carousel',
    name: 'Testimonials Carousel',
    category: 'social-proof',
    description: 'Sliding carousel of customer testimonials',
    aiMetadata: {
      useCases: [
        'Customer stories',
        'Social proof',
        'Trust building',
        'Success stories',
      ],
      contentRequirements: {
        required: ['testimonials'],
        optional: ['sectionTitle'],
        minCount: { testimonials: 3 },
      },
      personaFit: [
        { persona: 'technical', score: 0.6 },
        { persona: 'business', score: 0.95 },
        { persona: 'executive', score: 0.9 },
      ],
      positionHints: {
        preferredPosition: 'middle',
        preferAfter: ['features-grid', 'features-alternating'],
      },
      narrativeRole: 'proof',
    },
    defaultProps: {
      autoPlay: true,
      showRating: true,
    },
    responsiveConfig: {
      stackOnMobile: false,
    },
    animationPreset: 'fadeIn',
  },

  'testimonials-grid': {
    id: 'testimonials-grid',
    name: 'Testimonials Grid',
    category: 'social-proof',
    description: 'Grid layout of customer testimonials',
    aiMetadata: {
      useCases: [
        'Multiple testimonials',
        'Diverse customer voices',
        'Industry coverage',
        'Use case variety',
      ],
      contentRequirements: {
        required: ['testimonials'],
        optional: ['sectionTitle'],
        minCount: { testimonials: 3 },
        maxCount: { testimonials: 9 },
      },
      personaFit: [
        { persona: 'technical', score: 0.65 },
        { persona: 'business', score: 0.9 },
        { persona: 'executive', score: 0.85 },
      ],
      positionHints: {
        preferredPosition: 'middle',
      },
      narrativeRole: 'proof',
    },
    defaultProps: {
      columns: 3,
    },
    responsiveConfig: {
      stackOnMobile: true,
      columnSpan: { mobile: 4, tablet: 4, desktop: 4 },
    },
    animationPreset: 'staggerChildren',
  },

  'logo-cloud': {
    id: 'logo-cloud',
    name: 'Logo Cloud',
    category: 'social-proof',
    description: 'Display of customer/partner logos',
    aiMetadata: {
      useCases: [
        'Trusted by section',
        'Partner showcase',
        'Client logos',
        'Integration partners',
      ],
      contentRequirements: {
        required: ['logos'],
        optional: ['sectionTitle'],
        minCount: { logos: 4 },
        maxCount: { logos: 20 },
      },
      personaFit: [
        { persona: 'technical', score: 0.5 },
        { persona: 'business', score: 0.95 },
        { persona: 'executive', score: 1.0 },
      ],
      positionHints: {
        preferredPosition: 'any',
        preferAfter: ['hero-centered', 'hero-split'],
      },
      narrativeRole: 'proof',
    },
    defaultProps: {
      grayscale: true,
      animate: true,
    },
    responsiveConfig: {
      stackOnMobile: false,
    },
    animationPreset: 'fadeIn',
  },

  'case-studies': {
    id: 'case-studies',
    name: 'Case Studies',
    category: 'social-proof',
    description: 'Featured case study cards',
    aiMetadata: {
      useCases: [
        'Success stories',
        'Customer wins',
        'ROI proof',
        'Industry examples',
      ],
      contentRequirements: {
        required: ['caseStudies'],
        optional: ['sectionTitle', 'sectionDescription'],
        minCount: { caseStudies: 2 },
        maxCount: { caseStudies: 4 },
      },
      personaFit: [
        { persona: 'technical', score: 0.7 },
        { persona: 'business', score: 1.0 },
        { persona: 'executive', score: 0.95 },
      ],
      positionHints: {
        preferredPosition: 'middle',
        preferAfter: ['testimonials-carousel', 'features-grid'],
      },
      narrativeRole: 'proof',
    },
    defaultProps: {
      showMetrics: true,
    },
    responsiveConfig: {
      stackOnMobile: true,
    },
    animationPreset: 'slideUp',
  },

  'stats-section': {
    id: 'stats-section',
    name: 'Stats Section',
    category: 'social-proof',
    description: 'Key metrics and statistics display',
    aiMetadata: {
      useCases: [
        'Impact metrics',
        'Company achievements',
        'Performance data',
        'Trust indicators',
      ],
      contentRequirements: {
        required: ['stats'],
        optional: ['sectionTitle', 'sectionDescription'],
        minCount: { stats: 3 },
        maxCount: { stats: 6 },
      },
      personaFit: [
        { persona: 'technical', score: 0.7 },
        { persona: 'business', score: 0.95 },
        { persona: 'executive', score: 1.0 },
      ],
      positionHints: {
        preferredPosition: 'middle',
        preferAfter: ['hero-centered', 'testimonials-carousel'],
      },
      narrativeRole: 'proof',
    },
    defaultProps: {
      animateNumbers: true,
      layout: 'horizontal',
    },
    responsiveConfig: {
      stackOnMobile: true,
    },
    animationPreset: 'staggerChildren',
  },

  'awards-badges': {
    id: 'awards-badges',
    name: 'Awards & Badges',
    category: 'social-proof',
    description: 'Display of awards, certifications, and badges',
    aiMetadata: {
      useCases: [
        'Industry recognition',
        'Certifications',
        'Trust badges',
        'Awards showcase',
      ],
      contentRequirements: {
        required: ['badges'],
        optional: ['sectionTitle'],
        minCount: { badges: 3 },
        maxCount: { badges: 8 },
      },
      personaFit: [
        { persona: 'technical', score: 0.6 },
        { persona: 'business', score: 0.85 },
        { persona: 'executive', score: 0.95 },
      ],
      positionHints: {
        preferredPosition: 'bottom',
      },
      narrativeRole: 'proof',
    },
    defaultProps: {
      layout: 'inline',
    },
    responsiveConfig: {
      stackOnMobile: false,
    },
    animationPreset: 'fadeIn',
  },

  // ---------------------------------------------------------------------------
  // PRICING COMPONENTS
  // ---------------------------------------------------------------------------
  'pricing-cards': {
    id: 'pricing-cards',
    name: 'Pricing Cards',
    category: 'pricing',
    description: 'Side-by-side pricing plan cards',
    aiMetadata: {
      useCases: [
        'SaaS pricing',
        'Plan comparison',
        'Tiered offerings',
        'Subscription plans',
      ],
      contentRequirements: {
        required: ['plans'],
        optional: ['sectionTitle', 'sectionDescription', 'billingToggle'],
        minCount: { plans: 2 },
        maxCount: { plans: 4 },
      },
      personaFit: [
        { persona: 'technical', score: 0.8 },
        { persona: 'business', score: 0.95 },
        { persona: 'executive', score: 0.7 },
      ],
      positionHints: {
        preferredPosition: 'middle',
        preferAfter: ['features-grid', 'testimonials-carousel'],
      },
      narrativeRole: 'action',
    },
    defaultProps: {
      highlightPlan: 1,
      showAnnualToggle: true,
    },
    responsiveConfig: {
      stackOnMobile: true,
    },
    animationPreset: 'staggerChildren',
  },

  'pricing-table': {
    id: 'pricing-table',
    name: 'Pricing Table',
    category: 'pricing',
    description: 'Detailed pricing comparison table',
    aiMetadata: {
      useCases: [
        'Feature comparison',
        'Enterprise pricing',
        'Detailed plans',
        'Technical buyers',
      ],
      contentRequirements: {
        required: ['plans', 'features'],
        optional: ['sectionTitle'],
        minCount: { plans: 2, features: 5 },
      },
      personaFit: [
        { persona: 'technical', score: 0.95 },
        { persona: 'business', score: 0.8 },
        { persona: 'executive', score: 0.5 },
      ],
      positionHints: {
        preferredPosition: 'middle',
      },
      narrativeRole: 'action',
    },
    defaultProps: {
      stickyHeader: true,
    },
    responsiveConfig: {
      stackOnMobile: true,
      hideOnMobile: ['feature-details'],
    },
    animationPreset: 'fadeIn',
  },

  'pricing-calculator': {
    id: 'pricing-calculator',
    name: 'Pricing Calculator',
    category: 'pricing',
    description: 'Interactive pricing calculator',
    aiMetadata: {
      useCases: [
        'Usage-based pricing',
        'Custom quotes',
        'Volume pricing',
        'ROI calculator',
      ],
      contentRequirements: {
        required: ['variables', 'formula'],
        optional: ['sectionTitle', 'defaultValues'],
      },
      personaFit: [
        { persona: 'technical', score: 0.9 },
        { persona: 'business', score: 0.95 },
        { persona: 'executive', score: 0.6 },
      ],
      positionHints: {
        preferredPosition: 'middle',
      },
      narrativeRole: 'action',
    },
    defaultProps: {
      showBreakdown: true,
    },
    responsiveConfig: {
      stackOnMobile: true,
    },
    animationPreset: 'slideUp',
  },

  'pricing-simple': {
    id: 'pricing-simple',
    name: 'Pricing Simple',
    category: 'pricing',
    description: 'Simple single-price display',
    aiMetadata: {
      useCases: [
        'Single product',
        'Simple pricing',
        'Flat rate',
        'One-time purchase',
      ],
      contentRequirements: {
        required: ['price', 'features'],
        optional: ['sectionTitle', 'cta'],
      },
      personaFit: [
        { persona: 'technical', score: 0.6 },
        { persona: 'business', score: 0.8 },
        { persona: 'executive', score: 0.85 },
      ],
      positionHints: {
        preferredPosition: 'middle',
      },
      narrativeRole: 'action',
    },
    defaultProps: {
      centered: true,
    },
    responsiveConfig: {
      stackOnMobile: false,
    },
    animationPreset: 'scaleIn',
  },

  'pricing-enterprise': {
    id: 'pricing-enterprise',
    name: 'Pricing Enterprise',
    category: 'pricing',
    description: 'Enterprise/custom pricing section',
    aiMetadata: {
      useCases: [
        'Enterprise sales',
        'Custom solutions',
        'Contact for pricing',
        'High-touch sales',
      ],
      contentRequirements: {
        required: ['features'],
        optional: ['sectionTitle', 'contactForm', 'testimonial'],
      },
      personaFit: [
        { persona: 'technical', score: 0.7 },
        { persona: 'business', score: 0.85 },
        { persona: 'executive', score: 1.0 },
      ],
      positionHints: {
        preferredPosition: 'middle',
        preferAfter: ['pricing-cards'],
      },
      narrativeRole: 'action',
    },
    defaultProps: {
      showContactCTA: true,
    },
    responsiveConfig: {
      stackOnMobile: true,
    },
    animationPreset: 'fadeIn',
  },

  // ---------------------------------------------------------------------------
  // CTA COMPONENTS
  // ---------------------------------------------------------------------------
  'cta-banner': {
    id: 'cta-banner',
    name: 'CTA Banner',
    category: 'cta',
    description: 'Full-width call-to-action banner',
    aiMetadata: {
      useCases: [
        'Page finale',
        'Strong conversion push',
        'Newsletter signup',
        'Demo request',
      ],
      contentRequirements: {
        required: ['headline', 'primaryCTA'],
        optional: ['subheadline', 'secondaryCTA', 'backgroundImage'],
        maxLength: { headline: 80, subheadline: 150 },
      },
      personaFit: [
        { persona: 'technical', score: 0.7 },
        { persona: 'business', score: 0.9 },
        { persona: 'executive', score: 0.8 },
      ],
      positionHints: {
        preferredPosition: 'bottom',
        preferAfter: ['testimonials-carousel', 'pricing-cards', 'content-faq'],
      },
      narrativeRole: 'action',
    },
    defaultProps: {
      variant: 'gradient',
    },
    responsiveConfig: {
      stackOnMobile: false,
    },
    animationPreset: 'slideUp',
  },

  'cta-inline': {
    id: 'cta-inline',
    name: 'CTA Inline',
    category: 'cta',
    description: 'Inline call-to-action within content',
    aiMetadata: {
      useCases: [
        'Mid-content conversion',
        'Contextual CTAs',
        'Article CTAs',
        'Soft conversion',
      ],
      contentRequirements: {
        required: ['text', 'primaryCTA'],
        optional: ['icon'],
        maxLength: { text: 100 },
      },
      personaFit: [
        { persona: 'technical', score: 0.7 },
        { persona: 'business', score: 0.8 },
        { persona: 'executive', score: 0.7 },
      ],
      positionHints: {
        preferredPosition: 'middle',
      },
      narrativeRole: 'action',
    },
    defaultProps: {
      variant: 'subtle',
    },
    responsiveConfig: {
      stackOnMobile: false,
    },
    animationPreset: 'fadeIn',
  },

  'cta-sticky': {
    id: 'cta-sticky',
    name: 'CTA Sticky',
    category: 'cta',
    description: 'Sticky/floating call-to-action',
    aiMetadata: {
      useCases: [
        'Persistent conversion',
        'Long-form content',
        'Scroll-based CTAs',
        'Mobile optimization',
      ],
      contentRequirements: {
        required: ['text', 'primaryCTA'],
        optional: ['dismissible'],
        maxLength: { text: 50 },
      },
      personaFit: [
        { persona: 'technical', score: 0.5 },
        { persona: 'business', score: 0.8 },
        { persona: 'executive', score: 0.6 },
      ],
      positionHints: {
        preferredPosition: 'bottom',
      },
      narrativeRole: 'action',
    },
    defaultProps: {
      position: 'bottom',
      showAfterScroll: 300,
    },
    responsiveConfig: {
      stackOnMobile: false,
    },
    animationPreset: 'slideUp',
  },

  'cta-card': {
    id: 'cta-card',
    name: 'CTA Card',
    category: 'cta',
    description: 'Card-style call-to-action',
    aiMetadata: {
      useCases: [
        'Featured offer',
        'Special promotion',
        'Resource download',
        'Event signup',
      ],
      contentRequirements: {
        required: ['title', 'primaryCTA'],
        optional: ['description', 'image', 'badge'],
        maxLength: { title: 60, description: 120 },
      },
      personaFit: [
        { persona: 'technical', score: 0.7 },
        { persona: 'business', score: 0.85 },
        { persona: 'executive', score: 0.75 },
      ],
      positionHints: {
        preferredPosition: 'any',
      },
      narrativeRole: 'action',
    },
    defaultProps: {
      variant: 'elevated',
    },
    responsiveConfig: {
      stackOnMobile: false,
    },
    animationPreset: 'scaleIn',
  },

  'cta-email': {
    id: 'cta-email',
    name: 'CTA Email',
    category: 'cta',
    description: 'Email capture call-to-action',
    aiMetadata: {
      useCases: [
        'Newsletter signup',
        'Lead capture',
        'Updates subscription',
        'Content gating',
      ],
      contentRequirements: {
        required: ['headline', 'emailField'],
        optional: ['subheadline', 'privacyNote'],
        maxLength: { headline: 60 },
      },
      personaFit: [
        { persona: 'technical', score: 0.6 },
        { persona: 'business', score: 0.85 },
        { persona: 'executive', score: 0.7 },
      ],
      positionHints: {
        preferredPosition: 'bottom',
        preferAfter: ['content-rich-text', 'features-grid'],
      },
      narrativeRole: 'action',
    },
    defaultProps: {
      showPrivacy: true,
    },
    responsiveConfig: {
      stackOnMobile: true,
    },
    animationPreset: 'slideUp',
  },

  'cta-demo': {
    id: 'cta-demo',
    name: 'CTA Demo',
    category: 'cta',
    description: 'Demo request call-to-action',
    aiMetadata: {
      useCases: [
        'Demo scheduling',
        'Sales qualified leads',
        'Product tours',
        'Consultation booking',
      ],
      contentRequirements: {
        required: ['headline', 'primaryCTA'],
        optional: ['subheadline', 'calendlyUrl', 'testimonial'],
        maxLength: { headline: 70, subheadline: 150 },
      },
      personaFit: [
        { persona: 'technical', score: 0.7 },
        { persona: 'business', score: 0.95 },
        { persona: 'executive', score: 0.9 },
      ],
      positionHints: {
        preferredPosition: 'bottom',
        preferAfter: ['pricing-cards', 'features-grid', 'testimonials-carousel'],
      },
      narrativeRole: 'action',
    },
    defaultProps: {
      showCalendar: false,
    },
    responsiveConfig: {
      stackOnMobile: true,
    },
    animationPreset: 'slideUp',
  },

  'cta-exit-intent': {
    id: 'cta-exit-intent',
    name: 'CTA Exit Intent',
    category: 'cta',
    description: 'Exit-intent popup/modal',
    aiMetadata: {
      useCases: [
        'Exit capture',
        'Last chance offers',
        'Abandonment recovery',
        'Special deals',
      ],
      contentRequirements: {
        required: ['headline', 'primaryCTA'],
        optional: ['subheadline', 'offer', 'image'],
        maxLength: { headline: 50 },
      },
      personaFit: [
        { persona: 'technical', score: 0.4 },
        { persona: 'business', score: 0.7 },
        { persona: 'executive', score: 0.5 },
      ],
      positionHints: {
        preferredPosition: 'any',
      },
      narrativeRole: 'action',
    },
    defaultProps: {
      trigger: 'exit-intent',
      showOnce: true,
    },
    responsiveConfig: {
      stackOnMobile: false,
      hideOnMobile: ['exit-intent'],
    },
    animationPreset: 'scaleIn',
  },

  'cta-scroll-triggered': {
    id: 'cta-scroll-triggered',
    name: 'CTA Scroll Triggered',
    category: 'cta',
    description: 'Scroll-triggered call-to-action',
    aiMetadata: {
      useCases: [
        'Engagement-based CTAs',
        'Progressive disclosure',
        'Reading completion',
        'Scroll milestones',
      ],
      contentRequirements: {
        required: ['headline', 'primaryCTA'],
        optional: ['subheadline'],
        maxLength: { headline: 60 },
      },
      personaFit: [
        { persona: 'technical', score: 0.6 },
        { persona: 'business', score: 0.75 },
        { persona: 'executive', score: 0.65 },
      ],
      positionHints: {
        preferredPosition: 'any',
      },
      narrativeRole: 'action',
    },
    defaultProps: {
      triggerPercentage: 50,
    },
    responsiveConfig: {
      stackOnMobile: false,
    },
    animationPreset: 'slideUp',
  },

  // ---------------------------------------------------------------------------
  // CONTENT COMPONENTS
  // ---------------------------------------------------------------------------
  'content-rich-text': {
    id: 'content-rich-text',
    name: 'Content Rich Text',
    category: 'content',
    description: 'Rich text content block',
    aiMetadata: {
      useCases: [
        'Long-form content',
        'Articles',
        'Documentation',
        'Policy pages',
      ],
      contentRequirements: {
        required: ['content'],
        optional: ['title'],
      },
      personaFit: [
        { persona: 'technical', score: 0.8 },
        { persona: 'business', score: 0.7 },
        { persona: 'executive', score: 0.6 },
      ],
      positionHints: {
        preferredPosition: 'middle',
      },
      narrativeRole: 'solution',
    },
    defaultProps: {
      maxWidth: 'prose',
    },
    responsiveConfig: {
      stackOnMobile: false,
    },
    animationPreset: 'fadeIn',
  },

  'content-columns': {
    id: 'content-columns',
    name: 'Content Columns',
    category: 'content',
    description: 'Multi-column content layout',
    aiMetadata: {
      useCases: [
        'Multi-topic content',
        'Balanced information',
        'Contact + map',
        'Side-by-side content',
      ],
      contentRequirements: {
        required: ['columns'],
        optional: ['sectionTitle'],
        minCount: { columns: 2 },
        maxCount: { columns: 4 },
      },
      personaFit: [
        { persona: 'technical', score: 0.7 },
        { persona: 'business', score: 0.8 },
        { persona: 'executive', score: 0.75 },
      ],
      positionHints: {
        preferredPosition: 'middle',
      },
      narrativeRole: 'solution',
    },
    defaultProps: {
      equalHeight: true,
    },
    responsiveConfig: {
      stackOnMobile: true,
    },
    animationPreset: 'staggerChildren',
  },

  'content-image-text': {
    id: 'content-image-text',
    name: 'Content Image Text',
    category: 'content',
    description: 'Image with accompanying text',
    aiMetadata: {
      useCases: [
        'Visual storytelling',
        'Product context',
        'Feature highlight',
        'About sections',
      ],
      contentRequirements: {
        required: ['image', 'content'],
        optional: ['title', 'cta'],
      },
      personaFit: [
        { persona: 'technical', score: 0.7 },
        { persona: 'business', score: 0.85 },
        { persona: 'executive', score: 0.8 },
      ],
      positionHints: {
        preferredPosition: 'middle',
      },
      narrativeRole: 'solution',
    },
    defaultProps: {
      imagePosition: 'left',
    },
    responsiveConfig: {
      stackOnMobile: true,
    },
    animationPreset: 'slideUp',
  },

  'content-video': {
    id: 'content-video',
    name: 'Content Video',
    category: 'content',
    description: 'Video content block',
    aiMetadata: {
      useCases: [
        'Product demos',
        'Explainer videos',
        'Testimonial videos',
        'Tutorial content',
      ],
      contentRequirements: {
        required: ['videoUrl'],
        optional: ['title', 'description', 'transcript'],
      },
      personaFit: [
        { persona: 'technical', score: 0.7 },
        { persona: 'business', score: 0.8 },
        { persona: 'executive', score: 0.85 },
      ],
      positionHints: {
        preferredPosition: 'middle',
      },
      narrativeRole: 'solution',
    },
    defaultProps: {
      aspectRatio: '16:9',
      showControls: true,
    },
    responsiveConfig: {
      stackOnMobile: false,
    },
    animationPreset: 'fadeIn',
  },

  'content-quote': {
    id: 'content-quote',
    name: 'Content Quote',
    category: 'content',
    description: 'Pull quote or blockquote',
    aiMetadata: {
      useCases: [
        'Key statements',
        'Executive quotes',
        'Customer quotes',
        'Emphasis points',
      ],
      contentRequirements: {
        required: ['quote'],
        optional: ['author', 'role', 'company', 'image'],
        maxLength: { quote: 300 },
      },
      personaFit: [
        { persona: 'technical', score: 0.5 },
        { persona: 'business', score: 0.85 },
        { persona: 'executive', score: 0.9 },
      ],
      positionHints: {
        preferredPosition: 'middle',
      },
      narrativeRole: 'proof',
    },
    defaultProps: {
      variant: 'large',
    },
    responsiveConfig: {
      stackOnMobile: false,
    },
    animationPreset: 'fadeIn',
  },

  'content-faq': {
    id: 'content-faq',
    name: 'Content FAQ',
    category: 'content',
    description: 'Frequently asked questions',
    aiMetadata: {
      useCases: [
        'Common questions',
        'Support content',
        'Objection handling',
        'Product clarification',
      ],
      contentRequirements: {
        required: ['questions'],
        optional: ['sectionTitle', 'sectionDescription'],
        minCount: { questions: 3 },
        maxCount: { questions: 15 },
      },
      personaFit: [
        { persona: 'technical', score: 0.85 },
        { persona: 'business', score: 0.8 },
        { persona: 'executive', score: 0.6 },
      ],
      positionHints: {
        preferredPosition: 'bottom',
        preferAfter: ['pricing-cards', 'features-grid'],
      },
      narrativeRole: 'proof',
    },
    defaultProps: {
      allowMultiple: false,
      showSearch: false,
    },
    responsiveConfig: {
      stackOnMobile: false,
    },
    animationPreset: 'staggerChildren',
  },

  'content-steps': {
    id: 'content-steps',
    name: 'Content Steps',
    category: 'content',
    description: 'Step-by-step process',
    aiMetadata: {
      useCases: [
        'How it works',
        'Getting started',
        'Process explanation',
        'Onboarding steps',
      ],
      contentRequirements: {
        required: ['steps'],
        optional: ['sectionTitle', 'sectionDescription'],
        minCount: { steps: 3 },
        maxCount: { steps: 7 },
      },
      personaFit: [
        { persona: 'technical', score: 0.8 },
        { persona: 'business', score: 0.85 },
        { persona: 'executive', score: 0.7 },
      ],
      positionHints: {
        preferredPosition: 'middle',
        preferAfter: ['hero-split', 'hero-centered'],
      },
      narrativeRole: 'solution',
    },
    defaultProps: {
      orientation: 'horizontal',
      showNumbers: true,
    },
    responsiveConfig: {
      stackOnMobile: true,
    },
    animationPreset: 'staggerChildren',
  },

  'content-glossary': {
    id: 'content-glossary',
    name: 'Content Glossary',
    category: 'content',
    description: 'Glossary/definitions list',
    aiMetadata: {
      useCases: [
        'Technical terms',
        'Industry jargon',
        'Product glossary',
        'Educational content',
      ],
      contentRequirements: {
        required: ['terms'],
        optional: ['sectionTitle'],
        minCount: { terms: 5 },
      },
      personaFit: [
        { persona: 'technical', score: 0.95 },
        { persona: 'business', score: 0.6 },
        { persona: 'executive', score: 0.4 },
      ],
      positionHints: {
        preferredPosition: 'middle',
      },
      narrativeRole: 'solution',
    },
    defaultProps: {
      alphabetize: true,
    },
    responsiveConfig: {
      stackOnMobile: false,
    },
    animationPreset: 'fadeIn',
  },

  'content-table': {
    id: 'content-table',
    name: 'Content Table',
    category: 'content',
    description: 'Data table content',
    aiMetadata: {
      useCases: [
        'Technical specifications',
        'Data presentation',
        'Comparison data',
        'Structured information',
      ],
      contentRequirements: {
        required: ['headers', 'rows'],
        optional: ['caption'],
        minCount: { headers: 2, rows: 2 },
      },
      personaFit: [
        { persona: 'technical', score: 1.0 },
        { persona: 'business', score: 0.7 },
        { persona: 'executive', score: 0.5 },
      ],
      positionHints: {
        preferredPosition: 'middle',
      },
      narrativeRole: 'solution',
    },
    defaultProps: {
      striped: true,
      sortable: false,
    },
    responsiveConfig: {
      stackOnMobile: true,
    },
    animationPreset: 'fadeIn',
  },

  'content-code': {
    id: 'content-code',
    name: 'Content Code',
    category: 'content',
    description: 'Code snippet display',
    aiMetadata: {
      useCases: [
        'API examples',
        'Code documentation',
        'Technical tutorials',
        'Developer content',
      ],
      contentRequirements: {
        required: ['code', 'language'],
        optional: ['title', 'description', 'copyButton'],
      },
      personaFit: [
        { persona: 'technical', score: 1.0 },
        { persona: 'business', score: 0.2 },
        { persona: 'executive', score: 0.1 },
      ],
      positionHints: {
        preferredPosition: 'middle',
      },
      narrativeRole: 'solution',
    },
    defaultProps: {
      showLineNumbers: true,
      showCopy: true,
    },
    responsiveConfig: {
      stackOnMobile: false,
    },
    animationPreset: 'fadeIn',
  },

  'content-callout': {
    id: 'content-callout',
    name: 'Content Callout',
    category: 'content',
    description: 'Callout/alert box',
    aiMetadata: {
      useCases: [
        'Important notices',
        'Tips and warnings',
        'Highlighted information',
        'Key takeaways',
      ],
      contentRequirements: {
        required: ['content'],
        optional: ['title', 'icon', 'type'],
        maxLength: { content: 500 },
      },
      personaFit: [
        { persona: 'technical', score: 0.8 },
        { persona: 'business', score: 0.7 },
        { persona: 'executive', score: 0.6 },
      ],
      positionHints: {
        preferredPosition: 'any',
      },
      narrativeRole: 'solution',
    },
    defaultProps: {
      type: 'info',
    },
    responsiveConfig: {
      stackOnMobile: false,
    },
    animationPreset: 'slideInLeft',
  },

  'content-divider': {
    id: 'content-divider',
    name: 'Content Divider',
    category: 'content',
    description: 'Visual section divider',
    aiMetadata: {
      useCases: [
        'Section separation',
        'Visual breaks',
        'Content organization',
        'Thematic shifts',
      ],
      contentRequirements: {
        required: [],
        optional: ['label', 'icon'],
      },
      personaFit: [
        { persona: 'technical', score: 0.5 },
        { persona: 'business', score: 0.5 },
        { persona: 'executive', score: 0.5 },
      ],
      positionHints: {
        preferredPosition: 'any',
      },
      narrativeRole: 'solution',
    },
    defaultProps: {
      variant: 'line',
    },
    responsiveConfig: {
      stackOnMobile: false,
    },
    animationPreset: 'none',
  },

  // ---------------------------------------------------------------------------
  // INTERACTIVE COMPONENTS
  // ---------------------------------------------------------------------------
  'interactive-quiz': {
    id: 'interactive-quiz',
    name: 'Interactive Quiz',
    category: 'interactive',
    description: 'Interactive quiz/assessment',
    aiMetadata: {
      useCases: [
        'Lead qualification',
        'Product recommendation',
        'Knowledge assessment',
        'Engagement tool',
      ],
      contentRequirements: {
        required: ['questions', 'results'],
        optional: ['title', 'description'],
        minCount: { questions: 3 },
      },
      personaFit: [
        { persona: 'technical', score: 0.7 },
        { persona: 'business', score: 0.85 },
        { persona: 'executive', score: 0.6 },
      ],
      positionHints: {
        preferredPosition: 'middle',
      },
      narrativeRole: 'action',
    },
    defaultProps: {
      showProgress: true,
    },
    responsiveConfig: {
      stackOnMobile: false,
    },
    animationPreset: 'fadeIn',
  },

  'interactive-survey': {
    id: 'interactive-survey',
    name: 'Interactive Survey',
    category: 'interactive',
    description: 'Multi-question survey',
    aiMetadata: {
      useCases: [
        'Customer feedback',
        'Market research',
        'User preferences',
        'NPS collection',
      ],
      contentRequirements: {
        required: ['questions'],
        optional: ['title', 'thankYouMessage'],
        minCount: { questions: 2 },
      },
      personaFit: [
        { persona: 'technical', score: 0.6 },
        { persona: 'business', score: 0.8 },
        { persona: 'executive', score: 0.5 },
      ],
      positionHints: {
        preferredPosition: 'middle',
      },
      narrativeRole: 'action',
    },
    defaultProps: {
      anonymous: false,
    },
    responsiveConfig: {
      stackOnMobile: false,
    },
    animationPreset: 'slideUp',
  },

  'interactive-calculator': {
    id: 'interactive-calculator',
    name: 'Interactive Calculator',
    category: 'interactive',
    description: 'Custom calculator tool',
    aiMetadata: {
      useCases: [
        'ROI calculator',
        'Savings calculator',
        'Sizing calculator',
        'Cost estimator',
      ],
      contentRequirements: {
        required: ['inputs', 'formula', 'outputs'],
        optional: ['title', 'description'],
        minCount: { inputs: 2 },
      },
      personaFit: [
        { persona: 'technical', score: 0.85 },
        { persona: 'business', score: 0.95 },
        { persona: 'executive', score: 0.8 },
      ],
      positionHints: {
        preferredPosition: 'middle',
        preferAfter: ['features-grid', 'pricing-cards'],
      },
      narrativeRole: 'proof',
    },
    defaultProps: {
      showBreakdown: true,
    },
    responsiveConfig: {
      stackOnMobile: true,
    },
    animationPreset: 'scaleIn',
  },

  'interactive-comparison': {
    id: 'interactive-comparison',
    name: 'Interactive Comparison',
    category: 'interactive',
    description: 'Interactive comparison tool',
    aiMetadata: {
      useCases: [
        'Product comparison',
        'Plan comparison',
        'Feature matrix',
        'Competitive analysis',
      ],
      contentRequirements: {
        required: ['items', 'criteria'],
        optional: ['title'],
        minCount: { items: 2, criteria: 3 },
      },
      personaFit: [
        { persona: 'technical', score: 0.9 },
        { persona: 'business', score: 0.85 },
        { persona: 'executive', score: 0.7 },
      ],
      positionHints: {
        preferredPosition: 'middle',
      },
      narrativeRole: 'solution',
    },
    defaultProps: {
      highlightDifferences: true,
    },
    responsiveConfig: {
      stackOnMobile: true,
    },
    animationPreset: 'fadeIn',
  },

  'interactive-timeline': {
    id: 'interactive-timeline',
    name: 'Interactive Timeline',
    category: 'interactive',
    description: 'Interactive timeline visualization',
    aiMetadata: {
      useCases: [
        'Company history',
        'Product roadmap',
        'Project milestones',
        'Event timeline',
      ],
      contentRequirements: {
        required: ['events'],
        optional: ['title'],
        minCount: { events: 4 },
      },
      personaFit: [
        { persona: 'technical', score: 0.7 },
        { persona: 'business', score: 0.8 },
        { persona: 'executive', score: 0.85 },
      ],
      positionHints: {
        preferredPosition: 'middle',
      },
      narrativeRole: 'proof',
    },
    defaultProps: {
      orientation: 'horizontal',
    },
    responsiveConfig: {
      stackOnMobile: true,
    },
    animationPreset: 'staggerChildren',
  },

  'interactive-carousel': {
    id: 'interactive-carousel',
    name: 'Interactive Carousel',
    category: 'interactive',
    description: 'Touch-friendly carousel',
    aiMetadata: {
      useCases: [
        'Image gallery',
        'Product showcase',
        'Content slides',
        'Portfolio display',
      ],
      contentRequirements: {
        required: ['slides'],
        optional: ['title'],
        minCount: { slides: 3 },
      },
      personaFit: [
        { persona: 'technical', score: 0.6 },
        { persona: 'business', score: 0.8 },
        { persona: 'executive', score: 0.75 },
      ],
      positionHints: {
        preferredPosition: 'middle',
      },
      narrativeRole: 'solution',
    },
    defaultProps: {
      autoPlay: false,
      showThumbnails: true,
    },
    responsiveConfig: {
      stackOnMobile: false,
    },
    animationPreset: 'fadeIn',
  },

  'interactive-map': {
    id: 'interactive-map',
    name: 'Interactive Map',
    category: 'interactive',
    description: 'Interactive map display',
    aiMetadata: {
      useCases: [
        'Location display',
        'Office locations',
        'Service areas',
        'Event venues',
      ],
      contentRequirements: {
        required: ['markers'],
        optional: ['title', 'center', 'zoom'],
        minCount: { markers: 1 },
      },
      personaFit: [
        { persona: 'technical', score: 0.5 },
        { persona: 'business', score: 0.7 },
        { persona: 'executive', score: 0.6 },
      ],
      positionHints: {
        preferredPosition: 'middle',
      },
      narrativeRole: 'solution',
    },
    defaultProps: {
      provider: 'mapbox',
    },
    responsiveConfig: {
      stackOnMobile: false,
    },
    animationPreset: 'fadeIn',
  },

  'interactive-tabs': {
    id: 'interactive-tabs',
    name: 'Interactive Tabs',
    category: 'interactive',
    description: 'Tabbed content interface',
    aiMetadata: {
      useCases: [
        'Content organization',
        'Multi-view content',
        'Category browsing',
        'Feature categories',
      ],
      contentRequirements: {
        required: ['tabs'],
        optional: ['title'],
        minCount: { tabs: 2 },
        maxCount: { tabs: 6 },
      },
      personaFit: [
        { persona: 'technical', score: 0.8 },
        { persona: 'business', score: 0.75 },
        { persona: 'executive', score: 0.6 },
      ],
      positionHints: {
        preferredPosition: 'middle',
      },
      narrativeRole: 'solution',
    },
    defaultProps: {
      orientation: 'horizontal',
    },
    responsiveConfig: {
      stackOnMobile: false,
    },
    animationPreset: 'fadeIn',
  },

  'interactive-modal': {
    id: 'interactive-modal',
    name: 'Interactive Modal',
    category: 'interactive',
    description: 'Modal/dialog component',
    aiMetadata: {
      useCases: [
        'Detail views',
        'Form overlays',
        'Confirmations',
        'Feature previews',
      ],
      contentRequirements: {
        required: ['content', 'trigger'],
        optional: ['title', 'footer'],
      },
      personaFit: [
        { persona: 'technical', score: 0.7 },
        { persona: 'business', score: 0.7 },
        { persona: 'executive', score: 0.6 },
      ],
      positionHints: {
        preferredPosition: 'any',
      },
      narrativeRole: 'solution',
    },
    defaultProps: {
      size: 'medium',
      closeOnOverlay: true,
    },
    responsiveConfig: {
      stackOnMobile: false,
    },
    animationPreset: 'scaleIn',
  },

  'interactive-drawer': {
    id: 'interactive-drawer',
    name: 'Interactive Drawer',
    category: 'interactive',
    description: 'Slide-out drawer panel',
    aiMetadata: {
      useCases: [
        'Side navigation',
        'Filter panels',
        'Detail sidebars',
        'Mobile menus',
      ],
      contentRequirements: {
        required: ['content', 'trigger'],
        optional: ['title'],
      },
      personaFit: [
        { persona: 'technical', score: 0.75 },
        { persona: 'business', score: 0.7 },
        { persona: 'executive', score: 0.5 },
      ],
      positionHints: {
        preferredPosition: 'any',
      },
      narrativeRole: 'solution',
    },
    defaultProps: {
      position: 'right',
      size: 'medium',
    },
    responsiveConfig: {
      stackOnMobile: false,
    },
    animationPreset: 'slideInRight',
  },

  // ---------------------------------------------------------------------------
  // FORM COMPONENTS
  // ---------------------------------------------------------------------------
  'form-contact': {
    id: 'form-contact',
    name: 'Form Contact',
    category: 'forms',
    description: 'Contact form',
    aiMetadata: {
      useCases: [
        'General inquiries',
        'Support requests',
        'Sales contact',
        'Feedback collection',
      ],
      contentRequirements: {
        required: ['fields', 'submitButton'],
        optional: ['title', 'description', 'successMessage'],
      },
      personaFit: [
        { persona: 'technical', score: 0.6 },
        { persona: 'business', score: 0.85 },
        { persona: 'executive', score: 0.8 },
      ],
      positionHints: {
        preferredPosition: 'bottom',
      },
      narrativeRole: 'action',
    },
    defaultProps: {
      showLabels: true,
    },
    responsiveConfig: {
      stackOnMobile: true,
    },
    animationPreset: 'fadeIn',
  },

  'form-newsletter': {
    id: 'form-newsletter',
    name: 'Form Newsletter',
    category: 'forms',
    description: 'Newsletter signup form',
    aiMetadata: {
      useCases: [
        'Email list building',
        'Content updates',
        'Blog subscriptions',
        'Product updates',
      ],
      contentRequirements: {
        required: ['emailField', 'submitButton'],
        optional: ['title', 'description', 'privacyNote'],
      },
      personaFit: [
        { persona: 'technical', score: 0.6 },
        { persona: 'business', score: 0.8 },
        { persona: 'executive', score: 0.7 },
      ],
      positionHints: {
        preferredPosition: 'bottom',
      },
      narrativeRole: 'action',
    },
    defaultProps: {
      inline: true,
    },
    responsiveConfig: {
      stackOnMobile: true,
    },
    animationPreset: 'slideUp',
  },

  'form-demo-request': {
    id: 'form-demo-request',
    name: 'Form Demo Request',
    category: 'forms',
    description: 'Demo/trial request form',
    aiMetadata: {
      useCases: [
        'Product demos',
        'Free trials',
        'Consultation booking',
        'Sales qualified leads',
      ],
      contentRequirements: {
        required: ['fields', 'submitButton'],
        optional: ['title', 'benefits', 'testimonial'],
      },
      personaFit: [
        { persona: 'technical', score: 0.75 },
        { persona: 'business', score: 0.95 },
        { persona: 'executive', score: 0.85 },
      ],
      positionHints: {
        preferredPosition: 'bottom',
        preferAfter: ['features-grid', 'pricing-cards'],
      },
      narrativeRole: 'action',
    },
    defaultProps: {
      showBenefits: true,
    },
    responsiveConfig: {
      stackOnMobile: true,
    },
    animationPreset: 'slideUp',
  },

  'form-multi-step': {
    id: 'form-multi-step',
    name: 'Form Multi-Step',
    category: 'forms',
    description: 'Multi-step wizard form',
    aiMetadata: {
      useCases: [
        'Complex signups',
        'Onboarding flows',
        'Qualification forms',
        'Application forms',
      ],
      contentRequirements: {
        required: ['steps'],
        optional: ['title', 'progressBar'],
        minCount: { steps: 2 },
        maxCount: { steps: 5 },
      },
      personaFit: [
        { persona: 'technical', score: 0.7 },
        { persona: 'business', score: 0.85 },
        { persona: 'executive', score: 0.6 },
      ],
      positionHints: {
        preferredPosition: 'middle',
      },
      narrativeRole: 'action',
    },
    defaultProps: {
      showProgress: true,
      allowSkip: false,
    },
    responsiveConfig: {
      stackOnMobile: false,
    },
    animationPreset: 'fadeIn',
  },

  'form-inline': {
    id: 'form-inline',
    name: 'Form Inline',
    category: 'forms',
    description: 'Inline form element',
    aiMetadata: {
      useCases: [
        'Quick actions',
        'Search bars',
        'Single-field forms',
        'Inline signups',
      ],
      contentRequirements: {
        required: ['field', 'submitButton'],
        optional: ['placeholder'],
      },
      personaFit: [
        { persona: 'technical', score: 0.7 },
        { persona: 'business', score: 0.75 },
        { persona: 'executive', score: 0.7 },
      ],
      positionHints: {
        preferredPosition: 'any',
      },
      narrativeRole: 'action',
    },
    defaultProps: {
      size: 'medium',
    },
    responsiveConfig: {
      stackOnMobile: true,
    },
    animationPreset: 'fadeIn',
  },

  'form-survey': {
    id: 'form-survey',
    name: 'Form Survey',
    category: 'forms',
    description: 'Survey/feedback form',
    aiMetadata: {
      useCases: [
        'Customer surveys',
        'Feedback collection',
        'Research forms',
        'Polls',
      ],
      contentRequirements: {
        required: ['questions'],
        optional: ['title', 'description', 'thankYouMessage'],
        minCount: { questions: 2 },
      },
      personaFit: [
        { persona: 'technical', score: 0.6 },
        { persona: 'business', score: 0.8 },
        { persona: 'executive', score: 0.5 },
      ],
      positionHints: {
        preferredPosition: 'middle',
      },
      narrativeRole: 'action',
    },
    defaultProps: {
      anonymous: true,
    },
    responsiveConfig: {
      stackOnMobile: false,
    },
    animationPreset: 'slideUp',
  },

  // ---------------------------------------------------------------------------
  // NAVIGATION COMPONENTS
  // ---------------------------------------------------------------------------
  'nav-header': {
    id: 'nav-header',
    name: 'Navigation Header',
    category: 'navigation',
    description: 'Main navigation header',
    aiMetadata: {
      useCases: [
        'Site navigation',
        'Brand header',
        'Primary nav',
        'App header',
      ],
      contentRequirements: {
        required: ['logo', 'navigation'],
        optional: ['cta', 'search', 'userMenu'],
      },
      personaFit: [
        { persona: 'technical', score: 0.7 },
        { persona: 'business', score: 0.7 },
        { persona: 'executive', score: 0.7 },
      ],
      positionHints: {
        preferredPosition: 'top',
      },
      narrativeRole: 'hook',
    },
    defaultProps: {
      sticky: true,
      transparent: false,
    },
    responsiveConfig: {
      stackOnMobile: false,
      hideOnMobile: ['secondary-nav'],
      showOnMobile: ['mobile-menu'],
    },
    animationPreset: 'fadeIn',
  },

  'nav-mega-menu': {
    id: 'nav-mega-menu',
    name: 'Navigation Mega Menu',
    category: 'navigation',
    description: 'Mega menu dropdown navigation',
    aiMetadata: {
      useCases: [
        'Complex navigation',
        'Large sites',
        'Product categories',
        'Resource menus',
      ],
      contentRequirements: {
        required: ['sections'],
        optional: ['featured', 'quickLinks'],
        minCount: { sections: 2 },
      },
      personaFit: [
        { persona: 'technical', score: 0.75 },
        { persona: 'business', score: 0.8 },
        { persona: 'executive', score: 0.7 },
      ],
      positionHints: {
        preferredPosition: 'top',
      },
      narrativeRole: 'hook',
    },
    defaultProps: {
      columns: 4,
    },
    responsiveConfig: {
      stackOnMobile: true,
      hideOnMobile: ['mega-menu'],
    },
    animationPreset: 'slideDown',
  },

  'nav-sidebar': {
    id: 'nav-sidebar',
    name: 'Navigation Sidebar',
    category: 'navigation',
    description: 'Sidebar navigation',
    aiMetadata: {
      useCases: [
        'Documentation',
        'App navigation',
        'Dashboard nav',
        'Settings menu',
      ],
      contentRequirements: {
        required: ['items'],
        optional: ['logo', 'footer'],
      },
      personaFit: [
        { persona: 'technical', score: 0.9 },
        { persona: 'business', score: 0.6 },
        { persona: 'executive', score: 0.5 },
      ],
      positionHints: {
        preferredPosition: 'any',
      },
      narrativeRole: 'hook',
    },
    defaultProps: {
      collapsible: true,
    },
    responsiveConfig: {
      stackOnMobile: false,
      hideOnMobile: ['sidebar'],
    },
    animationPreset: 'slideInLeft',
  },

  'nav-breadcrumb': {
    id: 'nav-breadcrumb',
    name: 'Navigation Breadcrumb',
    category: 'navigation',
    description: 'Breadcrumb navigation',
    aiMetadata: {
      useCases: [
        'Page hierarchy',
        'Navigation context',
        'Deep pages',
        'Category pages',
      ],
      contentRequirements: {
        required: ['items'],
        optional: ['separator'],
        minCount: { items: 2 },
      },
      personaFit: [
        { persona: 'technical', score: 0.8 },
        { persona: 'business', score: 0.7 },
        { persona: 'executive', score: 0.6 },
      ],
      positionHints: {
        preferredPosition: 'top',
        preferAfter: ['nav-header'],
      },
      narrativeRole: 'hook',
    },
    defaultProps: {
      separator: '/',
    },
    responsiveConfig: {
      stackOnMobile: false,
      hideOnMobile: ['middle-items'],
    },
    animationPreset: 'none',
  },

  // ---------------------------------------------------------------------------
  // FOOTER COMPONENTS
  // ---------------------------------------------------------------------------
  'footer-standard': {
    id: 'footer-standard',
    name: 'Footer Standard',
    category: 'footer',
    description: 'Standard site footer with links',
    aiMetadata: {
      useCases: [
        'Main footer',
        'Site-wide footer',
        'Corporate footer',
        'Multi-column footer',
      ],
      contentRequirements: {
        required: ['columns', 'copyright'],
        optional: ['logo', 'newsletter', 'social'],
      },
      personaFit: [
        { persona: 'technical', score: 0.7 },
        { persona: 'business', score: 0.7 },
        { persona: 'executive', score: 0.7 },
      ],
      positionHints: {
        preferredPosition: 'bottom',
      },
      narrativeRole: 'action',
    },
    defaultProps: {
      columns: 4,
    },
    responsiveConfig: {
      stackOnMobile: true,
    },
    animationPreset: 'fadeIn',
  },

  'footer-minimal': {
    id: 'footer-minimal',
    name: 'Footer Minimal',
    category: 'footer',
    description: 'Minimal footer with essential links',
    aiMetadata: {
      useCases: [
        'Simple pages',
        'Landing pages',
        'App footers',
        'Clean designs',
      ],
      contentRequirements: {
        required: ['copyright'],
        optional: ['links', 'social'],
      },
      personaFit: [
        { persona: 'technical', score: 0.7 },
        { persona: 'business', score: 0.65 },
        { persona: 'executive', score: 0.7 },
      ],
      positionHints: {
        preferredPosition: 'bottom',
      },
      narrativeRole: 'action',
    },
    defaultProps: {
      centered: true,
    },
    responsiveConfig: {
      stackOnMobile: true,
    },
    animationPreset: 'fadeIn',
  },

  'footer-cta': {
    id: 'footer-cta',
    name: 'Footer CTA',
    category: 'footer',
    description: 'Footer with prominent CTA',
    aiMetadata: {
      useCases: [
        'Conversion-focused',
        'Newsletter signup',
        'Demo request',
        'Final push',
      ],
      contentRequirements: {
        required: ['cta', 'copyright'],
        optional: ['headline', 'subheadline', 'links'],
      },
      personaFit: [
        { persona: 'technical', score: 0.6 },
        { persona: 'business', score: 0.85 },
        { persona: 'executive', score: 0.75 },
      ],
      positionHints: {
        preferredPosition: 'bottom',
      },
      narrativeRole: 'action',
    },
    defaultProps: {
      ctaPosition: 'top',
    },
    responsiveConfig: {
      stackOnMobile: true,
    },
    animationPreset: 'slideUp',
  },

  'footer-sitemap': {
    id: 'footer-sitemap',
    name: 'Footer Sitemap',
    category: 'footer',
    description: 'Comprehensive sitemap footer',
    aiMetadata: {
      useCases: [
        'Large sites',
        'Enterprise sites',
        'SEO-focused',
        'Full navigation',
      ],
      contentRequirements: {
        required: ['sections', 'copyright'],
        optional: ['logo', 'social', 'legal'],
        minCount: { sections: 4 },
      },
      personaFit: [
        { persona: 'technical', score: 0.7 },
        { persona: 'business', score: 0.75 },
        { persona: 'executive', score: 0.7 },
      ],
      positionHints: {
        preferredPosition: 'bottom',
      },
      narrativeRole: 'action',
    },
    defaultProps: {
      showSitemap: true,
    },
    responsiveConfig: {
      stackOnMobile: true,
    },
    animationPreset: 'fadeIn',
  },
};

// =============================================================================
// COMPONENT REGISTRY CLASS
// =============================================================================

export class ComponentRegistry {
  private components: Map<ComponentVariant, ComponentDefinition>;

  constructor() {
    this.components = new Map(
      Object.entries(COMPONENT_DEFINITIONS) as [ComponentVariant, ComponentDefinition][]
    );
  }

  /**
   * Get a component definition by ID
   */
  getComponent(id: ComponentVariant): ComponentDefinition | undefined {
    return this.components.get(id);
  }

  /**
   * Get all components in a category
   */
  getByCategory(category: ComponentCategory): ComponentDefinition[] {
    return Array.from(this.components.values()).filter(
      (c) => c.category === category
    );
  }

  /**
   * Get all components for a narrative role
   */
  getByNarrativeRole(role: NarrativeRole): ComponentDefinition[] {
    return Array.from(this.components.values()).filter(
      (c) => c.aiMetadata.narrativeRole === role
    );
  }

  /**
   * Calculate component score for selection
   */
  calculateScore(
    component: ComponentDefinition,
    context: ComponentSelectionContext
  ): ComponentScore {
    const { aiMetadata } = component;

    // Content match score (30%)
    const contentMatch = this.calculateContentMatch(
      aiMetadata.contentRequirements,
      context.availableContent
    );

    // Use case match score (25%)
    const useCaseMatch = this.calculateUseCaseMatch(
      aiMetadata.useCases,
      context.pageType
    );

    // Persona fit score (20%)
    const personaFit = context.targetPersona
      ? this.calculatePersonaFit(aiMetadata.personaFit, context.targetPersona)
      : 0.5;

    // Position match score (15%)
    const positionMatch = this.calculatePositionMatch(
      aiMetadata.positionHints,
      context
    );

    // Narrative fit score (10%)
    const narrativeFit =
      aiMetadata.narrativeRole === context.narrativeStage ? 1.0 : 0.3;

    const totalScore =
      contentMatch * 0.3 +
      useCaseMatch * 0.25 +
      personaFit * 0.2 +
      positionMatch * 0.15 +
      narrativeFit * 0.1;

    return {
      componentId: component.id,
      totalScore,
      breakdown: {
        contentMatch,
        useCaseMatch,
        personaFit,
        positionMatch,
        narrativeFit,
      },
    };
  }

  /**
   * Find best matching components for a context
   */
  findBestMatch(
    context: ComponentSelectionContext,
    limit: number = 5
  ): ComponentScore[] {
    const scores = Array.from(this.components.values())
      .filter((c) => !context.previousComponents.includes(c.id))
      .map((c) => this.calculateScore(c, context))
      .filter((s) => s.totalScore > 0.5)
      .sort((a, b) => b.totalScore - a.totalScore)
      .slice(0, limit);

    return scores;
  }

  /**
   * Calculate content match score
   */
  private calculateContentMatch(
    requirements: ComponentDefinition['aiMetadata']['contentRequirements'],
    availableContent: Record<string, unknown>
  ): number {
    const requiredFields = requirements.required;
    const optionalFields = requirements.optional;

    if (requiredFields.length === 0) return 1.0;

    const matchedRequired = requiredFields.filter(
      (field) => availableContent[field] !== undefined
    ).length;

    const requiredScore = matchedRequired / requiredFields.length;

    const matchedOptional = optionalFields.filter(
      (field) => availableContent[field] !== undefined
    ).length;

    const optionalScore =
      optionalFields.length > 0 ? matchedOptional / optionalFields.length : 0;

    // Required fields are weighted more heavily
    return requiredScore * 0.8 + optionalScore * 0.2;
  }

  /**
   * Calculate use case match score
   */
  private calculateUseCaseMatch(useCases: string[], pageType: string): number {
    const pageTypeKeywords: Record<string, string[]> = {
      home: ['homepage', 'landing', 'main', 'brand'],
      landing: ['campaign', 'landing', 'conversion', 'marketing'],
      product: ['product', 'saas', 'feature', 'software', 'app'],
      pricing: ['pricing', 'plan', 'cost', 'subscription'],
      about: ['about', 'company', 'team', 'story', 'history'],
      contact: ['contact', 'support', 'inquiry', 'feedback'],
      blog: ['blog', 'article', 'content', 'post'],
      'blog-post': ['article', 'post', 'content', 'blog'],
      'case-study': ['case study', 'success', 'customer', 'result'],
      features: ['feature', 'capability', 'function', 'product'],
      solutions: ['solution', 'industry', 'use case', 'vertical'],
      resources: ['resource', 'download', 'library', 'guide'],
      careers: ['career', 'job', 'team', 'culture', 'hiring'],
      legal: ['legal', 'terms', 'privacy', 'policy'],
      custom: [],
    };

    const keywords = pageTypeKeywords[pageType] || [];
    if (keywords.length === 0) return 0.5;

    const matchCount = useCases.filter((useCase) =>
      keywords.some((keyword) =>
        useCase.toLowerCase().includes(keyword.toLowerCase())
      )
    ).length;

    return Math.min(matchCount / 2, 1.0);
  }

  /**
   * Calculate persona fit score
   */
  private calculatePersonaFit(
    personaFits: PersonaFitScore[],
    targetPersona: string
  ): number {
    const fit = personaFits.find(
      (p) => p.persona.toLowerCase() === targetPersona.toLowerCase()
    );
    return fit?.score ?? 0.5;
  }

  /**
   * Calculate position match score
   */
  private calculatePositionMatch(
    hints: PositionHints,
    context: ComponentSelectionContext
  ): number {
    const { currentPosition, totalSections, previousComponents } = context;

    // Position in page (0 = top, 1 = bottom)
    const relativePosition = currentPosition / totalSections;

    let score = 0.5;

    // Check preferred position
    switch (hints.preferredPosition) {
      case 'top':
        score = relativePosition < 0.3 ? 1.0 : 0.3;
        break;
      case 'middle':
        score = relativePosition >= 0.2 && relativePosition <= 0.8 ? 1.0 : 0.4;
        break;
      case 'bottom':
        score = relativePosition > 0.7 ? 1.0 : 0.3;
        break;
      case 'any':
        score = 0.8;
        break;
    }

    // Check avoid/prefer after rules
    if (previousComponents.length > 0) {
      const lastComponent = previousComponents[previousComponents.length - 1];

      if (hints.avoidAfter?.includes(lastComponent)) {
        score *= 0.3;
      }

      if (hints.preferAfter?.includes(lastComponent)) {
        score *= 1.3;
      }
    }

    return Math.min(score, 1.0);
  }

  /**
   * Get all component IDs
   */
  getAllComponentIds(): ComponentVariant[] {
    return Array.from(this.components.keys());
  }

  /**
   * Get component count
   */
  getComponentCount(): number {
    return this.components.size;
  }
}

// Export singleton instance
export const componentRegistry = new ComponentRegistry();
