/**
 * Full Website Preview Page
 *
 * Renders the complete website in a separate tab with:
 * - All pages with navigation
 * - Version selector dropdown
 * - Section selection for feedback
 * - Preview toolbar with controls
 *
 * Epic #146: Interactive Website Feedback & Refinement System
 */

import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { PreviewWorkspace } from './PreviewWorkspace';

interface PreviewPageProps {
  params: Promise<{
    workspaceId: string;
    websiteId: string;
  }>;
  searchParams: Promise<{
    versionId?: string;
  }>;
}

export default async function PreviewPage({ params, searchParams }: PreviewPageProps) {
  const { workspaceId, websiteId } = await params;
  const { versionId } = await searchParams;

  const supabase = await createClient();

  // Verify authentication
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return notFound();
  }

  // Verify workspace membership
  const { data: membership } = await supabase
    .from('workspace_members')
    .select('id, role')
    .eq('workspace_id', workspaceId)
    .eq('user_id', user.id)
    .single();

  if (!membership) {
    return notFound();
  }

  // Fetch website with version info
  const { data: website, error: websiteError } = await supabase
    .from('websites')
    .select('id, name, slug, brand_config, draft_version_id, production_version_id')
    .eq('id', websiteId)
    .eq('workspace_id', workspaceId)
    .single();

  if (websiteError || !website) {
    return notFound();
  }

  // Determine which version to show
  const activeVersionId = versionId || website.draft_version_id;

  // Fetch version details if specified
  let versionInfo = null;
  if (activeVersionId) {
    const { data: version } = await supabase
      .from('website_versions')
      .select('*')
      .eq('id', activeVersionId)
      .single();
    versionInfo = version;
  }

  // Fetch all pages for this website
  const { data: pages, error: pagesError } = await supabase
    .from('pages')
    .select('id, title, slug, path, content, is_homepage, sort_order, current_revision_id')
    .eq('website_id', websiteId)
    .order('sort_order', { ascending: true });

  if (pagesError || !pages || pages.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">No Pages Found</h1>
          <p className="text-gray-600">This website doesn't have any pages yet.</p>
        </div>
      </div>
    );
  }

  // Fetch global components (header, footer)
  const { data: globalComponents } = await supabase
    .from('site_global_components')
    .select('*')
    .eq('website_id', websiteId);

  const header = globalComponents?.find((c) => c.type === 'header');
  const footer = globalComponents?.find((c) => c.type === 'footer');

  // Fetch all versions for version selector
  const { data: versions } = await supabase
    .from('website_versions')
    .select('id, version_number, version_name, status, created_at, trigger_type')
    .eq('website_id', websiteId)
    .order('version_number', { ascending: false })
    .limit(20);

  return (
    <PreviewWorkspace
      website={{
        id: website.id,
        name: website.name,
        slug: website.slug,
        brandConfig: website.brand_config,
        draftVersionId: website.draft_version_id,
        productionVersionId: website.production_version_id,
      }}
      pages={pages}
      globalComponents={{
        header: header?.content || null,
        footer: footer?.content || null,
      }}
      versions={versions || []}
      currentVersion={versionInfo}
      workspaceId={workspaceId}
      userId={user.id}
    />
  );
}
