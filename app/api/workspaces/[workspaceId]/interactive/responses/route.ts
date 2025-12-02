/**
 * Interactive Responses API
 * Phase 4.1: Interactive Elements System
 *
 * Endpoints for interactive element responses
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createResponseService, createInteractiveEngine, createElementService } from '@/lib/interactive';

interface RouteParams {
  params: Promise<{ workspaceId: string }>;
}

/**
 * GET /api/workspaces/[workspaceId]/interactive/responses
 * List responses
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { workspaceId } = await params;
    const supabase = await createClient();

    // Verify user has access to workspace
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: membership, error: memberError } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', workspaceId)
      .eq('user_id', user.id)
      .single();

    if (memberError || !membership) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const elementId = searchParams.get('elementId') || undefined;
    const websiteId = searchParams.get('websiteId') || undefined;
    const visitorId = searchParams.get('visitorId') || undefined;
    const sessionId = searchParams.get('sessionId') || undefined;
    const completed = searchParams.get('completed')
      ? searchParams.get('completed') === 'true'
      : undefined;
    const startDate = searchParams.get('startDate') || undefined;
    const endDate = searchParams.get('endDate') || undefined;
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined;
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : undefined;

    const service = createResponseService(workspaceId);
    const result = await service.listResponses({
      elementId,
      websiteId,
      visitorId,
      sessionId,
      completed,
      startDate,
      endDate,
      limit,
      offset,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ data: result.data });
  } catch (error) {
    console.error('Error listing responses:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/workspaces/[workspaceId]/interactive/responses
 * Submit a response to an interactive element
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { workspaceId } = await params;
    const body = await request.json();

    // Basic validation
    if (!body.elementId || !body.websiteId || !body.visitorId || !body.sessionId) {
      return NextResponse.json(
        { error: 'Missing required fields: elementId, websiteId, visitorId, sessionId' },
        { status: 400 }
      );
    }

    // Get the element to process the response
    const elementService = createElementService(workspaceId);
    const elementResult = await elementService.getElement(body.elementId);

    if (!elementResult.success || !elementResult.data) {
      return NextResponse.json({ error: 'Element not found' }, { status: 404 });
    }

    // Process response through engine
    let processedResults: Record<string, unknown> | undefined;
    try {
      const engine = createInteractiveEngine(elementResult.data);
      const processResult = engine.processResponse({
        id: '',
        elementId: body.elementId,
        websiteId: body.websiteId,
        visitorId: body.visitorId,
        sessionId: body.sessionId,
        responses: body.responses || {},
        completed: body.completed || false,
        completionPercentage: body.completionPercentage || 0,
        startedAt: new Date().toISOString(),
        timeSpentSeconds: body.timeSpentSeconds || 0,
        deviceType: body.deviceType || 'desktop',
      });

      if (processResult.success && processResult.data) {
        processedResults = processResult.data as Record<string, unknown>;
      }
    } catch (engineError) {
      console.error('Engine processing error:', engineError);
      // Continue without processed results if engine fails
    }

    // Store the response
    const responseService = createResponseService(workspaceId);
    const result = await responseService.submitResponse(
      {
        elementId: body.elementId,
        websiteId: body.websiteId,
        visitorId: body.visitorId,
        sessionId: body.sessionId,
        pageUrl: body.pageUrl,
        responses: body.responses || {},
        completed: body.completed,
        timeSpentSeconds: body.timeSpentSeconds || 0,
        deviceType: body.deviceType,
        userAgent: body.userAgent,
        referrer: body.referrer,
        utmSource: body.utmSource,
        utmMedium: body.utmMedium,
        utmCampaign: body.utmCampaign,
        email: body.email,
        name: body.name,
        phone: body.phone,
        company: body.company,
        customFields: body.customFields,
      },
      processedResults
    );

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json(
      {
        data: result.data,
        results: processedResults,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error submitting response:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
