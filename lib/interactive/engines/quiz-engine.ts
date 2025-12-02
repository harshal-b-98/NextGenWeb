/**
 * Quiz Engine
 * Phase 4.1: Interactive Elements System
 *
 * Engine for processing quiz interactions, scoring, and result determination.
 */

import {
  QuizConfig,
  QuizResponse,
  QuizQuestion,
  QuizOption,
  QuizResult,
  ScoringConfig,
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
// QUIZ RESULT TYPES
// ============================================================================

export interface QuizProcessResult {
  score: number;
  maxScore: number;
  percentage: number;
  correctAnswers: number;
  totalQuestions: number;
  result: QuizResult;
  answerBreakdown: AnswerBreakdown[];
  personaMatch?: string;
}

export interface AnswerBreakdown {
  questionId: string;
  question: string;
  userAnswer: string | string[];
  correctAnswer?: string | string[];
  isCorrect: boolean;
  pointsEarned: number;
  maxPoints: number;
  explanation?: string;
}

export interface QuizState extends Record<string, unknown> {
  currentQuestionIndex: number;
  answers: Record<string, string | string[]>;
  score: number;
  startedAt: string;
  isComplete: boolean;
  timeRemaining?: number;
}

// ============================================================================
// QUIZ ENGINE CLASS
// ============================================================================

export class QuizEngine extends BaseInteractiveEngine<
  QuizConfig,
  QuizResponse,
  QuizProcessResult,
  QuizState
> {
  // ============================================================================
  // CONFIGURATION VALIDATION
  // ============================================================================

  validateConfig(): EngineValidationResult {
    const baseResult = this.validateBaseConfig();
    const quizResult = this.validateQuizConfig();
    return mergeValidationResults(baseResult, quizResult);
  }

  private validateQuizConfig(): EngineValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Validate questions exist
    if (!this.config.questions || this.config.questions.length === 0) {
      errors.push({
        field: 'questions',
        message: 'Quiz must have at least one question',
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

    // Validate results exist
    if (!this.config.results || this.config.results.length === 0) {
      errors.push({
        field: 'results',
        message: 'Quiz must have at least one result',
        code: 'NO_RESULTS',
      });
    } else {
      // Validate result score ranges cover all possibilities
      const scoreRanges = this.config.results.map((r) => ({
        min: r.minScore,
        max: r.maxScore,
      }));
      const hasGaps = this.checkScoreRangeGaps(scoreRanges);
      if (hasGaps) {
        warnings.push({
          field: 'results',
          message: 'Some score ranges may not be covered by results',
        });
      }
    }

    // Validate scoring config
    if (!this.config.scoring) {
      errors.push({
        field: 'scoring',
        message: 'Scoring configuration is required',
        code: 'NO_SCORING_CONFIG',
      });
    }

    // Validate time limit if set
    if (this.config.settings.timeLimit && this.config.settings.timeLimit < 10) {
      warnings.push({
        field: 'settings.timeLimit',
        message: 'Time limit is very short (less than 10 seconds)',
      });
    }

    return { isValid: errors.length === 0, errors, warnings };
  }

  private validateQuestion(
    question: QuizQuestion,
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
    if (['multiple-choice', 'single-choice', 'image-choice'].includes(question.type)) {
      if (!question.options || question.options.length < 2) {
        errors.push({
          field: `${prefix}.options`,
          message: `Question ${index + 1} must have at least 2 options`,
          code: 'INSUFFICIENT_OPTIONS',
        });
      }

      // Check for correct answer if scoring requires it
      if (this.config.scoring?.type === 'points') {
        const hasCorrectAnswer =
          question.correctAnswer ||
          question.options?.some((o) => o.isCorrect || (o.score && o.score > 0));
        if (!hasCorrectAnswer) {
          warnings.push({
            field: `${prefix}.correctAnswer`,
            message: `Question ${index + 1} has no correct answer defined`,
          });
        }
      }
    }

    // Validate true-false has exactly 2 options
    if (question.type === 'true-false') {
      if (question.options && question.options.length !== 2) {
        errors.push({
          field: `${prefix}.options`,
          message: `True/False question ${index + 1} must have exactly 2 options`,
          code: 'INVALID_TRUE_FALSE',
        });
      }
    }

    return { isValid: errors.length === 0, errors, warnings };
  }

  private checkScoreRangeGaps(
    ranges: { min: number; max: number }[]
  ): boolean {
    if (ranges.length === 0) return true;

    const sorted = [...ranges].sort((a, b) => a.min - b.min);

    // Check for gaps between ranges
    for (let i = 0; i < sorted.length - 1; i++) {
      if (sorted[i].max < sorted[i + 1].min - 1) {
        return true; // Gap found
      }
    }

    return false;
  }

  // ============================================================================
  // RESPONSE PROCESSING
  // ============================================================================

  processResponse(response: Partial<QuizResponse>): EngineProcessResult<QuizProcessResult> {
    try {
      const answers = response.answers || {};

      // Calculate score
      const { score, maxScore, correctAnswers, breakdown } = this.calculateScore(answers);
      const percentage = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;

      // Determine result
      const result = this.determineResult(score, percentage);
      if (!result) {
        return {
          success: false,
          error: 'No matching result found for score',
        };
      }

      const processResult: QuizProcessResult = {
        score,
        maxScore,
        percentage,
        correctAnswers,
        totalQuestions: this.config.questions.length,
        result,
        answerBreakdown: breakdown,
        personaMatch: result.personaMatch,
      };

      return {
        success: true,
        data: processResult,
        metadata: {
          completedAt: new Date().toISOString(),
          resultId: result.id,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to process quiz response',
      };
    }
  }

  private calculateScore(answers: Record<string, string | string[]>): {
    score: number;
    maxScore: number;
    correctAnswers: number;
    breakdown: AnswerBreakdown[];
  } {
    let score = 0;
    let maxScore = 0;
    let correctAnswers = 0;
    const breakdown: AnswerBreakdown[] = [];

    for (const question of this.config.questions) {
      const userAnswer = answers[question.id];
      const weight = question.weight || 1;
      const questionMaxScore = this.getQuestionMaxScore(question);
      maxScore += questionMaxScore * weight;

      const { pointsEarned, isCorrect } = this.scoreAnswer(question, userAnswer);
      score += pointsEarned * weight;

      if (isCorrect) {
        correctAnswers++;
      }

      breakdown.push({
        questionId: question.id,
        question: question.question,
        userAnswer: userAnswer || '',
        correctAnswer: question.correctAnswer,
        isCorrect,
        pointsEarned: pointsEarned * weight,
        maxPoints: questionMaxScore * weight,
        explanation: question.explanation,
      });
    }

    return { score, maxScore, correctAnswers, breakdown };
  }

  private getQuestionMaxScore(question: QuizQuestion): number {
    if (question.options) {
      const maxOptionScore = Math.max(
        ...question.options.map((o) => o.score || (o.isCorrect ? 1 : 0))
      );
      return maxOptionScore > 0 ? maxOptionScore : 1;
    }
    return 1;
  }

  private scoreAnswer(
    question: QuizQuestion,
    userAnswer: string | string[] | undefined
  ): { pointsEarned: number; isCorrect: boolean } {
    if (!userAnswer) {
      return { pointsEarned: 0, isCorrect: false };
    }

    switch (question.type) {
      case 'single-choice':
      case 'true-false':
      case 'image-choice':
        return this.scoreSingleChoice(question, userAnswer as string);

      case 'multiple-choice':
        return this.scoreMultipleChoice(question, userAnswer);

      case 'text':
        return this.scoreTextAnswer(question, userAnswer as string);

      case 'rating':
        return this.scoreRating(question, userAnswer as string);

      default:
        return { pointsEarned: 0, isCorrect: false };
    }
  }

  private scoreSingleChoice(
    question: QuizQuestion,
    answer: string
  ): { pointsEarned: number; isCorrect: boolean } {
    const option = question.options?.find((o) => o.id === answer);

    if (!option) {
      return { pointsEarned: 0, isCorrect: false };
    }

    // Check if correct by explicit correctAnswer
    if (question.correctAnswer) {
      const isCorrect = question.correctAnswer === answer;
      return {
        pointsEarned: isCorrect ? (option.score || 1) : 0,
        isCorrect,
      };
    }

    // Check if correct by option's isCorrect flag
    if (option.isCorrect !== undefined) {
      return {
        pointsEarned: option.isCorrect ? (option.score || 1) : 0,
        isCorrect: option.isCorrect,
      };
    }

    // Score-based (no correct/incorrect, just scores)
    return {
      pointsEarned: option.score || 0,
      isCorrect: (option.score || 0) > 0,
    };
  }

  private scoreMultipleChoice(
    question: QuizQuestion,
    answer: string | string[]
  ): { pointsEarned: number; isCorrect: boolean } {
    const answers = Array.isArray(answer) ? answer : [answer];
    const correctAnswers = Array.isArray(question.correctAnswer)
      ? question.correctAnswer
      : question.correctAnswer
        ? [question.correctAnswer]
        : question.options?.filter((o) => o.isCorrect).map((o) => o.id) || [];

    if (correctAnswers.length === 0) {
      // No correct answers defined, sum up option scores
      let totalScore = 0;
      for (const ans of answers) {
        const option = question.options?.find((o) => o.id === ans);
        totalScore += option?.score || 0;
      }
      return { pointsEarned: totalScore, isCorrect: totalScore > 0 };
    }

    // Check if all correct answers are selected and no incorrect ones
    const isFullyCorrect =
      answers.length === correctAnswers.length &&
      answers.every((a) => correctAnswers.includes(a));

    if (isFullyCorrect) {
      return { pointsEarned: 1, isCorrect: true };
    }

    // Partial scoring: count correct selections
    const correctSelections = answers.filter((a) => correctAnswers.includes(a)).length;
    const incorrectSelections = answers.filter((a) => !correctAnswers.includes(a)).length;
    const partialScore = Math.max(
      0,
      (correctSelections - incorrectSelections) / correctAnswers.length
    );

    return { pointsEarned: partialScore, isCorrect: false };
  }

  private scoreTextAnswer(
    question: QuizQuestion,
    answer: string
  ): { pointsEarned: number; isCorrect: boolean } {
    if (!question.correctAnswer) {
      // No correct answer defined, award full points for any answer
      return { pointsEarned: 1, isCorrect: true };
    }

    const correctAnswer = Array.isArray(question.correctAnswer)
      ? question.correctAnswer
      : [question.correctAnswer];

    const normalizedAnswer = answer.toLowerCase().trim();
    const isCorrect = correctAnswer.some(
      (ca) => ca.toLowerCase().trim() === normalizedAnswer
    );

    return { pointsEarned: isCorrect ? 1 : 0, isCorrect };
  }

  private scoreRating(
    question: QuizQuestion,
    answer: string
  ): { pointsEarned: number; isCorrect: boolean } {
    const rating = parseInt(answer, 10);
    if (isNaN(rating)) {
      return { pointsEarned: 0, isCorrect: false };
    }

    // Rating questions typically don't have correct/incorrect
    // Use the rating value as the score
    const maxRating = question.options?.length || 5;
    return {
      pointsEarned: rating / maxRating,
      isCorrect: true,
    };
  }

  private determineResult(score: number, percentage: number): QuizResult | null {
    const scoring = this.config.scoring;

    // Find matching result based on score or percentage
    for (const result of this.config.results) {
      const compareValue = scoring.type === 'percentage' ? percentage : score;
      if (compareValue >= result.minScore && compareValue <= result.maxScore) {
        return result;
      }
    }

    // Fallback to first result if no match (shouldn't happen with proper config)
    return this.config.results[0] || null;
  }

  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================

  getInitialState(): QuizState {
    return {
      currentQuestionIndex: 0,
      answers: {},
      score: 0,
      startedAt: new Date().toISOString(),
      isComplete: false,
      timeRemaining: this.config.settings.timeLimit,
    };
  }

  /**
   * Get questions in display order (optionally randomized)
   */
  getOrderedQuestions(): QuizQuestion[] {
    const questions = [...this.config.questions].sort((a, b) => a.order - b.order);

    if (this.config.settings.randomizeQuestions) {
      return this.shuffleArray(questions);
    }

    return questions;
  }

  /**
   * Get options for a question (optionally randomized)
   */
  getOrderedOptions(question: QuizQuestion): QuizOption[] {
    if (!question.options) return [];

    if (this.config.settings.randomizeOptions) {
      return this.shuffleArray([...question.options]);
    }

    return question.options;
  }

  /**
   * Get the next question based on branching logic
   */
  getNextQuestion(
    currentQuestion: QuizQuestion,
    answer: string
  ): QuizQuestion | null {
    // Check for branching logic in the selected option
    const option = currentQuestion.options?.find((o) => o.id === answer);
    if (option?.nextQuestionId) {
      return this.config.questions.find((q) => q.id === option.nextQuestionId) || null;
    }

    // Default: next question in order
    const currentIndex = this.config.questions.findIndex(
      (q) => q.id === currentQuestion.id
    );
    if (currentIndex < this.config.questions.length - 1) {
      return this.config.questions[currentIndex + 1];
    }

    return null;
  }

  /**
   * Calculate progress percentage
   */
  getProgress(answeredCount: number): number {
    return Math.round((answeredCount / this.config.questions.length) * 100);
  }

  /**
   * Check if quiz is complete
   */
  isQuizComplete(answers: Record<string, string | string[]>): boolean {
    const requiredQuestions = this.config.questions.filter((q) => q.required);
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
   * Get total number of questions
   */
  getTotalQuestions(): number {
    return this.config.questions.length;
  }

  /**
   * Get all possible results
   */
  getAllResults(): QuizResult[] {
    return this.config.results;
  }

  /**
   * Check if quiz has time limit
   */
  hasTimeLimit(): boolean {
    return !!this.config.settings.timeLimit && this.config.settings.timeLimit > 0;
  }

  /**
   * Get time limit in seconds
   */
  getTimeLimit(): number {
    return this.config.settings.timeLimit || 0;
  }
}

// ============================================================================
// FACTORY FUNCTION
// ============================================================================

/**
 * Create a new QuizEngine instance
 */
export function createQuizEngine(config: QuizConfig): QuizEngine {
  return new QuizEngine(config);
}
