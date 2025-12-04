/**
 * Component Template Catalog
 *
 * Central catalog of all available component templates
 * from shadcn/ui, Tailwind UI, and other sources
 *
 * Used by AI agents to select appropriate components for generation
 */

import type { ComponentCatalog, ComponentTemplate, SectionType } from './types';
import { SHADCN_HERO_TEMPLATES } from './shadcn-heroes';
import {
  TAILWIND_FEATURE_TEMPLATES,
  TAILWIND_TESTIMONIAL_TEMPLATES,
  TAILWIND_PRICING_TEMPLATES,
  TAILWIND_CTA_TEMPLATES,
  TAILWIND_FAQ_TEMPLATES,
} from './tailwind-sections';

/**
 * Complete component catalog
 */
export const COMPONENT_CATALOG: ComponentCatalog = {
  heroes: [...SHADCN_HERO_TEMPLATES],
  features: [...TAILWIND_FEATURE_TEMPLATES],
  testimonials: [...TAILWIND_TESTIMONIAL_TEMPLATES],
  pricing: [...TAILWIND_PRICING_TEMPLATES],
  cta: [...TAILWIND_CTA_TEMPLATES],
  faq: [...TAILWIND_FAQ_TEMPLATES],
  team: [], // TODO: Add team section templates
  timeline: [], // TODO: Add timeline templates
  stats: [], // TODO: Add stats section templates
  contact: [], // TODO: Add contact form templates
  footer: [], // TODO: Add footer templates
};

/**
 * Get all templates for a specific section type
 */
export function getTemplatesByType(type: SectionType): ComponentTemplate[] {
  return (COMPONENT_CATALOG as any)[type] || [];
}

/**
 * Get a specific template by ID
 */
export function getTemplateById(id: string): ComponentTemplate | null {
  for (const templates of Object.values(COMPONENT_CATALOG)) {
    const template = templates.find((t: ComponentTemplate) => t.id === id);
    if (template) return template;
  }
  return null;
}

/**
 * Search templates by keywords
 */
export function searchTemplates(keywords: string[]): ComponentTemplate[] {
  const allTemplates = Object.values(COMPONENT_CATALOG).flat();

  return allTemplates.filter((template: ComponentTemplate) => {
    const templateKeywords = template.aiMetadata.keywords;
    return keywords.some((keyword) =>
      templateKeywords.some((tk) => tk.toLowerCase().includes(keyword.toLowerCase()))
    );
  });
}

/**
 * Get templates matching criteria
 */
export function filterTemplates(criteria: {
  type?: SectionType;
  tone?: string;
  industry?: string;
  complexity?: 'simple' | 'medium' | 'complex';
}): ComponentTemplate[] {
  let templates: ComponentTemplate[] = Object.values(COMPONENT_CATALOG).flat();

  if (criteria.type) {
    templates = templates.filter((t: ComponentTemplate) => t.type === criteria.type);
  }

  if (criteria.tone) {
    templates = templates.filter((t: ComponentTemplate) =>
      t.aiMetadata.tone.includes(criteria.tone as any)
    );
  }

  if (criteria.industry) {
    templates = templates.filter((t: ComponentTemplate) =>
      t.aiMetadata.industries.includes(criteria.industry as any)
    );
  }

  if (criteria.complexity) {
    templates = templates.filter((t: ComponentTemplate) => t.aiMetadata.complexity === criteria.complexity);
  }

  return templates;
}

/**
 * Get template statistics
 */
export function getCatalogStats() {
  return {
    totalTemplates: Object.values(COMPONENT_CATALOG).flat().length,
    byType: Object.entries(COMPONENT_CATALOG).map(([type, templates]) => ({
      type,
      count: templates.length,
    })),
    bySource: Object.values(COMPONENT_CATALOG)
      .flat()
      .reduce((acc, t) => {
        acc[t.source] = (acc[t.source] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
  };
}
