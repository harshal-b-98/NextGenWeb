/**
 * Site Homepage Route
 * Phase 6: Conversational Marketing Platform
 *
 * Renders generated websites with the conversational interface:
 * - Visitors see personalized CTAs based on workspace knowledge base
 * - Each click generates a new page section below (not navigation)
 * - Creates an infinite scrolling journey of AI-generated content
 * - All interactions use workspace-specific knowledge
 */

import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ConversationalLandingPageWrapper } from './conversational/ConversationalLandingPageWrapper';

interface PageProps {
  params: Promise<{
    siteSlug: string;
  }>;
}

/**
 * Generate metadata for SEO
 */
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { siteSlug } = await params;
  const supabase = await createClient();

  const { data: website } = await supabase
    .from('websites')
    .select('name')
    .eq('slug', siteSlug)
    .single();

  return {
    title: website?.name || 'Website',
    description: 'Explore through an interactive, AI-powered conversational experience.',
  };
}

/**
 * Site Homepage Component - Conversational Experience
 */
export default async function SiteHomepage({ params }: PageProps) {
  const { siteSlug } = await params;
  const supabase = await createClient();

  // Find website by slug with workspace info
  const { data: website, error: websiteError } = await supabase
    .from('websites')
    .select('id, name, slug, brand_config, workspace_id')
    .eq('slug', siteSlug)
    .single();

  if (websiteError || !website) {
    notFound();
  }

  // Render the conversational landing page
  // This uses workspace-specific knowledge base for all interactions
  return (
    <ConversationalLandingPageWrapper
      websiteId={website.id}
      workspaceId={website.workspace_id}
      websiteName={website.name}
      slug={website.slug}
      brandConfig={website.brand_config as Record<string, unknown> | null}
    />
  );
}
