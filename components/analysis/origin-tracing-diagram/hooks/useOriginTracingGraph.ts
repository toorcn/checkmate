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
    const centerX = 1400; // Shifted right for better spacing
    const evolutionWidth = Math.min(1000, totalEvolutionSteps * 300); // Increased width and spacing
    
    // Define layout for interconnected network with improved spacing
    const LAYOUT = {
      // Current claim at center - always centered
      currentClaim: { 
        x: centerX, 
        y: 500 
      },
      
      // Evolution timeline - flows toward center from left with more space
      evolution: {
        startX: centerX - evolutionWidth - 250,
        endX: centerX - 400,
        y: 500,
        stepSpacing: Math.max(350, evolutionWidth / Math.max(totalEvolutionSteps, 1)),
        verticalSpread: 180, // Increased vertical spread
      },
      
      // Belief drivers above center - increased spacing
      beliefs: { 
        startX: centerX - (Math.min(beliefDrivers.length, 2) * 450) / 2,
        y: 50, 
        spacing: 450, // Increased spacing
        maxPerRow: 2 // Reduced per row for less crowding
      },
      
      // Sources below center - increased spacing  
      sources: { 
        startX: centerX - (Math.min(sources.length, 2) * 420) / 2, 
        y: 950, 
        spacing: 420, // Increased spacing
        maxPerRow: 2 // Reduced per row for less crowding
      },
      
      // All links at bottom - increased spacing
      allLinks: {
        startX: centerX - (Math.min(allLinks.length, 3) * 380) / 2,
        y: 1200,
        spacing: 380, // Increased spacing
        maxPerRow: 3, // Reduced per row
      },
      
      // Node dimensions - realistic sizing
      nodeWidth: 320,
      nodeHeight: 140,
      minSpacing: 80,
      
      // Layout bounds
      centerX,
      totalHeight: 1400 // Increased height for better vertical spacing
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

    // Create interconnected evolution chain with better spacing
    evolutionSteps.forEach((step, index) => {
      const stepNodeId = `evolution-${nodeId++}`;
      const stepNumber = previousNodeId ? localEvolutionNodes.length : 0;
      
      // Improved vertical stagger pattern for better clarity
      let yOffset = 0;
      if (evolutionSteps.length > 3) {
        // For many nodes, use sine wave pattern for smooth distribution
        const progress = index / Math.max(evolutionSteps.length - 1, 1);
        yOffset = Math.sin(progress * Math.PI * 2) * 180;
      } else {
        // For few nodes, use simple alternating pattern with more spacing
        yOffset = (index % 3 - 1) * 200;
      }
      
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

      // Connect to previous node in chain - only connect sequential nodes for clarity
      if (previousNodeId) {
        edges.push({
          id: `${previousNodeId}-${stepNodeId}`,
          source: previousNodeId,
          sourceHandle: 'right',
          target: stepNodeId,
          targetHandle: 'left',
          type: 'smoothstep',
          animated: index < 2, // Animate only first connections
          markerEnd: { type: MarkerType.ArrowClosed },
          label: index === 0 ? 'evolves' : '', // Only label first connection
          style: { 
            stroke: step.type === 'timeline' ? '#0ea5e9' : '#f97316', 
            strokeWidth: 2.5,
            opacity: 0.85
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

    // Add belief drivers above evolution chain with better spacing
    beliefDrivers.forEach((driver, index) => {
      const driverNodeId = `belief-${nodeId++}`;
      beliefDriverNodes.push(driverNodeId);
      const col = index % LAYOUT.beliefs.maxPerRow;
      const row = Math.floor(index / LAYOUT.beliefs.maxPerRow);
      
      const x = LAYOUT.beliefs.startX + col * LAYOUT.beliefs.spacing;
      const y = LAYOUT.beliefs.y - row * 280; // Increased row spacing
      
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

      // Connect ALL belief drivers with varying opacity for visual hierarchy
      edges.push({
        id: `${driverNodeId}-${currentClaimNodeId}`,
        source: driverNodeId,
        sourceHandle: 'bottom',
        target: currentClaimNodeId,
        targetHandle: 'top',
        type: 'smoothstep',
        markerEnd: { type: MarkerType.ArrowClosed },
        label: index === 0 ? 'influences' : '',
        style: { 
          stroke: '#a855f7', 
          strokeWidth: index < 2 ? 2.5 : 2, // Primary connections thicker
          opacity: index < 2 ? 0.7 : 0.4 // Secondary connections more subtle
        },
      });
    });

    // Add fact-check sources below evolution chain with better spacing
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
          y: LAYOUT.sources.y + row * 280 // Increased row spacing
        },
        data: { 
          label: source.title, 
          sourceName: sourceName,
          credibility: source.credibility,
          url: source.url 
        },
      });

      // Connect ALL sources with varying visual weight based on credibility
      edges.push({
        id: `${currentClaimNodeId}-${sourceNodeId}`,
        source: currentClaimNodeId,
        sourceHandle: 'bottom',
        target: sourceNodeId,
        targetHandle: 'top',
        type: 'smoothstep',
        markerEnd: { type: MarkerType.ArrowClosed },
        label: index === 0 ? 'fact-checked by' : '',
        style: { 
          stroke: '#10b981', 
          strokeWidth: source.credibility >= 80 ? 2.5 : 2, // High credibility thicker
          opacity: source.credibility >= 80 ? 0.8 : 0.5 // High credibility more visible
        },
      });
    });

    // Add all links at bottom
    const sourceUrls = new Set(sources.map(source => source.url));
    const uniqueLinks = allLinks.filter(link => !sourceUrls.has(link.url));
    
    uniqueLinks.slice(0, 6).forEach((link, index) => { // Reduced to 6 for less clutter
      const linkNodeId = `alllink-${nodeId++}`;
      linkNodes.push(linkNodeId);
      const col = index % LAYOUT.allLinks.maxPerRow;
      const row = Math.floor(index / LAYOUT.allLinks.maxPerRow);
      
      const x = Math.min(
        LAYOUT.allLinks.startX + col * LAYOUT.allLinks.spacing,
        LAYOUT.centerX + 800 - LAYOUT.nodeWidth
      );
      
      const matchingSource = sources.find(source => source.url === link.url);
      const credibility = matchingSource?.credibility ?? 0.5;
      const sourceName = matchingSource?.source || new URL(link.url).hostname.replace('www.', '');
      
      nodes.push({
        id: linkNodeId,
        type: 'source',
        position: { 
          x,
          y: LAYOUT.allLinks.y + row * 260 // Increased row spacing
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
    
    // Get node groups
    const originNodes = nodes.filter(n => n.type === 'origin');
    const evolutionNodes = nodes.filter(n => n.type === 'evolution' || n.type === 'propagation');
    const claimNodes = nodes.filter(n => n.type === 'claim');
    
    // Evolution Timeline section with nested subsections
    const hasEvolutionContent = originNodes.length > 0 || evolutionNodes.length > 0 || claimNodes.length > 0;
    if (hasEvolutionContent) {
      const subsections: NavSection[] = [];
      
      // Original Source subsection
      if (originNodes.length > 0) {
        subsections.push({
          id: 'evolution-origin',
          title: 'Original Source',
          color: 'text-blue-600',
          items: originNodes.map(node => ({
            id: `nav-${node.id}`,
            label: formatNodeText(String(node.data.label || ''), 50),
            icon: getPlatformIcon(String(node.data.label || '')),
            nodeId: node.id,
          })),
        });
      }
      
      // Evolution Steps subsection
      if (evolutionNodes.length > 0) {
        subsections.push({
          id: 'evolution-steps',
          title: 'Evolution Steps',
          color: 'text-orange-600',
          items: evolutionNodes.map(node => ({
            id: `nav-${node.id}`,
            label: formatNodeText(String(node.data.label || node.data.platform || ''), 50),
            icon: getPlatformIcon(String(node.data.platform || node.data.label || '')),
            nodeId: node.id,
          })),
        });
      }
      
      // Current Claim subsection
      if (claimNodes.length > 0) {
        subsections.push({
          id: 'evolution-claim',
          title: 'Current Claim',
          color: 'text-red-600',
          items: claimNodes.map(node => ({
            id: `nav-${node.id}`,
            label: formatNodeText(String(node.data.label || ''), 60),
            icon: getPlatformIcon('claim'),
            nodeId: node.id,
          })),
        });
      }
      
      // Add parent Evolution Timeline section
      sections.push({
        id: 'evolution',
        title: 'Evolution Timeline',
        color: 'text-purple-600',
        items: [], // Parent section has no direct items, only subsections
        subsections,
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

