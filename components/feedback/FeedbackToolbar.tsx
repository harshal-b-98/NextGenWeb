'use client';

/**
 * Feedback Toolbar
 * Epic #146: Iterative Website Feedback & Refinement System
 *
 * Story #152: Toolbar component for feedback mode toggle, history, and approval actions.
 */

import React, { useState } from 'react';
import {
  Edit3,
  History,
  Check,
  Send,
  RotateCcw,
  Loader2,
  Eye,
  ChevronDown,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  useFeedbackContext,
  useFeedbackEnabled,
  usePageApproval,
} from './FeedbackModeProvider';
import type { ApprovalStatus } from '@/lib/feedback/types';

// ============================================================================
// TYPES
// ============================================================================

interface FeedbackToolbarProps {
  className?: string;
  showApproval?: boolean;
  showHistory?: boolean;
  onHistoryClick?: () => void;
  onPreviewClick?: () => void;
}

// ============================================================================
// STATUS BADGE COMPONENT
// ============================================================================

function StatusBadge({ status }: { status: ApprovalStatus }) {
  const config: Record<ApprovalStatus, { label: string; color: string }> = {
    draft: { label: 'Draft', color: 'bg-gray-100 text-gray-700' },
    in_review: { label: 'In Review', color: 'bg-yellow-100 text-yellow-700' },
    changes_requested: {
      label: 'Changes Requested',
      color: 'bg-orange-100 text-orange-700',
    },
    approved: { label: 'Approved', color: 'bg-green-100 text-green-700' },
    published: { label: 'Published', color: 'bg-blue-100 text-blue-700' },
  };

  const { label, color } = config[status] || config.draft;

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
        color
      )}
    >
      {label}
    </span>
  );
}

// ============================================================================
// MAIN TOOLBAR COMPONENT
// ============================================================================

export function FeedbackToolbar({
  className,
  showApproval = true,
  showHistory = true,
  onHistoryClick,
  onPreviewClick,
}: FeedbackToolbarProps) {
  const { isEnabled, toggleFeedbackMode } = useFeedbackEnabled();
  const {
    proposedChanges,
    applyChanges,
    isProcessing,
    revisions,
    loadRevisions,
  } = useFeedbackContext();
  const {
    pageStatus,
    canSubmit,
    canApprove,
    canPublish,
    isSubmitting,
    submitForReview,
    review,
    publish,
    currentApproval,
  } = usePageApproval();

  const [showMenu, setShowMenu] = useState(false);
  const [showApprovalDialog, setShowApprovalDialog] = useState<
    'submit' | 'approve' | 'reject' | 'publish' | null
  >(null);
  const [notes, setNotes] = useState('');

  const hasChanges = proposedChanges.length > 0;

  // Handle apply all changes
  const handleApplyAll = async () => {
    if (!hasChanges) return;
    const changeIds = proposedChanges.map(c => c.id);
    await applyChanges(changeIds, true, `Applied ${changeIds.length} changes`);
  };

  // Handle approval actions
  const handleApprovalAction = async () => {
    if (!showApprovalDialog) return;

    try {
      if (showApprovalDialog === 'submit') {
        const latestRevision = revisions[0];
        if (latestRevision) {
          await submitForReview(latestRevision.id, notes);
        }
      } else if (showApprovalDialog === 'approve' && currentApproval) {
        await review(currentApproval.id, 'approve', notes);
      } else if (showApprovalDialog === 'reject' && currentApproval) {
        await review(currentApproval.id, 'request_changes', notes);
      } else if (showApprovalDialog === 'publish' && currentApproval) {
        await publish(currentApproval.id, notes);
      }
    } finally {
      setShowApprovalDialog(null);
      setNotes('');
    }
  };

  return (
    <div
      className={cn(
        'bg-white border-b border-gray-200 px-4 py-2 flex items-center justify-between',
        className
      )}
    >
      {/* Left side: Edit mode toggle and status */}
      <div className="flex items-center gap-4">
        {/* Edit Mode Toggle */}
        <button
          onClick={toggleFeedbackMode}
          className={cn(
            'inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
            isEnabled
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          )}
        >
          <Edit3 className="w-4 h-4" />
          {isEnabled ? 'Exit Edit Mode' : 'Edit Mode'}
        </button>

        {/* Status Badge */}
        {showApproval && <StatusBadge status={pageStatus} />}

        {/* Pending Changes Indicator */}
        {hasChanges && (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-700 rounded-md text-xs font-medium">
            <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
            {proposedChanges.length} pending change
            {proposedChanges.length > 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Right side: Actions */}
      <div className="flex items-center gap-2">
        {/* Apply Changes */}
        {hasChanges && (
          <button
            onClick={handleApplyAll}
            disabled={isProcessing}
            className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Check className="w-4 h-4" />
            )}
            Apply Changes
          </button>
        )}

        {/* Preview Button */}
        {onPreviewClick && (
          <button
            onClick={onPreviewClick}
            className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-200"
          >
            <Eye className="w-4 h-4" />
            Preview
          </button>
        )}

        {/* History Button */}
        {showHistory && (
          <button
            onClick={() => {
              loadRevisions();
              onHistoryClick?.();
            }}
            className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-200"
          >
            <History className="w-4 h-4" />
            History
          </button>
        )}

        {/* Approval Actions Dropdown */}
        {showApproval && (canSubmit || canApprove || canPublish) && (
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
            >
              {canPublish ? (
                <>
                  <Send className="w-4 h-4" />
                  Publish
                </>
              ) : canApprove ? (
                <>
                  <Check className="w-4 h-4" />
                  Review
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Submit for Review
                </>
              )}
              <ChevronDown className="w-4 h-4" />
            </button>

            {/* Dropdown Menu */}
            {showMenu && (
              <div className="absolute right-0 mt-1 w-48 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-50">
                {canSubmit && (
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      setShowApprovalDialog('submit');
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    Submit for Review
                  </button>
                )}
                {canApprove && (
                  <>
                    <button
                      onClick={() => {
                        setShowMenu(false);
                        setShowApprovalDialog('approve');
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-green-700 hover:bg-green-50 flex items-center gap-2"
                    >
                      <Check className="w-4 h-4" />
                      Approve
                    </button>
                    <button
                      onClick={() => {
                        setShowMenu(false);
                        setShowApprovalDialog('reject');
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-orange-700 hover:bg-orange-50 flex items-center gap-2"
                    >
                      <RotateCcw className="w-4 h-4" />
                      Request Changes
                    </button>
                  </>
                )}
                {canPublish && (
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      setShowApprovalDialog('publish');
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-blue-700 hover:bg-blue-50 flex items-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    Publish Now
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Approval Dialog */}
      {showApprovalDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">
                {showApprovalDialog === 'submit' && 'Submit for Review'}
                {showApprovalDialog === 'approve' && 'Approve Changes'}
                {showApprovalDialog === 'reject' && 'Request Changes'}
                {showApprovalDialog === 'publish' && 'Publish Page'}
              </h3>
              <button
                onClick={() => setShowApprovalDialog(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes (optional)
              </label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="Add any notes..."
              />
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowApprovalDialog(null)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
              >
                Cancel
              </button>
              <button
                onClick={handleApprovalAction}
                disabled={isSubmitting}
                className={cn(
                  'px-4 py-2 rounded-md text-white flex items-center gap-2',
                  showApprovalDialog === 'reject'
                    ? 'bg-orange-600 hover:bg-orange-700'
                    : 'bg-blue-600 hover:bg-blue-700',
                  isSubmitting && 'opacity-50 cursor-not-allowed'
                )}
              >
                {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default FeedbackToolbar;
