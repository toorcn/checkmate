/**
 * Smart Edge Routing for Origin Tracing Diagram
 * 
 * Functions for calculating optimal edge paths with minimal overlaps
 */

import { Edge } from '@xyflow/react';
import { ClusterConfig } from './origin-tracing-layout';

export interface EdgePath {
  id: string;
  path: string;
  waypoints: { x: number; y: number }[];
}

/**
 * Calculate smart edge paths with cluster awareness
 */
export function calculateSmartEdgePaths(
  edges: Edge[],
  nodePositions: Map<string, { x: number; y: number }>,
  clusters: ClusterConfig[]
): Map<string, EdgePath> {
  const edgePaths = new Map<string, EdgePath>();
  const usedPaths: EdgePath[] = [];
  
  // Create cluster lookup
  const nodeToCluster = new Map<string, ClusterConfig>();
  clusters.forEach(cluster => {
    cluster.nodeIds.forEach(nodeId => {
      nodeToCluster.set(nodeId, cluster);
    });
  });
  
  edges.forEach(edge => {
    const sourcePos = nodePositions.get(edge.source);
    const targetPos = nodePositions.get(edge.target);
    
    if (!sourcePos || !targetPos) return;
    
    const sourceCluster = nodeToCluster.get(edge.source);
    const targetCluster = nodeToCluster.get(edge.target);
    
    // Calculate path based on cluster relationship
    let path: string;
    let waypoints: { x: number; y: number }[] = [];
    
    if (sourceCluster?.id === targetCluster?.id) {
      // Same cluster - use simple Bezier curve
      path = createBezierPath(sourcePos, targetPos, 'smooth');
      waypoints = [sourcePos, targetPos];
    } else {
      // Different clusters - use orthogonal routing
      const offset = calculateEdgeOffset(edge.id, usedPaths, sourcePos, targetPos);
      const result = createOrthogonalPath(sourcePos, targetPos, sourceCluster, targetCluster, offset);
      path = result.path;
      waypoints = result.waypoints;
    }
    
    const edgePath: EdgePath = { id: edge.id, path, waypoints };
    edgePaths.set(edge.id, edgePath);
    usedPaths.push(edgePath);
  });
  
  return edgePaths;
}

/**
 * Create smooth Bezier curve path
 */
function createBezierPath(
  source: { x: number; y: number },
  target: { x: number; y: number },
  style: 'smooth' | 'tight'
): string {
  const dx = target.x - source.x;
  const dy = target.y - source.y;
  
  const curvature = style === 'smooth' ? 0.4 : 0.25;
  const cp1x = source.x + dx * curvature;
  const cp1y = source.y;
  const cp2x = target.x - dx * curvature;
  const cp2y = target.y;
  
  return `M ${source.x},${source.y} C ${cp1x},${cp1y} ${cp2x},${cp2y} ${target.x},${target.y}`;
}

/**
 * Create orthogonal path avoiding cluster boundaries
 */
function createOrthogonalPath(
  source: { x: number; y: number },
  target: { x: number; y: number },
  sourceCluster?: ClusterConfig,
  targetCluster?: ClusterConfig,
  offset: number = 0
): { path: string; waypoints: { x: number; y: number }[] } {
  const waypoints: { x: number; y: number }[] = [{ ...source }];
  
  // Exit source cluster
  let currentX = source.x;
  let currentY = source.y;
  
  if (sourceCluster) {
    const exitX = sourceCluster.centerX + sourceCluster.width / 2 + 40;
    waypoints.push({ x: exitX, y: currentY + offset });
    currentX = exitX;
    currentY = currentY + offset;
  }
  
  // Move to target cluster level
  if (targetCluster) {
    const enterX = targetCluster.centerX - targetCluster.width / 2 - 40;
    
    // Add midpoint for smooth transition
    const midX = (currentX + enterX) / 2;
    waypoints.push({ x: midX, y: currentY });
    waypoints.push({ x: midX, y: target.y + offset });
    
    waypoints.push({ x: enterX, y: target.y + offset });
    currentX = enterX;
    currentY = target.y + offset;
  }
  
  // Final point
  waypoints.push({ x: target.x, y: target.y });
  
  // Convert waypoints to smooth path
  const path = waypointsToSmoothPath(waypoints);
  
  return { path, waypoints };
}

/**
 * Convert waypoints to smooth SVG path
 */
function waypointsToSmoothPath(waypoints: { x: number; y: number }[]): string {
  if (waypoints.length < 2) return '';
  
  let path = `M ${waypoints[0].x},${waypoints[0].y}`;
  
  for (let i = 1; i < waypoints.length; i++) {
    const prev = waypoints[i - 1];
    const curr = waypoints[i];
    const next = waypoints[i + 1];
    
    if (!next) {
      // Last segment - use cubic bezier for smooth end
      const dx = curr.x - prev.x;
      const dy = curr.y - prev.y;
      const cp1x = prev.x + dx * 0.5;
      const cp1y = prev.y + dy * 0.5;
      path += ` C ${cp1x},${cp1y} ${curr.x},${curr.y} ${curr.x},${curr.y}`;
    } else {
      // Middle segments - use quadratic for smooth corners
      const dx = curr.x - prev.x;
      const dy = curr.y - prev.y;
      
      if (Math.abs(dx) > Math.abs(dy)) {
        // Horizontal segment
        path += ` L ${curr.x},${prev.y} Q ${curr.x},${curr.y} ${curr.x},${curr.y}`;
      } else {
        // Vertical segment
        path += ` L ${prev.x},${curr.y} Q ${curr.x},${curr.y} ${curr.x},${curr.y}`;
      }
    }
  }
  
  return path;
}

/**
 * Calculate offset for parallel edges to avoid overlap
 */
function calculateEdgeOffset(
  edgeId: string,
  existingPaths: EdgePath[],
  source: { x: number; y: number },
  target: { x: number; y: number }
): number {
  const baseOffset = 0;
  const offsetIncrement = 25;
  
  // Check for parallel edges (similar source/target positions)
  const parallelEdges = existingPaths.filter(path => {
    if (path.waypoints.length < 2) return false;
    const pathStart = path.waypoints[0];
    const pathEnd = path.waypoints[path.waypoints.length - 1];
    
    const startDist = Math.hypot(pathStart.x - source.x, pathStart.y - source.y);
    const endDist = Math.hypot(pathEnd.x - target.x, pathEnd.y - target.y);
    
    return startDist < 100 && endDist < 100;
  });
  
  return baseOffset + parallelEdges.length * offsetIncrement;
}

/**
 * Detect if two paths intersect
 */
export function pathsIntersect(path1: EdgePath, path2: EdgePath): boolean {
  // Simplified intersection check using waypoints
  for (let i = 0; i < path1.waypoints.length - 1; i++) {
    for (let j = 0; j < path2.waypoints.length - 1; j++) {
      const a1 = path1.waypoints[i];
      const a2 = path1.waypoints[i + 1];
      const b1 = path2.waypoints[j];
      const b2 = path2.waypoints[j + 1];
      
      if (lineSegmentsIntersect(a1, a2, b1, b2)) {
        return true;
      }
    }
  }
  
  return false;
}

/**
 * Check if two line segments intersect
 */
function lineSegmentsIntersect(
  a1: { x: number; y: number },
  a2: { x: number; y: number },
  b1: { x: number; y: number },
  b2: { x: number; y: number }
): boolean {
  const det = (a2.x - a1.x) * (b2.y - b1.y) - (b2.x - b1.x) * (a2.y - a1.y);
  if (det === 0) return false;
  
  const lambda = ((b2.y - b1.y) * (b2.x - a1.x) + (b1.x - b2.x) * (b2.y - a1.y)) / det;
  const gamma = ((a1.y - a2.y) * (b2.x - a1.x) + (a2.x - a1.x) * (b2.y - a1.y)) / det;
  
  return (0 < lambda && lambda < 1) && (0 < gamma && gamma < 1);
}

