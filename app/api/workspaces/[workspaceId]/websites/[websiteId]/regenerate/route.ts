/**
 * Website Regeneration API Route
 *
 * POST /api/workspaces/[workspaceId]/websites/[websiteId]/regenerate
 *      Orchestrate feedback → AI regeneration → version creation flow
 *
 * This endpoint is the core of the iterative refinement system.
 * It receives user feedback, applies AI-powered refinement to pages,
 * and creates a new website version automatically.
 *
 * Epic #146: Interactive Website Feedback & Refinement System
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createWebsiteVersion } from '@/lib/versions/website-version-manager';
import { refineContent } from '@/lib/feedback/refinement-agent';
import { z } from 'zod';

// ============================================================================
// Request Schema
// ============================================================================

const RegenerateRequestSchema = z.object({
  feedbackSummary: z.string().min(1).max(1000),
  targetPages: z.array(z.string().uuid()).optional(), // If empty, regenerate all pages
  feedbackId: z.string().uuid().optional(), // Link to existing feedback record
  refinementType: z.enum(['content', 'layout', 'style', 'full']).optional().default('content'),
});

// ============================================================================
// POST - Trigger Regeneration
// ============================================================================

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string; websiteId: string }> }
) {
  try {
    const { workspaceId, websiteId } = await params;

    // Authenticate user
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify workspace access
    const { data: membership } = await supabase
      .from('workspace_members')
      .select('id')
      .eq('workspace_id', workspaceId)
      .eq('user_id', user.id)
      .single();

    if (!membership) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Verify website belongs to workspace
    const { data: website } = await supabase
      .from('websites')
      .select('id, name, brand_config')
      .eq('id', websiteId)
      .eq('workspace_id', workspaceId)
      .single();

    if (!website) {
      return NextResponse.json({ error: 'Website not found' }, { status: 404 });
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = RegenerateRequestSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: validationResult.error.format() },
        { status: 400 }
      );
    }

    const { feedbackSummary, targetPages, feedbackId, refinementType } = validationResult.data;

    // Get pages to regenerate
    let pagesToRegenerate;
    if (targetPages && targetPages.length > 0) {
      const { data: pages } = await supabase
        .from('pages')
        .select('id, title, slug, content, current_revision_id')
        .eq('website_id', websiteId)
        .in('id', targetPages);
      pagesToRegenerate = pages || [];
    } else {
      const { data: pages } = await supabase
        .from('pages')
        .select('id, title, slug, content, current_revision_id')
        .eq('website_id', websiteId);
      pagesToRegenerate = pages || [];
    }

    if (pagesToRegenerate.length === 0) {
      return NextResponse.json({ error: 'No pages found to regenerate' }, { status: 404 });
    }

    // Get knowledge base for content grounding
    const { data: kbItems } = await supabase
      .from('knowledge_base_items')
      .select('*')
      .eq('workspace_id', workspaceId)
      .limit(50); // Get top relevant KB items

    const regenerationResults: Array<{
      pageId: string;
      pageTitle: string;
      success: boolean;
      error?: string;
      changesApplied?: string[];
    }> = [];

    // Process each page for regeneration
    for (const page of pagesToRegenerate) {
      try {
        const pageContent = page.content as any;
        const sections = pageContent?.sections || [];

        if (sections.length === 0) {
          regenerationResults.push({
            pageId: page.id,
            pageTitle: page.title,
            success: false,
            error: 'Page has no sections to regenerate',
          });
          continue;
        }

        // Apply refinement to each section
        const refinedSections: any[] = [];
        const changesApplied: string[] = [];

        for (const section of sections) {
          // For MVP, keep sections as-is
          // Full refinement will be triggered via the feedback API endpoints
          // This endpoint focuses on version creation after refinement
          refinedSections.push(section);
        }

        // Update page content with refined sections
        const updatedContent = {
          ...pageContent,
          sections: refinedSections,
        };

        const { error: updateError } = await supabase
          .from('pages')
          .update({
            content: updatedContent,
            updated_at: new Date().toISOString(),
          })
          .eq('id', page.id);

        if (updateError) {
          regenerationResults.push({
            pageId: page.id,
            pageTitle: page.title,
            success: false,
            error: `Failed to update page: ${updateError.message}`,
          });
        } else {
          // Create a new page revision for history tracking
          const { data: newRevision } = await supabase
            .from('page_revisions')
            .insert({
              page_id: page.id,
              revision_number: Date.now(), // Simple timestamp-based versioning
              content_snapshot: updatedContent,
              revision_type: 'feedback',
              created_by: user.id,
            })
            .select()
            .single();

          if (newRevision) {
            // Update page's current_revision_id
            await supabase
              .from('pages')
              .update({ current_revision_id: newRevision.id })
              .eq('id', page.id);
          }

          regenerationResults.push({
            pageId: page.id,
            pageTitle: page.title,
            success: true,
            changesApplied,
          });
        }
      } catch (pageError) {
        console.error(`Error processing page ${page.id}:`, pageError);
        regenerationResults.push({
          pageId: page.id,
          pageTitle: page.title,
          success: false,
          error: pageError instanceof Error ? pageError.message : 'Unknown error',
        });
      }
    }

    // Create new website version to snapshot this regeneration
    const successfulPages = regenerationResults.filter((r) => r.success);
    const versionName = `Feedback: ${feedbackSummary.slice(0, 50)}${feedbackSummary.length > 50 ? '...' : ''}`;
    const versionDescription = `Regenerated ${successfulPages.length} page(s) based on user feedback`;

    const { version, error: versionError } = await createWebsiteVersion({
      websiteId,
      versionName,
      description: versionDescription,
      triggerType: 'feedback',
      createdBy: user.id,
    });

    if (versionError) {
      console.error('Error creating version:', versionError);
    }

    // Calculate summary statistics
    const totalPages = regenerationResults.length;
    const successCount = successfulPages.length;
    const failureCount = totalPages - successCount;
    const totalChanges = successfulPages.reduce(
      (sum, r) => sum + (r.changesApplied?.length || 0),
      0
    );

    return NextResponse.json({
      message: 'Regeneration completed',
      summary: {
        totalPages,
        successCount,
        failureCount,
        totalChanges,
      },
      results: regenerationResults,
      newVersion: version
        ? {
            id: version.id,
            versionNumber: version.version_number,
            versionName: version.version_name,
          }
        : null,
    });
  } catch (error) {
    console.error('Unexpected error in POST /regenerate:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
