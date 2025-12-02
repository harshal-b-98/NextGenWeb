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
} from './generation';
