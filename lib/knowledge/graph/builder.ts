/**
 * Knowledge Graph Builder
 *
 * Functions for constructing knowledge graphs from workspace data.
 */

import { createClient } from '@/lib/supabase/server';
import type { EntityType, RelationshipType } from '@/lib/ai/types';
import type {
  GraphNode,
  GraphEdge,
  KnowledgeGraph,
  GraphMetadata,
} from './types';

/**
 * Options for building a knowledge graph
 */
export interface GraphBuildOptions {
  /** Entity types to include */
  entityTypes?: EntityType[];
  /** Relationship types to include */
  relationshipTypes?: RelationshipType[];
  /** Minimum confidence threshold for entities */
  minEntityConfidence?: number;
  /** Minimum confidence threshold for relationships */
  minRelationshipConfidence?: number;
  /** Maximum number of entities to include */
  maxEntities?: number;
  /** Include only entities from specific knowledge items */
  knowledgeItemIds?: string[];
}

/**
 * Build a complete knowledge graph for a workspace
 */
export async function buildKnowledgeGraph(
  workspaceId: string,
  options: GraphBuildOptions = {}
): Promise<KnowledgeGraph> {
  const {
    entityTypes,
    relationshipTypes,
    minEntityConfidence = 0,
    minRelationshipConfidence = 0,
    maxEntities = 1000,
    knowledgeItemIds,
  } = options;

  const supabase = await createClient();

  // Build entity query
  let entityQuery = supabase
    .from('knowledge_entities')
    .select('*')
    .eq('workspace_id', workspaceId)
    .gte('confidence', minEntityConfidence)
    .order('confidence', { ascending: false })
    .limit(maxEntities);

  if (entityTypes && entityTypes.length > 0) {
    entityQuery = entityQuery.in('entity_type', entityTypes);
  }

  if (knowledgeItemIds && knowledgeItemIds.length > 0) {
    entityQuery = entityQuery.in('knowledge_item_id', knowledgeItemIds);
  }

  const { data: entities, error: entityError } = await entityQuery;

  if (entityError) {
    throw new Error(`Failed to fetch entities: ${entityError.message}`);
  }

  const nodes: GraphNode[] = (entities || []).map(e => ({
    id: e.id,
    type: e.entity_type as EntityType,
    name: e.name,
    description: e.description || undefined,
    confidence: e.confidence,
    properties: (e.metadata as Record<string, unknown>) || {},
  }));

  // Get node IDs for relationship filtering
  const nodeIds = new Set(nodes.map(n => n.id));

  // Build relationship query
  let relQuery = supabase
    .from('knowledge_entity_relationships')
    .select('*')
    .eq('workspace_id', workspaceId)
    .gte('confidence', minRelationshipConfidence);

  if (relationshipTypes && relationshipTypes.length > 0) {
    relQuery = relQuery.in('relationship_type', relationshipTypes);
  }

  const { data: relationships, error: relError } = await relQuery;

  if (relError) {
    throw new Error(`Failed to fetch relationships: ${relError.message}`);
  }

  // Filter relationships to only include those connecting entities in our graph
  const edges: GraphEdge[] = (relationships || [])
    .filter(r => nodeIds.has(r.source_entity_id) && nodeIds.has(r.target_entity_id))
    .map(r => ({
      id: r.id,
      source: r.source_entity_id,
      target: r.target_entity_id,
      type: r.relationship_type as RelationshipType,
      confidence: r.confidence,
      metadata: (r.metadata as Record<string, unknown>) || undefined,
    }));

  // Calculate node degrees
  const degrees = new Map<string, number>();
  edges.forEach(e => {
    degrees.set(e.source, (degrees.get(e.source) || 0) + 1);
    degrees.set(e.target, (degrees.get(e.target) || 0) + 1);
  });

  nodes.forEach(n => {
    n.degree = degrees.get(n.id) || 0;
  });

  // Build metadata
  const entityTypeSet = new Set(nodes.map(n => n.type));
  const relationshipTypeSet = new Set(edges.map(e => e.type));

  const metadata: GraphMetadata = {
    workspaceId,
    nodeCount: nodes.length,
    edgeCount: edges.length,
    entityTypes: Array.from(entityTypeSet),
    relationshipTypes: Array.from(relationshipTypeSet),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  return { nodes, edges, metadata };
}

/**
 * Build a knowledge graph from a specific knowledge item
 */
export async function buildGraphForKnowledgeItem(
  workspaceId: string,
  knowledgeItemId: string,
  options: Omit<GraphBuildOptions, 'knowledgeItemIds'> = {}
): Promise<KnowledgeGraph> {
  return buildKnowledgeGraph(workspaceId, {
    ...options,
    knowledgeItemIds: [knowledgeItemId],
  });
}

/**
 * Merge multiple graphs into one
 */
export function mergeGraphs(graphs: KnowledgeGraph[]): KnowledgeGraph {
  if (graphs.length === 0) {
    throw new Error('Cannot merge empty array of graphs');
  }

  if (graphs.length === 1) {
    return graphs[0];
  }

  const nodeMap = new Map<string, GraphNode>();
  const edgeMap = new Map<string, GraphEdge>();
  const entityTypes = new Set<EntityType>();
  const relationshipTypes = new Set<RelationshipType>();

  for (const graph of graphs) {
    // Merge nodes (keep highest confidence for duplicates)
    for (const node of graph.nodes) {
      const existing = nodeMap.get(node.id);
      if (!existing || node.confidence > existing.confidence) {
        nodeMap.set(node.id, node);
      }
      entityTypes.add(node.type);
    }

    // Merge edges (keep highest confidence for duplicates)
    for (const edge of graph.edges) {
      const existing = edgeMap.get(edge.id);
      if (!existing || edge.confidence > existing.confidence) {
        edgeMap.set(edge.id, edge);
      }
      relationshipTypes.add(edge.type);
    }
  }

  const nodes = Array.from(nodeMap.values());
  const edges = Array.from(edgeMap.values());

  // Recalculate degrees
  const degrees = new Map<string, number>();
  edges.forEach(e => {
    degrees.set(e.source, (degrees.get(e.source) || 0) + 1);
    degrees.set(e.target, (degrees.get(e.target) || 0) + 1);
  });
  nodes.forEach(n => {
    n.degree = degrees.get(n.id) || 0;
  });

  return {
    nodes,
    edges,
    metadata: {
      workspaceId: graphs[0].metadata.workspaceId,
      nodeCount: nodes.length,
      edgeCount: edges.length,
      entityTypes: Array.from(entityTypes),
      relationshipTypes: Array.from(relationshipTypes),
      createdAt: graphs[0].metadata.createdAt,
      updatedAt: new Date().toISOString(),
    },
  };
}

/**
 * Filter a graph by entity types
 */
export function filterGraphByEntityTypes(
  graph: KnowledgeGraph,
  entityTypes: EntityType[]
): KnowledgeGraph {
  const typeSet = new Set(entityTypes);
  const nodes = graph.nodes.filter(n => typeSet.has(n.type));
  const nodeIds = new Set(nodes.map(n => n.id));

  const edges = graph.edges.filter(
    e => nodeIds.has(e.source) && nodeIds.has(e.target)
  );

  return {
    nodes,
    edges,
    metadata: {
      ...graph.metadata,
      nodeCount: nodes.length,
      edgeCount: edges.length,
      entityTypes: Array.from(new Set(nodes.map(n => n.type))),
      updatedAt: new Date().toISOString(),
    },
  };
}

/**
 * Filter a graph by relationship types
 */
export function filterGraphByRelationshipTypes(
  graph: KnowledgeGraph,
  relationshipTypes: RelationshipType[]
): KnowledgeGraph {
  const typeSet = new Set(relationshipTypes);
  const edges = graph.edges.filter(e => typeSet.has(e.type));

  // Keep only nodes that have at least one connection
  const connectedNodeIds = new Set<string>();
  edges.forEach(e => {
    connectedNodeIds.add(e.source);
    connectedNodeIds.add(e.target);
  });

  const nodes = graph.nodes.filter(n => connectedNodeIds.has(n.id));

  return {
    nodes,
    edges,
    metadata: {
      ...graph.metadata,
      nodeCount: nodes.length,
      edgeCount: edges.length,
      relationshipTypes: Array.from(new Set(edges.map(e => e.type))),
      updatedAt: new Date().toISOString(),
    },
  };
}

/**
 * Filter graph by confidence threshold
 */
export function filterGraphByConfidence(
  graph: KnowledgeGraph,
  minNodeConfidence: number = 0,
  minEdgeConfidence: number = 0
): KnowledgeGraph {
  const nodes = graph.nodes.filter(n => n.confidence >= minNodeConfidence);
  const nodeIds = new Set(nodes.map(n => n.id));

  const edges = graph.edges.filter(
    e =>
      e.confidence >= minEdgeConfidence &&
      nodeIds.has(e.source) &&
      nodeIds.has(e.target)
  );

  return {
    nodes,
    edges,
    metadata: {
      ...graph.metadata,
      nodeCount: nodes.length,
      edgeCount: edges.length,
      updatedAt: new Date().toISOString(),
    },
  };
}

/**
 * Get a subgraph containing only nodes within N hops of a given node
 */
export function getEgoGraph(
  graph: KnowledgeGraph,
  nodeId: string,
  hops: number = 1
): KnowledgeGraph {
  const includedNodeIds = new Set<string>([nodeId]);

  // BFS to find nodes within N hops
  let currentLevel = new Set<string>([nodeId]);

  for (let hop = 0; hop < hops; hop++) {
    const nextLevel = new Set<string>();

    for (const edge of graph.edges) {
      if (currentLevel.has(edge.source) && !includedNodeIds.has(edge.target)) {
        nextLevel.add(edge.target);
        includedNodeIds.add(edge.target);
      }
      if (currentLevel.has(edge.target) && !includedNodeIds.has(edge.source)) {
        nextLevel.add(edge.source);
        includedNodeIds.add(edge.source);
      }
    }

    currentLevel = nextLevel;
    if (currentLevel.size === 0) break;
  }

  const nodes = graph.nodes.filter(n => includedNodeIds.has(n.id));
  const edges = graph.edges.filter(
    e => includedNodeIds.has(e.source) && includedNodeIds.has(e.target)
  );

  return {
    nodes,
    edges,
    metadata: {
      ...graph.metadata,
      nodeCount: nodes.length,
      edgeCount: edges.length,
      updatedAt: new Date().toISOString(),
    },
  };
}

/**
 * Calculate centrality scores for all nodes
 */
export function calculateCentrality(graph: KnowledgeGraph): Map<string, number> {
  const centrality = new Map<string, number>();

  if (graph.nodes.length === 0) return centrality;

  // Calculate degree centrality
  const degrees = new Map<string, number>();
  graph.edges.forEach(e => {
    degrees.set(e.source, (degrees.get(e.source) || 0) + 1);
    degrees.set(e.target, (degrees.get(e.target) || 0) + 1);
  });

  const maxDegree = Math.max(...degrees.values(), 1);

  graph.nodes.forEach(n => {
    const degree = degrees.get(n.id) || 0;
    centrality.set(n.id, degree / maxDegree);
  });

  return centrality;
}

/**
 * Find clusters in the graph using simple connected components
 */
export function findClusters(graph: KnowledgeGraph): GraphNode[][] {
  const visited = new Set<string>();
  const clusters: GraphNode[][] = [];

  // Build adjacency list
  const adjacency = new Map<string, Set<string>>();
  graph.nodes.forEach(n => adjacency.set(n.id, new Set()));
  graph.edges.forEach(e => {
    adjacency.get(e.source)?.add(e.target);
    adjacency.get(e.target)?.add(e.source);
  });

  // DFS to find connected components
  function dfs(nodeId: string, cluster: GraphNode[]) {
    if (visited.has(nodeId)) return;
    visited.add(nodeId);

    const node = graph.nodes.find(n => n.id === nodeId);
    if (node) cluster.push(node);

    const neighbors = adjacency.get(nodeId) || new Set();
    neighbors.forEach(n => dfs(n, cluster));
  }

  graph.nodes.forEach(n => {
    if (!visited.has(n.id)) {
      const cluster: GraphNode[] = [];
      dfs(n.id, cluster);
      if (cluster.length > 0) {
        clusters.push(cluster);
      }
    }
  });

  // Sort clusters by size (largest first)
  return clusters.sort((a, b) => b.length - a.length);
}
