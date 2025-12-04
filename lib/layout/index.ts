/**
 * Layout Module Exports
 * Phase 3.1: Layout Generation Agent
 */

// Types
export * from './types';

// Component Registry
export {
  ComponentRegistry,
  componentRegistry,
  COMPONENT_DEFINITIONS,
} from './component-registry';

// Layout Generation
export {
  LayoutGenerationAgent,
  generatePageLayout,
  generateSiteArchitecture,
  savePageLayout,
  getPageLayout,
  generateGlobalComponentsWithAI,
} from './generation';

// Global Components Data Access
export {
  getGlobalComponents,
  getGlobalComponentByType,
  getHeader,
  getFooter,
  saveGlobalComponents,
  saveGlobalComponent,
  updateGlobalComponent,
  deleteGlobalComponent,
  deactivateGlobalComponent,
  hasGlobalComponents,
  getGlobalComponentsSummary,
  type GlobalComponent as GlobalComponentData,
  type GlobalComponentInput,
  type HeaderContent,
  type FooterContent,
} from './global-components';

// KB-Grounded Global Components (Story 7.3)
export {
  generateKBGroundedGlobalComponents,
  buildHeaderFromKB,
  buildFooterFromKB,
  type KBGroundedGenerationInput,
  type KBGroundedGenerationResult,
  type KBGlobalComponentData,
} from './kb-grounded-components';
