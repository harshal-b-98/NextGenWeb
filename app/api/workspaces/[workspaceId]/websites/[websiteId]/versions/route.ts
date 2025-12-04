/**
 * Website Versions API Routes
 *
 * GET  /api/workspaces/[workspaceId]/websites/[websiteId]/versions
 *      List all versions for a website with optional filtering
 *
 * POST /api/workspaces/[workspaceId]/websites/[websiteId]/versions
 *      Create a new version snapshot
 *
 * Epic #146: Interactive Website Feedback & Refinement System
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  createWebsiteVersion,
  getWebsiteVersions,
  type CreateVersionParams,
} from '@/lib/versions/website-version-manager';
import { z } from 'zod';

// ============================================================================
// Request Schemas
// ============================================================================

const CreateVersionSchema = z.object({
  versionName: z.string().max(200).optional(),
  description: z.string().optional(),
  triggerType: z.enum(['initial', 'feedback', 'rollback', 'manual', 'finalization']).optional(),
});

const ListVersionsQuerySchema = z.object({
  status: z.enum(['draft', 'production']).optional(),
  limit: z.coerce.number().min(1).max(100).optional().default(20),
  offset: z.coerce.number().min(0).optional().default(0),
});

// ============================================================================
// GET - List Versions
// ============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string; websiteId: string }> }
) {
  try {
    const { workspaceId, websiteId } = await params;

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

    // Parse query parameters
    const searchParams = Object.fromEntries(request.nextUrl.searchParams);
    const queryResult = ListVersionsQuerySchema.safeParse(searchParams);

    if (!queryResult.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: queryResult.error.format() },
        { status: 400 }
      );
    }

    const { status, limit, offset } = queryResult.data;

    // Get versions
    const { versions, error } = await getWebsiteVersions(websiteId, {
      status,
      limit,
      offset,
    });

    if (error) {
      console.error('Error fetching versions:', error);
      return NextResponse.json({ error: 'Failed to fetch versions' }, { status: 500 });
    }

    return NextResponse.json({
      versions,
      pagination: {
        limit,
        offset,
        total: versions?.length || 0,
      },
    });
  } catch (error) {
    console.error('Unexpected error in GET /versions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ============================================================================
// POST - Create Version
// ============================================================================

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string; websiteId: string }> }
) {
  try {
    const { workspaceId, websiteId } = await params;

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
      .select('id, name')
      .eq('id', websiteId)
      .eq('workspace_id', workspaceId)
      .single();

    if (!website) {
      return NextResponse.json({ error: 'Website not found' }, { status: 404 });
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = CreateVersionSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: validationResult.error.format() },
        { status: 400 }
      );
    }

    const { versionName, description, triggerType } = validationResult.data;

    // Create version snapshot
    const versionParams: CreateVersionParams = {
      websiteId,
      versionName,
      description,
      triggerType: triggerType || 'manual',
      createdBy: user.id,
    };

    const { version, error } = await createWebsiteVersion(versionParams);

    if (error || !version) {
      console.error('Error creating version:', error);
      return NextResponse.json(
        { error: error || 'Failed to create version' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        message: 'Version created successfully',
        version,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Unexpected error in POST /versions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
