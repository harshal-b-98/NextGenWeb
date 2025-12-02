/**
 * Knowledge Graph Module
 *
 * Exports for the knowledge graph system including
 * queries, visualization, and graph building.
 */

// Types
export type {
  GraphNode,
  GraphEdge,
  KnowledgeGraph,
  GraphMetadata,
  GraphQueryOptions,
  Subgraph,
  GraphPath,
  NodeNeighborhood,
  GraphStatistics,
  GraphVisualizationOptions,
  CytoscapeGraph,
  D3Graph,
  VisGraph,
} from './types';

// Queries
export {
  getNode,
  getNodes,
  getEdgesForNode,
  getNodeNeighborhood,
  traverseGraph,
  findPath,
  findAllPaths,
  getNodesByRelationship,
  findRelatedEntities,
  getGraphStatistics,
  searchNodes,
  getCentralNodes,
} from './queries';

// Builder
export {
  buildKnowledgeGraph,
  buildGraphForKnowledgeItem,
  mergeGraphs,
  filterGraphByEntityTypes,
  filterGraphByRelationshipTypes,
  filterGraphByConfidence,
  getEgoGraph,
  calculateCentrality,
  findClusters,
  type GraphBuildOptions,
} from './builder';

// Visualization
export {
  toCytoscapeGraph,
  toD3Graph,
  toVisGraph,
  toRawGraph,
  exportGraph,
  generateCytoscapeStyles,
  generateLegendSVG,
  calculateHierarchicalLayout,
  DEFAULT_ENTITY_COLORS,
  DEFAULT_RELATIONSHIP_COLORS,
} from './visualization';
