/**
 * Start Conversation API
 *
 * POST /api/conversation/start
 * Initiates a new discovery conversation for website creation
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

const StartConversationSchema = z.object({
  workspaceId: z.string().uuid(),
  type: z.enum(['discovery', 'refinement']).default('discovery'),
});

// ============================================================================
// POST - Start Conversation
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
    const validation = StartConversationSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validation.error },
        { status: 400 }
      );
    }

    const { workspaceId, type } = validation.data;

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

    // Start discovery conversation
    const result = await discoveryEngine.startDiscovery(workspaceId);

    return NextResponse.json({
      session: result.session,
      understanding: result.understandingSummary,
      firstQuestion: result.firstQuestion,
    });
  } catch (error) {
    console.error('Error starting conversation:', error);
    return NextResponse.json(
      {
        error: 'Failed to start conversation',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
