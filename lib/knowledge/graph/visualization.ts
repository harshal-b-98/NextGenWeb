/**
 * Knowledge Graph Visualization
 *
 * Export functions for graph visualization libraries.
 */

import type { EntityType, RelationshipType } from '@/lib/ai/types';
import type {
  GraphNode,
  GraphEdge,
  KnowledgeGraph,
  Subgraph,
  GraphVisualizationOptions,
  CytoscapeGraph,
  D3Graph,
  VisGraph,
} from './types';

/**
 * Default color scheme for entity types
 */
export const DEFAULT_ENTITY_COLORS: Record<EntityType, string> = {
  product: '#3B82F6', // blue
  service: '#8B5CF6', // purple
  feature: '#10B981', // green
  benefit: '#F59E0B', // amber
  pricing: '#EF4444', // red
  testimonial: '#EC4899', // pink
  company: '#6366F1', // indigo
  person: '#14B8A6', // teal
  statistic: '#F97316', // orange
  faq: '#06B6D4', // cyan
  cta: '#DC2626', // red-600
  process_step: '#7C3AED', // violet
  use_case: '#059669', // emerald
  integration: '#2563EB', // blue-600
  contact: '#4B5563', // gray
};

/**
 * Default edge colors for relationship types
 */
export const DEFAULT_RELATIONSHIP_COLORS: Record<RelationshipType, string> = {
  has_feature: '#10B981',
  provides_benefit: '#F59E0B',
  includes_pricing: '#EF4444',
  has_testimonial: '#EC4899',
  belongs_to: '#6366F1',
  authored_by: '#14B8A6',
  related_to: '#9CA3AF',
  prerequisite_of: '#7C3AED',
  alternative_to: '#F97316',
  integrates_with: '#2563EB',
  addresses_use_case: '#059669',
};

/**
 * Export graph to Cytoscape format
 */
export function toCytoscapeGraph(
  graph: KnowledgeGraph | Subgraph,
  options: Partial<GraphVisualizationOptions> = {}
): CytoscapeGraph {
  const { includeProperties = true, colorScheme = DEFAULT_ENTITY_COLORS } = options;

  return {
    elements: {
      nodes: graph.nodes.map(node => ({
        data: {
          id: node.id,
          label: node.name,
          type: node.type,
          ...(includeProperties && {
            description: node.description,
            confidence: node.confidence,
            color: colorScheme[node.type] || '#9CA3AF',
            ...node.properties,
          }),
        },
      })),
      edges: graph.edges.map(edge => ({
        data: {
          id: edge.id,
          source: edge.source,
          target: edge.target,
          type: edge.type,
          label: formatRelationshipLabel(edge.type),
          confidence: edge.confidence,
          color: DEFAULT_RELATIONSHIP_COLORS[edge.type] || '#9CA3AF',
        },
      })),
    },
  };
}

/**
 * Export graph to D3 force-directed format
 */
export function toD3Graph(
  graph: KnowledgeGraph | Subgraph,
  options: Partial<GraphVisualizationOptions> = {}
): D3Graph {
  const { includeProperties = true, colorScheme = DEFAULT_ENTITY_COLORS } = options;

  return {
    nodes: graph.nodes.map(node => ({
      id: node.id,
      name: node.name,
      group: node.type,
      ...(includeProperties && {
        description: node.description,
        confidence: node.confidence,
        color: colorScheme[node.type] || '#9CA3AF',
        ...node.properties,
      }),
    })),
    links: graph.edges.map(edge => ({
      source: edge.source,
      target: edge.target,
      type: edge.type,
      value: edge.confidence,
      label: formatRelationshipLabel(edge.type),
    })),
  };
}

/**
 * Export graph to vis.js format
 */
export function toVisGraph(
  graph: KnowledgeGraph | Subgraph,
  options: Partial<GraphVisualizationOptions> = {}
): VisGraph {
  const { includeProperties = true, colorScheme = DEFAULT_ENTITY_COLORS } = options;

  return {
    nodes: graph.nodes.map(node => ({
      id: node.id,
      label: truncateLabel(node.name, 25),
      group: node.type,
      title: buildNodeTooltip(node),
      ...(includeProperties && {
        color: {
          background: colorScheme[node.type] || '#9CA3AF',
          border: darkenColor(colorScheme[node.type] || '#9CA3AF', 20),
        },
        ...node.properties,
      }),
    })),
    edges: graph.edges.map(edge => ({
      from: edge.source,
      to: edge.target,
      label: formatRelationshipLabel(edge.type),
      arrows: 'to',
      title: `${formatRelationshipLabel(edge.type)} (${Math.round(edge.confidence * 100)}% confidence)`,
      color: {
        color: DEFAULT_RELATIONSHIP_COLORS[edge.type] || '#9CA3AF',
        opacity: Math.max(0.4, edge.confidence),
      },
    })),
  };
}

/**
 * Export graph as JSON for custom visualization
 */
export function toRawGraph(
  graph: KnowledgeGraph | Subgraph,
  options: Partial<GraphVisualizationOptions> = {}
): { nodes: GraphNode[]; edges: GraphEdge[]; metadata?: unknown } {
  const { colorScheme = DEFAULT_ENTITY_COLORS } = options;

  return {
    nodes: graph.nodes.map(node => ({
      ...node,
      properties: {
        ...node.properties,
        color: colorScheme[node.type] || '#9CA3AF',
      },
    })),
    edges: graph.edges.map(edge => ({
      ...edge,
      metadata: {
        ...edge.metadata,
        color: DEFAULT_RELATIONSHIP_COLORS[edge.type] || '#9CA3AF',
      },
    })),
    metadata: 'metadata' in graph ? graph.metadata : undefined,
  };
}

/**
 * Export graph in specified format
 */
export function exportGraph(
  graph: KnowledgeGraph | Subgraph,
  options: GraphVisualizationOptions
): CytoscapeGraph | D3Graph | VisGraph | ReturnType<typeof toRawGraph> {
  switch (options.format) {
    case 'cytoscape':
      return toCytoscapeGraph(graph, options);
    case 'd3':
      return toD3Graph(graph, options);
    case 'vis':
      return toVisGraph(graph, options);
    case 'raw':
    default:
      return toRawGraph(graph, options);
  }
}

/**
 * Generate Cytoscape stylesheet for the graph
 */
export function generateCytoscapeStyles(
  colorScheme: Record<EntityType, string> = DEFAULT_ENTITY_COLORS
): object[] {
  const styles: object[] = [
    // Node base style
    {
      selector: 'node',
      style: {
        'background-color': '#9CA3AF',
        label: 'data(label)',
        'text-valign': 'bottom',
        'text-halign': 'center',
        'font-size': '12px',
        width: 40,
        height: 40,
      },
    },
    // Edge base style
    {
      selector: 'edge',
      style: {
        width: 2,
        'line-color': '#9CA3AF',
        'target-arrow-color': '#9CA3AF',
        'target-arrow-shape': 'triangle',
        'curve-style': 'bezier',
        label: 'data(label)',
        'font-size': '10px',
        'text-rotation': 'autorotate',
      },
    },
  ];

  // Add styles for each entity type
  for (const [type, color] of Object.entries(colorScheme)) {
    styles.push({
      selector: `node[type = "${type}"]`,
      style: {
        'background-color': color,
      },
    });
  }

  // Add styles for each relationship type
  for (const [type, color] of Object.entries(DEFAULT_RELATIONSHIP_COLORS)) {
    styles.push({
      selector: `edge[type = "${type}"]`,
      style: {
        'line-color': color,
        'target-arrow-color': color,
      },
    });
  }

  return styles;
}

/**
 * Generate SVG legend for entity types
 */
export function generateLegendSVG(
  entityTypes: EntityType[],
  colorScheme: Record<EntityType, string> = DEFAULT_ENTITY_COLORS
): string {
  const itemHeight = 24;
  const padding = 16;
  const circleRadius = 8;

  const items = entityTypes.map((type, index) => {
    const y = padding + index * itemHeight;
    const color = colorScheme[type] || '#9CA3AF';

    return `
      <g transform="translate(${padding}, ${y})">
        <circle cx="${circleRadius}" cy="${circleRadius}" r="${circleRadius}" fill="${color}"/>
        <text x="${circleRadius * 2 + 8}" y="${circleRadius + 4}" font-size="12" fill="#374151">
          ${formatEntityTypeLabel(type)}
        </text>
      </g>
    `;
  });

  const height = padding * 2 + entityTypes.length * itemHeight;
  const width = 180;

  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
      <rect width="${width}" height="${height}" fill="white" rx="8"/>
      ${items.join('')}
    </svg>
  `.trim();
}

/**
 * Calculate node positions for hierarchical layout
 */
export function calculateHierarchicalLayout(
  nodes: GraphNode[],
  edges: GraphEdge[],
  options: { width?: number; height?: number; spacing?: number } = {}
): Map<string, { x: number; y: number }> {
  const { width = 800, height = 600, spacing = 100 } = options;

  // Build adjacency list
  const adjacency = new Map<string, Set<string>>();
  nodes.forEach(n => adjacency.set(n.id, new Set()));

  edges.forEach(e => {
    adjacency.get(e.source)?.add(e.target);
  });

  // Find root nodes (no incoming edges)
  const hasIncoming = new Set(edges.map(e => e.target));
  const roots = nodes.filter(n => !hasIncoming.has(n.id));

  // BFS to assign levels
  const levels = new Map<string, number>();
  const queue = roots.map(r => ({ id: r.id, level: 0 }));
  const visited = new Set<string>();

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (visited.has(current.id)) continue;

    visited.add(current.id);
    levels.set(current.id, current.level);

    const neighbors = adjacency.get(current.id) || new Set();
    neighbors.forEach(n => {
      if (!visited.has(n)) {
        queue.push({ id: n, level: current.level + 1 });
      }
    });
  }

  // Handle disconnected nodes
  nodes.forEach(n => {
    if (!levels.has(n.id)) {
      levels.set(n.id, 0);
    }
  });

  // Group nodes by level
  const levelGroups = new Map<number, string[]>();
  levels.forEach((level, id) => {
    if (!levelGroups.has(level)) {
      levelGroups.set(level, []);
    }
    levelGroups.get(level)!.push(id);
  });

  // Calculate positions
  const positions = new Map<string, { x: number; y: number }>();
  const maxLevel = Math.max(...levels.values());
  const levelHeight = maxLevel > 0 ? height / (maxLevel + 1) : height / 2;

  levelGroups.forEach((nodeIds, level) => {
    const nodeWidth = width / (nodeIds.length + 1);
    nodeIds.forEach((id, index) => {
      positions.set(id, {
        x: nodeWidth * (index + 1),
        y: levelHeight * level + spacing / 2,
      });
    });
  });

  return positions;
}

// Helper functions

function formatRelationshipLabel(type: RelationshipType): string {
  return type.split('_').join(' ');
}

function formatEntityTypeLabel(type: EntityType): string {
  return type
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function truncateLabel(label: string, maxLength: number): string {
  if (label.length <= maxLength) return label;
  return label.substring(0, maxLength - 3) + '...';
}

function buildNodeTooltip(node: GraphNode): string {
  const lines = [
    `<strong>${node.name}</strong>`,
    `Type: ${formatEntityTypeLabel(node.type)}`,
    `Confidence: ${Math.round(node.confidence * 100)}%`,
  ];

  if (node.description) {
    lines.push(`Description: ${truncateLabel(node.description, 100)}`);
  }

  return lines.join('<br>');
}

function darkenColor(hex: string, percent: number): string {
  // Simple color darkening
  const num = parseInt(hex.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.max((num >> 16) - amt, 0);
  const G = Math.max(((num >> 8) & 0x00ff) - amt, 0);
  const B = Math.max((num & 0x0000ff) - amt, 0);
  return `#${(0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1)}`;
}
