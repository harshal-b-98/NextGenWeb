/**
 * Activity Feed Types
 * Phase 4.1: Enterprise Scale - Activity Feed
 *
 * Types for tracking workspace activities and events.
 */

import { z } from 'zod';

/**
 * Activity event types
 */
export type ActivityEventType =
  // Workspace events
  | 'workspace.created'
  | 'workspace.updated'
  | 'workspace.deleted'
  // Member events
  | 'member.invited'
  | 'member.joined'
  | 'member.removed'
  | 'member.role_changed'
  // Document events
  | 'document.uploaded'
  | 'document.processed'
  | 'document.deleted'
  // Knowledge base events
  | 'knowledge.generated'
  | 'knowledge.updated'
  // Website events
  | 'website.created'
  | 'website.updated'
  | 'website.published'
  | 'website.unpublished'
  | 'website.deleted'
  // Page events
  | 'page.created'
  | 'page.updated'
  | 'page.published'
  | 'page.deleted'
  // Deployment events
  | 'deployment.started'
  | 'deployment.succeeded'
  | 'deployment.failed'
  | 'deployment.canceled'
  // Domain events
  | 'domain.added'
  | 'domain.verified'
  | 'domain.removed'
  // Brand events
  | 'brand.updated'
  // Export events
  | 'export.created';

/**
 * Activity event category
 */
export type ActivityCategory =
  | 'workspace'
  | 'member'
  | 'document'
  | 'knowledge'
  | 'website'
  | 'page'
  | 'deployment'
  | 'domain'
  | 'brand'
  | 'export';

/**
 * Activity event severity/importance
 */
export type ActivitySeverity = 'info' | 'success' | 'warning' | 'error';

/**
 * Activity event metadata
 */
export interface ActivityMetadata {
  // Entity references
  documentId?: string;
  documentName?: string;
  websiteId?: string;
  websiteName?: string;
  pageId?: string;
  pageName?: string;
  deploymentId?: string;
  deploymentUrl?: string;
  domainId?: string;
  domainName?: string;
  memberId?: string;
  memberEmail?: string;
  memberName?: string;
  // Additional context
  oldValue?: string;
  newValue?: string;
  reason?: string;
  errorMessage?: string;
  [key: string]: string | undefined;
}

/**
 * Activity event record
 */
export interface ActivityEvent {
  id: string;
  workspaceId: string;
  userId: string;
  eventType: ActivityEventType;
  category: ActivityCategory;
  severity: ActivitySeverity;
  title: string;
  description?: string;
  metadata: ActivityMetadata;
  createdAt: string;
  // Joined user info
  user?: {
    id: string;
    email: string;
    fullName?: string;
    avatarUrl?: string;
  };
}

/**
 * Activity event creation input
 */
export interface CreateActivityInput {
  workspaceId: string;
  userId: string;
  eventType: ActivityEventType;
  title: string;
  description?: string;
  metadata?: ActivityMetadata;
}

/**
 * Activity feed filter options
 */
export interface ActivityFilterOptions {
  categories?: ActivityCategory[];
  eventTypes?: ActivityEventType[];
  userId?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}

/**
 * Get category from event type
 */
export function getCategoryFromEventType(eventType: ActivityEventType): ActivityCategory {
  const [category] = eventType.split('.') as [ActivityCategory];
  return category;
}

/**
 * Get severity from event type
 */
export function getSeverityFromEventType(eventType: ActivityEventType): ActivitySeverity {
  if (eventType.includes('deleted') || eventType.includes('removed') || eventType.includes('failed')) {
    return 'error';
  }
  if (eventType.includes('succeeded') || eventType.includes('verified') || eventType.includes('published')) {
    return 'success';
  }
  if (eventType.includes('canceled') || eventType.includes('unpublished')) {
    return 'warning';
  }
  return 'info';
}

/**
 * Activity query schema
 */
export const ActivityQuerySchema = z.object({
  categories: z.array(z.string()).optional(),
  eventTypes: z.array(z.string()).optional(),
  userId: z.string().uuid().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  limit: z.number().min(1).max(100).default(50),
  offset: z.number().min(0).default(0),
});

export type ActivityQueryInput = z.infer<typeof ActivityQuerySchema>;

/**
 * Activity event icons by category
 */
export const ACTIVITY_ICONS: Record<ActivityCategory, string> = {
  workspace: 'Building2',
  member: 'Users',
  document: 'FileText',
  knowledge: 'Brain',
  website: 'Globe',
  page: 'Layout',
  deployment: 'Rocket',
  domain: 'Link',
  brand: 'Palette',
  export: 'Download',
};

/**
 * Activity event colors by severity
 */
export const ACTIVITY_COLORS: Record<ActivitySeverity, string> = {
  info: 'text-blue-500',
  success: 'text-green-500',
  warning: 'text-yellow-500',
  error: 'text-red-500',
};
