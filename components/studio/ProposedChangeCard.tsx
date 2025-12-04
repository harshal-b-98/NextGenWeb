/**
 * Proposed Change Card Component
 * Displays AI-generated proposed changes with review/apply actions
 */

'use client';

import { useState } from 'react';
import { Sparkles, Check, X } from 'lucide-react';
import type { ProposedChange } from './ChatPanel';

interface ProposedChangeCardProps {
  change: ProposedChange;
  applied?: boolean; // New prop to indicate if change is already applied
  onApply?: () => void; // Optional now since changes auto-apply
  onReject?: () => void;
  onUndo?: () => void; // Optional undo callback
}

export function ProposedChangeCard({
  change,
  applied = true, // Default to true since changes auto-apply now
  onApply,
  onReject,
  onUndo,
}: ProposedChangeCardProps) {
  const [isApplying, setIsApplying] = useState(false);

  const handleApply = async () => {
    if (!onApply) return;
    setIsApplying(true);
    try {
      await onApply();
    } catch (error) {
      console.error('Failed to apply change:', error);
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <div className={`border rounded-lg p-4 ${
      applied
        ? 'border-green-200 bg-gradient-to-br from-green-50 to-emerald-50'
        : 'border-blue-200 bg-gradient-to-br from-blue-50 to-purple-50'
    }`}>
      <div className="flex items-start gap-3">
        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
          applied
            ? 'bg-gradient-to-br from-green-500 to-emerald-600'
            : 'bg-gradient-to-br from-purple-500 to-blue-600'
        }`}>
          {applied ? (
            <Check className="h-4 w-4 text-white" />
          ) : (
            <Sparkles className="h-4 w-4 text-white" />
          )}
        </div>
        <div className="flex-1">
          {/* Description with Applied Badge */}
          <div className="flex items-center gap-2 mb-2">
            <p className="text-sm font-medium text-gray-900">
              {change.description}
            </p>
            {applied && (
              <span className="px-2 py-0.5 text-xs font-medium text-green-700 bg-green-100 rounded-full">
                Applied
              </span>
            )}
          </div>

          {/* Before/After Preview (if available) */}
          {change.preview && (
            <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
              <div className="p-2 bg-white/50 rounded border border-gray-200">
                <p className="text-gray-500 font-medium mb-1">Before:</p>
                <p className="text-gray-700 line-through">
                  {change.preview.before}
                </p>
              </div>
              <div className={`p-2 bg-white/50 rounded border ${
                applied ? 'border-green-200' : 'border-blue-200'
              }`}>
                <p className={`font-medium mb-1 ${
                  applied ? 'text-green-600' : 'text-blue-600'
                }`}>After:</p>
                <p className={`font-medium ${
                  applied ? 'text-green-900' : 'text-blue-900'
                }`}>
                  {change.preview.after}
                </p>
              </div>
            </div>
          )}

          {/* Actions */}
          {applied ? (
            // Applied state - show undo option
            <div className="mt-3 flex items-center gap-2">
              <div className="flex-1 flex items-center gap-2 text-sm text-green-700">
                <Check className="h-4 w-4" />
                <span className="font-medium">Applied to preview</span>
              </div>
              {onUndo && (
                <button
                  onClick={onUndo}
                  className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                >
                  Undo
                </button>
              )}
            </div>
          ) : (
            // Pending state - show apply/reject buttons
            <div className="mt-3 flex gap-2">
              <button
                onClick={handleApply}
                disabled={isApplying || !onApply}
                className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {isApplying ? (
                  <>
                    <div className="animate-spin h-3 w-3 border-2 border-white border-t-transparent rounded-full" />
                    Applying...
                  </>
                ) : (
                  <>
                    <Check className="h-3 w-3" />
                    Apply Change
                  </>
                )}
              </button>
              {onReject && (
                <button
                  onClick={onReject}
                  disabled={isApplying}
                  className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
