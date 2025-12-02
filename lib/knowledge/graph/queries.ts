/**
 * Knowledge Graph Queries
 *
 * Functions for querying and traversing the knowledge graph.
 */

import { createClient } from '@/lib/supabase/server';
import type { EntityType, RelationshipType } from '@/lib/ai/types';
import type {
  GraphNode,
  GraphEdge,
  Subgraph,
  GraphPath,
  NodeNeighborhood,
  GraphQueryOptions,
  GraphStatistics,
} from './types';

/**
 * Get a single node by ID
 */
export async function getNode(nodeId: string): Promise<GraphNode | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('knowledge_entities')
    .select('*')
    .eq('id', nodeId)
    .single();

  if (error || !data) {
    return null;
  }

  return entityToNode(data);
}

/**
 * Get multiple nodes by IDs
 */
export async function getNodes(nodeIds: string[]): Promise<GraphNode[]> {
  if (nodeIds.length === 0) return [];

  const supabase = await createClient();

  const { data, error } = await supabase
    .from('knowledge_entities')
    .select('*')
    .in('id', nodeIds);

  if (error || !data) {
    return [];
  }

  return data.map(entityToNode);
}

/**
 * Get edges for a node
 */
export async function getEdgesForNode(
  nodeId: string,
  options: GraphQueryOptions = {}
): Promise<GraphEdge[]> {
  const supabase = await createClient();
  const { direction = 'both', relationshipTypes, minConfidence = 0 } = options;

  let query = supabase.from('knowledge_entity_relationships').select('*');

  if (direction === 'outgoing') {
    query = query.eq('source_entity_id', nodeId);
  } else if (direction === 'incoming') {
    query = query.eq('target_entity_id', nodeId);
  } else {
    query = query.or(`source_entity_id.eq.${nodeId},target_entity_id.eq.${nodeId}`);
  }

  if (minConfidence > 0) {
    query = query.gte('confidence', minConfidence);
  }

  if (relationshipTypes && relationshipTypes.length > 0) {
    query = query.in('relationship_type', relationshipTypes);
  }

  const { data, error } = await query;

  if (error || !data) {
    return [];
  }

  return data.map(relationshipToEdge);
}

/**
 * Get the neighborhood of a node (immediate connections)
 */
export async function getNodeNeighborhood(
  nodeId: string,
  options: GraphQueryOptions = {}
): Promise<NodeNeighborhood | null> {
  const node = await getNode(nodeId);
  if (!node) return null;

  const edges = await getEdgesForNode(nodeId, options);
  const neighborIds = new Set<string>();

  edges.forEach(edge => {
    if (edge.source !== nodeId) neighborIds.add(edge.source);
    if (edge.target !== nodeId) neighborIds.add(edge.target);
  });

  const neighbors = await getNodes(Array.from(neighborIds));
  const neighborMap = new Map(neighbors.map(n => [n.id, n]));

  return {
    node,
    neighbors: edges
      .map(edge => {
        const isOutgoing = edge.source === nodeId;
        const neighborId = isOutgoing ? edge.target : edge.source;
        const neighborNode = neighborMap.get(neighborId);

        if (!neighborNode) return null;

        const direction: 'outgoing' | 'incoming' = isOutgoing ? 'outgoing' : 'incoming';
        return {
          node: neighborNode,
          edge,
          direction,
        };
      })
      .filter((n): n is NonNullable<typeof n> => n !== null),
  };
}

/**
 * Traverse the graph from a starting node using BFS
 */
export async function traverseGraph(
  startNodeId: string,
  options: GraphQueryOptions = {}
): Promise<Subgraph> {
  const { maxDepth = 3, limit = 100, entityTypes, minConfidence = 0 } = options;

  const visitedNodes = new Map<string, GraphNode>();
  const collectedEdges = new Map<string, GraphEdge>();
  const queue: Array<{ nodeId: string; depth: number }> = [{ nodeId: startNodeId, depth: 0 }];

  while (queue.length > 0 && visitedNodes.size < limit) {
    const current = queue.shift()!;

    if (visitedNodes.has(current.nodeId)) continue;
    if (current.depth > maxDepth) continue;

    const node = await getNode(current.nodeId);
    if (!node) continue;

    // Filter by entity type if specified
    if (entityTypes && entityTypes.length > 0 && !entityTypes.includes(node.type)) {
      continue;
    }

    // Filter by confidence
    if (node.confidence < minConfidence) {
      continue;
    }

    visitedNodes.set(current.nodeId, node);

    // Get neighbors if we haven't reached max depth
    if (current.depth < maxDepth) {
      const edges = await getEdgesForNode(current.nodeId, options);

      for (const edge of edges) {
        if (!collectedEdges.has(edge.id)) {
          collectedEdges.set(edge.id, edge);
        }

        const neighborId = edge.source === current.nodeId ? edge.target : edge.source;
        if (!visitedNodes.has(neighborId)) {
          queue.push({ nodeId: neighborId, depth: current.depth + 1 });
        }
      }
    }
  }

  return {
    nodes: Array.from(visitedNodes.values()),
    edges: Array.from(collectedEdges.values()),
    rootNodeId: startNodeId,
    depth: maxDepth,
  };
}

/**
 * Find shortest path between two nodes using BFS
 */
export async function findPath(
  sourceId: string,
  targetId: string,
  options: GraphQueryOptions = {}
): Promise<GraphPath | null> {
  const { maxDepth = 10, relationshipTypes, minConfidence = 0 } = options;

  const visited = new Set<string>();
  const parent = new Map<string, { nodeId: string; edge: GraphEdge }>();
  const queue: Array<{ nodeId: string; depth: number }> = [{ nodeId: sourceId, depth: 0 }];

  visited.add(sourceId);

  while (queue.length > 0) {
    const current = queue.shift()!;

    if (current.nodeId === targetId) {
      // Reconstruct path
      return reconstructPath(sourceId, targetId, parent);
    }

    if (current.depth >= maxDepth) continue;

    const edges = await getEdgesForNode(current.nodeId, {
      direction: 'both',
      relationshipTypes,
      minConfidence,
    });

    for (const edge of edges) {
      const neighborId = edge.source === current.nodeId ? edge.target : edge.source;

      if (!visited.has(neighborId)) {
        visited.add(neighborId);
        parent.set(neighborId, { nodeId: current.nodeId, edge });
        queue.push({ nodeId: neighborId, depth: current.depth + 1 });
      }
    }
  }

  return null; // No path found
}

/**
 * Find all paths between two nodes (limited)
 */
export async function findAllPaths(
  sourceId: string,
  targetId: string,
  options: GraphQueryOptions & { maxPaths?: number } = {}
): Promise<GraphPath[]> {
  const { maxDepth = 5, maxPaths = 10, relationshipTypes, minConfidence = 0 } = options;

  const paths: GraphPath[] = [];
  const currentPath: Array<{ nodeId: string; edge: GraphEdge | null }> = [
    { nodeId: sourceId, edge: null },
  ];
  const visited = new Set<string>([sourceId]);

  async function dfs(nodeId: string, depth: number): Promise<void> {
    if (paths.length >= maxPaths) return;
    if (depth > maxDepth) return;

    if (nodeId === targetId && currentPath.length > 1) {
      // Found a path
      const pathNodes = await getNodes(currentPath.map(p => p.nodeId));
      const pathEdges = currentPath.slice(1).map(p => p.edge!);

      paths.push({
        nodes: pathNodes,
        edges: pathEdges,
        length: pathEdges.length,
        totalConfidence:
          pathEdges.reduce((sum, e) => sum + e.confidence, 0) / pathEdges.length,
      });
      return;
    }

    const edges = await getEdgesForNode(nodeId, {
      direction: 'both',
      relationshipTypes,
      minConfidence,
    });

    for (const edge of edges) {
      const neighborId = edge.source === nodeId ? edge.target : edge.source;

      if (!visited.has(neighborId)) {
        visited.add(neighborId);
        currentPath.push({ nodeId: neighborId, edge });

        await dfs(neighborId, depth + 1);

        currentPath.pop();
        visited.delete(neighborId);
      }
    }
  }

  await dfs(sourceId, 0);

  return paths;
}

/**
 * Get nodes connected by a specific relationship type
 */
export async function getNodesByRelationship(
  workspaceId: string,
  relationshipType: RelationshipType,
  options: { limit?: number; minConfidence?: number } = {}
): Promise<{ source: GraphNode; target: GraphNode; edge: GraphEdge }[]> {
  const { limit = 100, minConfidence = 0 } = options;

  const supabase = await createClient();

  const { data: relationships, error } = await supabase
    .from('knowledge_entity_relationships')
    .select('*')
    .eq('workspace_id', workspaceId)
    .eq('relationship_type', relationshipType)
    .gte('confidence', minConfidence)
    .limit(limit);

  if (error || !relationships || relationships.length === 0) {
    return [];
  }

  const nodeIds = new Set<string>();
  relationships.forEach(r => {
    nodeIds.add(r.source_entity_id);
    nodeIds.add(r.target_entity_id);
  });

  const nodes = await getNodes(Array.from(nodeIds));
  const nodeMap = new Map(nodes.map(n => [n.id, n]));

  return relationships
    .map(r => {
      const source = nodeMap.get(r.source_entity_id);
      const target = nodeMap.get(r.target_entity_id);

      if (!source || !target) return null;

      return {
        source,
        target,
        edge: relationshipToEdge(r),
      };
    })
    .filter((r): r is NonNullable<typeof r> => r !== null);
}

/**
 * Find related entities of a specific type
 */
export async function findRelatedEntities(
  nodeId: string,
  targetType: EntityType,
  options: GraphQueryOptions = {}
): Promise<Array<{ node: GraphNode; path: GraphPath }>> {
  const { maxDepth = 3, limit = 20, minConfidence = 0 } = options;

  const subgraph = await traverseGraph(nodeId, { ...options, maxDepth });

  const targetNodes = subgraph.nodes.filter(
    n => n.type === targetType && n.id !== nodeId && n.confidence >= minConfidence
  );

  const results: Array<{ node: GraphNode; path: GraphPath }> = [];

  for (const target of targetNodes.slice(0, limit)) {
    const path = await findPath(nodeId, target.id, { maxDepth, minConfidence });
    if (path) {
      results.push({ node: target, path });
    }
  }

  return results;
}

/**
 * Get graph statistics for a workspace
 */
export async function getGraphStatistics(workspaceId: string): Promise<GraphStatistics> {
  const supabase = await createClient();

  // Get entity counts
  const { data: entities } = await supabase
    .from('knowledge_entities')
    .select('id, entity_type')
    .eq('workspace_id', workspaceId);

  // Get relationship counts
  const { data: relationships } = await supabase
    .from('knowledge_entity_relationships')
    .select('id, relationship_type, source_entity_id, target_entity_id')
    .eq('workspace_id', workspaceId);

  const totalNodes = entities?.length || 0;
  const totalEdges = relationships?.length || 0;

  // Count nodes by type
  const nodesByType: Record<string, number> = {};
  entities?.forEach(e => {
    nodesByType[e.entity_type] = (nodesByType[e.entity_type] || 0) + 1;
  });

  // Count edges by type
  const edgesByType: Record<string, number> = {};
  relationships?.forEach(r => {
    edgesByType[r.relationship_type] = (edgesByType[r.relationship_type] || 0) + 1;
  });

  // Calculate degree distribution
  const degrees: Record<string, number> = {};
  relationships?.forEach(r => {
    degrees[r.source_entity_id] = (degrees[r.source_entity_id] || 0) + 1;
    degrees[r.target_entity_id] = (degrees[r.target_entity_id] || 0) + 1;
  });

  const degreeValues = Object.values(degrees);
  const maxDegree = degreeValues.length > 0 ? Math.max(...degreeValues) : 0;
  const averageDegree =
    degreeValues.length > 0 ? degreeValues.reduce((a, b) => a + b, 0) / degreeValues.length : 0;

  // Calculate density
  const density =
    totalNodes > 1 ? (2 * totalEdges) / (totalNodes * (totalNodes - 1)) : 0;

  // Calculate connected components (simplified - counts nodes with no edges)
  const connectedNodes = new Set([
    ...(relationships?.map(r => r.source_entity_id) || []),
    ...(relationships?.map(r => r.target_entity_id) || []),
  ]);
  const isolatedNodes = totalNodes - connectedNodes.size;
  const components = Math.max(1, isolatedNodes + (connectedNodes.size > 0 ? 1 : 0));

  return {
    totalNodes,
    totalEdges,
    nodesByType: nodesByType as Record<EntityType, number>,
    edgesByType: edgesByType as Record<RelationshipType, number>,
    averageDegree,
    maxDegree,
    density,
    components,
  };
}

/**
 * Search nodes by name or description
 */
export async function searchNodes(
  workspaceId: string,
  query: string,
  options: { entityTypes?: EntityType[]; limit?: number } = {}
): Promise<GraphNode[]> {
  const { entityTypes, limit = 50 } = options;

  const supabase = await createClient();

  let dbQuery = supabase
    .from('knowledge_entities')
    .select('*')
    .eq('workspace_id', workspaceId)
    .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
    .limit(limit);

  if (entityTypes && entityTypes.length > 0) {
    dbQuery = dbQuery.in('entity_type', entityTypes);
  }

  const { data, error } = await dbQuery;

  if (error || !data) {
    return [];
  }

  return data.map(entityToNode);
}

/**
 * Get central nodes in the graph (nodes with highest degree)
 */
export async function getCentralNodes(
  workspaceId: string,
  options: { limit?: number; entityTypes?: EntityType[] } = {}
): Promise<GraphNode[]> {
  const { limit = 10, entityTypes } = options;

  const supabase = await createClient();

  // Get all relationships to calculate degrees
  const { data: relationships } = await supabase
    .from('knowledge_entity_relationships')
    .select('source_entity_id, target_entity_id')
    .eq('workspace_id', workspaceId);

  if (!relationships || relationships.length === 0) {
    return [];
  }

  // Calculate degree for each node
  const degrees: Record<string, number> = {};
  relationships.forEach(r => {
    degrees[r.source_entity_id] = (degrees[r.source_entity_id] || 0) + 1;
    degrees[r.target_entity_id] = (degrees[r.target_entity_id] || 0) + 1;
  });

  // Sort by degree and get top nodes
  const sortedNodeIds = Object.entries(degrees)
    .sort(([, a], [, b]) => b - a)
    .slice(0, limit * 2) // Get extra in case some don't match entity type filter
    .map(([id]) => id);

  let query = supabase
    .from('knowledge_entities')
    .select('*')
    .eq('workspace_id', workspaceId)
    .in('id', sortedNodeIds);

  if (entityTypes && entityTypes.length > 0) {
    query = query.in('entity_type', entityTypes);
  }

  const { data: entities } = await query;

  if (!entities) return [];

  // Map to nodes with degree
  const nodes = entities.map(e => ({
    ...entityToNode(e),
    degree: degrees[e.id] || 0,
    centrality: degrees[e.id] / (2 * relationships.length) || 0,
  }));

  // Sort by degree and return top
  return nodes.sort((a, b) => (b.degree || 0) - (a.degree || 0)).slice(0, limit);
}

// Helper functions

function entityToNode(entity: {
  id: string;
  entity_type: string;
  name: string;
  description: string | null;
  confidence: number;
  metadata: unknown;
}): GraphNode {
  return {
    id: entity.id,
    type: entity.entity_type as EntityType,
    name: entity.name,
    description: entity.description || undefined,
    confidence: entity.confidence,
    properties: (entity.metadata as Record<string, unknown>) || {},
  };
}

function relationshipToEdge(relationship: {
  id: string;
  source_entity_id: string;
  target_entity_id: string;
  relationship_type: string;
  confidence: number;
  metadata: unknown;
}): GraphEdge {
  return {
    id: relationship.id,
    source: relationship.source_entity_id,
    target: relationship.target_entity_id,
    type: relationship.relationship_type as RelationshipType,
    confidence: relationship.confidence,
    metadata: (relationship.metadata as Record<string, unknown>) || undefined,
  };
}

async function reconstructPath(
  sourceId: string,
  targetId: string,
  parent: Map<string, { nodeId: string; edge: GraphEdge }>
): Promise<GraphPath> {
  const pathNodeIds: string[] = [];
  const pathEdges: GraphEdge[] = [];

  let current = targetId;
  while (current !== sourceId) {
    pathNodeIds.unshift(current);
    const parentInfo = parent.get(current);
    if (!parentInfo) break;
    pathEdges.unshift(parentInfo.edge);
    current = parentInfo.nodeId;
  }
  pathNodeIds.unshift(sourceId);

  const pathNodes = await getNodes(pathNodeIds);

  return {
    nodes: pathNodes,
    edges: pathEdges,
    length: pathEdges.length,
    totalConfidence:
      pathEdges.length > 0
        ? pathEdges.reduce((sum, e) => sum + e.confidence, 0) / pathEdges.length
        : 1,
  };
}
