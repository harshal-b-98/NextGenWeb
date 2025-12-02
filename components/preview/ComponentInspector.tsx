/**
 * Component Inspector
 * Phase 5.2: Preview System
 *
 * Overlay panel for inspecting sections and their properties in preview mode.
 */

'use client';

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { RuntimeSection } from '@/lib/runtime/types';
import type { PopulatedContent } from '@/lib/content/types';

interface ComponentInspectorProps {
  /** All sections in the page */
  sections: RuntimeSection[];

  /** Currently selected section ID */
  selectedSectionId: string | null;

  /** Active persona variant being displayed */
  activeVariant: string;

  /** Callback when section is selected */
  onSectionSelect: (sectionId: string | null) => void;

  /** Whether inspector is visible */
  isVisible: boolean;

  /** Toggle inspector visibility */
  onToggle: () => void;
}

export function ComponentInspector({
  sections,
  selectedSectionId,
  activeVariant,
  onSectionSelect,
  isVisible,
  onToggle,
}: ComponentInspectorProps) {
  const [expandedProps, setExpandedProps] = useState<Set<string>>(new Set(['content']));

  const selectedSection = sections.find((s) => s.sectionId === selectedSectionId);
  const selectedContent = selectedSection
    ? activeVariant !== 'default' && selectedSection.personaVariants[activeVariant]
      ? selectedSection.personaVariants[activeVariant]
      : selectedSection.defaultContent
    : null;

  const toggleExpanded = useCallback((key: string) => {
    setExpandedProps((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }, []);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ x: 320, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 320, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed right-0 top-0 bottom-0 w-80 bg-gray-900 border-l border-gray-700 shadow-2xl z-50 flex flex-col"
        >
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-700 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
              <h2 className="font-semibold text-white">Component Inspector</h2>
            </div>
            <button
              onClick={onToggle}
              className="p-1 text-gray-400 hover:text-white rounded"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Section List */}
          <div className="border-b border-gray-700">
            <div className="px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide">
              Page Sections ({sections.length})
            </div>
            <div className="max-h-48 overflow-y-auto">
              {sections.map((section, index) => (
                <button
                  key={section.sectionId}
                  onClick={() => onSectionSelect(
                    selectedSectionId === section.sectionId ? null : section.sectionId
                  )}
                  className={`w-full px-4 py-2 text-left flex items-center gap-3 hover:bg-gray-800 transition-colors ${
                    selectedSectionId === section.sectionId ? 'bg-blue-600/20 border-l-2 border-blue-500' : ''
                  }`}
                >
                  <span className="text-xs text-gray-500 font-mono w-6">{index + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-white truncate">{section.componentId}</div>
                    <div className="text-xs text-gray-500 truncate">{section.narrativeRole}</div>
                  </div>
                  {Object.keys(section.personaVariants).length > 0 && (
                    <span className="px-1.5 py-0.5 text-xs bg-purple-600/30 text-purple-400 rounded">
                      {Object.keys(section.personaVariants).length} variants
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Selected Section Details */}
          <div className="flex-1 overflow-y-auto">
            {selectedSection ? (
              <div className="p-4 space-y-4">
                {/* Section Info */}
                <div>
                  <h3 className="text-sm font-medium text-white mb-2">Section Details</h3>
                  <dl className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-gray-500">Component</dt>
                      <dd className="text-white font-mono text-xs">{selectedSection.componentId}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-500">Role</dt>
                      <dd className="text-white">{selectedSection.narrativeRole}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-500">Order</dt>
                      <dd className="text-white">{selectedSection.order}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-500">Section ID</dt>
                      <dd className="text-white font-mono text-xs truncate max-w-[150px]" title={selectedSection.sectionId}>
                        {selectedSection.sectionId.slice(0, 8)}...
                      </dd>
                    </div>
                  </dl>
                </div>

                {/* Persona Variants */}
                {Object.keys(selectedSection.personaVariants).length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-white mb-2">Available Variants</h3>
                    <div className="flex flex-wrap gap-1">
                      <span className={`px-2 py-1 text-xs rounded ${
                        activeVariant === 'default' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'
                      }`}>
                        default
                      </span>
                      {Object.keys(selectedSection.personaVariants).map((variantId) => (
                        <span
                          key={variantId}
                          className={`px-2 py-1 text-xs rounded ${
                            activeVariant === variantId ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'
                          }`}
                        >
                          {variantId}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Content Properties */}
                {selectedContent && (
                  <div>
                    <h3 className="text-sm font-medium text-white mb-2">Content Properties</h3>
                    <PropertyTree
                      data={selectedContent}
                      expandedKeys={expandedProps}
                      onToggle={toggleExpanded}
                      path=""
                    />
                  </div>
                )}
              </div>
            ) : (
              <div className="p-8 text-center text-gray-500">
                <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                </svg>
                <p>Select a section to inspect</p>
              </div>
            )}
          </div>

          {/* Footer Info */}
          <div className="px-4 py-2 border-t border-gray-700 bg-gray-800/50">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>Active Variant: <span className="text-blue-400">{activeVariant}</span></span>
              <span>{sections.length} sections</span>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * Property Tree Component
 * Renders nested object properties in a collapsible tree
 */
function PropertyTree({
  data,
  expandedKeys,
  onToggle,
  path,
  depth = 0,
}: {
  data: any;
  expandedKeys: Set<string>;
  onToggle: (key: string) => void;
  path: string;
  depth?: number;
}) {
  if (data === null || data === undefined) {
    return <span className="text-gray-500 italic">null</span>;
  }

  if (typeof data === 'string') {
    const truncated = data.length > 50 ? data.slice(0, 50) + '...' : data;
    return (
      <span className="text-green-400 break-all" title={data}>
        "{truncated}"
      </span>
    );
  }

  if (typeof data === 'number') {
    return <span className="text-yellow-400">{data}</span>;
  }

  if (typeof data === 'boolean') {
    return <span className="text-purple-400">{data.toString()}</span>;
  }

  if (Array.isArray(data)) {
    const fullPath = path || 'array';
    const isExpanded = expandedKeys.has(fullPath);

    if (data.length === 0) {
      return <span className="text-gray-500">[]</span>;
    }

    return (
      <div>
        <button
          onClick={() => onToggle(fullPath)}
          className="flex items-center gap-1 text-gray-400 hover:text-white"
        >
          <svg
            className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-blue-400">Array[{data.length}]</span>
        </button>
        {isExpanded && (
          <div className="ml-4 border-l border-gray-700 pl-2 mt-1 space-y-1">
            {data.slice(0, 10).map((item, index) => (
              <div key={index} className="flex gap-2">
                <span className="text-gray-600 text-xs">{index}:</span>
                <PropertyTree
                  data={item}
                  expandedKeys={expandedKeys}
                  onToggle={onToggle}
                  path={`${fullPath}.${index}`}
                  depth={depth + 1}
                />
              </div>
            ))}
            {data.length > 10 && (
              <div className="text-gray-500 text-xs">...and {data.length - 10} more</div>
            )}
          </div>
        )}
      </div>
    );
  }

  if (typeof data === 'object') {
    const keys = Object.keys(data);
    const fullPath = path || 'object';
    const isExpanded = expandedKeys.has(fullPath);

    if (keys.length === 0) {
      return <span className="text-gray-500">{'{}'}</span>;
    }

    return (
      <div>
        <button
          onClick={() => onToggle(fullPath)}
          className="flex items-center gap-1 text-gray-400 hover:text-white"
        >
          <svg
            className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-blue-400">Object{`{${keys.length}}`}</span>
        </button>
        {isExpanded && (
          <div className="ml-4 border-l border-gray-700 pl-2 mt-1 space-y-1">
            {keys.slice(0, 20).map((key) => (
              <div key={key} className="flex gap-2">
                <span className="text-cyan-400 text-xs">{key}:</span>
                <PropertyTree
                  data={data[key]}
                  expandedKeys={expandedKeys}
                  onToggle={onToggle}
                  path={`${fullPath}.${key}`}
                  depth={depth + 1}
                />
              </div>
            ))}
            {keys.length > 20 && (
              <div className="text-gray-500 text-xs">...and {keys.length - 20} more</div>
            )}
          </div>
        )}
      </div>
    );
  }

  return <span className="text-gray-500">{String(data)}</span>;
}

export default ComponentInspector;
