'use client';

/**
 * Feedback System React Hooks
 * Epic #146: Iterative Website Feedback & Refinement System
 *
 * Custom hooks for managing feedback, revisions, and approval workflows.
 */

import { useState, useCallback, useEffect } from 'react';
import type {
  SectionFeedback,
  FeedbackInput,
  ProposedChange,
  PageRevision,
  RevisionDiff,
  PageApproval,
  FeedbackModeState,
  RevisionHistoryState,
  ApprovalWorkflowState,
  ApprovalStatus,
} from './types';

// ============================================================================
// FEEDBACK MODE HOOK
// ============================================================================

interface UseFeedbackModeOptions {
  pageId: string;
  workspaceId: string;
  websiteId: string;
}

export function useFeedbackMode(options: UseFeedbackModeOptions) {
  const { pageId, workspaceId, websiteId } = options;
  const basePath = `/api/workspaces/${workspaceId}/websites/${websiteId}/pages/${pageId}`;

  const [state, setState] = useState<FeedbackModeState>({
    isEnabled: false,
    selectedSectionId: null,
    pendingFeedback: [],
    proposedChanges: [],
    isProcessing: false,
    lastError: null,
  });

  // Toggle feedback mode
  const toggleFeedbackMode = useCallback(() => {
    setState(prev => ({
      ...prev,
      isEnabled: !prev.isEnabled,
      selectedSectionId: null,
    }));
  }, []);

  // Select a section
  const selectSection = useCallback((sectionId: string | null) => {
    setState(prev => ({
      ...prev,
      selectedSectionId: sectionId,
    }));
  }, []);

  // Add feedback to pending list
  const addFeedback = useCallback((feedback: FeedbackInput) => {
    setState(prev => ({
      ...prev,
      pendingFeedback: [...prev.pendingFeedback, feedback],
    }));
  }, []);

  // Remove pending feedback
  const removeFeedback = useCallback((index: number) => {
    setState(prev => ({
      ...prev,
      pendingFeedback: prev.pendingFeedback.filter((_, i) => i !== index),
    }));
  }, []);

  // Submit feedback and get proposed changes
  const submitFeedback = useCallback(
    async (feedbackItems?: FeedbackInput[]) => {
      const items = feedbackItems || state.pendingFeedback;
      if (items.length === 0) return;

      setState(prev => ({ ...prev, isProcessing: true, lastError: null }));

      try {
        const response = await fetch(`${basePath}/feedback`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ feedback: items }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to process feedback');
        }

        setState(prev => ({
          ...prev,
          proposedChanges: data.proposedChanges || [],
          pendingFeedback: [],
          isProcessing: false,
        }));

        return data;
      } catch (error) {
        setState(prev => ({
          ...prev,
          isProcessing: false,
          lastError: error instanceof Error ? error.message : 'Unknown error',
        }));
        throw error;
      }
    },
    [basePath, state.pendingFeedback]
  );

  // Apply proposed changes
  const applyChanges = useCallback(
    async (changeIds: string[], createRevision = true, summary?: string) => {
      setState(prev => ({ ...prev, isProcessing: true, lastError: null }));

      try {
        const response = await fetch(`${basePath}/feedback`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            proposedChangeIds: changeIds,
            createRevision,
            revisionSummary: summary,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to apply changes');
        }

        setState(prev => ({
          ...prev,
          proposedChanges: prev.proposedChanges.filter(c => !changeIds.includes(c.id)),
          isProcessing: false,
        }));

        return data;
      } catch (error) {
        setState(prev => ({
          ...prev,
          isProcessing: false,
          lastError: error instanceof Error ? error.message : 'Unknown error',
        }));
        throw error;
      }
    },
    [basePath]
  );

  // Clear all proposed changes
  const clearChanges = useCallback(() => {
    setState(prev => ({ ...prev, proposedChanges: [] }));
  }, []);

  // Reset state
  const reset = useCallback(() => {
    setState({
      isEnabled: false,
      selectedSectionId: null,
      pendingFeedback: [],
      proposedChanges: [],
      isProcessing: false,
      lastError: null,
    });
  }, []);

  return {
    ...state,
    toggleFeedbackMode,
    selectSection,
    addFeedback,
    removeFeedback,
    submitFeedback,
    applyChanges,
    clearChanges,
    reset,
  };
}

// ============================================================================
// REVISION HISTORY HOOK
// ============================================================================

interface UseRevisionsOptions {
  pageId: string;
  workspaceId: string;
  websiteId: string;
  autoLoad?: boolean;
}

export function useRevisions(options: UseRevisionsOptions) {
  const { pageId, workspaceId, websiteId, autoLoad = true } = options;
  const basePath = `/api/workspaces/${workspaceId}/websites/${websiteId}/pages/${pageId}`;

  const [state, setState] = useState<RevisionHistoryState>({
    revisions: [],
    selectedRevisionId: null,
    comparingWith: null,
    isLoading: false,
    diff: null,
  });

  // Load revisions
  const loadRevisions = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true }));

    try {
      const response = await fetch(`${basePath}/revisions`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load revisions');
      }

      setState(prev => ({
        ...prev,
        revisions: data.revisions || [],
        isLoading: false,
      }));
    } catch (error) {
      console.error('Error loading revisions:', error);
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [basePath]);

  // Auto-load on mount
  useEffect(() => {
    if (autoLoad) {
      loadRevisions();
    }
  }, [autoLoad, loadRevisions]);

  // Select a revision
  const selectRevision = useCallback((revisionId: string | null) => {
    setState(prev => ({
      ...prev,
      selectedRevisionId: revisionId,
      diff: null,
    }));
  }, []);

  // Compare two revisions
  const compareRevisions = useCallback(
    async (fromId: string, toId: string) => {
      setState(prev => ({
        ...prev,
        selectedRevisionId: fromId,
        comparingWith: toId,
        isLoading: true,
      }));

      try {
        const response = await fetch(
          `${basePath}/revisions?from=${fromId}&to=${toId}`
        );
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to compare revisions');
        }

        setState(prev => ({
          ...prev,
          diff: data.diff,
          isLoading: false,
        }));

        return data.diff;
      } catch (error) {
        console.error('Error comparing revisions:', error);
        setState(prev => ({ ...prev, isLoading: false }));
        throw error;
      }
    },
    [basePath]
  );

  // Rollback to a revision
  const rollbackTo = useCallback(
    async (revisionId: string) => {
      setState(prev => ({ ...prev, isLoading: true }));

      try {
        const response = await fetch(`${basePath}/revisions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'rollback',
            targetRevisionId: revisionId,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to rollback');
        }

        // Reload revisions
        await loadRevisions();

        return data;
      } catch (error) {
        console.error('Error rolling back:', error);
        setState(prev => ({ ...prev, isLoading: false }));
        throw error;
      }
    },
    [basePath, loadRevisions]
  );

  // Preview a revision
  const previewRevision = useCallback(
    async (revisionId: string) => {
      try {
        const response = await fetch(
          `${basePath}/revisions?preview=${revisionId}`
        );
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to preview revision');
        }

        return data.snapshot;
      } catch (error) {
        console.error('Error previewing revision:', error);
        throw error;
      }
    },
    [basePath]
  );

  // Clear comparison
  const clearComparison = useCallback(() => {
    setState(prev => ({
      ...prev,
      comparingWith: null,
      diff: null,
    }));
  }, []);

  return {
    ...state,
    loadRevisions,
    selectRevision,
    compareRevisions,
    rollbackTo,
    previewRevision,
    clearComparison,
  };
}

// ============================================================================
// APPROVAL WORKFLOW HOOK
// ============================================================================

interface UseApprovalOptions {
  pageId: string;
  workspaceId: string;
  websiteId: string;
  autoLoad?: boolean;
}

export function useApproval(options: UseApprovalOptions) {
  const { pageId, workspaceId, websiteId, autoLoad = true } = options;
  const basePath = `/api/workspaces/${workspaceId}/websites/${websiteId}/pages/${pageId}`;

  const [state, setState] = useState<ApprovalWorkflowState>({
    currentApproval: null,
    canSubmit: false,
    canApprove: false,
    canPublish: false,
    isSubmitting: false,
  });

  const [pageStatus, setPageStatus] = useState<ApprovalStatus>('draft');
  const [approvalHistory, setApprovalHistory] = useState<PageApproval[]>([]);

  // Load approval status
  const loadApprovalStatus = useCallback(async () => {
    try {
      const response = await fetch(`${basePath}/approval`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load approval status');
      }

      setState(prev => ({
        ...prev,
        currentApproval: data.currentApproval,
        canSubmit: data.availableActions?.canSubmit || false,
        canApprove: data.availableActions?.canApprove || false,
        canPublish: data.availableActions?.canPublish || false,
      }));

      setPageStatus(data.pageStatus || 'draft');
      setApprovalHistory(data.approvalHistory || []);
    } catch (error) {
      console.error('Error loading approval status:', error);
    }
  }, [basePath]);

  // Auto-load on mount
  useEffect(() => {
    if (autoLoad) {
      loadApprovalStatus();
    }
  }, [autoLoad, loadApprovalStatus]);

  // Submit for review
  const submitForReview = useCallback(
    async (revisionId: string, notes?: string) => {
      setState(prev => ({ ...prev, isSubmitting: true }));

      try {
        const response = await fetch(`${basePath}/approval`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'submit',
            revisionId,
            notes,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to submit for review');
        }

        await loadApprovalStatus();
        return data;
      } catch (error) {
        console.error('Error submitting for review:', error);
        throw error;
      } finally {
        setState(prev => ({ ...prev, isSubmitting: false }));
      }
    },
    [basePath, loadApprovalStatus]
  );

  // Approve or request changes
  const review = useCallback(
    async (
      approvalId: string,
      decision: 'approve' | 'request_changes',
      notes?: string
    ) => {
      setState(prev => ({ ...prev, isSubmitting: true }));

      try {
        const response = await fetch(`${basePath}/approval`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'review',
            approvalId,
            decision,
            notes,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to review');
        }

        await loadApprovalStatus();
        return data;
      } catch (error) {
        console.error('Error reviewing:', error);
        throw error;
      } finally {
        setState(prev => ({ ...prev, isSubmitting: false }));
      }
    },
    [basePath, loadApprovalStatus]
  );

  // Publish
  const publish = useCallback(
    async (approvalId: string, notes?: string) => {
      setState(prev => ({ ...prev, isSubmitting: true }));

      try {
        const response = await fetch(`${basePath}/approval`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'publish',
            approvalId,
            notes,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to publish');
        }

        await loadApprovalStatus();
        return data;
      } catch (error) {
        console.error('Error publishing:', error);
        throw error;
      } finally {
        setState(prev => ({ ...prev, isSubmitting: false }));
      }
    },
    [basePath, loadApprovalStatus]
  );

  return {
    ...state,
    pageStatus,
    approvalHistory,
    loadApprovalStatus,
    submitForReview,
    review,
    publish,
  };
}

// ============================================================================
// QUICK FEEDBACK HOOK (for single feedback submission)
// ============================================================================

interface UseQuickFeedbackOptions {
  pageId: string;
  workspaceId: string;
  websiteId: string;
  sectionId?: string;
}

export function useQuickFeedback(options: UseQuickFeedbackOptions) {
  const { pageId, workspaceId, websiteId, sectionId } = options;
  const basePath = `/api/workspaces/${workspaceId}/websites/${websiteId}/pages/${pageId}`;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submitFeedback = useCallback(
    async (feedbackText: string, targetField?: string) => {
      setIsSubmitting(true);
      setError(null);

      try {
        const response = await fetch(`${basePath}/feedback`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            feedbackText,
            sectionId,
            targetField,
            pageId,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to submit feedback');
        }

        return data;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        setError(message);
        throw err;
      } finally {
        setIsSubmitting(false);
      }
    },
    [basePath, pageId, sectionId]
  );

  return {
    submitFeedback,
    isSubmitting,
    error,
  };
}
