/**
 * Page Service
 * Phase 4.3: Dynamic Page Runtime
 *
 * Service for loading page data for runtime rendering.
 */

import { createClient } from '@/lib/supabase/server';
import type { PopulatedContent, PopulatedSection } from '@/lib/content/types';
import type {
  RuntimePageData,
  RuntimeSection,
  RuntimeBrandConfig,
  RuntimeAnimationConfig,
  PageMetadata,
} from './types';

// Type alias for database rows
type DbRow = any;

/**
 * Result type for page service operations
 */
interface PageServiceResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Page Service for loading runtime page data
 */
export class PageService {
  /**
   * Get page data by website slug and page slug
   */
  async getPageBySlug(
    websiteSlug: string,
    pageSlug: string
  ): Promise<PageServiceResult<RuntimePageData>> {
    try {
      const supabase = await createClient();

      // First, find the website by slug
      const { data: website, error: websiteError } = await supabase
        .from('websites')
        .select('id, workspace_id, name, domain, brand_config')
        .eq('slug', websiteSlug)
        .single();

      if (websiteError || !website) {
        return { success: false, error: 'Website not found' };
      }

      // Find the page by slug within this website
      const { data: page, error: pageError } = await supabase
        .from('pages')
        .select('*')
        .eq('website_id', (website as DbRow).id)
        .eq('slug', pageSlug)
        .eq('status', 'published')
        .single();

      if (pageError || !page) {
        return { success: false, error: 'Page not found' };
      }

      // Transform to runtime format
      const runtimeData = this.transformToRuntimeData(
        page as DbRow,
        website as DbRow
      );

      return { success: true, data: runtimeData };
    } catch (error) {
      console.error('Error loading page:', error);
      return { success: false, error: 'Failed to load page' };
    }
  }

  /**
   * Get page data by page ID
   */
  async getPageById(pageId: string): Promise<PageServiceResult<RuntimePageData>> {
    try {
      const supabase = await createClient();

      // Get page with website info
      const { data: page, error: pageError } = await supabase
        .from('pages')
        .select(`
          *,
          website:websites(id, workspace_id, name, domain, slug, brand_config)
        `)
        .eq('id', pageId)
        .single();

      if (pageError || !page) {
        return { success: false, error: 'Page not found' };
      }

      const pageRow = page as DbRow;
      const websiteRow = pageRow.website as DbRow;

      const runtimeData = this.transformToRuntimeData(pageRow, websiteRow);

      return { success: true, data: runtimeData };
    } catch (error) {
      console.error('Error loading page:', error);
      return { success: false, error: 'Failed to load page' };
    }
  }

  /**
   * Get all published pages for a website
   */
  async getWebsitePages(websiteId: string): Promise<PageServiceResult<RuntimePageData[]>> {
    try {
      const supabase = await createClient();

      // Get website info
      const { data: website, error: websiteError } = await supabase
        .from('websites')
        .select('id, workspace_id, name, domain, slug, brand_config')
        .eq('id', websiteId)
        .single();

      if (websiteError || !website) {
        return { success: false, error: 'Website not found' };
      }

      // Get all published pages
      const { data: pages, error: pagesError } = await supabase
        .from('pages')
        .select('*')
        .eq('website_id', websiteId)
        .eq('status', 'published')
        .order('path', { ascending: true });

      if (pagesError) {
        return { success: false, error: pagesError.message };
      }

      const runtimePages = (pages as DbRow[] || []).map((page) =>
        this.transformToRuntimeData(page, website as DbRow)
      );

      return { success: true, data: runtimePages };
    } catch (error) {
      console.error('Error loading pages:', error);
      return { success: false, error: 'Failed to load pages' };
    }
  }

  /**
   * Transform database page to runtime format
   */
  private transformToRuntimeData(page: DbRow, website: DbRow): RuntimePageData {
    const content = page.content || {};
    // Handle both content structures:
    // 1. Old structure: { generatedContent: { sections: [...] } }
    // 2. New structure from generate API: { sections: [...] }
    const generatedContent = content.generatedContent || {};
    const sections = generatedContent.sections || content.sections || [];

    // Transform sections
    const runtimeSections: RuntimeSection[] = sections.map(
      (section: PopulatedSection, index: number) =>
        this.transformSection(section, index)
    );

    // Get available personas from sections
    const availablePersonas = new Set<string>();
    for (const section of runtimeSections) {
      Object.keys(section.personaVariants).forEach((p) => availablePersonas.add(p));
    }

    // Extract brand config
    const brandConfig = this.extractBrandConfig(website.brand_config);

    // Extract animation config
    const animationConfig = this.extractAnimationConfig(content.animationConfig);

    // Extract metadata - handle both structures
    const pageMetadata = generatedContent.pageMetadata || content.metadata || {};
    const metadata: PageMetadata = {
      title: pageMetadata.title || page.title,
      description: pageMetadata.description || page.seo_description || '',
      keywords: pageMetadata.keywords || page.seo_keywords || [],
      ogImage: pageMetadata.ogImage,
      canonicalUrl: page.canonical_url,
    };

    return {
      pageId: page.id,
      websiteId: website.id,
      title: page.title,
      slug: page.slug,
      path: page.path,
      sections: runtimeSections,
      metadata,
      availablePersonas: Array.from(availablePersonas),
      brandConfig,
      animationConfig,
    };
  }

  /**
   * Transform a populated section to runtime section
   */
  private transformSection(section: PopulatedSection, index: number): RuntimeSection {
    // Extract persona variants
    const personaVariants: Record<string, PopulatedContent> = {};
    const variantFields: string[] = [];

    if (section.personaVariations) {
      for (const [personaId, variation] of Object.entries(section.personaVariations)) {
        personaVariants[personaId] = variation.content;

        // Track which fields differ
        if (Object.keys(personaVariants).length === 1) {
          // First variant - compare with default
          variantFields.push(
            ...this.getChangedFields(section.content, variation.content)
          );
        }
      }
    }

    return {
      sectionId: section.sectionId,
      componentId: section.componentId,
      order: section.order ?? index,
      narrativeRole: section.narrativeRole,
      defaultContent: section.content,
      personaVariants,
      variantFields: [...new Set(variantFields)],
    };
  }

  /**
   * Get fields that changed between two content objects
   */
  private getChangedFields(
    content1: PopulatedContent,
    content2: PopulatedContent
  ): string[] {
    const changed: string[] = [];
    const keys = new Set([...Object.keys(content1), ...Object.keys(content2)]);

    for (const key of keys) {
      const val1 = (content1 as any)[key];
      const val2 = (content2 as any)[key];

      if (JSON.stringify(val1) !== JSON.stringify(val2)) {
        changed.push(key);
      }
    }

    return changed;
  }

  /**
   * Extract brand config from database format
   */
  private extractBrandConfig(brandConfig: any): RuntimeBrandConfig | undefined {
    if (!brandConfig) return undefined;

    return {
      primaryColor: brandConfig.primary_color || brandConfig.primaryColor || '#3B82F6',
      secondaryColor: brandConfig.secondary_color || brandConfig.secondaryColor || '#10B981',
      accentColor: brandConfig.accent_color || brandConfig.accentColor || '#F59E0B',
      fontFamily: brandConfig.font_family || brandConfig.fontFamily || 'Inter',
      headingFont: brandConfig.heading_font || brandConfig.headingFont,
      logoUrl: brandConfig.logo_url || brandConfig.logoUrl,
    };
  }

  /**
   * Extract animation config from database format
   */
  private extractAnimationConfig(animConfig: any): RuntimeAnimationConfig | undefined {
    if (!animConfig) return undefined;

    return {
      enabled: animConfig.enabled ?? true,
      transitionDuration: animConfig.transition_duration || animConfig.transitionDuration || 300,
      swapAnimation: animConfig.swap_animation || animConfig.swapAnimation || 'crossfade',
      entranceAnimation: animConfig.entrance_animation || animConfig.entranceAnimation || 'fade-up',
      staggerDelay: animConfig.stagger_delay || animConfig.staggerDelay || 100,
    };
  }
}

/**
 * Factory function to create page service
 */
export function createPageService(): PageService {
  return new PageService();
}

/**
 * Quick helper to get page data
 */
export async function getPageData(
  websiteSlug: string,
  pageSlug: string
): Promise<RuntimePageData | null> {
  const service = new PageService();
  const result = await service.getPageBySlug(websiteSlug, pageSlug);
  return result.success ? result.data! : null;
}
