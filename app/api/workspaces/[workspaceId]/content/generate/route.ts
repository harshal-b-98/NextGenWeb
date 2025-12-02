import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  generateContent,
  saveGeneratedContent,
  ContentGenerationInputSchema,
} from '@/lib/content';

/**
 * POST /api/workspaces/[workspaceId]/content/generate
 *
 * Generate content for page sections using AI.
 * Populates component slots with persona-specific variations.
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
    const validationResult = ContentGenerationInputSchema.safeParse({
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

    // Verify page exists and belongs to the workspace
    const { data: page, error: pageError } = await supabase
      .from('pages')
      .select('id, website_id')
      .eq('id', input.pageId)
      .single();

    if (pageError || !page) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 });
    }

    // Verify website belongs to workspace
    const { data: website, error: websiteError } = await supabase
      .from('websites')
      .select('id')
      .eq('id', page.website_id)
      .eq('workspace_id', workspaceId)
      .single();

    if (websiteError || !website) {
      return NextResponse.json(
        { error: 'Page does not belong to this workspace' },
        { status: 403 }
      );
    }

    // Generate content
    const result = await generateContent(input);

    // Save to database unless explicitly disabled
    if (body.save !== false) {
      await saveGeneratedContent(result, input.websiteId);
    }

    return NextResponse.json({
      success: true,
      content: {
        pageId: result.pageId,
        sectionsGenerated: result.sections.length,
        sections: result.sections.map((s) => ({
          sectionId: s.sectionId,
          componentId: s.componentId,
          narrativeRole: s.narrativeRole,
          hasContent: !!s.content.headline || !!s.content.sectionTitle,
          personaVariations: Object.keys(s.personaVariations).length,
          confidenceScore: s.metadata.confidenceScore,
        })),
      },
      pageMetadata: result.pageMetadata,
      stats: result.generationStats,
    });
  } catch (error) {
    console.error('Error generating content:', error);
    return NextResponse.json(
      { error: 'Failed to generate content' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/workspaces/[workspaceId]/content/generate?pageId=xxx
 *
 * Retrieve generated content for a page.
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

    if (!pageId) {
      return NextResponse.json({ error: 'pageId is required' }, { status: 400 });
    }

    // Fetch page with generated content
    const { data: page, error } = await supabase
      .from('pages')
      .select('id, title, content, website_id')
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
    const generatedContent = content?.generatedContent as Record<string, unknown> | null;

    if (!generatedContent) {
      return NextResponse.json({
        success: true,
        hasContent: false,
        message: 'No generated content for this page',
      });
    }

    return NextResponse.json({
      success: true,
      hasContent: true,
      generatedContent,
    });
  } catch (error) {
    console.error('Error fetching generated content:', error);
    return NextResponse.json(
      { error: 'Failed to fetch generated content' },
      { status: 500 }
    );
  }
}
