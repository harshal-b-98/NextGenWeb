/**
 * Studio Shortcut - DEPRECATED
 *
 * Redirects /studio/[websiteId] → /workspaces/[workspaceId]/websites/[websiteId]
 * This maintains backward compatibility with old links
 */

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

interface StudioPageProps {
  params: Promise<{
    websiteId: string;
  }>;
}

export default async function StudioShortcutPage({ params }: StudioPageProps) {
  const { websiteId } = await params;
  const supabase = await createClient();

  // Get website and its workspace
  const { data: website } = await supabase
    .from('websites_v2')
    .select('workspace_id')
    .eq('id', websiteId)
    .single();

  if (!website) {
    // Fallback: try old websites table
    const { data: oldWebsite } = await supabase
      .from('websites')
      .select('workspace_id')
      .eq('id', websiteId)
      .single();

    if (oldWebsite) {
      redirect(`/workspaces/${oldWebsite.workspace_id}/websites/${websiteId}`);
    }

    // Website not found
    redirect('/workspaces');
  }

  // Redirect to proper workspace website path
  redirect(`/workspaces/${website.workspace_id}/websites/${websiteId}`);
}
