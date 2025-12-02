/**
 * Public Page Route
 * Renders sub-pages of a generated website
 */

import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { SiteRenderer } from '@/components/site/site-renderer';

interface PageProps {
  params: Promise<{
    siteSlug: string;
    pageSlug: string;
  }>;
}

/**
 * Generate metadata for SEO
 */
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { siteSlug, pageSlug } = await params;
  const supabase = await createClient();

  // Find website by slug
  const { data: website } = await supabase
    .from('websites')
    .select('id, name')
    .eq('slug', siteSlug)
    .single();

  if (!website) {
    return { title: 'Page Not Found' };
  }

  // Find page by slug
  const { data: page } = await supabase
    .from('pages')
    .select('title')
    .eq('website_id', website.id)
    .eq('slug', `/${pageSlug}`)
    .single();

  return {
    title: page?.title ? `${page.title} | ${website.name}` : website.name,
  };
}

/**
 * Public Page Component
 */
export default async function PublicPage({ params }: PageProps) {
  const { siteSlug, pageSlug } = await params;
  const supabase = await createClient();

  // Find website with all pages
  const { data: website, error: websiteError } = await supabase
    .from('websites')
    .select('*, pages(*)')
    .eq('slug', siteSlug)
    .single();

  if (websiteError || !website) {
    notFound();
  }

  // Find the requested page - try both with and without leading slash
  const page = website.pages?.find((p: { slug: string }) =>
    p.slug === `/${pageSlug}` || p.slug === pageSlug
  );

  if (!page) {
    notFound();
  }

  // Transform database types to component types
  const siteData = {
    id: website.id,
    name: website.name,
    slug: website.slug,
    brand_config: website.brand_config as {
      primaryColor?: string;
      secondaryColor?: string;
      logo?: string;
    } | undefined,
  };

  // Transform page types
  const pageData = {
    id: page.id,
    title: page.title,
    slug: page.slug,
    is_homepage: page.is_homepage,
    content: page.content as {
      sections?: Array<{
        id: string;
        type?: string;
        componentId?: string;
        content: Record<string, unknown>;
        order: number;
      }>;
      metadata?: {
        title?: string;
        description?: string;
      };
    } | null,
  };

  const pagesData = (website.pages || []).map((p: Record<string, unknown>) => ({
    id: p.id as string,
    title: p.title as string,
    slug: p.slug as string,
    is_homepage: p.is_homepage as boolean,
    content: p.content as Record<string, unknown> | null,
  }));

  return (
    <SiteRenderer
      website={siteData}
      page={pageData}
      pages={pagesData}
    />
  );
}
