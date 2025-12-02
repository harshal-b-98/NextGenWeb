/**
 * Conversation State Store
 * Phase 6.4: Conversation Journey & Conversion Flow - Task #116
 *
 * Comprehensive state management for tracking the conversation journey.
 * Tracks all interactions, topics explored, engagement metrics, and
 * conversion readiness in the conversational marketing experience.
 *
 * Features:
 * - Track all CTA clicks and chat messages
 * - Calculate engagement score in real-time
 * - Track topics explored with depth per topic
 * - Store persona signals for personalization
 * - Calculate conversion readiness
 * - Persist to localStorage and sync with server
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { useShallow } from 'zustand/react/shallow';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Types of interactions in the conversation
 */
export type InteractionType =
  | 'cta-click'      // User clicked a CTA button
  | 'chat-message'   // User sent a chat message
  | 'section-view'   // User viewed a generated section
  | 'scroll-depth'   // User scrolled to a certain depth
  | 'time-on-section' // Time spent on a section
  | 'follow-up-click' // Clicked a follow-up CTA
  | 'form-start'     // Started filling a form
  | 'form-submit'    // Submitted a form
  | 'handoff-trigger'; // Triggered human handoff

/**
 * Single interaction record
 */
export interface Interaction {
  id: string;
  type: InteractionType;
  timestamp: string;
  topic?: string;
  ctaId?: string;
  ctaText?: string;
  message?: string;
  sectionId?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Topic engagement tracking
 */
export interface TopicEngagement {
  topic: string;
  firstInteractionAt: string;
  lastInteractionAt: string;
  sectionsGenerated: number;
  timeSpentMs: number;
  ctasClicked: string[];
  questionsAsked: string[];
  depth: 'surface' | 'moderate' | 'deep';
}

/**
 * Persona signal detected from behavior
 */
export interface PersonaSignal {
  signal: string;
  confidence: number;
  source: 'topic' | 'query' | 'behavior' | 'time' | 'explicit';
  timestamp: string;
}

/**
 * Journey depth levels
 */
export enum JourneyDepth {
  SURFACE = 1,      // 1 section
  EXPLORING = 2,    // 2-3 sections
  ENGAGED = 3,      // 4-5 sections
  DEEP = 4,         // 6+ sections or 2+ per topic
  CONVERSION_READY = 5  // Triggered conversion CTA
}

/**
 * Funnel stage
 */
export type FunnelStage =
  | 'awareness'
  | 'consideration'
  | 'decision'
  | 'action';

/**
 * Conversion readiness levels
 */
export type ConversionReadiness = 'low' | 'medium' | 'high' | 'ready';

/**
 * Full conversation state
 */
export interface ConversationState {
  // ========== Core Identity ==========
  sessionId: string;
  websiteId: string | null;
  workspaceId: string | null;
  startedAt: string;
  lastActivityAt: string;

  // ========== Interactions ==========
  interactions: Interaction[];
  totalInteractions: number;

  // ========== Topic Engagement ==========
  topicsExplored: Record<string, TopicEngagement>;
  topicOrder: string[]; // Order of first exploration

  // ========== Journey Metrics ==========
  currentDepth: JourneyDepth;
  currentFunnelStage: FunnelStage;
  sectionsGenerated: number;
  totalTimeSpentMs: number;

  // ========== Engagement Scoring ==========
  engagementScore: number;
  conversionReadiness: ConversionReadiness;

  // ========== Persona Detection ==========
  personaSignals: PersonaSignal[];
  detectedPersona: string | null;
  personaConfidence: number;

  // ========== Conversion Tracking ==========
  hasTriggeredConversion: boolean;
  conversionCtaShown: boolean;
  lastConversionPromptAt: string | null;
}

/**
 * Store actions
 */
export interface ConversationStateActions {
  // ========== Initialization ==========
  initSession: (params: {
    websiteId: string;
    workspaceId: string;
  }) => void;

  // ========== Interaction Tracking ==========
  trackInteraction: (interaction: Omit<Interaction, 'id' | 'timestamp'>) => void;
  trackCTAClick: (params: {
    ctaId: string;
    ctaText: string;
    topic: string;
    metadata?: Record<string, unknown>;
  }) => void;
  trackChatMessage: (params: {
    message: string;
    topic?: string;
  }) => void;
  trackSectionGenerated: (params: {
    sectionId: string;
    topic: string;
    sourceCtaId: string;
  }) => void;
  trackTimeOnSection: (params: {
    sectionId: string;
    timeMs: number;
    topic: string;
  }) => void;

  // ========== Topic Engagement ==========
  updateTopicEngagement: (topic: string, updates: Partial<TopicEngagement>) => void;
  getTopicEngagement: (topic: string) => TopicEngagement | null;

  // ========== Persona Signals ==========
  addPersonaSignal: (signal: Omit<PersonaSignal, 'timestamp'>) => void;
  setDetectedPersona: (persona: string, confidence: number) => void;

  // ========== Conversion ==========
  markConversionPromptShown: () => void;
  markConversionTriggered: () => void;

  // ========== Computed Values ==========
  calculateEngagementScore: () => number;
  calculateConversionReadiness: () => ConversionReadiness;
  getCurrentDepth: () => JourneyDepth;
  getCurrentFunnelStage: () => FunnelStage;

  // ========== Session Management ==========
  updateLastActivity: () => void;
  getSessionDuration: () => number;
  reset: () => void;

  // ========== Export ==========
  exportJourneyData: () => JourneyExportData;
}

/**
 * Journey data export for lead forms
 */
export interface JourneyExportData {
  sessionId: string;
  duration: number;
  sectionsViewed: number;
  topicsExplored: string[];
  engagementScore: number;
  detectedPersona: string | null;
  personaConfidence: number;
  keyInterests: string[];
  questionsAsked: string[];
  funnelStage: FunnelStage;
  conversionReadiness: ConversionReadiness;
  interactionSummary: {
    totalInteractions: number;
    ctaClicks: number;
    chatMessages: number;
    avgTimePerSection: number;
  };
}

// ============================================================================
// FULL STORE TYPE
// ============================================================================

export type ConversationStore = ConversationState & ConversationStateActions;

// ============================================================================
// INITIAL STATE
// ============================================================================

function generateSessionId(): string {
  return `session-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

const createInitialState = (): ConversationState => ({
  sessionId: generateSessionId(),
  websiteId: null,
  workspaceId: null,
  startedAt: new Date().toISOString(),
  lastActivityAt: new Date().toISOString(),
  interactions: [],
  totalInteractions: 0,
  topicsExplored: {},
  topicOrder: [],
  currentDepth: JourneyDepth.SURFACE,
  currentFunnelStage: 'awareness',
  sectionsGenerated: 0,
  totalTimeSpentMs: 0,
  engagementScore: 0,
  conversionReadiness: 'low',
  personaSignals: [],
  detectedPersona: null,
  personaConfidence: 0,
  hasTriggeredConversion: false,
  conversionCtaShown: false,
  lastConversionPromptAt: null,
});

// ============================================================================
// SCORING CONSTANTS
// ============================================================================

const ENGAGEMENT_WEIGHTS = {
  sectionView: 10,
  ctaClick: 15,
  chatMessage: 20,
  timePerTenSeconds: 1, // +1 per 10 seconds, max 30 per section
  followUpClick: 12,
  deepTopicExploration: 25, // 2+ sections on same topic
  returnVisit: 30,
  formStart: 20,
  formSubmit: 50,
};

const DEPTH_THRESHOLDS = {
  [JourneyDepth.SURFACE]: 1,
  [JourneyDepth.EXPLORING]: 2,
  [JourneyDepth.ENGAGED]: 4,
  [JourneyDepth.DEEP]: 6,
  [JourneyDepth.CONVERSION_READY]: 999, // Only via explicit action
};

// ============================================================================
// STORE IMPLEMENTATION
// ============================================================================

export const useConversationStore = create<ConversationStore>()(
  persist(
    (set, get) => ({
      ...createInitialState(),

      // ========== Initialization ==========

      initSession: ({ websiteId, workspaceId }) => {
        const currentState = get();

        // If already initialized with same website, keep state
        if (currentState.websiteId === websiteId) {
          set({ lastActivityAt: new Date().toISOString() });
          return;
        }

        // New session for different website
        set({
          ...createInitialState(),
          websiteId,
          workspaceId,
        });
      },

      // ========== Interaction Tracking ==========

      trackInteraction: (interactionData) => {
        const now = new Date().toISOString();
        const interaction: Interaction = {
          ...interactionData,
          id: `int-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          timestamp: now,
        };

        set((state) => ({
          interactions: [...state.interactions, interaction],
          totalInteractions: state.totalInteractions + 1,
          lastActivityAt: now,
        }));

        // Recalculate scores after interaction
        const store = get();
        const newScore = store.calculateEngagementScore();
        const newReadiness = store.calculateConversionReadiness();
        const newDepth = store.getCurrentDepth();
        const newStage = store.getCurrentFunnelStage();

        set({
          engagementScore: newScore,
          conversionReadiness: newReadiness,
          currentDepth: newDepth,
          currentFunnelStage: newStage,
        });
      },

      trackCTAClick: ({ ctaId, ctaText, topic, metadata }) => {
        const store = get();

        // Track the interaction
        store.trackInteraction({
          type: 'cta-click',
          ctaId,
          ctaText,
          topic,
          metadata,
        });

        // Update topic engagement
        store.updateTopicEngagement(topic, {
          ctasClicked: [...(store.topicsExplored[topic]?.ctasClicked || []), ctaId],
        });
      },

      trackChatMessage: ({ message, topic }) => {
        const store = get();

        store.trackInteraction({
          type: 'chat-message',
          message,
          topic,
        });

        if (topic) {
          store.updateTopicEngagement(topic, {
            questionsAsked: [...(store.topicsExplored[topic]?.questionsAsked || []), message],
          });
        }

        // Add persona signal from chat behavior
        store.addPersonaSignal({
          signal: 'engaged-chatter',
          confidence: 0.6,
          source: 'behavior',
        });
      },

      trackSectionGenerated: ({ sectionId, topic, sourceCtaId }) => {
        const store = get();

        store.trackInteraction({
          type: 'section-view',
          sectionId,
          topic,
          ctaId: sourceCtaId,
        });

        // Update topic engagement
        const currentEngagement = store.topicsExplored[topic];
        const newSectionsCount = (currentEngagement?.sectionsGenerated || 0) + 1;

        store.updateTopicEngagement(topic, {
          sectionsGenerated: newSectionsCount,
          depth: newSectionsCount >= 3 ? 'deep' : newSectionsCount >= 2 ? 'moderate' : 'surface',
        });

        // Update global sections count
        set((state) => ({
          sectionsGenerated: state.sectionsGenerated + 1,
        }));

        // Deep exploration bonus
        if (newSectionsCount >= 2) {
          store.addPersonaSignal({
            signal: `deep-interest-${topic}`,
            confidence: 0.7,
            source: 'topic',
          });
        }
      },

      trackTimeOnSection: ({ sectionId, timeMs, topic }) => {
        const store = get();

        store.trackInteraction({
          type: 'time-on-section',
          sectionId,
          topic,
          metadata: { timeMs },
        });

        // Update topic time
        store.updateTopicEngagement(topic, {
          timeSpentMs: (store.topicsExplored[topic]?.timeSpentMs || 0) + timeMs,
        });

        // Update total time
        set((state) => ({
          totalTimeSpentMs: state.totalTimeSpentMs + timeMs,
        }));
      },

      // ========== Topic Engagement ==========

      updateTopicEngagement: (topic, updates) => {
        const now = new Date().toISOString();

        set((state) => {
          const existing = state.topicsExplored[topic];
          const isNewTopic = !existing;

          const updated: TopicEngagement = {
            topic,
            firstInteractionAt: existing?.firstInteractionAt || now,
            lastInteractionAt: now,
            sectionsGenerated: existing?.sectionsGenerated || 0,
            timeSpentMs: existing?.timeSpentMs || 0,
            ctasClicked: existing?.ctasClicked || [],
            questionsAsked: existing?.questionsAsked || [],
            depth: existing?.depth || 'surface',
            ...updates,
          };

          return {
            topicsExplored: {
              ...state.topicsExplored,
              [topic]: updated,
            },
            topicOrder: isNewTopic
              ? [...state.topicOrder, topic]
              : state.topicOrder,
          };
        });
      },

      getTopicEngagement: (topic) => {
        return get().topicsExplored[topic] || null;
      },

      // ========== Persona Signals ==========

      addPersonaSignal: (signal) => {
        const now = new Date().toISOString();

        set((state) => ({
          personaSignals: [
            ...state.personaSignals,
            { ...signal, timestamp: now },
          ],
        }));
      },

      setDetectedPersona: (persona, confidence) => {
        set({
          detectedPersona: persona,
          personaConfidence: confidence,
        });
      },

      // ========== Conversion ==========

      markConversionPromptShown: () => {
        set({
          conversionCtaShown: true,
          lastConversionPromptAt: new Date().toISOString(),
        });
      },

      markConversionTriggered: () => {
        const store = get();

        store.trackInteraction({
          type: 'handoff-trigger',
          metadata: {
            engagementScore: store.engagementScore,
            depth: store.currentDepth,
            funnelStage: store.currentFunnelStage,
          },
        });

        set({
          hasTriggeredConversion: true,
          currentDepth: JourneyDepth.CONVERSION_READY,
        });
      },

      // ========== Computed Values ==========

      calculateEngagementScore: () => {
        const state = get();
        let score = 0;

        // Count interaction types
        const ctaClicks = state.interactions.filter(i => i.type === 'cta-click').length;
        const chatMessages = state.interactions.filter(i => i.type === 'chat-message').length;
        const sectionViews = state.sectionsGenerated;
        const followUpClicks = state.interactions.filter(i => i.type === 'follow-up-click').length;

        // Base scores
        score += sectionViews * ENGAGEMENT_WEIGHTS.sectionView;
        score += ctaClicks * ENGAGEMENT_WEIGHTS.ctaClick;
        score += chatMessages * ENGAGEMENT_WEIGHTS.chatMessage;
        score += followUpClicks * ENGAGEMENT_WEIGHTS.followUpClick;

        // Time bonus (capped at 30 points per section)
        const avgTimePerSection = sectionViews > 0
          ? state.totalTimeSpentMs / sectionViews / 1000
          : 0;
        const timeBonus = Math.min(30, Math.floor(avgTimePerSection / 10)) * sectionViews;
        score += timeBonus;

        // Deep exploration bonus
        const deepTopics = Object.values(state.topicsExplored).filter(t => t.depth === 'deep');
        score += deepTopics.length * ENGAGEMENT_WEIGHTS.deepTopicExploration;

        // Form interaction bonuses
        const formStarts = state.interactions.filter(i => i.type === 'form-start').length;
        const formSubmits = state.interactions.filter(i => i.type === 'form-submit').length;
        score += formStarts * ENGAGEMENT_WEIGHTS.formStart;
        score += formSubmits * ENGAGEMENT_WEIGHTS.formSubmit;

        return Math.round(score);
      },

      calculateConversionReadiness: () => {
        const state = get();
        const score = state.engagementScore;
        const depth = state.currentDepth;

        // Readiness based on engagement score and depth
        if (state.hasTriggeredConversion) return 'ready';
        if (score >= 150 && depth >= JourneyDepth.ENGAGED) return 'ready';
        if (score >= 100 || depth >= JourneyDepth.DEEP) return 'high';
        if (score >= 50 || depth >= JourneyDepth.EXPLORING) return 'medium';
        return 'low';
      },

      getCurrentDepth: () => {
        const state = get();
        const sections = state.sectionsGenerated;

        // Check for deep topic exploration
        const hasDeepTopicEngagement = Object.values(state.topicsExplored)
          .some(t => t.sectionsGenerated >= 2);

        if (state.hasTriggeredConversion) return JourneyDepth.CONVERSION_READY;
        if (sections >= 6 || hasDeepTopicEngagement) return JourneyDepth.DEEP;
        if (sections >= 4) return JourneyDepth.ENGAGED;
        if (sections >= 2) return JourneyDepth.EXPLORING;
        return JourneyDepth.SURFACE;
      },

      getCurrentFunnelStage: () => {
        const state = get();

        // Determine stage based on topics explored
        const topics = Object.keys(state.topicsExplored);
        const hasPricingIntent = topics.some(t =>
          t.toLowerCase().includes('pricing') ||
          t.toLowerCase().includes('cost') ||
          t.toLowerCase().includes('plan')
        );
        const hasComparisonIntent = topics.some(t =>
          t.toLowerCase().includes('comparison') ||
          t.toLowerCase().includes('vs') ||
          t.toLowerCase().includes('alternative')
        );
        const hasActionIntent = state.interactions.some(i =>
          i.type === 'form-start' ||
          i.type === 'handoff-trigger' ||
          (i.ctaText?.toLowerCase().includes('demo') ?? false) ||
          (i.ctaText?.toLowerCase().includes('contact') ?? false)
        );

        if (hasActionIntent || state.hasTriggeredConversion) return 'action';
        if (hasPricingIntent || state.currentDepth >= JourneyDepth.DEEP) return 'decision';
        if (hasComparisonIntent || state.currentDepth >= JourneyDepth.EXPLORING) return 'consideration';
        return 'awareness';
      },

      // ========== Session Management ==========

      updateLastActivity: () => {
        set({ lastActivityAt: new Date().toISOString() });
      },

      getSessionDuration: () => {
        const state = get();
        const start = new Date(state.startedAt).getTime();
        const now = Date.now();
        return Math.floor((now - start) / 1000); // seconds
      },

      reset: () => {
        set(createInitialState());
      },

      // ========== Export ==========

      exportJourneyData: () => {
        const state = get();
        const store = get();

        const ctaClicks = state.interactions.filter(i => i.type === 'cta-click').length;
        const chatMessages = state.interactions.filter(i => i.type === 'chat-message').length;
        const questions = Object.values(state.topicsExplored)
          .flatMap(t => t.questionsAsked);

        // Get key interests (topics with most engagement)
        const keyInterests = Object.entries(state.topicsExplored)
          .sort(([, a], [, b]) => b.sectionsGenerated - a.sectionsGenerated)
          .slice(0, 5)
          .map(([topic]) => topic);

        return {
          sessionId: state.sessionId,
          duration: store.getSessionDuration(),
          sectionsViewed: state.sectionsGenerated,
          topicsExplored: state.topicOrder,
          engagementScore: state.engagementScore,
          detectedPersona: state.detectedPersona,
          personaConfidence: state.personaConfidence,
          keyInterests,
          questionsAsked: questions,
          funnelStage: state.currentFunnelStage,
          conversionReadiness: state.conversionReadiness,
          interactionSummary: {
            totalInteractions: state.totalInteractions,
            ctaClicks,
            chatMessages,
            avgTimePerSection: state.sectionsGenerated > 0
              ? Math.round(state.totalTimeSpentMs / state.sectionsGenerated / 1000)
              : 0,
          },
        };
      },
    }),
    {
      name: 'conversation-state-storage',
      storage: createJSONStorage(() => {
        if (typeof window !== 'undefined') {
          return localStorage; // Persist across tabs
        }
        return {
          getItem: () => null,
          setItem: () => {},
          removeItem: () => {},
        };
      }),
      partialize: (state) => ({
        // Persist all relevant state
        sessionId: state.sessionId,
        websiteId: state.websiteId,
        workspaceId: state.workspaceId,
        startedAt: state.startedAt,
        lastActivityAt: state.lastActivityAt,
        interactions: state.interactions,
        totalInteractions: state.totalInteractions,
        topicsExplored: state.topicsExplored,
        topicOrder: state.topicOrder,
        sectionsGenerated: state.sectionsGenerated,
        totalTimeSpentMs: state.totalTimeSpentMs,
        engagementScore: state.engagementScore,
        personaSignals: state.personaSignals,
        detectedPersona: state.detectedPersona,
        personaConfidence: state.personaConfidence,
        hasTriggeredConversion: state.hasTriggeredConversion,
      }),
    }
  )
);

// ============================================================================
// HOOKS
// ============================================================================

/**
 * Hook to get engagement metrics
 */
export function useEngagementMetrics() {
  return useConversationStore(
    useShallow((state) => ({
      engagementScore: state.engagementScore,
      conversionReadiness: state.conversionReadiness,
      currentDepth: state.currentDepth,
      currentFunnelStage: state.currentFunnelStage,
      sectionsGenerated: state.sectionsGenerated,
    }))
  );
}

/**
 * Hook to get topic engagement
 */
export function useTopicEngagement() {
  return useConversationStore(
    useShallow((state) => ({
      topicsExplored: state.topicsExplored,
      topicOrder: state.topicOrder,
    }))
  );
}

/**
 * Hook to get persona info
 */
export function usePersonaInfo() {
  return useConversationStore(
    useShallow((state) => ({
      personaSignals: state.personaSignals,
      detectedPersona: state.detectedPersona,
      personaConfidence: state.personaConfidence,
    }))
  );
}

/**
 * Hook to get tracking actions
 */
export function useConversationTracking() {
  return useConversationStore(
    useShallow((state) => ({
      initSession: state.initSession,
      trackCTAClick: state.trackCTAClick,
      trackChatMessage: state.trackChatMessage,
      trackSectionGenerated: state.trackSectionGenerated,
      trackTimeOnSection: state.trackTimeOnSection,
      markConversionPromptShown: state.markConversionPromptShown,
      markConversionTriggered: state.markConversionTriggered,
      addPersonaSignal: state.addPersonaSignal,
    }))
  );
}

/**
 * Hook to check if should show conversion CTA
 */
export function useShouldShowConversion() {
  return useConversationStore((state) => {
    const { conversionReadiness, sectionsGenerated, conversionCtaShown, hasTriggeredConversion } = state;

    // Already converted
    if (hasTriggeredConversion) return false;

    // Determine prominence based on journey stage
    if (conversionReadiness === 'ready') return true;
    if (conversionReadiness === 'high' && sectionsGenerated >= 4) return true;
    if (conversionReadiness === 'medium' && sectionsGenerated >= 2) return true;

    return false;
  });
}

/**
 * Hook to get conversion CTA prominence level
 */
export function useConversionProminence(): 'subtle' | 'secondary' | 'prominent' | 'primary' {
  return useConversationStore((state) => {
    const { sectionsGenerated, conversionReadiness, hasTriggeredConversion } = state;

    if (hasTriggeredConversion) return 'primary';
    if (conversionReadiness === 'ready') return 'primary';
    if (sectionsGenerated >= 5 || conversionReadiness === 'high') return 'prominent';
    if (sectionsGenerated >= 2) return 'secondary';
    return 'subtle';
  });
}

// ============================================================================
// EXPORTS
// ============================================================================

export default useConversationStore;
