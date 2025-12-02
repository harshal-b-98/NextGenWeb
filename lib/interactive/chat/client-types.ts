/**
 * Client-Safe Type Definitions
 * Phase 6: Conversational Marketing Platform
 *
 * These types are defined separately from their implementations
 * to allow client components to import them without pulling in
 * server-only dependencies.
 *
 * IMPORTANT: Keep these in sync with the actual implementations
 * in the server-only modules.
 */

// ============================================================================
// SMART CTA TYPES (from smart-cta-generator.ts)
// ============================================================================

import type { IntentCategory } from './types';

/**
 * Generated CTA with metadata
 */
export interface SmartCTA {
  /** Unique identifier */
  id: string;
  /** Display text for the CTA */
  text: string;
  /** Topic this CTA addresses */
  topic: string;
  /** Intent category */
  intent: IntentCategory;
  /** Priority for display ordering */
  priority: 'high' | 'medium' | 'low';
  /** Confidence that we have content to answer */
  confidenceScore: number;
  /** Optional prompt override for generation */
  promptOverride?: string;
  /** Visual variant suggestion */
  variant?: 'primary' | 'secondary' | 'tertiary';
  /** Icon suggestion */
  icon?: string;
}

/**
 * Funnel stage for journey tracking
 */
export type FunnelStage = 'awareness' | 'consideration' | 'decision' | 'action';

/**
 * User journey context for CTA generation
 */
export interface JourneyContext {
  /** Current funnel stage */
  currentStage: FunnelStage;
  /** Topics already explored in this session */
  exploredTopics: string[];
  /** Number of interactions so far */
  interactionCount: number;
  /** Time spent on page (ms) */
  timeOnPage: number;
  /** Previous CTA clicks */
  previousCTAs: string[];
  /** Detected persona category */
  personaCategory?: PersonaCategory;
}

// ============================================================================
// HANDOFF DETECTOR TYPES (from handoff-detector.ts)
// ============================================================================

/**
 * Types of handoff to human
 */
export type HandoffType =
  | 'sales' // Ready to talk to sales
  | 'support' // Needs technical support
  | 'success' // Needs customer success help
  | 'general'; // General human assistance

/**
 * Urgency level for handoff
 */
export type HandoffUrgency = 'immediate' | 'high' | 'medium' | 'low';

/**
 * Signals detected for handoff
 */
export interface HandoffSignals {
  /** Explicit request for human */
  explicitRequest: boolean;
  /** Frustration signals detected */
  frustrationSignal: boolean;
  /** High-value opportunity */
  highValueSignal: boolean;
  /** Complex query beyond AI */
  complexitySignal: boolean;
  /** Time-sensitive request */
  urgencySignal: boolean;
  /** Purchasing intent */
  purchaseIntent: boolean;
  /** Repeated questions */
  repetitionSignal: boolean;
  /** Decision-maker indicators */
  decisionMaker: boolean;
  /** Budget discussion */
  budgetMention: boolean;
  /** Implementation questions */
  implementationQuery: boolean;
}

/**
 * Result of handoff detection
 */
export interface HandoffDetectionResult {
  /** Should we offer human handoff? */
  shouldOfferHandoff: boolean;
  /** Type of handoff recommended */
  handoffType: HandoffType;
  /** Urgency level */
  urgency: HandoffUrgency;
  /** Confidence score */
  confidence: number;
  /** Detected signals */
  signals: HandoffSignals;
  /** Suggested message for handoff */
  suggestedMessage: string;
  /** CTA configuration */
  ctaConfig: {
    text: string;
    action: string;
    variant: 'primary' | 'secondary';
  };
}

// ============================================================================
// PERSONA CTA PRIORITIZER TYPES (from persona-cta-prioritizer.ts)
// ============================================================================

/**
 * Detected persona categories
 */
export type PersonaCategory =
  | 'decision-maker' // C-level, VP, Director - focused on ROI and strategy
  | 'technical-evaluator' // Engineers, architects - focused on specs and integration
  | 'end-user' // Day-to-day users - focused on features and usability
  | 'researcher' // Early-stage - gathering information
  | 'champion' // Internal advocate - building a case
  | 'unknown'; // Not enough signals

/**
 * Detected persona profile
 */
export interface PersonaProfile {
  /** Primary persona category */
  category: PersonaCategory;
  /** Confidence score 0-1 */
  confidence: number;
  /** Sub-category if detected */
  subCategory?: string;
  /** Signals that led to this classification */
  signals: PersonaSignals;
  /** Industry vertical if detected */
  industry?: string;
  /** Company size indicators */
  companySize?: 'startup' | 'smb' | 'mid-market' | 'enterprise';
}

/**
 * Signals used for persona detection
 */
export interface PersonaSignals {
  /** Technical terms used */
  technicalTerms: string[];
  /** Business/ROI terms used */
  businessTerms: string[];
  /** Questions asked */
  questionTypes: string[];
  /** Time patterns */
  engagementPattern: 'quick-scan' | 'deep-dive' | 'comparison';
  /** Content preferences */
  contentPreferences: string[];
  /** Navigation patterns */
  navigationPattern: string[];
}

/**
 * Adapted CTA with persona-specific modifications
 */
export interface AdaptedCTA extends SmartCTA {
  /** Original text before adaptation */
  originalText: string;
  /** Adaptation strategy used */
  adaptationStrategy: string;
  /** Persona this was adapted for */
  targetPersona: PersonaCategory;
}
