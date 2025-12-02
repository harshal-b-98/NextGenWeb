/**
 * Survey Engine
 * Phase 4.1: Interactive Elements System
 *
 * Engine for processing surveys with conditional logic and NPS scoring.
 */

import {
  SurveyConfig,
  SurveyResponse,
  SurveyQuestion,
  ConditionalLogic,
  ConditionalCondition,
} from '../types';
import {
  BaseInteractiveEngine,
  EngineValidationResult,
  EngineProcessResult,
  ValidationError,
  ValidationWarning,
  mergeValidationResults,
} from './base';

// ============================================================================
// SURVEY RESULT TYPES
// ============================================================================

export interface SurveyProcessResult {
  summary: SurveySummary;
  npsScore?: NPSResult;
  satisfactionScore?: number;
  questionResults: QuestionResult[];
}

export interface SurveySummary {
  totalQuestions: number;
  answeredQuestions: number;
  skippedQuestions: number;
  completionPercentage: number;
  averageRating?: number;
}

export interface NPSResult {
  score: number;
  category: 'promoter' | 'passive' | 'detractor';
  feedback?: string;
}

export interface QuestionResult {
  questionId: string;
  question: string;
  type: SurveyQuestion['type'];
  answer: unknown;
  formattedAnswer: string;
  isSkipped: boolean;
}

export interface SurveyState extends Record<string, unknown> {
  currentQuestionIndex: number;
  answers: Record<string, unknown>;
  skippedQuestions: string[];
  visibleQuestions: string[];
  startedAt: string;
  isComplete: boolean;
}

// ============================================================================
// SURVEY ENGINE CLASS
// ============================================================================

export class SurveyEngine extends BaseInteractiveEngine<
  SurveyConfig,
  SurveyResponse,
  SurveyProcessResult,
  SurveyState
> {
  // ============================================================================
  // CONFIGURATION VALIDATION
  // ============================================================================

  validateConfig(): EngineValidationResult {
    const baseResult = this.validateBaseConfig();
    const surveyResult = this.validateSurveyConfig();
    return mergeValidationResults(baseResult, surveyResult);
  }

  private validateSurveyConfig(): EngineValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Validate questions exist
    if (!this.config.questions || this.config.questions.length === 0) {
      errors.push({
        field: 'questions',
        message: 'Survey must have at least one question',
        code: 'NO_QUESTIONS',
      });
      return { isValid: false, errors, warnings };
    }

    // Validate each question
    for (let i = 0; i < this.config.questions.length; i++) {
      const question = this.config.questions[i];
      const qErrors = this.validateQuestion(question, i);
      errors.push(...qErrors.errors);
      warnings.push(...qErrors.warnings);
    }

    // Check for NPS question if survey type is NPS
    if (this.config.surveyType === 'nps') {
      const hasNpsQuestion = this.config.questions.some((q) => q.type === 'nps');
      if (!hasNpsQuestion) {
        warnings.push({
          field: 'questions',
          message: 'NPS survey type should have at least one NPS question',
        });
      }
    }

    // Validate thank you message
    if (!this.config.settings.thankYouMessage) {
      warnings.push({
        field: 'settings.thankYouMessage',
        message: 'No thank you message configured',
      });
    }

    return { isValid: errors.length === 0, errors, warnings };
  }

  private validateQuestion(
    question: SurveyQuestion,
    index: number
  ): EngineValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const prefix = `questions[${index}]`;

    if (!question.question || question.question.trim() === '') {
      errors.push({
        field: `${prefix}.question`,
        message: `Question ${index + 1} text is required`,
        code: 'EMPTY_QUESTION',
      });
    }

    // Validate options for choice-based questions
    if (['multiple-choice', 'single-choice', 'ranking'].includes(question.type)) {
      if (!question.options || question.options.length < 2) {
        errors.push({
          field: `${prefix}.options`,
          message: `Question ${index + 1} must have at least 2 options`,
          code: 'INSUFFICIENT_OPTIONS',
        });
      }
    }

    // Validate rating questions
    if (question.type === 'rating') {
      if (
        question.maxRating !== undefined &&
        question.minRating !== undefined &&
        question.minRating >= question.maxRating
      ) {
        errors.push({
          field: `${prefix}.minRating`,
          message: `Question ${index + 1} min rating must be less than max rating`,
          code: 'INVALID_RATING_RANGE',
        });
      }
    }

    // Validate conditional logic
    if (question.conditionalLogic) {
      const logicErrors = this.validateConditionalLogic(
        question.conditionalLogic,
        prefix
      );
      errors.push(...logicErrors.errors);
      warnings.push(...logicErrors.warnings);
    }

    return { isValid: errors.length === 0, errors, warnings };
  }

  private validateConditionalLogic(
    logic: ConditionalLogic,
    prefix: string
  ): EngineValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    if (!logic.conditions || logic.conditions.length === 0) {
      errors.push({
        field: `${prefix}.conditionalLogic`,
        message: 'Conditional logic must have at least one condition',
        code: 'NO_CONDITIONS',
      });
    }

    // Validate each condition references valid questions
    for (const condition of logic.conditions) {
      const referencedQuestion = this.config.questions.find(
        (q) => q.id === condition.questionId
      );
      if (!referencedQuestion) {
        errors.push({
          field: `${prefix}.conditionalLogic`,
          message: `Conditional logic references unknown question: ${condition.questionId}`,
          code: 'INVALID_QUESTION_REFERENCE',
        });
      }
    }

    // Validate target question for skip-to action
    if (logic.action === 'skip-to' && logic.targetQuestionId) {
      const targetQuestion = this.config.questions.find(
        (q) => q.id === logic.targetQuestionId
      );
      if (!targetQuestion) {
        errors.push({
          field: `${prefix}.conditionalLogic.targetQuestionId`,
          message: `Skip-to target question not found: ${logic.targetQuestionId}`,
          code: 'INVALID_TARGET_QUESTION',
        });
      }
    }

    return { isValid: errors.length === 0, errors, warnings };
  }

  // ============================================================================
  // RESPONSE PROCESSING
  // ============================================================================

  processResponse(
    response: Partial<SurveyResponse>
  ): EngineProcessResult<SurveyProcessResult> {
    try {
      const answers = response.answers || {};

      // Build question results
      const questionResults = this.buildQuestionResults(answers);

      // Calculate summary
      const summary = this.calculateSummary(questionResults);

      // Calculate NPS if applicable
      const npsScore = this.calculateNPS(answers);

      // Calculate satisfaction score if applicable
      const satisfactionScore = this.calculateSatisfaction(answers);

      const result: SurveyProcessResult = {
        summary,
        npsScore,
        satisfactionScore,
        questionResults,
      };

      return {
        success: true,
        data: result,
        metadata: {
          completedAt: new Date().toISOString(),
          surveyType: this.config.surveyType,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to process survey',
      };
    }
  }

  private buildQuestionResults(
    answers: Record<string, unknown>
  ): QuestionResult[] {
    return this.config.questions.map((question) => {
      const answer = answers[question.id];
      const isSkipped = answer === undefined || answer === null || answer === '';

      return {
        questionId: question.id,
        question: question.question,
        type: question.type,
        answer,
        formattedAnswer: this.formatAnswer(question, answer),
        isSkipped,
      };
    });
  }

  private formatAnswer(question: SurveyQuestion, answer: unknown): string {
    if (answer === undefined || answer === null || answer === '') {
      return 'Skipped';
    }

    switch (question.type) {
      case 'single-choice':
      case 'multiple-choice': {
        const values = Array.isArray(answer) ? answer : [answer];
        const options = values
          .map((v) => question.options?.find((o) => o.id === v)?.text || v)
          .join(', ');
        return options;
      }

      case 'rating':
      case 'nps':
        return `${answer}/${question.maxRating || 10}`;

      case 'ranking': {
        if (Array.isArray(answer)) {
          return answer
            .map((v, i) => `${i + 1}. ${question.options?.find((o) => o.id === v)?.text || v}`)
            .join(', ');
        }
        return String(answer);
      }

      default:
        return String(answer);
    }
  }

  private calculateSummary(results: QuestionResult[]): SurveySummary {
    const totalQuestions = results.length;
    const answeredQuestions = results.filter((r) => !r.isSkipped).length;
    const skippedQuestions = totalQuestions - answeredQuestions;

    // Calculate average rating for rating questions
    const ratingQuestions = results.filter(
      (r) =>
        !r.isSkipped &&
        ['rating', 'nps'].includes(r.type) &&
        typeof r.answer === 'number'
    );

    let averageRating: number | undefined;
    if (ratingQuestions.length > 0) {
      const total = ratingQuestions.reduce(
        (sum, r) => sum + (r.answer as number),
        0
      );
      averageRating = total / ratingQuestions.length;
    }

    return {
      totalQuestions,
      answeredQuestions,
      skippedQuestions,
      completionPercentage: Math.round((answeredQuestions / totalQuestions) * 100),
      averageRating,
    };
  }

  private calculateNPS(answers: Record<string, unknown>): NPSResult | undefined {
    // Find NPS question
    const npsQuestion = this.config.questions.find((q) => q.type === 'nps');
    if (!npsQuestion) return undefined;

    const score = answers[npsQuestion.id];
    if (typeof score !== 'number') return undefined;

    let category: NPSResult['category'];
    if (score >= 9) {
      category = 'promoter';
    } else if (score >= 7) {
      category = 'passive';
    } else {
      category = 'detractor';
    }

    // Look for follow-up text question
    const followUpQuestion = this.config.questions.find(
      (q) =>
        q.type === 'open-text' &&
        q.conditionalLogic?.conditions.some(
          (c) => c.questionId === npsQuestion.id
        )
    );

    const feedback = followUpQuestion
      ? (answers[followUpQuestion.id] as string)
      : undefined;

    return { score, category, feedback };
  }

  private calculateSatisfaction(
    answers: Record<string, unknown>
  ): number | undefined {
    // Find satisfaction/rating questions
    const ratingQuestions = this.config.questions.filter(
      (q) => q.type === 'rating' && typeof answers[q.id] === 'number'
    );

    if (ratingQuestions.length === 0) return undefined;

    // Calculate weighted average
    let totalScore = 0;
    let totalMax = 0;

    for (const question of ratingQuestions) {
      const answer = answers[question.id] as number;
      const maxRating = question.maxRating || 5;
      totalScore += answer / maxRating;
      totalMax += 1;
    }

    return totalMax > 0 ? (totalScore / totalMax) * 5 : undefined;
  }

  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================

  getInitialState(): SurveyState {
    const visibleQuestions = this.getInitiallyVisibleQuestions();

    return {
      currentQuestionIndex: 0,
      answers: {},
      skippedQuestions: [],
      visibleQuestions,
      startedAt: new Date().toISOString(),
      isComplete: false,
    };
  }

  private getInitiallyVisibleQuestions(): string[] {
    return this.config.questions
      .filter((q) => {
        // If no conditional logic, question is visible
        if (!q.conditionalLogic) return true;

        // If action is 'hide', question starts visible
        if (q.conditionalLogic.action === 'hide') return true;

        // If action is 'show', question starts hidden
        return false;
      })
      .map((q) => q.id);
  }

  /**
   * Evaluate conditional logic and update visible questions
   */
  evaluateConditionalLogic(
    answers: Record<string, unknown>
  ): string[] {
    const visibleQuestions: string[] = [];

    for (const question of this.config.questions) {
      if (!question.conditionalLogic) {
        visibleQuestions.push(question.id);
        continue;
      }

      const shouldShow = this.evaluateConditions(
        question.conditionalLogic,
        answers
      );

      if (question.conditionalLogic.action === 'show' && shouldShow) {
        visibleQuestions.push(question.id);
      } else if (question.conditionalLogic.action === 'hide' && !shouldShow) {
        visibleQuestions.push(question.id);
      } else if (question.conditionalLogic.action !== 'skip-to') {
        // Default: show if no action matches
        if (!question.conditionalLogic) {
          visibleQuestions.push(question.id);
        }
      }
    }

    return visibleQuestions;
  }

  private evaluateConditions(
    logic: ConditionalLogic,
    answers: Record<string, unknown>
  ): boolean {
    const results = logic.conditions.map((condition) =>
      this.evaluateCondition(condition, answers)
    );

    if (logic.operator === 'and') {
      return results.every((r) => r);
    } else {
      return results.some((r) => r);
    }
  }

  private evaluateCondition(
    condition: ConditionalCondition,
    answers: Record<string, unknown>
  ): boolean {
    const answer = answers[condition.questionId];

    switch (condition.operator) {
      case 'equals':
        if (Array.isArray(answer)) {
          return answer.includes(condition.value);
        }
        return answer === condition.value;

      case 'not-equals':
        if (Array.isArray(answer)) {
          return !answer.includes(condition.value);
        }
        return answer !== condition.value;

      case 'contains':
        if (typeof answer === 'string') {
          return answer.includes(String(condition.value));
        }
        if (Array.isArray(answer)) {
          if (Array.isArray(condition.value)) {
            return condition.value.some((v) => answer.includes(v));
          }
          return answer.includes(condition.value);
        }
        return false;

      case 'greater-than':
        return (
          typeof answer === 'number' &&
          typeof condition.value === 'number' &&
          answer > condition.value
        );

      case 'less-than':
        return (
          typeof answer === 'number' &&
          typeof condition.value === 'number' &&
          answer < condition.value
        );

      default:
        return false;
    }
  }

  /**
   * Get the next question based on conditional logic
   */
  getNextQuestion(
    currentQuestion: SurveyQuestion,
    answer: unknown,
    visibleQuestions: string[]
  ): SurveyQuestion | null {
    // Check for skip-to logic
    if (currentQuestion.conditionalLogic?.action === 'skip-to') {
      const shouldSkip = this.evaluateConditions(
        currentQuestion.conditionalLogic,
        { [currentQuestion.id]: answer }
      );

      if (shouldSkip && currentQuestion.conditionalLogic.targetQuestionId) {
        return (
          this.config.questions.find(
            (q) => q.id === currentQuestion.conditionalLogic!.targetQuestionId
          ) || null
        );
      }
    }

    // Default: next visible question
    const currentIndex = this.config.questions.findIndex(
      (q) => q.id === currentQuestion.id
    );

    for (let i = currentIndex + 1; i < this.config.questions.length; i++) {
      if (visibleQuestions.includes(this.config.questions[i].id)) {
        return this.config.questions[i];
      }
    }

    return null;
  }

  /**
   * Get questions in display order
   */
  getOrderedQuestions(): SurveyQuestion[] {
    const questions = [...this.config.questions].sort((a, b) => a.order - b.order);

    if (this.config.settings.randomizeQuestions) {
      return this.shuffleArray(questions);
    }

    return questions;
  }

  /**
   * Calculate progress percentage
   */
  getProgress(answeredCount: number, totalVisible: number): number {
    if (totalVisible === 0) return 0;
    return Math.round((answeredCount / totalVisible) * 100);
  }

  /**
   * Check if survey can be skipped at current question
   */
  canSkipQuestion(question: SurveyQuestion): boolean {
    return this.config.settings.allowSkip || !question.required;
  }

  /**
   * Check if survey is complete
   */
  isSurveyComplete(
    answers: Record<string, unknown>,
    visibleQuestions: string[]
  ): boolean {
    const requiredQuestions = this.config.questions.filter(
      (q) => q.required && visibleQuestions.includes(q.id)
    );

    return requiredQuestions.every((q) => {
      const answer = answers[q.id];
      return answer !== undefined && answer !== null && answer !== '';
    });
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  /**
   * Get survey type
   */
  getSurveyType(): string {
    return this.config.surveyType;
  }

  /**
   * Get total number of questions
   */
  getTotalQuestions(): number {
    return this.config.questions.length;
  }

  /**
   * Get thank you configuration
   */
  getThankYouConfig(): { title?: string; message: string } {
    return {
      title: this.config.settings.thankYouTitle,
      message: this.config.settings.thankYouMessage,
    };
  }

  /**
   * Check if anonymous responses are allowed
   */
  allowsAnonymous(): boolean {
    return this.config.settings.allowAnonymous;
  }
}

// ============================================================================
// FACTORY FUNCTION
// ============================================================================

/**
 * Create a new SurveyEngine instance
 */
export function createSurveyEngine(config: SurveyConfig): SurveyEngine {
  return new SurveyEngine(config);
}
