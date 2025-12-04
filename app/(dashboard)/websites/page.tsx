/**
 * Websites Shortcut Page
 *
 * Redirects to the user's default workspace websites list
 * If user has no workspace, redirects to workspace creation
 *
 * Route: /websites
 * Redirects to: /workspaces/[workspaceId]/websites
 */

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export default async function WebsitesShortcutPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Get user's first workspace (or most recently accessed)
  const { data: memberships } = await supabase
    .from('workspace_members')
    .select('workspace:workspaces(id)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1);

  if (!memberships || memberships.length === 0) {
    // No workspace - redirect to create one
    redirect('/workspaces/new');
  }

  const workspaceId = (memberships[0].workspace as any)?.id;

  // Redirect to workspace websites
  redirect(`/workspaces/${workspaceId}/websites`);
}
