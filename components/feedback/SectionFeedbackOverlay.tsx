'use client';

/**
 * Section Feedback Overlay
 * Epic #146: Iterative Website Feedback & Refinement System
 *
 * Story #152: Overlay component that makes sections clickable for feedback.
 */

import React from 'react';
import { Edit3, Check, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useFeedbackContext, useFeedbackEnabled } from './FeedbackModeProvider';

// ============================================================================
// TYPES
// ============================================================================

interface SectionFeedbackOverlayProps {
  sectionId: string;
  children: React.ReactNode;
  className?: string;
  componentId?: string;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function SectionFeedbackOverlay({
  sectionId,
  children,
  className,
  componentId,
}: SectionFeedbackOverlayProps) {
  const { isEnabled } = useFeedbackEnabled();
  const { selectedSectionId, selectSection, proposedChanges, isProcessing } =
    useFeedbackContext();

  const isSelected = selectedSectionId === sectionId;
  const hasChanges = proposedChanges.some(c => c.sectionId === sectionId);

  // Handle click on section
  const handleClick = (e: React.MouseEvent) => {
    if (!isEnabled) return;

    e.stopPropagation();
    selectSection(isSelected ? null : sectionId);
  };

  // If not in feedback mode, just render children
  if (!isEnabled) {
    return <>{children}</>;
  }

  return (
    <div
      className={cn(
        'relative group cursor-pointer transition-all duration-200',
        isSelected && 'ring-2 ring-blue-500 ring-offset-2 rounded-lg',
        hasChanges && !isSelected && 'ring-2 ring-amber-400 ring-offset-2 rounded-lg',
        className
      )}
      onClick={handleClick}
    >
      {/* Content */}
      {children}

      {/* Hover Overlay */}
      <div
        className={cn(
          'absolute inset-0 transition-opacity duration-200 pointer-events-none',
          'bg-blue-500/5 opacity-0 group-hover:opacity-100',
          isSelected && 'bg-blue-500/10 opacity-100'
        )}
      />

      {/* Section Label */}
      <div
        className={cn(
          'absolute top-2 left-2 flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium',
          'transition-opacity duration-200',
          'opacity-0 group-hover:opacity-100',
          isSelected
            ? 'bg-blue-600 text-white opacity-100'
            : hasChanges
            ? 'bg-amber-500 text-white opacity-100'
            : 'bg-gray-900/80 text-white'
        )}
      >
        {isProcessing && isSelected ? (
          <Loader2 className="w-3 h-3 animate-spin" />
        ) : hasChanges ? (
          <Check className="w-3 h-3" />
        ) : (
          <Edit3 className="w-3 h-3" />
        )}
        <span>
          {hasChanges
            ? `${proposedChanges.filter(c => c.sectionId === sectionId).length} changes`
            : isSelected
            ? 'Selected'
            : 'Click to edit'}
        </span>
        {componentId && (
          <span className="opacity-70 ml-1">({componentId})</span>
        )}
      </div>

      {/* Selection Indicator */}
      {isSelected && (
        <div className="absolute inset-0 pointer-events-none">
          {/* Corner indicators */}
          <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-blue-500 rounded-tl" />
          <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-blue-500 rounded-tr" />
          <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-blue-500 rounded-bl" />
          <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-blue-500 rounded-br" />
        </div>
      )}
    </div>
  );
}

// ============================================================================
// WRAPPER FOR ENTIRE PAGE
// ============================================================================

interface FeedbackOverlayContainerProps {
  children: React.ReactNode;
  className?: string;
}

export function FeedbackOverlayContainer({
  children,
  className,
}: FeedbackOverlayContainerProps) {
  const { isEnabled } = useFeedbackEnabled();
  const { selectSection } = useFeedbackContext();

  // Handle click outside sections to deselect
  const handleContainerClick = (e: React.MouseEvent) => {
    if (!isEnabled) return;

    // Only deselect if clicking directly on the container
    if (e.target === e.currentTarget) {
      selectSection(null);
    }
  };

  return (
    <div
      className={cn(
        'relative',
        isEnabled && 'min-h-screen',
        className
      )}
      onClick={handleContainerClick}
    >
      {children}

      {/* Edit Mode Indicator */}
      {isEnabled && (
        <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-full shadow-lg text-sm font-medium">
          <Edit3 className="w-4 h-4" />
          Edit Mode Active
        </div>
      )}
    </div>
  );
}

export default SectionFeedbackOverlay;
