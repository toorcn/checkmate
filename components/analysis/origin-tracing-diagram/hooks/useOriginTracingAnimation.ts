/**
 * useOriginTracingAnimation Hook
 * 
 * Manages animation state, section navigation, and node highlighting
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { Node, useReactFlow } from '@xyflow/react';
import { NavSection } from '../../../../types/origin-tracing';

interface UseOriginTracingAnimationProps {
  nodes: Node[];
  navSections: NavSection[];
  setNodes: (nodes: Node[] | ((nodes: Node[]) => Node[])) => void;
}

export function useOriginTracingAnimation({
  nodes,
  navSections,
  setNodes,
}: UseOriginTracingAnimationProps) {
  const { fitBounds, setCenter, getZoom, fitView } = useReactFlow();
  
  // State management for navigation and animation
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [animatingNodes, setAnimatingNodes] = useState<string[]>([]);
  const [currentAnimationIndex, setCurrentAnimationIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationSpeed] = useState(1800); // ms per node - faster for auto-play
  const animationTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isTransitioningRef = useRef(false);
  const [focusedNodeId, setFocusedNodeId] = useState<string | null>(null);
  const hasAutoPlayedRef = useRef(false); // Track if auto-play has happened
  
  // Stop animation
  const stopAnimation = useCallback(() => {
    if (animationTimerRef.current) {
      clearTimeout(animationTimerRef.current);
      animationTimerRef.current = null;
    }
    setIsAnimating(false);
    setCurrentAnimationIndex(0);
    setFocusedNodeId(null);
    
    // Immediately remove all highlighting
    setNodes(nds => 
      nds.map(node => ({
        ...node,
        className: (node.className || '').replace(/\s*node-highlighted\s*/g, '').trim(),
      }))
    );
  }, [setNodes]);
  
  // Update focused node and section expansion when animation state changes
  useEffect(() => {
    if (!isAnimating || animatingNodes.length === 0) {
      // Don't clear focusedNodeId here - it should persist after animation stops
      // Only clear when explicitly stopped via stopAnimation()
      return;
    }
    
    const currentNodeId = animatingNodes[currentAnimationIndex];
    
    // Update focused node for description panel
    setFocusedNodeId(currentNodeId);
    
    // Find which section this node belongs to and expand it
    const currentNode = nodes.find(n => n.id === currentNodeId);
    if (currentNode) {
      const sectionsToExpand: string[] = [];
      
      if (currentNode.type === 'origin') {
        sectionsToExpand.push('evolution', 'evolution-origin');
      } else if (currentNode.type === 'evolution' || currentNode.type === 'propagation') {
        sectionsToExpand.push('evolution', 'evolution-steps');
      } else if (currentNode.type === 'claim') {
        sectionsToExpand.push('evolution', 'evolution-claim');
      } else if (currentNode.type === 'beliefDriver') {
        sectionsToExpand.push('beliefs');
      } else if (currentNode.type === 'source') {
        sectionsToExpand.push('sources');
      }
      
      if (sectionsToExpand.length > 0) {
        setExpandedSections(new Set(sectionsToExpand));
      }
    }
  }, [isAnimating, animatingNodes, currentAnimationIndex, nodes]);
  
  // Separate effect for node highlighting to avoid dependency issues
  useEffect(() => {
    if (!isAnimating || animatingNodes.length === 0) {
      // Remove highlighting from all nodes when animation stops
      setNodes(nds => 
        nds.map(node => ({
          ...node,
          className: (node.className || '').replace(/\s*node-highlighted\s*/g, '').trim(),
        }))
      );
      return;
    }
    
    const currentNodeId = animatingNodes[currentAnimationIndex];
    
    // Update nodes to highlight ONLY the current one, remove from all others
    setNodes(nds => 
      nds.map(node => {
        const baseClassName = (node.className || '').replace(/\s*node-highlighted\s*/g, '').trim();
        return {
          ...node,
          className: node.id === currentNodeId 
            ? `${baseClassName} node-highlighted`.trim()
            : baseClassName,
        };
      })
    );
  }, [isAnimating, animatingNodes, currentAnimationIndex, setNodes]);
  
  // Animation loop effect - separate from node highlighting
  useEffect(() => {
    if (!isAnimating || animatingNodes.length === 0) {
      isTransitioningRef.current = false;
      return;
    }
    
    const currentNodeId = animatingNodes[currentAnimationIndex];
    const currentNode = nodes.find(n => n.id === currentNodeId);
    
    if (currentNode && !isTransitioningRef.current) {
      isTransitioningRef.current = true;
      
      // Center on the current node with snappier animation
      setCenter(currentNode.position.x + 150, currentNode.position.y + 75, {
        duration: 300, // Reduced from 400ms for snappier transitions
        zoom: Math.max(getZoom(), 0.75),
      });
      
      // Reset transition flag after animation completes
      setTimeout(() => {
        isTransitioningRef.current = false;
      }, 300); // Match the duration
    }
    
    // Check if this is the last node in the sequence
    const isLastNode = currentAnimationIndex === animatingNodes.length - 1;
    
    if (isLastNode) {
      // On last node, pause briefly then zoom out to show full diagram
      animationTimerRef.current = setTimeout(() => {
        setIsAnimating(false);
        setCurrentAnimationIndex(0);
        setFocusedNodeId(null);
        
        // Remove all highlighting
        setNodes(nds => 
          nds.map(node => ({
            ...node,
            className: (node.className || '').replace(/\s*node-highlighted\s*/g, '').trim(),
          }))
        );
        
        // Zoom out to show entire diagram after brief pause
        setTimeout(() => {
          fitView({ duration: 800, padding: 0.15 });
        }, 500);
      }, animationSpeed);
    } else {
      // Schedule next animation
      animationTimerRef.current = setTimeout(() => {
        const nextIndex = currentAnimationIndex + 1;
        setCurrentAnimationIndex(nextIndex);
      }, animationSpeed);
    }
    
    return () => {
      if (animationTimerRef.current) {
        clearTimeout(animationTimerRef.current);
      }
    };
  }, [isAnimating, animatingNodes, currentAnimationIndex, nodes, setCenter, getZoom, animationSpeed, fitView, setNodes]);
  
  // Handle section click
  const handleSectionClick = useCallback((sectionId: string) => {
    const section = navSections.find(s => s.id === sectionId);
    if (!section) return;
    
    stopAnimation();
    setActiveSection(sectionId);
    
    // Special handling for Evolution Timeline - sequential subsection animation
    if (sectionId === 'evolution' && section.subsections && section.subsections.length > 0) {
      // Collect node IDs from each subsection in order: origin → steps → claim
      const subsectionGroups = section.subsections.map(subsection => ({
        id: subsection.id,
        nodeIds: subsection.items.map(item => item.nodeId)
      }));
      
      // Filter out empty groups
      const validGroups = subsectionGroups.filter(group => group.nodeIds.length > 0);
      
      if (validGroups.length === 0) return;
      
      // Collect all node IDs for the sequential animation
      const allNodeIds = validGroups.flatMap(group => group.nodeIds);
      
      if (allNodeIds.length === 0) return;
      
      const sectionNodes = nodes.filter(n => allNodeIds.includes(n.id));
      if (sectionNodes.length === 0) return;
      
      // Calculate bounding box for the entire evolution timeline
      const padding = 100;
      const minX = Math.min(...sectionNodes.map(n => n.position.x)) - padding;
      const minY = Math.min(...sectionNodes.map(n => n.position.y)) - padding;
      const maxX = Math.max(...sectionNodes.map(n => n.position.x + 300)) + padding;
      const maxY = Math.max(...sectionNodes.map(n => n.position.y + 150)) + padding;
      
      // Fit to bounds to show the entire evolution timeline
      fitBounds(
        { x: minX, y: minY, width: maxX - minX, height: maxY - minY },
        { duration: 800, padding: 0.2 }
      );
      
      // Start sequential animation through subsections after initial zoom
      setTimeout(() => {
        setAnimatingNodes(allNodeIds);
        setCurrentAnimationIndex(0);
        setIsAnimating(true);
      }, 850);
      
      return;
    }
    
    // Default behavior for non-evolution sections
    // Collect items from section or its subsections
    let nodeIds: string[] = [];
    if (section.subsections && section.subsections.length > 0) {
      // If section has subsections, collect all items from subsections
      nodeIds = section.subsections.flatMap(subsection => 
        subsection.items.map(item => item.nodeId)
      );
    } else {
      // Regular section with items
      nodeIds = section.items.map(item => item.nodeId);
    }
    
    if (nodeIds.length === 0) return;
    
    const sectionNodes = nodes.filter(n => nodeIds.includes(n.id));
    
    if (sectionNodes.length === 0) return;
    
    // Calculate bounding box
    const padding = 100;
    const minX = Math.min(...sectionNodes.map(n => n.position.x)) - padding;
    const minY = Math.min(...sectionNodes.map(n => n.position.y)) - padding;
    const maxX = Math.max(...sectionNodes.map(n => n.position.x + 300)) + padding;
    const maxY = Math.max(...sectionNodes.map(n => n.position.y + 150)) + padding;
    
    // Fit to bounds with faster animation
    fitBounds(
      { x: minX, y: minY, width: maxX - minX, height: maxY - minY },
      { duration: 500, padding: 0.2 }
    );
    
    // Start animation after zoom with reduced delay
    setTimeout(() => {
      setAnimatingNodes(nodeIds);
      setCurrentAnimationIndex(0);
      setIsAnimating(true);
    }, 550);
  }, [navSections, nodes, fitBounds, stopAnimation]);
  
  // Handle item click - just focus the node, no auto-panning
  const handleItemClick = useCallback((sectionId: string, nodeId: string) => {
    stopAnimation();
    setFocusedNodeId(nodeId);
    
    // Find which section this node belongs to and expand it
    const node = nodes.find(n => n.id === nodeId);
    if (node) {
      const sectionsToExpand: string[] = [];
      
      if (node.type === 'origin') {
        sectionsToExpand.push('evolution', 'evolution-origin');
      } else if (node.type === 'evolution' || node.type === 'propagation') {
        sectionsToExpand.push('evolution', 'evolution-steps');
      } else if (node.type === 'claim') {
        sectionsToExpand.push('evolution', 'evolution-claim');
      } else if (node.type === 'beliefDriver') {
        sectionsToExpand.push('beliefs');
      } else if (node.type === 'source') {
        sectionsToExpand.push('sources');
      }
      
      if (sectionsToExpand.length > 0) {
        setExpandedSections(new Set(sectionsToExpand));
      }
    }
  }, [nodes, stopAnimation]);
  
  // Toggle section expansion
  const toggleSection = useCallback((sectionId: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  }, []);
  
  // Stop animation when user interacts with graph
  const handlePaneClick = useCallback(() => {
    if (isAnimating) {
      stopAnimation();
    }
  }, [stopAnimation, isAnimating]);
  
  // Auto-play animation on mount (runs once)
  useEffect(() => {
    // Only run once and only if we have nodes
    if (hasAutoPlayedRef.current || nodes.length === 0 || navSections.length === 0) {
      return;
    }
    
    // Find the evolution timeline section
    const evolutionSection = navSections.find(s => s.id === 'evolution');
    
    if (!evolutionSection || !evolutionSection.subsections || evolutionSection.subsections.length === 0) {
      return;
    }
    
    // Collect node IDs from evolution timeline subsections in order: origin → steps → claim
    const subsectionGroups = evolutionSection.subsections.map(subsection => ({
      id: subsection.id,
      nodeIds: subsection.items.map(item => item.nodeId)
    }));
    
    // Filter out empty groups and flatten to get all node IDs
    const allNodeIds = subsectionGroups
      .filter(group => group.nodeIds.length > 0)
      .flatMap(group => group.nodeIds);
    
    if (allNodeIds.length === 0) {
      return;
    }
    
    // Mark that auto-play has been triggered
    hasAutoPlayedRef.current = true;
    
    // Start the animation after a brief delay to let the component settle
    const autoPlayTimer = setTimeout(() => {
      setActiveSection('evolution');
      setExpandedSections(new Set(['evolution', 'evolution-origin', 'evolution-steps', 'evolution-claim']));
      setAnimatingNodes(allNodeIds);
      setCurrentAnimationIndex(0);
      setIsAnimating(true);
    }, 800); // Brief delay before starting
    
    return () => {
      clearTimeout(autoPlayTimer);
    };
  }, [nodes.length, navSections]); // Only depend on counts, not full arrays
  
  // Handle node click to focus it
  const handleNodeClick = useCallback((_event: React.MouseEvent, node: Node) => {
    // Stop any ongoing animation
    if (isAnimating) {
      stopAnimation();
    }
    
    // Set focus on the clicked node
    setFocusedNodeId(node.id);
    
    // Find which section this node belongs to and expand only that section
    const sectionsToExpand: string[] = [];
    
    if (node.type === 'origin') {
      sectionsToExpand.push('evolution', 'evolution-origin');
    } else if (node.type === 'evolution' || node.type === 'propagation') {
      sectionsToExpand.push('evolution', 'evolution-steps');
    } else if (node.type === 'claim') {
      sectionsToExpand.push('evolution', 'evolution-claim');
    } else if (node.type === 'beliefDriver') {
      sectionsToExpand.push('beliefs');
    } else if (node.type === 'source') {
      sectionsToExpand.push('sources');
    }
    
    if (sectionsToExpand.length > 0) {
      setExpandedSections(new Set(sectionsToExpand));
    }
    
    // Highlight the node
    setNodes(nds => 
      nds.map(n => {
        const baseClassName = (n.className || '').replace(/\s*node-highlighted\s*/g, '').trim();
        return {
          ...n,
          className: n.id === node.id 
            ? `${baseClassName} node-highlighted`.trim()
            : baseClassName,
        };
      })
    );
    
    // Center on the clicked node
    setCenter(node.position.x + 150, node.position.y + 75, {
      duration: 300, // Reduced from 500ms for snappier transitions
      zoom: Math.max(getZoom(), 0.8),
    });
  }, [isAnimating, stopAnimation, setNodes, setCenter, getZoom]);
  
  // Handle section header hover - highlight all nodes in the section
  const handleSectionMouseEnter = useCallback((sectionId: string) => {
    // Don't interfere if animation is running
    if (isAnimating) return;
    
    // First check if it's a top-level section
    let section = navSections.find(s => s.id === sectionId);
    
    // If not found, check if it's a subsection
    if (!section) {
      for (const parentSec of navSections) {
        if (parentSec.subsections) {
          const foundSubsection = parentSec.subsections.find(sub => sub.id === sectionId);
          if (foundSubsection) {
            section = foundSubsection;
            break;
          }
        }
      }
    }
    
    if (!section) return;
    
    // Collect all node IDs in this section
    let nodeIds: string[] = [];
    if (section.subsections && section.subsections.length > 0) {
      nodeIds = section.subsections.flatMap(subsection => 
        subsection.items.map(item => item.nodeId)
      );
    } else {
      nodeIds = section.items.map(item => item.nodeId);
    }
    
    if (nodeIds.length === 0) return;
    
    // Get the actual nodes for this section
    const sectionNodes = nodes.filter(n => nodeIds.includes(n.id));
    
    if (sectionNodes.length === 0) return;
    
    // Highlight all nodes in this section
    setNodes(nds => 
      nds.map(n => {
        const baseClassName = (n.className || '').replace(/\s*node-highlighted\s*/g, '').trim();
        return {
          ...n,
          className: nodeIds.includes(n.id)
            ? `${baseClassName} node-highlighted`.trim()
            : baseClassName,
        };
      })
    );
    
    // Zoom canvas to fit all nodes in this section
    const padding = 100;
    const minX = Math.min(...sectionNodes.map(n => n.position.x)) - padding;
    const minY = Math.min(...sectionNodes.map(n => n.position.y)) - padding;
    const maxX = Math.max(...sectionNodes.map(n => n.position.x + 300)) + padding;
    const maxY = Math.max(...sectionNodes.map(n => n.position.y + 150)) + padding;
    
    // Fit to bounds with smooth animation
    fitBounds(
      { x: minX, y: minY, width: maxX - minX, height: maxY - minY },
      { duration: 600, padding: 0.2 }
    );
  }, [isAnimating, navSections, nodes, setNodes, fitBounds]);
  
  // Handle section header hover leave - remove highlights and zoom out
  const handleSectionMouseLeave = useCallback(() => {
    // Don't interfere if animation is running
    if (isAnimating) return;
    
    // Remove all highlights
    setNodes(nds => 
      nds.map(n => ({
        ...n,
        className: (n.className || '').replace(/\s*node-highlighted\s*/g, '').trim(),
      }))
    );
    
    // Zoom out to show the entire diagram
    fitView({
      padding: 0.15,
      includeHiddenNodes: false,
      minZoom: 0.2,
      maxZoom: 1.2,
      duration: 600, // Smooth animation matching the zoom-in duration
    });
  }, [isAnimating, setNodes, fitView]);

  return {
    // State
    expandedSections,
    activeSection,
    animatingNodes,
    currentAnimationIndex,
    isAnimating,
    focusedNodeId,
    
    // Actions
    stopAnimation,
    setIsAnimating,
    handleSectionClick,
    handleItemClick,
    toggleSection,
    handlePaneClick,
    handleNodeClick,
    handleSectionMouseEnter,
    handleSectionMouseLeave,
  };
}

