/**
 * Navigation Component Types
 *
 * Shared types and interfaces for all navigation component variants.
 */

import type { ComponentMetadata } from '@/lib/design-system/tokens';

export interface NavLink {
  label: string;
  href: string;
}

export interface NavDropdownItem {
  label: string;
  href: string;
  description?: string;
  icon?: React.ReactNode;
}

export interface NavDropdown {
  label: string;
  items: NavDropdownItem[];
}

export type NavItem = NavLink | NavDropdown;

export function isNavDropdown(item: NavItem): item is NavDropdown {
  return 'items' in item;
}

export interface NavButton {
  label: string;
  href: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
}

export interface NavigationBaseProps {
  logo?: React.ReactNode;
  companyName?: string;
  items?: NavItem[];
  buttons?: NavButton[];
  sticky?: boolean;
  transparent?: boolean;
  className?: string;
}

export interface NavigationSimpleProps extends NavigationBaseProps {
  centered?: boolean;
}

export interface NavigationMegaProps extends NavigationBaseProps {
  announcement?: {
    text: string;
    link?: {
      label: string;
      href: string;
    };
    dismissible?: boolean;
  };
}

// AI Component Metadata for each navigation variant
export const navigationMetadata: Record<string, ComponentMetadata> = {
  'navigation-simple': {
    id: 'navigation-simple',
    name: 'Navigation Simple',
    category: 'navigation',
    variant: 'simple',
    description:
      'A clean, straightforward navigation bar with logo, links, and CTA buttons. Perfect for most marketing websites.',
    bestFor: ['Marketing sites', 'Landing pages', 'Simple websites', 'Mobile-first'],
    contentRequirements: {
      required: [],
      optional: ['logo', 'items', 'buttons'],
    },
    styleTags: ['clean', 'simple', 'responsive', 'modern'],
    conversionFocus: 'navigation',
  },
  'navigation-mega': {
    id: 'navigation-mega',
    name: 'Navigation Mega Menu',
    category: 'navigation',
    variant: 'mega',
    description:
      'An advanced navigation with mega dropdown menus, announcement bar, and rich content support. Ideal for complex sites with many pages.',
    bestFor: ['SaaS platforms', 'Enterprise sites', 'E-commerce', 'Content-heavy sites'],
    contentRequirements: {
      required: ['items'],
      optional: ['logo', 'buttons', 'announcement'],
    },
    styleTags: ['comprehensive', 'feature-rich', 'professional', 'enterprise'],
    conversionFocus: 'navigation',
  },
};

// Export all navigation component IDs for the AI selection system
export const navigationComponentIds = Object.keys(navigationMetadata);
