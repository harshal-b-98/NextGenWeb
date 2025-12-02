/**
 * Runtime Tracking Types
 * Phase 4.2: Runtime Persona Detection
 *
 * Type definitions for visitor behavior tracking and session management.
 */

// ============================================================================
// SESSION TYPES
// ============================================================================

/**
 * Visitor session data stored in the database
 */
export interface VisitorSession {
  id: string;
  websiteId: string;
  visitorId: string;
  sessionId: string;
  clickHistory: ClickEvent[];
  scrollBehavior: ScrollRecord[];
  timeOnSections: Record<string, number>;
  navigationPath: string[];
  referrerUrl: string | null;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  deviceType: DeviceType | null;
  browser: string | null;
  os: string | null;
  detectedPersonaId: string | null;
  personaConfidence: number | null;
  detectionSignals: DetectionSignal[];
  startedAt: string;
  lastActivityAt: string;
  createdAt: string;
}

/**
 * Device type classification
 */
export type DeviceType = 'desktop' | 'tablet' | 'mobile';

// ============================================================================
// EVENT TYPES
// ============================================================================

/**
 * Click event record
 */
export interface ClickEvent {
  elementId?: string;
  elementType: string;
  sectionId?: string;
  pageUrl?: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

/**
 * Scroll behavior record
 */
export interface ScrollRecord {
  pageId: string;
  pageUrl: string;
  maxDepth: number; // 0-100 percentage
  duration: number; // seconds
  timestamp: string;
}

/**
 * Time spent on a section
 */
export interface SectionTime {
  sectionId: string;
  totalSeconds: number;
  lastUpdated: string;
}

/**
 * Form interaction record
 */
export interface FormInteraction {
  formId: string;
  formName?: string;
  fieldsInteracted: string[];
  completed: boolean;
  timestamp: string;
}

/**
 * Search query record
 */
export interface SearchQuery {
  query: string;
  resultsCount?: number;
  timestamp: string;
}

// ============================================================================
// DETECTION SIGNAL TYPES
// ============================================================================

/**
 * Signal type for persona detection
 */
export type DetectionSignalType =
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
 * Detection signal record
 */
export interface DetectionSignal {
  type: DetectionSignalType;
  value: unknown;
  timestamp: string;
  weight: number;
  contributed: boolean;
  ruleId?: string;
  metadata?: Record<string, unknown>;
}

// ============================================================================
// TRACKING EVENT TYPES
// ============================================================================

/**
 * Base tracking event
 */
export interface BaseTrackingEvent {
  type: TrackingEventType;
  timestamp: string;
  sessionId: string;
  visitorId: string;
  websiteId: string;
  pageUrl: string;
}

/**
 * All tracking event types
 */
export type TrackingEventType =
  | 'page_view'
  | 'click'
  | 'scroll'
  | 'section_enter'
  | 'section_exit'
  | 'form_start'
  | 'form_field_focus'
  | 'form_submit'
  | 'search'
  | 'session_start'
  | 'session_end';

/**
 * Page view event
 */
export interface PageViewEvent extends BaseTrackingEvent {
  type: 'page_view';
  pageId?: string;
  pageTitle?: string;
  referrer?: string;
}

/**
 * Click event for tracking
 */
export interface ClickTrackingEvent extends BaseTrackingEvent {
  type: 'click';
  elementId?: string;
  elementType: string;
  elementText?: string;
  sectionId?: string;
}

/**
 * Scroll event for tracking
 */
export interface ScrollTrackingEvent extends BaseTrackingEvent {
  type: 'scroll';
  pageId?: string;
  scrollDepth: number;
  viewportHeight: number;
  documentHeight: number;
}

/**
 * Section visibility event
 */
export interface SectionEvent extends BaseTrackingEvent {
  type: 'section_enter' | 'section_exit';
  sectionId: string;
  sectionName?: string;
  visibleTime?: number;
}

/**
 * Form tracking event
 */
export interface FormTrackingEvent extends BaseTrackingEvent {
  type: 'form_start' | 'form_field_focus' | 'form_submit';
  formId: string;
  formName?: string;
  fieldName?: string;
  success?: boolean;
}

/**
 * Search event
 */
export interface SearchTrackingEvent extends BaseTrackingEvent {
  type: 'search';
  query: string;
  resultsCount?: number;
}

/**
 * Session lifecycle event
 */
export interface SessionLifecycleEvent extends BaseTrackingEvent {
  type: 'session_start' | 'session_end';
  referrerUrl?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  deviceType?: DeviceType;
  browser?: string;
  os?: string;
}

/**
 * Union of all tracking events
 */
export type TrackingEvent =
  | PageViewEvent
  | ClickTrackingEvent
  | ScrollTrackingEvent
  | SectionEvent
  | FormTrackingEvent
  | SearchTrackingEvent
  | SessionLifecycleEvent;

// ============================================================================
// BATCH TRACKING TYPES
// ============================================================================

/**
 * Batch of tracking events to be sent to the server
 */
export interface TrackingBatch {
  sessionId: string;
  visitorId: string;
  websiteId: string;
  events: TrackingEvent[];
  timestamp: string;
}

/**
 * Result of processing a tracking batch
 */
export interface TrackingBatchResult {
  success: boolean;
  processedEvents: number;
  detectionTriggered: boolean;
  detectedPersonaId?: string;
  personaConfidence?: number;
  error?: string;
}

// ============================================================================
// SESSION INITIALIZATION TYPES
// ============================================================================

/**
 * Session initialization request
 */
export interface SessionInitRequest {
  websiteId: string;
  visitorId?: string; // Optional - will be generated if not provided
  referrerUrl?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  deviceType?: DeviceType;
  browser?: string;
  os?: string;
  pageUrl: string;
}

/**
 * Session initialization response
 */
export interface SessionInitResponse {
  success: boolean;
  sessionId: string;
  visitorId: string;
  existingPersonaId?: string;
  existingConfidence?: number;
  isNewVisitor: boolean;
  error?: string;
}

// ============================================================================
// DETECTION REQUEST/RESPONSE TYPES
// ============================================================================

/**
 * Request for persona detection
 */
export interface DetectionRequest {
  sessionId: string;
  visitorId: string;
  websiteId: string;
  forceDetection?: boolean;
}

/**
 * Response from persona detection
 */
export interface DetectionResponse {
  success: boolean;
  personaId?: string;
  confidence?: number;
  signals?: DetectionSignal[];
  alternativeMatches?: Array<{
    personaId: string;
    confidence: number;
  }>;
  error?: string;
}

// ============================================================================
// CLIENT-SIDE STATE TYPES
// ============================================================================

/**
 * Client-side tracking state
 */
export interface TrackingState {
  sessionId: string | null;
  visitorId: string | null;
  websiteId: string;
  isInitialized: boolean;
  detectedPersonaId: string | null;
  personaConfidence: number | null;
  pendingEvents: TrackingEvent[];
  lastSyncTimestamp: string | null;
}

/**
 * Tracking configuration
 */
export interface TrackingConfig {
  websiteId: string;
  batchSize: number;
  batchIntervalMs: number;
  scrollDebounceMs: number;
  sectionVisibilityThreshold: number;
  enableDebugMode: boolean;
  detectionThreshold: number;
  autoDetect: boolean;
}

/**
 * Default tracking configuration
 */
export const DEFAULT_TRACKING_CONFIG: TrackingConfig = {
  websiteId: '',
  batchSize: 20,
  batchIntervalMs: 10000, // 10 seconds
  scrollDebounceMs: 500,
  sectionVisibilityThreshold: 0.5, // 50% visible
  enableDebugMode: false,
  detectionThreshold: 0.5,
  autoDetect: true,
};

// ============================================================================
// USER BEHAVIOR TYPE (for detection engine)
// ============================================================================

/**
 * Aggregated user behavior for detection
 * Compatible with PersonaDetectionEngine input
 */
export interface UserBehavior {
  sessionId: string;
  visitorId: string;
  clickHistory: ClickEvent[];
  scrollBehavior: ScrollRecord[];
  timeOnSections: Record<string, number>;
  navigationPath: string[];
  referrerData: {
    url?: string;
    source?: string;
    medium?: string;
    campaign?: string;
  };
  searchQueries: string[];
  formInteractions: FormInteraction[];
  deviceType: DeviceType;
}

// ============================================================================
// SERVICE RESULT TYPES
// ============================================================================

/**
 * Generic service result
 */
export interface TrackingServiceResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}
