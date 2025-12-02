/**
 * Interactive Elements Validation Schemas
 * Phase 4.1: Interactive Elements System
 *
 * Zod schemas for validating interactive element configurations and responses.
 */

import { z } from 'zod';

// ============================================================================
// BASE SCHEMAS
// ============================================================================

export const InteractiveElementTypeSchema = z.enum([
  'quiz',
  'survey',
  'calculator',
  'comparison',
  'timeline',
  'carousel',
  'tabs',
  'modal',
  'drawer',
  'configurator',
  'form',
]);

export const InteractiveVariantSchema = z.enum([
  'interactive-quiz',
  'interactive-survey',
  'interactive-calculator',
  'interactive-comparison',
  'interactive-timeline',
  'interactive-carousel',
  'interactive-tabs',
  'interactive-modal',
  'interactive-drawer',
  'interactive-map',
  'interactive-configurator',
  'interactive-form',
]);

export const InteractiveAnimationConfigSchema = z.object({
  entry: z.enum(['fadeIn', 'slideUp', 'slideDown', 'scaleIn', 'none']).optional(),
  transition: z.enum(['smooth', 'spring', 'instant']).optional(),
  stagger: z.number().min(0).optional(),
  duration: z.number().min(0).optional(),
});

export const InteractiveStylingSchema = z.object({
  backgroundColor: z.string().optional(),
  textColor: z.string().optional(),
  accentColor: z.string().optional(),
  borderRadius: z.string().optional(),
  padding: z
    .object({
      top: z.string().optional(),
      right: z.string().optional(),
      bottom: z.string().optional(),
      left: z.string().optional(),
    })
    .optional(),
  shadow: z.enum(['none', 'sm', 'md', 'lg']).optional(),
});

export const TrackingConfigSchema = z.object({
  enabled: z.boolean(),
  trackViews: z.boolean(),
  trackStarts: z.boolean(),
  trackCompletions: z.boolean(),
  trackAbandonment: z.boolean(),
  trackTimeSpent: z.boolean(),
  customEvents: z.array(z.string()).optional(),
});

export const FollowUpActionSchema = z.object({
  type: z.enum(['redirect', 'modal', 'lead-capture', 'download', 'email', 'none']),
  destination: z.string().optional(),
  message: z.string().optional(),
  delay: z.number().min(0).optional(),
});

export const LeadCaptureFieldSchema = z.object({
  id: z.string(),
  type: z.enum(['email', 'name', 'phone', 'company', 'role', 'custom']),
  label: z.string().min(1),
  placeholder: z.string().optional(),
  required: z.boolean(),
  validation: z.string().optional(),
});

export const LeadCaptureConfigSchema = z.object({
  enabled: z.boolean(),
  required: z.boolean(),
  position: z.enum(['before', 'after', 'on-result']),
  fields: z.array(LeadCaptureFieldSchema),
  privacyText: z.string().optional(),
  submitButtonText: z.string().optional(),
});

export const PersonaInteractiveVariantSchema = z.object({
  personaId: z.string().uuid(),
  title: z.string().optional(),
  description: z.string().optional(),
  emotionalTone: z
    .enum(['curiosity', 'empathy', 'hope', 'confidence', 'excitement', 'trust', 'urgency'])
    .optional(),
  contentOverrides: z.record(z.string(), z.unknown()).optional(),
});

// ============================================================================
// QUIZ SCHEMAS
// ============================================================================

export const QuizOptionSchema = z.object({
  id: z.string(),
  text: z.string().min(1),
  imageUrl: z.string().url().optional(),
  score: z.number().optional(),
  isCorrect: z.boolean().optional(),
  nextQuestionId: z.string().optional(),
});

export const QuizQuestionSchema = z.object({
  id: z.string(),
  type: z.enum([
    'multiple-choice',
    'single-choice',
    'true-false',
    'text',
    'rating',
    'image-choice',
  ]),
  question: z.string().min(1),
  description: z.string().optional(),
  imageUrl: z.string().url().optional(),
  options: z.array(QuizOptionSchema).optional(),
  correctAnswer: z.union([z.string(), z.array(z.string())]).optional(),
  hint: z.string().optional(),
  explanation: z.string().optional(),
  required: z.boolean(),
  weight: z.number().min(0).optional(),
  timeLimit: z.number().min(0).optional(),
  order: z.number().min(0),
});

export const ScoringConfigSchema = z.object({
  type: z.enum(['points', 'percentage', 'weighted', 'custom']),
  maxScore: z.number().min(0).optional(),
  passingScore: z.number().min(0).optional(),
  showScoreAfterEach: z.boolean().optional(),
  showFinalScore: z.boolean(),
});

export const QuizResultSchema = z.object({
  id: z.string(),
  minScore: z.number(),
  maxScore: z.number(),
  title: z.string().min(1),
  message: z.string().min(1),
  imageUrl: z.string().url().optional(),
  recommendation: z.string().optional(),
  personaMatch: z.string().uuid().optional(),
  followUpAction: FollowUpActionSchema.optional(),
  ctaText: z.string().optional(),
  ctaUrl: z.string().url().optional(),
});

export const QuizConfigSchema = z.object({
  id: z.string().uuid(),
  type: z.literal('quiz'),
  componentId: z.literal('interactive-quiz'),
  websiteId: z.string().uuid(),
  pageId: z.string().uuid().optional(),
  title: z.string().min(1),
  description: z.string().optional(),
  narrativeRole: z.enum(['hook', 'problem', 'solution', 'proof', 'action']).optional(),
  emotionalTone: z
    .enum(['curiosity', 'empathy', 'hope', 'confidence', 'excitement', 'trust', 'urgency'])
    .optional(),
  styling: InteractiveStylingSchema.optional(),
  animations: InteractiveAnimationConfigSchema.optional(),
  leadCapture: LeadCaptureConfigSchema.optional(),
  tracking: TrackingConfigSchema.optional(),
  followUp: FollowUpActionSchema.optional(),
  personaVariants: z.array(PersonaInteractiveVariantSchema).optional(),
  status: z.enum(['draft', 'published', 'archived']),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  questions: z.array(QuizQuestionSchema).min(1),
  results: z.array(QuizResultSchema).min(1),
  scoring: ScoringConfigSchema,
  settings: z.object({
    allowRetake: z.boolean(),
    randomizeQuestions: z.boolean(),
    randomizeOptions: z.boolean(),
    showProgress: z.boolean(),
    showCorrectAnswers: z.boolean(),
    timeLimit: z.number().min(0).optional(),
    questionsPerPage: z.number().min(1),
  }),
});

// ============================================================================
// CALCULATOR SCHEMAS
// ============================================================================

export const CalculatorInputSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  label: z.string().min(1),
  type: z.enum(['number', 'currency', 'percentage', 'slider', 'select', 'radio', 'toggle']),
  defaultValue: z.union([z.number(), z.string()]),
  min: z.number().optional(),
  max: z.number().optional(),
  step: z.number().min(0).optional(),
  unit: z.string().optional(),
  prefix: z.string().optional(),
  suffix: z.string().optional(),
  description: z.string().optional(),
  helpText: z.string().optional(),
  options: z
    .array(
      z.object({
        value: z.union([z.number(), z.string()]),
        label: z.string(),
      })
    )
    .optional(),
  required: z.boolean(),
  order: z.number().min(0),
});

export const CalculatorOutputSchema = z.object({
  id: z.string(),
  label: z.string().min(1),
  formula: z.string().min(1),
  format: z.enum(['number', 'currency', 'percentage', 'custom']),
  decimals: z.number().min(0).max(10).optional(),
  prefix: z.string().optional(),
  suffix: z.string().optional(),
  description: z.string().optional(),
  highlight: z.boolean().optional(),
  color: z.string().optional(),
  order: z.number().min(0),
});

export const CalculatorBreakdownItemSchema = z.object({
  label: z.string().min(1),
  formula: z.string().min(1),
  format: z.enum(['number', 'currency', 'percentage']),
  description: z.string().optional(),
});

export const CalculatorConfigSchema = z.object({
  id: z.string().uuid(),
  type: z.literal('calculator'),
  componentId: z.literal('interactive-calculator'),
  websiteId: z.string().uuid(),
  pageId: z.string().uuid().optional(),
  title: z.string().min(1),
  description: z.string().optional(),
  narrativeRole: z.enum(['hook', 'problem', 'solution', 'proof', 'action']).optional(),
  emotionalTone: z
    .enum(['curiosity', 'empathy', 'hope', 'confidence', 'excitement', 'trust', 'urgency'])
    .optional(),
  styling: InteractiveStylingSchema.optional(),
  animations: InteractiveAnimationConfigSchema.optional(),
  leadCapture: LeadCaptureConfigSchema.optional(),
  tracking: TrackingConfigSchema.optional(),
  followUp: FollowUpActionSchema.optional(),
  personaVariants: z.array(PersonaInteractiveVariantSchema).optional(),
  status: z.enum(['draft', 'published', 'archived']),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  calculatorType: z.enum(['roi', 'savings', 'pricing', 'sizing', 'custom']),
  inputs: z.array(CalculatorInputSchema).min(1),
  outputs: z.array(CalculatorOutputSchema).min(1),
  breakdown: z.array(CalculatorBreakdownItemSchema).optional(),
  settings: z.object({
    showBreakdown: z.boolean(),
    realTimeCalculation: z.boolean(),
    showInputDescriptions: z.boolean(),
    layout: z.enum(['vertical', 'horizontal', 'two-column']),
    submitButtonText: z.string().optional(),
    resultTitle: z.string().optional(),
  }),
});

// ============================================================================
// SURVEY SCHEMAS
// ============================================================================

export const ConditionalConditionSchema = z.object({
  questionId: z.string(),
  operator: z.enum(['equals', 'not-equals', 'contains', 'greater-than', 'less-than']),
  value: z.union([z.string(), z.number(), z.array(z.string())]),
});

export const ConditionalLogicSchema = z.object({
  action: z.enum(['show', 'hide', 'skip-to']),
  conditions: z.array(ConditionalConditionSchema),
  operator: z.enum(['and', 'or']),
  targetQuestionId: z.string().optional(),
});

export const SurveyOptionSchema = z.object({
  id: z.string(),
  text: z.string().min(1),
  value: z.union([z.string(), z.number()]),
  imageUrl: z.string().url().optional(),
});

export const SurveyQuestionSchema = z.object({
  id: z.string(),
  type: z.enum([
    'rating',
    'nps',
    'multiple-choice',
    'single-choice',
    'open-text',
    'ranking',
    'matrix',
    'date',
    'file-upload',
  ]),
  question: z.string().min(1),
  description: z.string().optional(),
  options: z.array(SurveyOptionSchema).optional(),
  required: z.boolean(),
  placeholder: z.string().optional(),
  minLength: z.number().min(0).optional(),
  maxLength: z.number().min(0).optional(),
  minRating: z.number().min(0).optional(),
  maxRating: z.number().min(1).optional(),
  ratingLabels: z
    .object({
      low: z.string(),
      high: z.string(),
    })
    .optional(),
  conditionalLogic: ConditionalLogicSchema.optional(),
  order: z.number().min(0),
});

export const SurveyConfigSchema = z.object({
  id: z.string().uuid(),
  type: z.literal('survey'),
  componentId: z.literal('interactive-survey'),
  websiteId: z.string().uuid(),
  pageId: z.string().uuid().optional(),
  title: z.string().min(1),
  description: z.string().optional(),
  narrativeRole: z.enum(['hook', 'problem', 'solution', 'proof', 'action']).optional(),
  emotionalTone: z
    .enum(['curiosity', 'empathy', 'hope', 'confidence', 'excitement', 'trust', 'urgency'])
    .optional(),
  styling: InteractiveStylingSchema.optional(),
  animations: InteractiveAnimationConfigSchema.optional(),
  leadCapture: LeadCaptureConfigSchema.optional(),
  tracking: TrackingConfigSchema.optional(),
  followUp: FollowUpActionSchema.optional(),
  personaVariants: z.array(PersonaInteractiveVariantSchema).optional(),
  status: z.enum(['draft', 'published', 'archived']),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  surveyType: z.enum(['feedback', 'nps', 'satisfaction', 'research', 'custom']),
  questions: z.array(SurveyQuestionSchema).min(1),
  settings: z.object({
    allowAnonymous: z.boolean(),
    randomizeQuestions: z.boolean(),
    showProgress: z.boolean(),
    questionsPerPage: z.number().min(1),
    allowSkip: z.boolean(),
    thankYouMessage: z.string().min(1),
    thankYouTitle: z.string().optional(),
  }),
});

// ============================================================================
// COMPARISON SCHEMAS
// ============================================================================

export const ComparisonFeatureValueSchema = z.union([
  z.boolean(),
  z.string(),
  z.number(),
  z.object({
    value: z.union([z.string(), z.number(), z.boolean()]),
    tooltip: z.string().optional(),
  }),
]);

export const ComparisonItemSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  description: z.string().optional(),
  imageUrl: z.string().url().optional(),
  price: z.string().optional(),
  priceSubtext: z.string().optional(),
  highlighted: z.boolean().optional(),
  badge: z.string().optional(),
  ctaText: z.string().optional(),
  ctaUrl: z.string().url().optional(),
  features: z.record(z.string(), ComparisonFeatureValueSchema),
  order: z.number().min(0),
});

export const ComparisonCriteriaSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  description: z.string().optional(),
  category: z.string().optional(),
  type: z.enum(['boolean', 'text', 'number', 'rating']),
  order: z.number().min(0),
});

export const ComparisonConfigSchema = z.object({
  id: z.string().uuid(),
  type: z.literal('comparison'),
  componentId: z.literal('interactive-comparison'),
  websiteId: z.string().uuid(),
  pageId: z.string().uuid().optional(),
  title: z.string().min(1),
  description: z.string().optional(),
  narrativeRole: z.enum(['hook', 'problem', 'solution', 'proof', 'action']).optional(),
  emotionalTone: z
    .enum(['curiosity', 'empathy', 'hope', 'confidence', 'excitement', 'trust', 'urgency'])
    .optional(),
  styling: InteractiveStylingSchema.optional(),
  animations: InteractiveAnimationConfigSchema.optional(),
  leadCapture: LeadCaptureConfigSchema.optional(),
  tracking: TrackingConfigSchema.optional(),
  followUp: FollowUpActionSchema.optional(),
  personaVariants: z.array(PersonaInteractiveVariantSchema).optional(),
  status: z.enum(['draft', 'published', 'archived']),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  comparisonType: z.enum(['products', 'plans', 'features', 'custom']),
  items: z.array(ComparisonItemSchema).min(2),
  criteria: z.array(ComparisonCriteriaSchema).min(1),
  settings: z.object({
    highlightDifferences: z.boolean(),
    allowFiltering: z.boolean(),
    stickyHeader: z.boolean(),
    showCategories: z.boolean(),
    maxItemsVisible: z.number().min(2).optional(),
    layout: z.enum(['table', 'cards', 'side-by-side']),
  }),
});

// ============================================================================
// FORM SCHEMAS
// ============================================================================

export const FormFieldValidationSchema = z.object({
  required: z.boolean().optional(),
  minLength: z.number().min(0).optional(),
  maxLength: z.number().min(0).optional(),
  min: z.number().optional(),
  max: z.number().optional(),
  pattern: z.string().optional(),
  patternMessage: z.string().optional(),
  custom: z.string().optional(),
});

export const FormFieldSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  type: z.enum([
    'text',
    'email',
    'phone',
    'number',
    'textarea',
    'select',
    'multi-select',
    'checkbox',
    'radio',
    'date',
    'time',
    'datetime',
    'file',
    'hidden',
  ]),
  label: z.string().min(1),
  placeholder: z.string().optional(),
  description: z.string().optional(),
  defaultValue: z.union([z.string(), z.number(), z.boolean()]).optional(),
  options: z
    .array(
      z.object({
        value: z.string(),
        label: z.string(),
      })
    )
    .optional(),
  validation: FormFieldValidationSchema.optional(),
  conditionalLogic: ConditionalLogicSchema.optional(),
  width: z.enum(['full', 'half', 'third']).optional(),
  order: z.number().min(0),
});

export const FormSectionSchema = z.object({
  id: z.string(),
  title: z.string().optional(),
  description: z.string().optional(),
  fields: z.array(FormFieldSchema).min(1),
  order: z.number().min(0),
});

export const FormConfigSchema = z.object({
  id: z.string().uuid(),
  type: z.literal('form'),
  componentId: z.literal('interactive-form'),
  websiteId: z.string().uuid(),
  pageId: z.string().uuid().optional(),
  title: z.string().min(1),
  description: z.string().optional(),
  narrativeRole: z.enum(['hook', 'problem', 'solution', 'proof', 'action']).optional(),
  emotionalTone: z
    .enum(['curiosity', 'empathy', 'hope', 'confidence', 'excitement', 'trust', 'urgency'])
    .optional(),
  styling: InteractiveStylingSchema.optional(),
  animations: InteractiveAnimationConfigSchema.optional(),
  leadCapture: LeadCaptureConfigSchema.optional(),
  tracking: TrackingConfigSchema.optional(),
  followUp: FollowUpActionSchema.optional(),
  personaVariants: z.array(PersonaInteractiveVariantSchema).optional(),
  status: z.enum(['draft', 'published', 'archived']),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  formType: z.enum(['contact', 'registration', 'subscription', 'feedback', 'custom']),
  sections: z.array(FormSectionSchema).min(1),
  settings: z.object({
    layout: z.enum(['single-column', 'two-column', 'inline']),
    showLabels: z.boolean(),
    submitButtonText: z.string().min(1),
    successMessage: z.string().min(1),
    successRedirect: z.string().url().optional(),
    enableAutosave: z.boolean(),
  }),
  integration: z
    .object({
      type: z.enum(['webhook', 'email', 'crm', 'custom']),
      endpoint: z.string().url().optional(),
      mapping: z.record(z.string(), z.string()).optional(),
    })
    .optional(),
});

// ============================================================================
// RESPONSE SCHEMAS
// ============================================================================

export const InteractiveResponseSchema = z.object({
  id: z.string().uuid(),
  elementId: z.string().uuid(),
  websiteId: z.string().uuid(),
  visitorId: z.string(),
  sessionId: z.string(),
  pageUrl: z.string().url().optional(),
  responses: z.record(z.string(), z.unknown()),
  completed: z.boolean(),
  completionPercentage: z.number().min(0).max(100),
  startedAt: z.string().datetime(),
  completedAt: z.string().datetime().optional(),
  timeSpentSeconds: z.number().min(0),
  deviceType: z.enum(['desktop', 'tablet', 'mobile']),
  userAgent: z.string().optional(),
  referrer: z.string().optional(),
  utmSource: z.string().optional(),
  utmMedium: z.string().optional(),
  utmCampaign: z.string().optional(),
  email: z.string().email().optional(),
  name: z.string().optional(),
  phone: z.string().optional(),
  company: z.string().optional(),
  customFields: z.record(z.string(), z.string()).optional(),
  detectedPersonaId: z.string().uuid().optional(),
  personaConfidence: z.number().min(0).max(1).optional(),
});

export const QuizResponseSchema = InteractiveResponseSchema.extend({
  answers: z.record(z.string(), z.union([z.string(), z.array(z.string())])),
  score: z.number(),
  maxScore: z.number(),
  percentage: z.number().min(0).max(100),
  resultId: z.string(),
  correctAnswers: z.number().min(0),
  totalQuestions: z.number().min(1),
});

export const CalculatorResponseSchema = InteractiveResponseSchema.extend({
  inputValues: z.record(z.string(), z.union([z.number(), z.string()])),
  calculatedOutputs: z.record(z.string(), z.number()),
  breakdown: z.record(z.string(), z.number()).optional(),
});

export const SurveyResponseSchema = InteractiveResponseSchema.extend({
  answers: z.record(z.string(), z.unknown()),
  npsScore: z.number().min(0).max(10).optional(),
  satisfactionScore: z.number().min(1).max(5).optional(),
});

// ============================================================================
// SUBMISSION SCHEMAS
// ============================================================================

export const SubmitInteractiveResponseSchema = z.object({
  elementId: z.string().uuid(),
  visitorId: z.string().min(1),
  sessionId: z.string().min(1),
  responses: z.record(z.string(), z.unknown()),
  completed: z.boolean().optional(),
  timeSpentSeconds: z.number().min(0),
  deviceType: z.enum(['desktop', 'tablet', 'mobile']).optional(),
  pageUrl: z.string().url().optional(),
  email: z.string().email().optional(),
  name: z.string().optional(),
  phone: z.string().optional(),
  company: z.string().optional(),
  customFields: z.record(z.string(), z.string()).optional(),
});

// ============================================================================
// CREATE/UPDATE SCHEMAS
// ============================================================================

export const CreateQuizSchema = QuizConfigSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const CreateCalculatorSchema = CalculatorConfigSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const CreateSurveySchema = SurveyConfigSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const CreateComparisonSchema = ComparisonConfigSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const CreateFormSchema = FormConfigSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type QuizConfigType = z.infer<typeof QuizConfigSchema>;
export type CalculatorConfigType = z.infer<typeof CalculatorConfigSchema>;
export type SurveyConfigType = z.infer<typeof SurveyConfigSchema>;
export type ComparisonConfigType = z.infer<typeof ComparisonConfigSchema>;
export type FormConfigType = z.infer<typeof FormConfigSchema>;
export type InteractiveResponseType = z.infer<typeof InteractiveResponseSchema>;
export type SubmitInteractiveResponseType = z.infer<typeof SubmitInteractiveResponseSchema>;
