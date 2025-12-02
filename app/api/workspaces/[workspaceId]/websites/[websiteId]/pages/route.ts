/**
 * Website Pages API
 * Phase 5.1: Admin Dashboard
 *
 * CRUD operations for pages within a website.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

/**
 * Page creation schema
 */
const PageSchema = z.object({
  title: z.string().min(1).max(255),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/),
  is_homepage: z.boolean().optional().default(false),
  content: z.record(z.string(), z.unknown()).optional(),
});

/**
 * GET /api/workspaces/[workspaceId]/websites/[websiteId]/pages
 * List all pages for a website
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

    // Verify website belongs to workspace
    const { data: website } = await supabase
      .from('websites')
      .select('id')
      .eq('id', websiteId)
      .eq('workspace_id', workspaceId)
      .single();

    if (!website) {
      return NextResponse.json(
        { error: 'Website not found' },
        { status: 404 }
      );
    }

    // Fetch pages
    const { data: pages, error } = await supabase
      .from('pages')
      .select('id, title, slug, is_homepage, created_at, updated_at')
      .eq('website_id', websiteId)
      .order('is_homepage', { ascending: false })
      .order('title', { ascending: true });

    if (error) {
      console.error('Error fetching pages:', error);
      return NextResponse.json(
        { error: 'Failed to fetch pages' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      pages: pages || [],
    });
  } catch (error) {
    console.error('Error in pages GET:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/workspaces/[workspaceId]/websites/[websiteId]/pages
 * Create a new page
 */
export async function POST(
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

    // Verify website belongs to workspace
    const { data: website } = await supabase
      .from('websites')
      .select('id')
      .eq('id', websiteId)
      .eq('workspace_id', workspaceId)
      .single();

    if (!website) {
      return NextResponse.json(
        { error: 'Website not found' },
        { status: 404 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validation = PageSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error.issues },
        { status: 400 }
      );
    }

    const { title, slug, is_homepage, content } = validation.data;

    // Check if slug is unique within website
    const { data: existingPage } = await supabase
      .from('pages')
      .select('id')
      .eq('website_id', websiteId)
      .eq('slug', slug)
      .single();

    if (existingPage) {
      return NextResponse.json(
        { error: 'A page with this slug already exists' },
        { status: 409 }
      );
    }

    // If setting as homepage, unset other homepage first
    if (is_homepage) {
      await supabase
        .from('pages')
        .update({ is_homepage: false })
        .eq('website_id', websiteId)
        .eq('is_homepage', true);
    }

    // Build insert data
    const insertData = {
      website_id: websiteId,
      title,
      slug,
      path: is_homepage ? '/' : `/${slug}`,
      is_homepage: is_homepage || false,
      content: content || {},
    };

    // Create the page
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: page, error } = await supabase
      .from('pages')
      .insert(insertData as any)
      .select()
      .single();

    if (error) {
      console.error('Error creating page:', error);
      return NextResponse.json(
        { error: 'Failed to create page' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        page,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error in pages POST:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
