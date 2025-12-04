/**
 * Version Indicator Component
 *
 * Toolbar component showing current version with dropdown for version history
 *
 * Epic: NextGenWeb Complete Product Reimplementation
 * Phase 2: Preview Studio & Refinement
 */

'use client';

import { useState } from 'react';
import { ChevronDown, Clock, GitBranch } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';

interface Version {
  id: string;
  version_number: number;
  snapshot: any;
  trigger_description: string | null;
  created_at: string;
}

interface VersionIndicatorProps {
  currentVersion: Version | null;
  versions: Version[];
  onVersionChange?: (versionId: string) => void;
}

export function VersionIndicator({
  currentVersion,
  versions,
  onVersionChange,
}: VersionIndicatorProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (!currentVersion) {
    return (
      <div className="px-3 py-1.5 bg-gray-100 rounded-md text-sm text-gray-500 flex items-center gap-2">
        <Clock className="h-3 w-3" />
        No version
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Current version display */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="gap-2"
      >
        <GitBranch className="h-4 w-4" />
        <span className="font-mono">v{currentVersion.version_number}</span>
        {versions.length > 1 && <ChevronDown className="h-3 w-3" />}
      </Button>

      {/* Version dropdown */}
      {isOpen && versions.length > 1 && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown menu */}
          <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-96 overflow-y-auto">
            <div className="p-2">
              <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Version History
              </div>

              {versions.map((version) => {
                const isCurrent = version.id === currentVersion.id;

                return (
                  <button
                    key={version.id}
                    onClick={() => {
                      if (onVersionChange && !isCurrent) {
                        onVersionChange(version.id);
                      }
                      setIsOpen(false);
                    }}
                    className={`w-full text-left px-3 py-3 rounded-md transition-colors ${
                      isCurrent
                        ? 'bg-blue-50 border-2 border-blue-500'
                        : 'hover:bg-gray-50 border-2 border-transparent'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className={`font-mono text-sm font-semibold ${
                              isCurrent ? 'text-blue-700' : 'text-gray-900'
                            }`}
                          >
                            v{version.version_number}
                          </span>
                          {isCurrent && (
                            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">
                              Current
                            </span>
                          )}
                        </div>

                        {version.trigger_description && (
                          <p className="text-sm text-gray-600 mb-1 truncate">
                            {version.trigger_description}
                          </p>
                        )}

                        <p className="text-xs text-gray-500 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDistanceToNow(new Date(version.created_at), {
                            addSuffix: true,
                          })}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
