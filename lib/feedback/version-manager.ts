/**
 * Version Manager
 * Epic #146: Iterative Website Feedback & Refinement System
 *
 * Story #149: Service for managing page revisions, rollback operations,
 * and comparing different versions of a page.
 */

import { createClient } from '@/lib/supabase/server';
import { untypedFrom } from '@/lib/supabase/untyped';
import type { PopulatedContent } from '@/lib/content/types';
import type {
  PageRevision,
  RevisionType,
  PageContentSnapshot,
  SectionSnapshot,
  RevisionDiff,
  SectionDiff,
  ContentFieldDiff,
  DiffSummary,
  CreateRevisionRequest,
  RollbackRequest,
  CompareRevisionsRequest,
} from './types';

// ============================================================================
// REVISION MANAGEMENT
// ============================================================================

/**
 * Create a new revision for a page
 */
export async function createRevision(
  request: CreateRevisionRequest
): Promise<PageRevision> {
  const supabase = await createClient();

  // Get current page content
  const { data: page, error: pageError } = await supabase
    .from('pages')
    .select('id, title, slug, content')
    .eq('id', request.pageId)
    .single();

  if (pageError || !page) {
    throw new Error(`Page not found: ${request.pageId}`);
  }

  // Get next revision number using untyped query
  const revisionsTableMax = await untypedFrom('page_revisions');
  const { data: maxRevision } = await revisionsTableMax
    .select('revision_number')
    .eq('page_id', request.pageId)
    .order('revision_number', { ascending: false })
    .limit(1)
    .single();

  const revisionNumber = (maxRevision?.revision_number || 0) + 1;

  // Create content snapshot
  const content = page.content as Record<string, unknown>;
  const sectionsData = (content?.sections || []) as Array<{
    id: string;
    componentId: string;
    order: number;
    narrativeRole: string;
    content: PopulatedContent;
    styling?: Record<string, unknown>;
  }>;

  const contentSnapshot: PageContentSnapshot = {
    pageId: page.id,
    title: page.title,
    slug: page.slug,
    sections: sectionsData.map(s => ({
      sectionId: s.id,
      componentId: s.componentId as SectionSnapshot['componentId'],
      order: s.order,
      narrativeRole: s.narrativeRole,
      content: s.content,
      styling: s.styling as SectionSnapshot['styling'],
    })),
    metadata: {
      title: page.title,
      description: '',
    },
  };

  // Insert revision using untyped query
  const revisionsTableInsert = await untypedFrom('page_revisions');
  const { data: revision, error: insertError } = await revisionsTableInsert
    .insert({
      page_id: request.pageId,
      revision_number: revisionNumber,
      revision_type: request.revisionType,
      change_summary: request.changeSummary,
      sections_modified: request.sectionsModified || [],
      feedback_ids: request.feedbackIds || [],
      content_snapshot: JSON.parse(JSON.stringify(contentSnapshot)),
      created_by: request.userId,
    })
    .select()
    .single();

  if (insertError) {
    throw new Error(`Failed to create revision: ${insertError.message}`);
  }

  // Note: current_revision_id column will be available after migration is applied
  // For now, we track revisions in the page_revisions table and look up the latest

  return {
    id: revision.id,
    pageId: revision.page_id,
    revisionNumber: revision.revision_number,
    revisionType: revision.revision_type as RevisionType,
    changeSummary: revision.change_summary,
    sectionsModified: revision.sections_modified as string[],
    feedbackIds: revision.feedback_ids as string[],
    contentSnapshot: revision.content_snapshot as PageContentSnapshot,
    createdBy: revision.created_by,
    createdAt: revision.created_at,
  };
}

/**
 * Get all revisions for a page
 */
export async function getRevisions(pageId: string): Promise<PageRevision[]> {
  // Use untyped query for new table
  const revisionsTable = await untypedFrom('page_revisions');
  const { data: revisions, error } = await revisionsTable
    .select('*')
    .eq('page_id', pageId)
    .order('revision_number', { ascending: false });

  if (error) {
    throw new Error(`Failed to get revisions: ${error.message}`);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (revisions || []).map((r: any) => ({
    id: r.id,
    pageId: r.page_id,
    revisionNumber: r.revision_number,
    revisionType: r.revision_type as RevisionType,
    changeSummary: r.change_summary,
    sectionsModified: r.sections_modified as string[],
    feedbackIds: r.feedback_ids as string[],
    contentSnapshot: r.content_snapshot as PageContentSnapshot,
    createdBy: r.created_by,
    createdAt: r.created_at,
    rolledBackFrom: r.rolled_back_from,
  }));
}

/**
 * Get a specific revision
 */
export async function getRevision(revisionId: string): Promise<PageRevision | null> {
  // Use untyped query for new table
  const revisionsTable = await untypedFrom('page_revisions');
  const { data: revision, error } = await revisionsTable
    .select('*')
    .eq('id', revisionId)
    .single();

  if (error || !revision) {
    return null;
  }

  return {
    id: revision.id,
    pageId: revision.page_id,
    revisionNumber: revision.revision_number,
    revisionType: revision.revision_type as RevisionType,
    changeSummary: revision.change_summary,
    sectionsModified: revision.sections_modified as string[],
    feedbackIds: revision.feedback_ids as string[],
    contentSnapshot: revision.content_snapshot as PageContentSnapshot,
    createdBy: revision.created_by,
    createdAt: revision.created_at,
    rolledBackFrom: revision.rolled_back_from,
  };
}

/**
 * Get the latest revision for a page
 */
export async function getLatestRevision(pageId: string): Promise<PageRevision | null> {
  // Use untyped query for new table
  const revisionsTable = await untypedFrom('page_revisions');
  const { data: revision, error } = await revisionsTable
    .select('*')
    .eq('page_id', pageId)
    .order('revision_number', { ascending: false })
    .limit(1)
    .single();

  if (error || !revision) {
    return null;
  }

  return {
    id: revision.id,
    pageId: revision.page_id,
    revisionNumber: revision.revision_number,
    revisionType: revision.revision_type as RevisionType,
    changeSummary: revision.change_summary,
    sectionsModified: revision.sections_modified as string[],
    feedbackIds: revision.feedback_ids as string[],
    contentSnapshot: revision.content_snapshot as PageContentSnapshot,
    createdBy: revision.created_by,
    createdAt: revision.created_at,
    rolledBackFrom: revision.rolled_back_from,
  };
}

// ============================================================================
// ROLLBACK OPERATIONS
// ============================================================================

/**
 * Rollback to a specific revision
 */
export async function rollbackToRevision(
  request: RollbackRequest
): Promise<PageRevision> {
  const supabase = await createClient();

  // Get target revision
  const targetRevision = await getRevision(request.targetRevisionId);
  if (!targetRevision) {
    throw new Error(`Revision not found: ${request.targetRevisionId}`);
  }

  // Verify page matches
  if (targetRevision.pageId !== request.pageId) {
    throw new Error('Revision does not belong to this page');
  }

  // Update page content to target revision's snapshot
  const contentJson = {
    sections: targetRevision.contentSnapshot.sections.map(s => ({
      id: s.sectionId,
      componentId: s.componentId,
      order: s.order,
      narrativeRole: s.narrativeRole,
      content: s.content,
      styling: s.styling,
    })),
  };

  await supabase
    .from('pages')
    .update({
      content: JSON.parse(JSON.stringify(contentJson)),
      title: targetRevision.contentSnapshot.title,
      updated_at: new Date().toISOString(),
    })
    .eq('id', request.pageId);

  // Create new revision for the rollback
  const rollbackRevision = await createRevision({
    pageId: request.pageId,
    revisionType: 'rollback',
    changeSummary: `Rolled back to revision ${targetRevision.revisionNumber}`,
    userId: request.userId,
  });

  // Update the rollback revision to reference the source using untyped query
  const revisionsTableUpdate = await untypedFrom('page_revisions');
  await revisionsTableUpdate
    .update({ rolled_back_from: request.targetRevisionId })
    .eq('id', rollbackRevision.id);

  return {
    ...rollbackRevision,
    rolledBackFrom: request.targetRevisionId,
  };
}

// ============================================================================
// REVISION COMPARISON
// ============================================================================

/**
 * Compare two revisions and generate a diff
 */
export async function compareRevisions(
  request: CompareRevisionsRequest
): Promise<RevisionDiff> {
  const [fromRevision, toRevision] = await Promise.all([
    getRevision(request.fromRevisionId),
    getRevision(request.toRevisionId),
  ]);

  if (!fromRevision || !toRevision) {
    throw new Error('One or both revisions not found');
  }

  if (fromRevision.pageId !== toRevision.pageId) {
    throw new Error('Revisions must belong to the same page');
  }

  const fromSections = fromRevision.contentSnapshot.sections;
  const toSections = toRevision.contentSnapshot.sections;

  // Build section maps for comparison
  const fromSectionMap = new Map(fromSections.map(s => [s.sectionId, s]));
  const toSectionMap = new Map(toSections.map(s => [s.sectionId, s]));

  const sectionDiffs: SectionDiff[] = [];
  const processedSections = new Set<string>();

  // Find modified and removed sections
  for (const [sectionId, fromSection] of fromSectionMap) {
    processedSections.add(sectionId);
    const toSection = toSectionMap.get(sectionId);

    if (!toSection) {
      // Section was removed
      sectionDiffs.push({
        sectionId,
        changeType: 'removed',
        componentId: fromSection.componentId,
        contentChanges: [],
      });
    } else {
      // Section exists in both - compare content
      const contentChanges = compareContent(fromSection.content, toSection.content);

      if (contentChanges.length > 0) {
        sectionDiffs.push({
          sectionId,
          changeType: 'modified',
          componentId: toSection.componentId,
          contentChanges,
        });
      } else {
        sectionDiffs.push({
          sectionId,
          changeType: 'unchanged',
          componentId: toSection.componentId,
          contentChanges: [],
        });
      }
    }
  }

  // Find added sections
  for (const [sectionId, toSection] of toSectionMap) {
    if (!processedSections.has(sectionId)) {
      sectionDiffs.push({
        sectionId,
        changeType: 'added',
        componentId: toSection.componentId,
        contentChanges: [],
      });
    }
  }

  // Generate summary
  const summary: DiffSummary = {
    sectionsAdded: sectionDiffs.filter(d => d.changeType === 'added').length,
    sectionsRemoved: sectionDiffs.filter(d => d.changeType === 'removed').length,
    sectionsModified: sectionDiffs.filter(d => d.changeType === 'modified').length,
    totalFieldChanges: sectionDiffs.reduce(
      (sum, d) => sum + d.contentChanges.length,
      0
    ),
    majorChanges: generateMajorChangesList(sectionDiffs),
  };

  return {
    fromRevision: request.fromRevisionId,
    toRevision: request.toRevisionId,
    sectionDiffs,
    summary,
  };
}

/**
 * Compare content objects and return field differences
 */
function compareContent(
  from: PopulatedContent,
  to: PopulatedContent
): ContentFieldDiff[] {
  const changes: ContentFieldDiff[] = [];

  // Get all keys from both objects
  const allKeys = new Set([
    ...Object.keys(from || {}),
    ...Object.keys(to || {}),
  ]);

  for (const key of allKeys) {
    const fromValue = (from as Record<string, unknown>)?.[key];
    const toValue = (to as Record<string, unknown>)?.[key];

    if (fromValue === undefined && toValue !== undefined) {
      changes.push({
        field: key,
        before: undefined,
        after: toValue,
        changeType: 'added',
      });
    } else if (fromValue !== undefined && toValue === undefined) {
      changes.push({
        field: key,
        before: fromValue,
        after: undefined,
        changeType: 'removed',
      });
    } else if (JSON.stringify(fromValue) !== JSON.stringify(toValue)) {
      changes.push({
        field: key,
        before: fromValue,
        after: toValue,
        changeType: 'modified',
      });
    }
  }

  return changes;
}

/**
 * Generate human-readable list of major changes
 */
function generateMajorChangesList(diffs: SectionDiff[]): string[] {
  const changes: string[] = [];

  for (const diff of diffs) {
    if (diff.changeType === 'added') {
      changes.push(`Added new ${diff.componentId} section`);
    } else if (diff.changeType === 'removed') {
      changes.push(`Removed ${diff.componentId} section`);
    } else if (diff.changeType === 'modified') {
      const headlineChange = diff.contentChanges.find(c => c.field === 'headline');
      const descriptionChange = diff.contentChanges.find(
        c => c.field === 'description'
      );

      if (headlineChange) {
        changes.push(`Updated headline in ${diff.componentId}`);
      }
      if (descriptionChange) {
        changes.push(`Updated description in ${diff.componentId}`);
      }
      if (!headlineChange && !descriptionChange && diff.contentChanges.length > 0) {
        changes.push(
          `Updated ${diff.contentChanges.length} fields in ${diff.componentId}`
        );
      }
    }
  }

  return changes.slice(0, 10); // Limit to 10 major changes
}

// ============================================================================
// PREVIEW OPERATIONS
// ============================================================================

/**
 * Get page content at a specific revision (for preview)
 */
export async function getPageAtRevision(
  revisionId: string
): Promise<PageContentSnapshot | null> {
  const revision = await getRevision(revisionId);
  if (!revision) {
    return null;
  }
  return revision.contentSnapshot;
}

/**
 * Preview changes before applying them
 */
export async function previewChanges(
  pageId: string,
  changes: Array<{
    sectionId: string;
    content: Partial<PopulatedContent>;
  }>
): Promise<PageContentSnapshot> {
  const supabase = await createClient();

  // Get current page content
  const { data: page, error } = await supabase
    .from('pages')
    .select('id, title, slug, content')
    .eq('id', pageId)
    .single();

  if (error || !page) {
    throw new Error(`Page not found: ${pageId}`);
  }

  const content = page.content as Record<string, unknown>;
  const sectionsData = (content?.sections || []) as Array<{
    id: string;
    componentId: string;
    order: number;
    narrativeRole: string;
    content: PopulatedContent;
    styling?: Record<string, unknown>;
  }>;

  // Apply changes to a copy
  const updatedSections: SectionSnapshot[] = sectionsData.map(s => {
    const change = changes.find(c => c.sectionId === s.id);
    return {
      sectionId: s.id,
      componentId: s.componentId as SectionSnapshot['componentId'],
      order: s.order,
      narrativeRole: s.narrativeRole,
      content: change ? { ...s.content, ...change.content } : s.content,
      styling: s.styling as SectionSnapshot['styling'],
    };
  });

  return {
    pageId: page.id,
    title: page.title,
    slug: page.slug,
    sections: updatedSections,
    metadata: {
      title: page.title,
      description: '',
    },
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export type { PageRevision, RevisionDiff, SectionDiff, DiffSummary };
