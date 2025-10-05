'use client';

import React, { useRef, useState, useCallback } from 'react';
import {
  ReactFlow,
  Background,
  useNodesState,
  useEdgesState,
  ReactFlowProvider,
  useReactFlow,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { OriginTracingDiagramProps } from '../../../types/origin-tracing';
import { nodeTypes } from './nodes';
import { useOriginTracingGraph, useOriginTracingAnimation, useScrollExpansion, useNodeHoverHighlight } from './hooks';
import { GraphControls, NavigationSidebar, SplitViewResizer } from './components';
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
}: OriginTracingDiagramProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [sidebarWidth, setSidebarWidth] = useState(30); // percentage
  const [isPanning, setIsPanning] = useState(false); // Track panning state
  const { fitView } = useReactFlow();
  
  // Scroll-triggered expansion management
  const { isExpanded } = useScrollExpansion(containerRef);
  
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
  
  // Animation management
  const {
    expandedSections,
    activeSection,
    animatingNodes,
    currentAnimationIndex,
    isAnimating,
    focusedNodeId,
    stopAnimation,
    setIsAnimating,
    handleSectionClick,
    handleItemClick,
    toggleSection,
    handlePaneClick,
    handleNodeClick,
  } = useOriginTracingAnimation({
    nodes,
    navSections,
    setNodes,
  });
  
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
  } = useNodeHoverHighlight({
    nodes,
    edges,
    disabled: isPanning,
    forcedNodeId: isAnimating ? focusedNodeId : null,
    highlightMode: isAnimating ? 'incoming' : 'all',
  });
  
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
    fitView({
      padding: 0.15,
      includeHiddenNodes: false,
      minZoom: 0.2,
      maxZoom: 1.2,
      duration: 800, // Smooth 800ms animation
    });
  }, [fitView]);

  // Handle panning start/end to disable hover highlighting during panning
  const handleMoveStart = useCallback(() => {
    setIsPanning(true);
  }, []);

  const handleMoveEnd = useCallback(() => {
    setIsPanning(false);
  }, []);

  // Early return if no data
  if (!originTracing?.hypothesizedOrigin && !beliefDrivers.length && !sources.length) {
    return null;
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: diagramStyles }} />
      <div
        ref={containerRef}
        className={
          isExpanded 
            ? "react-flow-expanded-container"
            : "h-[700px] sm:h-[600px] md:h-[700px] shadow-2xl mb-6 bg-white border-2 border-slate-200 rounded-2xl overflow-hidden"
        }
      >
        <div className="h-full flex flex-col">
          {/* Header Controls */}
          <GraphControls
            isExpanded={isExpanded}
            isAnimating={isAnimating}
            onPauseAnimation={() => setIsAnimating(false)}
            onStopAnimation={stopAnimation}
            onFitView={handleFitView}
          />
          
          {/* Split view container */}
          <div className="flex-1 flex overflow-hidden">
            {/* Graph panel */}
            <div 
              className="relative bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20"
              style={{ width: `${100 - sidebarWidth}%` }}
            >
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
                  color="#cbd5e1" 
                  style={{ opacity: 0.3 }}
                />
              </ReactFlow>
            </div>
            
            {/* Resizer */}
            <SplitViewResizer
              containerRef={containerRef}
              sidebarWidth={sidebarWidth}
              onSidebarWidthChange={setSidebarWidth}
            />
            
            {/* Navigation sidebar */}
            <NavigationSidebar
              navSections={navSections}
              expandedSections={expandedSections}
              activeSection={activeSection}
              animatingNodes={animatingNodes}
              currentAnimationIndex={currentAnimationIndex}
              isAnimating={isAnimating}
              focusedNodeId={focusedNodeId}
              nodes={nodes}
              isExpanded={isExpanded}
              sidebarWidth={sidebarWidth}
              onToggleSection={toggleSection}
              onSectionClick={handleSectionClick}
              onItemClick={handleItemClick}
              onItemMouseEnter={onSidebarItemMouseEnter}
              onItemMouseLeave={onSidebarItemMouseLeave}
            />
          </div>
        </div>
      </div>
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

