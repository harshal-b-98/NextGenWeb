/**
 * Website Version Timeline
 *
 * Adapted from RevisionTimeline for website-level versions.
 * Shows visual timeline with version history, rollback, and comparison.
 *
 * Epic #146: Interactive Website Feedback & Refinement System
 */

'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Clock,
  RotateCcw,
  Eye,
  GitCompare,
  Loader2,
  X,
  RefreshCw,
  MessageSquare,
  Undo,
  Pencil,
  Sparkles,
  Rocket,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { VersionTriggerType } from '@/types/database';

interface Version {
  id: string;
  version_number: number;
  version_name: string | null;
  status: 'draft' | 'production';
  created_at: string;
  trigger_type: VersionTriggerType | null;
  page_revisions: any;
}

interface WebsiteVersionTimelineProps {
  versions: Version[];
  currentVersionId: string | null;
  draftVersionId: string | null;
  productionVersionId: string | null;
  websiteId: string;
  workspaceId: string;
  onVersionSwitch: (versionId: string) => void;
  onClose?: () => void;
}

const VERSION_TYPE_CONFIG: Record<
  NonNullable<VersionTriggerType>,
  { label: string; icon: typeof Clock; color: string; emoji: string }
> = {
  initial: {
    label: 'Initial Generation',
    icon: Sparkles,
    color: 'text-purple-600 bg-purple-100',
    emoji: '✨',
  },
  feedback: {
    label: 'Feedback Applied',
    icon: MessageSquare,
    color: 'text-blue-600 bg-blue-100',
    emoji: '💬',
  },
  rollback: {
    label: 'Rolled Back',
    icon: Undo,
    color: 'text-orange-600 bg-orange-100',
    emoji: '↩️',
  },
  manual: {
    label: 'Manual Edit',
    icon: Pencil,
    color: 'text-gray-600 bg-gray-100',
    emoji: '✏️',
  },
  finalization: {
    label: 'Finalized',
    icon: Rocket,
    color: 'text-green-600 bg-green-100',
    emoji: '🚀',
  },
};

export function WebsiteVersionTimeline({
  versions,
  currentVersionId,
  draftVersionId,
  productionVersionId,
  websiteId,
  workspaceId,
  onVersionSwitch,
  onClose,
}: WebsiteVersionTimelineProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [switchingTo, setSwitchingTo] = useState<string | null>(null);

  const handleSwitchVersion = async (versionId: string) => {
    if (versionId === currentVersionId || switchingTo) return;

    setSwitchingTo(versionId);
    setIsLoading(true);

    try {
      const response = await fetch(
        `/api/workspaces/${workspaceId}/websites/${websiteId}/versions/${versionId}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'switch' }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to switch version');
      }

      onVersionSwitch(versionId);
    } catch (error) {
      console.error('Error switching version:', error);
    } finally {
      setSwitchingTo(null);
      setIsLoading(false);
    }
  };

  const getPageCount = (pageRevisions: any) => {
    try {
      const revisions = typeof pageRevisions === 'string'
        ? JSON.parse(pageRevisions)
        : pageRevisions;
      return Object.keys(revisions || {}).length;
    } catch {
      return 0;
    }
  };

  return (
    <div className="bg-white border-l border-gray-200 w-96 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-gray-600" />
          <h3 className="font-semibold text-gray-900">Version History</h3>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <div className="px-4 py-2 bg-blue-50 border-b border-blue-100">
        <p className="text-xs text-blue-700">
          {versions.length} version{versions.length !== 1 ? 's' : ''} available
        </p>
      </div>

      {/* Timeline */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="relative">
          {/* Timeline Line */}
          <div className="absolute left-4 top-3 bottom-3 w-0.5 bg-gray-200" />

          {/* Version Items */}
          <div className="space-y-4">
            {versions.map((version, index) => {
              const config = version.trigger_type
                ? VERSION_TYPE_CONFIG[version.trigger_type]
                : VERSION_TYPE_CONFIG.manual;
              const isCurrent = version.id === currentVersionId;
              const isDraft = version.id === draftVersionId;
              const isProduction = version.id === productionVersionId;
              const isSwitching = switchingTo === version.id;
              const pageCount = getPageCount(version.page_revisions);

              return (
                <motion.div
                  key={version.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="relative"
                >
                  {/* Timeline Dot */}
                  <div
                    className={`absolute left-0 w-8 h-8 rounded-full flex items-center justify-center border-2 border-white shadow-sm ${config.color}`}
                  >
                    <config.icon className="w-4 h-4" />
                  </div>

                  {/* Content Card */}
                  <div
                    className={`ml-12 p-4 rounded-lg border transition-all ${
                      isCurrent
                        ? 'border-blue-500 bg-blue-50 shadow-md'
                        : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                    }`}
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-gray-900">
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
                        {isCurrent && (
                          <span className="px-2 py-0.5 bg-gray-800 text-white text-xs font-semibold rounded">
                            Current
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-gray-500">
                        {formatDistanceToNow(new Date(version.created_at), { addSuffix: true })}
                      </span>
                    </div>

                    {/* Version Name */}
                    <p className="text-sm font-medium text-gray-700 mb-1">
                      {config.emoji} {version.version_name || 'Untitled Version'}
                    </p>

                    {/* Page Count */}
                    <p className="text-xs text-gray-500 mb-3">
                      {pageCount} page{pageCount !== 1 ? 's' : ''} in this version
                    </p>

                    {/* Actions */}
                    {!isCurrent && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleSwitchVersion(version.id)}
                          disabled={isSwitching || isLoading}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isSwitching ? (
                            <>
                              <Loader2 className="w-3 h-3 animate-spin" />
                              Switching...
                            </>
                          ) : (
                            <>
                              <RotateCcw className="w-3 h-3" />
                              Switch to This
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => {
                            /* TODO: Implement comparison */
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors"
                        >
                          <GitCompare className="w-3 h-3" />
                          Compare
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Empty State */}
      {versions.length === 0 && (
        <div className="flex-1 flex items-center justify-center p-6 text-center">
          <div>
            <Clock className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="font-medium text-gray-600">No Versions Yet</p>
            <p className="text-sm text-gray-500 mt-1">
              Versions will appear here as you refine your website
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
