/**
 * Conversational Landing Page Route
 * Phase 6: Conversational Marketing Platform
 *
 * A minimal, single-screen conversational experience where:
 * - Visitors see personalized CTAs based on knowledge base
 * - Each click generates a new page section below (not navigation)
 * - Creates an infinite scrolling journey of AI-generated content
 */

import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ConversationalLandingPageWrapper } from './ConversationalLandingPageWrapper';

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
    title: website?.name ? `${website.name} - Conversational Experience` : 'Conversational Experience',
    description: 'Explore our platform through an interactive, AI-powered conversational experience.',
  };
}

/**
 * Conversational Landing Page
 */
export default async function ConversationalPage({ params }: PageProps) {
  const { siteSlug } = await params;
  const supabase = await createClient();

  // Find website by slug
  const { data: website, error: websiteError } = await supabase
    .from('websites')
    .select('id, name, slug, brand_config, workspace_id')
    .eq('slug', siteSlug)
    .single();

  if (websiteError || !website) {
    notFound();
  }

  // Pass data to client wrapper
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
