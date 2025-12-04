/**
 * Website Version Manager
 *
 * Central service for managing website-level versioning.
 * Handles creation, retrieval, comparison, and publishing of website versions.
 *
 * Epic #146: Iterative Website Feedback & Refinement System
 */

import { createClient } from '@/lib/supabase/server';
import type { Database } from '@/types/database';

// ============================================================================
// Types
// ============================================================================

export type WebsiteVersion = Database['public']['Tables']['website_versions']['Row'];
export type WebsiteVersionInsert = Database['public']['Tables']['website_versions']['Insert'];
export type WebsiteVersionUpdate = Database['public']['Tables']['website_versions']['Update'];

export interface CreateVersionParams {
  websiteId: string;
  versionName?: string;
  description?: string;
  triggerType?: 'initial' | 'feedback' | 'rollback' | 'manual' | 'finalization';
  createdBy?: string;
}

export interface VersionWithPages extends WebsiteVersion {
  pageCount: number;
  pages: Array<{
    pageId: string;
    revisionId: string;
    title: string;
    slug: string;
  }>;
}

export interface VersionComparison {
  oldVersion: WebsiteVersion;
  newVersion: WebsiteVersion;
  pagesAdded: string[];
  pagesRemoved: string[];
  pagesModified: string[];
  pagesUnchanged: string[];
  summary: string;
}

// ============================================================================
// Core Functions
// ============================================================================

/**
 * Create a new website version (snapshot of current state)
 */
export async function createWebsiteVersion(
  params: CreateVersionParams
): Promise<{ version: WebsiteVersion; error: null } | { version: null; error: string }> {
  try {
    const supabase = await createClient();

    // Get current page revisions for all pages in this website
    const { data: pages, error: pagesError } = await supabase
      .from('pages')
      .select('id, current_revision_id, title, slug')
      .eq('website_id', params.websiteId)
      .not('current_revision_id', 'is', null);

    if (pagesError) {
      return { version: null, error: `Failed to fetch pages: ${pagesError.message}` };
    }

    if (!pages || pages.length === 0) {
      return { version: null, error: 'No pages with revisions found for this website' };
    }

    // Build page_revisions JSONB object
    const pageRevisions: Record<string, string> = {};
    pages.forEach((page) => {
      if (page.current_revision_id) {
        pageRevisions[page.id] = page.current_revision_id;
      }
    });

    // Get next version number
    const { data: existingVersions } = await supabase
      .from('website_versions')
      .select('version_number')
      .eq('website_id', params.websiteId)
      .order('version_number', { ascending: false })
      .limit(1);

    const nextVersionNumber = existingVersions && existingVersions.length > 0
      ? existingVersions[0].version_number + 1
      : 1;

    // Create the version
    const { data: version, error: versionError } = await supabase
      .from('website_versions')
      .insert({
        website_id: params.websiteId,
        version_number: nextVersionNumber,
        status: 'draft',
        page_revisions: pageRevisions,
        version_name: params.versionName || `v${nextVersionNumber}`,
        description: params.description || null,
        trigger_type: params.triggerType || 'manual',
        created_by: params.createdBy || null,
      })
      .select()
      .single();

    if (versionError) {
      return { version: null, error: `Failed to create version: ${versionError.message}` };
    }

    // Update website to point to this draft version
    const { error: updateError } = await supabase
      .from('websites')
      .update({ draft_version_id: version.id })
      .eq('id', params.websiteId);

    if (updateError) {
      console.error('Failed to update website draft_version_id:', updateError);
      // Non-fatal - version was created successfully
    }

    return { version, error: null };
  } catch (error) {
    console.error('Error in createWebsiteVersion:', error);
    return {
      version: null,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get all versions for a website
 */
export async function getWebsiteVersions(
  websiteId: string,
  options: {
    status?: 'draft' | 'production';
    limit?: number;
    offset?: number;
  } = {}
): Promise<{ versions: WebsiteVersion[]; error: null } | { versions: null; error: string }> {
  try {
    const supabase = await createClient();

    let query = supabase
      .from('website_versions')
      .select('*')
      .eq('website_id', websiteId)
      .order('version_number', { ascending: false });

    if (options.status) {
      query = query.eq('status', options.status);
    }

    if (options.limit) {
      query = query.limit(options.limit);
    }

    if (options.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 50) - 1);
    }

    const { data: versions, error } = await query;

    if (error) {
      return { versions: null, error: `Failed to fetch versions: ${error.message}` };
    }

    return { versions: versions || [], error: null };
  } catch (error) {
    console.error('Error in getWebsiteVersions:', error);
    return {
      versions: null,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get a specific version by ID with page details
 */
export async function getVersionById(
  versionId: string
): Promise<{ version: VersionWithPages; error: null } | { version: null; error: string }> {
  try {
    const supabase = await createClient();

    // Get the version
    const { data: version, error: versionError } = await supabase
      .from('website_versions')
      .select('*')
      .eq('id', versionId)
      .single();

    if (versionError || !version) {
      return { version: null, error: 'Version not found' };
    }

    // Get page details from page_revisions JSONB
    const pageRevisions = version.page_revisions as Record<string, string>;
    const pageIds = Object.keys(pageRevisions);

    const { data: pages, error: pagesError } = await supabase
      .from('pages')
      .select('id, title, slug')
      .in('id', pageIds);

    if (pagesError) {
      return { version: null, error: `Failed to fetch page details: ${pagesError.message}` };
    }

    // Build version with page details
    const versionWithPages: VersionWithPages = {
      ...version,
      pageCount: pageIds.length,
      pages: pages.map((page) => ({
        pageId: page.id,
        revisionId: pageRevisions[page.id],
        title: page.title || 'Untitled',
        slug: page.slug || '',
      })),
    };

    return { version: versionWithPages, error: null };
  } catch (error) {
    console.error('Error in getVersionById:', error);
    return {
      version: null,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Switch website to a specific version (make it the active draft)
 */
export async function switchToVersion(
  websiteId: string,
  versionId: string
): Promise<{ success: boolean; error: null } | { success: false; error: string }> {
  try {
    const supabase = await createClient();

    // Get the version
    const { data: version, error: versionError } = await supabase
      .from('website_versions')
      .select('*')
      .eq('id', versionId)
      .eq('website_id', websiteId)
      .single();

    if (versionError || !version) {
      return { success: false, error: 'Version not found' };
    }

    // Update each page's current_revision_id to match this version
    const pageRevisions = version.page_revisions as Record<string, string>;

    for (const [pageId, revisionId] of Object.entries(pageRevisions)) {
      const { error: updateError } = await supabase
        .from('pages')
        .update({ current_revision_id: revisionId })
        .eq('id', pageId);

      if (updateError) {
        console.error(`Failed to update page ${pageId}:`, updateError);
        // Continue with other pages
      }
    }

    // Update website's draft_version_id
    const { error: websiteError } = await supabase
      .from('websites')
      .update({ draft_version_id: versionId })
      .eq('id', websiteId);

    if (websiteError) {
      return { success: false, error: `Failed to update website: ${websiteError.message}` };
    }

    return { success: true, error: null };
  } catch (error) {
    console.error('Error in switchToVersion:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Publish a version (promote to production)
 */
export async function publishVersion(
  versionId: string
): Promise<{ success: boolean; error: null } | { success: false; error: string }> {
  try {
    const supabase = await createClient();

    // Get the version
    const { data: version, error: versionError } = await supabase
      .from('website_versions')
      .select('*')
      .eq('id', versionId)
      .single();

    if (versionError || !version) {
      return { success: false, error: 'Version not found' };
    }

    // Get the website
    const { data: website, error: websiteError } = await supabase
      .from('websites')
      .select('production_version_id')
      .eq('id', version.website_id)
      .single();

    if (websiteError || !website) {
      return { success: false, error: 'Website not found' };
    }

    // Demote old production version if exists
    if (website.production_version_id) {
      await supabase
        .from('website_versions')
        .update({ status: 'draft' })
        .eq('id', website.production_version_id);
    }

    // Promote this version to production
    const { error: updateError } = await supabase
      .from('website_versions')
      .update({
        status: 'production',
        published_at: new Date().toISOString(),
      })
      .eq('id', versionId);

    if (updateError) {
      return { success: false, error: `Failed to update version: ${updateError.message}` };
    }

    // Update website reference
    const { error: websiteUpdateError } = await supabase
      .from('websites')
      .update({ production_version_id: versionId })
      .eq('id', version.website_id);

    if (websiteUpdateError) {
      return { success: false, error: `Failed to update website: ${websiteUpdateError.message}` };
    }

    return { success: true, error: null };
  } catch (error) {
    console.error('Error in publishVersion:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Compare two versions and generate a diff
 */
export async function compareVersions(
  oldVersionId: string,
  newVersionId: string
): Promise<{ comparison: VersionComparison; error: null } | { comparison: null; error: string }> {
  try {
    const supabase = await createClient();

    // Get both versions
    const { data: versions, error: versionsError } = await supabase
      .from('website_versions')
      .select('*')
      .in('id', [oldVersionId, newVersionId]);

    if (versionsError || !versions || versions.length !== 2) {
      return { comparison: null, error: 'Failed to fetch versions for comparison' };
    }

    const oldVersion = versions.find((v) => v.id === oldVersionId)!;
    const newVersion = versions.find((v) => v.id === newVersionId)!;

    const oldRevisions = oldVersion.page_revisions as Record<string, string>;
    const newRevisions = newVersion.page_revisions as Record<string, string>;

    const oldPageIds = new Set(Object.keys(oldRevisions));
    const newPageIds = new Set(Object.keys(newRevisions));

    // Calculate differences
    const pagesAdded = Array.from(newPageIds).filter((id) => !oldPageIds.has(id));
    const pagesRemoved = Array.from(oldPageIds).filter((id) => !newPageIds.has(id));
    const pagesModified = Array.from(newPageIds).filter(
      (id) => oldPageIds.has(id) && oldRevisions[id] !== newRevisions[id]
    );
    const pagesUnchanged = Array.from(newPageIds).filter(
      (id) => oldPageIds.has(id) && oldRevisions[id] === newRevisions[id]
    );

    // Generate summary
    const changes: string[] = [];
    if (pagesAdded.length > 0) changes.push(`${pagesAdded.length} page(s) added`);
    if (pagesRemoved.length > 0) changes.push(`${pagesRemoved.length} page(s) removed`);
    if (pagesModified.length > 0) changes.push(`${pagesModified.length} page(s) modified`);

    const summary = changes.length > 0
      ? changes.join(', ')
      : 'No changes detected';

    const comparison: VersionComparison = {
      oldVersion,
      newVersion,
      pagesAdded,
      pagesRemoved,
      pagesModified,
      pagesUnchanged,
      summary,
    };

    return { comparison, error: null };
  } catch (error) {
    console.error('Error in compareVersions:', error);
    return {
      comparison: null,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get the current draft version for a website
 */
export async function getCurrentDraftVersion(
  websiteId: string
): Promise<{ version: WebsiteVersion | null; error: null } | { version: null; error: string }> {
  try {
    const supabase = await createClient();

    const { data: website, error: websiteError } = await supabase
      .from('websites')
      .select('draft_version_id')
      .eq('id', websiteId)
      .single();

    if (websiteError || !website || !website.draft_version_id) {
      return { version: null, error: null }; // No draft version yet
    }

    const { data: version, error: versionError } = await supabase
      .from('website_versions')
      .select('*')
      .eq('id', website.draft_version_id)
      .single();

    if (versionError) {
      return { version: null, error: `Failed to fetch draft version: ${versionError.message}` };
    }

    return { version, error: null };
  } catch (error) {
    console.error('Error in getCurrentDraftVersion:', error);
    return {
      version: null,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get the current production version for a website
 */
export async function getCurrentProductionVersion(
  websiteId: string
): Promise<{ version: WebsiteVersion | null; error: null } | { version: null; error: string }> {
  try {
    const supabase = await createClient();

    const { data: website, error: websiteError } = await supabase
      .from('websites')
      .select('production_version_id')
      .eq('id', websiteId)
      .single();

    if (websiteError || !website || !website.production_version_id) {
      return { version: null, error: null }; // No production version yet
    }

    const { data: version, error: versionError } = await supabase
      .from('website_versions')
      .select('*')
      .eq('id', website.production_version_id)
      .single();

    if (versionError) {
      return { version: null, error: `Failed to fetch production version: ${versionError.message}` };
    }

    return { version, error: null };
  } catch (error) {
    console.error('Error in getCurrentProductionVersion:', error);
    return {
      version: null,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Archive old versions (soft delete by updating status)
 * Keeps metadata but marks as archived for cleanup
 */
export async function archiveOldVersions(
  websiteId: string,
  olderThanDays: number = 30
): Promise<{ archivedCount: number; error: null } | { archivedCount: 0; error: string }> {
  try {
    const supabase = await createClient();

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.setDate(cutoffDate.getDate() - olderThanDays));

    // Don't archive draft or production versions
    const { data: website } = await supabase
      .from('websites')
      .select('draft_version_id, production_version_id')
      .eq('id', websiteId)
      .single();

    if (!website) {
      return { archivedCount: 0, error: 'Website not found' };
    }

    // Archive versions older than cutoff date
    // (In a real implementation, you might add an 'archived' status to the enum)
    // For now, we'll just mark them with a comment field
    const { data: archivedVersions, error } = await supabase
      .from('website_versions')
      .update({ description: 'ARCHIVED: ' + cutoffDate.toISOString() })
      .eq('website_id', websiteId)
      .lt('created_at', cutoffDate.toISOString())
      .neq('id', website.draft_version_id || '')
      .neq('id', website.production_version_id || '')
      .select();

    if (error) {
      return { archivedCount: 0, error: `Failed to archive versions: ${error.message}` };
    }

    return { archivedCount: archivedVersions?.length || 0, error: null };
  } catch (error) {
    console.error('Error in archiveOldVersions:', error);
    return {
      archivedCount: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
