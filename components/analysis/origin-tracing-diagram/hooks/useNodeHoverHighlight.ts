/**
 * useNodeHoverHighlight Hook
 * 
 * Manages node hover state and highlights connected edges/nodes
 */

import { useState, useCallback, useMemo } from 'react';
import { Node, Edge } from '@xyflow/react';

type HighlightMode = 'all' | 'incoming' | 'self';

interface UseNodeHoverHighlightProps {
  nodes: Node[];
  edges: Edge[];
  disabled?: boolean; // Disable hover interactions when panning
  forcedNodeId?: string | null; // Force highlight a specific node (for animation mode)
  highlightMode?: HighlightMode; // Control which connections to highlight
}

interface UseNodeHoverHighlightResult {
  hoveredNodeId: string | null;
  highlightedEdges: Set<string>;
  highlightedNodes: Set<string>;
  onNodeMouseEnter: (_event: React.MouseEvent, node: Node) => void;
  onNodeMouseLeave: () => void;
  onSidebarItemMouseEnter: (nodeId: string) => void;
  onSidebarItemMouseLeave: () => void;
  setHoveredNodeId: (nodeId: string | null) => void;
}

/**
 * Hook to manage node hover highlighting
 * When a node is hovered (from graph or sidebar), it highlights:
 * - The node itself
 * - Connected edges and nodes (based on highlightMode)
 * 
 * Special handling:
 * - Origin nodes ('origin' type) highlight the entire path from origin to claim node
 *   This traces the evolution timeline showing how the claim originated and evolved
 * - Claim nodes ('claim' type) always use 'self' mode - only the node is highlighted, no connections
 * 
 * Can be disabled during panning or forced to highlight a specific node during animation
 * 
 * Highlight modes:
 * - 'all': Highlight all connections (default for manual hover)
 * - 'incoming': Highlight only incoming connections (for animation flow)
 * - 'self': Highlight only the node itself (automatically applied to claim nodes)
 */
export function useNodeHoverHighlight({
  nodes,
  edges,
  disabled = false,
  forcedNodeId = null,
  highlightMode = 'all',
}: UseNodeHoverHighlightProps): UseNodeHoverHighlightResult {
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  
  // Use forced node ID when provided (during animation), otherwise use hovered node ID
  const effectiveNodeId = forcedNodeId || hoveredNodeId;

  // Build adjacency map for quick lookups
  // Separate incoming and outgoing connections for directional highlighting
  const adjacencyMap = useMemo(() => {
    const map = new Map<string, { 
      incomingNodes: Set<string>; 
      incomingEdges: Set<string>;
      outgoingNodes: Set<string>; 
      outgoingEdges: Set<string>;
    }>();
    
    // Initialize all nodes
    nodes.forEach(node => {
      map.set(node.id, {
        incomingNodes: new Set<string>(),
        incomingEdges: new Set<string>(),
        outgoingNodes: new Set<string>(),
        outgoingEdges: new Set<string>(),
      });
    });
    
    // Build connections with direction tracking
    edges.forEach(edge => {
      const sourceData = map.get(edge.source);
      const targetData = map.get(edge.target);
      
      // For source node: this edge goes out
      if (sourceData) {
        sourceData.outgoingNodes.add(edge.target);
        sourceData.outgoingEdges.add(edge.id);
      }
      
      // For target node: this edge comes in
      if (targetData) {
        targetData.incomingNodes.add(edge.source);
        targetData.incomingEdges.add(edge.id);
      }
    });
    
    return map;
  }, [nodes, edges]);

  // Helper function to find path from origin to claim node using BFS
  const findPathToClaim = useCallback((startNodeId: string): { nodes: Set<string>; edges: Set<string> } => {
    const claimNode = nodes.find(n => n.type === 'claim');
    if (!claimNode) {
      return { nodes: new Set(), edges: new Set() };
    }

    // BFS to find path from start to claim
    const queue: Array<{ nodeId: string; path: string[]; edgePath: string[] }> = [
      { nodeId: startNodeId, path: [startNodeId], edgePath: [] }
    ];
    const visited = new Set<string>([startNodeId]);

    while (queue.length > 0) {
      const { nodeId, path, edgePath } = queue.shift()!;

      // Found the claim node - return the path
      if (nodeId === claimNode.id) {
        return {
          nodes: new Set(path),
          edges: new Set(edgePath),
        };
      }

      // Explore outgoing connections
      const nodeData = adjacencyMap.get(nodeId);
      if (nodeData) {
        // Find edges that go from current node to each outgoing node
        nodeData.outgoingNodes.forEach(nextNodeId => {
          if (!visited.has(nextNodeId)) {
            visited.add(nextNodeId);
            
            // Find the edge connecting nodeId to nextNodeId
            const connectingEdge = edges.find(
              e => e.source === nodeId && e.target === nextNodeId
            );
            
            if (connectingEdge) {
              queue.push({
                nodeId: nextNodeId,
                path: [...path, nextNodeId],
                edgePath: [...edgePath, connectingEdge.id],
              });
            }
          }
        });
      }
    }

    // No path found
    return { nodes: new Set(), edges: new Set() };
  }, [nodes, edges, adjacencyMap]);

  // Calculate highlighted edges and nodes based on effective node and highlight mode
  const { highlightedEdges, highlightedNodes } = useMemo(() => {
    if (!effectiveNodeId) {
      return {
        highlightedEdges: new Set<string>(),
        highlightedNodes: new Set<string>(),
      };
    }

    const nodeData = adjacencyMap.get(effectiveNodeId);
    if (!nodeData) {
      return {
        highlightedEdges: new Set<string>(),
        highlightedNodes: new Set<string>(),
      };
    }

    // Find the node to check its type
    const currentNode = nodes.find(n => n.id === effectiveNodeId);
    const isClaimNode = currentNode?.type === 'claim';
    const isOriginNode = currentNode?.type === 'origin';
    
    // Special case: Origin node highlights entire path to claim
    if (isOriginNode) {
      const pathResult = findPathToClaim(effectiveNodeId);
      return {
        highlightedEdges: pathResult.edges,
        highlightedNodes: pathResult.nodes,
      };
    }
    
    // If it's the current claim node, always use 'self' mode (no connections highlighted)
    const effectiveHighlightMode = isClaimNode ? 'self' : highlightMode;

    // Highlight based on mode
    switch (effectiveHighlightMode) {
      case 'self':
        // Only highlight the node itself, no connections
        return {
          highlightedEdges: new Set<string>(),
          highlightedNodes: new Set([effectiveNodeId]),
        };
      
      case 'incoming':
        // Highlight node + incoming connections (where it came from)
        return {
          highlightedEdges: nodeData.incomingEdges,
          highlightedNodes: new Set([effectiveNodeId, ...Array.from(nodeData.incomingNodes)]),
        };
      
      case 'all':
      default:
        // Highlight node + all connections (incoming and outgoing)
        const allEdges = new Set([
          ...Array.from(nodeData.incomingEdges),
          ...Array.from(nodeData.outgoingEdges),
        ]);
        const allNodes = new Set([
          effectiveNodeId,
          ...Array.from(nodeData.incomingNodes),
          ...Array.from(nodeData.outgoingNodes),
        ]);
        return {
          highlightedEdges: allEdges,
          highlightedNodes: allNodes,
        };
    }
  }, [effectiveNodeId, adjacencyMap, highlightMode, nodes, findPathToClaim]);

  // Event handlers for graph nodes - disabled when panning or when forced node is set
  const onNodeMouseEnter = useCallback((_event: React.MouseEvent, node: Node) => {
    if (!disabled && !forcedNodeId) {
      setHoveredNodeId(node.id);
    }
  }, [disabled, forcedNodeId]);

  const onNodeMouseLeave = useCallback(() => {
    if (!disabled && !forcedNodeId) {
      setHoveredNodeId(null);
    }
  }, [disabled, forcedNodeId]);

  // Event handlers for sidebar items - disabled when panning or when forced node is set
  const onSidebarItemMouseEnter = useCallback((nodeId: string) => {
    if (!disabled && !forcedNodeId) {
      setHoveredNodeId(nodeId);
    }
  }, [disabled, forcedNodeId]);

  const onSidebarItemMouseLeave = useCallback(() => {
    if (!disabled && !forcedNodeId) {
      setHoveredNodeId(null);
    }
  }, [disabled, forcedNodeId]);

  return {
    hoveredNodeId: effectiveNodeId,
    highlightedEdges,
    highlightedNodes,
    onNodeMouseEnter,
    onNodeMouseLeave,
    onSidebarItemMouseEnter,
    onSidebarItemMouseLeave,
    setHoveredNodeId,
  };
}

