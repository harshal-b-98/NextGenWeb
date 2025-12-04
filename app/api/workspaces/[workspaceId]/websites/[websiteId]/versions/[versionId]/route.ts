/**
 * Individual Version API Routes
 *
 * GET    /api/workspaces/[workspaceId]/websites/[websiteId]/versions/[versionId]
 *        Get specific version details with full page information
 *
 * PATCH  /api/workspaces/[workspaceId]/websites/[websiteId]/versions/[versionId]
 *        Switch to this version (make it active)
 *
 * DELETE /api/workspaces/[workspaceId]/websites/[websiteId]/versions/[versionId]
 *        Archive a version (soft delete)
 *
 * Epic #146: Interactive Website Feedback & Refinement System
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  getVersionById,
  switchToVersion,
} from '@/lib/versions/website-version-manager';
import { z } from 'zod';

// ============================================================================
// Request Schemas
// ============================================================================

const SwitchVersionSchema = z.object({
  action: z.literal('switch'),
});

// ============================================================================
// GET - Get Version Details
// ============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string; websiteId: string; versionId: string }> }
) {
  try {
    const { workspaceId, websiteId, versionId } = await params;

    // Authenticate user
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify workspace access
    const { data: membership } = await supabase
      .from('workspace_members')
      .select('id')
      .eq('workspace_id', workspaceId)
      .eq('user_id', user.id)
      .single();

    if (!membership) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Verify website belongs to workspace
    const { data: website } = await supabase
      .from('websites')
      .select('id')
      .eq('id', websiteId)
      .eq('workspace_id', workspaceId)
      .single();

    if (!website) {
      return NextResponse.json({ error: 'Website not found' }, { status: 404 });
    }

    // Get version details
    const { version, error } = await getVersionById(versionId);

    if (error || !version) {
      return NextResponse.json(
        { error: error || 'Version not found' },
        { status: 404 }
      );
    }

    // Verify version belongs to this website
    if (version.website_id !== websiteId) {
      return NextResponse.json({ error: 'Version not found' }, { status: 404 });
    }

    return NextResponse.json({ version });
  } catch (error) {
    console.error('Unexpected error in GET /versions/[versionId]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ============================================================================
// PATCH - Switch to Version
// ============================================================================

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string; websiteId: string; versionId: string }> }
) {
  try {
    const { workspaceId, websiteId, versionId } = await params;

    // Authenticate user
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify workspace access
    const { data: membership } = await supabase
      .from('workspace_members')
      .select('id')
      .eq('workspace_id', workspaceId)
      .eq('user_id', user.id)
      .single();

    if (!membership) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Verify website belongs to workspace
    const { data: website } = await supabase
      .from('websites')
      .select('id')
      .eq('id', websiteId)
      .eq('workspace_id', workspaceId)
      .single();

    if (!website) {
      return NextResponse.json({ error: 'Website not found' }, { status: 404 });
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = SwitchVersionSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: validationResult.error.format() },
        { status: 400 }
      );
    }

    // Switch to this version
    const { success, error } = await switchToVersion(websiteId, versionId);

    if (!success || error) {
      console.error('Error switching version:', error);
      return NextResponse.json(
        { error: error || 'Failed to switch version' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Successfully switched to version',
      versionId,
    });
  } catch (error) {
    console.error('Unexpected error in PATCH /versions/[versionId]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ============================================================================
// DELETE - Archive Version
// ============================================================================

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string; websiteId: string; versionId: string }> }
) {
  try {
    const { workspaceId, websiteId, versionId } = await params;

    // Authenticate user
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify workspace access
    const { data: membership } = await supabase
      .from('workspace_members')
      .select('id')
      .eq('workspace_id', workspaceId)
      .eq('user_id', user.id)
      .single();

    if (!membership) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Verify website belongs to workspace
    const { data: website } = await supabase
      .from('websites')
      .select('id, draft_version_id, production_version_id')
      .eq('id', websiteId)
      .eq('workspace_id', workspaceId)
      .single();

    if (!website) {
      return NextResponse.json({ error: 'Website not found' }, { status: 404 });
    }

    // Prevent deletion of current draft or production version
    if (versionId === website.draft_version_id) {
      return NextResponse.json(
        { error: 'Cannot delete current draft version' },
        { status: 400 }
      );
    }

    if (versionId === website.production_version_id) {
      return NextResponse.json(
        { error: 'Cannot delete current production version' },
        { status: 400 }
      );
    }

    // Delete the version
    const { error } = await supabase
      .from('website_versions')
      .delete()
      .eq('id', versionId)
      .eq('website_id', websiteId);

    if (error) {
      console.error('Error deleting version:', error);
      return NextResponse.json({ error: 'Failed to delete version' }, { status: 500 });
    }

    return NextResponse.json({
      message: 'Version deleted successfully',
    });
  } catch (error) {
    console.error('Unexpected error in DELETE /versions/[versionId]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
