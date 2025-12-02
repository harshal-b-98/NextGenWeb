/**
 * Runtime Page Data API
 * Phase 4.3: Dynamic Page Runtime
 *
 * Public endpoint for fetching page data for runtime rendering.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createPageService } from '@/lib/runtime/page-service';

interface RouteParams {
  params: Promise<{ websiteSlug: string; pageSlug: string }>;
}

/**
 * GET /api/runtime/pages/[websiteSlug]/[pageSlug]
 * Get page data for runtime rendering
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { websiteSlug, pageSlug } = await params;

    const service = createPageService();
    const result = await service.getPageBySlug(websiteSlug, pageSlug);

    if (!result.success || !result.data) {
      return NextResponse.json(
        { success: false, error: result.error || 'Page not found' },
        { status: 404 }
      );
    }

    // Set CORS headers for cross-origin access
    const response = NextResponse.json(
      { success: true, data: result.data },
      { status: 200 }
    );

    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
    response.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');

    return response;
  } catch (error) {
    console.error('Error fetching page data:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * OPTIONS /api/runtime/pages/[websiteSlug]/[pageSlug]
 * Handle CORS preflight
 */
export async function OPTIONS() {
  const response = new NextResponse(null, { status: 204 });

  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
  response.headers.set('Access-Control-Max-Age', '86400');

  return response;
}
