/**
 * Conversational Landing Page Generation API
 * Phase 6: Conversational Marketing Platform
 *
 * Generates personalized CTAs and workspace config for the
 * conversational landing page experience.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getCTAGenerator } from '@/lib/interactive/chat/personalized-cta-generator';
import { getWorkspaceIdForWebsite } from '@/lib/interactive/chat/section-generator';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Request schema
const GenerateLandingRequestSchema = z.object({
  websiteId: z.string().uuid(),
});

/**
 * POST - Generate personalized landing page data
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request
    const parseResult = GenerateLandingRequestSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: 'Invalid request',
          details: parseResult.error.flatten(),
        },
        { status: 400 }
      );
    }

    const { websiteId } = parseResult.data;

    // Get workspace ID from website
    const workspaceId = await getWorkspaceIdForWebsite(websiteId);

    // Get website details for name and brand config
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();

    const { data: website, error: websiteError } = await supabase
      .from('websites')
      .select('name, slug, brand_config')
      .eq('id', websiteId)
      .single();

    if (websiteError || !website) {
      return NextResponse.json(
        { error: 'Website not found' },
        { status: 404 }
      );
    }

    // Generate personalized CTAs
    const ctaGenerator = getCTAGenerator();
    const result = await ctaGenerator.generateCTAs(
      workspaceId,
      website.name,
      website.brand_config as Record<string, unknown> | undefined
    );

    return NextResponse.json({
      success: true,
      websiteId,
      workspaceId,
      slug: website.slug,
      ctas: result.ctas,
      workspaceConfig: result.workspaceConfig,
      knowledgeTopics: result.knowledgeTopics,
    });
  } catch (error) {
    console.error('Landing page generation error:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate landing page data',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * GET - Get existing or cached landing page data
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const websiteId = searchParams.get('websiteId');

    if (!websiteId) {
      return NextResponse.json(
        { error: 'websiteId is required' },
        { status: 400 }
      );
    }

    // For now, just generate fresh data
    // TODO: Implement caching for production
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();

    const { data: website, error: websiteError } = await supabase
      .from('websites')
      .select('name, slug, brand_config, workspace_id')
      .eq('id', websiteId)
      .single();

    if (websiteError || !website) {
      return NextResponse.json(
        { error: 'Website not found' },
        { status: 404 }
      );
    }

    const ctaGenerator = getCTAGenerator();
    const result = await ctaGenerator.generateCTAs(
      website.workspace_id,
      website.name,
      website.brand_config as Record<string, unknown> | undefined
    );

    return NextResponse.json({
      success: true,
      websiteId,
      workspaceId: website.workspace_id,
      slug: website.slug,
      ctas: result.ctas,
      workspaceConfig: result.workspaceConfig,
      knowledgeTopics: result.knowledgeTopics,
    });
  } catch (error) {
    console.error('Landing page data fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch landing page data' },
      { status: 500 }
    );
  }
}
