/**
 * Base Interactive Engine
 * Phase 4.1: Interactive Elements System
 *
 * Abstract base class for all interactive element engines.
 * Provides common functionality for validation, tracking, and result handling.
 */

import {
  InteractiveElementConfig,
  InteractiveResponse,
  TrackingConfig,
  FollowUpAction,
  LeadCaptureConfig,
} from '../types';

// ============================================================================
// ENGINE RESULT TYPES
// ============================================================================

export interface EngineValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface ValidationWarning {
  field: string;
  message: string;
}

export interface EngineProcessResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  metadata?: Record<string, unknown>;
}

export interface TrackingEvent {
  eventType: 'view' | 'start' | 'progress' | 'complete' | 'abandon' | 'custom';
  elementId: string;
  visitorId: string;
  sessionId: string;
  timestamp: string;
  data?: Record<string, unknown>;
}

// ============================================================================
// BASE ENGINE CLASS
// ============================================================================

/**
 * Abstract base class for interactive element engines
 */
export abstract class BaseInteractiveEngine<
  TConfig extends InteractiveElementConfig,
  TResponse extends InteractiveResponse,
  TResult = unknown,
  TState extends Record<string, unknown> = Record<string, unknown>,
> {
  protected config: TConfig;

  constructor(config: TConfig) {
    this.config = config;
  }

  // ============================================================================
  // ABSTRACT METHODS (must be implemented by subclasses)
  // ============================================================================

  /**
   * Validate the element configuration
   */
  abstract validateConfig(): EngineValidationResult;

  /**
   * Process a response and calculate results
   */
  abstract processResponse(response: Partial<TResponse>): EngineProcessResult<TResult>;

  /**
   * Get default/initial state for the element
   */
  abstract getInitialState(): TState;

  // ============================================================================
  // COMMON VALIDATION
  // ============================================================================

  /**
   * Validate base configuration common to all elements
   */
  protected validateBaseConfig(): EngineValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Validate required fields
    if (!this.config.id) {
      errors.push({
        field: 'id',
        message: 'Element ID is required',
        code: 'MISSING_ID',
      });
    }

    if (!this.config.title) {
      errors.push({
        field: 'title',
        message: 'Element title is required',
        code: 'MISSING_TITLE',
      });
    }

    if (!this.config.websiteId) {
      errors.push({
        field: 'websiteId',
        message: 'Website ID is required',
        code: 'MISSING_WEBSITE_ID',
      });
    }

    // Validate lead capture configuration
    if (this.config.leadCapture?.enabled) {
      const lcResult = this.validateLeadCapture(this.config.leadCapture);
      errors.push(...lcResult.errors);
      warnings.push(...lcResult.warnings);
    }

    // Validate follow-up action
    if (this.config.followUp) {
      const faResult = this.validateFollowUpAction(this.config.followUp);
      errors.push(...faResult.errors);
      warnings.push(...faResult.warnings);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validate lead capture configuration
   */
  protected validateLeadCapture(config: LeadCaptureConfig): EngineValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    if (config.enabled && (!config.fields || config.fields.length === 0)) {
      errors.push({
        field: 'leadCapture.fields',
        message: 'Lead capture is enabled but no fields are defined',
        code: 'LEAD_CAPTURE_NO_FIELDS',
      });
    }

    // Check for at least one contact field
    const hasContactField = config.fields?.some((f) =>
      ['email', 'phone'].includes(f.type)
    );
    if (config.enabled && !hasContactField) {
      warnings.push({
        field: 'leadCapture.fields',
        message: 'Lead capture has no email or phone field',
      });
    }

    return { isValid: errors.length === 0, errors, warnings };
  }

  /**
   * Validate follow-up action configuration
   */
  protected validateFollowUpAction(action: FollowUpAction): EngineValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    if (action.type === 'redirect' && !action.destination) {
      errors.push({
        field: 'followUp.destination',
        message: 'Redirect URL is required for redirect action',
        code: 'MISSING_REDIRECT_URL',
      });
    }

    if (action.type === 'download' && !action.destination) {
      errors.push({
        field: 'followUp.destination',
        message: 'Download URL is required for download action',
        code: 'MISSING_DOWNLOAD_URL',
      });
    }

    return { isValid: errors.length === 0, errors, warnings };
  }

  // ============================================================================
  // TRACKING
  // ============================================================================

  /**
   * Check if tracking is enabled for an event type
   */
  protected isTrackingEnabled(eventType: TrackingEvent['eventType']): boolean {
    const tracking = this.config.tracking;
    if (!tracking?.enabled) return false;

    switch (eventType) {
      case 'view':
        return tracking.trackViews;
      case 'start':
        return tracking.trackStarts;
      case 'complete':
        return tracking.trackCompletions;
      case 'abandon':
        return tracking.trackAbandonment;
      case 'custom':
        return true;
      default:
        return true;
    }
  }

  /**
   * Create a tracking event
   */
  protected createTrackingEvent(
    eventType: TrackingEvent['eventType'],
    visitorId: string,
    sessionId: string,
    data?: Record<string, unknown>
  ): TrackingEvent | null {
    if (!this.isTrackingEnabled(eventType)) return null;

    return {
      eventType,
      elementId: this.config.id,
      visitorId,
      sessionId,
      timestamp: new Date().toISOString(),
      data,
    };
  }

  // ============================================================================
  // RESPONSE HANDLING
  // ============================================================================

  /**
   * Calculate completion percentage based on responses
   */
  protected calculateCompletionPercentage(
    responses: Record<string, unknown>,
    totalFields: number
  ): number {
    if (totalFields === 0) return 0;
    const completedFields = Object.keys(responses).filter(
      (key) => responses[key] !== undefined && responses[key] !== null && responses[key] !== ''
    ).length;
    return Math.round((completedFields / totalFields) * 100);
  }

  /**
   * Determine device type from user agent
   */
  protected getDeviceType(userAgent?: string): 'desktop' | 'tablet' | 'mobile' {
    if (!userAgent) return 'desktop';

    const ua = userAgent.toLowerCase();
    if (/mobile|android|iphone|ipod|blackberry|windows phone/i.test(ua)) {
      return 'mobile';
    }
    if (/ipad|tablet|playbook|silk/i.test(ua)) {
      return 'tablet';
    }
    return 'desktop';
  }

  // ============================================================================
  // LEAD CAPTURE
  // ============================================================================

  /**
   * Check if lead capture should be shown at a given position
   */
  protected shouldShowLeadCapture(
    position: 'before' | 'after' | 'on-result',
    completed: boolean = false,
    hasResult: boolean = false
  ): boolean {
    const lc = this.config.leadCapture;
    if (!lc?.enabled) return false;

    switch (lc.position) {
      case 'before':
        return position === 'before';
      case 'after':
        return position === 'after' && completed;
      case 'on-result':
        return position === 'on-result' && hasResult;
      default:
        return false;
    }
  }

  /**
   * Validate lead capture data
   */
  protected validateLeadCaptureData(
    data: Record<string, string>
  ): EngineValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    const lc = this.config.leadCapture;
    if (!lc?.enabled) {
      return { isValid: true, errors, warnings };
    }

    for (const field of lc.fields) {
      const value = data[field.id];

      if (field.required && (!value || value.trim() === '')) {
        errors.push({
          field: field.id,
          message: `${field.label} is required`,
          code: 'REQUIRED_FIELD',
        });
        continue;
      }

      if (value && field.type === 'email') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          errors.push({
            field: field.id,
            message: 'Please enter a valid email address',
            code: 'INVALID_EMAIL',
          });
        }
      }

      if (value && field.type === 'phone') {
        const phoneRegex = /^[\d\s\-+()]{7,20}$/;
        if (!phoneRegex.test(value)) {
          errors.push({
            field: field.id,
            message: 'Please enter a valid phone number',
            code: 'INVALID_PHONE',
          });
        }
      }

      if (value && field.validation) {
        try {
          const regex = new RegExp(field.validation);
          if (!regex.test(value)) {
            errors.push({
              field: field.id,
              message: `${field.label} format is invalid`,
              code: 'INVALID_FORMAT',
            });
          }
        } catch {
          // Invalid regex, skip validation
        }
      }
    }

    return { isValid: errors.length === 0, errors, warnings };
  }

  // ============================================================================
  // FOLLOW-UP ACTIONS
  // ============================================================================

  /**
   * Get follow-up action to execute
   */
  protected getFollowUpAction(): FollowUpAction | null {
    return this.config.followUp || null;
  }

  // ============================================================================
  // PERSONA HANDLING
  // ============================================================================

  /**
   * Get configuration for a specific persona
   */
  protected getPersonaConfig(personaId?: string): TConfig {
    if (!personaId || !this.config.personaVariants) {
      return this.config;
    }

    const variant = this.config.personaVariants.find((v) => v.personaId === personaId);
    if (!variant) {
      return this.config;
    }

    return {
      ...this.config,
      title: variant.title || this.config.title,
      description: variant.description || this.config.description,
      emotionalTone: variant.emotionalTone || this.config.emotionalTone,
      ...(variant.contentOverrides as Partial<TConfig>),
    };
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  /**
   * Get element ID
   */
  getId(): string {
    return this.config.id;
  }

  /**
   * Get element type
   */
  getType(): string {
    return this.config.type;
  }

  /**
   * Get element title
   */
  getTitle(): string {
    return this.config.title;
  }

  /**
   * Check if element is published
   */
  isPublished(): boolean {
    return this.config.status === 'published';
  }

  /**
   * Get full configuration
   */
  getConfig(): TConfig {
    return this.config;
  }

  /**
   * Update configuration
   */
  updateConfig(updates: Partial<TConfig>): void {
    this.config = {
      ...this.config,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Merge validation results
 */
export function mergeValidationResults(
  ...results: EngineValidationResult[]
): EngineValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  for (const result of results) {
    errors.push(...result.errors);
    warnings.push(...result.warnings);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Create a validation error
 */
export function createValidationError(
  field: string,
  message: string,
  code: string
): ValidationError {
  return { field, message, code };
}

/**
 * Create a validation warning
 */
export function createValidationWarning(
  field: string,
  message: string
): ValidationWarning {
  return { field, message };
}
