/**
 * Lead Capture System Types
 * Phase 4.4: Conversion & Lead Tools
 *
 * Types for lead capture forms, notifications, and conversion tracking.
 */

// ============================================================================
// LEAD CAPTURE TYPES
// ============================================================================

/**
 * Lead capture record from database
 */
export interface LeadCapture {
  id: string;
  websiteId: string;
  workspaceId?: string;
  pageId?: string;
  email: string;
  name?: string;
  phone?: string;
  company?: string;
  data: Record<string, unknown>;
  formData?: Record<string, unknown>;
  personaId?: string;
  source?: string;
  sourceComponent?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  createdAt: string;
}

/**
 * Lead capture input (for creating new leads)
 */
export interface LeadCaptureInput {
  websiteId: string;
  pageId?: string;
  email: string;
  name?: string;
  phone?: string;
  company?: string;
  data?: Record<string, unknown>;
  formData?: Record<string, unknown>;
  personaId?: string;
  source?: string;
  sourceComponent?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
}

// ============================================================================
// FORM CONFIGURATION TYPES
// ============================================================================

/**
 * Lead capture form field types
 */
export type FormFieldType =
  | 'text'
  | 'email'
  | 'phone'
  | 'number'
  | 'textarea'
  | 'select'
  | 'checkbox'
  | 'radio'
  | 'date'
  | 'hidden';

/**
 * Form field validation rules
 */
export interface FormFieldValidation {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  patternMessage?: string;
  min?: number;
  max?: number;
  custom?: (value: unknown) => string | null;
}

/**
 * Form field configuration
 */
export interface FormField {
  id: string;
  name: string;
  type: FormFieldType;
  label: string;
  placeholder?: string;
  helpText?: string;
  defaultValue?: string | number | boolean;
  validation?: FormFieldValidation;
  options?: FormFieldOption[];
  className?: string;
  width?: 'full' | 'half' | 'third';
  hidden?: boolean;
}

/**
 * Select/radio field option
 */
export interface FormFieldOption {
  value: string;
  label: string;
  disabled?: boolean;
}

/**
 * Lead capture form configuration
 */
export interface LeadCaptureFormConfig {
  id: string;
  name: string;
  websiteId: string;
  fields: FormField[];
  submitButton: {
    text: string;
    loadingText?: string;
    className?: string;
  };
  successMessage?: string;
  redirectUrl?: string;
  thankYouPageId?: string;
  styling?: FormStyling;
  tracking?: FormTrackingConfig;
  notifications?: NotificationConfig;
}

/**
 * Form styling configuration
 */
export interface FormStyling {
  layout?: 'vertical' | 'horizontal' | 'inline';
  showLabels?: boolean;
  floatingLabels?: boolean;
  fieldSpacing?: 'tight' | 'normal' | 'relaxed';
  borderRadius?: 'none' | 'sm' | 'md' | 'lg' | 'full';
  buttonVariant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  buttonSize?: 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * Form tracking configuration
 */
export interface FormTrackingConfig {
  trackSubmissions?: boolean;
  trackFieldInteractions?: boolean;
  trackAbandonments?: boolean;
  customEvents?: Record<string, string>;
}

// ============================================================================
// NOTIFICATION TYPES
// ============================================================================

/**
 * Notification channel types
 */
export type NotificationChannel = 'email' | 'slack' | 'webhook';

/**
 * Notification configuration
 */
export interface NotificationConfig {
  channels: NotificationChannel[];
  email?: EmailNotificationConfig;
  slack?: SlackNotificationConfig;
  webhook?: WebhookNotificationConfig;
  notifyOnSubmit?: boolean;
  notifyOnHighValue?: boolean;
  highValueThreshold?: HighValueCriteria;
}

/**
 * Email notification configuration
 */
export interface EmailNotificationConfig {
  recipients: string[];
  subject?: string;
  template?: 'default' | 'detailed' | 'minimal';
  includeFormData?: boolean;
  includePersonaInfo?: boolean;
}

/**
 * Slack notification configuration
 */
export interface SlackNotificationConfig {
  webhookUrl: string;
  channel?: string;
  mentionUsers?: string[];
  includeFormData?: boolean;
}

/**
 * Webhook notification configuration
 */
export interface WebhookNotificationConfig {
  url: string;
  method?: 'POST' | 'PUT';
  headers?: Record<string, string>;
  includeAllData?: boolean;
  retryOnFailure?: boolean;
  maxRetries?: number;
}

/**
 * High value lead criteria
 */
export interface HighValueCriteria {
  hasCompany?: boolean;
  hasPhone?: boolean;
  matchesPersonas?: string[];
  customConditions?: Record<string, unknown>;
}

// ============================================================================
// CONVERSION OPTIMIZATION TYPES
// ============================================================================

/**
 * Conversion goal types
 */
export type ConversionGoalType =
  | 'form_submission'
  | 'page_view'
  | 'click'
  | 'scroll_depth'
  | 'time_on_page'
  | 'custom_event';

/**
 * Conversion goal configuration
 */
export interface ConversionGoal {
  id: string;
  name: string;
  type: ConversionGoalType;
  websiteId: string;
  pageId?: string;
  config: ConversionGoalConfig;
  value?: number;
  isActive: boolean;
  createdAt: string;
}

/**
 * Conversion goal specific config
 */
export interface ConversionGoalConfig {
  // Form submission
  formId?: string;

  // Page view
  targetUrl?: string;
  urlMatchType?: 'exact' | 'contains' | 'regex';

  // Click
  selector?: string;
  elementText?: string;

  // Scroll depth
  scrollPercentage?: number;

  // Time on page
  timeSeconds?: number;

  // Custom event
  eventName?: string;
  eventProperties?: Record<string, unknown>;
}

/**
 * Conversion event
 */
export interface ConversionEvent {
  id: string;
  goalId: string;
  websiteId: string;
  sessionId: string;
  visitorId?: string;
  pageId?: string;
  personaId?: string;
  value?: number;
  metadata?: Record<string, unknown>;
  timestamp: string;
}

// ============================================================================
// THANK YOU PAGE TYPES
// ============================================================================

/**
 * Thank you page configuration
 */
export interface ThankYouPageConfig {
  id: string;
  name: string;
  websiteId: string;
  formId?: string;
  headline: string;
  subheadline?: string;
  message?: string;
  ctaButton?: ThankYouCTA;
  secondaryCTA?: ThankYouCTA;
  showSocialShare?: boolean;
  socialShareConfig?: SocialShareConfig;
  dynamicContent?: DynamicThankYouContent;
  styling?: ThankYouPageStyling;
}

/**
 * Thank you page CTA button
 */
export interface ThankYouCTA {
  text: string;
  url: string;
  target?: '_self' | '_blank';
  variant?: 'primary' | 'secondary' | 'outline';
}

/**
 * Social share configuration
 */
export interface SocialShareConfig {
  platforms: ('twitter' | 'linkedin' | 'facebook')[];
  shareText?: string;
  shareUrl?: string;
}

/**
 * Dynamic content based on lead data
 */
export interface DynamicThankYouContent {
  personalizedGreeting?: boolean;
  showRecommendations?: boolean;
  recommendations?: ThankYouRecommendation[];
  personaSpecificContent?: Record<string, PersonaThankYouContent>;
}

/**
 * Recommendation item
 */
export interface ThankYouRecommendation {
  title: string;
  description?: string;
  url: string;
  image?: string;
}

/**
 * Persona-specific thank you content
 */
export interface PersonaThankYouContent {
  headline?: string;
  message?: string;
  ctaButton?: ThankYouCTA;
  recommendations?: ThankYouRecommendation[];
}

/**
 * Thank you page styling
 */
export interface ThankYouPageStyling {
  layout?: 'centered' | 'split' | 'full-width';
  showConfetti?: boolean;
  animateEntrance?: boolean;
  backgroundColor?: string;
  accentColor?: string;
  className?: string;
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

/**
 * Lead capture response
 */
export interface LeadCaptureResponse {
  success: boolean;
  leadId?: string;
  redirectUrl?: string;
  thankYouPageUrl?: string;
  message?: string;
  error?: string;
}

/**
 * Lead list response
 */
export interface LeadListResponse {
  success: boolean;
  leads?: LeadCapture[];
  total?: number;
  page?: number;
  pageSize?: number;
  error?: string;
}

/**
 * Lead notification result
 */
export interface NotificationResult {
  channel: NotificationChannel;
  success: boolean;
  error?: string;
  messageId?: string;
}
