/**
 * Websites API
 * Phase 5.1: Admin Dashboard
 *
 * CRUD operations for websites within a workspace.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

/**
 * Website creation/update schema
 */
const WebsiteSchema = z.object({
  name: z.string().min(1).max(255),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/),
  domain: z.string().nullable().optional(),
  settings: z.record(z.string(), z.unknown()).optional(),
});

/**
 * GET /api/workspaces/[workspaceId]/websites
 * List all websites in a workspace
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  try {
    const { workspaceId } = await params;
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

    // Fetch websites with page counts
    const { data: websites, error } = await supabase
      .from('websites')
      .select(`
        *,
        pages:pages(count)
      `)
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching websites:', error);
      return NextResponse.json(
        { error: 'Failed to fetch websites' },
        { status: 500 }
      );
    }

    // Transform to include page count
    const websitesWithCounts = websites?.map(website => ({
      ...website,
      pageCount: website.pages?.[0]?.count || 0,
      pages: undefined, // Remove the nested pages array
    }));

    return NextResponse.json({
      success: true,
      websites: websitesWithCounts || [],
    });
  } catch (error) {
    console.error('Error in websites GET:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/workspaces/[workspaceId]/websites
 * Create a new website
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  try {
    const { workspaceId } = await params;
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
    const validation = WebsiteSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error.issues },
        { status: 400 }
      );
    }

    const { name, slug, domain, settings } = validation.data;

    // Check if slug is unique within workspace
    const { data: existingWebsite } = await supabase
      .from('websites')
      .select('id')
      .eq('workspace_id', workspaceId)
      .eq('slug', slug)
      .single();

    if (existingWebsite) {
      return NextResponse.json(
        { error: 'A website with this slug already exists' },
        { status: 409 }
      );
    }

    // Get workspace's brand config as default
    const { data: workspace } = await supabase
      .from('workspaces')
      .select('settings')
      .eq('id', workspaceId)
      .single();

    // Build insert data
    const insertData = {
      workspace_id: workspaceId,
      name,
      slug,
      domain: domain || null,
      status: 'draft' as const,
      settings: settings || {},
      brand_config: (workspace?.settings as Record<string, unknown>)?.brand_config || {},
    };

    // Create the website
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: website, error } = await supabase
      .from('websites')
      .insert(insertData as any)
      .select()
      .single();

    if (error) {
      console.error('Error creating website:', error);
      return NextResponse.json(
        { error: 'Failed to create website' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        website,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error in websites POST:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
