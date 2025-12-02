/**
 * Footer Component Types
 *
 * Shared types and interfaces for all footer component variants.
 */

import type { ComponentMetadata } from '@/lib/design-system/tokens';

export interface FooterLink {
  label: string;
  href: string;
}

export interface FooterLinkGroup {
  title: string;
  links: FooterLink[];
}

export interface SocialLink {
  platform: 'twitter' | 'facebook' | 'instagram' | 'linkedin' | 'github' | 'youtube';
  href: string;
}

export interface FooterBaseProps {
  logo?: React.ReactNode;
  companyName?: string;
  description?: string;
  linkGroups?: FooterLinkGroup[];
  socialLinks?: SocialLink[];
  copyright?: string;
  bottomLinks?: FooterLink[];
  className?: string;
}

export interface FooterSimpleProps extends FooterBaseProps {
  background?: 'light' | 'dark';
}

export interface FooterMultiColumnProps extends FooterBaseProps {
  newsletter?: {
    headline: string;
    description?: string;
    placeholder?: string;
    buttonText?: string;
    onSubmit?: (email: string) => Promise<void>;
  };
  background?: 'light' | 'dark';
}

// AI Component Metadata for each footer variant
export const footerMetadata: Record<string, ComponentMetadata> = {
  'footer-simple': {
    id: 'footer-simple',
    name: 'Footer Simple',
    category: 'footer',
    variant: 'simple',
    description:
      'A clean, minimal footer with logo, navigation links, and social icons in a single row layout. Perfect for simple websites.',
    bestFor: ['Landing pages', 'Simple websites', 'Minimal design', 'Mobile-first'],
    contentRequirements: {
      required: [],
      optional: ['logo', 'linkGroups', 'socialLinks', 'copyright'],
    },
    styleTags: ['minimal', 'clean', 'compact', 'responsive'],
    conversionFocus: 'navigation',
  },
  'footer-multi-column': {
    id: 'footer-multi-column',
    name: 'Footer Multi-Column',
    category: 'footer',
    variant: 'multi-column',
    description:
      'A comprehensive footer with multiple link columns, newsletter signup, and social links. Ideal for larger websites with many pages.',
    bestFor: ['SaaS websites', 'Corporate sites', 'E-commerce', 'Content-rich sites'],
    contentRequirements: {
      required: ['linkGroups'],
      optional: ['logo', 'description', 'newsletter', 'socialLinks', 'copyright'],
    },
    styleTags: ['comprehensive', 'organized', 'professional', 'feature-rich'],
    conversionFocus: 'navigation',
  },
};

// Export all footer component IDs for the AI selection system
export const footerComponentIds = Object.keys(footerMetadata);
