/**
 * Refinement Store
 *
 * Zustand store for managing website refinement state including:
 * - Current version tracking
 * - Selected section
 * - Feedback mode
 * - Pending changes
 * - Regeneration status
 *
 * Epic #146: Interactive Website Feedback & Refinement System
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

// ============================================================================
// Types
// ============================================================================

export interface Version {
  id: string;
  version_number: number;
  version_name: string | null;
  status: 'draft' | 'production';
  created_at: string;
  trigger_type: string | null;
}

export interface PendingChange {
  sectionId: string;
  feedbackText: string;
  proposedContent: any;
  confidence: number;
}

export interface RegenerationStatus {
  isRegenerating: boolean;
  stage: 'analyzing' | 'regenerating' | 'updating' | null;
  progress: number; // 0-100
  estimatedTimeRemaining: number | null; // seconds
  error: string | null;
}

interface RefinementState {
  // Version management
  currentVersionId: string | null;
  versions: Version[];
  versionCache: Map<string, any>; // Cache version details

  // Section selection
  selectedSectionId: string | null;
  feedbackMode: boolean;

  // Pending changes
  pendingChanges: PendingChange[];

  // Regeneration status
  regenerationStatus: RegenerationStatus;

  // UI state
  isVersionTimelineOpen: boolean;
  isFeedbackPanelOpen: boolean;

  // Actions
  setCurrentVersion: (versionId: string) => void;
  setVersions: (versions: Version[]) => void;
  cacheVersion: (versionId: string, versionData: any) => void;
  getCachedVersion: (versionId: string) => any | null;

  setSelectedSection: (sectionId: string | null) => void;
  toggleFeedbackMode: () => void;

  addPendingChange: (change: PendingChange) => void;
  removePendingChange: (sectionId: string) => void;
  clearPendingChanges: () => void;

  startRegeneration: (stage: 'analyzing' | 'regenerating' | 'updating') => void;
  updateRegenerationProgress: (progress: number, estimatedTime?: number) => void;
  completeRegeneration: () => void;
  failRegeneration: (error: string) => void;
  resetRegeneration: () => void;

  toggleVersionTimeline: () => void;
  toggleFeedbackPanel: () => void;

  reset: () => void;
}

// ============================================================================
// Initial State
// ============================================================================

const initialState = {
  currentVersionId: null,
  versions: [],
  versionCache: new Map(),
  selectedSectionId: null,
  feedbackMode: false,
  pendingChanges: [],
  regenerationStatus: {
    isRegenerating: false,
    stage: null,
    progress: 0,
    estimatedTimeRemaining: null,
    error: null,
  },
  isVersionTimelineOpen: false,
  isFeedbackPanelOpen: false,
};

// ============================================================================
// Store
// ============================================================================

export const useRefinementStore = create<RefinementState>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,

        // Version management
        setCurrentVersion: (versionId: string) => {
          set({ currentVersionId: versionId });
        },

        setVersions: (versions: Version[]) => {
          set({ versions });
        },

        cacheVersion: (versionId: string, versionData: any) => {
          set((state) => {
            const newCache = new Map(state.versionCache);
            newCache.set(versionId, versionData);
            return { versionCache: newCache };
          });
        },

        getCachedVersion: (versionId: string) => {
          return get().versionCache.get(versionId) || null;
        },

        // Section selection
        setSelectedSection: (sectionId: string | null) => {
          set({
            selectedSectionId: sectionId,
            isFeedbackPanelOpen: sectionId !== null,
          });
        },

        toggleFeedbackMode: () => {
          set((state) => ({
            feedbackMode: !state.feedbackMode,
            selectedSectionId: state.feedbackMode ? null : state.selectedSectionId,
          }));
        },

        // Pending changes
        addPendingChange: (change: PendingChange) => {
          set((state) => ({
            pendingChanges: [
              ...state.pendingChanges.filter((c) => c.sectionId !== change.sectionId),
              change,
            ],
          }));
        },

        removePendingChange: (sectionId: string) => {
          set((state) => ({
            pendingChanges: state.pendingChanges.filter((c) => c.sectionId !== sectionId),
          }));
        },

        clearPendingChanges: () => {
          set({ pendingChanges: [] });
        },

        // Regeneration status
        startRegeneration: (stage: 'analyzing' | 'regenerating' | 'updating') => {
          set({
            regenerationStatus: {
              isRegenerating: true,
              stage,
              progress: stage === 'analyzing' ? 10 : stage === 'regenerating' ? 40 : 85,
              estimatedTimeRemaining: stage === 'analyzing' ? 8 : stage === 'regenerating' ? 5 : 2,
              error: null,
            },
          });
        },

        updateRegenerationProgress: (progress: number, estimatedTime?: number) => {
          set((state) => ({
            regenerationStatus: {
              ...state.regenerationStatus,
              progress,
              estimatedTimeRemaining: estimatedTime ?? state.regenerationStatus.estimatedTimeRemaining,
            },
          }));
        },

        completeRegeneration: () => {
          set({
            regenerationStatus: {
              isRegenerating: false,
              stage: null,
              progress: 100,
              estimatedTimeRemaining: null,
              error: null,
            },
            pendingChanges: [], // Clear pending changes after successful regeneration
          });
        },

        failRegeneration: (error: string) => {
          set({
            regenerationStatus: {
              isRegenerating: false,
              stage: null,
              progress: 0,
              estimatedTimeRemaining: null,
              error,
            },
          });
        },

        resetRegeneration: () => {
          set({
            regenerationStatus: initialState.regenerationStatus,
          });
        },

        // UI toggles
        toggleVersionTimeline: () => {
          set((state) => ({
            isVersionTimelineOpen: !state.isVersionTimelineOpen,
          }));
        },

        toggleFeedbackPanel: () => {
          set((state) => ({
            isFeedbackPanelOpen: !state.isFeedbackPanelOpen,
          }));
        },

        // Reset entire store
        reset: () => {
          set(initialState);
        },
      }),
      {
        name: 'refinement-store',
        // Don't persist regeneration status or UI state
        partialize: (state) => ({
          currentVersionId: state.currentVersionId,
          versions: state.versions,
          feedbackMode: state.feedbackMode,
        }),
      }
    )
  )
);

// ============================================================================
// Selectors (for optimized component re-renders)
// ============================================================================

export const useCurrentVersion = () => useRefinementStore((state) => state.currentVersionId);
export const useVersions = () => useRefinementStore((state) => state.versions);
export const useSelectedSection = () => useRefinementStore((state) => state.selectedSectionId);
export const useFeedbackMode = () => useRefinementStore((state) => state.feedbackMode);
export const usePendingChanges = () => useRefinementStore((state) => state.pendingChanges);
export const useRegenerationStatus = () => useRefinementStore((state) => state.regenerationStatus);
export const useIsVersionTimelineOpen = () =>
  useRefinementStore((state) => state.isVersionTimelineOpen);
export const useIsFeedbackPanelOpen = () =>
  useRefinementStore((state) => state.isFeedbackPanelOpen);
