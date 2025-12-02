/**
 * Debug API to check page content
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const websiteSlug = searchParams.get('slug') || 'bevgenietest';

  const supabase = await createClient();

  // Find website by slug with pages
  const { data: website, error: websiteError } = await supabase
    .from('websites')
    .select('*, pages(*)')
    .eq('slug', websiteSlug)
    .single();

  if (websiteError || !website) {
    return NextResponse.json({ error: 'Website not found', details: websiteError }, { status: 404 });
  }

  // Get homepage
  const homepage = website.pages?.find((p: any) => p.is_homepage)
    || website.pages?.find((p: any) => p.slug === '/')
    || website.pages?.[0];

  return NextResponse.json({
    website: {
      id: website.id,
      name: website.name,
      slug: website.slug,
      status: website.status,
    },
    totalPages: website.pages?.length || 0,
    homepage: homepage ? {
      id: homepage.id,
      title: homepage.title,
      slug: homepage.slug,
      is_homepage: homepage.is_homepage,
      content: homepage.content,
      contentType: typeof homepage.content,
      hasContent: !!homepage.content,
      hasSections: !!((homepage.content as Record<string, unknown>)?.sections || (homepage.content as Record<string, unknown>)?.generatedContent),
      sectionCount: ((homepage.content as Record<string, unknown>)?.sections as unknown[])?.length || 0,
    } : null,
    allPages: website.pages?.map((p: Record<string, unknown>) => ({
      id: p.id,
      title: p.title,
      slug: p.slug,
      is_homepage: p.is_homepage,
      sectionCount: ((p.content as Record<string, unknown>)?.sections as unknown[])?.length || 0,
      firstSection: ((p.content as Record<string, unknown>)?.sections as unknown[])?.[0] || null,
    })),
  });
}
