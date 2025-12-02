import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  generateStoryline,
  saveStoryline,
  validateStoryline,
  StorylineGenerationInputSchema,
} from '@/lib/storyline';
import { PageType } from '@/lib/layout/types';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  try {
    const { workspaceId } = await params;
    const supabase = await createClient();

    // Verify user has access to this workspace
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

    if (!membership || !['owner', 'admin', 'editor'].includes(membership.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = StorylineGenerationInputSchema.safeParse({
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

    // Generate storyline
    const result = await generateStoryline(input);

    // Validate the generated storyline
    const validation = validateStoryline(result, input.pageType as PageType);

    // Optionally save to database
    if (body.save !== false && body.pageId) {
      await saveStoryline(result, input.websiteId, body.pageId);
    }

    return NextResponse.json({
      success: true,
      storyline: {
        narrative: result.narrative,
        defaultFlow: result.defaultFlow,
        contentBlocks: result.contentBlocks.length,
        personaVariations: result.personaVariations.length,
        emotionalJourney: result.emotionalJourney,
      },
      validation: {
        isOptimal: validation.isOptimal,
        score: validation.score,
        violations: validation.violations.length,
        suggestions: validation.suggestions,
      },
      metadata: result.metadata,
    });
  } catch (error) {
    console.error('Error generating storyline:', error);
    return NextResponse.json(
      { error: 'Failed to generate storyline' },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint to analyze existing page storyline
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  try {
    const { workspaceId } = await params;
    const supabase = await createClient();

    // Verify user has access to this workspace
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

    // Fetch page with storyline data
    const { data: page, error } = await supabase
      .from('pages')
      .select('id, title, content')
      .eq('id', pageId)
      .single();

    if (error || !page) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 });
    }

    const content = page.content as Record<string, unknown> | null;
    const storyline = content?.storyline as Record<string, unknown> | null;

    if (!storyline) {
      return NextResponse.json({
        success: true,
        hasStoryline: false,
        message: 'No storyline generated for this page',
      });
    }

    return NextResponse.json({
      success: true,
      hasStoryline: true,
      storyline,
    });
  } catch (error) {
    console.error('Error fetching storyline:', error);
    return NextResponse.json(
      { error: 'Failed to fetch storyline' },
      { status: 500 }
    );
  }
}
