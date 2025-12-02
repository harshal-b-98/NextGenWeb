/**
 * Zustand stores
 */

export {
  useWorkspaceStore,
  useCurrentWorkspace,
  useCurrentRole,
  useWorkspaces,
  useWorkspaceLoading,
  canEdit,
  canAdmin,
  isOwner,
} from './workspace-store';

export {
  useGeneratedSectionsStore,
  useGeneratedSection,
  useVisibleSections,
  useIsGenerating,
  useSectionActions,
  type GeneratedSectionData,
  type SectionAnimationState,
} from './generated-sections-store';

export {
  useConversationStore,
  useEngagementMetrics,
  useTopicEngagement,
  usePersonaInfo,
  useConversationTracking,
  useShouldShowConversion,
  useConversionProminence,
  JourneyDepth,
  type ConversationState,
  type Interaction,
  type InteractionType,
  type TopicEngagement,
  type PersonaSignal,
  type FunnelStage,
  type ConversionReadiness,
  type JourneyExportData,
} from './conversation-state-store';
