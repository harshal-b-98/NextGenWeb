/**
 * Section Overlay Component
 *
 * Provides visual feedback and click-to-select functionality for sections
 * in preview mode. Shows hover outline and selected state.
 *
 * Epic #146: Interactive Website Feedback & Refinement System
 */

'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface SectionOverlayProps {
  sectionId: string;
  isSelected: boolean;
  onClick: (sectionId: string) => void;
  children: React.ReactNode;
  disabled?: boolean;
}

export function SectionOverlay({
  sectionId,
  isSelected,
  onClick,
  children,
  disabled = false,
}: SectionOverlayProps) {
  const [isHovered, setIsHovered] = useState(false);

  const handleClick = () => {
    if (!disabled) {
      onClick(sectionId);
    }
  };

  return (
    <div
      className="relative"
      onMouseEnter={() => !disabled && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
    >
      {/* Content */}
      {children}

      {/* Hover Outline */}
      <AnimatePresence>
        {isHovered && !isSelected && !disabled && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="absolute inset-0 pointer-events-none border-2 border-blue-400 rounded-lg"
            style={{ zIndex: 10 }}
          >
            {/* Tooltip */}
            <div className="absolute top-2 right-2 px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-md shadow-lg">
              Click to edit
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Selected State */}
      <AnimatePresence>
        {isSelected && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 pointer-events-none"
            style={{ zIndex: 20 }}
          >
            {/* Selection Ring */}
            <div className="absolute inset-0 border-4 border-blue-600 rounded-lg shadow-lg" />

            {/* Corner Badge */}
            <div className="absolute top-2 left-2 px-3 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-md shadow-lg flex items-center space-x-1">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
              <span>Selected</span>
            </div>

            {/* Pulse Animation */}
            <motion.div
              initial={{ opacity: 0.6 }}
              animate={{ opacity: [0.6, 0.3, 0.6] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute inset-0 bg-blue-100 rounded-lg"
              style={{ zIndex: -1 }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cursor style */}
      <style jsx>{`
        div {
          cursor: ${disabled ? 'default' : isHovered || isSelected ? 'pointer' : 'default'};
        }
      `}</style>
    </div>
  );
}

/**
 * Wrapper component to add section overlay to any section
 */
interface SectionWithOverlayProps {
  section: {
    id: string;
    componentId?: string;
    content: any;
  };
  isSelected: boolean;
  feedbackMode: boolean;
  onSectionClick: (sectionId: string) => void;
  children: React.ReactNode;
}

export function SectionWithOverlay({
  section,
  isSelected,
  feedbackMode,
  onSectionClick,
  children,
}: SectionWithOverlayProps) {
  // Only show overlay in feedback mode
  if (!feedbackMode) {
    return <>{children}</>;
  }

  return (
    <SectionOverlay
      sectionId={section.id}
      isSelected={isSelected}
      onClick={onSectionClick}
    >
      {children}
    </SectionOverlay>
  );
}
