/**
 * Global Components Generation Prompts
 *
 * AI prompts for generating website headers, footers, and navigation structures.
 *
 * Story #126: AI-Powered Header/Footer Content Generation
 * Task #135: Create AI prompt for navigation structure generation
 * Task #136: Create AI prompt for footer content generation
 * Task #137: Implement navigation style decision logic
 */

import type { HeaderContent, FooterContent } from '@/lib/layout/global-components';

/**
 * Navigation style options
 */
export type NavigationStyle = 'simple' | 'mega-menu';

/**
 * System prompt for global components generation
 */
export const GLOBAL_COMPONENTS_SYSTEM_PROMPT = `You are an expert web designer specializing in website navigation and layout structure.
Your task is to generate appropriate header and footer configurations based on website content and brand.
Always respond with valid JSON matching the specified schema.`;

/**
 * Navigation style decision criteria
 */
export interface NavigationDecisionContext {
  pageCount: number;
  pageTypes: string[];
  hasCategories: boolean;
  categoryCount: number;
  industry?: string;
  businessType?: string;
  contentTopics?: string[];
}

/**
 * Determine the appropriate navigation style based on site characteristics
 *
 * Rules:
 * - <= 5 pages, no categories → simple header
 * - > 5 pages OR has categories → mega menu
 * - E-commerce/SaaS → mega menu with categories
 * - Default: simple header
 */
export function determineNavigationStyle(context: NavigationDecisionContext): {
  style: NavigationStyle;
  componentId: string;
  reasoning: string;
} {
  const { pageCount, hasCategories, categoryCount, industry, businessType } = context;

  // E-commerce or SaaS typically need mega menus
  const needsMegaMenu =
    industry?.toLowerCase().includes('ecommerce') ||
    industry?.toLowerCase().includes('e-commerce') ||
    industry?.toLowerCase().includes('saas') ||
    businessType?.toLowerCase().includes('marketplace') ||
    businessType?.toLowerCase().includes('platform');

  if (needsMegaMenu) {
    return {
      style: 'mega-menu',
      componentId: 'nav-mega-menu',
      reasoning: `Industry/business type (${industry || businessType}) typically requires mega menu for product categories and features`,
    };
  }

  // Many pages or distinct categories
  if (pageCount > 5 || (hasCategories && categoryCount > 2)) {
    return {
      style: 'mega-menu',
      componentId: 'nav-mega-menu',
      reasoning: `Site has ${pageCount} pages and ${categoryCount} categories, mega menu provides better organization`,
    };
  }

  // Default to simple navigation
  return {
    style: 'simple',
    componentId: 'nav-header',
    reasoning: `Site has ${pageCount} pages with simple structure, standard navigation is appropriate`,
  };
}

/**
 * Build prompt for navigation structure generation
 */
export function buildNavigationGenerationPrompt(params: {
  websiteName: string;
  pages: Array<{ title: string; slug: string; type?: string; isHomepage?: boolean }>;
  brandVoice?: {
    tone: string;
    formality?: string;
  };
  industry?: string;
  knowledgeSummary?: string;
  existingCategories?: string[];
}): string {
  const { websiteName, pages, brandVoice, industry, knowledgeSummary, existingCategories } = params;

  const pageList = pages
    .map((p) => `- ${p.title} (${p.slug})${p.isHomepage ? ' [Homepage]' : ''}${p.type ? ` [${p.type}]` : ''}`)
    .join('\n');

  return `Generate a navigation structure for "${websiteName}".

## Website Pages
${pageList}

## Brand Context
${brandVoice ? `- Tone: ${brandVoice.tone}` : '- Tone: Professional'}
${brandVoice?.formality ? `- Formality: ${brandVoice.formality}` : ''}
${industry ? `- Industry: ${industry}` : ''}

${knowledgeSummary ? `## Business Context\n${knowledgeSummary}` : ''}

${existingCategories?.length ? `## Content Categories\n${existingCategories.join(', ')}` : ''}

## Instructions
1. Create logical navigation groupings
2. Prioritize important pages in the main navigation
3. Consider user journey and common navigation patterns
4. Limit primary navigation to 5-7 items maximum
5. For mega menus, group related pages under descriptive categories

## Output Format
Return a JSON object:
{
  "navItems": [
    {
      "label": "Navigation label",
      "href": "/page-slug",
      "children": [
        {
          "label": "Child item",
          "href": "/child-slug",
          "description": "Optional description for mega menu"
        }
      ]
    }
  ],
  "ctaButton": {
    "label": "CTA text",
    "href": "/target-page",
    "variant": "primary"
  },
  "reasoning": "Brief explanation of navigation choices"
}`;
}

/**
 * Build prompt for footer content generation
 */
export function buildFooterGenerationPrompt(params: {
  websiteName: string;
  pages: Array<{ title: string; slug: string; type?: string }>;
  brandVoice?: {
    tone: string;
    formality?: string;
  };
  industry?: string;
  companyDescription?: string;
  knowledgeSummary?: string;
  socialLinks?: Array<{ platform: string; url: string }>;
}): string {
  const { websiteName, pages, brandVoice, industry, companyDescription, knowledgeSummary, socialLinks } =
    params;

  const pageList = pages.map((p) => `- ${p.title} (${p.slug})`).join('\n');

  return `Generate footer content for "${websiteName}".

## Website Pages
${pageList}

## Brand Context
${brandVoice ? `- Tone: ${brandVoice.tone}` : '- Tone: Professional'}
${brandVoice?.formality ? `- Formality: ${brandVoice.formality}` : ''}
${industry ? `- Industry: ${industry}` : ''}

${companyDescription ? `## Company Description\n${companyDescription}` : ''}

${knowledgeSummary ? `## Business Context\n${knowledgeSummary}` : ''}

${socialLinks?.length ? `## Social Media\n${socialLinks.map((s) => `- ${s.platform}: ${s.url}`).join('\n')}` : ''}

## Instructions
1. Organize pages into logical footer columns (Company, Resources, Legal, etc.)
2. Add appropriate legal links (Privacy Policy, Terms of Service)
3. Write a brief company description/tagline
4. Suggest copyright text
5. Choose appropriate background style (light, dark, or brand)

## Output Format
Return a JSON object:
{
  "description": "Brief company tagline or description",
  "columns": [
    {
      "title": "Column title",
      "links": [
        { "label": "Link text", "href": "/slug" }
      ]
    }
  ],
  "bottomLinks": [
    { "label": "Privacy Policy", "href": "/privacy" },
    { "label": "Terms of Service", "href": "/terms" }
  ],
  "copyright": "© ${new Date().getFullYear()} ${websiteName}. All rights reserved.",
  "background": "dark",
  "reasoning": "Brief explanation of footer structure"
}`;
}

/**
 * Build combined prompt for both header and footer generation
 */
export function buildGlobalComponentsPrompt(params: {
  websiteName: string;
  pages: Array<{ title: string; slug: string; type?: string; isHomepage?: boolean }>;
  brandVoice?: {
    tone: string;
    formality?: string;
    personality?: string[];
  };
  industry?: string;
  companyDescription?: string;
  knowledgeSummary?: string;
  socialLinks?: Array<{ platform: string; url: string }>;
  navStyle: NavigationStyle;
}): string {
  const {
    websiteName,
    pages,
    brandVoice,
    industry,
    companyDescription,
    knowledgeSummary,
    socialLinks,
    navStyle,
  } = params;

  const pageList = pages
    .map((p) => `- ${p.title} (${p.slug})${p.isHomepage ? ' [Homepage]' : ''}`)
    .join('\n');

  return `Generate header and footer content for "${websiteName}".

## Navigation Style
${navStyle === 'mega-menu' ? 'Mega Menu (grouped navigation with dropdowns)' : 'Simple Header (single row navigation)'}

## Website Pages
${pageList}

## Brand Context
- Tone: ${brandVoice?.tone || 'Professional'}
${brandVoice?.formality ? `- Formality: ${brandVoice.formality}` : ''}
${brandVoice?.personality?.length ? `- Personality: ${brandVoice.personality.join(', ')}` : ''}
${industry ? `- Industry: ${industry}` : ''}

${companyDescription ? `## Company Description\n${companyDescription}` : ''}

${knowledgeSummary ? `## Business Context\n${knowledgeSummary}` : ''}

${socialLinks?.length ? `## Social Media\n${socialLinks.map((s) => `- ${s.platform}: ${s.url}`).join('\n')}` : ''}

## Instructions
Generate both header navigation and footer content:

### Header
1. Create intuitive navigation structure
2. Limit to 5-7 primary items
3. Include a clear CTA button
${navStyle === 'mega-menu' ? '4. Group related pages into dropdown categories with descriptions' : ''}

### Footer
1. Organize pages into 2-4 logical columns
2. Include legal links
3. Add company description
4. Set copyright text

## Output Format
Return JSON:
{
  "header": {
    "navItems": [
      {
        "label": "Nav label",
        "href": "/slug",
        "children": ${navStyle === 'mega-menu' ? '[{ "label": "Child", "href": "/child", "description": "Description" }]' : 'null'}
      }
    ],
    "ctaButton": {
      "label": "CTA text",
      "href": "/contact",
      "variant": "primary"
    }
  },
  "footer": {
    "description": "Company tagline",
    "columns": [
      {
        "title": "Column Title",
        "links": [{ "label": "Link", "href": "/slug" }]
      }
    ],
    "bottomLinks": [
      { "label": "Privacy Policy", "href": "/privacy" }
    ],
    "copyright": "© ${new Date().getFullYear()} ${websiteName}. All rights reserved.",
    "background": "dark"
  }
}`;
}

/**
 * Parse and validate header content from AI response
 */
export function parseHeaderContent(
  response: Record<string, unknown>,
  websiteName: string
): HeaderContent {
  const header = response.header as Record<string, unknown> | undefined;

  // Extract nav items
  const navItems = (header?.navItems || response.navItems || []) as Array<{
    label: string;
    href: string;
    children?: Array<{
      label: string;
      href: string;
      description?: string;
    }>;
  }>;

  // Extract CTA
  const ctaButton = (header?.ctaButton || response.ctaButton) as
    | {
        label: string;
        href: string;
        variant?: 'primary' | 'secondary' | 'outline';
      }
    | undefined;

  return {
    companyName: websiteName,
    navItems: navItems.map((item) => ({
      label: item.label,
      href: item.href,
      children: item.children?.map((child) => ({
        label: child.label,
        href: child.href,
        description: child.description,
      })),
    })),
    ctaButton: ctaButton
      ? {
          label: ctaButton.label,
          href: ctaButton.href,
          variant: ctaButton.variant || 'primary',
        }
      : undefined,
    sticky: true,
  };
}

/**
 * Parse and validate footer content from AI response
 */
export function parseFooterContent(
  response: Record<string, unknown>,
  websiteName: string
): FooterContent {
  const footer = response.footer as Record<string, unknown> | undefined;

  // Extract columns
  const columns = (footer?.columns || response.columns || []) as Array<{
    title: string;
    links: Array<{ label: string; href: string }>;
  }>;

  // Extract bottom links
  const bottomLinks = (footer?.bottomLinks || response.bottomLinks || []) as Array<{
    label: string;
    href: string;
  }>;

  // Extract description
  const description = (footer?.description || response.description || '') as string;

  // Extract copyright
  const copyright = (footer?.copyright ||
    response.copyright ||
    `© ${new Date().getFullYear()} ${websiteName}. All rights reserved.`) as string;

  // Extract background
  const background = (footer?.background || response.background || 'dark') as
    | 'light'
    | 'dark'
    | 'brand';

  return {
    companyName: websiteName,
    description,
    columns: columns.map((col) => ({
      title: col.title,
      links: col.links.map((link) => ({
        label: link.label,
        href: link.href,
      })),
    })),
    bottomLinks: bottomLinks.map((link) => ({
      label: link.label,
      href: link.href,
    })),
    copyright,
    background,
  };
}

/**
 * Generate default header content when AI generation fails
 */
export function generateDefaultHeader(
  websiteName: string,
  pages: Array<{ title: string; slug: string; isHomepage?: boolean }>
): HeaderContent {
  // Filter out homepage and limit to 5 nav items
  const navPages = pages
    .filter((p) => !p.isHomepage)
    .slice(0, 5);

  return {
    companyName: websiteName,
    navItems: navPages.map((page) => ({
      label: page.title,
      href: page.slug.startsWith('/') ? page.slug : `/${page.slug}`,
    })),
    ctaButton: {
      label: 'Get Started',
      href: '/contact',
      variant: 'primary',
    },
    sticky: true,
  };
}

/**
 * Generate default footer content when AI generation fails
 */
export function generateDefaultFooter(
  websiteName: string,
  pages: Array<{ title: string; slug: string }>
): FooterContent {
  // Split pages into columns
  const midpoint = Math.ceil(pages.length / 2);
  const column1Pages = pages.slice(0, midpoint);
  const column2Pages = pages.slice(midpoint);

  return {
    companyName: websiteName,
    description: `${websiteName} - Your trusted partner.`,
    columns: [
      {
        title: 'Pages',
        links: column1Pages.map((p) => ({
          label: p.title,
          href: p.slug.startsWith('/') ? p.slug : `/${p.slug}`,
        })),
      },
      ...(column2Pages.length > 0
        ? [
            {
              title: 'More',
              links: column2Pages.map((p) => ({
                label: p.title,
                href: p.slug.startsWith('/') ? p.slug : `/${p.slug}`,
              })),
            },
          ]
        : []),
      {
        title: 'Legal',
        links: [
          { label: 'Privacy Policy', href: '/privacy' },
          { label: 'Terms of Service', href: '/terms' },
        ],
      },
    ],
    bottomLinks: [
      { label: 'Privacy Policy', href: '/privacy' },
      { label: 'Terms of Service', href: '/terms' },
    ],
    copyright: `© ${new Date().getFullYear()} ${websiteName}. All rights reserved.`,
    background: 'dark',
  };
}
