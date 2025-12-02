/**
 * Leads API
 * Phase 4.4: Conversion & Lead Tools
 *
 * Public endpoint for capturing leads and authenticated endpoint for listing.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { untypedFrom } from '@/lib/supabase/untyped';
import {
  createLeadCaptureService,
  createNotificationService,
} from '@/lib/leads';
import type { LeadCaptureInput, NotificationConfig } from '@/lib/leads/types';

/**
 * POST /api/leads
 * Capture a new lead (public endpoint)
 */
export async function POST(request: NextRequest) {
  try {
    const input: LeadCaptureInput = await request.json();

    // Basic validation
    if (!input.websiteId || !input.email) {
      return NextResponse.json(
        { success: false, error: 'Website ID and email are required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(input.email)) {
      return NextResponse.json(
        { success: false, error: 'Invalid email format' },
        { status: 400 }
      );
    }

    const leadService = createLeadCaptureService();
    const result = await leadService.captureLead(input);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    // Get form configuration for notifications
    if (input.sourceComponent) {
      try {
        await sendNotifications(result.leadId!, input);
      } catch (notifError) {
        console.error('Notification error:', notifError);
        // Don't fail the lead capture if notification fails
      }
    }

    // Get thank you page URL if configured
    let thankYouPageUrl: string | undefined;
    if (input.sourceComponent) {
      const table = await untypedFrom('lead_capture_forms');
      const { data: form } = await table
        .select('thank_you_page_id, redirect_url')
        .eq('id', input.sourceComponent)
        .single();

      const formData = form as { thank_you_page_id?: string; redirect_url?: string } | null;
      if (formData?.redirect_url) {
        thankYouPageUrl = formData.redirect_url;
      } else if (formData?.thank_you_page_id) {
        thankYouPageUrl = `/thank-you/${formData.thank_you_page_id}`;
      }
    }

    // Set CORS headers for public endpoint
    const response = NextResponse.json(
      {
        success: true,
        leadId: result.leadId,
        thankYouPageUrl,
        message: result.message,
      },
      { status: 201 }
    );

    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type');

    return response;
  } catch (error) {
    console.error('Error capturing lead:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/leads
 * List leads (authenticated endpoint)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Verify authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const websiteId = searchParams.get('websiteId');
    const workspaceId = searchParams.get('workspaceId');
    const pageId = searchParams.get('pageId');
    const personaId = searchParams.get('personaId');
    const source = searchParams.get('source');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const email = searchParams.get('email');
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '50');

    const leadService = createLeadCaptureService();
    const result = await leadService.getLeads({
      websiteId: websiteId || undefined,
      workspaceId: workspaceId || undefined,
      pageId: pageId || undefined,
      personaId: personaId || undefined,
      source: source || undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      email: email || undefined,
      page,
      pageSize,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching leads:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * OPTIONS /api/leads
 * Handle CORS preflight
 */
export async function OPTIONS() {
  const response = new NextResponse(null, { status: 204 });

  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
  response.headers.set('Access-Control-Max-Age', '86400');

  return response;
}

/**
 * Send notifications for a captured lead
 */
async function sendNotifications(
  leadId: string,
  input: LeadCaptureInput
): Promise<void> {
  // Get form configuration using untyped table helper
  const table = await untypedFrom('lead_capture_forms');
  const { data: form } = await table
    .select('notifications')
    .eq('id', input.sourceComponent)
    .single();

  const formData = form as { notifications?: unknown } | null;
  if (!formData?.notifications) {
    return;
  }

  const notificationConfig = formData.notifications as NotificationConfig;

  // Get the captured lead data
  const leadService = createLeadCaptureService();
  const lead = await leadService.getLead(leadId);

  if (!lead) {
    return;
  }

  // Send notifications
  const notificationService = createNotificationService();
  await notificationService.notifyLeadCapture(lead, notificationConfig);
}
