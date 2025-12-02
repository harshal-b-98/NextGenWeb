/**
 * Preview API
 * Phase 5.2: Preview System
 *
 * Fetch page data for preview mode (supports draft pages).
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { RuntimePageData, RuntimeSection, RuntimeBrandConfig, PageMetadata } from '@/lib/runtime/types';
import type { PopulatedSection, PopulatedContent } from '@/lib/content/types';

/**
 * GET /api/workspaces/[workspaceId]/preview/[pageId]
 * Get page data for preview (includes draft pages)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string; pageId: string }> }
) {
  try {
    const { workspaceId, pageId } = await params;
    const supabase = await createClient();

    // Verify authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check workspace membership
    const { data: membership } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', workspaceId)
      .eq('user_id', user.id)
      .single();

    if (!membership) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Get page with website info (no status filter for preview)
    const { data: page, error: pageError } = await supabase
      .from('pages')
      .select(`
        *,
        website:websites(id, workspace_id, name, domain, slug, brand_config, status)
      `)
      .eq('id', pageId)
      .single();

    if (pageError || !page) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 });
    }

    // Verify page belongs to the workspace
    const website = (page as any).website;
    if (website.workspace_id !== workspaceId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Get available personas for this workspace
    const { data: personas } = await supabase
      .from('personas')
      .select('id, name, title, description')
      .eq('workspace_id', workspaceId)
      .eq('is_active', true);

    // Transform to runtime format
    const runtimeData = transformToRuntimeData(page as any, website);

    return NextResponse.json({
      success: true,
      preview: {
        pageData: runtimeData,
        availablePersonas: personas || [],
        websiteStatus: website.status,
        pageStatus: (page as any).status || 'draft',
      },
    });
  } catch (error) {
    console.error('Error fetching preview:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Transform database page to runtime format
 */
function transformToRuntimeData(page: any, website: any): RuntimePageData {
  const content = page.content || {};
  const generatedContent = content.generatedContent || {};
  const sections = generatedContent.sections || [];

  // Transform sections
  const runtimeSections: RuntimeSection[] = sections.map(
    (section: PopulatedSection, index: number) => transformSection(section, index)
  );

  // Get available personas from sections
  const availablePersonas = new Set<string>();
  for (const section of runtimeSections) {
    Object.keys(section.personaVariants).forEach((p) => availablePersonas.add(p));
  }

  // Extract brand config
  const brandConfig = extractBrandConfig(website.brand_config);

  // Extract metadata
  const metadata: PageMetadata = {
    title: generatedContent.pageMetadata?.title || page.title,
    description: generatedContent.pageMetadata?.description || page.seo_description || '',
    keywords: generatedContent.pageMetadata?.keywords || page.seo_keywords || [],
    ogImage: generatedContent.pageMetadata?.ogImage,
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
    animationConfig: {
      enabled: true,
      transitionDuration: 300,
      swapAnimation: 'crossfade',
      entranceAnimation: 'fade-up',
      staggerDelay: 100,
    },
  };
}

/**
 * Transform a populated section to runtime section
 */
function transformSection(section: PopulatedSection, index: number): RuntimeSection {
  const personaVariants: Record<string, PopulatedContent> = {};

  if (section.personaVariations) {
    for (const [personaId, variation] of Object.entries(section.personaVariations)) {
      personaVariants[personaId] = variation.content;
    }
  }

  return {
    sectionId: section.sectionId,
    componentId: section.componentId,
    order: section.order ?? index,
    narrativeRole: section.narrativeRole,
    defaultContent: section.content,
    personaVariants,
    variantFields: [],
  };
}

/**
 * Extract brand config from database format
 */
function extractBrandConfig(brandConfig: any): RuntimeBrandConfig | undefined {
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
