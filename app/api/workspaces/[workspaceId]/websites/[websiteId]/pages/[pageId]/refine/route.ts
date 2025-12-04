/**
 * Refine API
 * Epic #146: Iterative Website Feedback & Refinement System
 *
 * Story #150: AI-powered endpoint for refining section content
 * based on user feedback, with knowledge base grounding.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  refineContent,
  generateAlternatives,
  refineField,
  refineHeadline,
  refineCTA,
  refineDescription,
} from '@/lib/feedback/refinement-agent';
import type { RefinementContext, FeedbackType } from '@/lib/feedback/types';
import { z } from 'zod';

type RouteParams = {
  params: Promise<{
    workspaceId: string;
    websiteId: string;
    pageId: string;
  }>;
};

// Validation schemas
const RefineContentSchema = z.object({
  sectionId: z.string(),
  feedbackText: z.string().min(1),
  feedbackType: z.enum(['content', 'style', 'layout', 'remove', 'add', 'reorder']).default('content'),
  targetField: z.string().optional(),
  generateAlternatives: z.boolean().optional().default(false),
  alternativesCount: z.number().min(1).max(5).optional().default(3),
});

const RefineHeadlineSchema = z.object({
  action: z.literal('refine_headline'),
  currentHeadline: z.string(),
  feedback: z.string(),
  tone: z.string().optional(),
  maxLength: z.number().optional(),
});

const RefineCTASchema = z.object({
  action: z.literal('refine_cta'),
  currentText: z.string(),
  currentLink: z.string(),
  feedback: z.string(),
  stage: z.string().optional(),
  urgency: z.boolean().optional(),
});

const RefineDescriptionSchema = z.object({
  action: z.literal('refine_description'),
  currentDescription: z.string(),
  feedback: z.string(),
  maxLength: z.number().optional(),
  includeStats: z.boolean().optional(),
});

/**
 * POST /api/workspaces/[workspaceId]/websites/[websiteId]/pages/[pageId]/refine
 * AI-powered content refinement
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { workspaceId, websiteId, pageId } = await params;
    const supabase = await createClient();

    // Verify authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check workspace membership with edit permissions
    const { data: membership } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', workspaceId)
      .eq('user_id', user.id)
      .single();

    if (!membership || !['owner', 'admin', 'editor'].includes(membership.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Verify page belongs to website in workspace
    const { data: page } = await supabase
      .from('pages')
      .select('id, content, website:websites!inner(id, workspace_id)')
      .eq('id', pageId)
      .eq('website_id', websiteId)
      .single();

    if (!page || (page.website as { workspace_id: string }).workspace_id !== workspaceId) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 });
    }

    // Parse request body
    const body = await request.json();

    // Handle specialized refinement actions
    if (body.action === 'refine_headline') {
      const validation = RefineHeadlineSchema.safeParse(body);
      if (!validation.success) {
        return NextResponse.json(
          { error: 'Invalid input', details: validation.error.issues },
          { status: 400 }
        );
      }

      const result = await refineHeadline(
        validation.data.currentHeadline,
        validation.data.feedback,
        {
          tone: validation.data.tone,
          maxLength: validation.data.maxLength,
        }
      );

      return NextResponse.json({
        success: true,
        type: 'headline',
        result,
      });
    }

    if (body.action === 'refine_cta') {
      const validation = RefineCTASchema.safeParse(body);
      if (!validation.success) {
        return NextResponse.json(
          { error: 'Invalid input', details: validation.error.issues },
          { status: 400 }
        );
      }

      const result = await refineCTA(
        { text: validation.data.currentText, link: validation.data.currentLink },
        validation.data.feedback,
        {
          stage: validation.data.stage,
          urgency: validation.data.urgency,
        }
      );

      return NextResponse.json({
        success: true,
        type: 'cta',
        result,
      });
    }

    if (body.action === 'refine_description') {
      const validation = RefineDescriptionSchema.safeParse(body);
      if (!validation.success) {
        return NextResponse.json(
          { error: 'Invalid input', details: validation.error.issues },
          { status: 400 }
        );
      }

      const result = await refineDescription(
        validation.data.currentDescription,
        validation.data.feedback,
        {
          maxLength: validation.data.maxLength,
          includeStats: validation.data.includeStats,
        }
      );

      return NextResponse.json({
        success: true,
        type: 'description',
        result,
      });
    }

    // Standard section refinement
    const validation = RefineContentSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error.issues },
        { status: 400 }
      );
    }

    const { sectionId, feedbackText, feedbackType, targetField, generateAlternatives: genAlts, alternativesCount } = validation.data;

    // Get section content from page
    const pageContent = page.content as {
      sections?: Array<{
        id: string;
        componentId: string;
        order: number;
        narrativeRole: string;
        content: Record<string, unknown>;
        styling?: Record<string, unknown>;
      }>;
    };

    const section = pageContent?.sections?.find(s => s.id === sectionId);
    if (!section) {
      return NextResponse.json({ error: 'Section not found' }, { status: 404 });
    }

    // Build refinement context
    const context: RefinementContext = {
      pageId,
      websiteId,
      workspaceId,
      currentSection: {
        sectionId: section.id,
        componentId: section.componentId as RefinementContext['currentSection']['componentId'],
        order: section.order,
        narrativeRole: section.narrativeRole,
        content: section.content,
        styling: section.styling,
      },
      knowledgeContext: '', // Will be fetched by the refinement agent
    };

    // Perform refinement
    let result;
    let alternatives = null;

    if (targetField) {
      // Refine specific field
      result = await refineField(context, targetField, feedbackText);
    } else {
      // Refine entire section
      result = await refineContent(context, feedbackText, feedbackType as FeedbackType);
    }

    // Generate alternatives if requested
    if (genAlts) {
      alternatives = await generateAlternatives(context, feedbackText, alternativesCount);
    }

    return NextResponse.json({
      success: true,
      sectionId,
      refinedContent: result.refinedContent,
      changesSummary: result.changesSummary,
      confidence: result.confidence,
      reasoning: result.reasoning,
      alternatives,
    });
  } catch (error) {
    console.error('Error in refine POST:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
