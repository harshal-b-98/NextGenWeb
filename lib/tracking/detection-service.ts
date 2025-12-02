/**
 * Real-time Detection Service
 * Phase 4.2: Runtime Persona Detection
 *
 * Service that integrates visitor tracking with persona detection,
 * providing real-time persona identification based on behavior.
 */

import { createClient } from '@/lib/supabase/server';
import { PersonaDetectionEngine } from '@/lib/personas/detection';
import type { Persona, PersonaMatch, DetectionOptions } from '@/lib/personas/types';
import type {
  UserBehavior,
  DetectionSignal,
  TrackingServiceResult,
  DetectionRequest,
  DetectionResponse,
} from './types';
import { createSessionService } from './session-service';

// Type alias for database rows
type DbRow = any;

/**
 * Real-time persona detection service
 */
export class RealtimeDetectionService {
  private websiteId: string;
  private personas: Persona[] = [];
  private engine: PersonaDetectionEngine | null = null;
  private lastPersonaLoad: number = 0;
  private readonly PERSONA_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  constructor(websiteId: string) {
    this.websiteId = websiteId;
  }

  /**
   * Initialize or refresh the detection engine with personas
   */
  async initializeEngine(forceRefresh: boolean = false): Promise<TrackingServiceResult<void>> {
    try {
      const now = Date.now();

      // Check if we need to refresh personas
      if (!forceRefresh && this.engine && now - this.lastPersonaLoad < this.PERSONA_CACHE_TTL) {
        return { success: true };
      }

      const supabase = await createClient();

      // Get the workspace ID for this website
      const { data: website, error: websiteError } = await supabase
        .from('websites')
        .select('workspace_id')
        .eq('id', this.websiteId)
        .single();

      if (websiteError || !website) {
        return { success: false, error: 'Website not found' };
      }

      // Load active personas for the workspace
      const { data: personasData, error: personasError } = await supabase
        .from('personas')
        .select('*')
        .eq('workspace_id', website.workspace_id)
        .eq('is_active', true);

      if (personasError) {
        return { success: false, error: personasError.message };
      }

      // Map database rows to Persona objects
      this.personas = (personasData || []).map(this.mapDbRowToPersona);

      // Create detection engine
      this.engine = new PersonaDetectionEngine(this.personas);
      this.lastPersonaLoad = now;

      return { success: true };
    } catch (error) {
      console.error('Error initializing detection engine:', error);
      return { success: false, error: 'Failed to initialize detection engine' };
    }
  }

  /**
   * Detect persona from session behavior
   */
  async detectPersona(request: DetectionRequest): Promise<TrackingServiceResult<DetectionResponse>> {
    try {
      // Initialize engine if needed
      const initResult = await this.initializeEngine(request.forceDetection);
      if (!initResult.success) {
        return {
          success: false,
          error: initResult.error,
        };
      }

      if (!this.engine || this.personas.length === 0) {
        return {
          success: true,
          data: {
            success: true,
            personaId: undefined,
            confidence: undefined,
            signals: [],
            error: 'No active personas configured',
          },
        };
      }

      // Get user behavior from session
      const sessionService = createSessionService(this.websiteId);
      const behaviorResult = await sessionService.getUserBehavior(request.sessionId);

      if (!behaviorResult.success || !behaviorResult.data) {
        return {
          success: false,
          error: behaviorResult.error || 'Failed to get session behavior',
        };
      }

      // Convert tracking UserBehavior to personas UserBehavior format
      const personaBehavior = this.convertToPersonaBehavior(behaviorResult.data);

      // Run detection
      const match = this.engine.detectPersona(personaBehavior);

      if (!match) {
        return {
          success: true,
          data: {
            success: true,
            personaId: undefined,
            confidence: undefined,
            signals: [],
          },
        };
      }

      // Convert signals to DetectionSignal format
      const signals: DetectionSignal[] = match.signals.map((s) => ({
        type: s.type,
        value: s.value,
        timestamp: s.timestamp,
        weight: s.weight,
        contributed: s.contributed,
        metadata: s.metadata,
      }));

      // Update session with detected persona
      await sessionService.updateDetectedPersona(
        request.sessionId,
        match.personaId,
        match.confidence,
        signals
      );

      return {
        success: true,
        data: {
          success: true,
          personaId: match.personaId,
          confidence: match.confidence,
          signals,
          alternativeMatches: match.alternativeMatches,
        },
      };
    } catch (error) {
      console.error('Error detecting persona:', error);
      return { success: false, error: 'Failed to detect persona' };
    }
  }

  /**
   * Get current detection status for a session
   */
  async getDetectionStatus(sessionId: string): Promise<
    TrackingServiceResult<{
      hasDetection: boolean;
      personaId?: string;
      personaName?: string;
      confidence?: number;
      lastUpdated?: string;
    }>
  > {
    try {
      const supabase = await createClient();

      const { data, error } = await supabase
        .from('visitor_sessions')
        .select('detected_persona_id, persona_confidence, last_activity_at')
        .eq('session_id', sessionId)
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      const session = data as DbRow;

      if (!session.detected_persona_id) {
        return {
          success: true,
          data: { hasDetection: false },
        };
      }

      // Get persona name
      const { data: persona } = await supabase
        .from('personas')
        .select('name')
        .eq('id', session.detected_persona_id)
        .single();

      return {
        success: true,
        data: {
          hasDetection: true,
          personaId: session.detected_persona_id,
          personaName: (persona as DbRow)?.name,
          confidence: session.persona_confidence,
          lastUpdated: session.last_activity_at,
        },
      };
    } catch (error) {
      console.error('Error getting detection status:', error);
      return { success: false, error: 'Failed to get detection status' };
    }
  }

  /**
   * Trigger detection based on behavior threshold
   * Returns true if detection should be triggered
   */
  shouldTriggerDetection(
    clickCount: number,
    pageViewCount: number,
    timeSpentSeconds: number,
    lastDetectionTime?: string
  ): boolean {
    // Minimum thresholds for meaningful detection
    const MIN_CLICKS = 3;
    const MIN_PAGES = 2;
    const MIN_TIME_SECONDS = 30;
    const REDETECT_INTERVAL_SECONDS = 60;

    // Check if we have enough data
    if (clickCount < MIN_CLICKS && pageViewCount < MIN_PAGES) {
      return false;
    }

    if (timeSpentSeconds < MIN_TIME_SECONDS) {
      return false;
    }

    // Check if enough time has passed since last detection
    if (lastDetectionTime) {
      const lastDetection = new Date(lastDetectionTime).getTime();
      const now = Date.now();
      const secondsSinceLastDetection = (now - lastDetection) / 1000;

      if (secondsSinceLastDetection < REDETECT_INTERVAL_SECONDS) {
        return false;
      }
    }

    return true;
  }

  /**
   * Get all personas available for this website
   */
  async getAvailablePersonas(): Promise<TrackingServiceResult<Persona[]>> {
    try {
      await this.initializeEngine();
      return { success: true, data: this.personas };
    } catch (error) {
      console.error('Error getting available personas:', error);
      return { success: false, error: 'Failed to get available personas' };
    }
  }

  /**
   * Get detection analytics for a website
   */
  async getDetectionAnalytics(
    startDate?: string,
    endDate?: string
  ): Promise<
    TrackingServiceResult<{
      totalSessions: number;
      detectedSessions: number;
      detectionRate: number;
      personaDistribution: Array<{
        personaId: string;
        personaName: string;
        count: number;
        avgConfidence: number;
      }>;
      confidenceDistribution: {
        low: number;
        medium: number;
        high: number;
      };
    }>
  > {
    try {
      const supabase = await createClient();

      // Build date filter
      let query = supabase
        .from('visitor_sessions')
        .select('id, detected_persona_id, persona_confidence')
        .eq('website_id', this.websiteId);

      if (startDate) {
        query = query.gte('started_at', startDate);
      }
      if (endDate) {
        query = query.lte('started_at', endDate);
      }

      const { data: sessions, error } = await query;

      if (error) {
        return { success: false, error: error.message };
      }

      const sessionData = (sessions as DbRow[]) || [];
      const totalSessions = sessionData.length;
      const detectedSessions = sessionData.filter((s) => s.detected_persona_id).length;

      // Calculate persona distribution
      const personaCounts: Record<string, { count: number; totalConfidence: number }> = {};

      for (const session of sessionData) {
        if (session.detected_persona_id) {
          if (!personaCounts[session.detected_persona_id]) {
            personaCounts[session.detected_persona_id] = { count: 0, totalConfidence: 0 };
          }
          personaCounts[session.detected_persona_id].count++;
          personaCounts[session.detected_persona_id].totalConfidence += session.persona_confidence || 0;
        }
      }

      // Get persona names
      const personaIds = Object.keys(personaCounts);
      let personaNames: Record<string, string> = {};

      if (personaIds.length > 0) {
        const { data: personas } = await supabase
          .from('personas')
          .select('id, name')
          .in('id', personaIds);

        personaNames = (personas as DbRow[] || []).reduce((acc, p) => {
          acc[p.id] = p.name;
          return acc;
        }, {} as Record<string, string>);
      }

      const personaDistribution = Object.entries(personaCounts).map(([personaId, data]) => ({
        personaId,
        personaName: personaNames[personaId] || 'Unknown',
        count: data.count,
        avgConfidence: data.count > 0 ? data.totalConfidence / data.count : 0,
      }));

      // Calculate confidence distribution
      const confidenceDistribution = { low: 0, medium: 0, high: 0 };

      for (const session of sessionData) {
        if (session.detected_persona_id && session.persona_confidence) {
          if (session.persona_confidence < 0.5) {
            confidenceDistribution.low++;
          } else if (session.persona_confidence < 0.75) {
            confidenceDistribution.medium++;
          } else {
            confidenceDistribution.high++;
          }
        }
      }

      return {
        success: true,
        data: {
          totalSessions,
          detectedSessions,
          detectionRate: totalSessions > 0 ? detectedSessions / totalSessions : 0,
          personaDistribution,
          confidenceDistribution,
        },
      };
    } catch (error) {
      console.error('Error getting detection analytics:', error);
      return { success: false, error: 'Failed to get detection analytics' };
    }
  }

  /**
   * Convert tracking UserBehavior to personas module UserBehavior
   */
  private convertToPersonaBehavior(
    trackingBehavior: UserBehavior
  ): import('@/lib/personas/types').UserBehavior {
    return {
      sessionId: trackingBehavior.sessionId,
      visitorId: trackingBehavior.visitorId,
      clickHistory: trackingBehavior.clickHistory.map((click) => ({
        elementId: click.elementId,
        elementType: click.elementType,
        sectionId: click.sectionId,
        timestamp: click.timestamp,
      })),
      scrollBehavior: trackingBehavior.scrollBehavior.map((scroll) => ({
        pageId: scroll.pageId,
        maxDepth: scroll.maxDepth,
        duration: scroll.duration,
      })),
      timeOnSections: trackingBehavior.timeOnSections,
      navigationPath: trackingBehavior.navigationPath,
      referrerData: trackingBehavior.referrerData,
      searchQueries: trackingBehavior.searchQueries,
      formInteractions: trackingBehavior.formInteractions.map((form) => ({
        formId: form.formId,
        fieldsInteracted: form.fieldsInteracted,
        completed: form.completed,
      })),
      deviceType: trackingBehavior.deviceType,
    };
  }

  /**
   * Map database row to Persona object
   */
  private mapDbRowToPersona(row: DbRow): Persona {
    return {
      id: row.id,
      workspaceId: row.workspace_id,
      name: row.name,
      title: row.title,
      avatarUrl: row.avatar_url,
      industry: row.industry,
      companySize: row.company_size,
      location: row.location,
      goals: row.goals || [],
      painPoints: row.pain_points || [],
      decisionCriteria: row.decision_criteria || [],
      objections: row.objections || [],
      keyMetrics: row.key_metrics || [],
      communicationStyle: row.communication_style || 'business',
      buyerJourneyStage: row.buyer_journey_stage || 'awareness',
      detectionRules: row.detection_rules || [],
      relevantKnowledgeIds: row.relevant_knowledge_ids || [],
      preferredContentTypes: row.preferred_content_types || [],
      contentPreferences: row.content_preferences || [],
      isActive: row.is_active,
      isPrimary: row.is_primary,
      aiGenerated: row.ai_generated,
      confidenceScore: row.confidence_score || 0.5,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}

/**
 * Factory function to create detection service
 */
export function createDetectionService(websiteId: string): RealtimeDetectionService {
  return new RealtimeDetectionService(websiteId);
}

/**
 * Quick detection helper for single detection calls
 */
export async function detectVisitorPersona(
  websiteId: string,
  sessionId: string,
  visitorId: string,
  options?: DetectionOptions
): Promise<DetectionResponse> {
  const service = createDetectionService(websiteId);
  const result = await service.detectPersona({
    sessionId,
    visitorId,
    websiteId,
    forceDetection: false,
  });

  if (!result.success || !result.data) {
    return {
      success: false,
      error: result.error || 'Detection failed',
    };
  }

  return result.data;
}
