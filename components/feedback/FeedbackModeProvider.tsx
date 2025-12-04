'use client';

/**
 * Feedback Mode Provider
 * Epic #146: Iterative Website Feedback & Refinement System
 *
 * Story #152: Context provider for managing feedback mode state across components.
 */

import React, { createContext, useContext, ReactNode } from 'react';
import {
  useFeedbackMode,
  useRevisions,
  useApproval,
} from '@/lib/feedback/hooks';
import type {
  FeedbackInput,
  ProposedChange,
  PageRevision,
  RevisionDiff,
  PageApproval,
  ApprovalStatus,
} from '@/lib/feedback/types';

// ============================================================================
// CONTEXT TYPES
// ============================================================================

interface FeedbackContextValue {
  // Feedback mode state
  isEnabled: boolean;
  selectedSectionId: string | null;
  pendingFeedback: FeedbackInput[];
  proposedChanges: ProposedChange[];
  isProcessing: boolean;
  lastError: string | null;

  // Feedback mode actions
  toggleFeedbackMode: () => void;
  selectSection: (sectionId: string | null) => void;
  addFeedback: (feedback: FeedbackInput) => void;
  removeFeedback: (index: number) => void;
  submitFeedback: (feedbackItems?: FeedbackInput[]) => Promise<unknown>;
  applyChanges: (
    changeIds: string[],
    createRevision?: boolean,
    summary?: string
  ) => Promise<unknown>;
  clearChanges: () => void;
  resetFeedback: () => void;

  // Revision state
  revisions: PageRevision[];
  selectedRevisionId: string | null;
  comparingWith: string | null;
  isLoadingRevisions: boolean;
  diff: RevisionDiff | null;

  // Revision actions
  loadRevisions: () => Promise<void>;
  selectRevision: (revisionId: string | null) => void;
  compareRevisions: (fromId: string, toId: string) => Promise<RevisionDiff>;
  rollbackTo: (revisionId: string) => Promise<unknown>;
  previewRevision: (revisionId: string) => Promise<unknown>;
  clearComparison: () => void;

  // Approval state
  currentApproval: PageApproval | null;
  pageStatus: ApprovalStatus;
  canSubmit: boolean;
  canApprove: boolean;
  canPublish: boolean;
  isSubmittingApproval: boolean;
  approvalHistory: PageApproval[];

  // Approval actions
  loadApprovalStatus: () => Promise<void>;
  submitForReview: (revisionId: string, notes?: string) => Promise<unknown>;
  review: (
    approvalId: string,
    decision: 'approve' | 'request_changes',
    notes?: string
  ) => Promise<unknown>;
  publish: (approvalId: string, notes?: string) => Promise<unknown>;

  // Page info
  pageId: string;
  workspaceId: string;
  websiteId: string;
}

// ============================================================================
// CONTEXT
// ============================================================================

const FeedbackContext = createContext<FeedbackContextValue | null>(null);

// ============================================================================
// PROVIDER COMPONENT
// ============================================================================

interface FeedbackModeProviderProps {
  children: ReactNode;
  pageId: string;
  workspaceId: string;
  websiteId: string;
  autoLoadRevisions?: boolean;
  autoLoadApproval?: boolean;
}

export function FeedbackModeProvider({
  children,
  pageId,
  workspaceId,
  websiteId,
  autoLoadRevisions = false,
  autoLoadApproval = false,
}: FeedbackModeProviderProps) {
  // Initialize hooks
  const feedbackMode = useFeedbackMode({ pageId, workspaceId, websiteId });
  const revisions = useRevisions({
    pageId,
    workspaceId,
    websiteId,
    autoLoad: autoLoadRevisions,
  });
  const approval = useApproval({
    pageId,
    workspaceId,
    websiteId,
    autoLoad: autoLoadApproval,
  });

  // Combine into context value
  const value: FeedbackContextValue = {
    // Feedback mode
    isEnabled: feedbackMode.isEnabled,
    selectedSectionId: feedbackMode.selectedSectionId,
    pendingFeedback: feedbackMode.pendingFeedback,
    proposedChanges: feedbackMode.proposedChanges,
    isProcessing: feedbackMode.isProcessing,
    lastError: feedbackMode.lastError,
    toggleFeedbackMode: feedbackMode.toggleFeedbackMode,
    selectSection: feedbackMode.selectSection,
    addFeedback: feedbackMode.addFeedback,
    removeFeedback: feedbackMode.removeFeedback,
    submitFeedback: feedbackMode.submitFeedback,
    applyChanges: feedbackMode.applyChanges,
    clearChanges: feedbackMode.clearChanges,
    resetFeedback: feedbackMode.reset,

    // Revisions
    revisions: revisions.revisions,
    selectedRevisionId: revisions.selectedRevisionId,
    comparingWith: revisions.comparingWith,
    isLoadingRevisions: revisions.isLoading,
    diff: revisions.diff,
    loadRevisions: revisions.loadRevisions,
    selectRevision: revisions.selectRevision,
    compareRevisions: revisions.compareRevisions,
    rollbackTo: revisions.rollbackTo,
    previewRevision: revisions.previewRevision,
    clearComparison: revisions.clearComparison,

    // Approval
    currentApproval: approval.currentApproval,
    pageStatus: approval.pageStatus,
    canSubmit: approval.canSubmit,
    canApprove: approval.canApprove,
    canPublish: approval.canPublish,
    isSubmittingApproval: approval.isSubmitting,
    approvalHistory: approval.approvalHistory,
    loadApprovalStatus: approval.loadApprovalStatus,
    submitForReview: approval.submitForReview,
    review: approval.review,
    publish: approval.publish,

    // Page info
    pageId,
    workspaceId,
    websiteId,
  };

  return (
    <FeedbackContext.Provider value={value}>
      {children}
    </FeedbackContext.Provider>
  );
}

// ============================================================================
// HOOKS
// ============================================================================

export function useFeedbackContext() {
  const context = useContext(FeedbackContext);
  if (!context) {
    throw new Error(
      'useFeedbackContext must be used within a FeedbackModeProvider'
    );
  }
  return context;
}

// Convenience hooks for specific parts of the context
export function useFeedbackEnabled() {
  const { isEnabled, toggleFeedbackMode } = useFeedbackContext();
  return { isEnabled, toggleFeedbackMode };
}

export function useSelectedSection() {
  const { selectedSectionId, selectSection } = useFeedbackContext();
  return { selectedSectionId, selectSection };
}

export function usePendingChanges() {
  const { proposedChanges, applyChanges, clearChanges, isProcessing } =
    useFeedbackContext();
  return { proposedChanges, applyChanges, clearChanges, isProcessing };
}

export function usePageRevisions() {
  const {
    revisions,
    selectedRevisionId,
    comparingWith,
    isLoadingRevisions,
    diff,
    loadRevisions,
    selectRevision,
    compareRevisions,
    rollbackTo,
    previewRevision,
    clearComparison,
  } = useFeedbackContext();

  return {
    revisions,
    selectedRevisionId,
    comparingWith,
    isLoading: isLoadingRevisions,
    diff,
    loadRevisions,
    selectRevision,
    compareRevisions,
    rollbackTo,
    previewRevision,
    clearComparison,
  };
}

export function usePageApproval() {
  const {
    currentApproval,
    pageStatus,
    canSubmit,
    canApprove,
    canPublish,
    isSubmittingApproval,
    approvalHistory,
    loadApprovalStatus,
    submitForReview,
    review,
    publish,
  } = useFeedbackContext();

  return {
    currentApproval,
    pageStatus,
    canSubmit,
    canApprove,
    canPublish,
    isSubmitting: isSubmittingApproval,
    approvalHistory,
    loadApprovalStatus,
    submitForReview,
    review,
    publish,
  };
}
