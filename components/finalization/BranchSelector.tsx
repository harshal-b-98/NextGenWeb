/**
 * Branch Selector Component
 *
 * Side-by-side cards showing Draft vs Production branches.
 * Allows users to understand the production branch model and
 * merge draft changes to production.
 *
 * Epic #146: Interactive Website Feedback & Refinement System
 */

'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import {
  FileText,
  Rocket,
  Eye,
  GitMerge,
  ExternalLink,
  Loader2,
  CheckCircle,
  Edit,
} from 'lucide-react';
import { toast } from 'sonner';

interface Version {
  id: string;
  version_number: number;
  version_name: string | null;
  status: 'draft' | 'production';
  created_at: string;
  published_at: string | null;
}

interface BranchSelectorProps {
  websiteId: string;
  workspaceId: string;
  websiteSlug: string;
  draftVersion: Version | null;
  productionVersion: Version | null;
  onMergeComplete?: () => void;
}

export function BranchSelector({
  websiteId,
  workspaceId,
  websiteSlug,
  draftVersion,
  productionVersion,
  onMergeComplete,
}: BranchSelectorProps) {
  const [isMerging, setIsMerging] = useState(false);

  const handleMergeToProduction = async () => {
    if (!draftVersion) {
      toast.error('No draft version to merge');
      return;
    }

    setIsMerging(true);
    try {
      const response = await fetch(
        `/api/workspaces/${workspaceId}/websites/${websiteId}/finalize`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to merge to production');
      }

      toast.success('Draft merged to production successfully!');
      onMergeComplete?.();
    } catch (error) {
      console.error('Merge error:', error);
      toast.error('Failed to merge to production');
    } finally {
      setIsMerging(false);
    }
  };

  const versionsDiffer =
    draftVersion &&
    productionVersion &&
    draftVersion.version_number !== productionVersion.version_number;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Website Branches</h2>
        <p className="text-sm text-gray-600">
          Manage your draft and production versions separately
        </p>
      </div>

      {/* Branch Cards */}
      <div className="grid grid-cols-2 gap-6">
        {/* Draft Branch */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="border-2 border-blue-200 rounded-xl p-6 bg-gradient-to-br from-blue-50 to-white"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Edit className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Draft</h3>
              <span className="px-2 py-0.5 bg-blue-600 text-white text-xs font-semibold rounded">
                Active
              </span>
            </div>
          </div>

          {draftVersion ? (
            <>
              <div className="space-y-2 mb-4">
                <p className="text-sm text-gray-700">
                  <span className="font-medium">Version:</span> v{draftVersion.version_number}
                </p>
                <p className="text-sm text-gray-700">
                  <span className="font-medium">Last updated:</span>{' '}
                  {formatDistanceToNow(new Date(draftVersion.created_at), { addSuffix: true })}
                </p>
              </div>

              <div className="p-3 bg-white rounded-lg border border-blue-100 mb-4">
                <p className="text-sm text-gray-600">
                  Keep iterating here. Safe to experiment and make changes.
                </p>
              </div>

              <div className="space-y-2">
                <a
                  href={`/workspaces/${workspaceId}/websites/${websiteId}/preview`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full px-4 py-2 text-sm font-medium text-blue-700 bg-blue-100 rounded-lg hover:bg-blue-200 transition-colors"
                >
                  <Eye className="w-4 h-4" />
                  Open Preview
                  <ExternalLink className="w-3 h-3" />
                </a>
                <button className="flex items-center justify-center gap-2 w-full px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                  <FileText className="w-4 h-4" />
                  Give Feedback
                </button>
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p className="text-sm">No draft version yet</p>
            </div>
          )}
        </motion.div>

        {/* Production Branch */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="border-2 border-green-200 rounded-xl p-6 bg-gradient-to-br from-green-50 to-white"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-green-100 rounded-lg">
              <Rocket className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Production</h3>
              {productionVersion && (
                <span className="px-2 py-0.5 bg-green-600 text-white text-xs font-semibold rounded">
                  Live
                </span>
              )}
            </div>
          </div>

          {productionVersion ? (
            <>
              <div className="space-y-2 mb-4">
                <p className="text-sm text-gray-700">
                  <span className="font-medium">Version:</span> v{productionVersion.version_number}
                </p>
                <p className="text-sm text-gray-700">
                  <span className="font-medium">Published:</span>{' '}
                  {productionVersion.published_at
                    ? formatDistanceToNow(new Date(productionVersion.published_at), {
                        addSuffix: true,
                      })
                    : 'Not yet published'}
                </p>
              </div>

              <div className="p-3 bg-white rounded-lg border border-green-100 mb-4">
                <p className="text-sm text-gray-600">
                  Currently deployed. Stable version for visitors.
                </p>
              </div>

              <div className="space-y-2">
                <a
                  href={`/sites/${websiteSlug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full px-4 py-2 text-sm font-medium text-green-700 bg-green-100 rounded-lg hover:bg-green-200 transition-colors"
                >
                  <Rocket className="w-4 h-4" />
                  View Live Site
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p className="text-sm mb-3">No production version yet</p>
              <p className="text-xs text-gray-400">
                Finalize your draft to create production branch
              </p>
            </div>
          )}
        </motion.div>
      </div>

      {/* Merge Action */}
      {versionsDiffer && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 rounded-xl"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <GitMerge className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  Draft is {draftVersion!.version_number - productionVersion!.version_number}{' '}
                  version{draftVersion!.version_number - productionVersion!.version_number !== 1 ? 's' : ''} ahead
                </p>
                <p className="text-xs text-gray-600">
                  Merge your latest changes to production
                </p>
              </div>
            </div>
            <button
              onClick={handleMergeToProduction}
              disabled={isMerging}
              className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-green-600 rounded-lg hover:from-blue-700 hover:to-green-700 transition-all shadow-md hover:shadow-lg disabled:opacity-50 flex items-center gap-2"
            >
              {isMerging ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Merging...
                </>
              ) : (
                <>
                  <GitMerge className="w-4 h-4" />
                  Merge Draft → Production
                </>
              )}
            </button>
          </div>
        </motion.div>
      )}

      {/* Info Banner */}
      {!productionVersion && draftVersion && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-yellow-900 mb-1">
                Ready to create your first production version?
              </p>
              <p className="text-xs text-yellow-700">
                Click "Create Production Branch" to make your website ready for deployment.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
