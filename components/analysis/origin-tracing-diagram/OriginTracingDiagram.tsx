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
import { useOriginTracingGraph, useOriginTracingAnimation, useFullscreen, useScrollExpansion } from './hooks';
import { GraphControls, NavigationSidebar, SplitViewResizer } from './components';
import { diagramStyles } from './diagram-styles';
import { ClusterConfig } from '../../../lib/analysis/origin-tracing-layout';

/**
 * Cluster background panels for visual grouping
 * Rendered as custom Background component to properly handle zoom/pan
 */
interface ClusterBackgroundsProps {
  clusters: ClusterConfig[];
}

const clusterColors: Record<string, { bg: string; border: string; label: string; title: string }> = {
  evolution: {
    bg: 'rgba(59, 130, 246, 0.08)',
    border: 'rgba(59, 130, 246, 0.3)',
    label: '#1e40af',
    title: 'Evolution Timeline'
  },
  claim: {
    bg: 'rgba(239, 68, 68, 0.08)',
    border: 'rgba(239, 68, 68, 0.3)',
    label: '#991b1b',
    title: 'Current Claim'
  },
  beliefs: {
    bg: 'rgba(168, 85, 247, 0.08)',
    border: 'rgba(168, 85, 247, 0.3)',
    label: '#6b21a8',
    title: 'Belief Drivers'
  },
  sources: {
    bg: 'rgba(16, 185, 129, 0.08)',
    border: 'rgba(16, 185, 129, 0.3)',
    label: '#065f46',
    title: 'Fact-Check Sources'
  },
};

function ClusterBackgrounds({ clusters }: ClusterBackgroundsProps) {
  return (
    <svg
      style={{
        position: 'absolute',
        width: '100%',
        height: '100%',
        top: 0,
        left: 0,
        pointerEvents: 'none',
      }}
    >
      <defs>
        <filter id="cluster-shadow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="3" />
          <feOffset dx="0" dy="2" result="offsetblur" />
          <feComponentTransfer>
            <feFuncA type="linear" slope="0.2" />
          </feComponentTransfer>
          <feMerge>
            <feMergeNode />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      
      {clusters.map(cluster => {
        const config = clusterColors[cluster.id] || clusterColors.evolution;
        const padding = 40;
        const x = cluster.centerX - cluster.width / 2 - padding;
        const y = cluster.centerY - cluster.height / 2 - padding;
        const width = cluster.width + padding * 2;
        const height = cluster.height + padding * 2;
        
        return (
          <g key={cluster.id}>
            {/* Background panel */}
            <rect
              x={x}
              y={y}
              width={width}
              height={height}
              rx={16}
              ry={16}
              fill={config.bg}
              stroke={config.border}
              strokeWidth={2}
              filter="url(#cluster-shadow)"
            />
            
            {/* Label */}
            <text
              x={x + 20}
              y={y + 28}
              fill={config.label}
              fontSize={14}
              fontWeight="700"
              fontFamily="system-ui, -apple-system, sans-serif"
            >
              {config.title}
            </text>
            
            {/* Decorative line under label */}
            <line
              x1={x + 20}
              y1={y + 35}
              x2={x + 20 + config.title.length * 8}
              y2={y + 35}
              stroke={config.border}
              strokeWidth={2}
              strokeLinecap="round"
            />
          </g>
        );
      })}
    </svg>
  );
}

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
  const { fitView } = useReactFlow();
  
  // Fullscreen management
  const { isFullscreen, toggleFullscreen } = useFullscreen(containerRef);
  
  // Scroll-based expansion
  const { widthScale, isExpanded } = useScrollExpansion({
    containerRef,
    expansionPercentage: 15,
    _duration: 600,
  });
  
  // Graph initialization
  const { nodes: initialNodes, edges: initialEdges, navSections, clusters } = useOriginTracingGraph({
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

  // Early return if no data
  if (!originTracing?.hypothesizedOrigin && !beliefDrivers.length && !sources.length) {
    return null;
  }

  // Calculate container styles based on expansion state
  const getContainerStyles = () => {
    if (isFullscreen) {
      return {
        width: '100%',
        position: 'fixed' as const,
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999,
      };
    }
    
    if (isExpanded) {
      // Full viewport width expansion with high z-index to overlay header
      return {
        width: '100vw',
        maxWidth: '100vw',
        position: 'fixed' as const,
        left: 0,
        right: 0,
        top: 0,
        zIndex: 50,
        transition: 'all 600ms cubic-bezier(0.4, 0, 0.2, 1)',
      };
    }
    
    // Normal state - relative positioning
    return {
      width: '100%',
      maxWidth: '100%',
      position: 'relative' as const,
      zIndex: 1,
      transition: 'all 600ms cubic-bezier(0.4, 0, 0.2, 1)',
    };
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: diagramStyles }} />
      <div
        ref={containerRef}
        className={
          isFullscreen 
            ? "react-flow-fullscreen-container"
            : "h-[700px] sm:h-[600px] md:h-[700px] shadow-2xl mb-6 bg-white border-2 border-slate-200 rounded-2xl overflow-hidden"
        }
        style={getContainerStyles()}
      >
        <div className="h-full flex flex-col">
          {/* Header Controls - hidden when expanded to show more diagram */}
          {!isExpanded && (
            <GraphControls
              isFullscreen={isFullscreen}
              isAnimating={isAnimating}
              onToggleFullscreen={toggleFullscreen}
              onPauseAnimation={() => setIsAnimating(false)}
              onStopAnimation={stopAnimation}
              onFitView={handleFitView}
            />
          )}
          
          {/* Split view container */}
          <div className="flex-1 flex overflow-hidden">
            {/* Graph panel */}
            <div 
              className="relative bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20"
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
                {/* Cluster backgrounds as separate SVG layer */}
                <svg
                  style={{
                    position: 'absolute',
                    width: '100%',
                    height: '100%',
                    top: 0,
                    left: 0,
                    pointerEvents: 'none',
                    zIndex: 0,
                  }}
                >
                  <ClusterBackgrounds clusters={clusters} />
                </svg>
                
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

