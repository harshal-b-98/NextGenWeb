/**
 * Global Components Data Access Layer
 *
 * Functions for managing site-wide components like headers, footers,
 * announcement bars, and other global UI elements.
 *
 * Story #125: Global Components Data Access Layer
 * Task #133: Create getGlobalComponents function
 * Task #134: Create saveGlobalComponents function
 */

import { createClient } from '@/lib/supabase/server';
import type { GlobalComponentType, SiteGlobalComponent, Json } from '@/types/database';

/**
 * Content structure for header components
 */
export interface HeaderContent {
  companyName?: string;
  logo?: {
    url: string;
    alt: string;
    width?: number;
    height?: number;
  };
  navItems: Array<{
    label: string;
    href: string;
    children?: Array<{
      label: string;
      href: string;
      description?: string;
      icon?: string;
    }>;
  }>;
  ctaButton?: {
    label: string;
    href: string;
    variant: 'primary' | 'secondary' | 'outline';
  };
  secondaryButton?: {
    label: string;
    href: string;
  };
  sticky?: boolean;
  transparent?: boolean;
}

/**
 * Content structure for footer components
 */
export interface FooterContent {
  companyName?: string;
  logo?: {
    url: string;
    alt: string;
  };
  description?: string;
  columns: Array<{
    title: string;
    links: Array<{
      label: string;
      href: string;
    }>;
  }>;
  socialLinks?: Array<{
    platform: 'twitter' | 'linkedin' | 'facebook' | 'instagram' | 'youtube' | 'github';
    url: string;
  }>;
  bottomLinks?: Array<{
    label: string;
    href: string;
  }>;
  copyright?: string;
  background?: 'light' | 'dark' | 'brand';
}

/**
 * Unified global component interface for application use
 */
export interface GlobalComponent {
  id: string;
  websiteId: string;
  type: GlobalComponentType;
  componentId: string;
  content: HeaderContent | FooterContent | Record<string, unknown>;
  styling?: Record<string, unknown>;
  visibility: {
    showOn: string[] | 'all';
    hideOn?: string[];
  };
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Input for creating/updating a global component
 */
export interface GlobalComponentInput {
  type: GlobalComponentType;
  componentId: string;
  content: HeaderContent | FooterContent | Record<string, unknown>;
  styling?: Record<string, unknown>;
  visibility?: {
    showOn: string[] | 'all';
    hideOn?: string[];
  };
  sortOrder?: number;
  isActive?: boolean;
}

/**
 * Convert database row to application type
 */
function rowToGlobalComponent(row: SiteGlobalComponent): GlobalComponent {
  return {
    id: row.id,
    websiteId: row.website_id,
    type: row.type,
    componentId: row.component_id,
    content: row.content as HeaderContent | FooterContent | Record<string, unknown>,
    styling: (row.styling as Record<string, unknown>) || undefined,
    visibility: row.visibility as { showOn: string[] | 'all'; hideOn?: string[] },
    sortOrder: row.sort_order,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Get all active global components for a website
 *
 * @param websiteId - The website UUID
 * @returns Array of global components (header, footer, etc.)
 */
export async function getGlobalComponents(websiteId: string): Promise<GlobalComponent[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('site_global_components')
    .select('*')
    .eq('website_id', websiteId)
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('[getGlobalComponents] Error fetching global components:', error);
    return [];
  }

  return (data || []).map(rowToGlobalComponent);
}

/**
 * Get a specific global component by type
 *
 * @param websiteId - The website UUID
 * @param type - The component type (header, footer, etc.)
 * @returns The global component or null if not found
 */
export async function getGlobalComponentByType(
  websiteId: string,
  type: GlobalComponentType
): Promise<GlobalComponent | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('site_global_components')
    .select('*')
    .eq('website_id', websiteId)
    .eq('type', type)
    .eq('is_active', true)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // No rows returned - not an error
      return null;
    }
    console.error(`[getGlobalComponentByType] Error fetching ${type}:`, error);
    return null;
  }

  return data ? rowToGlobalComponent(data) : null;
}

/**
 * Get header component for a website
 */
export async function getHeader(websiteId: string): Promise<GlobalComponent | null> {
  return getGlobalComponentByType(websiteId, 'header');
}

/**
 * Get footer component for a website
 */
export async function getFooter(websiteId: string): Promise<GlobalComponent | null> {
  return getGlobalComponentByType(websiteId, 'footer');
}

/**
 * Save global components for a website (upsert)
 *
 * @param websiteId - The website UUID
 * @param components - Array of components to save
 */
export async function saveGlobalComponents(
  websiteId: string,
  components: GlobalComponentInput[]
): Promise<{ success: boolean; error?: string; components?: GlobalComponent[] }> {
  const supabase = await createClient();

  const upsertData = components.map((component) => ({
    website_id: websiteId,
    type: component.type,
    component_id: component.componentId,
    content: component.content as Json,
    styling: (component.styling as Json) || {},
    visibility: (component.visibility as Json) || { showOn: 'all' },
    sort_order: component.sortOrder ?? 0,
    is_active: component.isActive ?? true,
  }));

  const { data, error } = await supabase
    .from('site_global_components')
    .upsert(upsertData, {
      onConflict: 'website_id,type',
      ignoreDuplicates: false,
    })
    .select();

  if (error) {
    console.error('[saveGlobalComponents] Error saving global components:', error);
    return { success: false, error: error.message };
  }

  return {
    success: true,
    components: (data || []).map(rowToGlobalComponent),
  };
}

/**
 * Save a single global component
 */
export async function saveGlobalComponent(
  websiteId: string,
  component: GlobalComponentInput
): Promise<{ success: boolean; error?: string; component?: GlobalComponent }> {
  const result = await saveGlobalComponents(websiteId, [component]);

  return {
    success: result.success,
    error: result.error,
    component: result.components?.[0],
  };
}

/**
 * Update a global component by ID
 *
 * @param componentId - The component UUID
 * @param updates - Partial updates to apply
 */
export async function updateGlobalComponent(
  componentId: string,
  updates: Partial<GlobalComponentInput>
): Promise<{ success: boolean; error?: string; component?: GlobalComponent }> {
  const supabase = await createClient();

  const updateData: Record<string, unknown> = {};

  if (updates.componentId !== undefined) {
    updateData.component_id = updates.componentId;
  }
  if (updates.content !== undefined) {
    updateData.content = updates.content as Json;
  }
  if (updates.styling !== undefined) {
    updateData.styling = updates.styling as Json;
  }
  if (updates.visibility !== undefined) {
    updateData.visibility = updates.visibility as Json;
  }
  if (updates.sortOrder !== undefined) {
    updateData.sort_order = updates.sortOrder;
  }
  if (updates.isActive !== undefined) {
    updateData.is_active = updates.isActive;
  }

  const { data, error } = await supabase
    .from('site_global_components')
    .update(updateData)
    .eq('id', componentId)
    .select()
    .single();

  if (error) {
    console.error('[updateGlobalComponent] Error updating component:', error);
    return { success: false, error: error.message };
  }

  return {
    success: true,
    component: data ? rowToGlobalComponent(data) : undefined,
  };
}

/**
 * Delete a global component
 *
 * @param componentId - The component UUID
 */
export async function deleteGlobalComponent(
  componentId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('site_global_components')
    .delete()
    .eq('id', componentId);

  if (error) {
    console.error('[deleteGlobalComponent] Error deleting component:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Deactivate a global component (soft delete)
 *
 * @param componentId - The component UUID
 */
export async function deactivateGlobalComponent(
  componentId: string
): Promise<{ success: boolean; error?: string }> {
  const result = await updateGlobalComponent(componentId, { isActive: false });
  return { success: result.success, error: result.error };
}

/**
 * Check if a website has global components configured
 */
export async function hasGlobalComponents(websiteId: string): Promise<boolean> {
  const components = await getGlobalComponents(websiteId);
  return components.length > 0;
}

/**
 * Get global components summary for a website
 */
export async function getGlobalComponentsSummary(
  websiteId: string
): Promise<{ hasHeader: boolean; hasFooter: boolean; componentCount: number }> {
  const components = await getGlobalComponents(websiteId);

  return {
    hasHeader: components.some((c) => c.type === 'header'),
    hasFooter: components.some((c) => c.type === 'footer'),
    componentCount: components.length,
  };
}
