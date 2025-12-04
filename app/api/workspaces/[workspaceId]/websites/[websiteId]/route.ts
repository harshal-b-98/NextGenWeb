/**
 * Website Detail API
 * Phase 5.1: Admin Dashboard
 *
 * Individual website operations: GET, PUT, DELETE
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import type { WebsiteStatus } from '@/types/database';

/**
 * Website update schema
 */
const WebsiteUpdateSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/).optional(),
  domain: z.string().nullable().optional(),
  status: z.enum(['draft', 'generating', 'published', 'archived']).optional(),
  settings: z.record(z.string(), z.unknown()).optional(),
  brand_config: z.record(z.string(), z.unknown()).optional(),
});

/**
 * GET /api/workspaces/[workspaceId]/websites/[websiteId]
 * Get website details with pages
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string; websiteId: string }> }
) {
  try {
    const { workspaceId, websiteId } = await params;
    const supabase = await createClient();

    // Verify authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check workspace membership
    const { data: membership } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', workspaceId)
      .eq('user_id', user.id)
      .single();

    if (!membership) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Fetch website with pages including layout information
    const { data: website, error } = await supabase
      .from('websites')
      .select(`
        *,
        pages (
          id,
          title,
          slug,
          is_homepage,
          layout_status,
          layout_generated_at,
          content,
          created_at,
          updated_at
        )
      `)
      .eq('id', websiteId)
      .eq('workspace_id', workspaceId)
      .single();

    if (error || !website) {
      return NextResponse.json(
        { error: 'Website not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      website,
    });
  } catch (error) {
    console.error('Error fetching website:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/workspaces/[workspaceId]/websites/[websiteId]
 * Update website details
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string; websiteId: string }> }
) {
  try {
    const { workspaceId, websiteId } = await params;
    const supabase = await createClient();

    // Verify authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check workspace membership with edit permissions
    const { data: membership } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', workspaceId)
      .eq('user_id', user.id)
      .single();

    if (!membership || !['owner', 'admin', 'editor'].includes(membership.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Parse and validate request body
    const body = await request.json();
    const validation = WebsiteUpdateSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error.issues },
        { status: 400 }
      );
    }

    const updates = validation.data;

    // If slug is being updated, check uniqueness
    if (updates.slug) {
      const { data: existingWebsite } = await supabase
        .from('websites')
        .select('id')
        .eq('workspace_id', workspaceId)
        .eq('slug', updates.slug)
        .neq('id', websiteId)
        .single();

      if (existingWebsite) {
        return NextResponse.json(
          { error: 'A website with this slug already exists' },
          { status: 409 }
        );
      }
    }

    // Build update object
    const updateData: Record<string, unknown> = {};
    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.slug !== undefined) updateData.slug = updates.slug;
    if (updates.domain !== undefined) updateData.domain = updates.domain;
    if (updates.status !== undefined) {
      updateData.status = updates.status as WebsiteStatus;
      // Set published_at when publishing
      if (updates.status === 'published') {
        updateData.published_at = new Date().toISOString();
      }
    }
    if (updates.settings !== undefined) updateData.settings = updates.settings;
    if (updates.brand_config !== undefined) updateData.brand_config = updates.brand_config;

    // Update the website
    const { data: website, error } = await supabase
      .from('websites')
      .update(updateData)
      .eq('id', websiteId)
      .eq('workspace_id', workspaceId)
      .select()
      .single();

    if (error) {
      console.error('Error updating website:', error);
      return NextResponse.json(
        { error: 'Failed to update website' },
        { status: 500 }
      );
    }

    if (!website) {
      return NextResponse.json(
        { error: 'Website not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      website,
    });
  } catch (error) {
    console.error('Error in website PUT:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/workspaces/[workspaceId]/websites/[websiteId]
 * Delete a website and all its pages
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string; websiteId: string }> }
) {
  try {
    const { workspaceId, websiteId } = await params;
    const supabase = await createClient();

    // Verify authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check workspace membership with delete permissions (owner/admin only)
    const { data: membership } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', workspaceId)
      .eq('user_id', user.id)
      .single();

    if (!membership || !['owner', 'admin'].includes(membership.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Delete the website (cascades to pages due to FK constraint)
    const { error } = await supabase
      .from('websites')
      .delete()
      .eq('id', websiteId)
      .eq('workspace_id', workspaceId);

    if (error) {
      console.error('Error deleting website:', error);
      return NextResponse.json(
        { error: 'Failed to delete website' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Website deleted successfully',
    });
  } catch (error) {
    console.error('Error in website DELETE:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
