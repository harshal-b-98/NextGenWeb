/**
 * Version Selector Component
 *
 * Dropdown to switch between different website versions.
 * Shows version number, name, status, and timestamp.
 *
 * Epic #146: Interactive Website Feedback & Refinement System
 */

'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';

interface Version {
  id: string;
  version_number: number;
  version_name: string | null;
  status: string;
  created_at: string;
  trigger_type: string | null;
}

interface VersionSelectorProps {
  versions: Version[];
  currentVersionId: string | null;
  draftVersionId: string | null;
  productionVersionId: string | null;
  onVersionChange: (versionId: string) => void;
  isLoading?: boolean;
}

export function VersionSelector({
  versions,
  currentVersionId,
  draftVersionId,
  productionVersionId,
  onVersionChange,
  isLoading = false,
}: VersionSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentVersion = versions.find((v) => v.id === currentVersionId);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getVersionBadge = (version: Version) => {
    if (version.id === draftVersionId && version.id === productionVersionId) {
      return (
        <span className="ml-2 px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-semibold rounded">
          Draft & Production
        </span>
      );
    }
    if (version.id === draftVersionId) {
      return (
        <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-semibold rounded">
          Draft
        </span>
      );
    }
    if (version.id === productionVersionId) {
      return (
        <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-700 text-xs font-semibold rounded">
          Production
        </span>
      );
    }
    return null;
  };

  const getTriggerIcon = (triggerType: string | null) => {
    switch (triggerType) {
      case 'initial':
        return '✨';
      case 'feedback':
        return '💬';
      case 'rollback':
        return '↩️';
      case 'finalization':
        return '🚀';
      case 'manual':
        return '✏️';
      default:
        return '📄';
    }
  };

  const handleVersionSelect = (versionId: string) => {
    onVersionChange(versionId);
    setIsOpen(false);
  };

  return (
    <div ref={dropdownRef} className="relative">
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isLoading}
        className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <span className="text-sm font-medium text-gray-700">
          {currentVersion ? (
            <>
              v{currentVersion.version_number}
              {currentVersion.version_name && (
                <span className="ml-1 text-gray-500">- {currentVersion.version_name}</span>
              )}
            </>
          ) : (
            'Select Version'
          )}
        </span>
        {getVersionBadge(currentVersion!)}
        <svg
          className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full right-0 mt-2 w-96 bg-white border border-gray-200 rounded-lg shadow-xl overflow-hidden z-50"
          >
            <div className="p-3 bg-gray-50 border-b border-gray-200">
              <h3 className="text-sm font-semibold text-gray-900">Version History</h3>
              <p className="text-xs text-gray-500 mt-0.5">
                {versions.length} version{versions.length !== 1 ? 's' : ''} available
              </p>
            </div>

            <div className="max-h-96 overflow-y-auto">
              {versions.map((version, index) => {
                const isActive = version.id === currentVersionId;
                const isDraft = version.id === draftVersionId;
                const isProduction = version.id === productionVersionId;

                return (
                  <button
                    key={version.id}
                    onClick={() => handleVersionSelect(version.id)}
                    disabled={isActive}
                    className={`w-full text-left px-4 py-3 border-b border-gray-100 hover:bg-blue-50 transition-colors disabled:cursor-default ${
                      isActive ? 'bg-blue-50' : 'bg-white'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="text-lg">{getTriggerIcon(version.trigger_type)}</span>
                          <span className="text-sm font-semibold text-gray-900">
                            v{version.version_number}
                          </span>
                          {isDraft && (
                            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-semibold rounded">
                              Draft
                            </span>
                          )}
                          {isProduction && (
                            <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-semibold rounded">
                              Production
                            </span>
                          )}
                          {isActive && (
                            <span className="px-2 py-0.5 bg-gray-800 text-white text-xs font-semibold rounded">
                              Current
                            </span>
                          )}
                        </div>

                        <p className="text-sm text-gray-700 mb-1">
                          {version.version_name || 'Untitled Version'}
                        </p>

                        <p className="text-xs text-gray-500">
                          {formatDistanceToNow(new Date(version.created_at), { addSuffix: true })}
                        </p>
                      </div>

                      {!isActive && (
                        <div className="flex items-center">
                          <svg
                            className="w-5 h-5 text-gray-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 5l7 7-7 7"
                            />
                          </svg>
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Footer Actions */}
            <div className="p-3 bg-gray-50 border-t border-gray-200">
              <button
                onClick={() => setIsOpen(false)}
                className="w-full px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                View All Versions →
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
