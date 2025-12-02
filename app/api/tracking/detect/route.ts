/**
 * Detection API
 * Phase 4.2: Runtime Persona Detection
 *
 * Endpoint for manually triggering persona detection.
 * This endpoint is public (no auth required) as it's called from visitor websites.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createDetectionService } from '@/lib/tracking';
import type { DetectionRequest } from '@/lib/tracking/types';

/**
 * POST /api/tracking/detect
 * Trigger persona detection for a session
 */
export async function POST(request: NextRequest) {
  try {
    const body: DetectionRequest = await request.json();

    // Basic validation
    if (!body.sessionId || !body.visitorId || !body.websiteId) {
      return NextResponse.json(
        { error: 'sessionId, visitorId, and websiteId are required' },
        { status: 400 }
      );
    }

    const service = createDetectionService(body.websiteId);
    const result = await service.detectPersona({
      sessionId: body.sessionId,
      visitorId: body.visitorId,
      websiteId: body.websiteId,
      forceDetection: body.forceDetection,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    // Set CORS headers for cross-origin tracking
    const response = NextResponse.json({ data: result.data }, { status: 200 });

    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type');

    return response;
  } catch (error) {
    console.error('Error triggering detection:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * OPTIONS /api/tracking/detect
 * Handle CORS preflight requests
 */
export async function OPTIONS() {
  const response = new NextResponse(null, { status: 204 });

  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
  response.headers.set('Access-Control-Max-Age', '86400');

  return response;
}
