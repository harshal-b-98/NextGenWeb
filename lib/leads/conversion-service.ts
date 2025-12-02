/**
 * Conversion Tracking Service
 * Phase 4.4: Conversion & Lead Tools
 *
 * Service for tracking and analyzing conversion goals.
 */

import { untypedFrom } from '@/lib/supabase/untyped';
import type {
  ConversionGoal,
  ConversionGoalConfig,
  ConversionGoalType,
  ConversionEvent,
} from './types';

/**
 * Conversion goal input
 */
export interface ConversionGoalInput {
  name: string;
  type: ConversionGoalType;
  websiteId: string;
  pageId?: string;
  config: ConversionGoalConfig;
  value?: number;
  isActive?: boolean;
}

/**
 * Conversion event input
 */
export interface ConversionEventInput {
  goalId: string;
  websiteId: string;
  sessionId: string;
  visitorId?: string;
  pageId?: string;
  personaId?: string;
  value?: number;
  metadata?: Record<string, unknown>;
}

/**
 * Conversion statistics
 */
export interface ConversionStats {
  goalId: string;
  goalName: string;
  totalConversions: number;
  totalValue: number;
  conversionsByDay: Record<string, number>;
  conversionsByPersona: Record<string, number>;
  averageValue: number;
}

/**
 * Conversion Service
 *
 * Tracks conversion goals and analyzes conversion data.
 */
export class ConversionService {
  /**
   * Create a conversion goal
   */
  async createGoal(input: ConversionGoalInput): Promise<ConversionGoal | null> {
    try {
      const table = await untypedFrom('conversion_goals');

      const { data, error } = await table
        .insert({
          name: input.name,
          type: input.type,
          website_id: input.websiteId,
          page_id: input.pageId || null,
          config: input.config,
          value: input.value || null,
          is_active: input.isActive ?? true,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating conversion goal:', error);
        return null;
      }

      return this.transformGoal(data as Record<string, unknown>);
    } catch (error) {
      console.error('Error creating goal:', error);
      return null;
    }
  }

  /**
   * Get conversion goal by ID
   */
  async getGoal(goalId: string): Promise<ConversionGoal | null> {
    try {
      const table = await untypedFrom('conversion_goals');

      const { data, error } = await table
        .select()
        .eq('id', goalId)
        .single();

      if (error || !data) {
        return null;
      }

      return this.transformGoal(data as Record<string, unknown>);
    } catch (error) {
      console.error('Error fetching goal:', error);
      return null;
    }
  }

  /**
   * Get all goals for a website
   */
  async getGoals(websiteId: string, activeOnly = false): Promise<ConversionGoal[]> {
    try {
      const table = await untypedFrom('conversion_goals');

      let query = table
        .select()
        .eq('website_id', websiteId)
        .order('created_at', { ascending: false });

      if (activeOnly) {
        query = query.eq('is_active', true);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching goals:', error);
        return [];
      }

      return ((data as Record<string, unknown>[]) || []).map(this.transformGoal);
    } catch (error) {
      console.error('Error fetching goals:', error);
      return [];
    }
  }

  /**
   * Update a conversion goal
   */
  async updateGoal(
    goalId: string,
    updates: Partial<ConversionGoalInput>
  ): Promise<ConversionGoal | null> {
    try {
      const table = await untypedFrom('conversion_goals');

      const updateData: Record<string, unknown> = {};
      if (updates.name) updateData.name = updates.name;
      if (updates.type) updateData.type = updates.type;
      if (updates.config) updateData.config = updates.config;
      if (updates.value !== undefined) updateData.value = updates.value;
      if (updates.isActive !== undefined) updateData.is_active = updates.isActive;
      if (updates.pageId !== undefined) updateData.page_id = updates.pageId;

      const { data, error } = await table
        .update(updateData)
        .eq('id', goalId)
        .select()
        .single();

      if (error) {
        console.error('Error updating goal:', error);
        return null;
      }

      return this.transformGoal(data as Record<string, unknown>);
    } catch (error) {
      console.error('Error updating goal:', error);
      return null;
    }
  }

  /**
   * Delete a conversion goal
   */
  async deleteGoal(goalId: string): Promise<boolean> {
    try {
      const table = await untypedFrom('conversion_goals');

      const { error } = await table
        .delete()
        .eq('id', goalId);

      return !error;
    } catch (error) {
      console.error('Error deleting goal:', error);
      return false;
    }
  }

  /**
   * Track a conversion event
   */
  async trackConversion(input: ConversionEventInput): Promise<ConversionEvent | null> {
    try {
      // Get goal to check if it's active
      const goal = await this.getGoal(input.goalId);
      if (!goal || !goal.isActive) {
        return null;
      }

      // Use goal's default value if not provided
      const value = input.value ?? goal.value;

      const table = await untypedFrom('conversion_events');

      const { data, error } = await table
        .insert({
          goal_id: input.goalId,
          website_id: input.websiteId,
          session_id: input.sessionId,
          visitor_id: input.visitorId || null,
          page_id: input.pageId || null,
          persona_id: input.personaId || null,
          value: value || null,
          metadata: input.metadata || {},
        })
        .select()
        .single();

      if (error) {
        console.error('Error tracking conversion:', error);
        return null;
      }

      return this.transformEvent(data as Record<string, unknown>);
    } catch (error) {
      console.error('Error tracking conversion:', error);
      return null;
    }
  }

  /**
   * Get conversion events for a goal
   */
  async getEvents(
    goalId: string,
    options?: {
      startDate?: string;
      endDate?: string;
      limit?: number;
    }
  ): Promise<ConversionEvent[]> {
    try {
      const table = await untypedFrom('conversion_events');

      let query = table
        .select()
        .eq('goal_id', goalId)
        .order('timestamp', { ascending: false });

      if (options?.startDate) {
        query = query.gte('timestamp', options.startDate);
      }
      if (options?.endDate) {
        query = query.lte('timestamp', options.endDate);
      }
      if (options?.limit) {
        query = query.limit(options.limit);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching events:', error);
        return [];
      }

      return ((data as Record<string, unknown>[]) || []).map(this.transformEvent);
    } catch (error) {
      console.error('Error fetching events:', error);
      return [];
    }
  }

  /**
   * Get conversion statistics for a goal
   */
  async getGoalStats(
    goalId: string,
    startDate?: string,
    endDate?: string
  ): Promise<ConversionStats | null> {
    try {
      // Get goal info
      const goal = await this.getGoal(goalId);
      if (!goal) {
        return null;
      }

      const table = await untypedFrom('conversion_events');

      // Get events
      let query = table
        .select('id, value, persona_id, timestamp')
        .eq('goal_id', goalId);

      if (startDate) {
        query = query.gte('timestamp', startDate);
      }
      if (endDate) {
        query = query.lte('timestamp', endDate);
      }

      const { data: events, error } = await query;

      if (error) {
        console.error('Error fetching conversion stats:', error);
        return null;
      }

      const eventList = (events as Array<{
        id: string;
        value: number | null;
        persona_id: string | null;
        timestamp: string;
      }>) || [];

      // Calculate stats
      const stats: ConversionStats = {
        goalId,
        goalName: goal.name,
        totalConversions: eventList.length,
        totalValue: 0,
        conversionsByDay: {},
        conversionsByPersona: {},
        averageValue: 0,
      };

      for (const event of eventList) {
        // Total value
        if (event.value) {
          stats.totalValue += event.value;
        }

        // By day
        const day = new Date(event.timestamp).toISOString().split('T')[0];
        stats.conversionsByDay[day] = (stats.conversionsByDay[day] || 0) + 1;

        // By persona
        const persona = event.persona_id || 'unknown';
        stats.conversionsByPersona[persona] =
          (stats.conversionsByPersona[persona] || 0) + 1;
      }

      // Average value
      stats.averageValue =
        eventList.length > 0 ? stats.totalValue / eventList.length : 0;

      return stats;
    } catch (error) {
      console.error('Error calculating stats:', error);
      return null;
    }
  }

  /**
   * Get aggregated stats for all goals of a website
   */
  async getWebsiteStats(
    websiteId: string,
    startDate?: string,
    endDate?: string
  ): Promise<{
    totalConversions: number;
    totalValue: number;
    goalStats: ConversionStats[];
  }> {
    try {
      const goals = await this.getGoals(websiteId);

      const goalStats = await Promise.all(
        goals.map((goal) => this.getGoalStats(goal.id, startDate, endDate))
      );

      const validStats = goalStats.filter(Boolean) as ConversionStats[];

      return {
        totalConversions: validStats.reduce((sum, s) => sum + s.totalConversions, 0),
        totalValue: validStats.reduce((sum, s) => sum + s.totalValue, 0),
        goalStats: validStats,
      };
    } catch (error) {
      console.error('Error calculating website stats:', error);
      return {
        totalConversions: 0,
        totalValue: 0,
        goalStats: [],
      };
    }
  }

  /**
   * Check if a goal should trigger for given event data
   */
  checkGoalTrigger(
    goal: ConversionGoal,
    eventData: {
      url?: string;
      elementSelector?: string;
      elementText?: string;
      scrollPercentage?: number;
      timeOnPage?: number;
      eventName?: string;
      eventProperties?: Record<string, unknown>;
    }
  ): boolean {
    const config = goal.config;

    switch (goal.type) {
      case 'page_view':
        if (!eventData.url || !config.targetUrl) return false;
        switch (config.urlMatchType) {
          case 'exact':
            return eventData.url === config.targetUrl;
          case 'contains':
            return eventData.url.includes(config.targetUrl);
          case 'regex':
            return new RegExp(config.targetUrl).test(eventData.url);
          default:
            return false;
        }

      case 'click':
        if (config.selector && eventData.elementSelector) {
          return eventData.elementSelector === config.selector;
        }
        if (config.elementText && eventData.elementText) {
          return eventData.elementText.includes(config.elementText);
        }
        return false;

      case 'scroll_depth':
        if (!config.scrollPercentage || eventData.scrollPercentage === undefined) {
          return false;
        }
        return eventData.scrollPercentage >= config.scrollPercentage;

      case 'time_on_page':
        if (!config.timeSeconds || eventData.timeOnPage === undefined) {
          return false;
        }
        return eventData.timeOnPage >= config.timeSeconds;

      case 'custom_event':
        if (!config.eventName || eventData.eventName !== config.eventName) {
          return false;
        }
        // Check event properties if configured
        if (config.eventProperties && eventData.eventProperties) {
          for (const [key, value] of Object.entries(config.eventProperties)) {
            if (eventData.eventProperties[key] !== value) {
              return false;
            }
          }
        }
        return true;

      case 'form_submission':
        // Form submissions are tracked directly via lead capture
        return false;

      default:
        return false;
    }
  }

  /**
   * Transform database record to ConversionGoal
   */
  private transformGoal(record: Record<string, unknown>): ConversionGoal {
    return {
      id: record.id as string,
      name: record.name as string,
      type: record.type as ConversionGoalType,
      websiteId: record.website_id as string,
      pageId: record.page_id as string | undefined,
      config: record.config as ConversionGoalConfig,
      value: record.value as number | undefined,
      isActive: record.is_active as boolean,
      createdAt: record.created_at as string,
    };
  }

  /**
   * Transform database record to ConversionEvent
   */
  private transformEvent(record: Record<string, unknown>): ConversionEvent {
    return {
      id: record.id as string,
      goalId: record.goal_id as string,
      websiteId: record.website_id as string,
      sessionId: record.session_id as string,
      visitorId: record.visitor_id as string | undefined,
      pageId: record.page_id as string | undefined,
      personaId: record.persona_id as string | undefined,
      value: record.value as number | undefined,
      metadata: record.metadata as Record<string, unknown> | undefined,
      timestamp: record.timestamp as string,
    };
  }
}

/**
 * Create conversion service instance
 */
export function createConversionService(): ConversionService {
  return new ConversionService();
}
