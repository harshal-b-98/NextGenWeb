/**
 * Workspace Creation API
 *
 * Creates a new workspace for the authenticated user
 *
 * Epic: NextGenWeb Complete Product Reimplementation
 * Phase 1: Foundation
 */

import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
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

    // Parse request body
    const body = await request.json();
    const { name, description } = body;

    if (!name || typeof name !== 'string') {
      return NextResponse.json(
        { error: 'Workspace name is required' },
        { status: 400 }
      );
    }

    // Generate slug
    const slug = name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    // Use the database function to create workspace with owner
    // This function has SECURITY DEFINER and bypasses RLS properly
    const { data: workspaceId, error: createError } = await supabase.rpc(
      'create_workspace_with_owner',
      {
        workspace_name: name.trim(),
        workspace_slug: slug,
        workspace_description: description || null,
      }
    );

    if (createError) {
      console.error('Error creating workspace:', createError);
      return NextResponse.json(
        { error: createError.message || 'Failed to create workspace' },
        { status: 500 }
      );
    }

    // Fetch the created workspace details
    const { data: workspace } = await supabase
      .from('workspaces')
      .select('id, name, slug')
      .eq('id', workspaceId)
      .single();

    return NextResponse.json({
      workspace: workspace || { id: workspaceId, name: name.trim(), slug },
    });
  } catch (error) {
    console.error('Unexpected error creating workspace:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
