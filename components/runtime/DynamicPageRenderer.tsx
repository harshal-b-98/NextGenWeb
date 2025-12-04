/**
 * Dynamic Page Renderer
 * Phase 4.3: Dynamic Page Runtime
 *
 * Main component for rendering dynamic pages with persona-aware content.
 */

'use client';

import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePageRuntime } from './use-page-runtime';
import { DynamicSectionRenderer } from './DynamicSectionRenderer';
import type {
  RuntimePageData,
  DynamicPageRendererProps,
  RuntimeAnimationConfig,
} from '@/lib/runtime/types';
import { DEFAULT_ANIMATION_CONFIG } from '@/lib/runtime/types';

/**
 * Dynamic Page Renderer Component
 *
 * Renders a complete page with persona-aware content adaptation.
 * Handles tracking initialization, persona detection, and content swapping.
 */
export function DynamicPageRenderer({
  pageData,
  initialSessionId,
  initialVisitorId,
  autoInitTracking = true,
  forcedPersonaId,
  selectionConfig,
  animationConfig: animConfigOverride,
  onPersonaDetected,
  onContentAdapted,
  onError,
  sectionWrapper: SectionWrapper,
}: DynamicPageRendererProps) {
  // Merge animation config
  const animationConfig: RuntimeAnimationConfig = useMemo(
    () => ({
      ...DEFAULT_ANIMATION_CONFIG,
      ...pageData.animationConfig,
      ...animConfigOverride,
    }),
    [pageData.animationConfig, animConfigOverride]
  );

  // Initialize runtime
  const runtime = usePageRuntime(pageData, {
    selectionConfig,
    animationConfig,
    autoInitTracking,
    forcedPersonaId,
    onPersonaDetected,
    onContentAdapted,
    onError,
  });

  // Get visible sections in order
  const visibleSections = useMemo(() => {
    return pageData.sections
      .filter((section) => runtime.isSectionVisible(section.sectionId))
      .sort((a, b) => a.order - b.order);
  }, [pageData.sections, runtime.activeVariant]);

  // Page container animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: animationConfig.staggerDelay / 1000,
      },
    },
  };

  // Error state
  if (runtime.state.error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Something went wrong
          </h2>
          <p className="text-gray-600">{runtime.state.error}</p>
          <button
            onClick={runtime.reset}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Loading state
  if (runtime.state.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-gray-200" />
          <div className="h-4 w-32 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div
      className="dynamic-page"
      style={
        pageData.brandConfig
          ? ({
              '--brand-primary': pageData.brandConfig.primaryColor,
              '--brand-secondary': pageData.brandConfig.secondaryColor,
              '--brand-accent': pageData.brandConfig.accentColor,
              '--brand-font': pageData.brandConfig.fontFamily,
            } as React.CSSProperties)
          : undefined
      }
    >
      {/* SEO Meta */}
      <PageMeta metadata={pageData.metadata} />

      {/* Debug Info (development only or when forced persona) */}
      {(process.env.NODE_ENV === 'development' || forcedPersonaId) && (
        <RuntimeDebugInfo
          activeVariant={runtime.activeVariant}
          confidence={runtime.confidence}
          isTransitioning={runtime.isTransitioning}
          detectedPersona={runtime.detectedPersona?.personaId}
          forcedPersonaId={forcedPersonaId}
        />
      )}

      {/* Page Sections */}
      <motion.main
        variants={containerVariants}
        initial={animationConfig.enabled ? 'hidden' : false}
        animate="visible"
        className="dynamic-page__content"
      >
        <AnimatePresence mode="wait">
          {visibleSections.map((section, index) => {
            const content = runtime.getSectionContent(section.sectionId);

            if (!content) return null;

            const sectionElement = (
              <DynamicSectionRenderer
                key={`${section.sectionId}-${runtime.activeVariant}`}
                section={section}
                content={content}
                index={index}
                isTransitioning={runtime.isSectionTransitioning(section.sectionId)}
                animationConfig={animationConfig}
                brandConfig={pageData.brandConfig}
              />
            );

            // Wrap with SectionWrapper if provided (for feedback overlay support)
            if (SectionWrapper) {
              return (
                <SectionWrapper
                  key={`wrapper-${section.sectionId}-${runtime.activeVariant}`}
                  sectionId={section.sectionId}
                  componentId={section.componentId}
                >
                  {sectionElement}
                </SectionWrapper>
              );
            }

            return sectionElement;
          })}
        </AnimatePresence>
      </motion.main>
    </div>
  );
}

/**
 * Page Meta Component
 * Sets document head metadata
 */
function PageMeta({ metadata }: { metadata: RuntimePageData['metadata'] }) {
  // In a real app, use next/head or similar
  React.useEffect(() => {
    if (typeof document !== 'undefined') {
      document.title = metadata.title;

      // Update meta description
      let metaDesc = document.querySelector('meta[name="description"]');
      if (!metaDesc) {
        metaDesc = document.createElement('meta');
        metaDesc.setAttribute('name', 'description');
        document.head.appendChild(metaDesc);
      }
      metaDesc.setAttribute('content', metadata.description);
    }
  }, [metadata]);

  return null;
}

/**
 * Debug Info Component
 * Shows runtime state during development or preview mode
 */
function RuntimeDebugInfo({
  activeVariant,
  confidence,
  isTransitioning,
  detectedPersona,
  forcedPersonaId,
}: {
  activeVariant: string;
  confidence: number;
  isTransitioning: boolean;
  detectedPersona?: string;
  forcedPersonaId?: string;
}) {
  return (
    <div className="fixed bottom-4 right-4 bg-black/80 text-white text-xs p-3 rounded-lg z-50 font-mono">
      <div className="font-bold mb-1">
        {forcedPersonaId ? 'Preview Mode' : 'Runtime Debug'}
      </div>
      <div>Variant: {activeVariant}</div>
      {forcedPersonaId ? (
        <div className="text-yellow-400">Forced: {forcedPersonaId}</div>
      ) : (
        <div>Persona: {detectedPersona || 'none'}</div>
      )}
      <div>Confidence: {(confidence * 100).toFixed(1)}%</div>
      <div>Transitioning: {isTransitioning ? 'yes' : 'no'}</div>
    </div>
  );
}

export default DynamicPageRenderer;
