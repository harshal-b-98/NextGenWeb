/**
 * Site Feedback API
 * Phase 7: Knowledge-Grounded Website Generation
 *
 * Handles feedback submissions from public site visitors.
 * Stores feedback for later review and improvement of website content.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

// =============================================================================
// VALIDATION SCHEMAS
// =============================================================================

const FeedbackSchema = z.object({
  type: z.enum(['general', 'content', 'design', 'bug']),
  rating: z.number().min(1).max(5).optional(),
  sentiment: z.enum(['positive', 'negative', 'neutral']).optional(),
  message: z.string().min(1).max(5000),
  pagePath: z.string().max(500),
  sectionId: z.string().optional(),
  workspaceId: z.string().uuid(),
});

// =============================================================================
// ROUTE HANDLER
// =============================================================================

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ websiteId: string }> }
) {
  try {
    const { websiteId } = await params;
    const supabase = await createClient();

    // Parse and validate input
    const body = await request.json();
    const parseResult = FeedbackSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parseResult.error.format() },
        { status: 400 }
      );
    }

    const feedback = parseResult.data;

    // Verify website exists
    const { data: website, error: websiteError } = await supabase
      .from('websites')
      .select('id, workspace_id')
      .eq('id', websiteId)
      .single();

    if (websiteError || !website) {
      return NextResponse.json(
        { error: 'Website not found' },
        { status: 404 }
      );
    }

    // Verify workspace matches
    if (website.workspace_id !== feedback.workspaceId) {
      return NextResponse.json(
        { error: 'Workspace mismatch' },
        { status: 400 }
      );
    }

    // Store feedback in activity_feed table
    const { untypedFrom } = await import('@/lib/supabase/untyped');
    const activityTable = await untypedFrom('activity_feed');

    const { error: insertError } = await activityTable.insert({
      workspace_id: feedback.workspaceId,
      event_type: 'site_feedback',
      event_data: {
        websiteId,
        type: feedback.type,
        rating: feedback.rating,
        sentiment: feedback.sentiment,
        message: feedback.message,
        pagePath: feedback.pagePath,
        sectionId: feedback.sectionId,
        submittedAt: new Date().toISOString(),
        userAgent: request.headers.get('user-agent') || 'unknown',
      },
      created_by: null, // Anonymous feedback
    });

    if (insertError) {
      console.error('Error storing feedback:', insertError);
      return NextResponse.json(
        { error: 'Failed to store feedback' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Feedback submitted successfully',
    });

  } catch (error) {
    console.error('Error submitting feedback:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to submit feedback' },
      { status: 500 }
    );
  }
}

// =============================================================================
// GET - Retrieve feedback for a website (admin only)
// =============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ websiteId: string }> }
) {
  try {
    const { websiteId } = await params;
    const supabase = await createClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get website and verify access
    const { data: website } = await supabase
      .from('websites')
      .select('id, workspace_id')
      .eq('id', websiteId)
      .single();

    if (!website) {
      return NextResponse.json(
        { error: 'Website not found' },
        { status: 404 }
      );
    }

    // Verify user is member of workspace
    const { data: member } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', website.workspace_id)
      .eq('user_id', user.id)
      .single();

    if (!member) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Fetch feedback from activity_feed
    const { untypedFrom } = await import('@/lib/supabase/untyped');
    const activityTable = await untypedFrom('activity_feed');

    const { data: feedback, error: fetchError } = await activityTable
      .select('*')
      .eq('workspace_id', website.workspace_id)
      .eq('event_type', 'site_feedback')
      .order('created_at', { ascending: false })
      .limit(100);

    if (fetchError) {
      console.error('Error fetching feedback:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch feedback' },
        { status: 500 }
      );
    }

    // Filter to only this website's feedback
    const websiteFeedback = (feedback || []).filter(
      (f: { event_data?: { websiteId?: string } }) => f.event_data?.websiteId === websiteId
    );

    return NextResponse.json({
      success: true,
      feedback: websiteFeedback,
      total: websiteFeedback.length,
    });

  } catch (error) {
    console.error('Error fetching feedback:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch feedback' },
      { status: 500 }
    );
  }
}
