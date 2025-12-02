/**
 * Logo Upload API Route
 * POST /api/upload/logo - Upload a logo image for a website
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Max file size: 2MB
const MAX_FILE_SIZE = 2 * 1024 * 1024;

// Allowed MIME types
const ALLOWED_TYPES = [
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/svg+xml',
  'image/webp',
  'image/gif',
];

/**
 * POST /api/upload/logo
 * Upload a logo image to Supabase storage
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const workspaceId = formData.get('workspaceId') as string | null;
    const websiteId = formData.get('websiteId') as string | null;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    if (!workspaceId) {
      return NextResponse.json(
        { error: 'Workspace ID is required' },
        { status: 400 }
      );
    }

    if (!websiteId) {
      return NextResponse.json(
        { error: 'Website ID is required' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Please upload PNG, JPG, SVG, WebP, or GIF.' },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 2MB.' },
        { status: 400 }
      );
    }

    // Check workspace membership
    const { data: membership, error: membershipError } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', workspaceId)
      .eq('user_id', user.id)
      .single();

    if (membershipError || !membership) {
      return NextResponse.json(
        { error: 'Not a member of this workspace' },
        { status: 403 }
      );
    }

    // Generate unique filename
    const fileExt = file.name.split('.').pop()?.toLowerCase() || 'png';
    const timestamp = Date.now();
    const fileName = `logo-${timestamp}.${fileExt}`;
    const filePath = `${workspaceId}/${websiteId}/logos/${fileName}`;

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Supabase storage (website-assets bucket is public)
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('website-assets')
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      return NextResponse.json(
        { error: 'Failed to upload logo' },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('website-assets')
      .getPublicUrl(filePath);

    if (!urlData?.publicUrl) {
      return NextResponse.json(
        { error: 'Failed to get public URL' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      url: urlData.publicUrl,
      path: uploadData.path,
      fileName,
    });

  } catch (error) {
    console.error('Logo upload error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
