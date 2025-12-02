import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  generateFullPage,
  generateFullPageSummary,
  FullPageGenerationInputSchema,
  serializePageOutput,
} from '@/lib/pipeline';

/**
 * POST /api/workspaces/[workspaceId]/pages/generate
 *
 * Generate a complete page using the full pipeline:
 * Layout → Storyline → Content generation
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  try {
    const { workspaceId } = await params;
    const supabase = await createClient();

    // Verify user authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check workspace membership and permissions
    const { data: membership } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', workspaceId)
      .eq('user_id', user.id)
      .single();

    if (!membership || !['owner', 'admin', 'editor'].includes(membership.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = FullPageGenerationInputSchema.safeParse({
      ...body,
      workspaceId,
    });

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validationResult.error.issues },
        { status: 400 }
      );
    }

    const input = validationResult.data;

    // Verify website belongs to workspace
    const { data: website, error: websiteError } = await supabase
      .from('websites')
      .select('id')
      .eq('id', input.websiteId)
      .eq('workspace_id', workspaceId)
      .single();

    if (websiteError || !website) {
      return NextResponse.json(
        { error: 'Website not found or does not belong to this workspace' },
        { status: 404 }
      );
    }

    // Verify knowledge base exists
    const { data: knowledgeBase, error: kbError } = await supabase
      .from('knowledge_base_items')
      .select('id')
      .eq('workspace_id', workspaceId)
      .limit(1);

    if (kbError || !knowledgeBase || knowledgeBase.length === 0) {
      return NextResponse.json(
        { error: 'Knowledge base not found or empty' },
        { status: 404 }
      );
    }

    // Generate the page
    if (input.returnFullOutput) {
      const result = await generateFullPage(input);

      return NextResponse.json({
        success: true,
        ...serializePageOutput(result, true),
      });
    } else {
      const summary = await generateFullPageSummary(input);

      return NextResponse.json({
        success: summary.success,
        pageId: summary.pageId,
        slug: summary.slug,
        status: summary.status,
        pageMetadata: summary.pageMetadata,
        totalTimeMs: summary.totalTimeMs,
        totalTokensUsed: summary.totalTokensUsed,
      });
    }
  } catch (error) {
    console.error('Error generating page:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate page',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/workspaces/[workspaceId]/pages/generate?pageId=xxx
 *
 * Retrieve generated page data and render information.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  try {
    const { workspaceId } = await params;
    const supabase = await createClient();

    // Verify user authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
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
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Get page ID from query params
    const { searchParams } = new URL(request.url);
    const pageId = searchParams.get('pageId');
    const personaId = searchParams.get('personaId');
    const includeRenderData = searchParams.get('includeRenderData') === 'true';

    if (!pageId) {
      return NextResponse.json({ error: 'pageId is required' }, { status: 400 });
    }

    // Fetch page with full content
    const { data: page, error } = await supabase
      .from('pages')
      .select('id, title, slug, content, website_id, is_homepage, created_at, updated_at')
      .eq('id', pageId)
      .single();

    if (error || !page) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 });
    }

    // Verify website belongs to workspace
    const { data: website } = await supabase
      .from('websites')
      .select('id')
      .eq('id', page.website_id)
      .eq('workspace_id', workspaceId)
      .single();

    if (!website) {
      return NextResponse.json(
        { error: 'Page does not belong to this workspace' },
        { status: 403 }
      );
    }

    const content = page.content as Record<string, unknown> | null;

    // Check if page has been generated
    if (!content?.generatedContent && !content?.sections) {
      return NextResponse.json({
        success: true,
        pageId: page.id,
        hasGeneratedContent: false,
        message: 'This page has not been generated yet',
      });
    }

    // Build response
    const response: Record<string, unknown> = {
      success: true,
      pageId: page.id,
      title: page.title,
      slug: page.slug,
      hasGeneratedContent: true,
      isHomepage: page.is_homepage,
      createdAt: page.created_at,
      updatedAt: page.updated_at,
    };

    // Include pipeline metadata if available
    if (content.pipelineMetadata) {
      response.pipelineMetadata = content.pipelineMetadata;
    }

    // Include page metadata
    if (content.generatedContent) {
      const generatedContent = content.generatedContent as Record<string, unknown>;
      response.pageMetadata = generatedContent.pageMetadata;
      response.generationStats = generatedContent.generationStats;
    }

    // Include full render data if requested
    if (includeRenderData) {
      // Import assembler dynamically to avoid circular deps
      const { extractRenderData, getRenderDataForPersona } = await import(
        '@/lib/pipeline/assembler'
      );

      const renderData = extractRenderData(content as unknown as import('@/lib/pipeline/types').PageContentStructure);

      if (personaId) {
        response.renderData = {
          sections: getRenderDataForPersona(renderData, personaId),
          metadata: renderData.metadata,
          isPersonalized: !!renderData.personaVariants[personaId],
          personaId,
        };
      } else {
        response.renderData = renderData;
      }
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching generated page:', error);
    return NextResponse.json(
      { error: 'Failed to fetch generated page' },
      { status: 500 }
    );
  }
}
