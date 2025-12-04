/**
 * KB Preview Integration
 * Story 7.8: Integrated Preview Experience
 *
 * Integrates KB traceability data with the preview system,
 * enabling users to see which KB entities contributed to each section
 * and providing options to add missing content.
 */

import { useState, useEffect, useCallback } from 'react';
import type { EntityType } from '@/lib/ai/types';
import type { SectionKBInfo } from '@/components/preview/KBFeedbackPanel';
import type { KBCoverageReport } from '@/lib/knowledge/coverage-analyzer';

// =============================================================================
// TYPES
// =============================================================================

export interface KBPreviewState {
  /** KB info for each section */
  sectionKBInfo: Record<string, SectionKBInfo>;
  /** Overall KB coverage report */
  coverageReport: KBCoverageReport | null;
  /** Loading state */
  isLoading: boolean;
  /** Error message if any */
  error: string | null;
  /** AI suggestions for interactive elements */
  interactiveSuggestions: InteractiveSuggestion[];
}

export interface InteractiveSuggestion {
  type: string;
  reason: string;
  targetEntityTypes: EntityType[];
  priority: number;
  addressesGap: {
    entityType: EntityType;
    currentCount: number;
    recommendedCount: number;
  };
}

export interface KBPreviewOptions {
  workspaceId: string;
  pageId: string;
  enabled?: boolean;
  autoFetch?: boolean;
}

export interface KBAddContentResult {
  success: boolean;
  entityId?: string;
  error?: string;
}

// =============================================================================
// HOOK: useKBPreview
// =============================================================================

/**
 * Hook for KB-integrated preview experience
 */
export function useKBPreview(options: KBPreviewOptions) {
  const { workspaceId, pageId, enabled = true, autoFetch = true } = options;

  const [state, setState] = useState<KBPreviewState>({
    sectionKBInfo: {},
    coverageReport: null,
    isLoading: false,
    error: null,
    interactiveSuggestions: [],
  });

  /**
   * Fetch KB coverage data
   */
  const fetchCoverage = useCallback(async () => {
    if (!enabled || !workspaceId) return;

    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await fetch(
        `/api/workspaces/${workspaceId}/kb/coverage`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch KB coverage');
      }

      const data = await response.json();

      setState((prev) => ({
        ...prev,
        coverageReport: data.coverage,
        isLoading: false,
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }));
    }
  }, [workspaceId, enabled]);

  /**
   * Set KB info for sections
   * Called when page data loads with traceability info
   */
  const setSectionKBInfo = useCallback((info: Record<string, SectionKBInfo>) => {
    setState((prev) => ({
      ...prev,
      sectionKBInfo: info,
    }));
  }, []);

  /**
   * Add content to KB from feedback panel
   */
  const addKBContent = useCallback(async (
    entityType: EntityType,
    content: {
      name: string;
      description?: string;
      metadata?: Record<string, unknown>;
    },
    sourceContext?: {
      feedbackId?: string;
      sectionId?: string;
      userNotes?: string;
    }
  ): Promise<KBAddContentResult> => {
    try {
      const response = await fetch(
        `/api/workspaces/${workspaceId}/kb/add-from-feedback`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            entityType,
            content,
            sourceContext,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.error || 'Failed to add content' };
      }

      // Refresh coverage after adding content
      fetchCoverage();

      return { success: true, entityId: data.entity?.id };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }, [workspaceId, fetchCoverage]);

  /**
   * Regenerate section content from KB
   */
  const regenerateSection = useCallback(async (sectionId: string) => {
    try {
      const response = await fetch(
        `/api/workspaces/${workspaceId}/content/generate`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            pageId,
            sectionId,
            regenerate: true,
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to regenerate section');
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }, [workspaceId, pageId]);

  /**
   * Calculate overall coverage score from section info
   */
  const calculateOverallCoverage = useCallback((): number => {
    const sections = Object.values(state.sectionKBInfo);
    if (sections.length === 0) return 0;

    const kbGrounded = sections.filter(
      (s) => s.traceability && !s.traceability.isGenericFallback
    ).length;

    return Math.round((kbGrounded / sections.length) * 100);
  }, [state.sectionKBInfo]);

  // Auto-fetch coverage on mount
  useEffect(() => {
    if (autoFetch && enabled) {
      fetchCoverage();
    }
  }, [autoFetch, enabled, fetchCoverage]);

  return {
    ...state,
    fetchCoverage,
    setSectionKBInfo,
    addKBContent,
    regenerateSection,
    overallCoverage: calculateOverallCoverage(),
    refresh: fetchCoverage,
  };
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Extract KB info from page data with traceability
 */
export function extractSectionKBInfo(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  pageData: any
): Record<string, SectionKBInfo> {
  const result: Record<string, SectionKBInfo> = {};

  if (!pageData?.sections) return result;

  for (const section of pageData.sections) {
    const sectionId = section.sectionId || section.id;

    result[sectionId] = {
      sectionId,
      traceability: section.kbTraceability || section.traceability || {
        sourceEntityIds: [],
        confidence: 0,
        isGenericFallback: true,
        entityTypesUsed: [],
      },
      fieldSources: section.fieldSources || {},
      coverage: section.coverage,
    };
  }

  return result;
}

/**
 * Get missing entity types for a section based on its component type
 */
export function getMissingSectionEntities(
  componentId: string,
  usedEntityTypes: EntityType[]
): EntityType[] {
  // Map component types to recommended entity types
  const componentEntityMap: Record<string, EntityType[]> = {
    hero: ['company_name', 'company_tagline', 'company_description', 'cta'],
    features: ['feature', 'benefit'],
    testimonials: ['testimonial'],
    pricing: ['pricing', 'feature'],
    faq: ['faq'],
    stats: ['statistic'],
    cta: ['cta', 'benefit'],
    team: ['person'],
    contact: ['contact'],
    about: ['company_description', 'mission_statement'],
    timeline: ['process_step'],
  };

  // Find matching component type
  const componentType = Object.keys(componentEntityMap).find((key) =>
    componentId.toLowerCase().includes(key)
  );

  if (!componentType) return [];

  const recommended = componentEntityMap[componentType];
  return recommended.filter((type) => !usedEntityTypes.includes(type));
}

/**
 * Format KB coverage percentage for display
 */
export function formatCoverageScore(score: number): {
  text: string;
  color: 'red' | 'yellow' | 'green';
  label: string;
} {
  if (score >= 80) {
    return { text: `${score}%`, color: 'green', label: 'Excellent' };
  } else if (score >= 50) {
    return { text: `${score}%`, color: 'yellow', label: 'Good' };
  } else {
    return { text: `${score}%`, color: 'red', label: 'Needs Improvement' };
  }
}

/**
 * Get entity type display info
 */
export function getEntityTypeInfo(entityType: EntityType): {
  label: string;
  description: string;
  icon: string;
} {
  const info: Record<EntityType, { label: string; description: string; icon: string }> = {
    product: { label: 'Product', description: 'Products or offerings', icon: 'package' },
    service: { label: 'Service', description: 'Services provided', icon: 'wrench' },
    feature: { label: 'Feature', description: 'Product features', icon: 'star' },
    benefit: { label: 'Benefit', description: 'Customer benefits', icon: 'check-circle' },
    pricing: { label: 'Pricing', description: 'Pricing information', icon: 'tag' },
    testimonial: { label: 'Testimonial', description: 'Customer testimonials', icon: 'quote' },
    company: { label: 'Company', description: 'Company information', icon: 'building' },
    person: { label: 'Person', description: 'Team members', icon: 'user' },
    statistic: { label: 'Statistic', description: 'Key statistics', icon: 'trending-up' },
    faq: { label: 'FAQ', description: 'FAQs', icon: 'help-circle' },
    cta: { label: 'CTA', description: 'Call to action', icon: 'zap' },
    process_step: { label: 'Process Step', description: 'Process steps', icon: 'list' },
    use_case: { label: 'Use Case', description: 'Use cases', icon: 'briefcase' },
    integration: { label: 'Integration', description: 'Integrations', icon: 'link' },
    contact: { label: 'Contact', description: 'Contact info', icon: 'mail' },
    company_name: { label: 'Company Name', description: 'Company name', icon: 'building' },
    company_tagline: { label: 'Tagline', description: 'Company tagline', icon: 'message-square' },
    company_description: { label: 'Description', description: 'Company description', icon: 'file-text' },
    mission_statement: { label: 'Mission', description: 'Mission statement', icon: 'target' },
    social_link: { label: 'Social Link', description: 'Social media links', icon: 'share-2' },
    nav_category: { label: 'Nav Category', description: 'Navigation categories', icon: 'menu' },
    brand_voice: { label: 'Brand Voice', description: 'Brand voice', icon: 'mic' },
  };

  return info[entityType] || { label: entityType, description: entityType, icon: 'circle' };
}
