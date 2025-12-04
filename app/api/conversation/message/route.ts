/**
 * Conversation Message API
 *
 * POST /api/conversation/message
 * Process user message and continue discovery conversation
 *
 * Epic: NextGenWeb Complete Product Reimplementation
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { discoveryEngine } from '@/lib/conversation/discovery-engine';
import { z } from 'zod';

// ============================================================================
// Request Schema
// ============================================================================

const MessageSchema = z.object({
  sessionId: z.string().uuid(),
  message: z.string().min(1).max(2000),
});

// ============================================================================
// POST - Send Message
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    // Authenticate
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request
    const body = await request.json();
    const validation = MessageSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validation.error },
        { status: 400 }
      );
    }

    const { sessionId, message } = validation.data;

    // Verify session access
    const { data: session } = await supabase
      .from('conversation_sessions')
      .select('workspace_id, status')
      .eq('id', sessionId)
      .single();

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    if (session.status !== 'active') {
      return NextResponse.json(
        { error: 'Conversation is not active' },
        { status: 400 }
      );
    }

    const { data: membership } = await supabase
      .from('workspace_members')
      .select('id')
      .eq('workspace_id', session.workspace_id)
      .eq('user_id', user.id)
      .single();

    if (!membership) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Process message
    const response = await discoveryEngine.processUserResponse(sessionId, message);

    return NextResponse.json({
      message: response.message,
      question: response.question,
      readyToGenerate: response.readyToGenerate,
      context: response.context,
    });
  } catch (error) {
    console.error('Error processing message:', error);
    return NextResponse.json(
      {
        error: 'Failed to process message',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
