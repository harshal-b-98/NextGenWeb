/**
 * Page Assembly Module
 * Phase 3.4: Full Page Generation Pipeline
 *
 * Utilities for assembling, validating, and preparing pages for rendering.
 */

import { NarrativeRole, EmotionalTone } from '@/lib/layout/types';
import { PopulatedContent } from '@/lib/content/types';
import {
  PageContentStructure,
  PageRenderData,
  RenderSection,
  FullPageGenerationOutput,
} from './types';

// ============================================================================
// PAGE ASSEMBLY UTILITIES
// ============================================================================

/**
 * Extract render data from stored page content
 */
export function extractRenderData(
  pageContent: PageContentStructure
): PageRenderData {
  const defaultVariant: RenderSection[] = [];
  const personaVariants: Record<string, RenderSection[]> = {};

  // Get generated content sections
  const generatedSections = pageContent.generatedContent?.sections || [];
  const layoutSections = pageContent.sections || [];

  // Collect all persona IDs
  const personaIds = new Set<string>();
  for (const section of generatedSections) {
    for (const personaId of Object.keys(section.personaVariations || {})) {
      personaIds.add(personaId);
    }
  }

  // Initialize persona variants
  for (const personaId of personaIds) {
    personaVariants[personaId] = [];
  }

  // Build render sections
  for (const contentSection of generatedSections) {
    const layoutSection = layoutSections.find(
      (ls) => ls.id === contentSection.sectionId
    );

    const renderSection: RenderSection = {
      sectionId: contentSection.sectionId,
      componentId: contentSection.componentId,
      narrativeRole: contentSection.narrativeRole,
      order: contentSection.order,
      emotionalTone: getEmotionalToneForRole(contentSection.narrativeRole),
      content: contentSection.content,
      animations: layoutSection?.animations,
      confidenceScore: contentSection.metadata.confidenceScore,
    };

    defaultVariant.push(renderSection);

    // Build persona variants
    for (const personaId of personaIds) {
      const personaContent = contentSection.personaVariations[personaId];
      if (personaContent) {
        personaVariants[personaId].push({
          ...renderSection,
          content: personaContent.content,
          emotionalTone: personaContent.emotionalTone,
        });
      } else {
        personaVariants[personaId].push(renderSection);
      }
    }
  }

  // Sort by order
  defaultVariant.sort((a, b) => a.order - b.order);
  for (const personaId of personaIds) {
    personaVariants[personaId].sort((a, b) => a.order - b.order);
  }

  return {
    defaultVariant,
    personaVariants,
    metadata: {
      title: pageContent.generatedContent?.pageMetadata?.title ||
        pageContent.metadata?.title ||
        'Untitled Page',
      description: pageContent.generatedContent?.pageMetadata?.description ||
        pageContent.metadata?.description ||
        '',
      keywords: pageContent.generatedContent?.pageMetadata?.keywords ||
        pageContent.metadata?.keywords ||
        [],
      ogImage: pageContent.generatedContent?.pageMetadata?.ogImage,
    },
  };
}

/**
 * Get render data for a specific persona
 */
export function getRenderDataForPersona(
  renderData: PageRenderData,
  personaId?: string
): RenderSection[] {
  if (personaId && renderData.personaVariants[personaId]) {
    return renderData.personaVariants[personaId];
  }
  return renderData.defaultVariant;
}

/**
 * Get emotional tone for a narrative role
 */
export function getEmotionalToneForRole(role: NarrativeRole): EmotionalTone {
  const mapping: Record<NarrativeRole, EmotionalTone> = {
    hook: 'curiosity',
    problem: 'empathy',
    solution: 'hope',
    proof: 'confidence',
    action: 'excitement',
  };
  return mapping[role] || 'confidence';
}

// ============================================================================
// VALIDATION
// ============================================================================

/**
 * Validation result
 */
export interface PageValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  score: number;
}

/**
 * Validate page content structure
 */
export function validatePageContent(
  content: PageContentStructure
): PageValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check for required sections
  if (!content.sections || content.sections.length === 0) {
    if (!content.generatedContent?.sections || content.generatedContent.sections.length === 0) {
      errors.push('Page has no sections');
    }
  }

  // Check for metadata
  if (!content.metadata && !content.generatedContent?.pageMetadata) {
    warnings.push('Page has no metadata');
  }

  // Check for required narrative stages
  const narrativeRoles = new Set<NarrativeRole>();
  const sections = content.generatedContent?.sections || [];

  for (const section of sections) {
    narrativeRoles.add(section.narrativeRole);
  }

  if (!narrativeRoles.has('hook')) {
    warnings.push('Page missing "hook" section');
  }
  if (!narrativeRoles.has('action')) {
    warnings.push('Page missing "action" (CTA) section');
  }

  // Check content quality
  for (const section of sections) {
    if (!section.content.headline && !section.content.sectionTitle) {
      warnings.push(`Section ${section.sectionId} missing headline`);
    }
    if (section.metadata.confidenceScore < 0.5) {
      warnings.push(
        `Section ${section.sectionId} has low confidence (${section.metadata.confidenceScore})`
      );
    }
  }

  // Calculate score
  const totalChecks = 5 + sections.length * 2;
  const passedChecks = totalChecks - errors.length - warnings.length * 0.5;
  const score = Math.max(0, Math.min(1, passedChecks / totalChecks));

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    score,
  };
}

/**
 * Validate render data
 */
export function validateRenderData(renderData: PageRenderData): PageValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (renderData.defaultVariant.length === 0) {
    errors.push('No sections to render');
  }

  // Check for minimum sections
  if (renderData.defaultVariant.length < 2) {
    warnings.push('Page has very few sections');
  }

  // Check for duplicate orders
  const orders = renderData.defaultVariant.map((s) => s.order);
  const uniqueOrders = new Set(orders);
  if (orders.length !== uniqueOrders.size) {
    warnings.push('Some sections have duplicate order values');
  }

  // Check metadata
  if (!renderData.metadata.title) {
    errors.push('Page missing title');
  }
  if (!renderData.metadata.description) {
    warnings.push('Page missing meta description');
  }

  const totalChecks = 4;
  const passedChecks = totalChecks - errors.length - warnings.length * 0.5;
  const score = Math.max(0, Math.min(1, passedChecks / totalChecks));

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    score,
  };
}

// ============================================================================
// SERIALIZATION
// ============================================================================

/**
 * Serialize page output for API response
 */
export function serializePageOutput(
  output: FullPageGenerationOutput,
  includeFullData: boolean = false
): Record<string, unknown> {
  const base = {
    pageId: output.pageId,
    slug: output.slug,
    stats: output.stats,
    metadata: output.renderData.metadata,
    status: {
      layout: {
        status: output.layout.status,
        sectionsCount: output.layout.metrics.sectionsCount,
        confidenceScore: output.layout.metrics.confidenceScore,
        timeMs: output.layout.metrics.timeMs,
      },
      storyline: {
        status: output.storyline.status,
        contentBlocksCount: output.storyline.metrics.contentBlocksCount,
        personaVariationsCount: output.storyline.metrics.personaVariationsCount,
        timeMs: output.storyline.metrics.timeMs,
      },
      content: {
        status: output.content.status,
        sectionsPopulated: output.content.metrics.sectionsPopulated,
        averageConfidence: output.content.metrics.averageConfidence,
        timeMs: output.content.metrics.timeMs,
      },
    },
  };

  if (includeFullData) {
    return {
      ...base,
      layout: output.layout.layout,
      storyline: output.storyline.storyline,
      sections: output.content.sections,
      renderData: output.renderData,
    };
  }

  return base;
}

/**
 * Prepare page for preview
 */
export function preparePagePreview(
  renderData: PageRenderData,
  personaId?: string
): {
  sections: RenderSection[];
  metadata: PageRenderData['metadata'];
  isPersonalized: boolean;
} {
  const sections = getRenderDataForPersona(renderData, personaId);

  return {
    sections,
    metadata: renderData.metadata,
    isPersonalized: !!personaId && !!renderData.personaVariants[personaId],
  };
}

// ============================================================================
// DIFF & MERGE UTILITIES
// ============================================================================

/**
 * Compare two page versions
 */
export function comparePageVersions(
  oldContent: PageContentStructure,
  newContent: PageContentStructure
): {
  sectionsAdded: string[];
  sectionsRemoved: string[];
  sectionsModified: string[];
  metadataChanged: boolean;
} {
  const oldSectionIds = new Set(
    (oldContent.generatedContent?.sections || []).map((s) => s.sectionId)
  );
  const newSectionIds = new Set(
    (newContent.generatedContent?.sections || []).map((s) => s.sectionId)
  );

  const sectionsAdded: string[] = [];
  const sectionsRemoved: string[] = [];
  const sectionsModified: string[] = [];

  // Find added sections
  for (const id of newSectionIds) {
    if (!oldSectionIds.has(id)) {
      sectionsAdded.push(id);
    }
  }

  // Find removed sections
  for (const id of oldSectionIds) {
    if (!newSectionIds.has(id)) {
      sectionsRemoved.push(id);
    }
  }

  // Find modified sections (simple headline comparison)
  const oldSections = oldContent.generatedContent?.sections || [];
  const newSections = newContent.generatedContent?.sections || [];

  for (const newSection of newSections) {
    if (oldSectionIds.has(newSection.sectionId)) {
      const oldSection = oldSections.find(
        (s) => s.sectionId === newSection.sectionId
      );
      if (
        oldSection &&
        (oldSection.content.headline !== newSection.content.headline ||
          oldSection.componentId !== newSection.componentId)
      ) {
        sectionsModified.push(newSection.sectionId);
      }
    }
  }

  // Check metadata changes
  const metadataChanged =
    oldContent.generatedContent?.pageMetadata?.title !==
      newContent.generatedContent?.pageMetadata?.title ||
    oldContent.generatedContent?.pageMetadata?.description !==
      newContent.generatedContent?.pageMetadata?.description;

  return {
    sectionsAdded,
    sectionsRemoved,
    sectionsModified,
    metadataChanged,
  };
}

/**
 * Merge user edits with generated content
 */
export function mergeContentEdits(
  generated: PopulatedContent,
  userEdits: Partial<PopulatedContent>
): PopulatedContent {
  return {
    ...generated,
    ...userEdits,
    // Preserve arrays by merging if both exist
    features: userEdits.features ?? generated.features,
    testimonials: userEdits.testimonials ?? generated.testimonials,
    statistics: userEdits.statistics ?? generated.statistics,
    bullets: userEdits.bullets ?? generated.bullets,
    faqs: userEdits.faqs ?? generated.faqs,
    pricingTiers: userEdits.pricingTiers ?? generated.pricingTiers,
    processSteps: userEdits.processSteps ?? generated.processSteps,
    logos: userEdits.logos ?? generated.logos,
  };
}
