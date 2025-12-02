/**
 * Chat System Exports
 * Phase 4.4: AI-Powered Conversational Interface
 * Phase 6: Conversational Marketing Platform
 *
 * NOTE: This file only exports client-safe modules.
 * For server-only modules (knowledge-depth-analyzer, section-generator, etc.),
 * import from './index.server' instead.
 */

// Client-safe exports (types and context)
export * from './types';
export * from './chat-context';

// Client-safe types (no server dependencies)
export type {
  SmartCTA,
  FunnelStage,
  JourneyContext,
  HandoffType,
  HandoffUrgency,
  HandoffSignals,
  HandoffDetectionResult,
  PersonaCategory,
  PersonaProfile,
  PersonaSignals,
  AdaptedCTA,
} from './client-types';
