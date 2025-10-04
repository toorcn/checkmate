'use client';

import React, { useRef, useState, useCallback } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  ReactFlowProvider,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { OriginTracingDiagramProps } from '../../../types/origin-tracing';
import { nodeTypes } from './nodes';
import { useOriginTracingGraph, useOriginTracingAnimation, useFullscreen } from './hooks';
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
  
  // Fullscreen management
  const { isFullscreen, toggleFullscreen } = useFullscreen(containerRef);
  
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
  
  // Disable manual connections for this read-only diagram
  const onConnect = useCallback(() => {}, []);

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
          isFullscreen 
            ? "react-flow-fullscreen-container"
            : "w-full h-[700px] sm:h-[600px] md:h-[700px] shadow-lg mb-6 bg-white border rounded-lg"
        }
      >
        <div className="h-full flex flex-col">
          {/* Header Controls */}
          <GraphControls
            isFullscreen={isFullscreen}
            isAnimating={isAnimating}
            onToggleFullscreen={toggleFullscreen}
            onPauseAnimation={() => setIsAnimating(false)}
            onStopAnimation={stopAnimation}
          />
          
          {/* Split view container */}
          <div className="flex-1 flex overflow-hidden">
            {/* Graph panel */}
            <div 
              className="relative bg-gradient-to-br from-gray-50 to-white"
              style={{ width: `${100 - sidebarWidth}%` }}
            >
              <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onPaneClick={handlePaneClick}
                onNodeClick={handleNodeClick}
                nodeTypes={nodeTypes}
                fitView
                fitViewOptions={{ 
                  padding: 0.15,
                  includeHiddenNodes: false,
                  minZoom: 0.1,
                  maxZoom: 1.5
                }}
                minZoom={0.1}
                maxZoom={1.5}
                attributionPosition="bottom-left"
                defaultViewport={{ x: 0, y: 0, zoom: 0.2 }}
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
                <Controls 
                  showInteractive={false}
                  showZoom={true}
                  showFitView={true}
                  position="top-right"
                />
                <Background gap={15} size={1} color="#f1f5f9" />
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
              isFullscreen={isFullscreen}
              sidebarWidth={sidebarWidth}
              onToggleSection={toggleSection}
              onSectionClick={handleSectionClick}
              onItemClick={handleItemClick}
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

