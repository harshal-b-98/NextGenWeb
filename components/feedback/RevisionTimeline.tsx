'use client';

/**
 * Revision Timeline
 * Epic #146: Iterative Website Feedback & Refinement System
 *
 * Story #157: Visual timeline showing page revision history with rollback capability.
 */

import React, { useState } from 'react';
import {
  X,
  Clock,
  RotateCcw,
  Eye,
  GitCompare,
  Loader2,
  Check,
  AlertCircle,
  RefreshCw,
  MessageSquare,
  Undo,
  Pencil,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePageRevisions } from './FeedbackModeProvider';
import type { RevisionType } from '@/lib/feedback/types';

// ============================================================================
// TYPES
// ============================================================================

interface RevisionTimelineProps {
  className?: string;
  onClose?: () => void;
  onPreviewRevision?: (revisionId: string) => void;
}

// ============================================================================
// REVISION TYPE CONFIG
// ============================================================================

const REVISION_TYPE_CONFIG: Record<
  RevisionType,
  { label: string; icon: typeof Clock; color: string }
> = {
  initial: {
    label: 'Initial',
    icon: Sparkles,
    color: 'text-purple-600 bg-purple-100',
  },
  feedback: {
    label: 'Feedback',
    icon: MessageSquare,
    color: 'text-blue-600 bg-blue-100',
  },
  rollback: {
    label: 'Rollback',
    icon: Undo,
    color: 'text-orange-600 bg-orange-100',
  },
  manual: {
    label: 'Manual Edit',
    icon: Pencil,
    color: 'text-gray-600 bg-gray-100',
  },
  regeneration: {
    label: 'Regenerated',
    icon: RefreshCw,
    color: 'text-green-600 bg-green-100',
  },
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function RevisionTimeline({
  className,
  onClose,
  onPreviewRevision,
}: RevisionTimelineProps) {
  const {
    revisions,
    isLoading,
    selectedRevisionId,
    comparingWith,
    diff,
    loadRevisions,
    selectRevision,
    compareRevisions,
    rollbackTo,
    previewRevision,
    clearComparison,
  } = usePageRevisions();

  const [isRollingBack, setIsRollingBack] = useState(false);
  const [rollbackTarget, setRollbackTarget] = useState<string | null>(null);

  // Handle rollback
  const handleRollback = async (revisionId: string) => {
    if (isRollingBack) return;

    setIsRollingBack(true);
    setRollbackTarget(revisionId);

    try {
      await rollbackTo(revisionId);
    } finally {
      setIsRollingBack(false);
      setRollbackTarget(null);
    }
  };

  // Handle preview
  const handlePreview = async (revisionId: string) => {
    selectRevision(revisionId);
    const snapshot = await previewRevision(revisionId);
    onPreviewRevision?.(revisionId);
    return snapshot;
  };

  // Handle compare
  const handleCompare = async (fromId: string, toId: string) => {
    await compareRevisions(fromId, toId);
  };

  // Format relative time
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;

    return date.toLocaleDateString();
  };

  return (
    <div
      className={cn(
        'bg-white border-l border-gray-200 w-80 flex flex-col',
        className
      )}
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-gray-500" />
          <h3 className="font-semibold text-gray-900">Revision History</h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => loadRevisions()}
            disabled={isLoading}
            className="text-gray-400 hover:text-gray-600"
            title="Refresh"
          >
            <RefreshCw
              className={cn('w-4 h-4', isLoading && 'animate-spin')}
            />
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Comparison Mode Banner */}
      {comparingWith && (
        <div className="px-4 py-2 bg-blue-50 border-b border-blue-100 flex items-center justify-between">
          <div className="text-sm text-blue-700">
            <GitCompare className="w-4 h-4 inline mr-1" />
            Comparing revisions
          </div>
          <button
            onClick={clearComparison}
            className="text-blue-600 hover:text-blue-800 text-sm"
          >
            Clear
          </button>
        </div>
      )}

      {/* Loading State */}
      {isLoading && revisions.length === 0 && (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
        </div>
      )}

      {/* Empty State */}
      {!isLoading && revisions.length === 0 && (
        <div className="flex-1 flex items-center justify-center p-6 text-center text-gray-500">
          <div>
            <Clock className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="font-medium">No Revisions</p>
            <p className="text-sm mt-1">
              Revisions will appear here when you make changes
            </p>
          </div>
        </div>
      )}

      {/* Timeline */}
      {revisions.length > 0 && (
        <div className="flex-1 overflow-y-auto">
          <div className="relative px-4 py-2">
            {/* Timeline Line */}
            <div className="absolute left-7 top-0 bottom-0 w-px bg-gray-200" />

            {/* Revision Items */}
            {revisions.map((revision, index) => {
              const config = REVISION_TYPE_CONFIG[revision.revisionType];
              const isSelected = selectedRevisionId === revision.id;
              const isComparing = comparingWith === revision.id;
              const isCurrent = index === 0;

              return (
                <div key={revision.id} className="relative pb-4">
                  {/* Timeline Dot */}
                  <div
                    className={cn(
                      'absolute left-4 w-6 h-6 rounded-full flex items-center justify-center',
                      config.color,
                      isSelected && 'ring-2 ring-blue-500'
                    )}
                  >
                    <config.icon className="w-3 h-3" />
                  </div>

                  {/* Content */}
                  <div
                    className={cn(
                      'ml-12 p-3 rounded-lg border transition-colors',
                      isSelected
                        ? 'border-blue-300 bg-blue-50'
                        : isComparing
                        ? 'border-purple-300 bg-purple-50'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    )}
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">
                        v{revision.revisionNumber}
                        {isCurrent && (
                          <span className="ml-2 text-xs text-green-600 bg-green-100 px-1.5 py-0.5 rounded">
                            Current
                          </span>
                        )}
                      </span>
                      <span className="text-xs text-gray-500">
                        {formatTime(revision.createdAt)}
                      </span>
                    </div>

                    {/* Summary */}
                    <p className="text-sm text-gray-600 mb-2">
                      {revision.changeSummary}
                    </p>

                    {/* Sections Modified */}
                    {revision.sectionsModified.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {revision.sectionsModified.slice(0, 3).map(sectionId => (
                          <span
                            key={sectionId}
                            className="text-xs px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded"
                          >
                            {sectionId.slice(0, 8)}
                          </span>
                        ))}
                        {revision.sectionsModified.length > 3 && (
                          <span className="text-xs text-gray-500">
                            +{revision.sectionsModified.length - 3} more
                          </span>
                        )}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handlePreview(revision.id)}
                        className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800"
                      >
                        <Eye className="w-3 h-3" />
                        Preview
                      </button>

                      {!isCurrent && (
                        <>
                          <button
                            onClick={() =>
                              handleCompare(revision.id, revisions[0].id)
                            }
                            className="flex items-center gap-1 text-xs text-purple-600 hover:text-purple-800"
                          >
                            <GitCompare className="w-3 h-3" />
                            Compare
                          </button>

                          <button
                            onClick={() => handleRollback(revision.id)}
                            disabled={isRollingBack}
                            className="flex items-center gap-1 text-xs text-orange-600 hover:text-orange-800 disabled:opacity-50"
                          >
                            {isRollingBack && rollbackTarget === revision.id ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <RotateCcw className="w-3 h-3" />
                            )}
                            Rollback
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Diff View */}
      {diff && (
        <div className="border-t border-gray-200 p-4 max-h-64 overflow-y-auto">
          <h4 className="text-xs font-medium text-gray-500 uppercase mb-2">
            Changes
          </h4>

          <div className="space-y-2">
            {/* Summary */}
            <div className="flex items-center gap-4 text-sm">
              {diff.summary.sectionsAdded > 0 && (
                <span className="text-green-600">
                  +{diff.summary.sectionsAdded} added
                </span>
              )}
              {diff.summary.sectionsRemoved > 0 && (
                <span className="text-red-600">
                  -{diff.summary.sectionsRemoved} removed
                </span>
              )}
              {diff.summary.sectionsModified > 0 && (
                <span className="text-blue-600">
                  ~{diff.summary.sectionsModified} modified
                </span>
              )}
            </div>

            {/* Major Changes */}
            {diff.summary.majorChanges.length > 0 && (
              <ul className="text-sm text-gray-600 space-y-1">
                {diff.summary.majorChanges.map((change, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                    {change}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default RevisionTimeline;
