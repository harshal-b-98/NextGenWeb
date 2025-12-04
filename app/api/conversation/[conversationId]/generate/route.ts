/**
 * Generate Website from Conversation API
 *
 * POST /api/conversation/[conversationId]/generate
 * Triggers website generation from completed discovery conversation
 *
 * Epic: NextGenWeb Complete Product Reimplementation
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { discoveryEngine } from '@/lib/conversation/discovery-engine';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const { conversationId } = await params;

    // Authenticate
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get conversation session
    const { data: session } = await supabase
      .from('conversation_sessions')
      .select('*')
      .eq('id', conversationId)
      .single();

    if (!session) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    // Verify workspace access
    const { data: membership } = await supabase
      .from('workspace_members')
      .select('id')
      .eq('workspace_id', session.workspace_id)
      .eq('user_id', user.id)
      .single();

    if (!membership) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Verify conversation is ready
    if (session.status !== 'active') {
      return NextResponse.json(
        { error: 'Conversation is not active' },
        { status: 400 }
      );
    }

    // Trigger generation using discovery engine
    const result = await discoveryEngine.triggerGeneration(conversationId);

    return NextResponse.json({
      success: true,
      websiteId: result.websiteId,
      message: 'Website generation started',
    });
  } catch (error) {
    console.error('Error generating website:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate website',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
