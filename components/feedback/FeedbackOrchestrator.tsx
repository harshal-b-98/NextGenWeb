/**
 * Feedback Orchestrator Component
 *
 * Coordinates the entire feedback → regeneration → version creation flow.
 * Manages state, API calls, loading states, and success/error feedback.
 *
 * This is the heart of the iterative refinement system.
 *
 * Epic #146: Interactive Website Feedback & Refinement System
 */

'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useRefinementStore } from '@/lib/stores/refinement-store';
import { RegenerationProgress } from '@/components/preview/RegenerationProgress';
import { toast } from 'sonner';

interface FeedbackOrchestratorProps {
  websiteId: string;
  workspaceId: string;
  onRegenerationComplete?: (newVersionId: string) => void;
  children: React.ReactNode;
}

export function FeedbackOrchestrator({
  websiteId,
  workspaceId,
  onRegenerationComplete,
  children,
}: FeedbackOrchestratorProps) {
  const router = useRouter();
  const [feedbackText, setFeedbackText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    selectedSectionId,
    pendingChanges,
    regenerationStatus,
    startRegeneration,
    updateRegenerationProgress,
    completeRegeneration,
    failRegeneration,
    clearPendingChanges,
    setCurrentVersion,
  } = useRefinementStore();

  /**
   * Submit feedback and trigger auto-regeneration
   */
  const handleSubmitFeedback = useCallback(
    async (feedback: string, quickAction?: string) => {
      if (!feedback.trim() && !quickAction) {
        toast.error('Please provide feedback');
        return;
      }

      const feedbackSummary = quickAction || feedback.trim();

      try {
        setIsSubmitting(true);

        // Stage 1: Analyzing feedback
        startRegeneration('analyzing');
        toast.info('Analyzing your feedback...');

        // Simulate progress for UX (actual API call is async)
        setTimeout(() => updateRegenerationProgress(25), 500);

        // Submit feedback to backend
        const feedbackResponse = await fetch(
          `/api/workspaces/${workspaceId}/websites/${websiteId}/pages/${selectedSectionId}/feedback`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              feedbackText: feedbackSummary,
              feedbackType: 'content', // Default to content feedback
              targetField: null, // Will be determined by AI
            }),
          }
        );

        if (!feedbackResponse.ok) {
          throw new Error('Failed to submit feedback');
        }

        const feedbackData = await feedbackResponse.json();

        // Stage 2: Regenerating content
        startRegeneration('regenerating');
        updateRegenerationProgress(50, 5);
        toast.info('Regenerating content...');

        // Trigger regeneration
        const regenerateResponse = await fetch(
          `/api/workspaces/${workspaceId}/websites/${websiteId}/regenerate`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              feedbackSummary,
              targetPages: [], // Empty array = regenerate all pages
              feedbackId: feedbackData.feedback?.id,
              refinementType: 'content',
            }),
          }
        );

        if (!regenerateResponse.ok) {
          throw new Error('Failed to regenerate content');
        }

        const regenerateData = await regenerateResponse.json();

        // Stage 3: Updating preview
        startRegeneration('updating');
        updateRegenerationProgress(90, 1);

        // Wait a moment for smooth UX
        await new Promise((resolve) => setTimeout(resolve, 800));

        // Complete regeneration
        completeRegeneration();
        updateRegenerationProgress(100);

        // Update current version
        if (regenerateData.newVersion?.id) {
          setCurrentVersion(regenerateData.newVersion.id);

          // Notify parent
          onRegenerationComplete?.(regenerateData.newVersion.id);
        }

        // Show success toast
        const changesCount = regenerateData.summary?.totalChanges || 0;
        toast.success(
          `${regenerateData.newVersion?.versionName || 'Changes applied'}! ${
            changesCount > 0 ? `${changesCount} section${changesCount !== 1 ? 's' : ''} updated` : ''
          }`
        );

        // Clear feedback text
        setFeedbackText('');
        clearPendingChanges();

        // Refresh the page to show new content
        router.refresh();
      } catch (error) {
        console.error('Error in feedback submission:', error);
        failRegeneration(error instanceof Error ? error.message : 'Unknown error');
        toast.error('Failed to apply changes. Please try again.');
      } finally {
        setIsSubmitting(false);
      }
    },
    [
      websiteId,
      workspaceId,
      selectedSectionId,
      startRegeneration,
      updateRegenerationProgress,
      completeRegeneration,
      failRegeneration,
      clearPendingChanges,
      setCurrentVersion,
      onRegenerationComplete,
      router,
    ]
  );

  /**
   * Handle quick action clicks
   */
  const handleQuickAction = useCallback(
    (action: string) => {
      const actionMap: Record<string, string> = {
        'make-shorter': 'Make this section shorter and more concise',
        'more-professional': 'Make the tone more professional and business-like',
        'add-urgency': 'Add more urgency and call-to-action language',
        'stronger-cta': 'Make the call-to-action stronger and more compelling',
      };

      const feedbackText = actionMap[action] || action;
      handleSubmitFeedback(feedbackText, action);
    },
    [handleSubmitFeedback]
  );

  return (
    <>
      {children}

      {/* Regeneration Progress Overlay */}
      <AnimatePresence>
        {regenerationStatus.isRegenerating && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center"
          >
            <RegenerationProgress
              stage={regenerationStatus.stage!}
              progress={regenerationStatus.progress}
              estimatedTimeRemaining={regenerationStatus.estimatedTimeRemaining}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Feedback Panel Integration Point */}
      {/* This provides context to child FeedbackPanel components */}
      <FeedbackContext.Provider
        value={{
          feedbackText,
          setFeedbackText,
          isSubmitting,
          handleSubmitFeedback,
          handleQuickAction,
        }}
      >
        {/* Context provider for feedback panel children */}
      </FeedbackContext.Provider>
    </>
  );
}

/**
 * Feedback Context for child components
 */
import { createContext, useContext } from 'react';

interface FeedbackContextValue {
  feedbackText: string;
  setFeedbackText: (text: string) => void;
  isSubmitting: boolean;
  handleSubmitFeedback: (feedback: string, quickAction?: string) => Promise<void>;
  handleQuickAction: (action: string) => void;
}

const FeedbackContext = createContext<FeedbackContextValue | null>(null);

export function useFeedbackOrchestrator() {
  const context = useContext(FeedbackContext);
  if (!context) {
    throw new Error('useFeedbackOrchestrator must be used within FeedbackOrchestrator');
  }
  return context;
}
