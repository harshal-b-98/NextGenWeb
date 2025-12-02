/**
 * Interactive Response Storage Service
 * Phase 4.1: Interactive Elements System
 *
 * Service for storing and retrieving interactive element responses.
 */

import { createClient } from '@/lib/supabase/server';
import { v4 as uuidv4 } from 'uuid';
import { InsertTables, Json } from '@/types/database';
import {
  InteractiveResponse,
  QuizResponse,
  CalculatorResponse,
  SurveyResponse,
  AnyInteractiveResponse,
  InteractiveAnalytics,
} from '../types';

// ============================================================================
// TYPES
// ============================================================================

export interface ResponseListOptions {
  elementId?: string;
  websiteId?: string;
  visitorId?: string;
  sessionId?: string;
  completed?: boolean;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}

export interface ResponseServiceResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface SubmitResponseInput {
  elementId: string;
  websiteId: string;
  visitorId: string;
  sessionId: string;
  pageUrl?: string;
  responses: Record<string, unknown>;
  completed?: boolean;
  timeSpentSeconds: number;
  deviceType?: 'desktop' | 'tablet' | 'mobile';
  userAgent?: string;
  referrer?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  email?: string;
  name?: string;
  phone?: string;
  company?: string;
  customFields?: Record<string, string>;
}

// ============================================================================
// DATABASE TYPES
// ============================================================================

// Use explicit any for database row type to simplify type coercion
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DbRow = any;

// ============================================================================
// RESPONSE SERVICE
// ============================================================================

export class InteractiveResponseService {
  private workspaceId: string;

  constructor(workspaceId: string) {
    this.workspaceId = workspaceId;
  }

  // ============================================================================
  // SUBMIT RESPONSE
  // ============================================================================

  /**
   * Submit an interactive element response
   */
  async submitResponse(
    input: SubmitResponseInput,
    results?: Record<string, unknown>
  ): Promise<ResponseServiceResult<InteractiveResponse>> {
    try {
      const supabase = await createClient();

      // Verify element belongs to workspace
      const { data: element, error: elementError } = await supabase
        .from('interactive_elements')
        .select(
          `
          id,
          type,
          websites!inner(workspace_id)
        `
        )
        .eq('id', input.elementId)
        .eq('websites.workspace_id', this.workspaceId)
        .single();

      if (elementError || !element) {
        return {
          success: false,
          error: 'Element not found or does not belong to this workspace',
        };
      }

      const now = new Date().toISOString();
      const id = uuidv4();

      // Calculate completion percentage
      const completionPercentage = input.completed ? 100 : this.calculateCompletion(input.responses);

      const insertData: InsertTables<'interactive_responses'> = {
        id,
        element_id: input.elementId,
        website_id: input.websiteId,
        visitor_id: input.visitorId,
        session_id: input.sessionId,
        responses: input.responses as unknown as Json,
        results: (results || null) as Json | null,
        completion_percentage: completionPercentage,
        time_spent_seconds: input.timeSpentSeconds,
        email: input.email || null,
        name: input.name || null,
        device_type: input.deviceType || null,
        referrer: input.referrer || null,
        created_at: now,
      };

      const { data, error } = await supabase
        .from('interactive_responses')
        .insert(insertData)
        .select()
        .single();

      if (error) {
        console.error('Error submitting response:', error);
        return {
          success: false,
          error: `Failed to submit response: ${error.message}`,
        };
      }

      // Create lead capture record if email provided
      if (input.email) {
        await this.createLeadCapture(input, element.type);
      }

      const response: InteractiveResponse = {
        id: data.id,
        elementId: data.element_id,
        websiteId: data.website_id,
        visitorId: data.visitor_id,
        sessionId: data.session_id,
        pageUrl: input.pageUrl,
        responses: data.responses as Record<string, unknown>,
        completed: completionPercentage === 100,
        completionPercentage,
        startedAt: now,
        completedAt: input.completed ? now : undefined,
        timeSpentSeconds: data.time_spent_seconds,
        deviceType: (data.device_type as 'desktop' | 'tablet' | 'mobile') || 'desktop',
        userAgent: input.userAgent,
        referrer: data.referrer || undefined,
        utmSource: input.utmSource,
        utmMedium: input.utmMedium,
        utmCampaign: input.utmCampaign,
        email: data.email || undefined,
        name: data.name || undefined,
        phone: input.phone,
        company: input.company,
        customFields: input.customFields,
      };

      return {
        success: true,
        data: response,
      };
    } catch (error) {
      console.error('Response submission error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private calculateCompletion(responses: Record<string, unknown>): number {
    const keys = Object.keys(responses);
    if (keys.length === 0) return 0;

    const answered = keys.filter(
      (k) => responses[k] !== undefined && responses[k] !== null && responses[k] !== ''
    ).length;

    return Math.round((answered / keys.length) * 100);
  }

  private async createLeadCapture(
    input: SubmitResponseInput,
    elementType: string
  ): Promise<void> {
    try {
      // Only create lead capture if email is provided
      if (!input.email) return;

      const supabase = await createClient();

      // Store additional data in the 'data' json field
      const leadData = {
        phone: input.phone,
        company: input.company,
        source_component: `interactive-${elementType}`,
        custom_fields: input.customFields,
        utm_source: input.utmSource,
        utm_medium: input.utmMedium,
        utm_campaign: input.utmCampaign,
      };

      await supabase.from('lead_captures').insert({
        id: uuidv4(),
        website_id: input.websiteId,
        email: input.email,
        name: input.name || null,
        data: leadData as unknown as Json,
        source: `interactive-${elementType}`,
        created_at: new Date().toISOString(),
      });
    } catch (error) {
      // Log but don't fail the main operation
      console.error('Error creating lead capture:', error);
    }
  }

  // ============================================================================
  // READ RESPONSES
  // ============================================================================

  /**
   * Get a response by ID
   */
  async getResponse(
    responseId: string
  ): Promise<ResponseServiceResult<InteractiveResponse>> {
    try {
      const supabase = await createClient();

      const { data, error } = await supabase
        .from('interactive_responses')
        .select(
          `
          *,
          interactive_elements!inner(
            websites!inner(workspace_id)
          )
        `
        )
        .eq('id', responseId)
        .eq('interactive_elements.websites.workspace_id', this.workspaceId)
        .single();

      if (error || !data) {
        return {
          success: false,
          error: 'Response not found',
        };
      }

      return {
        success: true,
        data: this.mapRowToResponse(data),
      };
    } catch (error) {
      console.error('Response fetch error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * List responses
   */
  async listResponses(
    options: ResponseListOptions = {}
  ): Promise<ResponseServiceResult<InteractiveResponse[]>> {
    try {
      const supabase = await createClient();

      let query = supabase
        .from('interactive_responses')
        .select(
          `
          *,
          interactive_elements!inner(
            websites!inner(workspace_id)
          )
        `
        )
        .eq('interactive_elements.websites.workspace_id', this.workspaceId);

      if (options.elementId) {
        query = query.eq('element_id', options.elementId);
      }

      if (options.websiteId) {
        query = query.eq('website_id', options.websiteId);
      }

      if (options.visitorId) {
        query = query.eq('visitor_id', options.visitorId);
      }

      if (options.sessionId) {
        query = query.eq('session_id', options.sessionId);
      }

      if (options.completed !== undefined) {
        query = query.eq('completion_percentage', options.completed ? 100 : 0);
      }

      if (options.startDate) {
        query = query.gte('created_at', options.startDate);
      }

      if (options.endDate) {
        query = query.lte('created_at', options.endDate);
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
          error: `Failed to list responses: ${error.message}`,
        };
      }

      return {
        success: true,
        data: data.map((row: DbRow) => this.mapRowToResponse(row)),
      };
    } catch (error) {
      console.error('Response list error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get responses for a specific element
   */
  async getElementResponses(
    elementId: string,
    options?: Omit<ResponseListOptions, 'elementId'>
  ): Promise<ResponseServiceResult<InteractiveResponse[]>> {
    return this.listResponses({ ...options, elementId });
  }

  // ============================================================================
  // ANALYTICS
  // ============================================================================

  /**
   * Get analytics for an element
   */
  async getElementAnalytics(
    elementId: string,
    period: 'day' | 'week' | 'month' | 'all' = 'all'
  ): Promise<ResponseServiceResult<InteractiveAnalytics>> {
    try {
      const supabase = await createClient();

      // Determine date filter
      let startDate: string | undefined;
      const now = new Date();
      switch (period) {
        case 'day':
          startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
          break;
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
          break;
        case 'month':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
          break;
      }

      let query = supabase
        .from('interactive_responses')
        .select('*')
        .eq('element_id', elementId);

      if (startDate) {
        query = query.gte('created_at', startDate);
      }

      const { data: responses, error } = await query;

      if (error) {
        return {
          success: false,
          error: `Failed to fetch analytics: ${error.message}`,
        };
      }

      const totalResponses = responses.length;
      const completedResponses = responses.filter(
        (r: DbRow) => r.completion_percentage === 100
      ).length;
      const uniqueVisitors = new Set(responses.map((r: DbRow) => r.visitor_id)).size;

      // Calculate averages
      const avgTimeSpent =
        totalResponses > 0
          ? responses.reduce((sum: number, r: DbRow) => sum + r.time_spent_seconds, 0) / totalResponses
          : 0;

      const leadsGenerated = responses.filter((r: DbRow) => r.email).length;

      // Device breakdown
      const byDevice = {
        desktop: responses.filter((r: DbRow) => r.device_type === 'desktop').length,
        tablet: responses.filter((r: DbRow) => r.device_type === 'tablet').length,
        mobile: responses.filter((r: DbRow) => r.device_type === 'mobile').length,
      };

      const analytics: InteractiveAnalytics = {
        elementId,
        period,
        totalViews: totalResponses, // Views and responses are same for now
        uniqueViews: uniqueVisitors,
        totalStarts: totalResponses,
        totalCompletions: completedResponses,
        completionRate: totalResponses > 0 ? (completedResponses / totalResponses) * 100 : 0,
        abandonmentRate:
          totalResponses > 0 ? ((totalResponses - completedResponses) / totalResponses) * 100 : 0,
        avgTimeSpent,
        leadsGenerated,
        conversionRate: totalResponses > 0 ? (leadsGenerated / totalResponses) * 100 : 0,
        byDevice,
      };

      return {
        success: true,
        data: analytics,
      };
    } catch (error) {
      console.error('Analytics fetch error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // ============================================================================
  // DELETE
  // ============================================================================

  /**
   * Delete a response
   */
  async deleteResponse(responseId: string): Promise<ResponseServiceResult<void>> {
    try {
      const supabase = await createClient();

      // Verify response belongs to workspace
      const existing = await this.getResponse(responseId);
      if (!existing.success) {
        return {
          success: false,
          error: existing.error || 'Response not found',
        };
      }

      const { error } = await supabase
        .from('interactive_responses')
        .delete()
        .eq('id', responseId);

      if (error) {
        return {
          success: false,
          error: `Failed to delete response: ${error.message}`,
        };
      }

      return { success: true };
    } catch (error) {
      console.error('Response delete error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Delete all responses for an element
   */
  async deleteElementResponses(elementId: string): Promise<ResponseServiceResult<void>> {
    try {
      const supabase = await createClient();

      const { error } = await supabase
        .from('interactive_responses')
        .delete()
        .eq('element_id', elementId);

      if (error) {
        return {
          success: false,
          error: `Failed to delete responses: ${error.message}`,
        };
      }

      return { success: true };
    } catch (error) {
      console.error('Bulk response delete error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // ============================================================================
  // HELPERS
  // ============================================================================

  private mapRowToResponse(row: DbRow): InteractiveResponse {
    return {
      id: row.id,
      elementId: row.element_id,
      websiteId: row.website_id,
      visitorId: row.visitor_id,
      sessionId: row.session_id,
      responses: row.responses,
      completed: row.completion_percentage === 100,
      completionPercentage: row.completion_percentage,
      startedAt: row.created_at,
      completedAt: row.completion_percentage === 100 ? row.created_at : undefined,
      timeSpentSeconds: row.time_spent_seconds,
      deviceType: (row.device_type as 'desktop' | 'tablet' | 'mobile') || 'desktop',
      referrer: row.referrer || undefined,
      email: row.email || undefined,
      name: row.name || undefined,
    };
  }
}

// ============================================================================
// FACTORY FUNCTION
// ============================================================================

/**
 * Create an InteractiveResponseService instance
 */
export function createResponseService(workspaceId: string): InteractiveResponseService {
  return new InteractiveResponseService(workspaceId);
}
