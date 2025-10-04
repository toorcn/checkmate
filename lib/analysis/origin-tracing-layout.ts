/**
 * Origin Tracing Layout Algorithms
 * 
 * Functions for calculating node positions and resolving overlaps
 */

import { Node } from '@xyflow/react';

/**
 * Detect and resolve node overlaps with multiple passes
 * Enhanced with better spacing and collision detection
 */
export function resolveOverlaps(nodes: Node[]): Node[] {
  const resolvedNodes = [...nodes];
  const nodeSpacing = 380; // Increased minimum horizontal spacing
  const verticalSpacing = 260; // Increased minimum vertical spacing
  const gridSize = 20; // Finer grid for smoother positioning
  
  // Multiple passes to resolve all overlaps thoroughly
  for (let pass = 0; pass < 5; pass++) {
    for (let i = 0; i < resolvedNodes.length; i++) {
      for (let j = i + 1; j < resolvedNodes.length; j++) {
        const nodeA = resolvedNodes[i];
        const nodeB = resolvedNodes[j];
        
        const horizontalDistance = Math.abs(nodeA.position.x - nodeB.position.x);
        const verticalDistance = Math.abs(nodeA.position.y - nodeB.position.y);
        
        // Calculate actual node dimensions for more accurate collision
        const nodeAWidth = 320; // Max node width
        const nodeAHeight = 140; // Max node height
        const nodeBWidth = 320;
        const nodeBHeight = 140;
        
        // Check for actual overlap
        const overlapX = (nodeAWidth / 2 + nodeBWidth / 2) - horizontalDistance;
        const overlapY = (nodeAHeight / 2 + nodeBHeight / 2) - verticalDistance;
        
        // If nodes overlap or are too close
        if (overlapX > 0 && overlapY > 0) {
          // Resolve by moving in the direction of least overlap
          if (overlapX < overlapY) {
            // Move horizontally
            const adjustment = overlapX + 60;
            if (nodeA.position.x < nodeB.position.x) {
              nodeB.position.x += adjustment;
            } else {
              nodeA.position.x += adjustment;
            }
          } else {
            // Move vertically
            const adjustment = overlapY + 60;
            if (nodeA.position.y < nodeB.position.y) {
              nodeB.position.y += adjustment;
            } else {
              nodeA.position.y += adjustment;
            }
          }
        }
        
        // Additional check: ensure minimum spacing even without overlap
        if (verticalDistance < 150 && horizontalDistance < nodeSpacing) {
          const adjustment = nodeSpacing - horizontalDistance + 80;
          if (nodeA.position.x < nodeB.position.x) {
            nodeB.position.x += adjustment;
          } else {
            nodeA.position.x += adjustment;
          }
        }
        
        if (horizontalDistance < 150 && verticalDistance < verticalSpacing) {
          const adjustment = verticalSpacing - verticalDistance + 80;
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
 * Create logical flow layout for nodes with improved spacing and clarity
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
  const centerX = 1400; // Moved right for more space
  const centerY = 500; // Moved down for better balance
  
  // Create a clear, hierarchical flow pattern with ample spacing
  const flowLayout = {
    // Origin on far left with more space
    origin: { x: centerX - 1100, y: centerY },
    
    // Evolution chain with significantly increased spacing
    evolution: {
      startX: centerX - 1000,
      endX: centerX - 400,
      y: centerY,
      spacing: Math.max(350, 800 / Math.max(evolutionNodes.length, 1))
    },
    
    // Claim at center (destination of flow)
    claim: { x: centerX, y: centerY },
    
    // Belief drivers above in wider arc formation
    beliefs: {
      centerX: centerX - 200,
      y: centerY - 450, // More vertical separation
      radius: 600, // Larger radius to spread out
      startAngle: -Math.PI / 2.2,
      endAngle: Math.PI / 2.2
    },
    
    // Sources below in wider arc formation
    sources: {
      centerX: centerX,
      y: centerY + 450, // More vertical separation
      radius: 600, // Larger radius
      startAngle: Math.PI / 3.5,
      endAngle: Math.PI - Math.PI / 3.5
    },
    
    // Links on the right side with better spacing
    links: {
      x: centerX + 650, // More horizontal separation
      startY: centerY - 400,
      spacing: 220 // Increased vertical spacing
    }
  };
  
  const updatedNodes = nodes.map(node => {
    // Update origin position
    if (node.id === originNodeId) {
      return { ...node, position: flowLayout.origin };
    }
    
    // Update evolution nodes with improved vertical distribution
    const evolutionIndex = evolutionNodes.indexOf(node.id);
    if (evolutionIndex !== -1) {
      const progress = evolutionNodes.length > 1 ? evolutionIndex / (evolutionNodes.length - 1) : 0;
      const x = flowLayout.evolution.startX + (flowLayout.evolution.endX - flowLayout.evolution.startX) * progress;
      
      // Better vertical stagger pattern to avoid overlaps
      let yOffset = 0;
      if (evolutionNodes.length > 3) {
        // For many nodes, use sine wave pattern for smooth distribution
        yOffset = Math.sin(progress * Math.PI * 2) * 150;
      } else {
        // For few nodes, use simple alternating pattern
        yOffset = (evolutionIndex % 3 - 1) * 180;
      }
      
      return { ...node, position: { x, y: flowLayout.evolution.y + yOffset } };
    }
    
    // Update claim position
    if (node.id === claimNodeId) {
      return { ...node, position: flowLayout.claim };
    }
    
    // Update belief driver positions in wider arc
    const beliefIndex = beliefDriverNodes.indexOf(node.id);
    if (beliefIndex !== -1 && beliefDriverNodes.length > 0) {
      const angle = beliefDriverNodes.length === 1 
        ? 0 
        : flowLayout.beliefs.startAngle + (flowLayout.beliefs.endAngle - flowLayout.beliefs.startAngle) * (beliefIndex / (beliefDriverNodes.length - 1));
      const x = flowLayout.beliefs.centerX + Math.cos(angle) * flowLayout.beliefs.radius;
      const y = flowLayout.beliefs.y + Math.sin(angle) * (flowLayout.beliefs.radius * 0.4); // Flatter arc
      return { ...node, position: { x, y } };
    }
    
    // Update source positions in wider arc
    const sourceIndex = sourceNodes.indexOf(node.id);
    if (sourceIndex !== -1 && sourceNodes.length > 0) {
      const angle = sourceNodes.length === 1 
        ? Math.PI / 2 
        : flowLayout.sources.startAngle + (flowLayout.sources.endAngle - flowLayout.sources.startAngle) * (sourceIndex / (sourceNodes.length - 1));
      const x = flowLayout.sources.centerX + Math.cos(angle) * flowLayout.sources.radius;
      const y = flowLayout.sources.y + Math.sin(angle) * (flowLayout.sources.radius * 0.35); // Flatter arc
      return { ...node, position: { x, y } };
    }
    
    // Update link positions in column with better spacing
    const linkIndex = linkNodes.indexOf(node.id);
    if (linkIndex !== -1) {
      // Stagger links horizontally slightly to avoid strict column
      const xOffset = (linkIndex % 2) * 100;
      return { 
        ...node, 
        position: { 
          x: flowLayout.links.x + xOffset, 
          y: flowLayout.links.startY + linkIndex * flowLayout.links.spacing 
        } 
      };
    }
    
    return node;
  });
  
  return resolveOverlaps(updatedNodes);
}

