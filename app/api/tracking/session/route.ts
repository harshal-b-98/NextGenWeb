/**
 * Session Tracking API
 * Phase 4.2: Runtime Persona Detection
 *
 * Endpoint for initializing and managing visitor sessions.
 * This endpoint is public (no auth required) as it's called from visitor websites.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createSessionService } from '@/lib/tracking';
import type { SessionInitRequest } from '@/lib/tracking/types';

/**
 * POST /api/tracking/session
 * Initialize a new tracking session or retrieve existing one
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Basic validation
    if (!body.websiteId) {
      return NextResponse.json(
        { error: 'websiteId is required' },
        { status: 400 }
      );
    }

    if (!body.pageUrl) {
      return NextResponse.json(
        { error: 'pageUrl is required' },
        { status: 400 }
      );
    }

    const initRequest: SessionInitRequest = {
      websiteId: body.websiteId,
      visitorId: body.visitorId,
      referrerUrl: body.referrerUrl,
      utmSource: body.utmSource,
      utmMedium: body.utmMedium,
      utmCampaign: body.utmCampaign,
      deviceType: body.deviceType,
      browser: body.browser,
      os: body.os,
      pageUrl: body.pageUrl,
    };

    const service = createSessionService(body.websiteId);
    const result = await service.initializeSession(initRequest);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    // Set CORS headers for cross-origin tracking
    const response = NextResponse.json({ data: result.data }, { status: 201 });

    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type');

    return response;
  } catch (error) {
    console.error('Error initializing session:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * OPTIONS /api/tracking/session
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
