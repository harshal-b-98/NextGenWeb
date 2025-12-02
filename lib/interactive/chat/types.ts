/**
 * Chat System Types
 * Phase 4.4: AI-Powered Conversational Interface
 *
 * Type definitions for the chat system including messages,
 * context, and configuration.
 */

import { z } from 'zod';

// ============================================================================
// MESSAGE TYPES
// ============================================================================

/**
 * Chat message roles
 */
export type ChatMessageRole = 'user' | 'assistant' | 'system';

/**
 * Chat message content types
 */
export type ChatContentType =
  | 'text'
  | 'card-grid'
  | 'comparison-table'
  | 'stats-display'
  | 'cta-block'
  | 'faq-accordion'
  | 'timeline'
  | 'form';

/**
 * Base chat message
 */
export interface ChatMessage {
  id: string;
  sessionId: string;
  websiteId: string;
  role: ChatMessageRole;
  content: string;
  contentType: ChatContentType;
  structuredContent?: ChatStructuredContent;
  metadata: ChatMessageMetadata;
  createdAt: string;
}

/**
 * Message metadata
 */
export interface ChatMessageMetadata {
  personaId?: string;
  personaConfidence?: number;
  intentCategory?: string;
  knowledgeSourceIds?: string[];
  tokensUsed?: number;
  responseTimeMs?: number;
  sectionContext?: string;
}

// ============================================================================
// STRUCTURED CONTENT TYPES
// ============================================================================

/**
 * Structured content for rich UI rendering
 */
export type ChatStructuredContent =
  | TextContent
  | CardGridContent
  | ComparisonTableContent
  | StatsDisplayContent
  | CTABlockContent
  | FAQAccordionContent
  | TimelineContent
  | FormContent;

export interface TextContent {
  type: 'text';
  text: string;
  highlights?: string[];
}

export interface CardGridContent {
  type: 'card-grid';
  title?: string;
  cards: {
    id: string;
    icon?: string;
    title: string;
    description: string;
    link?: string;
  }[];
}

export interface ComparisonTableContent {
  type: 'comparison-table';
  title?: string;
  headers: string[];
  rows: {
    label: string;
    values: (string | boolean | number)[];
  }[];
}

export interface StatsDisplayContent {
  type: 'stats-display';
  stats: {
    value: string;
    label: string;
    description?: string;
    change?: {
      value: string;
      direction: 'up' | 'down' | 'neutral';
    };
  }[];
}

export interface CTABlockContent {
  type: 'cta-block';
  title: string;
  description: string;
  primaryButton: {
    text: string;
    action: 'url' | 'scroll' | 'modal' | 'form';
    target?: string;
  };
  secondaryButton?: {
    text: string;
    action: 'url' | 'scroll' | 'modal' | 'form';
    target?: string;
  };
}

export interface FAQAccordionContent {
  type: 'faq-accordion';
  title?: string;
  items: {
    question: string;
    answer: string;
  }[];
}

export interface TimelineContent {
  type: 'timeline';
  title?: string;
  items: {
    title: string;
    description: string;
    date?: string;
    status?: 'completed' | 'current' | 'upcoming';
  }[];
}

export interface FormContent {
  type: 'form';
  title?: string;
  description?: string;
  fields: {
    id: string;
    type: 'text' | 'email' | 'phone' | 'select' | 'textarea';
    label: string;
    placeholder?: string;
    required?: boolean;
    options?: string[];
  }[];
  submitText: string;
}

// ============================================================================
// CHAT SESSION TYPES
// ============================================================================

/**
 * Chat session state
 */
export interface ChatSession {
  id: string;
  websiteId: string;
  visitorId: string;
  personaId?: string;
  personaConfidence: number;
  messages: ChatMessage[];
  context: ChatContext;
  startedAt: string;
  lastActivityAt: string;
  engagementScore: number;
}

/**
 * Chat context for AI generation
 */
export interface ChatContext {
  currentPage?: string;
  currentSection?: string;
  interactionHistory: InteractionHistoryItem[];
  knowledgeContext: KnowledgeContextItem[];
  brandConfig?: BrandConfig;
}

export interface InteractionHistoryItem {
  type: 'click' | 'scroll' | 'form' | 'chat' | 'selection';
  target?: string;
  value?: string;
  timestamp: string;
}

export interface KnowledgeContextItem {
  id: string;
  content: string;
  entityType: string;
  similarity: number;
}

export interface BrandConfig {
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  fontFamily?: string;
  logoUrl?: string;
  companyName?: string;
}

// ============================================================================
// INTENT CLASSIFICATION
// ============================================================================

/**
 * User intent categories
 */
export type IntentCategory =
  | 'product-info'
  | 'pricing'
  | 'comparison'
  | 'how-it-works'
  | 'use-case'
  | 'integration'
  | 'support'
  | 'demo-request'
  | 'contact'
  | 'general';

/**
 * Classified intent
 */
export interface ClassifiedIntent {
  category: IntentCategory;
  confidence: number;
  suggestedContentType: ChatContentType;
  entities: Record<string, string>;
}

// ============================================================================
// RENDER MODES
// ============================================================================

/**
 * How to render the AI response
 */
export type RenderMode =
  | 'inline'           // Appears within chat bubble
  | 'inline-expansion' // Expands below the chat
  | 'section-replace'  // Replaces current section
  | 'modal'            // Opens in modal
  | 'full-page'        // Adds new full-page section
  | 'side-panel';      // Slides in from side

/**
 * Render decision
 */
export interface RenderDecision {
  mode: RenderMode;
  contentType: ChatContentType;
  animation: 'fade' | 'slide-up' | 'slide-in' | 'scale';
  maxHeight?: string;
}

// ============================================================================
// CHAT CONFIGURATION
// ============================================================================

/**
 * Chat widget configuration
 */
export interface ChatWidgetConfig {
  enabled: boolean;
  position: 'bottom-right' | 'bottom-left' | 'side-panel';
  triggerText?: string;
  welcomeMessage?: string;
  placeholderText?: string;
  suggestedQuestions?: string[];
  personaAware: boolean;
  autoOpen?: {
    enabled: boolean;
    delay: number;
    condition?: 'scroll' | 'time' | 'exit-intent';
  };
  styling?: {
    bubbleColor?: string;
    headerColor?: string;
    userMessageColor?: string;
    assistantMessageColor?: string;
  };
}

// ============================================================================
// ZOD SCHEMAS FOR VALIDATION
// ============================================================================

export const ChatMessageSchema = z.object({
  id: z.string().uuid(),
  sessionId: z.string().uuid(),
  websiteId: z.string().uuid(),
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string(),
  contentType: z.enum([
    'text',
    'card-grid',
    'comparison-table',
    'stats-display',
    'cta-block',
    'faq-accordion',
    'timeline',
    'form',
  ]),
  structuredContent: z.any().optional(),
  metadata: z.object({
    personaId: z.string().optional(),
    personaConfidence: z.number().optional(),
    intentCategory: z.string().optional(),
    knowledgeSourceIds: z.array(z.string()).optional(),
    tokensUsed: z.number().optional(),
    responseTimeMs: z.number().optional(),
    sectionContext: z.string().optional(),
  }),
  createdAt: z.string(),
});

export const SendMessageRequestSchema = z.object({
  websiteId: z.string().min(1), // Allow any non-empty string for websiteId
  sessionId: z.string().nullish(), // Allow string, null, or undefined
  message: z.string().min(1).max(2000),
  sectionContext: z.string().nullish(), // Allow string, null, or undefined
  personaHint: z.string().nullish(), // Allow string, null, or undefined
  adaptationHints: z.string().nullish(), // Allow string, null, or undefined
});

export const ChatResponseSchema = z.object({
  message: ChatMessageSchema,
  sessionId: z.string().uuid(),
  suggestedFollowUps: z.array(z.string()).optional(),
  detectedIntent: z.object({
    category: z.string(),
    confidence: z.number(),
  }).optional(),
});

// ============================================================================
// API TYPES
// ============================================================================

export interface SendMessageRequest {
  websiteId: string;
  sessionId?: string;
  message: string;
  sectionContext?: string;
  personaHint?: string;
  adaptationHints?: string;
}

export interface ChatResponse {
  message: ChatMessage;
  sessionId: string;
  suggestedFollowUps?: string[];
  detectedIntent?: {
    category: IntentCategory;
    confidence: number;
  };
}

export interface ChatHistoryResponse {
  messages: ChatMessage[];
  sessionId: string;
  hasMore: boolean;
  nextCursor?: string;
}
