/**
 * Persona Module
 *
 * Exports for the persona modeling system including types,
 * extraction, and detection.
 */

// Types
export type {
  CommunicationStyle,
  BuyerJourneyStage,
  DetectionRuleType,
  DetectionRule,
  ContentPreference,
  Persona,
  CreatePersonaInput,
  UpdatePersonaInput,
  PersonaSignal,
  SignalCluster,
  PersonaExtractionResult,
  BehaviorSignal,
  PersonaMatch,
  UserBehavior,
  DetectionOptions,
  ContentAdaptation,
} from './types';

export { PersonaSchema, DetectionRuleSchema } from './types';

// Extraction
export {
  extractPersonas,
  savePersonas,
  createPersona,
  getPersonas,
  deletePersona,
  type ExtractionOptions,
} from './extraction';

// Detection
export {
  PersonaDetectionEngine,
  createDetectionEngine,
  detectPersona,
} from './detection';
