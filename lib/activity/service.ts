/**
 * Activity Service
 * Phase 4.1: Enterprise Scale - Activity Feed
 *
 * Service for creating and querying activity events.
 */

import { createClient } from '@/lib/supabase/server';
import type {
  ActivityEvent,
  ActivityEventType,
  ActivityFilterOptions,
  CreateActivityInput,
  ActivityMetadata,
} from './types';
import { getCategoryFromEventType, getSeverityFromEventType } from './types';

/**
 * Create an activity event
 */
export async function createActivityEvent(input: CreateActivityInput): Promise<ActivityEvent | null> {
  const supabase = await createClient();

  const category = getCategoryFromEventType(input.eventType);
  const severity = getSeverityFromEventType(input.eventType);

  const { data, error } = await supabase
    .from('activity_events')
    .insert({
      workspace_id: input.workspaceId,
      user_id: input.userId,
      event_type: input.eventType,
      category,
      severity,
      title: input.title,
      description: input.description,
      metadata: input.metadata || {},
    })
    .select()
    .single();

  if (error) {
    console.error('Failed to create activity event:', error);
    return null;
  }

  return mapActivityEvent(data);
}

/**
 * Get activity events for a workspace
 */
export async function getActivityEvents(
  workspaceId: string,
  options: ActivityFilterOptions = {}
): Promise<{ events: ActivityEvent[]; total: number }> {
  const supabase = await createClient();

  let query = supabase
    .from('activity_events')
    .select('*, user:users(id, email, raw_user_meta_data)', { count: 'exact' })
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false });

  // Apply filters
  if (options.categories && options.categories.length > 0) {
    query = query.in('category', options.categories);
  }

  if (options.eventTypes && options.eventTypes.length > 0) {
    query = query.in('event_type', options.eventTypes);
  }

  if (options.userId) {
    query = query.eq('user_id', options.userId);
  }

  if (options.startDate) {
    query = query.gte('created_at', options.startDate);
  }

  if (options.endDate) {
    query = query.lte('created_at', options.endDate);
  }

  // Apply pagination
  const limit = options.limit || 50;
  const offset = options.offset || 0;
  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) {
    console.error('Failed to get activity events:', error);
    return { events: [], total: 0 };
  }

  return {
    events: (data || []).map(mapActivityEventWithUser),
    total: count || 0,
  };
}

/**
 * Get recent activity events for a workspace
 */
export async function getRecentActivity(
  workspaceId: string,
  limit: number = 10
): Promise<ActivityEvent[]> {
  const { events } = await getActivityEvents(workspaceId, { limit });
  return events;
}

/**
 * Map database row to ActivityEvent
 */
function mapActivityEvent(row: Record<string, unknown>): ActivityEvent {
  return {
    id: row.id as string,
    workspaceId: row.workspace_id as string,
    userId: row.user_id as string,
    eventType: row.event_type as ActivityEventType,
    category: row.category as ActivityEvent['category'],
    severity: row.severity as ActivityEvent['severity'],
    title: row.title as string,
    description: row.description as string | undefined,
    metadata: (row.metadata || {}) as ActivityMetadata,
    createdAt: row.created_at as string,
  };
}

/**
 * Map database row with user join to ActivityEvent
 */
function mapActivityEventWithUser(row: Record<string, unknown>): ActivityEvent {
  const event = mapActivityEvent(row);

  const user = row.user as Record<string, unknown> | null;
  if (user) {
    const rawMeta = user.raw_user_meta_data as Record<string, string> | null;
    event.user = {
      id: user.id as string,
      email: user.email as string,
      fullName: rawMeta?.full_name || rawMeta?.name,
      avatarUrl: rawMeta?.avatar_url,
    };
  }

  return event;
}

// Activity tracking helper functions

/**
 * Track workspace creation
 */
export async function trackWorkspaceCreated(
  workspaceId: string,
  userId: string,
  workspaceName: string
): Promise<void> {
  await createActivityEvent({
    workspaceId,
    userId,
    eventType: 'workspace.created',
    title: `Created workspace "${workspaceName}"`,
  });
}

/**
 * Track member invited
 */
export async function trackMemberInvited(
  workspaceId: string,
  userId: string,
  memberEmail: string
): Promise<void> {
  await createActivityEvent({
    workspaceId,
    userId,
    eventType: 'member.invited',
    title: `Invited ${memberEmail} to the workspace`,
    metadata: { memberEmail },
  });
}

/**
 * Track member role changed
 */
export async function trackMemberRoleChanged(
  workspaceId: string,
  userId: string,
  memberEmail: string,
  oldRole: string,
  newRole: string
): Promise<void> {
  await createActivityEvent({
    workspaceId,
    userId,
    eventType: 'member.role_changed',
    title: `Changed ${memberEmail}'s role from ${oldRole} to ${newRole}`,
    metadata: { memberEmail, oldValue: oldRole, newValue: newRole },
  });
}

/**
 * Track document uploaded
 */
export async function trackDocumentUploaded(
  workspaceId: string,
  userId: string,
  documentId: string,
  documentName: string
): Promise<void> {
  await createActivityEvent({
    workspaceId,
    userId,
    eventType: 'document.uploaded',
    title: `Uploaded document "${documentName}"`,
    metadata: { documentId, documentName },
  });
}

/**
 * Track document processed
 */
export async function trackDocumentProcessed(
  workspaceId: string,
  userId: string,
  documentId: string,
  documentName: string
): Promise<void> {
  await createActivityEvent({
    workspaceId,
    userId,
    eventType: 'document.processed',
    title: `Processed document "${documentName}"`,
    metadata: { documentId, documentName },
  });
}

/**
 * Track website created
 */
export async function trackWebsiteCreated(
  workspaceId: string,
  userId: string,
  websiteId: string,
  websiteName: string
): Promise<void> {
  await createActivityEvent({
    workspaceId,
    userId,
    eventType: 'website.created',
    title: `Created website "${websiteName}"`,
    metadata: { websiteId, websiteName },
  });
}

/**
 * Track website published
 */
export async function trackWebsitePublished(
  workspaceId: string,
  userId: string,
  websiteId: string,
  websiteName: string
): Promise<void> {
  await createActivityEvent({
    workspaceId,
    userId,
    eventType: 'website.published',
    title: `Published website "${websiteName}"`,
    metadata: { websiteId, websiteName },
  });
}

/**
 * Track page created
 */
export async function trackPageCreated(
  workspaceId: string,
  userId: string,
  pageId: string,
  pageName: string,
  websiteId: string,
  websiteName: string
): Promise<void> {
  await createActivityEvent({
    workspaceId,
    userId,
    eventType: 'page.created',
    title: `Created page "${pageName}" in ${websiteName}`,
    metadata: { pageId, pageName, websiteId, websiteName },
  });
}

/**
 * Track deployment started
 */
export async function trackDeploymentStarted(
  workspaceId: string,
  userId: string,
  deploymentId: string,
  websiteName: string
): Promise<void> {
  await createActivityEvent({
    workspaceId,
    userId,
    eventType: 'deployment.started',
    title: `Started deployment for "${websiteName}"`,
    metadata: { deploymentId, websiteName },
  });
}

/**
 * Track deployment succeeded
 */
export async function trackDeploymentSucceeded(
  workspaceId: string,
  userId: string,
  deploymentId: string,
  websiteName: string,
  deploymentUrl: string
): Promise<void> {
  await createActivityEvent({
    workspaceId,
    userId,
    eventType: 'deployment.succeeded',
    title: `Deployed "${websiteName}" successfully`,
    metadata: { deploymentId, websiteName, deploymentUrl },
  });
}

/**
 * Track deployment failed
 */
export async function trackDeploymentFailed(
  workspaceId: string,
  userId: string,
  deploymentId: string,
  websiteName: string,
  errorMessage: string
): Promise<void> {
  await createActivityEvent({
    workspaceId,
    userId,
    eventType: 'deployment.failed',
    title: `Deployment failed for "${websiteName}"`,
    description: errorMessage,
    metadata: { deploymentId, websiteName, errorMessage },
  });
}

/**
 * Track export created
 */
export async function trackExportCreated(
  workspaceId: string,
  userId: string,
  websiteId: string,
  websiteName: string
): Promise<void> {
  await createActivityEvent({
    workspaceId,
    userId,
    eventType: 'export.created',
    title: `Exported website "${websiteName}"`,
    metadata: { websiteId, websiteName },
  });
}

/**
 * Track brand updated
 */
export async function trackBrandUpdated(
  workspaceId: string,
  userId: string,
  websiteId: string,
  websiteName: string
): Promise<void> {
  await createActivityEvent({
    workspaceId,
    userId,
    eventType: 'brand.updated',
    title: `Updated branding for "${websiteName}"`,
    metadata: { websiteId, websiteName },
  });
}
