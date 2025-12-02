/**
 * Generated Sections Store
 * Phase 6: Conversational Marketing Platform
 *
 * Zustand store for managing AI-generated inline sections.
 * Handles state for all sections generated during a conversation session.
 *
 * Features:
 * - Add/remove generated sections
 * - Track loading and error states per section
 * - Manage animation states
 * - Persist to localStorage for session continuity
 * - Track generation history for analytics
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { useShallow } from 'zustand/react/shallow';

// ============================================================================
// LOCAL TYPE DEFINITIONS
// These types are defined locally to avoid importing from server-only modules
// ============================================================================

/**
 * Suggested follow-up CTA
 */
export interface SuggestedCTA {
  text: string;
  topic: string;
  priority: 'high' | 'medium' | 'low';
}

/**
 * Section content structure
 */
export interface SectionContent {
  type: string;
  headline?: string;
  subheadline?: string;
  items: Array<{
    id: string;
    title: string;
    description: string;
    icon?: string;
    value?: string;
    label?: string;
    question?: string;
    answer?: string;
  }>;
  cta?: {
    text: string;
    action: string;
    variant: 'primary' | 'secondary';
  };
}

// ============================================================================
// TYPES
// ============================================================================

export type SectionAnimationState = 'entering' | 'visible' | 'exiting' | 'hidden';

export interface GeneratedSectionData {
  /** Unique section ID */
  id: string;
  /** CTA ID that triggered this section */
  sourceCtaId: string;
  /** Section type (features-grid, faq-accordion, etc.) */
  sectionType: string;
  /** The actual content */
  content: SectionContent | null;
  /** Follow-up CTA suggestions */
  suggestedFollowUps: SuggestedCTA[];
  /** Loading state */
  isLoading: boolean;
  /** Error message if generation failed */
  error: string | null;
  /** Animation state */
  animationState: SectionAnimationState;
  /** Timestamp of creation */
  createdAt: string;
  /** Intent that was classified */
  intent?: {
    category: string;
    confidence: number;
  };
  /** Number of knowledge sources used */
  knowledgeSourceCount: number;
  /** Tokens used in generation */
  tokensUsed: number;
}

export interface GeneratedSectionsState {
  // ========== State ==========

  /** All generated sections, keyed by section ID */
  sections: Record<string, GeneratedSectionData>;

  /** Order of sections (for rendering) */
  sectionOrder: string[];

  /** Currently loading section IDs */
  loadingSectionIds: string[];

  /** Session ID for this conversation */
  sessionId: string | null;

  /** Total tokens used in this session */
  totalTokensUsed: number;

  /** Whether any section is currently generating */
  isGenerating: boolean;

  // ========== Actions ==========

  /**
   * Start a new section generation (creates loading placeholder)
   */
  startSectionGeneration: (params: {
    sectionId: string;
    sourceCtaId: string;
    afterCtaId?: string;
  }) => void;

  /**
   * Complete section generation with content
   */
  completeSectionGeneration: (params: {
    sectionId: string;
    content: SectionContent;
    sectionType: string;
    suggestedFollowUps: SuggestedCTA[];
    intent?: { category: string; confidence: number };
    knowledgeSourceCount: number;
    tokensUsed: number;
  }) => void;

  /**
   * Mark section generation as failed
   */
  failSectionGeneration: (params: {
    sectionId: string;
    error: string;
  }) => void;

  /**
   * Update section animation state
   */
  updateAnimationState: (sectionId: string, state: SectionAnimationState) => void;

  /**
   * Remove a section
   */
  removeSection: (sectionId: string) => void;

  /**
   * Hide a section (animated removal)
   */
  hideSection: (sectionId: string) => void;

  /**
   * Get a section by ID
   */
  getSection: (sectionId: string) => GeneratedSectionData | null;

  /**
   * Get section by source CTA ID
   */
  getSectionByCtaId: (ctaId: string) => GeneratedSectionData | null;

  /**
   * Get all visible sections in order
   */
  getVisibleSections: () => GeneratedSectionData[];

  /**
   * Set the session ID
   */
  setSessionId: (sessionId: string) => void;

  /**
   * Clear all sections (e.g., on page refresh)
   */
  clearSections: () => void;

  /**
   * Reset entire store
   */
  reset: () => void;
}

// ============================================================================
// INITIAL STATE
// ============================================================================

const initialState: Pick<
  GeneratedSectionsState,
  | 'sections'
  | 'sectionOrder'
  | 'loadingSectionIds'
  | 'sessionId'
  | 'totalTokensUsed'
  | 'isGenerating'
> = {
  sections: {},
  sectionOrder: [],
  loadingSectionIds: [],
  sessionId: null,
  totalTokensUsed: 0,
  isGenerating: false,
};

// ============================================================================
// STORE
// ============================================================================

export const useGeneratedSectionsStore = create<GeneratedSectionsState>()(
  persist(
    (set, get) => ({
      ...initialState,

      // ========== Actions ==========

      startSectionGeneration: ({ sectionId, sourceCtaId, afterCtaId }) => {
        const now = new Date().toISOString();

        set((state) => {
          // Find position to insert
          let insertIndex = state.sectionOrder.length;
          if (afterCtaId) {
            const afterSection = Object.values(state.sections).find(
              (s) => s.sourceCtaId === afterCtaId
            );
            if (afterSection) {
              const idx = state.sectionOrder.indexOf(afterSection.id);
              if (idx !== -1) {
                insertIndex = idx + 1;
              }
            }
          }

          // Create new section order
          const newOrder = [...state.sectionOrder];
          newOrder.splice(insertIndex, 0, sectionId);

          return {
            sections: {
              ...state.sections,
              [sectionId]: {
                id: sectionId,
                sourceCtaId,
                sectionType: '',
                content: null,
                suggestedFollowUps: [],
                isLoading: true,
                error: null,
                animationState: 'entering',
                createdAt: now,
                knowledgeSourceCount: 0,
                tokensUsed: 0,
              },
            },
            sectionOrder: newOrder,
            loadingSectionIds: [...state.loadingSectionIds, sectionId],
            isGenerating: true,
          };
        });
      },

      completeSectionGeneration: ({
        sectionId,
        content,
        sectionType,
        suggestedFollowUps,
        intent,
        knowledgeSourceCount,
        tokensUsed,
      }) => {
        set((state) => {
          const section = state.sections[sectionId];
          if (!section) return state;

          return {
            sections: {
              ...state.sections,
              [sectionId]: {
                ...section,
                content,
                sectionType,
                suggestedFollowUps,
                intent,
                knowledgeSourceCount,
                tokensUsed,
                isLoading: false,
                error: null,
                animationState: 'visible',
              },
            },
            loadingSectionIds: state.loadingSectionIds.filter((id) => id !== sectionId),
            totalTokensUsed: state.totalTokensUsed + tokensUsed,
            isGenerating: state.loadingSectionIds.length > 1, // Still generating if other sections loading
          };
        });
      },

      failSectionGeneration: ({ sectionId, error }) => {
        set((state) => {
          const section = state.sections[sectionId];
          if (!section) return state;

          return {
            sections: {
              ...state.sections,
              [sectionId]: {
                ...section,
                isLoading: false,
                error,
                animationState: 'visible',
              },
            },
            loadingSectionIds: state.loadingSectionIds.filter((id) => id !== sectionId),
            isGenerating: state.loadingSectionIds.length > 1,
          };
        });
      },

      updateAnimationState: (sectionId, animationState) => {
        set((state) => {
          const section = state.sections[sectionId];
          if (!section) return state;

          return {
            sections: {
              ...state.sections,
              [sectionId]: {
                ...section,
                animationState,
              },
            },
          };
        });
      },

      removeSection: (sectionId) => {
        set((state) => {
          const { [sectionId]: removed, ...remainingSections } = state.sections;
          return {
            sections: remainingSections,
            sectionOrder: state.sectionOrder.filter((id) => id !== sectionId),
            loadingSectionIds: state.loadingSectionIds.filter((id) => id !== sectionId),
          };
        });
      },

      hideSection: (sectionId) => {
        // First animate out
        get().updateAnimationState(sectionId, 'exiting');

        // Then remove after animation
        setTimeout(() => {
          get().removeSection(sectionId);
        }, 400); // Match animation duration
      },

      getSection: (sectionId) => {
        return get().sections[sectionId] || null;
      },

      getSectionByCtaId: (ctaId) => {
        const sections = get().sections;
        return Object.values(sections).find((s) => s.sourceCtaId === ctaId) || null;
      },

      getVisibleSections: () => {
        const { sections, sectionOrder } = get();
        return sectionOrder
          .map((id) => sections[id])
          .filter((s): s is GeneratedSectionData => s !== undefined && s.animationState !== 'hidden');
      },

      setSessionId: (sessionId) => {
        set({ sessionId });
      },

      clearSections: () => {
        set({
          sections: {},
          sectionOrder: [],
          loadingSectionIds: [],
          isGenerating: false,
        });
      },

      reset: () => {
        set(initialState);
      },
    }),
    {
      name: 'generated-sections-storage',
      storage: createJSONStorage(() => {
        // Only persist in browser
        if (typeof window !== 'undefined') {
          return sessionStorage; // Use sessionStorage for per-tab isolation
        }
        return {
          getItem: () => null,
          setItem: () => {},
          removeItem: () => {},
        };
      }),
      partialize: (state) => ({
        // Only persist certain fields
        sections: state.sections,
        sectionOrder: state.sectionOrder,
        sessionId: state.sessionId,
        totalTokensUsed: state.totalTokensUsed,
      }),
    }
  )
);

// ============================================================================
// HOOKS
// ============================================================================

/**
 * Hook to get a specific section
 */
export function useGeneratedSection(sectionId: string) {
  return useGeneratedSectionsStore((state) => state.sections[sectionId]);
}

/**
 * Hook to get all visible sections
 * Uses useShallow to prevent infinite re-renders from array creation
 */
export function useVisibleSections(): GeneratedSectionData[] {
  return useGeneratedSectionsStore(
    useShallow((state) => {
      return state.sectionOrder
        .map((id) => state.sections[id])
        .filter((s): s is GeneratedSectionData => s !== undefined && s.animationState !== 'hidden');
    })
  );
}

/**
 * Hook to check if currently generating
 */
export function useIsGenerating() {
  return useGeneratedSectionsStore((state) => state.isGenerating);
}

/**
 * Hook to get section actions
 * Uses useShallow to prevent re-renders when actions haven't changed
 */
export function useSectionActions() {
  return useGeneratedSectionsStore(
    useShallow((state) => ({
      startSectionGeneration: state.startSectionGeneration,
      completeSectionGeneration: state.completeSectionGeneration,
      failSectionGeneration: state.failSectionGeneration,
      updateAnimationState: state.updateAnimationState,
      removeSection: state.removeSection,
      hideSection: state.hideSection,
      clearSections: state.clearSections,
    }))
  );
}

// ============================================================================
// EXPORTS
// ============================================================================

export default useGeneratedSectionsStore;
