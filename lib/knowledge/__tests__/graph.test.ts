/**
 * Knowledge Graph Tests
 *
 * Unit tests for the knowledge graph module.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { EntityType, RelationshipType } from '@/lib/ai/types';
import type {
  GraphNode,
  GraphEdge,
  KnowledgeGraph,
  GraphMetadata,
} from '../graph/types';
import {
  toCytoscapeGraph,
  toD3Graph,
  toVisGraph,
  exportGraph,
  generateCytoscapeStyles,
  generateLegendSVG,
  calculateHierarchicalLayout,
  DEFAULT_ENTITY_COLORS,
  DEFAULT_RELATIONSHIP_COLORS,
} from '../graph/visualization';
import {
  mergeGraphs,
  filterGraphByEntityTypes,
  filterGraphByRelationshipTypes,
  filterGraphByConfidence,
  getEgoGraph,
  calculateCentrality,
  findClusters,
} from '../graph/builder';

// Mock Supabase
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => Promise.resolve({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: null, error: null })),
          in: vi.fn(() => Promise.resolve({ data: [], error: null })),
          gte: vi.fn(() => ({
            order: vi.fn(() => ({
              limit: vi.fn(() => Promise.resolve({ data: [], error: null })),
            })),
          })),
          or: vi.fn(() => Promise.resolve({ data: [], error: null })),
        })),
        in: vi.fn(() => Promise.resolve({ data: [], error: null })),
      })),
    })),
  })),
}));

// Test data helpers
function createTestNode(
  id: string,
  type: EntityType,
  name: string,
  confidence = 0.8
): GraphNode {
  return {
    id,
    type,
    name,
    description: `Description for ${name}`,
    confidence,
    properties: {},
  };
}

function createTestEdge(
  id: string,
  source: string,
  target: string,
  type: RelationshipType,
  confidence = 0.8
): GraphEdge {
  return {
    id,
    source,
    target,
    type,
    confidence,
  };
}

function createTestMetadata(
  workspaceId: string,
  nodeCount: number,
  edgeCount: number
): GraphMetadata {
  return {
    workspaceId,
    nodeCount,
    edgeCount,
    entityTypes: ['product', 'feature'],
    relationshipTypes: ['has_feature'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

function createTestGraph(): KnowledgeGraph {
  const nodes: GraphNode[] = [
    createTestNode('node1', 'product', 'Product A'),
    createTestNode('node2', 'feature', 'Feature 1'),
    createTestNode('node3', 'feature', 'Feature 2'),
    createTestNode('node4', 'benefit', 'Benefit 1'),
    createTestNode('node5', 'testimonial', 'Testimonial 1', 0.5),
  ];

  const edges: GraphEdge[] = [
    createTestEdge('edge1', 'node1', 'node2', 'has_feature'),
    createTestEdge('edge2', 'node1', 'node3', 'has_feature'),
    createTestEdge('edge3', 'node2', 'node4', 'provides_benefit'),
  ];

  return {
    nodes,
    edges,
    metadata: createTestMetadata('workspace1', nodes.length, edges.length),
  };
}

describe('Graph Visualization', () => {
  describe('toCytoscapeGraph', () => {
    it('should convert graph to Cytoscape format', () => {
      const graph = createTestGraph();
      const cytoscape = toCytoscapeGraph(graph);

      expect(cytoscape.elements.nodes).toHaveLength(5);
      expect(cytoscape.elements.edges).toHaveLength(3);

      // Check node structure
      const node = cytoscape.elements.nodes[0];
      expect(node.data.id).toBe('node1');
      expect(node.data.label).toBe('Product A');
      expect(node.data.type).toBe('product');
    });

    it('should include colors from color scheme', () => {
      const graph = createTestGraph();
      const cytoscape = toCytoscapeGraph(graph, { includeProperties: true });

      const productNode = cytoscape.elements.nodes.find(n => n.data.type === 'product');
      expect(productNode?.data.color).toBe(DEFAULT_ENTITY_COLORS.product);
    });

    it('should exclude properties when includeProperties is false', () => {
      const graph = createTestGraph();
      const cytoscape = toCytoscapeGraph(graph, { includeProperties: false });

      const node = cytoscape.elements.nodes[0];
      expect(node.data.description).toBeUndefined();
      expect(node.data.confidence).toBeUndefined();
    });
  });

  describe('toD3Graph', () => {
    it('should convert graph to D3 format', () => {
      const graph = createTestGraph();
      const d3 = toD3Graph(graph);

      expect(d3.nodes).toHaveLength(5);
      expect(d3.links).toHaveLength(3);

      // Check node structure
      const node = d3.nodes[0];
      expect(node.id).toBe('node1');
      expect(node.name).toBe('Product A');
      expect(node.group).toBe('product');

      // Check link structure
      const link = d3.links[0];
      expect(link.source).toBe('node1');
      expect(link.target).toBe('node2');
      expect(link.type).toBe('has_feature');
    });
  });

  describe('toVisGraph', () => {
    it('should convert graph to vis.js format', () => {
      const graph = createTestGraph();
      const vis = toVisGraph(graph);

      expect(vis.nodes).toHaveLength(5);
      expect(vis.edges).toHaveLength(3);

      // Check node structure
      const node = vis.nodes[0];
      expect(node.id).toBe('node1');
      expect(node.group).toBe('product');
      expect(node.title).toContain('Product A');

      // Check edge structure
      const edge = vis.edges[0];
      expect(edge.from).toBe('node1');
      expect(edge.to).toBe('node2');
      expect(edge.arrows).toBe('to');
    });
  });

  describe('exportGraph', () => {
    it('should export in Cytoscape format', () => {
      const graph = createTestGraph();
      const result = exportGraph(graph, { format: 'cytoscape' });

      expect(result).toHaveProperty('elements');
    });

    it('should export in D3 format', () => {
      const graph = createTestGraph();
      const result = exportGraph(graph, { format: 'd3' });

      expect(result).toHaveProperty('nodes');
      expect(result).toHaveProperty('links');
    });

    it('should export in vis.js format', () => {
      const graph = createTestGraph();
      const result = exportGraph(graph, { format: 'vis' });

      expect(result).toHaveProperty('nodes');
      expect(result).toHaveProperty('edges');
    });

    it('should export raw format', () => {
      const graph = createTestGraph();
      const result = exportGraph(graph, { format: 'raw' });

      expect(result).toHaveProperty('nodes');
      expect(result).toHaveProperty('edges');
      expect(result).toHaveProperty('metadata');
    });
  });

  describe('generateCytoscapeStyles', () => {
    it('should generate styles for all entity types', () => {
      const styles = generateCytoscapeStyles();

      // Should have base styles plus one for each entity type and relationship type
      expect(styles.length).toBeGreaterThan(2);

      // Check that styles include entity type selectors
      const productStyle = styles.find(
        (s: unknown) => (s as { selector: string }).selector === 'node[type = "product"]'
      );
      expect(productStyle).toBeDefined();
    });
  });

  describe('generateLegendSVG', () => {
    it('should generate SVG with entity types', () => {
      const entityTypes: EntityType[] = ['product', 'feature', 'benefit'];
      const svg = generateLegendSVG(entityTypes);

      expect(svg).toContain('<svg');
      expect(svg).toContain('Product');
      expect(svg).toContain('Feature');
      expect(svg).toContain('Benefit');
    });
  });

  describe('calculateHierarchicalLayout', () => {
    it('should calculate positions for all nodes', () => {
      const graph = createTestGraph();
      const positions = calculateHierarchicalLayout(graph.nodes, graph.edges);

      expect(positions.size).toBe(5);

      // Each position should have x and y
      positions.forEach((pos) => {
        expect(pos).toHaveProperty('x');
        expect(pos).toHaveProperty('y');
        expect(typeof pos.x).toBe('number');
        expect(typeof pos.y).toBe('number');
      });
    });
  });
});

describe('Graph Builder Functions', () => {
  describe('mergeGraphs', () => {
    it('should merge multiple graphs', () => {
      const graph1: KnowledgeGraph = {
        nodes: [createTestNode('node1', 'product', 'Product A')],
        edges: [],
        metadata: createTestMetadata('ws1', 1, 0),
      };

      const graph2: KnowledgeGraph = {
        nodes: [createTestNode('node2', 'feature', 'Feature 1')],
        edges: [],
        metadata: createTestMetadata('ws1', 1, 0),
      };

      const merged = mergeGraphs([graph1, graph2]);

      expect(merged.nodes).toHaveLength(2);
      expect(merged.metadata.nodeCount).toBe(2);
    });

    it('should keep higher confidence nodes for duplicates', () => {
      const graph1: KnowledgeGraph = {
        nodes: [createTestNode('node1', 'product', 'Product A', 0.7)],
        edges: [],
        metadata: createTestMetadata('ws1', 1, 0),
      };

      const graph2: KnowledgeGraph = {
        nodes: [createTestNode('node1', 'product', 'Product A', 0.9)],
        edges: [],
        metadata: createTestMetadata('ws1', 1, 0),
      };

      const merged = mergeGraphs([graph1, graph2]);

      expect(merged.nodes).toHaveLength(1);
      expect(merged.nodes[0].confidence).toBe(0.9);
    });

    it('should throw error for empty array', () => {
      expect(() => mergeGraphs([])).toThrow('Cannot merge empty array of graphs');
    });
  });

  describe('filterGraphByEntityTypes', () => {
    it('should filter nodes by entity type', () => {
      const graph = createTestGraph();
      const filtered = filterGraphByEntityTypes(graph, ['product', 'feature']);

      expect(filtered.nodes).toHaveLength(3);
      expect(filtered.nodes.every(n => ['product', 'feature'].includes(n.type))).toBe(true);
    });

    it('should remove edges with filtered nodes', () => {
      const graph = createTestGraph();
      const filtered = filterGraphByEntityTypes(graph, ['product']);

      // Only node1 (product) remains, so no edges should remain
      expect(filtered.nodes).toHaveLength(1);
      expect(filtered.edges).toHaveLength(0);
    });
  });

  describe('filterGraphByRelationshipTypes', () => {
    it('should filter edges by relationship type', () => {
      const graph = createTestGraph();
      const filtered = filterGraphByRelationshipTypes(graph, ['has_feature']);

      expect(filtered.edges).toHaveLength(2);
      expect(filtered.edges.every(e => e.type === 'has_feature')).toBe(true);
    });

    it('should keep only connected nodes', () => {
      const graph = createTestGraph();
      const filtered = filterGraphByRelationshipTypes(graph, ['provides_benefit']);

      // Only edge3 (node2 -> node4) should remain
      expect(filtered.edges).toHaveLength(1);
      expect(filtered.nodes).toHaveLength(2);
    });
  });

  describe('filterGraphByConfidence', () => {
    it('should filter nodes below confidence threshold', () => {
      const graph = createTestGraph();
      const filtered = filterGraphByConfidence(graph, 0.6, 0);

      // node5 has confidence 0.5, should be excluded
      expect(filtered.nodes).toHaveLength(4);
      expect(filtered.nodes.every(n => n.confidence >= 0.6)).toBe(true);
    });

    it('should filter edges below confidence threshold', () => {
      const graph = createTestGraph();
      graph.edges[0].confidence = 0.3; // Lower edge1 confidence

      const filtered = filterGraphByConfidence(graph, 0, 0.5);

      expect(filtered.edges).toHaveLength(2); // edge1 excluded
    });
  });

  describe('getEgoGraph', () => {
    it('should get 1-hop neighborhood', () => {
      const graph = createTestGraph();
      const ego = getEgoGraph(graph, 'node1', 1);

      // node1, node2, node3 (1 hop from node1)
      expect(ego.nodes.map(n => n.id).sort()).toEqual(['node1', 'node2', 'node3']);
    });

    it('should get 2-hop neighborhood', () => {
      const graph = createTestGraph();
      const ego = getEgoGraph(graph, 'node1', 2);

      // node1, node2, node3, node4 (2 hops)
      expect(ego.nodes).toHaveLength(4);
      expect(ego.nodes.map(n => n.id)).toContain('node4');
    });

    it('should handle disconnected nodes', () => {
      const graph = createTestGraph();
      const ego = getEgoGraph(graph, 'node5', 1);

      // node5 is disconnected
      expect(ego.nodes).toHaveLength(1);
      expect(ego.nodes[0].id).toBe('node5');
    });
  });

  describe('calculateCentrality', () => {
    it('should calculate centrality scores', () => {
      const graph = createTestGraph();
      const centrality = calculateCentrality(graph);

      expect(centrality.size).toBe(5);

      // node1 should have highest centrality (connected to node2 and node3)
      const node1Centrality = centrality.get('node1') || 0;
      const node5Centrality = centrality.get('node5') || 0;

      expect(node1Centrality).toBeGreaterThan(node5Centrality);
    });

    it('should handle empty graph', () => {
      const graph: KnowledgeGraph = {
        nodes: [],
        edges: [],
        metadata: createTestMetadata('ws1', 0, 0),
      };

      const centrality = calculateCentrality(graph);
      expect(centrality.size).toBe(0);
    });
  });

  describe('findClusters', () => {
    it('should find connected components', () => {
      const graph = createTestGraph();
      const clusters = findClusters(graph);

      // Should have 2 clusters: main component and node5 (isolated)
      expect(clusters).toHaveLength(2);

      // Largest cluster first
      expect(clusters[0].length).toBe(4);
      expect(clusters[1].length).toBe(1);
      expect(clusters[1][0].id).toBe('node5');
    });

    it('should handle fully connected graph', () => {
      const graph: KnowledgeGraph = {
        nodes: [
          createTestNode('node1', 'product', 'A'),
          createTestNode('node2', 'feature', 'B'),
        ],
        edges: [createTestEdge('edge1', 'node1', 'node2', 'has_feature')],
        metadata: createTestMetadata('ws1', 2, 1),
      };

      const clusters = findClusters(graph);
      expect(clusters).toHaveLength(1);
      expect(clusters[0]).toHaveLength(2);
    });
  });
});

describe('Default Colors', () => {
  it('should have colors for all entity types', () => {
    const entityTypes: EntityType[] = [
      'product',
      'service',
      'feature',
      'benefit',
      'pricing',
      'testimonial',
      'company',
      'person',
      'statistic',
      'faq',
      'cta',
      'process_step',
      'use_case',
      'integration',
      'contact',
    ];

    entityTypes.forEach(type => {
      expect(DEFAULT_ENTITY_COLORS[type]).toBeDefined();
      expect(DEFAULT_ENTITY_COLORS[type]).toMatch(/^#[0-9A-Fa-f]{6}$/);
    });
  });

  it('should have colors for all relationship types', () => {
    const relationshipTypes: RelationshipType[] = [
      'has_feature',
      'provides_benefit',
      'includes_pricing',
      'has_testimonial',
      'belongs_to',
      'authored_by',
      'related_to',
      'prerequisite_of',
      'alternative_to',
      'integrates_with',
      'addresses_use_case',
    ];

    relationshipTypes.forEach(type => {
      expect(DEFAULT_RELATIONSHIP_COLORS[type]).toBeDefined();
      expect(DEFAULT_RELATIONSHIP_COLORS[type]).toMatch(/^#[0-9A-Fa-f]{6}$/);
    });
  });
});
