/**
 * User Workspace API
 *
 * GET /api/user/workspace
 * Returns the current user's workspace (or creates one if needed)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's workspace membership
    const { data: membership } = await supabase
      .from('workspace_members')
      .select('workspace_id, workspaces(*)')
      .eq('user_id', user.id)
      .limit(1)
      .single();

    if (membership && membership.workspace_id) {
      return NextResponse.json({
        workspace: {
          id: membership.workspace_id,
          ...(membership as any).workspaces
        }
      });
    }

    // No workspace found - return null
    return NextResponse.json({ workspace: null });

  } catch (error) {
    console.error('Error fetching user workspace:', error);
    return NextResponse.json(
      { error: 'Failed to fetch workspace' },
      { status: 500 }
    );
  }
}
