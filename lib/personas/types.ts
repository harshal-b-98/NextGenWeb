/**
 * Persona Module Types
 *
 * Types for the persona modeling system including persona profiles,
 * detection rules, and content mapping.
 */

import { z } from 'zod';

/**
 * Communication style types
 */
export type CommunicationStyle = 'technical' | 'business' | 'executive';

/**
 * Buyer journey stages
 */
export type BuyerJourneyStage = 'awareness' | 'consideration' | 'decision';

/**
 * Detection rule types
 */
export type DetectionRuleType =
  | 'click_pattern'
  | 'scroll_behavior'
  | 'time_on_page'
  | 'referrer'
  | 'utm_parameter'
  | 'content_interaction'
  | 'form_field'
  | 'page_sequence'
  | 'device_type'
  | 'search_query';

/**
 * Detection rule condition
 */
export interface DetectionRule {
  id: string;
  type: DetectionRuleType;
  condition: string;
  value?: string;
  weight: number;
  description?: string;
}

/**
 * Detection rule schema
 */
export const DetectionRuleSchema = z.object({
  id: z.string(),
  type: z.enum([
    'click_pattern',
    'scroll_behavior',
    'time_on_page',
    'referrer',
    'utm_parameter',
    'content_interaction',
    'form_field',
    'page_sequence',
    'device_type',
    'search_query',
  ]),
  condition: z.string(),
  value: z.string().optional(),
  weight: z.number().min(0).max(1),
  description: z.string().optional(),
});

/**
 * Content preference mapping
 */
export interface ContentPreference {
  entityType: string;
  relevanceScore: number;
  preferredFormat?: 'detailed' | 'summary' | 'visual';
  priority: 'high' | 'medium' | 'low';
}

/**
 * Persona profile
 */
export interface Persona {
  id: string;
  workspaceId: string;

  // Identity
  name: string;
  title: string;
  avatarUrl?: string;

  // Demographics
  industry?: string;
  companySize?: string;
  location?: string;

  // Characteristics
  goals: string[];
  painPoints: string[];
  decisionCriteria: string[];
  objections: string[];
  keyMetrics: string[];

  // Behavior
  communicationStyle: CommunicationStyle;
  buyerJourneyStage: BuyerJourneyStage;

  // Detection
  detectionRules: DetectionRule[];

  // Content mapping
  relevantKnowledgeIds: string[];
  preferredContentTypes: string[];
  contentPreferences: ContentPreference[];

  // Status
  isActive: boolean;
  isPrimary: boolean;

  // AI metadata
  aiGenerated: boolean;
  confidenceScore: number;

  // Timestamps
  createdAt: string;
  updatedAt: string;
}

/**
 * Persona schema for validation
 */
export const PersonaSchema = z.object({
  id: z.string(),
  workspaceId: z.string(),
  name: z.string().min(1),
  title: z.string().min(1),
  avatarUrl: z.string().url().optional(),
  industry: z.string().optional(),
  companySize: z.string().optional(),
  location: z.string().optional(),
  goals: z.array(z.string()).min(1),
  painPoints: z.array(z.string()).min(1),
  decisionCriteria: z.array(z.string()),
  objections: z.array(z.string()),
  keyMetrics: z.array(z.string()),
  communicationStyle: z.enum(['technical', 'business', 'executive']),
  buyerJourneyStage: z.enum(['awareness', 'consideration', 'decision']),
  detectionRules: z.array(DetectionRuleSchema),
  relevantKnowledgeIds: z.array(z.string()),
  preferredContentTypes: z.array(z.string()),
  contentPreferences: z.array(
    z.object({
      entityType: z.string(),
      relevanceScore: z.number().min(0).max(1),
      preferredFormat: z.enum(['detailed', 'summary', 'visual']).optional(),
      priority: z.enum(['high', 'medium', 'low']),
    })
  ),
  isActive: z.boolean(),
  isPrimary: z.boolean(),
  aiGenerated: z.boolean(),
  confidenceScore: z.number().min(0).max(1),
  createdAt: z.string(),
  updatedAt: z.string(),
});

/**
 * Persona creation input
 */
export interface CreatePersonaInput {
  workspaceId: string;
  name: string;
  title: string;
  avatarUrl?: string;
  industry?: string;
  companySize?: string;
  location?: string;
  goals: string[];
  painPoints: string[];
  decisionCriteria?: string[];
  objections?: string[];
  keyMetrics?: string[];
  communicationStyle: CommunicationStyle;
  buyerJourneyStage: BuyerJourneyStage;
  detectionRules?: DetectionRule[];
  aiGenerated?: boolean;
  confidenceScore?: number;
}

/**
 * Persona update input
 */
export interface UpdatePersonaInput {
  name?: string;
  title?: string;
  avatarUrl?: string;
  industry?: string;
  companySize?: string;
  location?: string;
  goals?: string[];
  painPoints?: string[];
  decisionCriteria?: string[];
  objections?: string[];
  keyMetrics?: string[];
  communicationStyle?: CommunicationStyle;
  buyerJourneyStage?: BuyerJourneyStage;
  detectionRules?: DetectionRule[];
  relevantKnowledgeIds?: string[];
  preferredContentTypes?: string[];
  contentPreferences?: ContentPreference[];
  isActive?: boolean;
  isPrimary?: boolean;
}

/**
 * Persona signal from documents
 */
export interface PersonaSignal {
  type: 'goal' | 'pain_point' | 'role' | 'industry' | 'behavior' | 'preference';
  value: string;
  confidence: number;
  sourceChunkIds: string[];
  context?: string;
}

/**
 * Signal cluster for persona grouping
 */
export interface SignalCluster {
  id: string;
  signals: PersonaSignal[];
  dominantType: string;
  centroid?: number[];
  cohesion: number;
}

/**
 * Persona extraction result
 */
export interface PersonaExtractionResult {
  personas: Persona[];
  signals: PersonaSignal[];
  clusters: SignalCluster[];
  tokensUsed: number;
  processingTime: number;
}

/**
 * Behavior signal from user interaction
 */
export interface BehaviorSignal {
  type: DetectionRuleType;
  value: unknown;
  timestamp: string;
  weight: number;
  contributed: boolean;
  metadata?: Record<string, unknown>;
}

/**
 * Persona match result
 */
export interface PersonaMatch {
  personaId: string;
  confidence: number;
  matchedRules: Array<{
    ruleId: string;
    ruleType: DetectionRuleType;
    contribution: number;
  }>;
  signals: BehaviorSignal[];
  alternativeMatches: Array<{
    personaId: string;
    confidence: number;
  }>;
}

/**
 * User behavior for detection
 */
export interface UserBehavior {
  sessionId: string;
  visitorId: string;
  clickHistory: Array<{
    elementId?: string;
    elementType: string;
    sectionId?: string;
    timestamp: string;
  }>;
  scrollBehavior: Array<{
    pageId: string;
    maxDepth: number;
    duration: number;
  }>;
  timeOnSections: Record<string, number>;
  navigationPath: string[];
  referrerData: {
    url?: string;
    source?: string;
    medium?: string;
    campaign?: string;
  };
  searchQueries: string[];
  formInteractions: Array<{
    formId: string;
    fieldsInteracted: string[];
    completed: boolean;
  }>;
  deviceType: 'desktop' | 'tablet' | 'mobile';
}

/**
 * Persona detection options
 */
export interface DetectionOptions {
  minConfidence?: number;
  maxAlternatives?: number;
  useHistoricalData?: boolean;
  decayFactor?: number;
}

/**
 * Content adaptation result
 */
export interface ContentAdaptation {
  personaId: string;
  adaptations: Array<{
    sectionId: string;
    componentId: string;
    adaptationType: 'headline' | 'copy' | 'cta' | 'image' | 'order' | 'visibility';
    originalValue?: string;
    adaptedValue: string;
    reason: string;
  }>;
  confidence: number;
}
