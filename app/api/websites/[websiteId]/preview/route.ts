/**
 * Website Preview API
 *
 * GET /api/websites/[websiteId]/preview
 * Returns the current version snapshot for preview rendering
 *
 * Epic: NextGenWeb Complete Product Reimplementation
 * Phase 2: Preview Studio
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ websiteId: string }> }
) {
  try {
    const { websiteId } = await params;
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get website
    const { data: website, error: websiteError } = await supabase
      .from('websites_v2')
      .select('*, workspace_id, current_version_id')
      .eq('id', websiteId)
      .single();

    if (websiteError || !website) {
      return NextResponse.json({ error: 'Website not found' }, { status: 404 });
    }

    // Verify workspace access
    const { data: membership } = await supabase
      .from('workspace_members')
      .select('id')
      .eq('workspace_id', website.workspace_id)
      .eq('user_id', user.id)
      .single();

    if (!membership) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get current version snapshot
    if (website.current_version_id) {
      const { data: version } = await supabase
        .from('website_versions_v2')
        .select('snapshot')
        .eq('id', website.current_version_id)
        .single();

      if (version && version.snapshot) {
        return NextResponse.json({
          snapshot: version.snapshot,
          websiteId: website.id,
          versionId: website.current_version_id,
        });
      }
    }

    // No version yet - return empty state
    return NextResponse.json({
      snapshot: null,
      websiteId: website.id,
      message: 'Website is being generated',
    });
  } catch (error) {
    console.error('Error fetching preview:', error);
    return NextResponse.json(
      { error: 'Failed to fetch preview' },
      { status: 500 }
    );
  }
}
