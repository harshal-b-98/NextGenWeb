/**
 * Feedback System - Public API
 * Epic #146: Iterative Website Feedback & Refinement System
 *
 * Central export point for all feedback system functionality.
 */

// Types
export type {
  // Feedback types
  FeedbackType,
  FeedbackStatus,
  ApprovalStatus,
  RevisionType,
  SectionFeedback,
  FeedbackInput,
  ProposedChange,
  StyleChange,
  LayoutChange,

  // Revision types
  PageRevision,
  PageContentSnapshot,
  SectionSnapshot,
  SectionStylingSnapshot,
  PageMetadataSnapshot,

  // Approval types
  PageApproval,

  // Diff types
  RevisionDiff,
  SectionDiff,
  ContentFieldDiff,
  DiffSummary,
  MetadataDiff,

  // Request/Response types
  FeedbackProcessingRequest,
  FeedbackProcessingResponse,
  ApplyChangesRequest,
  ApplyChangesResponse,
  CreateRevisionRequest,
  RollbackRequest,
  CompareRevisionsRequest,

  // Context types
  RefinementContext,
  RefinementResult,
  BrandVoiceConfig,

  // UI State types
  FeedbackModeState,
  RevisionHistoryState,
  ApprovalWorkflowState,
} from './types';

// Zod Schemas for validation
export {
  FeedbackTypeSchema,
  FeedbackStatusSchema,
  ApprovalStatusSchema,
  RevisionTypeSchema,
  FeedbackInputSchema,
  ApplyChangesRequestSchema,
  RollbackRequestSchema,
  CompareRevisionsRequestSchema,
  CreateRevisionRequestSchema,
} from './types';

// Feedback Engine
export {
  FeedbackEngine,
  feedbackEngine,
  processFeedback,
  applyChanges,
} from './feedback-engine';

// Version Manager
export {
  createRevision,
  getRevisions,
  getRevision,
  getLatestRevision,
  rollbackToRevision,
  compareRevisions,
  getPageAtRevision,
  previewChanges,
} from './version-manager';

// Refinement Agent
export {
  RefinementAgent,
  refinementAgent,
  refineContent,
  generateAlternatives,
  refineField,
  refineHeadline,
  refineCTA,
  refineDescription,
} from './refinement-agent';
