/**
 * Website Export API
 * Phase 5.3: Export & Deployment
 *
 * Export a website as a standalone Next.js project ZIP file.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateNextJsProject, generateZipBuffer, type WebsiteExportData, type ExportConfig } from '@/lib/export';
import type { RuntimePageData, RuntimeSection, RuntimeBrandConfig, PageMetadata } from '@/lib/runtime/types';
import type { PopulatedSection, PopulatedContent } from '@/lib/content/types';
import { trackExportCreated } from '@/lib/activity';

/**
 * POST /api/workspaces/[workspaceId]/websites/[websiteId]/export
 * Export website as Next.js project ZIP
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string; websiteId: string }> }
) {
  try {
    const { workspaceId, websiteId } = await params;
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

    // Parse export config from request body
    const body = await request.json().catch(() => ({}));
    const exportConfig: Partial<ExportConfig> = {
      projectName: body.projectName,
      description: body.description,
      typescript: body.typescript ?? true,
      tailwind: body.tailwind ?? true,
      includeEnvExample: body.includeEnvExample ?? true,
      includeDocker: body.includeDocker ?? false,
      author: body.author,
      version: body.version ?? '0.1.0',
    };

    // Fetch website with pages
    const { data: website, error: websiteError } = await supabase
      .from('websites')
      .select(`
        *,
        pages(*)
      `)
      .eq('id', websiteId)
      .eq('workspace_id', workspaceId)
      .single();

    if (websiteError || !website) {
      return NextResponse.json({ error: 'Website not found' }, { status: 404 });
    }

    // Transform to export format
    const websiteData = transformToExportData(website);

    // Set project name from website name if not provided
    if (!exportConfig.projectName) {
      exportConfig.projectName = slugify(website.name);
    }

    // Generate the Next.js project
    const exportResult = generateNextJsProject(websiteData, exportConfig);

    // Generate ZIP buffer
    const zipBuffer = await generateZipBuffer(exportResult);

    // Track export activity
    await trackExportCreated(workspaceId, user.id, websiteId, website.name);

    // Return ZIP file
    const filename = `${exportConfig.projectName || 'website'}-export.zip`;

    // Convert Buffer to Uint8Array for NextResponse compatibility
    const uint8Array = new Uint8Array(zipBuffer);

    return new NextResponse(uint8Array, {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': zipBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('Error exporting website:', error);
    return NextResponse.json(
      { error: 'Failed to export website' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/workspaces/[workspaceId]/websites/[websiteId]/export
 * Get export preview (file list and size estimate)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string; websiteId: string }> }
) {
  try {
    const { workspaceId, websiteId } = await params;
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

    // Fetch website with pages
    const { data: website, error: websiteError } = await supabase
      .from('websites')
      .select(`
        *,
        pages(id, title, slug, path, status)
      `)
      .eq('id', websiteId)
      .eq('workspace_id', workspaceId)
      .single();

    if (websiteError || !website) {
      return NextResponse.json({ error: 'Website not found' }, { status: 404 });
    }

    // Return export preview info
    return NextResponse.json({
      success: true,
      preview: {
        websiteName: website.name,
        domain: website.domain,
        pageCount: website.pages?.length || 0,
        pages: website.pages?.map((p: any) => ({
          title: p.title,
          slug: p.slug,
          path: p.path,
          status: p.status,
        })),
        estimatedFiles: 15 + (website.pages?.length || 0) * 2,
        hasBrandConfig: !!website.brand_config,
      },
    });
  } catch (error) {
    console.error('Error getting export preview:', error);
    return NextResponse.json(
      { error: 'Failed to get export preview' },
      { status: 500 }
    );
  }
}

/**
 * Transform database website to export format
 */
function transformToExportData(website: any): WebsiteExportData {
  const pages: RuntimePageData[] = (website.pages || []).map((page: any) => {
    const content = page.content || {};
    const generatedContent = content.generatedContent || {};
    const sections = generatedContent.sections || [];

    // Transform sections to RuntimeSection format
    const runtimeSections: RuntimeSection[] = sections.map(
      (section: PopulatedSection, index: number) => ({
        sectionId: section.sectionId || `section-${index}`,
        componentId: section.componentId || 'generic-section',
        order: section.order ?? index,
        narrativeRole: section.narrativeRole || 'content',
        defaultContent: section.content || {},
        personaVariants: {},
        variantFields: [],
      })
    );

    // Build metadata
    const metadata: PageMetadata = {
      title: generatedContent.pageMetadata?.title || page.title || 'Untitled',
      description: generatedContent.pageMetadata?.description || page.seo_description || '',
      keywords: generatedContent.pageMetadata?.keywords || page.seo_keywords || [],
      ogImage: generatedContent.pageMetadata?.ogImage,
      canonicalUrl: page.canonical_url,
    };

    return {
      pageId: page.id,
      websiteId: website.id,
      title: page.title || 'Untitled',
      slug: page.slug || 'page',
      path: page.path || '/',
      sections: runtimeSections,
      metadata,
      availablePersonas: [],
    };
  });

  // Extract brand config
  const brandConfig: RuntimeBrandConfig | undefined = website.brand_config
    ? {
        primaryColor: website.brand_config.primary_color || website.brand_config.primaryColor || '#3B82F6',
        secondaryColor: website.brand_config.secondary_color || website.brand_config.secondaryColor || '#10B981',
        accentColor: website.brand_config.accent_color || website.brand_config.accentColor || '#F59E0B',
        fontFamily: website.brand_config.font_family || website.brand_config.fontFamily || 'Inter',
        headingFont: website.brand_config.heading_font || website.brand_config.headingFont,
        logoUrl: website.brand_config.logo_url || website.brand_config.logoUrl,
      }
    : undefined;

  return {
    websiteId: website.id,
    websiteName: website.name,
    domain: website.domain,
    brandConfig,
    pages,
  };
}

/**
 * Convert string to URL-safe slug
 */
function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}
