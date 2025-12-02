/**
 * Page Detail API
 * Phase 5.1: Admin Dashboard
 *
 * Individual page operations: GET, PUT, DELETE
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

/**
 * Page update schema
 */
const PageUpdateSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/).optional(),
  is_homepage: z.boolean().optional(),
  content: z.record(z.string(), z.unknown()).optional(),
});

/**
 * GET /api/workspaces/[workspaceId]/websites/[websiteId]/pages/[pageId]
 * Get page details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string; websiteId: string; pageId: string }> }
) {
  try {
    const { workspaceId, websiteId, pageId } = await params;
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

    // Fetch page
    const { data: page, error } = await supabase
      .from('pages')
      .select('*')
      .eq('id', pageId)
      .eq('website_id', websiteId)
      .single();

    if (error || !page) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      page,
    });
  } catch (error) {
    console.error('Error fetching page:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/workspaces/[workspaceId]/websites/[websiteId]/pages/[pageId]
 * Update page details
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string; websiteId: string; pageId: string }> }
) {
  try {
    const { workspaceId, websiteId, pageId } = await params;
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
    const validation = PageUpdateSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error.issues },
        { status: 400 }
      );
    }

    const updates = validation.data;

    // If slug is being updated, check uniqueness
    if (updates.slug) {
      const { data: existingPage } = await supabase
        .from('pages')
        .select('id')
        .eq('website_id', websiteId)
        .eq('slug', updates.slug)
        .neq('id', pageId)
        .single();

      if (existingPage) {
        return NextResponse.json(
          { error: 'A page with this slug already exists' },
          { status: 409 }
        );
      }
    }

    // If setting as homepage, unset other homepage first
    if (updates.is_homepage === true) {
      await supabase
        .from('pages')
        .update({ is_homepage: false })
        .eq('website_id', websiteId)
        .eq('is_homepage', true);
    }

    // Build update data with proper types
    const updateData: Record<string, unknown> = {};
    if (updates.title !== undefined) updateData.title = updates.title;
    if (updates.slug !== undefined) updateData.slug = updates.slug;
    if (updates.is_homepage !== undefined) updateData.is_homepage = updates.is_homepage;
    if (updates.content !== undefined) updateData.content = updates.content;

    // Update the page
    const { data: page, error } = await supabase
      .from('pages')
      .update(updateData)
      .eq('id', pageId)
      .eq('website_id', websiteId)
      .select()
      .single();

    if (error) {
      console.error('Error updating page:', error);
      return NextResponse.json(
        { error: 'Failed to update page' },
        { status: 500 }
      );
    }

    if (!page) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      page,
    });
  } catch (error) {
    console.error('Error in page PUT:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/workspaces/[workspaceId]/websites/[websiteId]/pages/[pageId]
 * Delete a page
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string; websiteId: string; pageId: string }> }
) {
  try {
    const { workspaceId, websiteId, pageId } = await params;
    const supabase = await createClient();

    // Verify authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check workspace membership with delete permissions
    const { data: membership } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', workspaceId)
      .eq('user_id', user.id)
      .single();

    if (!membership || !['owner', 'admin', 'editor'].includes(membership.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
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

    // Delete the page
    const { error } = await supabase
      .from('pages')
      .delete()
      .eq('id', pageId)
      .eq('website_id', websiteId);

    if (error) {
      console.error('Error deleting page:', error);
      return NextResponse.json(
        { error: 'Failed to delete page' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Page deleted successfully',
    });
  } catch (error) {
    console.error('Error in page DELETE:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
