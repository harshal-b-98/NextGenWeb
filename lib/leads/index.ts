/**
 * Lead Capture System
 * Phase 4.4: Conversion & Lead Tools
 *
 * Exports for lead capture, notifications, and conversion tracking.
 */

// Types
export * from './types';

// Services
export { LeadCaptureService, createLeadCaptureService } from './lead-service';
export type { LeadQueryFilters, LeadStats } from './lead-service';
export { NotificationService, createNotificationService } from './notification-service';
export { ConversionService, createConversionService } from './conversion-service';
export type {
  ConversionGoalInput,
  ConversionEventInput,
  ConversionStats,
} from './conversion-service';
export { ThankYouPageService, createThankYouPageService } from './thank-you-service';
export type {
  ThankYouPageInput,
  GeneratedThankYouPage,
} from './thank-you-service';
export { ConversionTracker, createConversionTracker } from './conversion-tracker';
export type { ConversionTrackerConfig } from './conversion-tracker';
