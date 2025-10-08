/**
 * Origin Tracing Layout Algorithms
 * 
 * Functions for calculating node positions with force-directed clustering
 */

import { Node } from '@xyflow/react';

export interface ClusterConfig {
  id: string;
  nodeIds: string[];
  centerX: number;
  centerY: number;
  width: number;
  height: number;
}

/**
 * Cluster-aware overlap resolution
 * Only resolves overlaps within same or adjacent clusters
 */
export function resolveOverlaps(nodes: Node[], clusters: ClusterConfig[]): Node[] {
  const resolvedNodes = [...nodes];
  const gridSize = 20;
  
  // Create cluster lookup map
  const nodeToCluster = new Map<string, string>();
  clusters.forEach(cluster => {
    cluster.nodeIds.forEach(nodeId => {
      nodeToCluster.set(nodeId, cluster.id);
    });
  });
  
  // Multiple passes with aggressive separation
  for (let pass = 0; pass < 3; pass++) {
    for (let i = 0; i < resolvedNodes.length; i++) {
      for (let j = i + 1; j < resolvedNodes.length; j++) {
        const nodeA = resolvedNodes[i];
        const nodeB = resolvedNodes[j];
        
        // Check overlaps within same cluster AND across all nodes
        const clusterA = nodeToCluster.get(nodeA.id);
        const clusterB = nodeToCluster.get(nodeB.id);
        
        const dx = nodeB.position.x - nodeA.position.x;
        const dy = nodeB.position.y - nodeA.position.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Stricter minimum distance for same cluster, looser for different clusters
        const minDistance = clusterA === clusterB ? 380 : 340;
        
        // If too close, push apart
        if (distance < minDistance && distance > 0) {
          const pushDistance = ((minDistance - distance) / 2) + 30;
          const angle = Math.atan2(dy, dx);
          
          // Push nodes apart in opposite directions
          const pushX = Math.cos(angle) * pushDistance;
          const pushY = Math.sin(angle) * pushDistance;
          
          nodeA.position.x -= pushX;
          nodeA.position.y -= pushY;
          nodeB.position.x += pushX;
          nodeB.position.y += pushY;
        }
      }
    }
  }
  
  // Snap to grid
  resolvedNodes.forEach(node => {
    node.position.x = Math.round(node.position.x / gridSize) * gridSize;
    node.position.y = Math.round(node.position.y / gridSize) * gridSize;
  });
  
  return resolvedNodes;
}

/**
 * Create clustered layout with hierarchical flow and force-directed positioning
 */
export function createClusteredLayout(
  originNodeId: string | null,
  evolutionNodes: string[],
  claimNodeId: string,
  beliefDriverNodes: string[],
  sourceNodes: string[],
  linkNodes: string[],
  nodes: Node[]
): { nodes: Node[], clusters: ClusterConfig[] } {
  const centerX = 800; // Increased horizontal space
  const centerY = 450;
  
  // Define cluster regions - much larger to prevent overlaps
  const clusters: ClusterConfig[] = [];
  
  // Evolution Timeline cluster (left side)
  const evolutionClusterNodes = [
    ...(originNodeId ? [originNodeId] : []),
    ...evolutionNodes
  ];
  if (evolutionClusterNodes.length > 0) {
    // Dynamic sizing based on number of nodes - ensure enough space for sequential layout
    const nodesPerRow = Math.ceil(evolutionClusterNodes.length / 2);
    const rows = evolutionClusterNodes.length <= 3 ? 1 : 2;
    
    // 380px per node + extra padding
    const evolutionWidth = Math.max(800, nodesPerRow * 380 + 200);
    const evolutionHeight = rows * 260 + 140; // 260px per row + padding
    
    clusters.push({
      id: 'evolution',
      nodeIds: evolutionClusterNodes,
      centerX: centerX - 600,
      centerY: centerY,
      width: evolutionWidth,
      height: evolutionHeight
    });
  }
  
  // Claim cluster (center)
  clusters.push({
    id: 'claim',
    nodeIds: [claimNodeId],
    centerX: centerX + 200,
    centerY: centerY,
    width: 400,
    height: 220
  });
  
  // Belief Drivers cluster (top-center)
  if (beliefDriverNodes.length > 0) {
    const cols = Math.min(3, beliefDriverNodes.length);
    const rows = Math.ceil(beliefDriverNodes.length / cols);
    
    const beliefWidth = cols * 380 + 200; // 380px per column + padding
    const beliefHeight = rows * 240 + 160; // 240px per row + padding
    
    clusters.push({
      id: 'beliefs',
      nodeIds: beliefDriverNodes,
      centerX: centerX + 200,
      centerY: centerY - 450,
      width: beliefWidth,
      height: beliefHeight
    });
  }
  
  // Sources cluster (bottom-center)
  if (sourceNodes.length > 0) {
    const allSourceNodes = [...sourceNodes, ...linkNodes];
    const cols = Math.min(3, allSourceNodes.length);
    const rows = Math.ceil(allSourceNodes.length / cols);
    
    const sourceWidth = cols * 380 + 200; // 380px per column + padding
    const sourceHeight = rows * 240 + 160; // 240px per row + padding
    
    clusters.push({
      id: 'sources',
      nodeIds: allSourceNodes,
      centerX: centerX + 200,
      centerY: centerY + 450,
      width: sourceWidth,
      height: sourceHeight
    });
  }
  
  // Position nodes with proper grid spacing and guaranteed minimum distances
  const updatedNodes = nodes.map(node => {
    // Find which cluster this node belongs to
    const cluster = clusters.find(c => c.nodeIds.includes(node.id));
    if (!cluster) return node;
    
    const nodesInCluster = cluster.nodeIds;
    const nodeIndex = nodesInCluster.indexOf(node.id);
    const totalInCluster = nodesInCluster.length;
    
    let x = cluster.centerX;
    let y = cluster.centerY;
    
    if (cluster.id === 'evolution') {
      // Sequential left-to-right flow for evolution timeline
      // Each node gets guaranteed 380px horizontal spacing
      const horizontalSpacing = 380;
      const startX = cluster.centerX - cluster.width / 2 + 200;
      
      if (totalInCluster <= 3) {
        // Single row for few nodes
        x = startX + nodeIndex * horizontalSpacing;
        y = cluster.centerY;
      } else {
        // Two-row layout for many nodes - sequential wrapping
        const nodesPerRow = Math.ceil(totalInCluster / 2);
        const row = Math.floor(nodeIndex / nodesPerRow);
        const col = nodeIndex % nodesPerRow;
        
        x = startX + col * horizontalSpacing;
        y = cluster.centerY - 130 + row * 260; // 260px vertical spacing
      }
    } else if (cluster.id === 'claim') {
      // Single node at center
      x = cluster.centerX;
      y = cluster.centerY;
    } else if (cluster.id === 'beliefs' || cluster.id === 'sources') {
      // Grid layout with guaranteed spacing
      const cols = Math.min(3, totalInCluster);
      const rows = Math.ceil(totalInCluster / cols);
      const col = nodeIndex % cols;
      const row = Math.floor(nodeIndex / cols);
      
      // Fixed spacing: 380px horizontal, 240px vertical
      const colSpacing = 380;
      const rowSpacing = 240;
      
      x = cluster.centerX - (cols - 1) * colSpacing / 2 + col * colSpacing;
      y = cluster.centerY - (rows - 1) * rowSpacing / 2 + row * rowSpacing;
    }
    
    return { ...node, position: { x, y } };
  });
  
  // Skip force-directed refinement - it's causing overlaps
  // Just do final overlap check with minimal adjustment
  const finalNodes = resolveOverlaps(updatedNodes, clusters);
  
  return { nodes: finalNodes, clusters };
}

// Removed force-directed refinement function - was causing overlaps

