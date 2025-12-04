/**
 * KB-Grounded Global Components Generator
 *
 * Story 7.3: KB-Grounded Global Components
 *
 * Generates headers, footers, and navigation using KB entity data.
 * This ensures all global component content comes from the knowledge base
 * rather than generic placeholders.
 */

import { completeJSON } from '@/lib/ai/client';
import {
  getKBGlobalComponentData,
  getSourceEntityIds,
  type KBGlobalComponentData,
} from '@/lib/knowledge/kb-queries';
import {
  saveGlobalComponents,
  type GlobalComponentInput,
  type HeaderContent,
  type FooterContent,
} from './global-components';
import {
  determineNavigationStyle,
  type NavigationDecisionContext,
} from '@/lib/ai/prompts/global-components';
import type { NavigationVariant, FooterVariant, PageType } from './types';

// =============================================================================
// TYPES
// =============================================================================

/**
 * Input for KB-grounded global component generation
 */
export interface KBGroundedGenerationInput {
  websiteId: string;
  workspaceId: string;
  websiteName: string;
  pages: Array<{
    title: string;
    slug: string;
    type?: PageType | string;
    isHomepage?: boolean;
  }>;
  /** Optional override - if not provided, will be fetched from KB */
  logoUrl?: string;
}

/**
 * Result of KB-grounded global component generation
 */
export interface KBGroundedGenerationResult {
  success: boolean;
  header?: HeaderContent;
  footer?: FooterContent;
  navStyle: 'simple' | 'mega-menu';
  kbData: KBGlobalComponentData;
  sourceEntityIds: string[];
  coverage: {
    headerGrounded: boolean;
    footerGrounded: boolean;
    score: number;
  };
  error?: string;
}

// =============================================================================
// SYSTEM PROMPT
// =============================================================================

const KB_GROUNDED_GLOBAL_COMPONENTS_SYSTEM_PROMPT = `You are an expert web designer specializing in website navigation and layout structure.
Your task is to generate header and footer configurations based STRICTLY on the provided knowledge base data.

CRITICAL RULES:
1. ONLY use information that is explicitly provided in the KB data
2. Do NOT invent or assume any company information
3. If information is missing, indicate it in the isGenericFallback fields
4. Use exact values from KB (company name, tagline, social links, etc.)
5. Navigation categories should match KB nav_category entities if available

Always respond with valid JSON matching the specified schema.`;

// =============================================================================
// MAIN GENERATION FUNCTION
// =============================================================================

/**
 * Generate global components (header/footer) using KB entity data
 *
 * This function fetches relevant entities from the knowledge base and uses
 * them to populate header and footer content, ensuring all content is
 * grounded in the uploaded documents.
 */
export async function generateKBGroundedGlobalComponents(
  input: KBGroundedGenerationInput
): Promise<KBGroundedGenerationResult> {
  const { websiteId, workspaceId, websiteName, pages, logoUrl } = input;

  // 1. Fetch KB data for global components
  console.log('[KB-Grounded] Fetching KB data for workspace:', workspaceId);
  const kbData = await getKBGlobalComponentData(workspaceId);
  const sourceEntityIds = getSourceEntityIds(kbData);

  console.log('[KB-Grounded] KB coverage:', kbData.coverage);

  // 2. Determine navigation style based on KB nav_categories and page count
  const navDecisionContext: NavigationDecisionContext = {
    pageCount: pages.length,
    pageTypes: pages.map((p) => p.type || 'custom'),
    hasCategories: kbData.navCategories.length > 0,
    categoryCount: kbData.navCategories.length,
    industry: kbData.companyInfo?.industry,
    businessType: undefined,
    contentTopics: kbData.navCategories.map((n) => n.category),
  };

  const navDecision = determineNavigationStyle(navDecisionContext);
  console.log('[KB-Grounded] Nav style decision:', navDecision);

  // 3. Build header and footer using KB data
  let headerContent: HeaderContent;
  let footerContent: FooterContent;
  let headerGrounded = false;
  let footerGrounded = false;

  // Determine if we have enough KB data for grounded generation
  const hasMinimalKBData =
    kbData.coverage.hasCompanyName || kbData.coverage.hasDescription;

  if (hasMinimalKBData) {
    try {
      // Use LLM to generate content based on KB data
      const llmResult = await generateWithLLM(input, kbData, navDecision.style);
      headerContent = llmResult.header;
      footerContent = llmResult.footer;
      headerGrounded = true;
      footerGrounded = true;
    } catch (error) {
      console.warn('[KB-Grounded] LLM generation failed, using KB fallback:', error);
      headerContent = buildHeaderFromKB(input, kbData);
      footerContent = buildFooterFromKB(input, kbData);
      headerGrounded = kbData.coverage.hasCompanyName;
      footerGrounded = kbData.coverage.hasDescription;
    }
  } else {
    // Use direct KB data without LLM
    console.log('[KB-Grounded] Insufficient KB data, using direct KB values');
    headerContent = buildHeaderFromKB(input, kbData);
    footerContent = buildFooterFromKB(input, kbData);
    headerGrounded = kbData.coverage.hasCompanyName;
    footerGrounded = kbData.coverage.hasDescription;
  }

  // Apply logo URL override if provided
  if (logoUrl) {
    headerContent.logo = {
      url: logoUrl,
      alt: headerContent.companyName || websiteName,
    };
    footerContent.logo = {
      url: logoUrl,
      alt: footerContent.companyName || websiteName,
    };
  }

  // 4. Save to database
  const componentsToSave: GlobalComponentInput[] = [
    {
      type: 'header',
      componentId: navDecision.componentId as NavigationVariant,
      content: headerContent,
      visibility: { showOn: 'all' },
      isActive: true,
      sortOrder: 0,
    },
    {
      type: 'footer',
      componentId: 'footer-standard' as FooterVariant,
      content: footerContent,
      visibility: { showOn: 'all' },
      isActive: true,
      sortOrder: 1,
    },
  ];

  const saveResult = await saveGlobalComponents(websiteId, componentsToSave);

  if (!saveResult.success) {
    console.error('[KB-Grounded] Failed to save components:', saveResult.error);
    return {
      success: false,
      error: saveResult.error,
      kbData,
      sourceEntityIds,
      navStyle: navDecision.style,
      coverage: {
        headerGrounded,
        footerGrounded,
        score: kbData.coverage.overallScore,
      },
    };
  }

  return {
    success: true,
    header: headerContent,
    footer: footerContent,
    navStyle: navDecision.style,
    kbData,
    sourceEntityIds,
    coverage: {
      headerGrounded,
      footerGrounded,
      score: kbData.coverage.overallScore,
    },
  };
}

// =============================================================================
// LLM GENERATION
// =============================================================================

/**
 * Generate header and footer using LLM with KB data as input
 */
async function generateWithLLM(
  input: KBGroundedGenerationInput,
  kbData: KBGlobalComponentData,
  navStyle: 'simple' | 'mega-menu'
): Promise<{ header: HeaderContent; footer: FooterContent }> {
  const { websiteName, pages } = input;

  const prompt = buildKBGroundedPrompt(websiteName, pages, kbData, navStyle);

  const result = await completeJSON<{
    header: {
      navItems: Array<{
        label: string;
        href: string;
        children?: Array<{
          label: string;
          href: string;
          description?: string;
        }>;
      }>;
      ctaButton?: {
        label: string;
        href: string;
        variant: 'primary' | 'secondary' | 'outline';
      };
    };
    footer: {
      description: string;
      columns: Array<{
        title: string;
        links: Array<{ label: string; href: string }>;
      }>;
      bottomLinks: Array<{ label: string; href: string }>;
      copyright: string;
      background: 'light' | 'dark' | 'brand';
    };
  }>({
    messages: [
      { role: 'system', content: KB_GROUNDED_GLOBAL_COMPONENTS_SYSTEM_PROMPT },
      { role: 'user', content: prompt },
    ],
    config: {
      temperature: 0.3, // Lower temperature for more consistent output
    },
  });

  const llmData = result.data;

  // Build header content
  const headerContent: HeaderContent = {
    companyName: kbData.companyInfo?.name || kbData.companyInfo?.shortName || websiteName,
    navItems: llmData.header.navItems.map((item) => ({
      label: item.label,
      href: item.href,
      children: item.children?.map((child) => ({
        label: child.label,
        href: child.href,
        description: child.description,
      })),
    })),
    ctaButton: llmData.header.ctaButton
      ? {
          label: llmData.header.ctaButton.label,
          href: llmData.header.ctaButton.href,
          variant: llmData.header.ctaButton.variant,
        }
      : undefined,
    sticky: true,
  };

  // Build footer content
  const footerContent: FooterContent = {
    companyName: kbData.companyInfo?.name || websiteName,
    description: llmData.footer.description,
    columns: llmData.footer.columns,
    socialLinks: mapSocialLinksToFooter(kbData.socialLinks),
    bottomLinks: llmData.footer.bottomLinks,
    copyright: llmData.footer.copyright,
    background: llmData.footer.background,
  };

  return { header: headerContent, footer: footerContent };
}

/**
 * Build prompt for KB-grounded generation
 */
function buildKBGroundedPrompt(
  websiteName: string,
  pages: Array<{ title: string; slug: string; isHomepage?: boolean }>,
  kbData: KBGlobalComponentData,
  navStyle: 'simple' | 'mega-menu'
): string {
  const pageList = pages
    .map((p) => `- ${p.title} (${p.slug})${p.isHomepage ? ' [Homepage]' : ''}`)
    .join('\n');

  const companyInfo = kbData.companyInfo;
  const navCategories = kbData.navCategories;

  return `Generate header and footer content for "${websiteName}" using ONLY the provided KB data.

## Navigation Style
${navStyle === 'mega-menu' ? 'Mega Menu (grouped navigation with dropdowns)' : 'Simple Header (single row navigation)'}

## Website Pages
${pageList}

## KB COMPANY INFORMATION (USE THESE EXACT VALUES)
${companyInfo?.name ? `- Company Name: ${companyInfo.name}` : '- Company Name: NOT IN KB (use website name)'}
${companyInfo?.tagline ? `- Tagline: ${companyInfo.tagline}` : '- Tagline: NOT IN KB'}
${companyInfo?.description ? `- Description: ${companyInfo.description}` : '- Description: NOT IN KB'}
${companyInfo?.industry ? `- Industry: ${companyInfo.industry}` : ''}
${companyInfo?.missionText ? `- Mission: ${companyInfo.missionText}` : ''}

## KB NAVIGATION CATEGORIES
${navCategories.length > 0 ? navCategories.map((n) => `- ${n.category}${n.subcategories?.length ? `: ${n.subcategories.join(', ')}` : ''}`).join('\n') : 'None in KB - derive from pages'}

## KB SOCIAL LINKS
${kbData.socialLinks.length > 0 ? kbData.socialLinks.map((s) => `- ${s.platform}: ${s.url}`).join('\n') : 'None in KB'}

## KB BRAND VOICE
${kbData.brandVoice ? `- Tone: ${kbData.brandVoice.tone}${kbData.brandVoice.traits?.length ? `\n- Traits: ${kbData.brandVoice.traits.join(', ')}` : ''}` : 'Not specified in KB - use professional tone'}

## CRITICAL INSTRUCTIONS
1. Use the EXACT company name from KB if available
2. Use the EXACT tagline/description from KB if available
3. Navigation structure should align with KB nav_categories if available
4. Include social links from KB in footer
5. For missing KB data, use sensible defaults based on page structure

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
    "description": "${companyInfo?.tagline || companyInfo?.description ? 'USE KB VALUE' : 'Brief company description'}",
    "columns": [
      {
        "title": "Column Title",
        "links": [{ "label": "Link", "href": "/slug" }]
      }
    ],
    "bottomLinks": [
      { "label": "Privacy Policy", "href": "/privacy" }
    ],
    "copyright": "© ${new Date().getFullYear()} ${companyInfo?.name || websiteName}. All rights reserved.",
    "background": "dark"
  }
}`;
}

// =============================================================================
// FALLBACK BUILDERS (No LLM)
// =============================================================================

/**
 * Build header content directly from KB data without LLM
 */
function buildHeaderFromKB(
  input: KBGroundedGenerationInput,
  kbData: KBGlobalComponentData
): HeaderContent {
  const { websiteName, pages } = input;
  const companyName =
    kbData.companyInfo?.name || kbData.companyInfo?.shortName || websiteName;

  // Build nav items from KB nav_categories or pages
  let navItems: HeaderContent['navItems'];

  if (kbData.navCategories.length > 0) {
    // Use KB navigation categories
    navItems = kbData.navCategories.slice(0, 6).map((cat) => {
      // Find matching pages for this category
      const categoryPages = pages.filter(
        (p) =>
          p.title.toLowerCase().includes(cat.category.toLowerCase()) ||
          cat.subcategories?.some((sub) =>
            p.title.toLowerCase().includes(sub.toLowerCase())
          )
      );

      if (cat.subcategories && cat.subcategories.length > 0) {
        return {
          label: cat.category,
          href: '#', // Parent nav item
          children: cat.subcategories.slice(0, 4).map((sub) => ({
            label: sub,
            href:
              categoryPages.find((p) =>
                p.title.toLowerCase().includes(sub.toLowerCase())
              )?.slug || `/${sub.toLowerCase().replace(/\s+/g, '-')}`,
          })),
        };
      }

      return {
        label: cat.category,
        href:
          categoryPages[0]?.slug ||
          `/${cat.category.toLowerCase().replace(/\s+/g, '-')}`,
      };
    });
  } else {
    // Fall back to using pages directly
    navItems = pages
      .filter((p) => !p.isHomepage)
      .slice(0, 5)
      .map((page) => ({
        label: page.title,
        href: page.slug.startsWith('/') ? page.slug : `/${page.slug}`,
      }));
  }

  return {
    companyName,
    navItems,
    ctaButton: {
      label: 'Get Started',
      href: '/contact',
      variant: 'primary',
    },
    sticky: true,
  };
}

/**
 * Build footer content directly from KB data without LLM
 */
function buildFooterFromKB(
  input: KBGroundedGenerationInput,
  kbData: KBGlobalComponentData
): FooterContent {
  const { websiteName, pages } = input;
  const companyName = kbData.companyInfo?.name || websiteName;
  const description =
    kbData.companyInfo?.tagline ||
    kbData.companyInfo?.description ||
    `${companyName} - Your trusted partner.`;

  // Build columns
  const columns: FooterContent['columns'] = [];

  // Company column
  columns.push({
    title: 'Company',
    links: pages
      .filter(
        (p) =>
          p.title.toLowerCase().includes('about') ||
          p.title.toLowerCase().includes('team') ||
          p.title.toLowerCase().includes('career')
      )
      .slice(0, 4)
      .map((p) => ({
        label: p.title,
        href: p.slug.startsWith('/') ? p.slug : `/${p.slug}`,
      })),
  });

  // Filter empty columns
  if (columns[0].links.length === 0) {
    columns[0].links = [
      { label: 'About Us', href: '/about' },
      { label: 'Contact', href: '/contact' },
    ];
  }

  // Resources column based on KB categories or pages
  if (kbData.navCategories.length > 0) {
    const resourceCat = kbData.navCategories.find(
      (c) =>
        c.category.toLowerCase().includes('resource') ||
        c.category.toLowerCase().includes('support')
    );
    if (resourceCat) {
      columns.push({
        title: resourceCat.category,
        links: (resourceCat.subcategories || []).slice(0, 4).map((sub) => ({
          label: sub,
          href: `/${sub.toLowerCase().replace(/\s+/g, '-')}`,
        })),
      });
    }
  }

  // Add remaining pages
  const remainingPages = pages
    .filter(
      (p) =>
        !p.isHomepage &&
        !columns.some((col) => col.links.some((link) => link.href === p.slug))
    )
    .slice(0, 4);

  if (remainingPages.length > 0) {
    columns.push({
      title: 'Quick Links',
      links: remainingPages.map((p) => ({
        label: p.title,
        href: p.slug.startsWith('/') ? p.slug : `/${p.slug}`,
      })),
    });
  }

  // Legal column
  columns.push({
    title: 'Legal',
    links: [
      { label: 'Privacy Policy', href: '/privacy' },
      { label: 'Terms of Service', href: '/terms' },
    ],
  });

  return {
    companyName,
    description: description.substring(0, 200), // Limit length
    columns: columns.slice(0, 4), // Max 4 columns
    socialLinks: mapSocialLinksToFooter(kbData.socialLinks),
    bottomLinks: [
      { label: 'Privacy Policy', href: '/privacy' },
      { label: 'Terms of Service', href: '/terms' },
    ],
    copyright: `© ${new Date().getFullYear()} ${companyName}. All rights reserved.`,
    background: 'dark',
  };
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Map KB social links to FooterContent compatible format
 * Filters out 'other' platform and maps to supported types
 */
function mapSocialLinksToFooter(
  socialLinks: Array<{
    platform: 'linkedin' | 'twitter' | 'facebook' | 'instagram' | 'youtube' | 'other';
    url: string;
  }>
): FooterContent['socialLinks'] {
  type FooterPlatform = 'twitter' | 'linkedin' | 'facebook' | 'instagram' | 'youtube' | 'github';
  const supportedPlatforms: FooterPlatform[] = ['twitter', 'linkedin', 'facebook', 'instagram', 'youtube'];

  return socialLinks
    .filter((link) => supportedPlatforms.includes(link.platform as FooterPlatform))
    .map((link) => ({
      platform: link.platform as FooterPlatform,
      url: link.url,
    }));
}

// =============================================================================
// EXPORT
// =============================================================================

export {
  buildHeaderFromKB,
  buildFooterFromKB,
  type KBGlobalComponentData,
};
