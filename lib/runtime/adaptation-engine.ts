/**
 * Content Adaptation Engine
 * Phase 4.3: Dynamic Page Runtime
 *
 * Manages content adaptation lifecycle including transitions,
 * event emission, and state management.
 */

import type { PopulatedContent } from '@/lib/content/types';
import type { PersonaMatch } from '@/lib/personas/types';
import type {
  RuntimeState,
  RuntimeSection,
  RuntimeAnimationConfig,
  ContentSelectionConfig,
  ContentSelectionResult,
  ContentAdaptationEvent,
  ContentSwapCompleteEvent,
  TransitionState,
  SectionContentMap,
} from './types';
import {
  DEFAULT_RUNTIME_STATE,
  DEFAULT_ANIMATION_CONFIG,
  DEFAULT_SELECTION_CONFIG,
} from './types';
import { ContentSelector } from './content-selector';

/**
 * Event listener type
 */
type AdaptationEventListener = (
  event: ContentAdaptationEvent | ContentSwapCompleteEvent
) => void;

/**
 * Content Adaptation Engine
 *
 * Orchestrates the content adaptation process including:
 * - Content selection based on persona
 * - Transition state management
 * - Event emission for analytics
 */
export class ContentAdaptationEngine {
  private state: RuntimeState;
  private sections: RuntimeSection[];
  private contentSelector: ContentSelector;
  private animationConfig: RuntimeAnimationConfig;
  private transitionState: TransitionState;
  private listeners: Set<AdaptationEventListener>;
  private currentContentMap: SectionContentMap;

  constructor(
    pageId: string,
    websiteId: string,
    sections: RuntimeSection[],
    selectionConfig?: Partial<ContentSelectionConfig>,
    animationConfig?: Partial<RuntimeAnimationConfig>
  ) {
    this.state = {
      ...DEFAULT_RUNTIME_STATE,
      pageId,
      websiteId,
    };
    this.sections = sections;
    this.contentSelector = new ContentSelector(selectionConfig);
    this.animationConfig = { ...DEFAULT_ANIMATION_CONFIG, ...animationConfig };
    this.transitionState = {
      isActive: false,
      transitioningSections: [],
      startTime: 0,
      duration: 0,
    };
    this.listeners = new Set();
    this.currentContentMap = this.buildContentMap('default');
  }

  /**
   * Initialize the engine with tracking session
   */
  initialize(sessionId: string, visitorId: string): void {
    this.state = {
      ...this.state,
      sessionId,
      visitorId,
      isInitialized: true,
      isLoading: false,
    };
  }

  /**
   * Process a persona detection result and adapt content if needed
   */
  async processPersonaDetection(
    personaMatch: PersonaMatch | null
  ): Promise<ContentSelectionResult> {
    const previousVariant = this.state.activeVariant;
    const previousPersona = this.state.currentPersona;

    // Select content based on persona
    const selectionResult = this.contentSelector.selectContent(
      this.sections,
      personaMatch,
      previousVariant
    );

    // Update state
    this.state = {
      ...this.state,
      currentPersona: personaMatch,
      previousPersona,
    };

    // If content changed, trigger adaptation
    if (selectionResult.wasSwapped) {
      await this.triggerAdaptation(selectionResult);
    }

    return selectionResult;
  }

  /**
   * Trigger content adaptation with transition
   */
  private async triggerAdaptation(
    selectionResult: ContentSelectionResult
  ): Promise<void> {
    const { variantId, changedSections, reason, confidence } = selectionResult;

    // Start transition
    this.startTransition(changedSections);

    // Emit adaptation event
    const adaptationEvent = this.createAdaptationEvent(
      selectionResult.previousVariant || 'default',
      variantId,
      changedSections,
      reason,
      confidence
    );
    this.emitEvent(adaptationEvent);

    // Update content map
    this.currentContentMap = this.buildContentMap(variantId);

    // Update state
    this.state = {
      ...this.state,
      activeVariant: variantId,
      lastAdaptationAt: new Date().toISOString(),
    };

    // Wait for transition to complete
    await this.waitForTransition();

    // End transition
    this.endTransition();

    // Emit swap complete event
    const swapCompleteEvent = this.createSwapCompleteEvent(variantId);
    this.emitEvent(swapCompleteEvent);
  }

  /**
   * Start a transition
   */
  private startTransition(sectionIds: string[]): void {
    this.transitionState = {
      isActive: true,
      transitioningSections: sectionIds,
      startTime: Date.now(),
      duration: this.animationConfig.transitionDuration,
    };
    this.state = {
      ...this.state,
      isTransitioning: true,
    };
  }

  /**
   * End transition
   */
  private endTransition(): void {
    this.transitionState = {
      isActive: false,
      transitioningSections: [],
      startTime: 0,
      duration: 0,
    };
    this.state = {
      ...this.state,
      isTransitioning: false,
    };
  }

  /**
   * Wait for transition to complete
   */
  private waitForTransition(): Promise<void> {
    if (!this.animationConfig.enabled || this.animationConfig.swapAnimation === 'none') {
      return Promise.resolve();
    }

    return new Promise((resolve) => {
      setTimeout(resolve, this.animationConfig.transitionDuration);
    });
  }

  /**
   * Build content map for a variant
   */
  private buildContentMap(variantId: string): SectionContentMap {
    return this.contentSelector.getContentMap(this.sections, variantId);
  }

  /**
   * Create adaptation event
   */
  private createAdaptationEvent(
    fromVariant: string,
    toVariant: string,
    adaptedSections: string[],
    reason: ContentSelectionResult['reason'],
    confidence: number
  ): ContentAdaptationEvent {
    return {
      type: 'content_adaptation',
      pageId: this.state.pageId,
      websiteId: this.state.websiteId,
      sessionId: this.state.sessionId || '',
      personaId: this.state.currentPersona?.personaId,
      fromVariant,
      toVariant,
      adaptedSections,
      confidence,
      reason,
      transitionDuration: this.animationConfig.transitionDuration,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Create swap complete event
   */
  private createSwapCompleteEvent(activeVariant: string): ContentSwapCompleteEvent {
    const swapDuration = Date.now() - this.transitionState.startTime;
    return {
      type: 'content_swap_complete',
      pageId: this.state.pageId,
      sessionId: this.state.sessionId || '',
      activeVariant,
      swapDuration,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Emit event to all listeners
   */
  private emitEvent(
    event: ContentAdaptationEvent | ContentSwapCompleteEvent
  ): void {
    this.listeners.forEach((listener) => {
      try {
        listener(event);
      } catch (error) {
        console.error('Event listener error:', error);
      }
    });
  }

  /**
   * Add event listener
   */
  addEventListener(listener: AdaptationEventListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Remove event listener
   */
  removeEventListener(listener: AdaptationEventListener): void {
    this.listeners.delete(listener);
  }

  // ============================================================================
  // GETTERS
  // ============================================================================

  /**
   * Get current state
   */
  getState(): RuntimeState {
    return { ...this.state };
  }

  /**
   * Get current content map
   */
  getContentMap(): SectionContentMap {
    return { ...this.currentContentMap };
  }

  /**
   * Get content for a specific section
   */
  getSectionContent(sectionId: string): PopulatedContent | null {
    return this.currentContentMap[sectionId] || null;
  }

  /**
   * Get active variant
   */
  getActiveVariant(): string {
    return this.state.activeVariant;
  }

  /**
   * Check if transitioning
   */
  isTransitioning(): boolean {
    return this.state.isTransitioning;
  }

  /**
   * Get transition state
   */
  getTransitionState(): TransitionState {
    return { ...this.transitionState };
  }

  /**
   * Check if section is transitioning
   */
  isSectionTransitioning(sectionId: string): boolean {
    return this.transitionState.transitioningSections.includes(sectionId);
  }

  /**
   * Check if section should be visible
   */
  isSectionVisible(sectionId: string): boolean {
    const section = this.sections.find((s) => s.sectionId === sectionId);
    if (!section) return false;
    return this.contentSelector.isSectionVisible(section, this.state.activeVariant);
  }

  /**
   * Get all visible sections
   */
  getVisibleSections(): RuntimeSection[] {
    return this.sections.filter((section) =>
      this.contentSelector.isSectionVisible(section, this.state.activeVariant)
    );
  }

  /**
   * Get animation config
   */
  getAnimationConfig(): RuntimeAnimationConfig {
    return { ...this.animationConfig };
  }

  // ============================================================================
  // SETTERS / MODIFIERS
  // ============================================================================

  /**
   * Set error state
   */
  setError(error: string): void {
    this.state = {
      ...this.state,
      error,
      isLoading: false,
    };
  }

  /**
   * Clear error
   */
  clearError(): void {
    this.state = {
      ...this.state,
      error: null,
    };
  }

  /**
   * Force variant selection (manual override)
   */
  async forceVariant(variantId: string): Promise<void> {
    const previousVariant = this.state.activeVariant;

    if (previousVariant === variantId) {
      return; // No change needed
    }

    // Get changed sections
    const changedSections = this.sections
      .filter((section) => {
        const current = this.contentSelector.getSectionContent(section, previousVariant);
        const next = this.contentSelector.getSectionContent(section, variantId);
        return JSON.stringify(current) !== JSON.stringify(next);
      })
      .map((s) => s.sectionId);

    // Trigger adaptation
    await this.triggerAdaptation({
      variantId,
      wasSwapped: true,
      previousVariant,
      reason: 'manual_override',
      confidence: 1.0,
      changedSections,
    });
  }

  /**
   * Reset to default state
   */
  reset(): void {
    this.state = {
      ...DEFAULT_RUNTIME_STATE,
      pageId: this.state.pageId,
      websiteId: this.state.websiteId,
    };
    this.contentSelector.reset();
    this.currentContentMap = this.buildContentMap('default');
  }
}

/**
 * Factory function to create adaptation engine
 */
export function createAdaptationEngine(
  pageId: string,
  websiteId: string,
  sections: RuntimeSection[],
  selectionConfig?: Partial<ContentSelectionConfig>,
  animationConfig?: Partial<RuntimeAnimationConfig>
): ContentAdaptationEngine {
  return new ContentAdaptationEngine(
    pageId,
    websiteId,
    sections,
    selectionConfig,
    animationConfig
  );
}
