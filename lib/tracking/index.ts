/**
 * Tracking Module
 * Phase 4.2: Runtime Persona Detection
 *
 * Exports for visitor behavior tracking and real-time persona detection.
 */

// Types
export type {
  // Session types
  VisitorSession,
  DeviceType,
  // Event types
  ClickEvent,
  ScrollRecord,
  SectionTime,
  FormInteraction,
  SearchQuery,
  // Detection signal types
  DetectionSignalType,
  DetectionSignal,
  // Tracking event types
  BaseTrackingEvent,
  TrackingEventType,
  PageViewEvent,
  ClickTrackingEvent,
  ScrollTrackingEvent,
  SectionEvent,
  FormTrackingEvent,
  SearchTrackingEvent,
  SessionLifecycleEvent,
  TrackingEvent,
  // Batch types
  TrackingBatch,
  TrackingBatchResult,
  // Session initialization types
  SessionInitRequest,
  SessionInitResponse,
  // Detection types
  DetectionRequest,
  DetectionResponse,
  // Client-side state types
  TrackingState,
  TrackingConfig,
  // User behavior type
  UserBehavior,
  // Service result type
  TrackingServiceResult,
} from './types';

// Constants
export { DEFAULT_TRACKING_CONFIG } from './types';

// Session service
export {
  VisitorSessionService,
  createSessionService,
} from './session-service';

// Detection service
export {
  RealtimeDetectionService,
  createDetectionService,
  detectVisitorPersona,
} from './detection-service';
