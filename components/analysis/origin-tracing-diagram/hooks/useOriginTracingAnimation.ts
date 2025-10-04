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
  const { fitBounds, setCenter, getZoom } = useReactFlow();
  
  // State management for navigation and animation
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [animatingNodes, setAnimatingNodes] = useState<string[]>([]);
  const [currentAnimationIndex, setCurrentAnimationIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationSpeed] = useState(2500); // ms per node
  const animationTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isTransitioningRef = useRef(false);
  const [focusedNodeId, setFocusedNodeId] = useState<string | null>(null);
  
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
      
      // Center on the current node with faster animation
      setCenter(currentNode.position.x + 150, currentNode.position.y + 75, {
        duration: 500,
        zoom: Math.max(getZoom(), 0.8),
      });
      
      // Reset transition flag after animation completes
      setTimeout(() => {
        isTransitioningRef.current = false;
      }, 500);
    }
    
    // Schedule next animation
    animationTimerRef.current = setTimeout(() => {
      const nextIndex = (currentAnimationIndex + 1) % animatingNodes.length;
      setCurrentAnimationIndex(nextIndex);
    }, animationSpeed);
    
    return () => {
      if (animationTimerRef.current) {
        clearTimeout(animationTimerRef.current);
      }
    };
  }, [isAnimating, animatingNodes, currentAnimationIndex, nodes, setCenter, getZoom, animationSpeed]);
  
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
  
  // Handle item click
  const handleItemClick = useCallback((sectionId: string, nodeId: string) => {
    // Find the section (could be a top-level section or a subsection)
    let section: NavSection | undefined;
    
    // First, check if it's a direct section
    section = navSections.find(s => s.id === sectionId);
    
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
    
    stopAnimation();
    setActiveSection(sectionId);
    
    const nodeIds = section.items.map(item => item.nodeId);
    const sectionNodes = nodes.filter(n => nodeIds.includes(n.id));
    
    if (sectionNodes.length === 0) return;
    
    // Calculate bounding box for section
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
    
    // Start animation from the clicked item with reduced delay
    setTimeout(() => {
      const startIndex = nodeIds.indexOf(nodeId);
      setAnimatingNodes(nodeIds);
      setCurrentAnimationIndex(startIndex >= 0 ? startIndex : 0);
      setIsAnimating(true);
    }, 550);
  }, [navSections, nodes, fitBounds, stopAnimation]);
  
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
      duration: 500,
      zoom: Math.max(getZoom(), 0.8),
    });
  }, [isAnimating, stopAnimation, setNodes, setCenter, getZoom]);

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
  };
}

