'use client';

/**
 * Feedback Panel
 * Epic #146: Iterative Website Feedback & Refinement System
 *
 * Story #152: Side panel for providing visual feedback on selected sections.
 */

import React, { useState } from 'react';
import {
  X,
  Send,
  Loader2,
  Sparkles,
  Type,
  Palette,
  LayoutGrid,
  Trash2,
  Plus,
  ArrowUpDown,
  Check,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useFeedbackContext } from './FeedbackModeProvider';
import type { FeedbackType, ProposedChange } from '@/lib/feedback/types';

// ============================================================================
// TYPES
// ============================================================================

interface FeedbackPanelProps {
  className?: string;
  onClose?: () => void;
}

interface QuickAction {
  label: string;
  prompt: string;
  type: FeedbackType;
}

// ============================================================================
// QUICK ACTIONS
// ============================================================================

const QUICK_ACTIONS: QuickAction[] = [
  { label: 'Make it shorter', prompt: 'Make this content more concise', type: 'content' },
  { label: 'More professional', prompt: 'Make the tone more professional', type: 'content' },
  { label: 'Add urgency', prompt: 'Add more urgency to the copy', type: 'content' },
  { label: 'Stronger CTA', prompt: 'Make the call-to-action more compelling', type: 'content' },
];

const FEEDBACK_TYPE_OPTIONS: { type: FeedbackType; label: string; icon: typeof Type }[] = [
  { type: 'content', label: 'Content', icon: Type },
  { type: 'style', label: 'Style', icon: Palette },
  { type: 'layout', label: 'Layout', icon: LayoutGrid },
  { type: 'remove', label: 'Remove', icon: Trash2 },
  { type: 'add', label: 'Add', icon: Plus },
  { type: 'reorder', label: 'Reorder', icon: ArrowUpDown },
];

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function FeedbackPanel({ className, onClose }: FeedbackPanelProps) {
  const {
    selectedSectionId,
    selectSection,
    addFeedback,
    submitFeedback,
    proposedChanges,
    applyChanges,
    isProcessing,
    pageId,
  } = useFeedbackContext();

  const [feedbackText, setFeedbackText] = useState('');
  const [selectedType, setSelectedType] = useState<FeedbackType>('content');
  const [targetField, setTargetField] = useState<string>('');
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const [expandedChanges, setExpandedChanges] = useState<Set<string>>(new Set());

  // Filter changes for selected section
  const sectionChanges = proposedChanges.filter(
    c => c.sectionId === selectedSectionId
  );

  // Handle quick action
  const handleQuickAction = async (action: QuickAction) => {
    if (!selectedSectionId) return;

    await submitFeedback([
      {
        pageId,
        sectionId: selectedSectionId,
        feedbackText: action.prompt,
        feedbackType: action.type,
      },
    ]);
  };

  // Handle custom feedback submission
  const handleSubmit = async () => {
    if (!feedbackText.trim() || !selectedSectionId) return;

    await submitFeedback([
      {
        pageId,
        sectionId: selectedSectionId,
        feedbackText,
        feedbackType: selectedType,
        targetField: targetField || undefined,
      },
    ]);

    setFeedbackText('');
    setTargetField('');
  };

  // Handle apply single change
  const handleApplyChange = async (changeId: string) => {
    await applyChanges([changeId], true);
  };

  // Toggle change expansion
  const toggleExpanded = (id: string) => {
    setExpandedChanges(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  if (!selectedSectionId) {
    return (
      <div
        className={cn(
          'bg-white border-l border-gray-200 w-80 flex flex-col',
          className
        )}
      >
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">Feedback</h3>
          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
        <div className="flex-1 flex items-center justify-center p-6 text-center text-gray-500">
          <div>
            <LayoutGrid className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="font-medium">No Section Selected</p>
            <p className="text-sm mt-1">
              Click on a section in the preview to provide feedback
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'bg-white border-l border-gray-200 w-80 flex flex-col',
        className
      )}
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-gray-900">Feedback</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Section: {selectedSectionId.slice(0, 8)}...
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => selectSection(null)}
            className="text-gray-400 hover:text-gray-600"
            title="Deselect section"
          >
            <X className="w-5 h-5" />
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

      <div className="flex-1 overflow-y-auto">
        {/* Quick Actions */}
        <div className="p-4 border-b border-gray-100">
          <h4 className="text-xs font-medium text-gray-500 uppercase mb-2">
            Quick Actions
          </h4>
          <div className="flex flex-wrap gap-2">
            {QUICK_ACTIONS.map(action => (
              <button
                key={action.label}
                onClick={() => handleQuickAction(action)}
                disabled={isProcessing}
                className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm rounded-full transition-colors disabled:opacity-50"
              >
                {action.label}
              </button>
            ))}
          </div>
        </div>

        {/* Custom Feedback Input */}
        <div className="p-4 border-b border-gray-100">
          <h4 className="text-xs font-medium text-gray-500 uppercase mb-2">
            Custom Feedback
          </h4>

          {/* Feedback Type Selector */}
          <div className="relative mb-3">
            <button
              onClick={() => setShowTypeDropdown(!showTypeDropdown)}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm text-left flex items-center justify-between"
            >
              <span className="flex items-center gap-2">
                {React.createElement(
                  FEEDBACK_TYPE_OPTIONS.find(o => o.type === selectedType)?.icon || Type,
                  { className: 'w-4 h-4' }
                )}
                {FEEDBACK_TYPE_OPTIONS.find(o => o.type === selectedType)?.label}
              </span>
              <ChevronDown className="w-4 h-4" />
            </button>

            {showTypeDropdown && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-10">
                {FEEDBACK_TYPE_OPTIONS.map(option => (
                  <button
                    key={option.type}
                    onClick={() => {
                      setSelectedType(option.type);
                      setShowTypeDropdown(false);
                    }}
                    className="w-full px-3 py-2 text-sm text-left flex items-center gap-2 hover:bg-gray-50"
                  >
                    <option.icon className="w-4 h-4" />
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Target Field (optional) */}
          <input
            type="text"
            value={targetField}
            onChange={e => setTargetField(e.target.value)}
            placeholder="Target field (optional, e.g., headline)"
            className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          {/* Feedback Text */}
          <textarea
            value={feedbackText}
            onChange={e => setFeedbackText(e.target.value)}
            placeholder="Describe what you want to change..."
            className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
          />

          <button
            onClick={handleSubmit}
            disabled={!feedbackText.trim() || isProcessing}
            className="mt-2 w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            Generate Changes
          </button>
        </div>

        {/* Proposed Changes */}
        {sectionChanges.length > 0 && (
          <div className="p-4">
            <h4 className="text-xs font-medium text-gray-500 uppercase mb-2">
              Proposed Changes ({sectionChanges.length})
            </h4>

            <div className="space-y-2">
              {sectionChanges.map(change => (
                <ProposedChangeCard
                  key={change.id}
                  change={change}
                  isExpanded={expandedChanges.has(change.id)}
                  onToggle={() => toggleExpanded(change.id)}
                  onApply={() => handleApplyChange(change.id)}
                  isApplying={isProcessing}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// PROPOSED CHANGE CARD
// ============================================================================

interface ProposedChangeCardProps {
  change: ProposedChange;
  isExpanded: boolean;
  onToggle: () => void;
  onApply: () => void;
  isApplying: boolean;
}

function ProposedChangeCard({
  change,
  isExpanded,
  onToggle,
  onApply,
  isApplying,
}: ProposedChangeCardProps) {
  return (
    <div className="border border-gray-200 rounded-md overflow-hidden">
      {/* Header */}
      <button
        onClick={onToggle}
        className="w-full px-3 py-2 flex items-center justify-between bg-gray-50 hover:bg-gray-100"
      >
        <div className="flex items-center gap-2 text-sm">
          {isExpanded ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
          <span className="font-medium capitalize">{change.changeType}</span>
          <span className="text-gray-500">
            ({Math.round(change.confidence * 100)}% confidence)
          </span>
        </div>
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="p-3 border-t border-gray-200">
          <p className="text-sm text-gray-600 mb-3">{change.description}</p>

          {/* Before/After Preview */}
          {change.before && change.after && (
            <div className="space-y-2 mb-3">
              {Object.keys(change.after).map(key => (
                <div key={key} className="text-xs">
                  <span className="font-medium text-gray-500">{key}:</span>
                  <div className="mt-1 grid grid-cols-2 gap-2">
                    <div className="p-2 bg-red-50 rounded border border-red-100 line-through text-red-700">
                      {String((change.before as Record<string, unknown>)[key] || '(empty)')}
                    </div>
                    <div className="p-2 bg-green-50 rounded border border-green-100 text-green-700">
                      {String((change.after as Record<string, unknown>)[key])}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <button
            onClick={onApply}
            disabled={isApplying}
            className="w-full flex items-center justify-center gap-2 px-3 py-1.5 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:opacity-50"
          >
            {isApplying ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Check className="w-4 h-4" />
            )}
            Apply This Change
          </button>
        </div>
      )}
    </div>
  );
}

export default FeedbackPanel;
