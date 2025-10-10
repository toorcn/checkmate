'use client';

import React, { useRef, useState, useCallback, useEffect } from 'react';
import {
  ReactFlow,
  Background,
  useNodesState,
  useEdgesState,
  ReactFlowProvider,
  useReactFlow,
  type Node as ReactFlowNode,
  type NodeMouseHandler,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { OriginTracingDiagramProps } from '../../../types/origin-tracing';
import { nodeTypes } from './nodes';
import { useOriginTracingGraph, useOriginTracingAnimation, useScrollExpansion, useNodeHoverHighlight } from './hooks';
import { GraphControls, NavigationSidebar, SplitViewResizer, DetailOverlay } from './components';
import { diagramStyles } from './diagram-styles';

/**
 * Internal component that uses ReactFlow hooks
 */
function OriginTracingDiagramInternal({
  originTracing,
  beliefDrivers = [],
  sources = [],
  verdict = 'unverified',
  content = '',
  allLinks = [],
  previewMode = false,
}: OriginTracingDiagramProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [sidebarWidth, setSidebarWidth] = useState(40); // percentage - minimum 40%
  const [sidebarVisible, setSidebarVisible] = useState(!previewMode); // Hide sidebar in preview mode
  const [sidebarClosing, setSidebarClosing] = useState(false); // Track closing animation
  const [isPanning, setIsPanning] = useState(false); // Track panning state
  const [isFullscreen, setIsFullscreen] = useState(false); // Track fullscreen state
  const { fitView, setCenter, getZoom } = useReactFlow();
  
  // Scroll-triggered expansion management - disabled in preview mode
  const { isExpanded } = useScrollExpansion(containerRef, previewMode);
  
  // Scroll diagram into view when user interacts with it
  const scrollDiagramIntoView = useCallback(() => {
    if (containerRef.current) {
      containerRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'nearest'
      });
    }
  }, []);
  
  // Detail overlay state
  const [detailOverlayNodeId, setDetailOverlayNodeId] = useState<string | null>(null);
  const [detailOverlayItem, setDetailOverlayItem] = useState<any | null>(null);
  
  // Graph initialization
  const { nodes: initialNodes, edges: initialEdges, navSections } = useOriginTracingGraph({
    originTracing,
    beliefDrivers,
    sources,
    verdict,
    content,
    allLinks,
  });
  
  // ReactFlow state
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, , onEdgesChange] = useEdgesState(initialEdges);
  
  // Detail overlay handlers (needs to be after nodes are declared)
  const detailOverlayNode = detailOverlayNodeId 
    ? nodes.find(n => n.id === detailOverlayNodeId) 
    : null;
  
  const openDetailOverlay = useCallback((nodeId: string, item: any) => {
    scrollDiagramIntoView();
    setDetailOverlayNodeId(nodeId);
    setDetailOverlayItem(item);
    
    // Adjust view to show the node in upper portion of canvas to avoid overlay
    const targetNode = nodes.find(n => n.id === nodeId);
    if (targetNode) {
      // Offset upwards significantly - position node in top third of visible area
      const offsetY = -180; // Larger offset to position node towards top
      setTimeout(() => {
        setCenter(
          targetNode.position.x + 150, 
          targetNode.position.y + 75 - offsetY, 
          {
            duration: 300, // Reduced from 600ms for snappier transitions
            zoom: Math.max(getZoom(), 0.75),
          }
        );
      }, 50); // Reduced delay for faster response
    }
  }, [scrollDiagramIntoView, nodes, setCenter, getZoom]);
  
  const closeDetailOverlay = useCallback(() => {
    setDetailOverlayNodeId(null);
    setDetailOverlayItem(null);
  }, []);
  
  // Animation management
  const {
    expandedSections,
    activeSection,
    animatingNodes,
    currentAnimationIndex,
    isAnimating,
    focusedNodeId,
    stopAnimation,
    startAnimation,
    setIsAnimating,
    handleSectionClick: originalHandleSectionClick,
    handleItemClick: _handleItemClick, // Not used anymore with overlay
    toggleSection,
    handlePaneClick: originalHandlePaneClick,
    handleNodeClick: originalHandleNodeClick,
    handleSectionMouseEnter,
    handleSectionMouseLeave,
  } = useOriginTracingAnimation({
    nodes,
    navSections,
    setNodes,
    previewMode,
  });
  
  // Wrap interaction handlers to include scroll-into-view
  const handleSectionClick = useCallback((sectionId: string) => {
    scrollDiagramIntoView();
    originalHandleSectionClick(sectionId);
  }, [scrollDiagramIntoView, originalHandleSectionClick]);
  
  const handlePaneClick = useCallback(() => {
    scrollDiagramIntoView();
    originalHandlePaneClick();
  }, [scrollDiagramIntoView, originalHandlePaneClick]);
  
  const handleNodeClick = useCallback<NodeMouseHandler>((event, node) => {
    scrollDiagramIntoView();
    originalHandleNodeClick(event, node as ReactFlowNode);
    
    // Open detail overlay for the clicked node
    const findItemInSections = (sections: typeof navSections): any => {
      for (const section of sections) {
        if (section.subsections) {
          for (const subsection of section.subsections) {
            const item = subsection.items.find(i => i.nodeId === node.id);
            if (item) return item;
          }
        } else {
          const item = section.items.find(i => i.nodeId === node.id);
          if (item) return item;
        }
      }
      return null;
    };
    
    const item = findItemInSections(navSections);
    if (item) {
      openDetailOverlay(node.id, item);
    }
  }, [scrollDiagramIntoView, originalHandleNodeClick, navSections, openDetailOverlay]);
  
  // Hover highlighting for connections
  // Disabled during panning, forced to focusedNodeId during animation
  // During animation, only highlight incoming connections to show narrative flow
  const {
    hoveredNodeId,
    highlightedEdges,
    highlightedNodes,
    onNodeMouseEnter,
    onNodeMouseLeave,
    onSidebarItemMouseEnter,
    onSidebarItemMouseLeave,
    startSequentialHighlight,
    stopSequentialHighlight,
  } = useNodeHoverHighlight({
    nodes,
    edges,
    disabled: isPanning,
    forcedNodeId: isAnimating ? focusedNodeId : null,
    highlightMode: isAnimating ? 'incoming' : 'all',
  });
  
  // Track previous animation state to detect transitions
  const prevIsAnimatingRef = useRef(isAnimating);
  
  // Auto-open detail overlay during animation and adjust view to account for overlay
  useEffect(() => {
    const wasAnimating = prevIsAnimatingRef.current;
    prevIsAnimatingRef.current = isAnimating;
    
    if (isAnimating && focusedNodeId && activeSection) {
      // Find the item in navSections that matches the focused node
      const findItemInSections = (sections: typeof navSections): any => {
        for (const section of sections) {
          if (section.subsections) {
            for (const subsection of section.subsections) {
              const item = subsection.items.find(i => i.nodeId === focusedNodeId);
              if (item) return item;
            }
          } else {
            const item = section.items.find(i => i.nodeId === focusedNodeId);
            if (item) return item;
          }
        }
        return null;
      };
      
      const item = findItemInSections(navSections);
      if (item) {
        openDetailOverlay(focusedNodeId, item);
        
        // Adjust view to offset upwards when overlay is open
        const focusedNode = nodes.find(n => n.id === focusedNodeId);
        if (focusedNode) {
          // Offset Y position upwards significantly to position node towards top
          const offsetY = -180; // Larger offset to keep node in upper third of canvas
          setCenter(
            focusedNode.position.x + 150, 
            focusedNode.position.y + 75 - offsetY, 
            {
              duration: 300, // Reduced from 400ms for snappier transitions
              zoom: Math.max(getZoom(), 0.75),
            }
          );
        }
      }
    } else if (wasAnimating && !isAnimating) {
      // Only close overlay when animation explicitly stops (transition from true to false)
      // Don't close when manually clicking nodes (isAnimating stays false)
      closeDetailOverlay();
    }
  }, [isAnimating, focusedNodeId, activeSection, navSections, nodes, openDetailOverlay, closeDetailOverlay, setCenter, getZoom]);

  // Handler for evolution timeline hover - start sequential highlighting
  const handleEvolutionTimelineMouseEnter = useCallback(() => {
    // Find evolution section and collect all node IDs in order: origin → evolution steps → current claim
    const evolutionSection = navSections.find(s => s.id === 'evolution');
    if (!evolutionSection || !evolutionSection.subsections) return;
    
    const nodeIds: string[] = [];
    
    // Add origin nodes
    const originSubsection = evolutionSection.subsections.find(s => s.id === 'evolution-origin');
    if (originSubsection) {
      nodeIds.push(...originSubsection.items.map(item => item.nodeId));
    }
    
    // Add evolution step nodes
    const evolutionSubsection = evolutionSection.subsections.find(s => s.id === 'evolution-steps');
    if (evolutionSubsection) {
      nodeIds.push(...evolutionSubsection.items.map(item => item.nodeId));
    }
    
    // Add claim node
    const claimSubsection = evolutionSection.subsections.find(s => s.id === 'evolution-claim');
    if (claimSubsection) {
      nodeIds.push(...claimSubsection.items.map(item => item.nodeId));
    }
    
    if (nodeIds.length > 0) {
      startSequentialHighlight(nodeIds);
    }
  }, [navSections, startSequentialHighlight]);

  const handleEvolutionTimelineMouseLeave = useCallback(() => {
    stopSequentialHighlight();
  }, [stopSequentialHighlight]);
  
  // Apply hover highlight classes to nodes
  const nodesWithHoverClasses = React.useMemo(() => {
    if (!hoveredNodeId) return nodes;
    
    return nodes.map(node => ({
      ...node,
      className: highlightedNodes.has(node.id) 
        ? 'node-connected' 
        : 'node-dimmed',
    }));
  }, [nodes, hoveredNodeId, highlightedNodes]);
  
  // Apply hover highlight classes to edges
  const edgesWithHoverClasses = React.useMemo(() => {
    if (!hoveredNodeId) return edges;
    
    return edges.map(edge => ({
      ...edge,
      className: highlightedEdges.has(edge.id)
        ? 'edge-highlighted'
        : 'edge-dimmed',
    }));
  }, [edges, hoveredNodeId, highlightedEdges]);
  
  // Disable manual connections for this read-only diagram
  const onConnect = useCallback(() => {}, []);

  // Smooth fit view handler
  const handleFitView = useCallback(() => {
    scrollDiagramIntoView();
    fitView({
      padding: 0.15,
      includeHiddenNodes: false,
      minZoom: 0.2,
      maxZoom: 1.2,
      duration: 800, // Smooth 800ms animation
    });
  }, [scrollDiagramIntoView, fitView]);

  // Handle panning start/end to disable hover highlighting during panning
  const handleMoveStart = useCallback(() => {
    setIsPanning(true);
  }, []);

  const handleMoveEnd = useCallback(() => {
    setIsPanning(false);
  }, []);

  // Sidebar visibility handlers
  const handleCloseSidebar = useCallback(() => {
    setSidebarClosing(true);
    // Wait for animation to complete before actually hiding
    setTimeout(() => {
      setSidebarVisible(false);
      setSidebarClosing(false);
      // Fit view after sidebar is hidden to show all nodes in expanded space
      setTimeout(() => {
        fitView({
          padding: 0.15,
          includeHiddenNodes: false,
          minZoom: 0.2,
          maxZoom: 1.2,
          duration: 800,
        });
      }, 100); // Small delay to allow layout to settle
    }, 300); // Match animation duration
  }, [fitView]);

  const handleOpenSidebar = useCallback(() => {
    setSidebarVisible(true);
    // Fit view after sidebar opens to adjust to new space
    setTimeout(() => {
      fitView({
        padding: 0.15,
        includeHiddenNodes: false,
        minZoom: 0.2,
        maxZoom: 1.2,
        duration: 800,
      });
    }, 450); // Wait for slide-in animation (400ms) + small buffer
  }, [fitView]);

  // Handle fullscreen toggle
  const handleToggleFullscreen = useCallback(() => {
    setIsFullscreen(!isFullscreen);
    if (!isFullscreen) {
      // Opening fullscreen - show sidebar and fit view
      setSidebarVisible(true);
      // Prevent body scroll when fullscreen is active
      document.body.style.overflow = 'hidden';
      setTimeout(() => {
        fitView({
          padding: 0.15,
          includeHiddenNodes: false,
          minZoom: 0.2,
          maxZoom: 1.2,
          duration: 800,
        });
      }, 100);
    } else {
      // Closing fullscreen - restore body scroll
      document.body.style.overflow = 'unset';
    }
  }, [isFullscreen, fitView]);

  // Cleanup body scroll lock on unmount
  useEffect(() => {
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  // Handle Escape key to exit fullscreen
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isFullscreen) {
        handleToggleFullscreen();
      }
    };

    if (isFullscreen) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isFullscreen, handleToggleFullscreen]);

  // Early return if no data
  if (!originTracing?.hypothesizedOrigin && !beliefDrivers.length && !sources.length) {
    return null;
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: diagramStyles }} />
      {isFullscreen ? (
        // True fullscreen overlay
        <div className="fixed inset-0 z-50 bg-background">
          <div
            ref={containerRef}
            className="h-full w-full overflow-hidden"
          >
            <div className="h-full flex flex-col">
              {/* Header Controls */}
              <GraphControls
                isExpanded={isExpanded || isFullscreen}
                isAnimating={isAnimating}
                sidebarVisible={sidebarVisible}
                previewMode={previewMode}
                isFullscreen={isFullscreen}
                onPauseAnimation={() => setIsAnimating(false)}
                onStopAnimation={stopAnimation}
                onStartAnimation={startAnimation}
                onFitView={handleFitView}
                onCloseSidebar={handleCloseSidebar}
                onToggleFullscreen={handleToggleFullscreen}
              />
              
              {/* Split view container */}
              <div className="flex-1 flex overflow-hidden">
                {/* Graph panel */}
                <div 
                  className="relative bg-gradient-to-br from-background via-muted/30 to-accent/20 graph-panel"
                  style={{ width: sidebarVisible ? `${100 - sidebarWidth}%` : '100%' }}
                >
                  {/* Detail Overlay */}
                  {detailOverlayNode && detailOverlayItem && (
                    <DetailOverlay
                      node={detailOverlayNode}
                      item={detailOverlayItem}
                      onClose={closeDetailOverlay}
                    />
                  )}
                  
                  <ReactFlow
                    nodes={nodesWithHoverClasses}
                    edges={edgesWithHoverClasses}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onConnect={onConnect}
                    onPaneClick={handlePaneClick}
                    onNodeClick={handleNodeClick}
                    onNodeMouseEnter={onNodeMouseEnter}
                    onNodeMouseLeave={onNodeMouseLeave}
                    onMoveStart={handleMoveStart}
                    onMoveEnd={handleMoveEnd}
                    nodeTypes={nodeTypes}
                    fitView
                    fitViewOptions={{ 
                      padding: 0.15,
                      includeHiddenNodes: false,
                      minZoom: 0.2,
                      maxZoom: 1.2
                    }}
                    minZoom={0.2}
                    maxZoom={1.2}
                    attributionPosition="bottom-left"
                    defaultViewport={{ x: 0, y: 0, zoom: 0.35 }}
                    proOptions={{ hideAttribution: false }}
                    style={{ width: '100%', height: '100%' }}
                    className="react-flow-mobile-container"
                    nodesDraggable={false}
                    nodesConnectable={false}
                    elementsSelectable={true}
                    panOnDrag={true}
                    zoomOnScroll={true}
                    zoomOnPinch={true}
                    zoomOnDoubleClick={false}
                    preventScrolling={false}
                    selectNodesOnDrag={false}
                    multiSelectionKeyCode={null}
                  >
                    <Background 
                      gap={20} 
                      size={1.5} 
                      color="hsl(var(--muted-foreground))" 
                      style={{ opacity: 0.3 }}
                    />
                  </ReactFlow>
                </div>
                
                {/* Resizer - only show when sidebar is visible and not closing */}
                {sidebarVisible && !sidebarClosing && (
                  <SplitViewResizer
                    containerRef={containerRef}
                    sidebarWidth={sidebarWidth}
                    onSidebarWidthChange={setSidebarWidth}
                  />
                )}
                
                {/* Navigation sidebar */}
                {sidebarVisible && (
                  <div 
                    className={sidebarClosing ? 'sidebar-slide-out' : 'sidebar-slide-in'}
                    style={{ width: `${sidebarWidth}%` }}
                  >
                    <NavigationSidebar
                      navSections={navSections}
                      expandedSections={expandedSections}
                      activeSection={activeSection}
                      animatingNodes={animatingNodes}
                      currentAnimationIndex={currentAnimationIndex}
                      isAnimating={isAnimating}
                      nodes={nodes}
                      isExpanded={isExpanded}
                      selectedNodeId={detailOverlayNodeId}
                      onToggleSection={toggleSection}
                      onSectionClick={handleSectionClick}
                      onItemDetailClick={openDetailOverlay}
                      onItemMouseEnter={onSidebarItemMouseEnter}
                      onItemMouseLeave={onSidebarItemMouseLeave}
                      onSectionMouseEnter={handleSectionMouseEnter}
                      onSectionMouseLeave={handleSectionMouseLeave}
                      onEvolutionTimelineMouseEnter={handleEvolutionTimelineMouseEnter}
                      onEvolutionTimelineMouseLeave={handleEvolutionTimelineMouseLeave}
                      onClose={handleCloseSidebar}
                    />
                  </div>
                )}
                
                {/* Show open button when sidebar is closed */}
                {!sidebarVisible && (
                  <button
                    onClick={handleOpenSidebar}
                    className="absolute top-20 right-4 z-50 p-3 bg-background border-2 border-border rounded-lg shadow-lg hover:shadow-xl hover:border-primary transition-all reopen-button-slide-in"
                    aria-label="Open navigation sidebar"
                  >
                    <svg className="w-5 h-5 text-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        // Normal/preview mode
        <div
          ref={containerRef}
          className={
            previewMode
              ? "h-[400px] sm:h-[350px] md:h-[400px] shadow-lg mb-4 bg-card border border-border rounded-lg overflow-hidden"
              : isExpanded
                ? "react-flow-expanded-container"
                : "h-[700px] sm:h-[600px] md:h-[700px] shadow-2xl mb-6 bg-card border-2 border-border rounded-2xl overflow-hidden"
          }
        >
          <div className="h-full flex flex-col">
            {/* Header Controls */}
            <GraphControls
              isExpanded={isExpanded}
              isAnimating={isAnimating}
              sidebarVisible={sidebarVisible}
              previewMode={previewMode}
              isFullscreen={isFullscreen}
              onPauseAnimation={() => setIsAnimating(false)}
              onStopAnimation={stopAnimation}
              onStartAnimation={startAnimation}
              onFitView={handleFitView}
              onCloseSidebar={handleCloseSidebar}
              onToggleFullscreen={handleToggleFullscreen}
            />
            
            {/* Split view container */}
            <div className="flex-1 flex overflow-hidden">
              {/* Graph panel */}
              <div 
                className="relative bg-gradient-to-br from-background via-muted/30 to-accent/20 graph-panel"
                style={{ width: sidebarVisible ? `${100 - sidebarWidth}%` : '100%' }}
              >
                {/* Detail Overlay */}
                {detailOverlayNode && detailOverlayItem && (
                  <DetailOverlay
                    node={detailOverlayNode}
                    item={detailOverlayItem}
                    onClose={closeDetailOverlay}
                  />
                )}
                
                <ReactFlow
                  nodes={nodesWithHoverClasses}
                  edges={edgesWithHoverClasses}
                  onNodesChange={onNodesChange}
                  onEdgesChange={onEdgesChange}
                  onConnect={onConnect}
                  onPaneClick={handlePaneClick}
                  onNodeClick={handleNodeClick}
                  onNodeMouseEnter={onNodeMouseEnter}
                  onNodeMouseLeave={onNodeMouseLeave}
                  onMoveStart={handleMoveStart}
                  onMoveEnd={handleMoveEnd}
                  nodeTypes={nodeTypes}
                  fitView
                  fitViewOptions={{ 
                    padding: 0.15,
                    includeHiddenNodes: false,
                    minZoom: 0.2,
                    maxZoom: 1.2
                  }}
                  minZoom={0.2}
                  maxZoom={1.2}
                  attributionPosition="bottom-left"
                  defaultViewport={{ x: 0, y: 0, zoom: 0.35 }}
                  proOptions={{ hideAttribution: false }}
                  style={{ width: '100%', height: '100%' }}
                  className="react-flow-mobile-container"
                  nodesDraggable={false}
                  nodesConnectable={false}
                  elementsSelectable={true}
                  panOnDrag={true}
                  zoomOnScroll={true}
                  zoomOnPinch={true}
                  zoomOnDoubleClick={false}
                  preventScrolling={false}
                  selectNodesOnDrag={false}
                  multiSelectionKeyCode={null}
                >
                  <Background 
                    gap={20} 
                    size={1.5} 
                    color="hsl(var(--muted-foreground))" 
                    style={{ opacity: 0.3 }}
                  />
                </ReactFlow>
              </div>
              
              {/* Resizer - only show when sidebar is visible and not closing */}
              {sidebarVisible && !sidebarClosing && (
                <SplitViewResizer
                  containerRef={containerRef}
                  sidebarWidth={sidebarWidth}
                  onSidebarWidthChange={setSidebarWidth}
                />
              )}
              
              {/* Navigation sidebar */}
              {sidebarVisible && (
                <div 
                  className={sidebarClosing ? 'sidebar-slide-out' : 'sidebar-slide-in'}
                  style={{ width: `${sidebarWidth}%` }}
                >
                  <NavigationSidebar
                    navSections={navSections}
                    expandedSections={expandedSections}
                    activeSection={activeSection}
                    animatingNodes={animatingNodes}
                    currentAnimationIndex={currentAnimationIndex}
                    isAnimating={isAnimating}
                    nodes={nodes}
                    isExpanded={isExpanded}
                    selectedNodeId={detailOverlayNodeId}
                    onToggleSection={toggleSection}
                    onSectionClick={handleSectionClick}
                    onItemDetailClick={openDetailOverlay}
                    onItemMouseEnter={onSidebarItemMouseEnter}
                    onItemMouseLeave={onSidebarItemMouseLeave}
                    onSectionMouseEnter={handleSectionMouseEnter}
                    onSectionMouseLeave={handleSectionMouseLeave}
                    onEvolutionTimelineMouseEnter={handleEvolutionTimelineMouseEnter}
                    onEvolutionTimelineMouseLeave={handleEvolutionTimelineMouseLeave}
                    onClose={handleCloseSidebar}
                  />
                </div>
              )}
              
              {/* Show open button when sidebar is closed */}
              {!sidebarVisible && (
                <button
                  onClick={handleOpenSidebar}
                  className="absolute top-20 right-4 z-50 p-3 bg-background border-2 border-border rounded-lg shadow-lg hover:shadow-xl hover:border-primary transition-all reopen-button-slide-in"
                  aria-label="Open navigation sidebar"
                >
                  <svg className="w-5 h-5 text-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/**
 * Wrapper component with ReactFlowProvider
 */
export function OriginTracingDiagram(props: OriginTracingDiagramProps) {
  return (
    <ReactFlowProvider>
      <OriginTracingDiagramInternal {...props} />
    </ReactFlowProvider>
  );
}

