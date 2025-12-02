/**
 * Knowledge Graph Types
 *
 * Type definitions for the knowledge graph data structures.
 */

import type { Entity, EntityType, RelationshipType } from '@/lib/ai/types';

/**
 * Graph node representing an entity
 */
export interface GraphNode {
  id: string;
  type: EntityType;
  name: string;
  description?: string;
  confidence: number;
  properties: Record<string, unknown>;
  /** Number of relationships this node has */
  degree?: number;
  /** Computed centrality score */
  centrality?: number;
}

/**
 * Graph edge representing a relationship
 */
export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  type: RelationshipType;
  confidence: number;
  metadata?: Record<string, unknown>;
}

/**
 * Complete knowledge graph
 */
export interface KnowledgeGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
  metadata: GraphMetadata;
}

/**
 * Graph metadata
 */
export interface GraphMetadata {
  workspaceId: string;
  nodeCount: number;
  edgeCount: number;
  entityTypes: EntityType[];
  relationshipTypes: RelationshipType[];
  createdAt: string;
  updatedAt: string;
}

/**
 * Graph query options
 */
export interface GraphQueryOptions {
  /** Maximum depth for traversal */
  maxDepth?: number;
  /** Relationship types to follow */
  relationshipTypes?: RelationshipType[];
  /** Entity types to include */
  entityTypes?: EntityType[];
  /** Minimum confidence threshold */
  minConfidence?: number;
  /** Maximum number of nodes to return */
  limit?: number;
  /** Direction of traversal */
  direction?: 'outgoing' | 'incoming' | 'both';
}

/**
 * Subgraph result from queries
 */
export interface Subgraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
  rootNodeId?: string;
  depth: number;
}

/**
 * Path between two nodes
 */
export interface GraphPath {
  nodes: GraphNode[];
  edges: GraphEdge[];
  length: number;
  totalConfidence: number;
}

/**
 * Node neighborhood result
 */
export interface NodeNeighborhood {
  node: GraphNode;
  neighbors: Array<{
    node: GraphNode;
    edge: GraphEdge;
    direction: 'incoming' | 'outgoing';
  }>;
}

/**
 * Graph statistics
 */
export interface GraphStatistics {
  totalNodes: number;
  totalEdges: number;
  nodesByType: Record<EntityType, number>;
  edgesByType: Record<RelationshipType, number>;
  averageDegree: number;
  maxDegree: number;
  density: number;
  components: number;
}

/**
 * Options for graph visualization export
 */
export interface GraphVisualizationOptions {
  /** Format for export */
  format: 'cytoscape' | 'd3' | 'vis' | 'raw';
  /** Include node properties */
  includeProperties?: boolean;
  /** Color scheme for entity types */
  colorScheme?: Record<EntityType, string>;
  /** Layout algorithm hint */
  layout?: 'force' | 'hierarchical' | 'circular' | 'grid';
}

/**
 * Cytoscape-compatible graph format
 */
export interface CytoscapeGraph {
  elements: {
    nodes: Array<{
      data: {
        id: string;
        label: string;
        type: EntityType;
        [key: string]: unknown;
      };
    }>;
    edges: Array<{
      data: {
        id: string;
        source: string;
        target: string;
        type: RelationshipType;
        [key: string]: unknown;
      };
    }>;
  };
}

/**
 * D3-compatible graph format
 */
export interface D3Graph {
  nodes: Array<{
    id: string;
    name: string;
    group: EntityType;
    [key: string]: unknown;
  }>;
  links: Array<{
    source: string;
    target: string;
    type: RelationshipType;
    value: number;
    [key: string]: unknown;
  }>;
}

/**
 * Vis.js-compatible graph format
 */
export interface VisGraph {
  nodes: Array<{
    id: string;
    label: string;
    group: EntityType;
    title?: string;
    [key: string]: unknown;
  }>;
  edges: Array<{
    from: string;
    to: string;
    label?: string;
    arrows?: string;
    [key: string]: unknown;
  }>;
}
