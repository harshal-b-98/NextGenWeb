/**
 * Chat API Route
 * Phase 4.4: AI-Powered Conversational Interface
 *
 * Public API endpoint for chat interactions on generated websites.
 * Handles message sending, history retrieval, and streaming responses.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getChatEngine } from '@/lib/interactive/chat/index.server';
import { SendMessageRequestSchema } from '@/lib/interactive/chat';

// Enable CORS for public websites
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-Session-ID',
};

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * OPTIONS - CORS preflight
 */
export async function OPTIONS() {
  return new NextResponse(null, { headers: corsHeaders });
}

/**
 * POST - Send a message and get AI response
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request
    const parseResult = SendMessageRequestSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: 'Invalid request',
          details: parseResult.error.flatten(),
        },
        { status: 400, headers: corsHeaders }
      );
    }

    const chatEngine = getChatEngine();
    // Transform nullish values to undefined for type compatibility
    const requestData = {
      websiteId: parseResult.data.websiteId,
      message: parseResult.data.message,
      sessionId: parseResult.data.sessionId ?? undefined,
      sectionContext: parseResult.data.sectionContext ?? undefined,
      personaHint: parseResult.data.personaHint ?? undefined,
      adaptationHints: parseResult.data.adaptationHints ?? undefined,
    };
    const response = await chatEngine.processMessage(requestData);

    return NextResponse.json(response, { headers: corsHeaders });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      {
        error: 'Failed to process message',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500, headers: corsHeaders }
    );
  }
}

/**
 * GET - Get chat history for a session
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    if (!sessionId) {
      return NextResponse.json(
        { error: 'sessionId is required' },
        { status: 400, headers: corsHeaders }
      );
    }

    const chatEngine = getChatEngine();
    const messages = await chatEngine.getHistory(sessionId, limit);

    return NextResponse.json(
      {
        messages,
        sessionId,
        hasMore: messages.length === limit,
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error('Chat history error:', error);
    return NextResponse.json(
      { error: 'Failed to get chat history' },
      { status: 500, headers: corsHeaders }
    );
  }
}
