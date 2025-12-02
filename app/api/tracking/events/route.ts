/**
 * Events Tracking API
 * Phase 4.2: Runtime Persona Detection
 *
 * Endpoint for batched event processing.
 * This endpoint is public (no auth required) as it's called from visitor websites.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createSessionService, createDetectionService } from '@/lib/tracking';
import type {
  TrackingBatch,
  TrackingBatchResult,
  ClickEvent,
  ScrollRecord,
  TrackingEvent,
} from '@/lib/tracking/types';

/**
 * POST /api/tracking/events
 * Process a batch of tracking events
 */
export async function POST(request: NextRequest) {
  try {
    const body: TrackingBatch = await request.json();

    // Basic validation
    if (!body.sessionId || !body.visitorId || !body.websiteId) {
      return NextResponse.json(
        { error: 'sessionId, visitorId, and websiteId are required' },
        { status: 400 }
      );
    }

    if (!body.events || !Array.isArray(body.events) || body.events.length === 0) {
      return NextResponse.json(
        { error: 'events array is required and must not be empty' },
        { status: 400 }
      );
    }

    const sessionService = createSessionService(body.websiteId);

    // Aggregate events by type for efficient batch update
    const clickEvents: ClickEvent[] = [];
    const scrollRecords: ScrollRecord[] = [];
    const sectionTimes: Record<string, number> = {};
    const navigationPaths: string[] = [];

    let pageViewCount = 0;

    for (const event of body.events) {
      switch (event.type) {
        case 'click':
          clickEvents.push({
            elementId: (event as any).elementId,
            elementType: (event as any).elementType,
            sectionId: (event as any).sectionId,
            pageUrl: event.pageUrl,
            timestamp: event.timestamp,
          });
          break;

        case 'scroll':
          scrollRecords.push({
            pageId: (event as any).pageId || extractPageId(event.pageUrl),
            pageUrl: event.pageUrl,
            maxDepth: (event as any).scrollDepth,
            duration: 0, // Will be calculated from section times
            timestamp: event.timestamp,
          });
          break;

        case 'section_exit':
          const sectionEvent = event as any;
          if (sectionEvent.sectionId && sectionEvent.visibleTime) {
            sectionTimes[sectionEvent.sectionId] =
              (sectionTimes[sectionEvent.sectionId] || 0) + sectionEvent.visibleTime;
          }
          break;

        case 'page_view':
          pageViewCount++;
          navigationPaths.push(event.pageUrl);
          break;
      }
    }

    // Batch update session
    const updateResult = await sessionService.batchUpdateSession(body.sessionId, {
      clicks: clickEvents,
      scrollRecords,
      sectionTimes,
    });

    // Add navigation paths separately
    for (const pageUrl of navigationPaths) {
      await sessionService.addNavigationPage(body.sessionId, pageUrl);
    }

    if (!updateResult.success) {
      console.error('Failed to update session:', updateResult.error);
    }

    // Check if we should trigger detection
    const detectionService = createDetectionService(body.websiteId);
    let detectionTriggered = false;
    let detectedPersonaId: string | undefined;
    let personaConfidence: number | undefined;

    // Get session to check detection status
    const sessionResult = await sessionService.getSession(body.sessionId);

    if (sessionResult.success && sessionResult.data) {
      const session = sessionResult.data;
      const totalClicks = (session.clickHistory?.length || 0) + clickEvents.length;
      const totalPages = (session.navigationPath?.length || 0) + pageViewCount;

      // Calculate time spent from section times
      const totalTime = Object.values(sectionTimes).reduce((a, b) => a + b, 0);

      const shouldDetect = detectionService.shouldTriggerDetection(
        totalClicks,
        totalPages,
        totalTime,
        session.detectedPersonaId ? session.lastActivityAt : undefined
      );

      if (shouldDetect) {
        const detectionResult = await detectionService.detectPersona({
          sessionId: body.sessionId,
          visitorId: body.visitorId,
          websiteId: body.websiteId,
        });

        if (detectionResult.success && detectionResult.data?.personaId) {
          detectionTriggered = true;
          detectedPersonaId = detectionResult.data.personaId;
          personaConfidence = detectionResult.data.confidence;
        }
      }
    }

    const result: TrackingBatchResult = {
      success: true,
      processedEvents: body.events.length,
      detectionTriggered,
      detectedPersonaId,
      personaConfidence,
    };

    // Set CORS headers for cross-origin tracking
    const response = NextResponse.json(result, { status: 200 });

    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type');

    return response;
  } catch (error) {
    console.error('Error processing events:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * OPTIONS /api/tracking/events
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

/**
 * Extract a page ID from URL
 */
function extractPageId(url: string): string {
  try {
    const parsed = new URL(url);
    return parsed.pathname || '/';
  } catch {
    return url;
  }
}
