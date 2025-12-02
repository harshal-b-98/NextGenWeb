/**
 * Page Runtime Hook
 * Phase 4.3: Dynamic Page Runtime
 *
 * React hook for managing dynamic page runtime with persona detection
 * and content adaptation.
 */

'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useTracking } from '@/lib/hooks/use-tracking';
import {
  ContentAdaptationEngine,
  createAdaptationEngine,
} from '@/lib/runtime/adaptation-engine';
import type {
  RuntimePageData,
  RuntimeState,
  ContentSelectionConfig,
  RuntimeAnimationConfig,
  ContentAdaptationEvent,
  SectionContentMap,
} from '@/lib/runtime/types';
import { DEFAULT_SELECTION_CONFIG, DEFAULT_ANIMATION_CONFIG } from '@/lib/runtime/types';
import type { PersonaMatch } from '@/lib/personas/types';
import type { PopulatedContent } from '@/lib/content/types';

/**
 * Hook options
 */
interface UsePageRuntimeOptions {
  /** Content selection configuration */
  selectionConfig?: Partial<ContentSelectionConfig>;

  /** Animation configuration */
  animationConfig?: Partial<RuntimeAnimationConfig>;

  /** Whether to auto-initialize tracking */
  autoInitTracking?: boolean;

  /** Detection interval (ms) - how often to check for persona */
  detectionIntervalMs?: number;

  /** Force a specific persona ID (bypasses tracking-based detection) */
  forcedPersonaId?: string;

  /** Callback when persona is detected */
  onPersonaDetected?: (persona: PersonaMatch) => void;

  /** Callback when content is adapted */
  onContentAdapted?: (event: ContentAdaptationEvent) => void;

  /** Callback on error */
  onError?: (error: string) => void;
}

/**
 * Hook return value
 */
interface UsePageRuntimeReturn {
  /** Current runtime state */
  state: RuntimeState;

  /** Current content map (section ID -> content) */
  contentMap: SectionContentMap;

  /** Get content for a specific section */
  getSectionContent: (sectionId: string) => PopulatedContent | null;

  /** Check if section is visible */
  isSectionVisible: (sectionId: string) => boolean;

  /** Check if section is currently transitioning */
  isSectionTransitioning: (sectionId: string) => boolean;

  /** Trigger manual persona detection */
  triggerDetection: () => Promise<void>;

  /** Force a specific variant */
  forceVariant: (variantId: string) => Promise<void>;

  /** Reset to default content */
  reset: () => void;

  /** Whether runtime is initialized */
  isInitialized: boolean;

  /** Current active variant */
  activeVariant: string;

  /** Current detected persona */
  detectedPersona: PersonaMatch | null;

  /** Current confidence score */
  confidence: number;

  /** Whether content is transitioning */
  isTransitioning: boolean;
}

/**
 * Page runtime hook for dynamic content adaptation
 */
export function usePageRuntime(
  pageData: RuntimePageData,
  options: UsePageRuntimeOptions = {}
): UsePageRuntimeReturn {
  const {
    selectionConfig = {},
    animationConfig = {},
    autoInitTracking = true,
    detectionIntervalMs = 30000,
    forcedPersonaId,
    onPersonaDetected,
    onContentAdapted,
    onError,
  } = options;

  // Refs
  const engineRef = useRef<ContentAdaptationEngine | null>(null);
  const detectionIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastDetectionRef = useRef<number>(0);

  // State
  const [state, setState] = useState<RuntimeState>(() => ({
    pageId: pageData.pageId,
    websiteId: pageData.websiteId,
    sessionId: null,
    visitorId: null,
    isInitialized: false,
    isLoading: true,
    activeVariant: 'default',
    currentPersona: null,
    previousPersona: null,
    isTransitioning: false,
    lastAdaptationAt: null,
    error: null,
  }));

  const [contentMap, setContentMap] = useState<SectionContentMap>(() => {
    // Initialize with default content
    const map: SectionContentMap = {};
    pageData.sections.forEach((section) => {
      map[section.sectionId] = section.defaultContent;
    });
    return map;
  });

  // Initialize tracking
  const tracking = useTracking({
    websiteId: pageData.websiteId,
    autoDetect: false, // We handle detection ourselves
    onPersonaDetected: handlePersonaDetected,
    onError,
  });

  /**
   * Initialize the adaptation engine
   */
  useEffect(() => {
    // Create engine
    const engine = createAdaptationEngine(
      pageData.pageId,
      pageData.websiteId,
      pageData.sections,
      { ...DEFAULT_SELECTION_CONFIG, ...selectionConfig },
      { ...DEFAULT_ANIMATION_CONFIG, ...animationConfig, ...pageData.animationConfig }
    );

    // Add event listener
    engine.addEventListener((event) => {
      if (event.type === 'content_adaptation') {
        onContentAdapted?.(event as ContentAdaptationEvent);

        // Send to analytics
        sendAdaptationEvent(event as ContentAdaptationEvent);
      }
    });

    engineRef.current = engine;

    // Update state when engine is ready
    setState((prev) => ({
      ...prev,
      isLoading: false,
    }));

    return () => {
      engineRef.current = null;
    };
  }, [pageData.pageId]);

  /**
   * Handle forced persona ID (for preview mode)
   * This bypasses tracking-based detection
   */
  useEffect(() => {
    if (!engineRef.current) return;

    if (forcedPersonaId) {
      // Force the specified variant
      engineRef.current.forceVariant(forcedPersonaId).then(() => {
        setState(engineRef.current!.getState());
        setContentMap(engineRef.current!.getContentMap());
      }).catch((error) => {
        console.error('Error forcing variant:', error);
        onError?.('Failed to apply forced persona');
      });
    } else if (forcedPersonaId === null) {
      // Reset to default when forced persona is cleared
      engineRef.current.reset();
      setState(engineRef.current.getState());
      setContentMap(engineRef.current.getContentMap());
    }
  }, [forcedPersonaId, onError]);

  /**
   * Initialize tracking session
   * Skip if forcedPersonaId is provided (preview mode)
   */
  useEffect(() => {
    if (!autoInitTracking || forcedPersonaId) return;

    // Wait for tracking to initialize
    if (tracking.isInitialized && tracking.state.sessionId) {
      engineRef.current?.initialize(
        tracking.state.sessionId,
        tracking.state.visitorId || ''
      );

      setState((prev) => ({
        ...prev,
        sessionId: tracking.state.sessionId,
        visitorId: tracking.state.visitorId,
        isInitialized: true,
      }));

      // Check for existing persona from previous session
      if (tracking.detectedPersonaId) {
        handleExistingPersona(
          tracking.detectedPersonaId,
          tracking.personaConfidence || 0.5
        );
      }
    }
  }, [tracking.isInitialized, tracking.state.sessionId]);

  /**
   * Set up periodic detection
   * Skip if forcedPersonaId is provided (preview mode)
   */
  useEffect(() => {
    if (!state.isInitialized || forcedPersonaId) return;

    detectionIntervalRef.current = setInterval(() => {
      const now = Date.now();
      if (now - lastDetectionRef.current >= detectionIntervalMs) {
        triggerDetection();
      }
    }, detectionIntervalMs);

    return () => {
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current);
      }
    };
  }, [state.isInitialized, detectionIntervalMs]);

  /**
   * Handle persona detection from tracking
   */
  function handlePersonaDetected(personaId: string, confidence: number) {
    const personaMatch: PersonaMatch = {
      personaId,
      confidence,
      matchedRules: [],
      signals: [],
      alternativeMatches: [],
    };

    processPersonaMatch(personaMatch);
    onPersonaDetected?.(personaMatch);
  }

  /**
   * Handle existing persona from previous session
   */
  async function handleExistingPersona(personaId: string, confidence: number) {
    const personaMatch: PersonaMatch = {
      personaId,
      confidence,
      matchedRules: [],
      signals: [],
      alternativeMatches: [],
    };

    await processPersonaMatch(personaMatch);
  }

  /**
   * Process a persona match and update content
   */
  async function processPersonaMatch(personaMatch: PersonaMatch) {
    if (!engineRef.current) return;

    try {
      const result = await engineRef.current.processPersonaDetection(personaMatch);

      // Update state
      setState(engineRef.current.getState());

      // Update content map if changed
      if (result.wasSwapped) {
        setContentMap(engineRef.current.getContentMap());
      }

      lastDetectionRef.current = Date.now();
    } catch (error) {
      console.error('Error processing persona:', error);
      onError?.('Failed to process persona detection');
    }
  }

  /**
   * Trigger manual detection
   */
  const triggerDetection = useCallback(async () => {
    await tracking.triggerDetection();
    lastDetectionRef.current = Date.now();
  }, [tracking]);

  /**
   * Force a specific variant
   */
  const forceVariant = useCallback(async (variantId: string) => {
    if (!engineRef.current) return;

    try {
      await engineRef.current.forceVariant(variantId);
      setState(engineRef.current.getState());
      setContentMap(engineRef.current.getContentMap());
    } catch (error) {
      console.error('Error forcing variant:', error);
      onError?.('Failed to change content variant');
    }
  }, [onError]);

  /**
   * Get content for a section
   */
  const getSectionContent = useCallback(
    (sectionId: string): PopulatedContent | null => {
      return contentMap[sectionId] || null;
    },
    [contentMap]
  );

  /**
   * Check if section is visible
   */
  const isSectionVisible = useCallback(
    (sectionId: string): boolean => {
      return engineRef.current?.isSectionVisible(sectionId) ?? true;
    },
    [state.activeVariant]
  );

  /**
   * Check if section is transitioning
   */
  const isSectionTransitioning = useCallback(
    (sectionId: string): boolean => {
      return engineRef.current?.isSectionTransitioning(sectionId) ?? false;
    },
    [state.isTransitioning]
  );

  /**
   * Reset to default content
   */
  const reset = useCallback(() => {
    if (!engineRef.current) return;

    engineRef.current.reset();
    setState(engineRef.current.getState());
    setContentMap(engineRef.current.getContentMap());
  }, []);

  /**
   * Send adaptation event to analytics
   */
  async function sendAdaptationEvent(event: ContentAdaptationEvent) {
    try {
      await fetch('/api/runtime/adaptations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event),
      });
    } catch (error) {
      console.error('Failed to send adaptation event:', error);
    }
  }

  return {
    state,
    contentMap,
    getSectionContent,
    isSectionVisible,
    isSectionTransitioning,
    triggerDetection,
    forceVariant,
    reset,
    isInitialized: state.isInitialized,
    activeVariant: state.activeVariant,
    detectedPersona: state.currentPersona,
    confidence: state.currentPersona?.confidence ?? 0,
    isTransitioning: state.isTransitioning,
  };
}
