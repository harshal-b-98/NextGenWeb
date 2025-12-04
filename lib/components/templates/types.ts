/**
 * Component Template Types
 *
 * Type definitions for the component template catalog system
 * Used for v0-style fast generation with pre-built components
 */

export type ComponentSource = 'shadcn' | 'tailwindui' | 'aceternity' | 'magicui' | 'custom';

export type ComponentTone = 'modern' | 'professional' | 'playful' | 'minimal' | 'bold' | 'elegant';

export type IndustryFit = 'saas' | 'ecommerce' | 'agency' | 'healthcare' | 'finance' | 'tech' | 'general';

export type SectionType =
  | 'hero'
  | 'features'
  | 'testimonials'
  | 'pricing'
  | 'cta'
  | 'faq'
  | 'team'
  | 'timeline'
  | 'stats'
  | 'contact'
  | 'footer';

/**
 * AI metadata for template selection
 */
export interface TemplateAIMetadata {
  bestFor: string;
  tone: ComponentTone[];
  industries: IndustryFit[];
  complexity: 'simple' | 'medium' | 'complex';
  features: string[];
  keywords: string[];
}

/**
 * Component template definition
 */
export interface ComponentTemplate {
  id: string;
  name: string;
  type: SectionType;
  source: ComponentSource;

  // Visual preview
  previewUrl?: string;
  previewImage?: string;

  // Template structure
  structure: {
    layout: 'single' | 'split' | 'grid' | 'carousel';
    columns?: number;
    hasImage?: boolean;
    hasIcon?: boolean;
    hasCTA?: boolean;
  };

  // Content slots
  contentSlots: {
    headline?: boolean;
    subheadline?: boolean;
    description?: boolean;
    features?: number; // How many feature items
    testimonials?: number;
    pricing?: number;
    cta?: {
      primary: boolean;
      secondary: boolean;
    };
  };

  // AI selection metadata
  aiMetadata: TemplateAIMetadata;

  // Component code/reference
  componentRef: string; // Path to actual component file

  // Default Tailwind classes
  defaultClasses?: string;
}

/**
 * Component catalog organized by section type
 */
export interface ComponentCatalog {
  heroes: ComponentTemplate[];
  features: ComponentTemplate[];
  testimonials: ComponentTemplate[];
  pricing: ComponentTemplate[];
  cta: ComponentTemplate[];
  faq: ComponentTemplate[];
  team: ComponentTemplate[];
  timeline: ComponentTemplate[];
  stats: ComponentTemplate[];
  contact: ComponentTemplate[];
  footer: ComponentTemplate[];
}

/**
 * Template selection request
 */
export interface TemplateSelectionRequest {
  sectionType: SectionType;
  kbContext: {
    industry?: string;
    tone?: string;
    hasVisuals?: boolean;
    complexity?: string;
  };
  brandConfig?: {
    primaryColor?: string;
    style?: string;
  };
}

/**
 * Template selection response
 */
export interface TemplateSelectionResponse {
  templateId: string;
  template: ComponentTemplate;
  reasoning: string;
  confidence: number;
}
