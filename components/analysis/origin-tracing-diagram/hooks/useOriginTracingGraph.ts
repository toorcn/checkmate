/**
 * useOriginTracingGraph Hook
 * 
 * Manages graph initialization, node creation, and edge connections
 */

import { useMemo } from 'react';
import { Node, Edge, MarkerType } from '@xyflow/react';
import { 
  OriginTracingData, 
  BeliefDriver, 
  FactCheckSource, 
  NavSection,
  OriginTracingGraphResult 
} from '../../../../types/origin-tracing';
import { extractClaimContent, formatNodeText } from '../../../../lib/analysis/origin-tracing-utils';
import { createLogicalFlow } from '../../../../lib/analysis/origin-tracing-layout';
import { getPlatformIcon, getBiasIcon } from '../../../../lib/analysis/origin-tracing-icons';

interface UseOriginTracingGraphProps {
  originTracing?: OriginTracingData;
  beliefDrivers: BeliefDriver[];
  sources: FactCheckSource[];
  verdict: 'verified' | 'misleading' | 'false' | 'unverified' | 'satire';
  content: string;
  allLinks: Array<{ url: string; title?: string }>;
}

export function useOriginTracingGraph({
  originTracing,
  beliefDrivers,
  sources,
  verdict,
  content,
  allLinks,
}: UseOriginTracingGraphProps): OriginTracingGraphResult {
  const { nodes, edges } = useMemo(() => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];
    let nodeId = 0;
    
    // Track node IDs for logical flow layout
    let originNodeId: string | null = null;
    const evolutionNodes: string[] = [];
    let claimNodeId = '';
    const beliefDriverNodes: string[] = [];
    const sourceNodes: string[] = [];
    const linkNodes: string[] = [];

    // Calculate total content to fit properly on screen with center claim
    const totalEvolutionSteps = Math.max(
      (originTracing?.firstSeenDates?.length || 0) + 
      (originTracing?.propagationPaths?.length || 0),
      1
    );
    const centerX = 1200; // Fixed center position
    const evolutionWidth = Math.min(800, totalEvolutionSteps * 180); // Width for evolution chain
    
    // Define layout for interconnected network with centered claim
    const LAYOUT = {
      // Current claim at center - always centered
      currentClaim: { 
        x: centerX, 
        y: 320 
      },
      
      // Evolution timeline - flows toward center from left
      evolution: {
        startX: centerX - evolutionWidth - 150,
        endX: centerX - 150,
        y: 320,
        stepSpacing: Math.max(150, evolutionWidth / Math.max(totalEvolutionSteps, 1)),
        verticalSpread: 100,
      },
      
      // Belief drivers above center - reduced spacing
      beliefs: { 
        startX: centerX - (Math.min(beliefDrivers.length, 3) * 320) / 2,
        y: 80, 
        spacing: 320,
        maxPerRow: 3
      },
      
      // Sources below center - reduced spacing  
      sources: { 
        startX: centerX - (Math.min(sources.length, 3) * 300) / 2, 
        y: 480, 
        spacing: 300,
        maxPerRow: 3
      },
      
      // All links at bottom - reduced spacing
      allLinks: {
        startX: centerX - (Math.min(allLinks.length, 4) * 280) / 2,
        y: 650,
        spacing: 280,
        maxPerRow: 4,
      },
      
      // Node dimensions - optimized spacing
      nodeWidth: 260,
      nodeHeight: 110,
      minSpacing: 50,
      
      // Layout bounds
      centerX,
      totalHeight: 750
    };

    // Build chronological evolution chain
    const localEvolutionNodes: string[] = [];
    
    // Step 1: Origin node (if available)
    let previousNodeId: string | null = null;
    if (originTracing?.hypothesizedOrigin) {
      const currentOriginNodeId = `origin-${nodeId++}`;
      originNodeId = currentOriginNodeId;
      nodes.push({
        id: currentOriginNodeId,
        type: 'origin',
        position: { 
          x: LAYOUT.evolution.startX, 
          y: LAYOUT.evolution.y 
        },
        data: { label: originTracing.hypothesizedOrigin },
      });
      localEvolutionNodes.push(currentOriginNodeId);
      previousNodeId = currentOriginNodeId;
    }

    // Step 2: Create evolution chain from first seen dates and propagation paths
    const evolutionSteps: Array<{ 
      label: string; 
      date?: string; 
      platform?: string; 
      impact?: string; 
      type: 'timeline' | 'propagation' | 'evolution' 
    }> = [];
    
    // Combine and sort timeline entries
    if (originTracing?.firstSeenDates) {
      originTracing.firstSeenDates.forEach(dateInfo => {
        evolutionSteps.push({
          label: `${dateInfo.source}${dateInfo.date ? ` (${dateInfo.date})` : ''}`,
          date: dateInfo.date,
          type: 'timeline'
        });
      });
    }

    // Add evolution steps with meaningful transformations
    if (originTracing?.evolutionSteps) {
      originTracing.evolutionSteps.forEach(step => {
        evolutionSteps.push({
          label: step.transformation || `Spread via ${step.platform}`,
          platform: step.platform,
          impact: step.impact,
          date: step.date,
          type: 'evolution'
        });
      });
    }
    
    // Fallback to legacy propagation paths if no evolution steps
    if ((!originTracing?.evolutionSteps || originTracing.evolutionSteps.length === 0) && originTracing?.propagationPaths) {
      originTracing.propagationPaths.forEach(path => {
        evolutionSteps.push({
          label: `Content spread through ${path}`,
          platform: path,
          type: 'propagation'
        });
      });
    }

    // Sort by date if available, otherwise keep original order
    evolutionSteps.sort((a, b) => {
      if (a.date && b.date) {
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      }
      return 0;
    });

    // Create interconnected evolution chain
    evolutionSteps.forEach((step, index) => {
      const stepNodeId = `evolution-${nodeId++}`;
      const stepNumber = previousNodeId ? localEvolutionNodes.length : 0;
      
      // Alternate positions to prevent overlaps
      const yOffset = (index % 3 === 0) ? 0 : (index % 3 === 1 ? -80 : 80);
      
      nodes.push({
        id: stepNodeId,
        type: step.type === 'timeline' ? 'propagation' : step.type === 'evolution' ? 'evolution' : 'propagation',
        position: { 
          x: LAYOUT.evolution.startX + stepNumber * LAYOUT.evolution.stepSpacing,
          y: LAYOUT.evolution.y + yOffset
        },
        data: { 
          label: step.label,
          platform: step.platform,
          impact: step.impact
        },
      });

      localEvolutionNodes.push(stepNodeId);
      evolutionNodes.push(stepNodeId);

      // Connect to previous node in chain
      if (previousNodeId && index < 4) {
        edges.push({
          id: `${previousNodeId}-${stepNodeId}`,
          source: previousNodeId,
          sourceHandle: 'right',
          target: stepNodeId,
          targetHandle: 'left',
          type: 'smoothstep',
          animated: index < 2,
          markerEnd: { type: MarkerType.ArrowClosed },
          label: index === 0 ? 'evolves' : '',
          style: { 
            stroke: step.type === 'timeline' ? '#0066cc' : '#ff8800', 
            strokeWidth: 2,
            opacity: 0.8
          },
        });
      }

      previousNodeId = stepNodeId;
    });

    // Step 3: Current claim at the end of evolution
    const currentClaimNodeId = `claim-${nodeId++}`;
    claimNodeId = currentClaimNodeId;
    nodes.push({
      id: currentClaimNodeId,
      type: 'claim',
      position: { x: LAYOUT.currentClaim.x, y: LAYOUT.currentClaim.y },
      data: { 
        label: extractClaimContent(content, originTracing, beliefDrivers, sources), 
        verdict 
      },
    });

    // Connect final evolution step to current claim
    if (previousNodeId) {
      edges.push({
        id: `${previousNodeId}-${currentClaimNodeId}`,
        source: previousNodeId,
        sourceHandle: 'right',
        target: currentClaimNodeId,
        targetHandle: 'left',
        type: 'smoothstep',
        animated: true,
        markerEnd: { type: MarkerType.ArrowClosed },
        label: 'becomes',
        style: { stroke: '#dc2626', strokeWidth: 3 },
      });
    }

    // Add belief drivers above evolution chain
    beliefDrivers.forEach((driver, index) => {
      const driverNodeId = `belief-${nodeId++}`;
      beliefDriverNodes.push(driverNodeId);
      const col = index % LAYOUT.beliefs.maxPerRow;
      const row = Math.floor(index / LAYOUT.beliefs.maxPerRow);
      
      const x = LAYOUT.beliefs.startX + col * LAYOUT.beliefs.spacing;
      const y = LAYOUT.beliefs.y - row * 120;
      
      nodes.push({
        id: driverNodeId,
        type: 'beliefDriver',
        position: { x, y },
        data: { 
          name: driver.name, 
          description: driver.description,
          references: driver.references
        },
      });

      edges.push({
        id: `${driverNodeId}-${currentClaimNodeId}`,
        source: driverNodeId,
        sourceHandle: 'bottom',
        target: currentClaimNodeId,
        targetHandle: 'top',
        type: 'smoothstep',
        markerEnd: { type: MarkerType.ArrowClosed },
        label: index === 0 ? 'influences belief' : '',
        style: { stroke: '#8b5cf6', strokeWidth: 2, opacity: 0.8 },
      });
    });

    // Add fact-check sources below evolution chain
    sources.forEach((source, index) => {
      const sourceNodeId = `source-${nodeId++}`;
      sourceNodes.push(sourceNodeId);
      const col = index % LAYOUT.sources.maxPerRow;
      const row = Math.floor(index / LAYOUT.sources.maxPerRow);
      
      const sourceName = source.source || new URL(source.url).hostname.replace('www.', '');
      
      nodes.push({
        id: sourceNodeId,
        type: 'source',
        position: { 
          x: LAYOUT.sources.startX + col * LAYOUT.sources.spacing,
          y: LAYOUT.sources.y + row * 130
        },
        data: { 
          label: source.title, 
          sourceName: sourceName,
          credibility: source.credibility,
          url: source.url 
        },
      });

      edges.push({
        id: `${currentClaimNodeId}-${sourceNodeId}`,
        source: currentClaimNodeId,
        sourceHandle: 'bottom',
        target: sourceNodeId,
        targetHandle: 'top',
        type: 'smoothstep',
        markerEnd: { type: MarkerType.ArrowClosed },
        label: 'fact-checked by',
        style: { stroke: '#10b981', strokeWidth: 2 },
      });
    });

    // Add all links at bottom
    const sourceUrls = new Set(sources.map(source => source.url));
    const uniqueLinks = allLinks.filter(link => !sourceUrls.has(link.url));
    
    uniqueLinks.slice(0, 8).forEach((link, index) => {
      const linkNodeId = `alllink-${nodeId++}`;
      linkNodes.push(linkNodeId);
      const col = index % LAYOUT.allLinks.maxPerRow;
      const row = Math.floor(index / LAYOUT.allLinks.maxPerRow);
      
      const x = Math.min(
        LAYOUT.allLinks.startX + col * LAYOUT.allLinks.spacing,
        LAYOUT.centerX + 600 - LAYOUT.nodeWidth
      );
      
      const matchingSource = sources.find(source => source.url === link.url);
      const credibility = matchingSource?.credibility ?? 0.5;
      const sourceName = matchingSource?.source || new URL(link.url).hostname.replace('www.', '');
      
      nodes.push({
        id: linkNodeId,
        type: 'source',
        position: { 
          x,
          y: LAYOUT.allLinks.y + row * 100
        },
        data: {
          label: link.title || link.url,
          sourceName: sourceName,
          credibility: Math.round(credibility * 100),
          url: link.url,
        },
      });
    });

    // Apply logical flow layout and overlap resolution
    const optimizedNodes = createLogicalFlow(
      originNodeId,
      evolutionNodes,
      claimNodeId,
      beliefDriverNodes,
      sourceNodes,
      linkNodes,
      nodes
    );
    
    return { nodes: optimizedNodes, edges };
  }, [originTracing, beliefDrivers, sources, verdict, content, allLinks]);

  // Build navigation sections from nodes
  const navSections = useMemo((): NavSection[] => {
    const sections: NavSection[] = [];
    
    // Origin section
    const originNodes = nodes.filter(n => n.type === 'origin');
    if (originNodes.length > 0) {
      sections.push({
        id: 'origin',
        title: 'Origin',
        color: 'text-blue-600',
        items: originNodes.map(node => ({
          id: `nav-${node.id}`,
          label: formatNodeText(String(node.data.label || ''), 50),
          icon: getPlatformIcon(String(node.data.label || '')),
          nodeId: node.id,
        })),
      });
    }
    
    // Evolution section
    const evolutionNodes = nodes.filter(n => n.type === 'evolution' || n.type === 'propagation');
    if (evolutionNodes.length > 0) {
      sections.push({
        id: 'evolution',
        title: 'Evolution Timeline',
        color: 'text-purple-600',
        items: evolutionNodes.map(node => ({
          id: `nav-${node.id}`,
          label: formatNodeText(String(node.data.label || node.data.platform || ''), 50),
          icon: getPlatformIcon(String(node.data.platform || node.data.label || '')),
          nodeId: node.id,
        })),
      });
    }
    
    // Belief Drivers section
    const beliefNodes = nodes.filter(n => n.type === 'beliefDriver');
    if (beliefNodes.length > 0) {
      sections.push({
        id: 'beliefs',
        title: 'Belief Drivers',
        color: 'text-violet-600',
        items: beliefNodes.map(node => ({
          id: `nav-${node.id}`,
          label: formatNodeText(String(node.data.name || ''), 50),
          icon: getBiasIcon(String(node.data.name || '')),
          nodeId: node.id,
        })),
      });
    }
    
    // Sources section
    const sourceNodes = nodes.filter(n => n.type === 'source');
    if (sourceNodes.length > 0) {
      sections.push({
        id: 'sources',
        title: 'Fact-Check Sources',
        color: 'text-emerald-600',
        items: sourceNodes.map(node => ({
          id: `nav-${node.id}`,
          label: formatNodeText(String(node.data.sourceName || node.data.label || ''), 50),
          icon: getPlatformIcon(String(node.data.sourceName || node.data.label || '')),
          nodeId: node.id,
        })),
      });
    }
    
    return sections;
  }, [nodes]);

  return { nodes, edges, navSections };
}

