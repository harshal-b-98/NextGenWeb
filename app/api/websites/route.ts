/**
 * User Websites API
 *
 * GET /api/websites
 * Returns all websites across all workspaces for the authenticated user
 *
 * This is a convenience endpoint - the canonical route is:
 * /api/workspaces/[workspaceId]/websites
 */

import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's workspaces
    const { data: memberships } = await supabase
      .from('workspace_members')
      .select('workspace_id')
      .eq('user_id', user.id);

    if (!memberships || memberships.length === 0) {
      return NextResponse.json({ websites: [] });
    }

    const workspaceIds = memberships.map((m) => m.workspace_id);

    // Get websites from v2 table (current table)
    const { data: websites, error: websitesError } = await supabase
      .from('websites_v2')
      .select('id, name, domain, status, created_at, updated_at, workspace_id')
      .in('workspace_id', workspaceIds)
      .order('created_at', { ascending: false });

    if (websitesError) {
      console.error('Error fetching websites:', websitesError);
      return NextResponse.json(
        { error: 'Failed to fetch websites' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      websites: websites || [],
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
