/**
 * Content Selector
 * Phase 4.3: Dynamic Page Runtime
 *
 * Selects appropriate content variants based on detected persona
 * and confidence thresholds.
 */

import type { PopulatedContent } from '@/lib/content/types';
import type { PersonaMatch } from '@/lib/personas/types';
import type {
  RuntimeSection,
  ContentSelectionConfig,
  ContentSelectionResult,
  ContentSelectionReason,
  SectionContentMap,
} from './types';
import { DEFAULT_SELECTION_CONFIG } from './types';

/**
 * Content Selector Service
 *
 * Responsible for selecting the appropriate content variant
 * based on persona detection results and configuration.
 */
export class ContentSelector {
  private config: ContentSelectionConfig;
  private currentVariant: string = 'default';
  private lastConfidence: number = 0;

  constructor(config: Partial<ContentSelectionConfig> = {}) {
    this.config = { ...DEFAULT_SELECTION_CONFIG, ...config };
  }

  /**
   * Select content for all sections based on persona match
   */
  selectContent(
    sections: RuntimeSection[],
    personaMatch: PersonaMatch | null,
    previousVariant: string = 'default'
  ): ContentSelectionResult {
    // Determine which variant to use
    const { variantId, reason, confidence } = this.determineVariant(
      personaMatch,
      sections,
      previousVariant
    );

    // Track what changed
    const changedSections = this.getChangedSections(
      sections,
      previousVariant,
      variantId
    );

    // Update internal state
    const wasSwapped = variantId !== previousVariant;
    this.currentVariant = variantId;
    this.lastConfidence = confidence;

    return {
      variantId,
      wasSwapped,
      previousVariant: wasSwapped ? previousVariant : undefined,
      reason,
      confidence,
      changedSections,
    };
  }

  /**
   * Get content map for all sections with selected variant
   */
  getContentMap(
    sections: RuntimeSection[],
    variantId: string
  ): SectionContentMap {
    const contentMap: SectionContentMap = {};

    for (const section of sections) {
      contentMap[section.sectionId] = this.getSectionContent(section, variantId);
    }

    return contentMap;
  }

  /**
   * Get content for a single section
   */
  getSectionContent(
    section: RuntimeSection,
    variantId: string
  ): PopulatedContent {
    // Check if persona variant exists
    if (variantId !== 'default' && section.personaVariants[variantId]) {
      return section.personaVariants[variantId];
    }

    // Fall back to default
    return section.defaultContent;
  }

  /**
   * Check if a section should be visible for a persona
   */
  isSectionVisible(section: RuntimeSection, variantId: string): boolean {
    const visibility = section.visibility;

    if (!visibility) {
      return true; // Default to visible
    }

    // Check hide rules
    if (visibility.hideForPersonas?.includes(variantId)) {
      return false;
    }

    // Check show-only rules
    if (visibility.showOnlyForPersonas && visibility.showOnlyForPersonas.length > 0) {
      return visibility.showOnlyForPersonas.includes(variantId) || variantId === 'default';
    }

    return visibility.defaultVisible;
  }

  /**
   * Determine which variant to use based on persona match
   */
  private determineVariant(
    personaMatch: PersonaMatch | null,
    sections: RuntimeSection[],
    previousVariant: string
  ): { variantId: string; reason: ContentSelectionReason; confidence: number } {
    // No persona detected - use default
    if (!personaMatch) {
      return {
        variantId: 'default',
        reason: previousVariant === 'default' ? 'initial_load' : 'fallback_used',
        confidence: 0,
      };
    }

    const { personaId, confidence } = personaMatch;

    // Check if confidence meets threshold
    if (confidence < this.config.confidenceThreshold) {
      if (this.config.useFallback) {
        return {
          variantId: this.config.fallbackVariant,
          reason: 'fallback_used',
          confidence,
        };
      }
      // Keep current if not using fallback
      return {
        variantId: previousVariant,
        reason: 'fallback_used',
        confidence,
      };
    }

    // Check if variant exists for this persona
    const hasVariant = sections.some(
      (section) => section.personaVariants[personaId] !== undefined
    );

    if (!hasVariant) {
      return {
        variantId: 'default',
        reason: 'no_variant_available',
        confidence,
      };
    }

    // Check hysteresis - only swap if significant confidence increase
    if (previousVariant !== 'default' && previousVariant !== personaId) {
      const confidenceIncrease = confidence - this.lastConfidence;
      if (confidenceIncrease < this.config.confidenceHysteresis) {
        return {
          variantId: previousVariant,
          reason: 'confidence_increased',
          confidence,
        };
      }
    }

    // Determine reason for selection
    let reason: ContentSelectionReason;
    if (previousVariant === 'default') {
      reason = 'persona_detected';
    } else if (previousVariant !== personaId) {
      reason = 'persona_changed';
    } else {
      reason = 'initial_load';
    }

    return {
      variantId: personaId,
      reason,
      confidence,
    };
  }

  /**
   * Get list of sections that would change between variants
   */
  private getChangedSections(
    sections: RuntimeSection[],
    fromVariant: string,
    toVariant: string
  ): string[] {
    if (fromVariant === toVariant) {
      return [];
    }

    const changed: string[] = [];

    for (const section of sections) {
      const fromContent = this.getSectionContent(section, fromVariant);
      const toContent = this.getSectionContent(section, toVariant);

      // Compare content - simplified comparison
      if (this.hasContentChanged(fromContent, toContent)) {
        changed.push(section.sectionId);
      }
    }

    return changed;
  }

  /**
   * Check if content has changed between two versions
   */
  private hasContentChanged(
    content1: PopulatedContent,
    content2: PopulatedContent
  ): boolean {
    // Quick check on key fields
    if (content1.headline !== content2.headline) return true;
    if (content1.subheadline !== content2.subheadline) return true;
    if (content1.description !== content2.description) return true;
    if (content1.primaryCTA?.text !== content2.primaryCTA?.text) return true;

    // Deep comparison for complex fields
    if (JSON.stringify(content1.features) !== JSON.stringify(content2.features)) {
      return true;
    }

    if (JSON.stringify(content1.bullets) !== JSON.stringify(content2.bullets)) {
      return true;
    }

    return false;
  }

  /**
   * Get current active variant
   */
  getCurrentVariant(): string {
    return this.currentVariant;
  }

  /**
   * Get current configuration
   */
  getConfig(): ContentSelectionConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<ContentSelectionConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Reset to default state
   */
  reset(): void {
    this.currentVariant = 'default';
    this.lastConfidence = 0;
  }
}

/**
 * Factory function to create content selector
 */
export function createContentSelector(
  config?: Partial<ContentSelectionConfig>
): ContentSelector {
  return new ContentSelector(config);
}

/**
 * Quick helper to select content for a single call
 */
export function selectContentVariant(
  sections: RuntimeSection[],
  personaMatch: PersonaMatch | null,
  config?: Partial<ContentSelectionConfig>
): ContentSelectionResult {
  const selector = new ContentSelector(config);
  return selector.selectContent(sections, personaMatch);
}

/**
 * Get the best available content for a section
 */
export function getBestContent(
  section: RuntimeSection,
  personaId: string | null,
  confidenceThreshold: number = 0.5
): PopulatedContent {
  if (!personaId) {
    return section.defaultContent;
  }

  const variant = section.personaVariants[personaId];
  return variant || section.defaultContent;
}
