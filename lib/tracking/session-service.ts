/**
 * Visitor Session Service
 * Phase 4.2: Runtime Persona Detection
 *
 * Manages visitor sessions in Supabase including creation,
 * updates, and behavior tracking.
 */

import { createClient } from '@/lib/supabase/server';
import { v4 as uuidv4 } from 'uuid';
import {
  VisitorSession,
  ClickEvent,
  ScrollRecord,
  DetectionSignal,
  SessionInitRequest,
  SessionInitResponse,
  TrackingServiceResult,
  DeviceType,
  UserBehavior,
  FormInteraction,
} from './types';
import { Json } from '@/types/database';

// ============================================================================
// DATABASE ROW TYPE
// ============================================================================

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DbRow = any;

// ============================================================================
// SESSION SERVICE
// ============================================================================

export class VisitorSessionService {
  private websiteId: string;

  constructor(websiteId: string) {
    this.websiteId = websiteId;
  }

  // ============================================================================
  // SESSION INITIALIZATION
  // ============================================================================

  /**
   * Initialize a new session or retrieve existing one
   */
  async initializeSession(
    request: SessionInitRequest
  ): Promise<TrackingServiceResult<SessionInitResponse>> {
    try {
      const supabase = await createClient();

      // Generate or use provided visitor ID
      const visitorId = request.visitorId || uuidv4();
      const sessionId = uuidv4();
      const now = new Date().toISOString();

      // Check for existing recent session for this visitor
      const { data: existingSession } = await supabase
        .from('visitor_sessions')
        .select('*')
        .eq('website_id', this.websiteId)
        .eq('visitor_id', visitorId)
        .gte('last_activity_at', new Date(Date.now() - 30 * 60 * 1000).toISOString()) // Within 30 mins
        .order('last_activity_at', { ascending: false })
        .limit(1)
        .single();

      // If recent session exists, return it
      if (existingSession) {
        // Update last activity
        await supabase
          .from('visitor_sessions')
          .update({ last_activity_at: now })
          .eq('id', existingSession.id);

        return {
          success: true,
          data: {
            success: true,
            sessionId: existingSession.session_id,
            visitorId: existingSession.visitor_id,
            existingPersonaId: existingSession.detected_persona_id || undefined,
            existingConfidence: existingSession.persona_confidence || undefined,
            isNewVisitor: false,
          },
        };
      }

      // Create new session
      const insertData = {
        id: uuidv4(),
        website_id: this.websiteId,
        visitor_id: visitorId,
        session_id: sessionId,
        click_history: [] as unknown as Json,
        scroll_behavior: [] as unknown as Json,
        time_on_sections: {} as unknown as Json,
        navigation_path: [request.pageUrl],
        referrer_url: request.referrerUrl || null,
        utm_source: request.utmSource || null,
        utm_medium: request.utmMedium || null,
        utm_campaign: request.utmCampaign || null,
        device_type: request.deviceType || null,
        browser: request.browser || null,
        os: request.os || null,
        detected_persona_id: null,
        persona_confidence: null,
        detection_signals: [] as unknown as Json,
        started_at: now,
        last_activity_at: now,
        created_at: now,
      };

      const { error } = await supabase.from('visitor_sessions').insert(insertData);

      if (error) {
        console.error('Error creating session:', error);
        return {
          success: false,
          error: `Failed to create session: ${error.message}`,
        };
      }

      // Check if this visitor has had previous sessions with a detected persona
      const { data: previousSession } = await supabase
        .from('visitor_sessions')
        .select('detected_persona_id, persona_confidence')
        .eq('website_id', this.websiteId)
        .eq('visitor_id', visitorId)
        .not('detected_persona_id', 'is', null)
        .order('last_activity_at', { ascending: false })
        .limit(1)
        .single();

      return {
        success: true,
        data: {
          success: true,
          sessionId,
          visitorId,
          existingPersonaId: previousSession?.detected_persona_id || undefined,
          existingConfidence: previousSession?.persona_confidence || undefined,
          isNewVisitor: !previousSession,
        },
      };
    } catch (error) {
      console.error('Session initialization error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // ============================================================================
  // SESSION RETRIEVAL
  // ============================================================================

  /**
   * Get session by session ID
   */
  async getSession(sessionId: string): Promise<TrackingServiceResult<VisitorSession>> {
    try {
      const supabase = await createClient();

      const { data, error } = await supabase
        .from('visitor_sessions')
        .select('*')
        .eq('website_id', this.websiteId)
        .eq('session_id', sessionId)
        .single();

      if (error || !data) {
        return {
          success: false,
          error: 'Session not found',
        };
      }

      return {
        success: true,
        data: this.mapRowToSession(data),
      };
    } catch (error) {
      console.error('Session fetch error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get sessions for a visitor
   */
  async getVisitorSessions(
    visitorId: string,
    limit = 10
  ): Promise<TrackingServiceResult<VisitorSession[]>> {
    try {
      const supabase = await createClient();

      const { data, error } = await supabase
        .from('visitor_sessions')
        .select('*')
        .eq('website_id', this.websiteId)
        .eq('visitor_id', visitorId)
        .order('started_at', { ascending: false })
        .limit(limit);

      if (error) {
        return {
          success: false,
          error: `Failed to fetch sessions: ${error.message}`,
        };
      }

      return {
        success: true,
        data: data.map((row: DbRow) => this.mapRowToSession(row)),
      };
    } catch (error) {
      console.error('Visitor sessions fetch error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // ============================================================================
  // BEHAVIOR TRACKING UPDATES
  // ============================================================================

  /**
   * Add click events to session
   */
  async addClickEvents(
    sessionId: string,
    clicks: ClickEvent[]
  ): Promise<TrackingServiceResult<void>> {
    try {
      const supabase = await createClient();
      const now = new Date().toISOString();

      // Get current click history
      const { data: session, error: fetchError } = await supabase
        .from('visitor_sessions')
        .select('click_history')
        .eq('website_id', this.websiteId)
        .eq('session_id', sessionId)
        .single();

      if (fetchError || !session) {
        return { success: false, error: 'Session not found' };
      }

      const currentHistory = (session.click_history as unknown as ClickEvent[]) || [];
      const updatedHistory = [...currentHistory, ...clicks];

      const { error } = await supabase
        .from('visitor_sessions')
        .update({
          click_history: updatedHistory as unknown as Json,
          last_activity_at: now,
        })
        .eq('website_id', this.websiteId)
        .eq('session_id', sessionId);

      if (error) {
        return { success: false, error: `Failed to update clicks: ${error.message}` };
      }

      return { success: true };
    } catch (error) {
      console.error('Add click events error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Update scroll behavior
   */
  async updateScrollBehavior(
    sessionId: string,
    scrollRecords: ScrollRecord[]
  ): Promise<TrackingServiceResult<void>> {
    try {
      const supabase = await createClient();
      const now = new Date().toISOString();

      // Get current scroll behavior
      const { data: session, error: fetchError } = await supabase
        .from('visitor_sessions')
        .select('scroll_behavior')
        .eq('website_id', this.websiteId)
        .eq('session_id', sessionId)
        .single();

      if (fetchError || !session) {
        return { success: false, error: 'Session not found' };
      }

      const currentBehavior = (session.scroll_behavior as unknown as ScrollRecord[]) || [];

      // Merge scroll records - update existing page entries or add new
      const behaviorMap = new Map<string, ScrollRecord>();
      for (const record of currentBehavior) {
        behaviorMap.set(record.pageId, record);
      }
      for (const record of scrollRecords) {
        const existing = behaviorMap.get(record.pageId);
        if (existing) {
          // Update with max depth and accumulated duration
          behaviorMap.set(record.pageId, {
            ...record,
            maxDepth: Math.max(existing.maxDepth, record.maxDepth),
            duration: existing.duration + record.duration,
          });
        } else {
          behaviorMap.set(record.pageId, record);
        }
      }

      const updatedBehavior = Array.from(behaviorMap.values());

      const { error } = await supabase
        .from('visitor_sessions')
        .update({
          scroll_behavior: updatedBehavior as unknown as Json,
          last_activity_at: now,
        })
        .eq('website_id', this.websiteId)
        .eq('session_id', sessionId);

      if (error) {
        return { success: false, error: `Failed to update scroll: ${error.message}` };
      }

      return { success: true };
    } catch (error) {
      console.error('Update scroll behavior error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Update time on sections
   */
  async updateTimeOnSections(
    sessionId: string,
    sectionTimes: Record<string, number>
  ): Promise<TrackingServiceResult<void>> {
    try {
      const supabase = await createClient();
      const now = new Date().toISOString();

      // Get current section times
      const { data: session, error: fetchError } = await supabase
        .from('visitor_sessions')
        .select('time_on_sections')
        .eq('website_id', this.websiteId)
        .eq('session_id', sessionId)
        .single();

      if (fetchError || !session) {
        return { success: false, error: 'Session not found' };
      }

      const currentTimes = (session.time_on_sections as unknown as Record<string, number>) || {};

      // Merge times - accumulate
      const updatedTimes = { ...currentTimes };
      for (const [sectionId, time] of Object.entries(sectionTimes)) {
        updatedTimes[sectionId] = (updatedTimes[sectionId] || 0) + time;
      }

      const { error } = await supabase
        .from('visitor_sessions')
        .update({
          time_on_sections: updatedTimes as unknown as Json,
          last_activity_at: now,
        })
        .eq('website_id', this.websiteId)
        .eq('session_id', sessionId);

      if (error) {
        return { success: false, error: `Failed to update times: ${error.message}` };
      }

      return { success: true };
    } catch (error) {
      console.error('Update time on sections error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Add page to navigation path
   */
  async addNavigationPage(
    sessionId: string,
    pageUrl: string
  ): Promise<TrackingServiceResult<void>> {
    try {
      const supabase = await createClient();
      const now = new Date().toISOString();

      // Get current navigation path
      const { data: session, error: fetchError } = await supabase
        .from('visitor_sessions')
        .select('navigation_path')
        .eq('website_id', this.websiteId)
        .eq('session_id', sessionId)
        .single();

      if (fetchError || !session) {
        return { success: false, error: 'Session not found' };
      }

      const currentPath = (session.navigation_path as unknown as string[]) || [];

      // Only add if different from last page
      if (currentPath[currentPath.length - 1] !== pageUrl) {
        const updatedPath = [...currentPath, pageUrl];

        const { error } = await supabase
          .from('visitor_sessions')
          .update({
            navigation_path: updatedPath,
            last_activity_at: now,
          })
          .eq('website_id', this.websiteId)
          .eq('session_id', sessionId);

        if (error) {
          return { success: false, error: `Failed to update navigation: ${error.message}` };
        }
      }

      return { success: true };
    } catch (error) {
      console.error('Add navigation page error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // ============================================================================
  // PERSONA DETECTION UPDATES
  // ============================================================================

  /**
   * Update detected persona for session
   */
  async updateDetectedPersona(
    sessionId: string,
    personaId: string,
    confidence: number,
    signals: DetectionSignal[]
  ): Promise<TrackingServiceResult<void>> {
    try {
      const supabase = await createClient();
      const now = new Date().toISOString();

      const { error } = await supabase
        .from('visitor_sessions')
        .update({
          detected_persona_id: personaId,
          persona_confidence: confidence,
          detection_signals: signals as unknown as Json,
          last_activity_at: now,
        })
        .eq('website_id', this.websiteId)
        .eq('session_id', sessionId);

      if (error) {
        return { success: false, error: `Failed to update persona: ${error.message}` };
      }

      return { success: true };
    } catch (error) {
      console.error('Update detected persona error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // ============================================================================
  // BEHAVIOR AGGREGATION
  // ============================================================================

  /**
   * Get aggregated user behavior for detection
   */
  async getUserBehavior(sessionId: string): Promise<TrackingServiceResult<UserBehavior>> {
    try {
      const sessionResult = await this.getSession(sessionId);
      if (!sessionResult.success || !sessionResult.data) {
        return { success: false, error: sessionResult.error || 'Session not found' };
      }

      const session = sessionResult.data;

      const behavior: UserBehavior = {
        sessionId: session.sessionId,
        visitorId: session.visitorId,
        clickHistory: session.clickHistory,
        scrollBehavior: session.scrollBehavior,
        timeOnSections: session.timeOnSections,
        navigationPath: session.navigationPath,
        referrerData: {
          url: session.referrerUrl || undefined,
          source: session.utmSource || undefined,
          medium: session.utmMedium || undefined,
          campaign: session.utmCampaign || undefined,
        },
        searchQueries: [], // Would need to be tracked separately
        formInteractions: [], // Would need to be tracked separately
        deviceType: session.deviceType || 'desktop',
      };

      return { success: true, data: behavior };
    } catch (error) {
      console.error('Get user behavior error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // ============================================================================
  // BATCH UPDATE
  // ============================================================================

  /**
   * Batch update session with multiple behavior types
   */
  async batchUpdateSession(
    sessionId: string,
    updates: {
      clicks?: ClickEvent[];
      scrollRecords?: ScrollRecord[];
      sectionTimes?: Record<string, number>;
      pageUrl?: string;
    }
  ): Promise<TrackingServiceResult<void>> {
    try {
      const supabase = await createClient();
      const now = new Date().toISOString();

      // Fetch current session data
      const { data: session, error: fetchError } = await supabase
        .from('visitor_sessions')
        .select('click_history, scroll_behavior, time_on_sections, navigation_path')
        .eq('website_id', this.websiteId)
        .eq('session_id', sessionId)
        .single();

      if (fetchError || !session) {
        return { success: false, error: 'Session not found' };
      }

      // Build update object
      const updateData: Record<string, unknown> = {
        last_activity_at: now,
      };

      // Merge clicks
      if (updates.clicks && updates.clicks.length > 0) {
        const currentClicks = (session.click_history as unknown as ClickEvent[]) || [];
        updateData.click_history = [...currentClicks, ...updates.clicks] as unknown as Json;
      }

      // Merge scroll behavior
      if (updates.scrollRecords && updates.scrollRecords.length > 0) {
        const currentScroll = (session.scroll_behavior as unknown as ScrollRecord[]) || [];
        const scrollMap = new Map<string, ScrollRecord>();
        for (const record of currentScroll) {
          scrollMap.set(record.pageId, record);
        }
        for (const record of updates.scrollRecords) {
          const existing = scrollMap.get(record.pageId);
          if (existing) {
            scrollMap.set(record.pageId, {
              ...record,
              maxDepth: Math.max(existing.maxDepth, record.maxDepth),
              duration: existing.duration + record.duration,
            });
          } else {
            scrollMap.set(record.pageId, record);
          }
        }
        updateData.scroll_behavior = Array.from(scrollMap.values()) as unknown as Json;
      }

      // Merge section times
      if (updates.sectionTimes && Object.keys(updates.sectionTimes).length > 0) {
        const currentTimes = (session.time_on_sections as unknown as Record<string, number>) || {};
        const updatedTimes = { ...currentTimes };
        for (const [sectionId, time] of Object.entries(updates.sectionTimes)) {
          updatedTimes[sectionId] = (updatedTimes[sectionId] || 0) + time;
        }
        updateData.time_on_sections = updatedTimes as unknown as Json;
      }

      // Add navigation page
      if (updates.pageUrl) {
        const currentPath = (session.navigation_path as unknown as string[]) || [];
        if (currentPath[currentPath.length - 1] !== updates.pageUrl) {
          updateData.navigation_path = [...currentPath, updates.pageUrl];
        }
      }

      // Perform update
      const { error } = await supabase
        .from('visitor_sessions')
        .update(updateData)
        .eq('website_id', this.websiteId)
        .eq('session_id', sessionId);

      if (error) {
        return { success: false, error: `Failed to batch update: ${error.message}` };
      }

      return { success: true };
    } catch (error) {
      console.error('Batch update session error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // ============================================================================
  // HELPERS
  // ============================================================================

  private mapRowToSession(row: DbRow): VisitorSession {
    return {
      id: row.id,
      websiteId: row.website_id,
      visitorId: row.visitor_id,
      sessionId: row.session_id,
      clickHistory: (row.click_history as ClickEvent[]) || [],
      scrollBehavior: (row.scroll_behavior as ScrollRecord[]) || [],
      timeOnSections: (row.time_on_sections as Record<string, number>) || {},
      navigationPath: (row.navigation_path as string[]) || [],
      referrerUrl: row.referrer_url,
      utmSource: row.utm_source,
      utmMedium: row.utm_medium,
      utmCampaign: row.utm_campaign,
      deviceType: row.device_type as DeviceType | null,
      browser: row.browser,
      os: row.os,
      detectedPersonaId: row.detected_persona_id,
      personaConfidence: row.persona_confidence,
      detectionSignals: (row.detection_signals as DetectionSignal[]) || [],
      startedAt: row.started_at,
      lastActivityAt: row.last_activity_at,
      createdAt: row.created_at,
    };
  }
}

// ============================================================================
// FACTORY FUNCTION
// ============================================================================

/**
 * Create a VisitorSessionService instance
 */
export function createSessionService(websiteId: string): VisitorSessionService {
  return new VisitorSessionService(websiteId);
}
