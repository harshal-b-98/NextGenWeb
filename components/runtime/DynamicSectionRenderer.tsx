/**
 * Dynamic Section Renderer
 * Phase 4.3: Dynamic Page Runtime
 *
 * Renders individual sections with animation support.
 */

'use client';

import React, { useMemo } from 'react';
import { motion, type Variants, type Easing } from 'framer-motion';
import type { PopulatedContent } from '@/lib/content/types';
import type {
  RuntimeSection,
  RuntimeAnimationConfig,
  RuntimeBrandConfig,
} from '@/lib/runtime/types';

// Import marketing components
import {
  HeroCentered,
  HeroSplit,
  HeroGradient,
  HeroVideo,
  HeroMinimal,
} from '@/components/marketing/heroes';
import {
  FeaturesGrid,
  FeaturesAlternating,
  FeaturesBento,
  FeaturesCards,
} from '@/components/marketing/features';
import {
  TestimonialsGrid,
  TestimonialsCarousel,
  TestimonialsQuote,
} from '@/components/marketing/testimonials';
import {
  CTABanner,
  CTASplit,
  CTACard,
  CTANewsletter,
} from '@/components/marketing/cta';
import { PricingCards, PricingTable } from '@/components/marketing/pricing';
import { FAQAccordion, FAQTwoColumn } from '@/components/marketing/faq';
import { FooterSimple, FooterMultiColumn } from '@/components/marketing/footer';
import { NavigationSimple, NavigationMega } from '@/components/marketing/navigation';

/**
 * Props for DynamicSectionRenderer
 */
interface DynamicSectionRendererProps {
  /** Section configuration */
  section: RuntimeSection;

  /** Content to render */
  content: PopulatedContent;

  /** Section index for animations */
  index: number;

  /** Whether this section is transitioning */
  isTransitioning: boolean;

  /** Animation configuration */
  animationConfig: RuntimeAnimationConfig;

  /** Brand configuration */
  brandConfig?: RuntimeBrandConfig;
}

/**
 * Component registry mapping component IDs to React components
 */
const COMPONENT_REGISTRY: Record<string, React.ComponentType<any>> = {
  // Heroes
  'hero-centered': HeroCentered,
  'hero-split': HeroSplit,
  'hero-gradient': HeroGradient,
  'hero-video': HeroVideo,
  'hero-minimal': HeroMinimal,

  // Features
  'features-grid': FeaturesGrid,
  'features-alternating': FeaturesAlternating,
  'features-bento': FeaturesBento,
  'features-cards': FeaturesCards,

  // Testimonials
  'testimonials-grid': TestimonialsGrid,
  'testimonials-carousel': TestimonialsCarousel,
  'testimonials-quote': TestimonialsQuote,

  // CTAs
  'cta-banner': CTABanner,
  'cta-split': CTASplit,
  'cta-card': CTACard,
  'cta-newsletter': CTANewsletter,

  // Pricing
  'pricing-cards': PricingCards,
  'pricing-table': PricingTable,

  // FAQ
  'faq-accordion': FAQAccordion,
  'faq-two-column': FAQTwoColumn,

  // Footers
  'footer-simple': FooterSimple,
  'footer-multi-column': FooterMultiColumn,

  // Navigation
  'navigation-simple': NavigationSimple,
  'navigation-mega': NavigationMega,
};

/**
 * Get animation variants based on config
 */
function getAnimationVariants(
  animationConfig: RuntimeAnimationConfig,
  index: number
): Variants {
  const delay = index * (animationConfig.staggerDelay / 1000);
  const easeOut: Easing = 'easeOut';

  switch (animationConfig.entranceAnimation) {
    case 'fade-up':
      return {
        hidden: { opacity: 0, y: 30 },
        visible: {
          opacity: 1,
          y: 0,
          transition: {
            duration: animationConfig.transitionDuration / 1000,
            delay,
            ease: easeOut,
          },
        },
        exit: {
          opacity: 0,
          y: -20,
          transition: { duration: animationConfig.transitionDuration / 2000 },
        },
      };

    case 'slide-in':
      return {
        hidden: { opacity: 0, x: -50 },
        visible: {
          opacity: 1,
          x: 0,
          transition: {
            duration: animationConfig.transitionDuration / 1000,
            delay,
            ease: easeOut,
          },
        },
        exit: {
          opacity: 0,
          x: 50,
          transition: { duration: animationConfig.transitionDuration / 2000 },
        },
      };

    case 'fade-in':
    default:
      return {
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            duration: animationConfig.transitionDuration / 1000,
            delay,
          },
        },
        exit: {
          opacity: 0,
          transition: { duration: animationConfig.transitionDuration / 2000 },
        },
      };
  }
}

/**
 * Get swap animation variants
 */
function getSwapVariants(animationConfig: RuntimeAnimationConfig): Variants {
  switch (animationConfig.swapAnimation) {
    case 'crossfade':
      return {
        initial: { opacity: 0 },
        animate: {
          opacity: 1,
          transition: { duration: animationConfig.transitionDuration / 1000 },
        },
        exit: {
          opacity: 0,
          transition: { duration: animationConfig.transitionDuration / 2000 },
        },
      };

    case 'slide':
      return {
        initial: { opacity: 0, y: 20 },
        animate: {
          opacity: 1,
          y: 0,
          transition: { duration: animationConfig.transitionDuration / 1000 },
        },
        exit: {
          opacity: 0,
          y: -20,
          transition: { duration: animationConfig.transitionDuration / 2000 },
        },
      };

    case 'fade':
    default:
      return {
        initial: { opacity: 0.5 },
        animate: {
          opacity: 1,
          transition: { duration: animationConfig.transitionDuration / 1000 },
        },
        exit: { opacity: 0 },
      };
  }
}

/**
 * Dynamic Section Renderer Component
 */
export function DynamicSectionRenderer({
  section,
  content,
  index,
  isTransitioning,
  animationConfig,
  brandConfig,
}: DynamicSectionRendererProps) {
  // Get the component to render
  const Component = useMemo(() => {
    return COMPONENT_REGISTRY[section.componentId] || FallbackSection;
  }, [section.componentId]);

  // Get animation variants
  const variants = useMemo(
    () =>
      animationConfig.enabled
        ? getAnimationVariants(animationConfig, index)
        : undefined,
    [animationConfig, index]
  );

  // Get swap animation
  const swapVariants = useMemo(
    () =>
      isTransitioning && animationConfig.enabled
        ? getSwapVariants(animationConfig)
        : undefined,
    [isTransitioning, animationConfig]
  );

  // Transform content to component props
  const props = useMemo(
    () => transformContentToProps(content, section.componentId, brandConfig),
    [content, section.componentId, brandConfig]
  );

  // Wrap with animation if enabled
  if (animationConfig.enabled) {
    return (
      <motion.section
        id={section.sectionId}
        className={`dynamic-section dynamic-section--${section.narrativeRole}`}
        variants={variants}
        initial="hidden"
        animate="visible"
        exit="exit"
        data-section-id={section.sectionId}
        data-component-id={section.componentId}
      >
        {isTransitioning ? (
          <motion.div
            key={`${section.sectionId}-content`}
            variants={swapVariants}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            <Component {...props} />
          </motion.div>
        ) : (
          <Component {...props} />
        )}
      </motion.section>
    );
  }

  // No animation
  return (
    <section
      id={section.sectionId}
      className={`dynamic-section dynamic-section--${section.narrativeRole}`}
      data-section-id={section.sectionId}
      data-component-id={section.componentId}
    >
      <Component {...props} />
    </section>
  );
}

/**
 * Transform PopulatedContent to component-specific props
 */
function transformContentToProps(
  content: PopulatedContent,
  componentId: string,
  brandConfig?: RuntimeBrandConfig
): Record<string, unknown> {
  const baseProps: Record<string, unknown> = {
    // Common props
    headline: content.headline,
    subheadline: content.subheadline,
    description: content.description,
    primaryCTA: content.primaryCTA,
    secondaryCTA: content.secondaryCTA,
    image: content.image,
    backgroundImage: content.backgroundImage,

    // Brand styling
    brandColors: brandConfig
      ? {
          primary: brandConfig.primaryColor,
          secondary: brandConfig.secondaryColor,
          accent: brandConfig.accentColor,
        }
      : undefined,
  };

  // Component-specific transformations
  if (componentId.startsWith('hero-')) {
    return {
      ...baseProps,
      video: content.video,
      bullets: content.bullets,
      statistics: content.statistics,
    };
  }

  if (componentId.startsWith('features-')) {
    return {
      ...baseProps,
      features: content.features,
      sectionTitle: content.sectionTitle || content.headline,
      sectionDescription: content.sectionDescription || content.description,
    };
  }

  if (componentId.startsWith('testimonials-')) {
    return {
      ...baseProps,
      testimonials: content.testimonials,
      sectionTitle: content.sectionTitle || content.headline,
    };
  }

  if (componentId.startsWith('cta-')) {
    return {
      ...baseProps,
      // CTA-specific props
    };
  }

  if (componentId.startsWith('pricing-')) {
    return {
      ...baseProps,
      tiers: content.pricingTiers,
      sectionTitle: content.sectionTitle || content.headline,
      sectionDescription: content.sectionDescription || content.description,
    };
  }

  if (componentId.startsWith('faq-')) {
    return {
      ...baseProps,
      faqs: content.faqs,
      sectionTitle: content.sectionTitle || content.headline,
    };
  }

  if (componentId.startsWith('footer-')) {
    return {
      ...baseProps,
      logos: content.logos,
    };
  }

  // Default - pass all content
  return { ...baseProps, ...content };
}

/**
 * Fallback component for unknown component IDs
 */
function FallbackSection({ headline, description }: PopulatedContent) {
  return (
    <div className="py-16 px-4 bg-gray-100">
      <div className="max-w-4xl mx-auto text-center">
        {headline && (
          <h2 className="text-3xl font-bold text-gray-900 mb-4">{headline}</h2>
        )}
        {description && <p className="text-lg text-gray-600">{description}</p>}
      </div>
    </div>
  );
}

export default DynamicSectionRenderer;
