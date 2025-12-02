/**
 * Interactive Element Storage Service
 * Phase 4.1: Interactive Elements System
 *
 * CRUD operations for interactive elements in Supabase.
 */

import { createClient } from '@/lib/supabase/server';
import { v4 as uuidv4 } from 'uuid';
import {
  AnyInteractiveConfig,
  InteractiveElementType,
  QuizConfig,
  CalculatorConfig,
  SurveyConfig,
  ComparisonConfig,
  FormConfig,
  ConfiguratorConfig,
} from '../types';
import {
  InteractiveElementType as DbInteractiveElementType,
  InteractiveElementStatus as DbInteractiveElementStatus,
  InsertTables,
  Json,
} from '@/types/database';

// ============================================================================
// TYPES
// ============================================================================

export interface ElementListOptions {
  websiteId?: string;
  pageId?: string;
  type?: InteractiveElementType;
  status?: 'draft' | 'published' | 'archived';
  limit?: number;
  offset?: number;
}

export interface ElementServiceResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// ============================================================================
// DATABASE TYPES
// ============================================================================

// Use explicit any for database row type to simplify type coercion
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DbRow = any;

// ============================================================================
// ELEMENT SERVICE
// ============================================================================

export class InteractiveElementService {
  private workspaceId: string;

  constructor(workspaceId: string) {
    this.workspaceId = workspaceId;
  }

  // ============================================================================
  // CREATE
  // ============================================================================

  /**
   * Create a new interactive element
   */
  async createElement(
    config: Omit<AnyInteractiveConfig, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<ElementServiceResult<AnyInteractiveConfig>> {
    try {
      const supabase = await createClient();

      // Verify website belongs to workspace
      const { data: website, error: websiteError } = await supabase
        .from('websites')
        .select('id')
        .eq('id', config.websiteId)
        .eq('workspace_id', this.workspaceId)
        .single();

      if (websiteError || !website) {
        return {
          success: false,
          error: 'Website not found or does not belong to this workspace',
        };
      }

      const now = new Date().toISOString();
      const id = uuidv4();

      const fullConfig: AnyInteractiveConfig = {
        ...config,
        id,
        createdAt: now,
        updatedAt: now,
      } as AnyInteractiveConfig;

      const insertData: InsertTables<'interactive_elements'> = {
        id,
        website_id: config.websiteId,
        page_id: config.pageId || null,
        type: config.type as DbInteractiveElementType,
        config: fullConfig as unknown as Json,
        status: (config.status || 'draft') as DbInteractiveElementStatus,
        analytics_config: (config.tracking || null) as Json | null,
      };

      const { data, error } = await supabase
        .from('interactive_elements')
        .insert(insertData)
        .select()
        .single();

      if (error) {
        console.error('Error creating interactive element:', error);
        return {
          success: false,
          error: `Failed to create element: ${error.message}`,
        };
      }

      return {
        success: true,
        data: data.config as unknown as AnyInteractiveConfig,
      };
    } catch (error) {
      console.error('Element creation error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // ============================================================================
  // READ
  // ============================================================================

  /**
   * Get an interactive element by ID
   */
  async getElement(
    elementId: string
  ): Promise<ElementServiceResult<AnyInteractiveConfig>> {
    try {
      const supabase = await createClient();

      const { data, error } = await supabase
        .from('interactive_elements')
        .select(
          `
          *,
          websites!inner(workspace_id)
        `
        )
        .eq('id', elementId)
        .eq('websites.workspace_id', this.workspaceId)
        .single();

      if (error || !data) {
        return {
          success: false,
          error: 'Element not found',
        };
      }

      return {
        success: true,
        data: data.config as unknown as AnyInteractiveConfig,
      };
    } catch (error) {
      console.error('Element fetch error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * List interactive elements
   */
  async listElements(
    options: ElementListOptions = {}
  ): Promise<ElementServiceResult<AnyInteractiveConfig[]>> {
    try {
      const supabase = await createClient();

      let query = supabase
        .from('interactive_elements')
        .select(
          `
          *,
          websites!inner(workspace_id)
        `
        )
        .eq('websites.workspace_id', this.workspaceId);

      if (options.websiteId) {
        query = query.eq('website_id', options.websiteId);
      }

      if (options.pageId) {
        query = query.eq('page_id', options.pageId);
      }

      if (options.type) {
        query = query.eq('type', options.type);
      }

      if (options.status) {
        query = query.eq('status', options.status);
      }

      query = query.order('created_at', { ascending: false });

      if (options.limit) {
        query = query.limit(options.limit);
      }

      if (options.offset) {
        query = query.range(
          options.offset,
          options.offset + (options.limit || 50) - 1
        );
      }

      const { data, error } = await query;

      if (error) {
        return {
          success: false,
          error: `Failed to list elements: ${error.message}`,
        };
      }

      return {
        success: true,
        data: data.map((row: DbRow) => row.config as AnyInteractiveConfig),
      };
    } catch (error) {
      console.error('Element list error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get elements for a specific page
   */
  async getPageElements(
    pageId: string
  ): Promise<ElementServiceResult<AnyInteractiveConfig[]>> {
    return this.listElements({ pageId, status: 'published' });
  }

  // ============================================================================
  // UPDATE
  // ============================================================================

  /**
   * Update an interactive element
   */
  async updateElement(
    elementId: string,
    updates: Partial<AnyInteractiveConfig>
  ): Promise<ElementServiceResult<AnyInteractiveConfig>> {
    try {
      const supabase = await createClient();

      // First get the existing element
      const existing = await this.getElement(elementId);
      if (!existing.success || !existing.data) {
        return {
          success: false,
          error: existing.error || 'Element not found',
        };
      }

      const now = new Date().toISOString();
      const updatedConfig: AnyInteractiveConfig = {
        ...existing.data,
        ...updates,
        id: elementId, // Ensure ID doesn't change
        updatedAt: now,
      } as AnyInteractiveConfig;

      const updateData = {
        config: updatedConfig as unknown as Json,
        status: (updates.status || existing.data.status) as DbInteractiveElementStatus,
        page_id: updates.pageId !== undefined ? updates.pageId : existing.data.pageId,
        analytics_config: (updates.tracking || existing.data.tracking || null) as Json | null,
        updated_at: now,
      };

      const { data, error } = await supabase
        .from('interactive_elements')
        .update(updateData)
        .eq('id', elementId)
        .select()
        .single();

      if (error) {
        return {
          success: false,
          error: `Failed to update element: ${error.message}`,
        };
      }

      return {
        success: true,
        data: data.config as unknown as AnyInteractiveConfig,
      };
    } catch (error) {
      console.error('Element update error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Publish an element
   */
  async publishElement(
    elementId: string
  ): Promise<ElementServiceResult<AnyInteractiveConfig>> {
    return this.updateElement(elementId, { status: 'published' });
  }

  /**
   * Archive an element
   */
  async archiveElement(
    elementId: string
  ): Promise<ElementServiceResult<AnyInteractiveConfig>> {
    return this.updateElement(elementId, { status: 'archived' });
  }

  // ============================================================================
  // DELETE
  // ============================================================================

  /**
   * Delete an interactive element
   */
  async deleteElement(elementId: string): Promise<ElementServiceResult<void>> {
    try {
      const supabase = await createClient();

      // First verify the element belongs to this workspace
      const existing = await this.getElement(elementId);
      if (!existing.success) {
        return {
          success: false,
          error: existing.error || 'Element not found',
        };
      }

      const { error } = await supabase
        .from('interactive_elements')
        .delete()
        .eq('id', elementId);

      if (error) {
        return {
          success: false,
          error: `Failed to delete element: ${error.message}`,
        };
      }

      return { success: true };
    } catch (error) {
      console.error('Element delete error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // ============================================================================
  // DUPLICATION
  // ============================================================================

  /**
   * Duplicate an element
   */
  async duplicateElement(
    elementId: string,
    options?: { websiteId?: string; pageId?: string }
  ): Promise<ElementServiceResult<AnyInteractiveConfig>> {
    try {
      const existing = await this.getElement(elementId);
      if (!existing.success || !existing.data) {
        return {
          success: false,
          error: existing.error || 'Element not found',
        };
      }

      const { id, createdAt, updatedAt, ...configWithoutMeta } = existing.data;

      const newConfig = {
        ...configWithoutMeta,
        title: `${existing.data.title} (Copy)`,
        websiteId: options?.websiteId || existing.data.websiteId,
        pageId: options?.pageId,
        status: 'draft' as const,
      };

      return this.createElement(newConfig);
    } catch (error) {
      console.error('Element duplication error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

// ============================================================================
// FACTORY FUNCTION
// ============================================================================

/**
 * Create an InteractiveElementService instance
 */
export function createElementService(workspaceId: string): InteractiveElementService {
  return new InteractiveElementService(workspaceId);
}
