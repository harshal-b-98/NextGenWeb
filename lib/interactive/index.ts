/**
 * Interactive Elements System Module
 * Phase 4.1: Interactive Elements System
 *
 * Exports all interactive element functionality including types,
 * schemas, engines, and utilities.
 */

// ============================================================================
// TYPES
// ============================================================================

export type {
  // Element types
  InteractiveElementType,
  InteractiveVariant,
  InteractiveAnimationConfig,
  InteractiveStyling,
  TrackingConfig,
  FollowUpAction,
  LeadCaptureConfig,
  LeadCaptureField,
  PersonaInteractiveVariant,
  InteractiveElementConfig,

  // Quiz types
  QuizQuestionType,
  QuizOption,
  QuizQuestion,
  ScoringConfig,
  QuizResult,
  QuizConfig,

  // Calculator types
  CalculatorInputType,
  CalculatorInput,
  CalculatorOutput,
  CalculationFormula,
  CalculatorBreakdownItem,
  CalculatorConfig,

  // Survey types
  SurveyQuestionType,
  SurveyOption,
  SurveyQuestion,
  ConditionalLogic,
  ConditionalCondition,
  SurveyConfig,

  // Comparison types
  ComparisonItem,
  ComparisonFeatureValue,
  ComparisonCriteria,
  ComparisonConfig,

  // Configurator types
  ConfiguratorOption,
  ConfiguratorStep,
  ConfiguratorConfig,

  // Form types
  FormFieldType,
  FormFieldValidation,
  FormField,
  FormSection,
  FormConfig,

  // Response types
  InteractiveResponse,
  QuizResponse,
  CalculatorResponse,
  SurveyResponse,
  ConfiguratorResponse,

  // Analytics types
  InteractiveAnalytics,

  // Union types
  AnyInteractiveConfig,
  AnyInteractiveResponse,
} from './types';

// ============================================================================
// SCHEMAS
// ============================================================================

export {
  // Base schemas
  InteractiveElementTypeSchema,
  InteractiveVariantSchema,
  InteractiveAnimationConfigSchema,
  InteractiveStylingSchema,
  TrackingConfigSchema,
  FollowUpActionSchema,
  LeadCaptureFieldSchema,
  LeadCaptureConfigSchema,
  PersonaInteractiveVariantSchema,

  // Quiz schemas
  QuizOptionSchema,
  QuizQuestionSchema,
  ScoringConfigSchema,
  QuizResultSchema,
  QuizConfigSchema,

  // Calculator schemas
  CalculatorInputSchema,
  CalculatorOutputSchema,
  CalculatorBreakdownItemSchema,
  CalculatorConfigSchema,

  // Survey schemas
  ConditionalConditionSchema,
  ConditionalLogicSchema,
  SurveyOptionSchema,
  SurveyQuestionSchema,
  SurveyConfigSchema,

  // Comparison schemas
  ComparisonFeatureValueSchema,
  ComparisonItemSchema,
  ComparisonCriteriaSchema,
  ComparisonConfigSchema,

  // Form schemas
  FormFieldValidationSchema,
  FormFieldSchema,
  FormSectionSchema,
  FormConfigSchema,

  // Response schemas
  InteractiveResponseSchema,
  QuizResponseSchema,
  CalculatorResponseSchema,
  SurveyResponseSchema,

  // Submission schemas
  SubmitInteractiveResponseSchema,

  // Create/Update schemas
  CreateQuizSchema,
  CreateCalculatorSchema,
  CreateSurveySchema,
  CreateComparisonSchema,
  CreateFormSchema,
} from './schemas';

export type {
  QuizConfigType,
  CalculatorConfigType,
  SurveyConfigType,
  ComparisonConfigType,
  FormConfigType,
  InteractiveResponseType,
  SubmitInteractiveResponseType,
} from './schemas';

// ============================================================================
// ENGINES
// ============================================================================

// Base engine
export {
  BaseInteractiveEngine,
  mergeValidationResults,
  createValidationError,
  createValidationWarning,
} from './engines/base';

export type {
  EngineValidationResult,
  ValidationError,
  ValidationWarning,
  EngineProcessResult,
  TrackingEvent,
} from './engines/base';

// Quiz engine
export {
  QuizEngine,
  createQuizEngine,
} from './engines/quiz-engine';

export type {
  QuizProcessResult,
  AnswerBreakdown,
  QuizState,
} from './engines/quiz-engine';

// Calculator engine
export {
  CalculatorEngine,
  createCalculatorEngine,
  evaluateFormula,
} from './engines/calculator-engine';

export type {
  CalculatorProcessResult,
  FormattedOutput,
  CalculatorState,
} from './engines/calculator-engine';

// Survey engine
export {
  SurveyEngine,
  createSurveyEngine,
} from './engines/survey-engine';

export type {
  SurveyProcessResult,
  SurveySummary,
  NPSResult,
  QuestionResult,
  SurveyState,
} from './engines/survey-engine';

// ============================================================================
// FACTORY FUNCTIONS
// ============================================================================

import { QuizConfig, CalculatorConfig, SurveyConfig, AnyInteractiveConfig } from './types';
import { QuizEngine, createQuizEngine } from './engines/quiz-engine';
import { CalculatorEngine, createCalculatorEngine } from './engines/calculator-engine';
import { SurveyEngine, createSurveyEngine } from './engines/survey-engine';
import { BaseInteractiveEngine } from './engines/base';
import { InteractiveResponse } from './types';

/**
 * Create an engine for any interactive element type
 */
export function createInteractiveEngine(
  config: AnyInteractiveConfig
): BaseInteractiveEngine<AnyInteractiveConfig, InteractiveResponse, unknown> {
  switch (config.type) {
    case 'quiz':
      return createQuizEngine(config as QuizConfig) as unknown as BaseInteractiveEngine<
        AnyInteractiveConfig,
        InteractiveResponse,
        unknown
      >;
    case 'calculator':
      return createCalculatorEngine(config as CalculatorConfig) as unknown as BaseInteractiveEngine<
        AnyInteractiveConfig,
        InteractiveResponse,
        unknown
      >;
    case 'survey':
      return createSurveyEngine(config as SurveyConfig) as unknown as BaseInteractiveEngine<
        AnyInteractiveConfig,
        InteractiveResponse,
        unknown
      >;
    default:
      throw new Error(`Unsupported interactive element type: ${(config as AnyInteractiveConfig).type}`);
  }
}

/**
 * Validate any interactive element configuration
 */
export function validateInteractiveConfig(
  config: AnyInteractiveConfig
): { isValid: boolean; errors: string[]; warnings: string[] } {
  const engine = createInteractiveEngine(config);
  const result = engine.validateConfig();

  return {
    isValid: result.isValid,
    errors: result.errors.map((e) => `${e.field}: ${e.message}`),
    warnings: result.warnings.map((w) => `${w.field}: ${w.message}`),
  };
}

// ============================================================================
// STORAGE SERVICES
// ============================================================================

export {
  InteractiveElementService,
  createElementService,
} from './storage/element-service';

export type {
  ElementListOptions,
  ElementServiceResult,
} from './storage/element-service';

export {
  InteractiveResponseService,
  createResponseService,
} from './storage/response-service';

export type {
  ResponseListOptions,
  ResponseServiceResult,
  SubmitResponseInput,
} from './storage/response-service';

// ============================================================================
// AI-SUGGESTED INTERACTIVE ELEMENTS (Story 7.5)
// ============================================================================

export {
  suggestInteractiveElements,
  ENTITY_TO_INTERACTIVE_MAP,
} from './ai-suggestions';

export type {
  SuggestedInteractiveElement,
  InteractiveElementConfig as AISuggestedConfig,
  InteractiveSuggestionsResult,
} from './ai-suggestions';
