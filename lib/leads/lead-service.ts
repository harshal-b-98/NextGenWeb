/**
 * Lead Capture Service
 * Phase 4.4: Conversion & Lead Tools
 *
 * Service for capturing, storing, and managing leads.
 */

import { createClient } from '@/lib/supabase/server';
import { untypedFrom } from '@/lib/supabase/untyped';
import type {
  LeadCapture,
  LeadCaptureInput,
  LeadCaptureResponse,
  LeadListResponse,
} from './types';

/**
 * Lead query filters
 */
export interface LeadQueryFilters {
  websiteId?: string;
  workspaceId?: string;
  pageId?: string;
  personaId?: string;
  source?: string;
  startDate?: string;
  endDate?: string;
  email?: string;
  page?: number;
  pageSize?: number;
  orderBy?: 'created_at' | 'email' | 'name';
  orderDirection?: 'asc' | 'desc';
}

/**
 * Lead Capture Service
 */
export class LeadCaptureService {
  /**
   * Capture a new lead
   */
  async captureLead(input: LeadCaptureInput): Promise<LeadCaptureResponse> {
    try {
      const supabase = await createClient();

      // Get workspace ID from website if not provided
      let workspaceId = input.formData?.workspaceId as string | undefined;
      if (!workspaceId) {
        const { data: website } = await supabase
          .from('websites')
          .select('workspace_id')
          .eq('id', input.websiteId)
          .single();
        workspaceId = website?.workspace_id;
      }

      // Use untyped helper for extended columns
      const table = await untypedFrom('lead_captures');

      // Insert the lead
      const { data, error } = await table
        .insert({
          website_id: input.websiteId,
          workspace_id: workspaceId,
          page_id: input.pageId || null,
          email: input.email,
          name: input.name || null,
          phone: input.phone || null,
          company: input.company || null,
          data: input.data || {},
          form_data: input.formData || {},
          persona_id: input.personaId || null,
          source: input.source || 'website',
          source_component: input.sourceComponent || null,
          utm_source: input.utmSource || null,
          utm_medium: input.utmMedium || null,
          utm_campaign: input.utmCampaign || null,
        })
        .select('id')
        .single();

      if (error) {
        console.error('Error capturing lead:', error);
        return {
          success: false,
          error: error.message,
        };
      }

      return {
        success: true,
        leadId: data.id,
        message: 'Lead captured successfully',
      };
    } catch (error) {
      console.error('Lead capture error:', error);
      return {
        success: false,
        error: 'Failed to capture lead',
      };
    }
  }

  /**
   * Get leads with filters
   */
  async getLeads(filters: LeadQueryFilters): Promise<LeadListResponse> {
    try {
      const page = filters.page || 1;
      const pageSize = filters.pageSize || 50;
      const offset = (page - 1) * pageSize;

      // Use untyped helper for extended columns
      const table = await untypedFrom('lead_captures');

      // Build query
      let query = table.select('*', { count: 'exact' });

      // Apply filters
      if (filters.websiteId) {
        query = query.eq('website_id', filters.websiteId);
      }
      if (filters.workspaceId) {
        query = query.eq('workspace_id', filters.workspaceId);
      }
      if (filters.pageId) {
        query = query.eq('page_id', filters.pageId);
      }
      if (filters.personaId) {
        query = query.eq('persona_id', filters.personaId);
      }
      if (filters.source) {
        query = query.eq('source', filters.source);
      }
      if (filters.email) {
        query = query.ilike('email', `%${filters.email}%`);
      }
      if (filters.startDate) {
        query = query.gte('created_at', filters.startDate);
      }
      if (filters.endDate) {
        query = query.lte('created_at', filters.endDate);
      }

      // Apply ordering
      const orderBy = filters.orderBy || 'created_at';
      const orderDirection = filters.orderDirection || 'desc';
      query = query.order(orderBy, { ascending: orderDirection === 'asc' });

      // Apply pagination
      query = query.range(offset, offset + pageSize - 1);

      const { data, error, count } = await query;

      if (error) {
        return {
          success: false,
          error: error.message,
        };
      }

      // Transform to camelCase
      const leads: LeadCapture[] = (data || []).map(this.transformLead);

      return {
        success: true,
        leads,
        total: count || 0,
        page,
        pageSize,
      };
    } catch (error) {
      console.error('Error fetching leads:', error);
      return {
        success: false,
        error: 'Failed to fetch leads',
      };
    }
  }

  /**
   * Get a single lead by ID
   */
  async getLead(leadId: string): Promise<LeadCapture | null> {
    try {
      // Use untyped helper for extended columns
      const table = await untypedFrom('lead_captures');

      const { data, error } = await table
        .select('*')
        .eq('id', leadId)
        .single();

      if (error || !data) {
        return null;
      }

      return this.transformLead(data as Record<string, unknown>);
    } catch (error) {
      console.error('Error fetching lead:', error);
      return null;
    }
  }

  /**
   * Delete a lead
   */
  async deleteLead(leadId: string): Promise<boolean> {
    try {
      // Use untyped helper for extended columns
      const table = await untypedFrom('lead_captures');

      const { error } = await table
        .delete()
        .eq('id', leadId);

      return !error;
    } catch (error) {
      console.error('Error deleting lead:', error);
      return false;
    }
  }

  /**
   * Export leads to CSV format
   */
  async exportLeads(filters: LeadQueryFilters): Promise<string> {
    const response = await this.getLeads({ ...filters, pageSize: 10000 });

    if (!response.success || !response.leads) {
      throw new Error('Failed to fetch leads for export');
    }

    const headers = [
      'Email',
      'Name',
      'Phone',
      'Company',
      'Source',
      'Persona',
      'UTM Source',
      'UTM Medium',
      'UTM Campaign',
      'Created At',
    ];

    const rows = response.leads.map((lead) => [
      lead.email,
      lead.name || '',
      lead.phone || '',
      lead.company || '',
      lead.source || '',
      lead.personaId || '',
      lead.utmSource || '',
      lead.utmMedium || '',
      lead.utmCampaign || '',
      lead.createdAt,
    ]);

    // Build CSV
    const csvContent = [
      headers.join(','),
      ...rows.map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')
      ),
    ].join('\n');

    return csvContent;
  }

  /**
   * Get lead statistics
   */
  async getLeadStats(
    websiteId: string,
    startDate?: string,
    endDate?: string
  ): Promise<LeadStats> {
    try {
      // Use untyped helper for extended columns
      const table = await untypedFrom('lead_captures');

      let query = table
        .select('id, persona_id, source, created_at')
        .eq('website_id', websiteId);

      if (startDate) {
        query = query.gte('created_at', startDate);
      }
      if (endDate) {
        query = query.lte('created_at', endDate);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      const leads = data || [];

      // Calculate statistics
      const stats: LeadStats = {
        total: leads.length,
        bySource: {},
        byPersona: {},
        byDay: {},
      };

      for (const lead of leads) {
        // By source
        const source = lead.source || 'unknown';
        stats.bySource[source] = (stats.bySource[source] || 0) + 1;

        // By persona
        const persona = lead.persona_id || 'unknown';
        stats.byPersona[persona] = (stats.byPersona[persona] || 0) + 1;

        // By day
        const day = new Date(lead.created_at).toISOString().split('T')[0];
        stats.byDay[day] = (stats.byDay[day] || 0) + 1;
      }

      return stats;
    } catch (error) {
      console.error('Error fetching lead stats:', error);
      return {
        total: 0,
        bySource: {},
        byPersona: {},
        byDay: {},
      };
    }
  }

  /**
   * Transform database record to LeadCapture type
   */
  private transformLead(record: Record<string, unknown>): LeadCapture {
    return {
      id: record.id as string,
      websiteId: record.website_id as string,
      workspaceId: record.workspace_id as string | undefined,
      pageId: record.page_id as string | undefined,
      email: record.email as string,
      name: record.name as string | undefined,
      phone: record.phone as string | undefined,
      company: record.company as string | undefined,
      data: (record.data as Record<string, unknown>) || {},
      formData: (record.form_data as Record<string, unknown>) || {},
      personaId: record.persona_id as string | undefined,
      source: record.source as string | undefined,
      sourceComponent: record.source_component as string | undefined,
      utmSource: record.utm_source as string | undefined,
      utmMedium: record.utm_medium as string | undefined,
      utmCampaign: record.utm_campaign as string | undefined,
      createdAt: record.created_at as string,
    };
  }
}

/**
 * Lead statistics
 */
export interface LeadStats {
  total: number;
  bySource: Record<string, number>;
  byPersona: Record<string, number>;
  byDay: Record<string, number>;
}

/**
 * Create lead capture service instance
 */
export function createLeadCaptureService(): LeadCaptureService {
  return new LeadCaptureService();
}
