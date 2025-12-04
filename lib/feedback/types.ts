/**
 * Iterative Website Feedback & Refinement System Types
 * Epic #146: Enables users to preview generated websites, provide feedback,
 * have AI implement changes, and iterate until finalized.
 *
 * Story #147: Database Schema & Types
 */

import { z } from 'zod';
import { PopulatedContent } from '@/lib/content/types';
import { Section, ComponentVariant } from '@/lib/layout/types';

// ============================================================================
// FEEDBACK TYPES
// ============================================================================

/**
 * Type of feedback provided by the user
 */
export type FeedbackType =
  | 'content' // Change text, headlines, descriptions
  | 'style' // Change colors, fonts, spacing
  | 'layout' // Change arrangement, alignment
  | 'remove' // Remove a section
  | 'add' // Add a new section
  | 'reorder'; // Change section order

/**
 * Status of a feedback item
 */
export type FeedbackStatus =
  | 'pending' // Waiting to be processed
  | 'processing' // AI is working on changes
  | 'applied' // Changes have been applied
  | 'rejected' // User rejected the proposed changes
  | 'superseded'; // Another feedback superseded this one

/**
 * Approval workflow status for pages
 */
export type ApprovalStatus =
  | 'draft' // Initial state, being edited
  | 'in_review' // Submitted for review
  | 'changes_requested' // Reviewer requested changes
  | 'approved' // Approved, ready to publish
  | 'published'; // Live on production

/**
 * Type of revision that was created
 */
export type RevisionType =
  | 'initial' // First version when page created
  | 'feedback' // Created from feedback application
  | 'rollback' // Restored from previous revision
  | 'manual' // Manual edit by user
  | 'regeneration'; // Full AI regeneration

// ============================================================================
// SECTION FEEDBACK
// ============================================================================

/**
 * User feedback on a specific section
 */
export interface SectionFeedback {
  id: string;
  pageId: string;
  sectionId: string;
  feedbackType: FeedbackType;
  feedbackText: string;
  targetField?: string; // e.g., 'headline', 'description', 'primaryCTA.text'
  status: FeedbackStatus;

  // AI processing results
  aiInterpretation?: string;
  aiConfidence?: number;
  proposedChanges?: ProposedChange;

  // Metadata
  createdBy?: string;
  createdAt: string;
  resolvedAt?: string;
  resolvedBy?: string;
}

/**
 * Input for creating new feedback
 */
export interface FeedbackInput {
  pageId: string;
  sectionId?: string; // Optional - AI will identify if not provided
  feedbackText: string;
  feedbackType?: FeedbackType; // Optional - AI will classify if not provided
  targetField?: string;
}

/**
 * Proposed change from AI analysis
 */
export interface ProposedChange {
  id: string;
  sectionId: string;
  changeType: FeedbackType;
  description: string;

  // Content changes
  before: Partial<PopulatedContent>;
  after: Partial<PopulatedContent>;

  // Style changes (Tailwind classes)
  styleChanges?: StyleChange[];

  // Layout changes
  layoutChanges?: LayoutChange[];

  // AI metadata
  confidence: number;
  reasoning: string;
}

/**
 * Style change specification
 */
export interface StyleChange {
  selector: string; // CSS-like selector within section
  property: string; // e.g., 'backgroundColor', 'fontSize'
  before: string;
  after: string;
  tailwindBefore?: string;
  tailwindAfter?: string;
}

/**
 * Layout change specification
 */
export interface LayoutChange {
  type: 'reorder' | 'add' | 'remove' | 'resize';
  elementId?: string;
  fromPosition?: number;
  toPosition?: number;
  newElement?: Partial<Section>;
}

// ============================================================================
// PAGE REVISIONS
// ============================================================================

/**
 * A complete snapshot of a page at a point in time
 */
export interface PageRevision {
  id: string;
  pageId: string;
  revisionNumber: number;
  revisionType: RevisionType;

  // Change metadata
  changeSummary: string;
  sectionsModified: string[];
  feedbackIds: string[]; // Feedback items that led to this revision

  // Complete page state
  contentSnapshot: PageContentSnapshot;

  // User info
  createdBy?: string;
  createdAt: string;

  // Rollback reference
  rolledBackFrom?: string; // ID of revision this was rolled back from
}

/**
 * Complete page content snapshot for a revision
 */
export interface PageContentSnapshot {
  pageId: string;
  title: string;
  slug: string;
  sections: SectionSnapshot[];
  metadata: PageMetadataSnapshot;
}

/**
 * Section snapshot within a revision
 */
export interface SectionSnapshot {
  sectionId: string;
  componentId: ComponentVariant;
  order: number;
  narrativeRole: string;
  content: PopulatedContent;
  styling?: SectionStylingSnapshot;
}

/**
 * Section styling snapshot
 */
export interface SectionStylingSnapshot {
  backgroundColor?: string;
  textColor?: string;
  padding?: { top: string; bottom: string };
  customClasses?: string;
}

/**
 * Page metadata snapshot
 */
export interface PageMetadataSnapshot {
  title: string;
  description: string;
  keywords?: string[];
  ogImage?: string;
}

// ============================================================================
// PAGE APPROVALS
// ============================================================================

/**
 * Approval workflow for a page revision
 */
export interface PageApproval {
  id: string;
  pageId: string;
  revisionId: string;
  status: ApprovalStatus;

  // Submission
  submittedBy?: string;
  submittedAt?: string;
  submissionNotes?: string;

  // Review
  reviewedBy?: string;
  reviewedAt?: string;
  reviewNotes?: string;

  // Approval
  approvedBy?: string;
  approvedAt?: string;
  approvalNotes?: string;

  // Publishing
  publishedAt?: string;
  publishedBy?: string;

  // Metadata
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// REVISION COMPARISON
// ============================================================================

/**
 * Difference between two revisions
 */
export interface RevisionDiff {
  fromRevision: string;
  toRevision: string;
  sectionDiffs: SectionDiff[];
  metadataDiff?: MetadataDiff;
  summary: DiffSummary;
}

/**
 * Difference for a single section
 */
export interface SectionDiff {
  sectionId: string;
  changeType: 'added' | 'removed' | 'modified' | 'unchanged';
  componentId: ComponentVariant;

  // Content differences
  contentChanges: ContentFieldDiff[];

  // Style differences
  styleChanges?: StyleChange[];
}

/**
 * Difference for a single content field
 */
export interface ContentFieldDiff {
  field: string; // e.g., 'headline', 'description', 'features[0].title'
  before: unknown;
  after: unknown;
  changeType: 'added' | 'removed' | 'modified';
}

/**
 * Metadata differences
 */
export interface MetadataDiff {
  titleChanged: boolean;
  descriptionChanged: boolean;
  keywordsChanged: boolean;
  before: Partial<PageMetadataSnapshot>;
  after: Partial<PageMetadataSnapshot>;
}

/**
 * Summary of differences
 */
export interface DiffSummary {
  sectionsAdded: number;
  sectionsRemoved: number;
  sectionsModified: number;
  totalFieldChanges: number;
  majorChanges: string[]; // Human-readable list of major changes
}

// ============================================================================
// FEEDBACK ENGINE TYPES
// ============================================================================

/**
 * Request to process feedback and generate changes
 */
export interface FeedbackProcessingRequest {
  pageId: string;
  feedbackItems: FeedbackInput[];
  workspaceId: string;
  userId?: string;
}

/**
 * Response from feedback processing
 */
export interface FeedbackProcessingResponse {
  success: boolean;
  proposedChanges: ProposedChange[];
  aiSummary: string;
  suggestedFollowUps: string[];
  processingTimeMs: number;
  tokensUsed: number;
  errors?: string[];
}

/**
 * Request to apply proposed changes
 */
export interface ApplyChangesRequest {
  pageId: string;
  proposedChangeIds: string[];
  createRevision: boolean;
  revisionSummary?: string;
  userId?: string;
}

/**
 * Response from applying changes
 */
export interface ApplyChangesResponse {
  success: boolean;
  revision?: PageRevision;
  appliedChanges: string[];
  failedChanges: { id: string; reason: string }[];
  updatedPage: PageContentSnapshot;
}

// ============================================================================
// VERSION MANAGER TYPES
// ============================================================================

/**
 * Request to create a revision
 */
export interface CreateRevisionRequest {
  pageId: string;
  revisionType: RevisionType;
  changeSummary: string;
  sectionsModified?: string[];
  feedbackIds?: string[];
  userId?: string;
}

/**
 * Request to rollback to a revision
 */
export interface RollbackRequest {
  pageId: string;
  targetRevisionId: string;
  userId?: string;
}

/**
 * Request to compare revisions
 */
export interface CompareRevisionsRequest {
  pageId: string;
  fromRevisionId: string;
  toRevisionId: string;
}

// ============================================================================
// REFINEMENT AGENT TYPES
// ============================================================================

/**
 * Context provided to the refinement agent
 */
export interface RefinementContext {
  pageId: string;
  websiteId: string;
  workspaceId: string;
  currentSection: SectionSnapshot;
  knowledgeContext: string;
  brandVoice?: BrandVoiceConfig;
  previousFeedback?: SectionFeedback[];
}

/**
 * Brand voice configuration for content generation
 */
export interface BrandVoiceConfig {
  tone: 'formal' | 'conversational' | 'bold' | 'friendly' | 'professional';
  personality: string[];
  avoidTerms: string[];
  preferredPhrases: string[];
}

/**
 * Result from refinement agent
 */
export interface RefinementResult {
  refinedContent: PopulatedContent;
  changesSummary: string;
  confidence: number;
  alternativeOptions?: PopulatedContent[];
  reasoning: string;
}

// ============================================================================
// UI STATE TYPES
// ============================================================================

/**
 * Feedback mode state for the preview page
 */
export interface FeedbackModeState {
  isEnabled: boolean;
  selectedSectionId: string | null;
  pendingFeedback: FeedbackInput[];
  proposedChanges: ProposedChange[];
  isProcessing: boolean;
  lastError: string | null;
}

/**
 * Revision history view state
 */
export interface RevisionHistoryState {
  revisions: PageRevision[];
  selectedRevisionId: string | null;
  comparingWith: string | null;
  isLoading: boolean;
  diff: RevisionDiff | null;
}

/**
 * Approval workflow state
 */
export interface ApprovalWorkflowState {
  currentApproval: PageApproval | null;
  canSubmit: boolean;
  canApprove: boolean;
  canPublish: boolean;
  isSubmitting: boolean;
}

// ============================================================================
// ZOD SCHEMAS FOR VALIDATION
// ============================================================================

export const FeedbackTypeSchema = z.enum([
  'content',
  'style',
  'layout',
  'remove',
  'add',
  'reorder',
]);

export const FeedbackStatusSchema = z.enum([
  'pending',
  'processing',
  'applied',
  'rejected',
  'superseded',
]);

export const ApprovalStatusSchema = z.enum([
  'draft',
  'in_review',
  'changes_requested',
  'approved',
  'published',
]);

export const RevisionTypeSchema = z.enum([
  'initial',
  'feedback',
  'rollback',
  'manual',
  'regeneration',
]);

export const FeedbackInputSchema = z.object({
  pageId: z.string().uuid(),
  sectionId: z.string().optional(),
  feedbackText: z.string().min(1).max(2000),
  feedbackType: FeedbackTypeSchema.optional(),
  targetField: z.string().optional(),
});

export const ApplyChangesRequestSchema = z.object({
  pageId: z.string().uuid(),
  proposedChangeIds: z.array(z.string()),
  createRevision: z.boolean(),
  revisionSummary: z.string().optional(),
  userId: z.string().uuid().optional(),
});

export const RollbackRequestSchema = z.object({
  pageId: z.string().uuid(),
  targetRevisionId: z.string().uuid(),
  userId: z.string().uuid().optional(),
});

export const CompareRevisionsRequestSchema = z.object({
  pageId: z.string().uuid(),
  fromRevisionId: z.string().uuid(),
  toRevisionId: z.string().uuid(),
});

export const CreateRevisionRequestSchema = z.object({
  pageId: z.string().uuid(),
  revisionType: RevisionTypeSchema,
  changeSummary: z.string().min(1).max(500),
  sectionsModified: z.array(z.string()).optional(),
  feedbackIds: z.array(z.string()).optional(),
  userId: z.string().uuid().optional(),
});

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type FeedbackInputType = z.infer<typeof FeedbackInputSchema>;
export type ApplyChangesRequestType = z.infer<typeof ApplyChangesRequestSchema>;
export type RollbackRequestType = z.infer<typeof RollbackRequestSchema>;
export type CompareRevisionsRequestType = z.infer<typeof CompareRevisionsRequestSchema>;
export type CreateRevisionRequestType = z.infer<typeof CreateRevisionRequestSchema>;
