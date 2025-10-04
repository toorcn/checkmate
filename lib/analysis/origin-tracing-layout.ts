/**
 * Origin Tracing Layout Algorithms
 * 
 * Functions for calculating node positions and resolving overlaps
 */

import { Node } from '@xyflow/react';

/**
 * Detect and resolve node overlaps with multiple passes
 */
export function resolveOverlaps(nodes: Node[]): Node[] {
  const resolvedNodes = [...nodes];
  const nodeSpacing = 280; // Reduced minimum spacing between nodes
  const verticalSpacing = 180; // Reduced minimum vertical spacing
  const gridSize = 40; // Snap to grid for cleaner layout
  
  // Multiple passes to resolve all overlaps
  for (let pass = 0; pass < 3; pass++) {
    for (let i = 0; i < resolvedNodes.length; i++) {
      for (let j = i + 1; j < resolvedNodes.length; j++) {
        const nodeA = resolvedNodes[i];
        const nodeB = resolvedNodes[j];
        
        const horizontalDistance = Math.abs(nodeA.position.x - nodeB.position.x);
        const verticalDistance = Math.abs(nodeA.position.y - nodeB.position.y);
        
        // Check if nodes are too close horizontally (same row-ish)
        if (verticalDistance < 120 && horizontalDistance < nodeSpacing) {
          const adjustment = nodeSpacing - horizontalDistance + 40; // Reduced buffer
          
          // Move the rightmost node further right
          if (nodeA.position.x < nodeB.position.x) {
            nodeB.position.x += adjustment;
          } else {
            nodeA.position.x += adjustment;
          }
        }
        
        // Check if nodes are too close vertically (same column-ish)
        if (horizontalDistance < 120 && verticalDistance < verticalSpacing) {
          const adjustment = verticalSpacing - verticalDistance + 40; // Reduced buffer
          
          // Move the lower node further down
          if (nodeA.position.y < nodeB.position.y) {
            nodeB.position.y += adjustment;
          } else {
            nodeA.position.y += adjustment;
          }
        }
      }
    }
  }
  
  // Snap all nodes to grid for cleaner layout
  resolvedNodes.forEach(node => {
    node.position.x = Math.round(node.position.x / gridSize) * gridSize;
    node.position.y = Math.round(node.position.y / gridSize) * gridSize;
  });
  
  return resolvedNodes;
}

/**
 * Create logical flow layout for nodes
 */
export function createLogicalFlow(
  originNodeId: string | null,
  evolutionNodes: string[],
  claimNodeId: string,
  beliefDriverNodes: string[],
  sourceNodes: string[],
  linkNodes: string[],
  nodes: Node[]
): Node[] {
  const centerX = 1200;
  const centerY = 400;
  
  // Create a more logical flow pattern
  const flowLayout = {
    // Origin on far left
    origin: { x: centerX - 800, y: centerY },
    
    // Evolution chain flowing left to right toward center - reduced spacing
    evolution: {
      startX: centerX - 700,
      endX: centerX - 250,
      y: centerY,
      spacing: Math.max(250, 500 / Math.max(evolutionNodes.length, 1))
    },
    
    // Claim at center-right (destination of flow)
    claim: { x: centerX, y: centerY },
    
    // Belief drivers above in arc formation - reduced spacing
    beliefs: {
      centerX: centerX - 350,
      y: centerY - 300,
      radius: 450,
      startAngle: -Math.PI / 2.5,
      endAngle: Math.PI / 2.5
    },
    
    // Sources below in arc formation - reduced spacing
    sources: {
      centerX: centerX,
      y: centerY + 300,
      radius: 450,
      startAngle: Math.PI / 4,
      endAngle: Math.PI - Math.PI / 4
    },
    
    // Links on the right side in column - reduced spacing
    links: {
      x: centerX + 500,
      startY: centerY - 250,
      spacing: 150
    }
  };
  
  const updatedNodes = nodes.map(node => {
    // Update origin position
    if (node.id === originNodeId) {
      return { ...node, position: flowLayout.origin };
    }
    
    // Update evolution nodes
    const evolutionIndex = evolutionNodes.indexOf(node.id);
    if (evolutionIndex !== -1) {
      const progress = evolutionNodes.length > 1 ? evolutionIndex / (evolutionNodes.length - 1) : 0;
      const x = flowLayout.evolution.startX + (flowLayout.evolution.endX - flowLayout.evolution.startX) * progress;
      const yOffset = (evolutionIndex % 3 - 1) * 100; // Reduced vertical stagger
      return { ...node, position: { x, y: flowLayout.evolution.y + yOffset } };
    }
    
    // Update claim position
    if (node.id === claimNodeId) {
      return { ...node, position: flowLayout.claim };
    }
    
    // Update belief driver positions in arc
    const beliefIndex = beliefDriverNodes.indexOf(node.id);
    if (beliefIndex !== -1 && beliefDriverNodes.length > 0) {
      const angle = beliefDriverNodes.length === 1 
        ? 0 
        : flowLayout.beliefs.startAngle + (flowLayout.beliefs.endAngle - flowLayout.beliefs.startAngle) * (beliefIndex / (beliefDriverNodes.length - 1));
      const x = flowLayout.beliefs.centerX + Math.cos(angle) * flowLayout.beliefs.radius;
      const y = flowLayout.beliefs.y + Math.sin(angle) * flowLayout.beliefs.radius / 2;
      return { ...node, position: { x, y } };
    }
    
    // Update source positions in arc
    const sourceIndex = sourceNodes.indexOf(node.id);
    if (sourceIndex !== -1 && sourceNodes.length > 0) {
      const angle = sourceNodes.length === 1 
        ? Math.PI / 2 
        : flowLayout.sources.startAngle + (flowLayout.sources.endAngle - flowLayout.sources.startAngle) * (sourceIndex / (sourceNodes.length - 1));
      const x = flowLayout.sources.centerX + Math.cos(angle) * flowLayout.sources.radius;
      const y = flowLayout.sources.y + Math.sin(angle) * flowLayout.sources.radius / 3;
      return { ...node, position: { x, y } };
    }
    
    // Update link positions in column
    const linkIndex = linkNodes.indexOf(node.id);
    if (linkIndex !== -1) {
      return { 
        ...node, 
        position: { 
          x: flowLayout.links.x, 
          y: flowLayout.links.startY + linkIndex * flowLayout.links.spacing 
        } 
      };
    }
    
    return node;
  });
  
  return resolveOverlaps(updatedNodes);
}

