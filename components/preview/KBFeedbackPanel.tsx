/**
 * KB-Enhanced Feedback Panel
 * Story 7.6: Enhanced Feedback Panel with KB Indicators
 *
 * Shows KB traceability information for each section, including:
 * - Source entities used to generate content
 * - Confidence scores
 * - Fallback indicators
 * - Coverage metrics
 */

'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { RuntimeSection } from '@/lib/runtime/types';
import type { KBTraceability } from '@/lib/content/kb-grounded-content';
import type { EntityType } from '@/lib/ai/types';

// =============================================================================
// TYPES
// =============================================================================

export interface SectionKBInfo {
  sectionId: string;
  traceability?: KBTraceability;
  /** Content fields and their source entities */
  fieldSources?: Record<string, string[]>;
  /** KB coverage for this section */
  coverage?: {
    score: number;
    missingEntityTypes: EntityType[];
    usedEntityTypes: EntityType[];
  };
}

interface KBFeedbackPanelProps {
  /** All sections with their KB info */
  sections: RuntimeSection[];
  /** KB info for each section */
  sectionKBInfo: Record<string, SectionKBInfo>;
  /** Currently selected section ID */
  selectedSectionId: string | null;
  /** Callback when section is selected */
  onSectionSelect: (sectionId: string | null) => void;
  /** Callback when user wants to add KB content */
  onAddKBContent?: (entityType: EntityType) => void;
  /** Callback when user submits feedback */
  onSubmitFeedback?: (sectionId: string, feedback: string) => void;
  /** Whether panel is visible */
  isVisible: boolean;
  /** Toggle panel visibility */
  onToggle: () => void;
  /** Overall KB coverage score */
  overallCoverage?: number;
}

// =============================================================================
// ENTITY TYPE COLORS
// =============================================================================

const ENTITY_TYPE_COLORS: Record<EntityType, { bg: string; text: string; border: string }> = {
  product: { bg: 'bg-blue-500/20', text: 'text-blue-300', border: 'border-blue-500/30' },
  service: { bg: 'bg-cyan-500/20', text: 'text-cyan-300', border: 'border-cyan-500/30' },
  feature: { bg: 'bg-green-500/20', text: 'text-green-300', border: 'border-green-500/30' },
  benefit: { bg: 'bg-emerald-500/20', text: 'text-emerald-300', border: 'border-emerald-500/30' },
  pricing: { bg: 'bg-orange-500/20', text: 'text-orange-300', border: 'border-orange-500/30' },
  testimonial: { bg: 'bg-pink-500/20', text: 'text-pink-300', border: 'border-pink-500/30' },
  company: { bg: 'bg-indigo-500/20', text: 'text-indigo-300', border: 'border-indigo-500/30' },
  person: { bg: 'bg-violet-500/20', text: 'text-violet-300', border: 'border-violet-500/30' },
  statistic: { bg: 'bg-purple-500/20', text: 'text-purple-300', border: 'border-purple-500/30' },
  faq: { bg: 'bg-rose-500/20', text: 'text-rose-300', border: 'border-rose-500/30' },
  cta: { bg: 'bg-red-500/20', text: 'text-red-300', border: 'border-red-500/30' },
  process_step: { bg: 'bg-teal-500/20', text: 'text-teal-300', border: 'border-teal-500/30' },
  use_case: { bg: 'bg-lime-500/20', text: 'text-lime-300', border: 'border-lime-500/30' },
  integration: { bg: 'bg-amber-500/20', text: 'text-amber-300', border: 'border-amber-500/30' },
  contact: { bg: 'bg-sky-500/20', text: 'text-sky-300', border: 'border-sky-500/30' },
  company_name: { bg: 'bg-blue-500/20', text: 'text-blue-300', border: 'border-blue-500/30' },
  company_tagline: { bg: 'bg-fuchsia-500/20', text: 'text-fuchsia-300', border: 'border-fuchsia-500/30' },
  company_description: { bg: 'bg-stone-500/20', text: 'text-stone-300', border: 'border-stone-500/30' },
  mission_statement: { bg: 'bg-yellow-500/20', text: 'text-yellow-300', border: 'border-yellow-500/30' },
  social_link: { bg: 'bg-blue-500/20', text: 'text-blue-300', border: 'border-blue-500/30' },
  nav_category: { bg: 'bg-gray-500/20', text: 'text-gray-300', border: 'border-gray-500/30' },
  brand_voice: { bg: 'bg-amber-500/20', text: 'text-amber-300', border: 'border-amber-500/30' },
};

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function KBFeedbackPanel({
  sections,
  sectionKBInfo,
  selectedSectionId,
  onSectionSelect,
  onAddKBContent,
  onSubmitFeedback,
  isVisible,
  onToggle,
  overallCoverage = 0,
}: KBFeedbackPanelProps) {
  const [feedbackText, setFeedbackText] = useState('');
  const [activeTab, setActiveTab] = useState<'sections' | 'coverage' | 'feedback'>('sections');
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  const selectedSection = sections.find((s) => s.sectionId === selectedSectionId);
  const selectedKBInfo = selectedSectionId ? sectionKBInfo[selectedSectionId] : null;

  const toggleSectionExpanded = (sectionId: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(sectionId)) {
        next.delete(sectionId);
      } else {
        next.add(sectionId);
      }
      return next;
    });
  };

  const handleSubmitFeedback = () => {
    if (selectedSectionId && feedbackText.trim() && onSubmitFeedback) {
      onSubmitFeedback(selectedSectionId, feedbackText.trim());
      setFeedbackText('');
    }
  };

  // Calculate section coverage stats
  const sectionStats = sections.map((section) => {
    const kbInfo = sectionKBInfo[section.sectionId];
    return {
      sectionId: section.sectionId,
      componentId: section.componentId,
      narrativeRole: section.narrativeRole,
      hasKBData: (kbInfo?.traceability?.sourceEntityIds?.length ?? 0) > 0,
      confidence: kbInfo?.traceability?.confidence ?? 0,
      isGenericFallback: kbInfo?.traceability?.isGenericFallback ?? true,
      entityTypesUsed: kbInfo?.traceability?.entityTypesUsed ?? [],
    };
  });

  const kbGroundedSections = sectionStats.filter((s) => s.hasKBData && !s.isGenericFallback).length;
  const fallbackSections = sectionStats.filter((s) => s.isGenericFallback).length;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ x: 400, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 400, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed right-0 top-0 bottom-0 w-96 bg-gray-900 border-l border-gray-700 shadow-2xl z-50 flex flex-col"
        >
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-700">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h2 className="font-semibold text-white">KB-Grounded Content</h2>
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

            {/* Overall Coverage Bar */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-400">Overall KB Coverage</span>
                <span className={`font-medium ${
                  overallCoverage >= 70 ? 'text-emerald-400' :
                  overallCoverage >= 40 ? 'text-yellow-400' : 'text-red-400'
                }`}>
                  {overallCoverage}%
                </span>
              </div>
              <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${
                    overallCoverage >= 70 ? 'bg-emerald-500' :
                    overallCoverage >= 40 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${overallCoverage}%` }}
                />
              </div>
              <div className="flex items-center gap-3 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full" />
                  {kbGroundedSections} KB-grounded
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-yellow-500 rounded-full" />
                  {fallbackSections} fallback
                </span>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-700">
            {(['sections', 'coverage', 'feedback'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
                  activeTab === tab
                    ? 'text-blue-400 border-b-2 border-blue-400 bg-gray-800/50'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto">
            {activeTab === 'sections' && (
              <SectionsTab
                sections={sections}
                sectionKBInfo={sectionKBInfo}
                selectedSectionId={selectedSectionId}
                onSectionSelect={onSectionSelect}
                expandedSections={expandedSections}
                toggleSectionExpanded={toggleSectionExpanded}
              />
            )}

            {activeTab === 'coverage' && (
              <CoverageTab
                sectionStats={sectionStats}
                sectionKBInfo={sectionKBInfo}
                onAddKBContent={onAddKBContent}
              />
            )}

            {activeTab === 'feedback' && (
              <FeedbackTab
                selectedSection={selectedSection}
                selectedKBInfo={selectedKBInfo}
                feedbackText={feedbackText}
                setFeedbackText={setFeedbackText}
                onSubmitFeedback={handleSubmitFeedback}
              />
            )}
          </div>

          {/* Selected Section Footer */}
          {selectedSectionId && selectedKBInfo && (
            <div className="px-4 py-3 border-t border-gray-700 bg-gray-800/50">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-400">
                  Selected: <span className="text-white">{selectedSection?.componentId}</span>
                </span>
                <span className={`px-2 py-0.5 rounded ${
                  selectedKBInfo.traceability?.isGenericFallback
                    ? 'bg-yellow-500/20 text-yellow-300'
                    : 'bg-emerald-500/20 text-emerald-300'
                }`}>
                  {selectedKBInfo.traceability?.isGenericFallback ? 'Fallback' : 'KB-Grounded'}
                </span>
              </div>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// =============================================================================
// SECTIONS TAB
// =============================================================================

function SectionsTab({
  sections,
  sectionKBInfo,
  selectedSectionId,
  onSectionSelect,
  expandedSections,
  toggleSectionExpanded,
}: {
  sections: RuntimeSection[];
  sectionKBInfo: Record<string, SectionKBInfo>;
  selectedSectionId: string | null;
  onSectionSelect: (sectionId: string | null) => void;
  expandedSections: Set<string>;
  toggleSectionExpanded: (sectionId: string) => void;
}) {
  return (
    <div className="divide-y divide-gray-800">
      {sections.map((section, index) => {
        const kbInfo = sectionKBInfo[section.sectionId];
        const isSelected = selectedSectionId === section.sectionId;
        const isExpanded = expandedSections.has(section.sectionId);
        const confidence = kbInfo?.traceability?.confidence ?? 0;
        const isGenericFallback = kbInfo?.traceability?.isGenericFallback ?? true;
        const entityTypes = kbInfo?.traceability?.entityTypesUsed ?? [];

        return (
          <div key={section.sectionId} className="group">
            <button
              onClick={() => onSectionSelect(isSelected ? null : section.sectionId)}
              className={`w-full px-4 py-3 text-left transition-colors ${
                isSelected ? 'bg-blue-600/20' : 'hover:bg-gray-800/50'
              }`}
            >
              <div className="flex items-start gap-3">
                <span className="text-xs text-gray-600 font-mono mt-1 w-5">{index + 1}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-white font-medium truncate">{section.componentId}</span>
                    {isGenericFallback ? (
                      <span className="px-1.5 py-0.5 text-xs bg-yellow-500/20 text-yellow-300 rounded">
                        Fallback
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.5 text-xs bg-emerald-500/20 text-emerald-300 rounded">
                        KB
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">{section.narrativeRole}</div>

                  {/* Confidence Bar */}
                  {!isGenericFallback && (
                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex-1 h-1 bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500"
                          style={{ width: `${confidence * 100}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-500">{Math.round(confidence * 100)}%</span>
                    </div>
                  )}
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleSectionExpanded(section.sectionId);
                  }}
                  className="p-1 text-gray-500 hover:text-white"
                >
                  <svg
                    className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>
            </button>

            {/* Expanded Details */}
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden bg-gray-800/30"
                >
                  <div className="px-4 py-3 pl-12 space-y-3">
                    {/* Entity Types Used */}
                    {entityTypes.length > 0 && (
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Source Entity Types</div>
                        <div className="flex flex-wrap gap-1">
                          {entityTypes.map((type) => {
                            const colors = ENTITY_TYPE_COLORS[type] || { bg: 'bg-gray-500/20', text: 'text-gray-300', border: 'border-gray-500/30' };
                            return (
                              <span
                                key={type}
                                className={`px-2 py-0.5 text-xs rounded border ${colors.bg} ${colors.text} ${colors.border}`}
                              >
                                {type.replace(/_/g, ' ')}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Source Entity Count */}
                    {kbInfo?.traceability?.sourceEntityIds && kbInfo.traceability.sourceEntityIds.length > 0 && (
                      <div className="flex items-center gap-2 text-xs">
                        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                        <span className="text-gray-400">
                          {kbInfo.traceability.sourceEntityIds.length} source entities used
                        </span>
                      </div>
                    )}

                    {/* Field Sources */}
                    {kbInfo?.fieldSources && Object.keys(kbInfo.fieldSources).length > 0 && (
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Content Fields</div>
                        <div className="space-y-1">
                          {Object.entries(kbInfo.fieldSources).map(([field, entityIds]) => (
                            <div key={field} className="flex items-center justify-between text-xs">
                              <span className="text-gray-400">{field}</span>
                              <span className="text-emerald-400">{entityIds.length} sources</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Missing Data Warning */}
                    {isGenericFallback && (
                      <div className="flex items-start gap-2 p-2 bg-yellow-500/10 border border-yellow-500/20 rounded text-xs text-yellow-300">
                        <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <span>Using generic fallback content. Upload documents with relevant information to improve this section.</span>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}

// =============================================================================
// COVERAGE TAB
// =============================================================================

function CoverageTab({
  sectionStats,
  sectionKBInfo,
  onAddKBContent,
}: {
  sectionStats: Array<{
    sectionId: string;
    componentId: string;
    narrativeRole: string;
    hasKBData: boolean;
    confidence: number;
    isGenericFallback: boolean;
    entityTypesUsed: EntityType[];
  }>;
  sectionKBInfo: Record<string, SectionKBInfo>;
  onAddKBContent?: (entityType: EntityType) => void;
}) {
  // Collect all missing entity types across sections
  const missingEntityTypes = new Set<EntityType>();
  Object.values(sectionKBInfo).forEach((info) => {
    info.coverage?.missingEntityTypes.forEach((type) => missingEntityTypes.add(type));
  });

  // Get unique entity types used
  const usedEntityTypes = new Set<EntityType>();
  sectionStats.forEach((stat) => {
    stat.entityTypesUsed.forEach((type) => usedEntityTypes.add(type));
  });

  return (
    <div className="p-4 space-y-6">
      {/* Coverage Overview */}
      <div>
        <h3 className="text-sm font-medium text-white mb-3">Section Coverage</h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-gray-800 rounded-lg">
            <div className="text-2xl font-bold text-emerald-400">
              {sectionStats.filter((s) => !s.isGenericFallback).length}
            </div>
            <div className="text-xs text-gray-400">KB-Grounded</div>
          </div>
          <div className="p-3 bg-gray-800 rounded-lg">
            <div className="text-2xl font-bold text-yellow-400">
              {sectionStats.filter((s) => s.isGenericFallback).length}
            </div>
            <div className="text-xs text-gray-400">Using Fallback</div>
          </div>
        </div>
      </div>

      {/* Entity Types Used */}
      <div>
        <h3 className="text-sm font-medium text-white mb-3">Entity Types Used</h3>
        {usedEntityTypes.size > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {Array.from(usedEntityTypes).map((type) => {
              const colors = ENTITY_TYPE_COLORS[type] || { bg: 'bg-gray-500/20', text: 'text-gray-300', border: 'border-gray-500/30' };
              return (
                <span
                  key={type}
                  className={`px-2 py-1 text-xs rounded border ${colors.bg} ${colors.text} ${colors.border}`}
                >
                  {type.replace(/_/g, ' ')}
                </span>
              );
            })}
          </div>
        ) : (
          <div className="text-sm text-gray-500">No KB entities used yet</div>
        )}
      </div>

      {/* Missing Entity Types */}
      {missingEntityTypes.size > 0 && (
        <div>
          <h3 className="text-sm font-medium text-white mb-3">Missing for Full Coverage</h3>
          <div className="space-y-2">
            {Array.from(missingEntityTypes).slice(0, 8).map((type) => {
              const colors = ENTITY_TYPE_COLORS[type] || { bg: 'bg-gray-500/20', text: 'text-gray-300', border: 'border-gray-500/30' };
              return (
                <div
                  key={type}
                  className="flex items-center justify-between p-2 bg-gray-800/50 rounded"
                >
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${colors.bg.replace('/20', '')}`} />
                    <span className="text-sm text-gray-300">{type.replace(/_/g, ' ')}</span>
                  </div>
                  {onAddKBContent && (
                    <button
                      onClick={() => onAddKBContent(type)}
                      className="px-2 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
                    >
                      Add
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Suggestions */}
      <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
        <div className="flex items-start gap-2">
          <svg className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <h4 className="text-sm font-medium text-blue-300">Improve Coverage</h4>
            <p className="text-xs text-blue-200/70 mt-1">
              Upload documents containing company information, testimonials, pricing, and FAQs to automatically populate sections with KB-grounded content.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// FEEDBACK TAB
// =============================================================================

function FeedbackTab({
  selectedSection,
  selectedKBInfo,
  feedbackText,
  setFeedbackText,
  onSubmitFeedback,
}: {
  selectedSection: RuntimeSection | undefined;
  selectedKBInfo: SectionKBInfo | null;
  feedbackText: string;
  setFeedbackText: (text: string) => void;
  onSubmitFeedback: () => void;
}) {
  return (
    <div className="p-4 space-y-4">
      {selectedSection ? (
        <>
          {/* Selected Section Info */}
          <div className="p-3 bg-gray-800 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-medium text-white">{selectedSection.componentId}</span>
              {selectedKBInfo?.traceability?.isGenericFallback === false && (
                <span className="px-1.5 py-0.5 text-xs bg-emerald-500/20 text-emerald-300 rounded">
                  KB-Grounded
                </span>
              )}
            </div>
            <div className="text-xs text-gray-400">{selectedSection.narrativeRole}</div>

            {/* KB Source Info */}
            {selectedKBInfo?.traceability?.sourceEntityIds && selectedKBInfo.traceability.sourceEntityIds.length > 0 && (
              <div className="mt-2 pt-2 border-t border-gray-700">
                <div className="flex items-center gap-1 text-xs text-emerald-400">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Content sourced from {selectedKBInfo.traceability.sourceEntityIds.length} KB entities</span>
                </div>
              </div>
            )}
          </div>

          {/* Feedback Input */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Your Feedback
            </label>
            <textarea
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              placeholder="Describe what you'd like to change about this section..."
              className="w-full h-32 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:border-blue-500 resize-none"
            />
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap gap-2">
            {['Change headline', 'Update description', 'Add more details', 'Change CTA'].map((action) => (
              <button
                key={action}
                onClick={() => setFeedbackText(feedbackText + (feedbackText ? ' ' : '') + action)}
                className="px-2 py-1 text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 rounded transition-colors"
              >
                {action}
              </button>
            ))}
          </div>

          {/* Submit Button */}
          <button
            onClick={onSubmitFeedback}
            disabled={!feedbackText.trim()}
            className="w-full py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-500 text-white font-medium rounded-lg transition-colors"
          >
            Submit Feedback
          </button>

          {/* Tip for KB-grounded sections */}
          {selectedKBInfo?.traceability?.isGenericFallback === false && (
            <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded text-xs text-emerald-300">
              <strong>Tip:</strong> This content is grounded in your knowledge base. Changes made here will be tracked and can be regenerated from KB if needed.
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-12 text-gray-500">
          <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
          </svg>
          <p className="text-sm">Select a section to provide feedback</p>
          <p className="text-xs mt-1 text-gray-600">Click on any section in the preview to select it</p>
        </div>
      )}
    </div>
  );
}

export default KBFeedbackPanel;
