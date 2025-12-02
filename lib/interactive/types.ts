/**
 * Interactive Elements System Types
 * Phase 4.1: Interactive Elements System
 *
 * Type definitions for all interactive elements including quizzes,
 * calculators, surveys, comparisons, and other interactive components.
 */

import { z } from 'zod';
import { EmotionalTone, NarrativeRole } from '@/lib/layout/types';

// ============================================================================
// INTERACTIVE ELEMENT TYPES
// ============================================================================

/**
 * Types of interactive elements supported
 */
export type InteractiveElementType =
  | 'quiz'
  | 'survey'
  | 'calculator'
  | 'comparison'
  | 'timeline'
  | 'carousel'
  | 'tabs'
  | 'modal'
  | 'drawer'
  | 'configurator'
  | 'form';

/**
 * Interactive component variants matching the component registry
 */
export type InteractiveVariant =
  | 'interactive-quiz'
  | 'interactive-survey'
  | 'interactive-calculator'
  | 'interactive-comparison'
  | 'interactive-timeline'
  | 'interactive-carousel'
  | 'interactive-tabs'
  | 'interactive-modal'
  | 'interactive-drawer'
  | 'interactive-map'
  | 'interactive-configurator'
  | 'interactive-form';

// ============================================================================
// BASE CONFIGURATION
// ============================================================================

/**
 * Animation configuration for interactive elements
 */
export interface InteractiveAnimationConfig {
  entry?: 'fadeIn' | 'slideUp' | 'slideDown' | 'scaleIn' | 'none';
  transition?: 'smooth' | 'spring' | 'instant';
  stagger?: number;
  duration?: number;
}

/**
 * Styling configuration
 */
export interface InteractiveStyling {
  backgroundColor?: string;
  textColor?: string;
  accentColor?: string;
  borderRadius?: string;
  padding?: {
    top?: string;
    right?: string;
    bottom?: string;
    left?: string;
  };
  shadow?: 'none' | 'sm' | 'md' | 'lg';
}

/**
 * Tracking configuration for analytics
 */
export interface TrackingConfig {
  enabled: boolean;
  trackViews: boolean;
  trackStarts: boolean;
  trackCompletions: boolean;
  trackAbandonment: boolean;
  trackTimeSpent: boolean;
  customEvents?: string[];
}

/**
 * Follow-up action after interaction
 */
export interface FollowUpAction {
  type: 'redirect' | 'modal' | 'lead-capture' | 'download' | 'email' | 'none';
  destination?: string;
  message?: string;
  delay?: number;
}

/**
 * Lead capture configuration
 */
export interface LeadCaptureConfig {
  enabled: boolean;
  required: boolean;
  position: 'before' | 'after' | 'on-result';
  fields: LeadCaptureField[];
  privacyText?: string;
  submitButtonText?: string;
}

export interface LeadCaptureField {
  id: string;
  type: 'email' | 'name' | 'phone' | 'company' | 'role' | 'custom';
  label: string;
  placeholder?: string;
  required: boolean;
  validation?: string;
}

/**
 * Persona-specific variant of interactive element
 */
export interface PersonaInteractiveVariant {
  personaId: string;
  title?: string;
  description?: string;
  emotionalTone?: EmotionalTone;
  contentOverrides?: Record<string, unknown>;
}

// ============================================================================
// BASE INTERACTIVE ELEMENT CONFIG
// ============================================================================

/**
 * Base configuration for all interactive elements
 */
export interface InteractiveElementConfig {
  /** Unique element ID */
  id: string;

  /** Element type */
  type: InteractiveElementType;

  /** Component variant for rendering */
  componentId: InteractiveVariant;

  /** Website ID this element belongs to */
  websiteId: string;

  /** Optional page ID if element is page-specific */
  pageId?: string;

  /** Element title */
  title: string;

  /** Element description */
  description?: string;

  /** Narrative role in page story */
  narrativeRole?: NarrativeRole;

  /** Emotional tone */
  emotionalTone?: EmotionalTone;

  /** Styling configuration */
  styling?: InteractiveStyling;

  /** Animation configuration */
  animations?: InteractiveAnimationConfig;

  /** Lead capture configuration */
  leadCapture?: LeadCaptureConfig;

  /** Tracking configuration */
  tracking?: TrackingConfig;

  /** Follow-up action */
  followUp?: FollowUpAction;

  /** Persona-specific variants */
  personaVariants?: PersonaInteractiveVariant[];

  /** Element status */
  status: 'draft' | 'published' | 'archived';

  /** Creation timestamp */
  createdAt: string;

  /** Last update timestamp */
  updatedAt: string;
}

// ============================================================================
// QUIZ TYPES
// ============================================================================

/**
 * Quiz question types
 */
export type QuizQuestionType =
  | 'multiple-choice'
  | 'single-choice'
  | 'true-false'
  | 'text'
  | 'rating'
  | 'image-choice';

/**
 * Quiz option
 */
export interface QuizOption {
  id: string;
  text: string;
  imageUrl?: string;
  score?: number;
  isCorrect?: boolean;
  nextQuestionId?: string;
}

/**
 * Quiz question
 */
export interface QuizQuestion {
  id: string;
  type: QuizQuestionType;
  question: string;
  description?: string;
  imageUrl?: string;
  options?: QuizOption[];
  correctAnswer?: string | string[];
  hint?: string;
  explanation?: string;
  required: boolean;
  weight?: number;
  timeLimit?: number;
  order: number;
}

/**
 * Scoring configuration
 */
export interface ScoringConfig {
  type: 'points' | 'percentage' | 'weighted' | 'custom';
  maxScore?: number;
  passingScore?: number;
  showScoreAfterEach?: boolean;
  showFinalScore: boolean;
}

/**
 * Quiz result
 */
export interface QuizResult {
  id: string;
  minScore: number;
  maxScore: number;
  title: string;
  message: string;
  imageUrl?: string;
  recommendation?: string;
  personaMatch?: string;
  followUpAction?: FollowUpAction;
  ctaText?: string;
  ctaUrl?: string;
}

/**
 * Quiz-specific configuration
 */
export interface QuizConfig extends InteractiveElementConfig {
  type: 'quiz';
  questions: QuizQuestion[];
  results: QuizResult[];
  scoring: ScoringConfig;
  settings: {
    allowRetake: boolean;
    randomizeQuestions: boolean;
    randomizeOptions: boolean;
    showProgress: boolean;
    showCorrectAnswers: boolean;
    timeLimit?: number;
    questionsPerPage: number;
  };
}

// ============================================================================
// CALCULATOR TYPES
// ============================================================================

/**
 * Calculator input types
 */
export type CalculatorInputType =
  | 'number'
  | 'currency'
  | 'percentage'
  | 'slider'
  | 'select'
  | 'radio'
  | 'toggle';

/**
 * Calculator input field
 */
export interface CalculatorInput {
  id: string;
  name: string;
  label: string;
  type: CalculatorInputType;
  defaultValue: number | string;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  prefix?: string;
  suffix?: string;
  description?: string;
  helpText?: string;
  options?: { value: number | string; label: string }[];
  required: boolean;
  order: number;
}

/**
 * Calculator output field
 */
export interface CalculatorOutput {
  id: string;
  label: string;
  formula: string;
  format: 'number' | 'currency' | 'percentage' | 'custom';
  decimals?: number;
  prefix?: string;
  suffix?: string;
  description?: string;
  highlight?: boolean;
  color?: string;
  order: number;
}

/**
 * Calculation formula with dependencies
 */
export interface CalculationFormula {
  expression: string;
  variables: string[];
  dependencies?: string[];
}

/**
 * Calculator breakdown item
 */
export interface CalculatorBreakdownItem {
  label: string;
  formula: string;
  format: 'number' | 'currency' | 'percentage';
  description?: string;
}

/**
 * Calculator-specific configuration
 */
export interface CalculatorConfig extends InteractiveElementConfig {
  type: 'calculator';
  calculatorType: 'roi' | 'savings' | 'pricing' | 'sizing' | 'custom';
  inputs: CalculatorInput[];
  outputs: CalculatorOutput[];
  breakdown?: CalculatorBreakdownItem[];
  settings: {
    showBreakdown: boolean;
    realTimeCalculation: boolean;
    showInputDescriptions: boolean;
    layout: 'vertical' | 'horizontal' | 'two-column';
    submitButtonText?: string;
    resultTitle?: string;
  };
}

// ============================================================================
// SURVEY TYPES
// ============================================================================

/**
 * Survey question types
 */
export type SurveyQuestionType =
  | 'rating'
  | 'nps'
  | 'multiple-choice'
  | 'single-choice'
  | 'open-text'
  | 'ranking'
  | 'matrix'
  | 'date'
  | 'file-upload';

/**
 * Survey option
 */
export interface SurveyOption {
  id: string;
  text: string;
  value: string | number;
  imageUrl?: string;
}

/**
 * Survey question
 */
export interface SurveyQuestion {
  id: string;
  type: SurveyQuestionType;
  question: string;
  description?: string;
  options?: SurveyOption[];
  required: boolean;
  placeholder?: string;
  minLength?: number;
  maxLength?: number;
  minRating?: number;
  maxRating?: number;
  ratingLabels?: { low: string; high: string };
  conditionalLogic?: ConditionalLogic;
  order: number;
}

/**
 * Conditional logic for showing/hiding questions
 */
export interface ConditionalLogic {
  action: 'show' | 'hide' | 'skip-to';
  conditions: ConditionalCondition[];
  operator: 'and' | 'or';
  targetQuestionId?: string;
}

export interface ConditionalCondition {
  questionId: string;
  operator: 'equals' | 'not-equals' | 'contains' | 'greater-than' | 'less-than';
  value: string | number | string[];
}

/**
 * Survey-specific configuration
 */
export interface SurveyConfig extends InteractiveElementConfig {
  type: 'survey';
  surveyType: 'feedback' | 'nps' | 'satisfaction' | 'research' | 'custom';
  questions: SurveyQuestion[];
  settings: {
    allowAnonymous: boolean;
    randomizeQuestions: boolean;
    showProgress: boolean;
    questionsPerPage: number;
    allowSkip: boolean;
    thankYouMessage: string;
    thankYouTitle?: string;
  };
}

// ============================================================================
// COMPARISON TYPES
// ============================================================================

/**
 * Comparison item (product, plan, etc.)
 */
export interface ComparisonItem {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  price?: string;
  priceSubtext?: string;
  highlighted?: boolean;
  badge?: string;
  ctaText?: string;
  ctaUrl?: string;
  features: Record<string, ComparisonFeatureValue>;
  order: number;
}

/**
 * Comparison feature value
 */
export type ComparisonFeatureValue =
  | boolean
  | string
  | number
  | { value: string | number | boolean; tooltip?: string };

/**
 * Comparison criteria/feature
 */
export interface ComparisonCriteria {
  id: string;
  name: string;
  description?: string;
  category?: string;
  type: 'boolean' | 'text' | 'number' | 'rating';
  order: number;
}

/**
 * Comparison-specific configuration
 */
export interface ComparisonConfig extends InteractiveElementConfig {
  type: 'comparison';
  comparisonType: 'products' | 'plans' | 'features' | 'custom';
  items: ComparisonItem[];
  criteria: ComparisonCriteria[];
  settings: {
    highlightDifferences: boolean;
    allowFiltering: boolean;
    stickyHeader: boolean;
    showCategories: boolean;
    maxItemsVisible?: number;
    layout: 'table' | 'cards' | 'side-by-side';
  };
}

// ============================================================================
// CONFIGURATOR TYPES
// ============================================================================

/**
 * Configurator option
 */
export interface ConfiguratorOption {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  price?: number;
  priceModifier?: 'add' | 'multiply' | 'replace';
  dependencies?: string[];
  exclusions?: string[];
  default?: boolean;
}

/**
 * Configurator step/category
 */
export interface ConfiguratorStep {
  id: string;
  name: string;
  description?: string;
  type: 'single-select' | 'multi-select' | 'quantity' | 'color' | 'size';
  options: ConfiguratorOption[];
  required: boolean;
  order: number;
}

/**
 * Configurator-specific configuration
 */
export interface ConfiguratorConfig extends InteractiveElementConfig {
  type: 'configurator';
  steps: ConfiguratorStep[];
  settings: {
    showPreview: boolean;
    showPriceBreakdown: boolean;
    allowSaveConfiguration: boolean;
    previewPosition: 'top' | 'side' | 'bottom';
    summaryTitle?: string;
  };
  basePrice?: number;
  currency?: string;
}

// ============================================================================
// FORM TYPES
// ============================================================================

/**
 * Form field types
 */
export type FormFieldType =
  | 'text'
  | 'email'
  | 'phone'
  | 'number'
  | 'textarea'
  | 'select'
  | 'multi-select'
  | 'checkbox'
  | 'radio'
  | 'date'
  | 'time'
  | 'datetime'
  | 'file'
  | 'hidden';

/**
 * Form field validation
 */
export interface FormFieldValidation {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: string;
  patternMessage?: string;
  custom?: string;
}

/**
 * Form field
 */
export interface FormField {
  id: string;
  name: string;
  type: FormFieldType;
  label: string;
  placeholder?: string;
  description?: string;
  defaultValue?: string | number | boolean;
  options?: { value: string; label: string }[];
  validation?: FormFieldValidation;
  conditionalLogic?: ConditionalLogic;
  width?: 'full' | 'half' | 'third';
  order: number;
}

/**
 * Form section/group
 */
export interface FormSection {
  id: string;
  title?: string;
  description?: string;
  fields: FormField[];
  order: number;
}

/**
 * Form-specific configuration
 */
export interface FormConfig extends InteractiveElementConfig {
  type: 'form';
  formType: 'contact' | 'registration' | 'subscription' | 'feedback' | 'custom';
  sections: FormSection[];
  settings: {
    layout: 'single-column' | 'two-column' | 'inline';
    showLabels: boolean;
    submitButtonText: string;
    successMessage: string;
    successRedirect?: string;
    enableAutosave: boolean;
  };
  integration?: {
    type: 'webhook' | 'email' | 'crm' | 'custom';
    endpoint?: string;
    mapping?: Record<string, string>;
  };
}

// ============================================================================
// RESPONSE TYPES
// ============================================================================

/**
 * Base response for all interactive elements
 */
export interface InteractiveResponse {
  id: string;
  elementId: string;
  websiteId: string;
  visitorId: string;
  sessionId: string;
  pageUrl?: string;

  /** Response data */
  responses: Record<string, unknown>;

  /** Completion status */
  completed: boolean;
  completionPercentage: number;

  /** Timing */
  startedAt: string;
  completedAt?: string;
  timeSpentSeconds: number;

  /** Device info */
  deviceType: 'desktop' | 'tablet' | 'mobile';
  userAgent?: string;
  referrer?: string;

  /** UTM tracking */
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;

  /** Lead capture data */
  email?: string;
  name?: string;
  phone?: string;
  company?: string;
  customFields?: Record<string, string>;

  /** Persona linkage */
  detectedPersonaId?: string;
  personaConfidence?: number;
}

/**
 * Quiz-specific response
 */
export interface QuizResponse extends InteractiveResponse {
  answers: Record<string, string | string[]>;
  score: number;
  maxScore: number;
  percentage: number;
  resultId: string;
  correctAnswers: number;
  totalQuestions: number;
}

/**
 * Calculator-specific response
 */
export interface CalculatorResponse extends InteractiveResponse {
  inputValues: Record<string, number | string>;
  calculatedOutputs: Record<string, number>;
  breakdown?: Record<string, number>;
}

/**
 * Survey-specific response
 */
export interface SurveyResponse extends InteractiveResponse {
  answers: Record<string, unknown>;
  npsScore?: number;
  satisfactionScore?: number;
}

/**
 * Configurator-specific response
 */
export interface ConfiguratorResponse extends InteractiveResponse {
  selections: Record<string, string | string[]>;
  totalPrice: number;
  configurationSummary: string;
}

// ============================================================================
// ANALYTICS TYPES
// ============================================================================

/**
 * Interactive element analytics
 */
export interface InteractiveAnalytics {
  elementId: string;
  period: 'day' | 'week' | 'month' | 'all';

  /** Engagement metrics */
  totalViews: number;
  uniqueViews: number;
  totalStarts: number;
  totalCompletions: number;
  completionRate: number;
  abandonmentRate: number;
  avgTimeSpent: number;

  /** Quiz-specific */
  avgScore?: number;
  scoreDistribution?: Record<string, number>;

  /** Survey-specific */
  avgNps?: number;
  npsDistribution?: { promoters: number; passives: number; detractors: number };

  /** Lead metrics */
  leadsGenerated: number;
  conversionRate: number;

  /** Persona breakdown */
  byPersona?: {
    personaId: string;
    personaName: string;
    views: number;
    completions: number;
    avgScore?: number;
  }[];

  /** Device breakdown */
  byDevice?: {
    desktop: number;
    tablet: number;
    mobile: number;
  };

  /** Time series */
  dailyMetrics?: {
    date: string;
    views: number;
    completions: number;
    leads: number;
  }[];
}

// ============================================================================
// UNION TYPES
// ============================================================================

/**
 * Union type for all interactive element configs
 */
export type AnyInteractiveConfig =
  | QuizConfig
  | CalculatorConfig
  | SurveyConfig
  | ComparisonConfig
  | ConfiguratorConfig
  | FormConfig;

/**
 * Union type for all interactive responses
 */
export type AnyInteractiveResponse =
  | QuizResponse
  | CalculatorResponse
  | SurveyResponse
  | ConfiguratorResponse
  | InteractiveResponse;
