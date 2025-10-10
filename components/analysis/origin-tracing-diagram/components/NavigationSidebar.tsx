'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Node } from '@xyflow/react';
import { ChevronDown, ChevronRight, Play, X } from 'lucide-react';
import { Badge } from '../../../ui/badge';
import { NavSection } from '../../../../types/origin-tracing';
import { CurrentClaimHero } from './CurrentClaimHero';
import { SectionPreview } from './SectionPreview';
import { ConnectionLine } from './ConnectionLine';
import { ItemCard } from './ItemCard';
import { getCurrentClaimNode, getSectionStats, getSectionColor } from '../utils/navigationUtils';

interface NavigationSidebarProps {
  navSections: NavSection[];
  expandedSections: Set<string>;
  activeSection: string | null;
  animatingNodes: string[];
  currentAnimationIndex: number;
  isAnimating: boolean;
  nodes: Node[];
  isExpanded: boolean;
  selectedNodeId: string | null;
  onToggleSection: (sectionId: string) => void;
  onSectionClick: (sectionId: string) => void;
  onItemDetailClick: (nodeId: string, item: any) => void;
  onItemMouseEnter?: (nodeId: string) => void;
  onItemMouseLeave?: () => void;
  onSectionMouseEnter?: (sectionId: string) => void;
  onSectionMouseLeave?: () => void;
  onEvolutionTimelineMouseEnter?: () => void;
  onEvolutionTimelineMouseLeave?: () => void;
  onClose: () => void;
}

export function NavigationSidebar({
  navSections,
  expandedSections,
  activeSection,
  animatingNodes,
  currentAnimationIndex,
  isAnimating,
  nodes,
  isExpanded,
  selectedNodeId,
  onToggleSection,
  onSectionClick,
  onItemDetailClick,
  onItemMouseEnter,
  onItemMouseLeave,
  onSectionMouseEnter,
  onSectionMouseLeave,
  onEvolutionTimelineMouseEnter,
  onEvolutionTimelineMouseLeave,
  onClose,
}: NavigationSidebarProps) {
  const [hoveredSection, setHoveredSection] = useState<string | null>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const sectionRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  // Get current claim node and count sources
  const currentClaimNode = getCurrentClaimNode(nodes);
  const sourcesSection = navSections.find(s => s.id.includes('source') || s.id.includes('fact'));
  const totalSources = sourcesSection ? getSectionStats(sourcesSection, nodes).totalItems : 0;

  // Get verdict from claim node or default
  const verdict = String(currentClaimNode?.data.verdict || 'unverified');

  // Calculate connection line positions
  const [linePositions, setLinePositions] = useState<Map<string, { fromY: number; toY: number }>>(new Map());

  useEffect(() => {
    if (!heroRef.current) return;

    const positions = new Map<string, { fromY: number; toY: number }>();
    const heroRect = heroRef.current.getBoundingClientRect();
    const heroBottom = heroRect.bottom - heroRect.top + 20; // Offset from hero bottom

    navSections.forEach((section) => {
      const sectionEl = sectionRefs.current.get(section.id);
      if (sectionEl) {
        const sectionRect = sectionEl.getBoundingClientRect();
        const heroContainerRect = heroRef.current!.parentElement!.getBoundingClientRect();
        const sectionTop = sectionRect.top - heroContainerRect.top;
        
        positions.set(section.id, {
          fromY: heroBottom,
          toY: sectionTop + 35, // Target middle of section header
        });
      }
    });

    setLinePositions(positions);
  }, [navSections, expandedSections]);

  // Helper to get section type
  const getSectionType = (sectionId: string): 'evolution' | 'belief' | 'source' => {
    if (sectionId.includes('evolution') || sectionId.includes('timeline')) return 'evolution';
    if (sectionId.includes('belief') || sectionId.includes('driver')) return 'belief';
    return 'source';
  };

  return (
    <div 
      className={isExpanded ? "expanded-sidebar overflow-y-auto relative h-full" : "border-l border-slate-200 bg-gradient-to-b from-white to-slate-50 overflow-y-auto relative h-full w-full"}
    >
      <div className="p-5 relative">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 p-2 bg-white/80 hover:bg-white border border-slate-200 rounded-lg shadow-sm hover:shadow-md transition-all"
          aria-label="Close sidebar"
        >
          <X className="w-4 h-4 text-slate-600 hover:text-slate-900" />
        </button>

        {/* Hero Card */}
        <div ref={heroRef}>
          <CurrentClaimHero
            claimNode={currentClaimNode}
            verdict={verdict}
            totalSources={totalSources}
          />
        </div>

        {/* Connection Lines Layer */}
        <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 0 }}>
          {navSections.map((section) => {
            const pos = linePositions.get(section.id);
            if (!pos) return null;

            return (
              <ConnectionLine
                key={section.id}
                sectionId={section.id}
                isActive={activeSection === section.id}
                isHovered={hoveredSection === section.id}
                fromY={pos.fromY}
                toY={pos.toY}
                containerWidth={300}
              />
            );
          })}
        </div>
        
        {/* Navigation sections */}
        <div className="space-y-4 relative z-10">
          {navSections.map((section) => {
            const stats = getSectionStats(section, nodes);
            const sectionType = getSectionType(section.id);
            const borderColor = getSectionColor(section.id);
            const isEvolutionTimeline = section.id === 'evolution';
            
            return (
              <div
                key={section.id}
                ref={(el) => {
                  if (el) sectionRefs.current.set(section.id, el);
                }}
                onMouseEnter={() => {
                  setHoveredSection(section.id);
                  if (isEvolutionTimeline) {
                    onEvolutionTimelineMouseEnter?.();
                  }
                }}
                onMouseLeave={() => {
                  setHoveredSection(null);
                  if (isEvolutionTimeline) {
                    onEvolutionTimelineMouseLeave?.();
                  }
                }}
                className="section-card border-2 border-slate-200 rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 bg-white/60 backdrop-blur-lg"
                style={{
                  borderLeftWidth: '4px',
                  borderLeftColor: activeSection === section.id ? borderColor : undefined,
                }}
              >
                {/* Section header */}
                <div className="flex items-center bg-gradient-to-r from-slate-50/80 to-white/80 backdrop-blur">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleSection(section.id);
                    }}
                    className="flex-shrink-0 p-2 pl-2 hover:bg-slate-100 transition-colors rounded-l-xl spring-expand"
                    aria-label={expandedSections.has(section.id) ? "Collapse section" : "Expand section"}
                  >
                    {expandedSections.has(section.id) ? (
                      <ChevronDown className="h-4 w-4 text-slate-700 transition-transform duration-300" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-slate-700 transition-transform duration-300" />
                    )}
                  </button>
                  <button
                    onClick={() => onSectionClick(section.id)}
                    onMouseEnter={() => onSectionMouseEnter?.(section.id)}
                    onMouseLeave={() => onSectionMouseLeave?.()}
                    className={`flex-1 pl-1 pr-3 py-3 flex items-center justify-between text-left hover:bg-slate-50/50 transition-all ${
                      activeSection === section.id ? 'bg-blue-50/70' : ''
                    }`}
                  >
                    <span className={`text-sm font-bold ${section.color} truncate tracking-tight`}>
                      {section.title}
                    </span>
                    <SectionPreview
                      totalItems={stats.totalItems}
                      avgCredibility={stats.avgCredibility}
                      hasAlerts={stats.hasAlerts}
                      sectionType={sectionType}
                    />
                  </button>
                </div>
                
                {/* Section content */}
                {expandedSections.has(section.id) && (
                  <div className="border-t-2 border-slate-200 bg-gradient-to-b from-slate-50/50 to-white/50 spring-expand">
                    {/* Render subsections if they exist */}
                    {section.subsections ? (
                      <div className="space-y-0">
                        {section.subsections.map((subsection, subsectionIdx) => {
                          // Auto-expand evolution timeline subsections
                          const isSubsectionExpanded = isEvolutionTimeline || expandedSections.has(subsection.id);
                          
                          return (
                            <div 
                              key={subsection.id} 
                              className={isEvolutionTimeline 
                                ? "border-b border-slate-100 last:border-b-0" 
                                : "border-b-2 border-slate-200 last:border-b-0"
                              }
                            >
                              {/* Subsection header */}
                              <div className={isEvolutionTimeline 
                                ? "flex items-center bg-gradient-to-r from-slate-50/30 to-white/30" 
                                : "flex items-center bg-gradient-to-r from-slate-100/50 to-white/50"
                              }>
                                <div className="w-4 border-l-2 border-slate-300 ml-2" />
                                {/* Hide toggle button for evolution timeline */}
                                {!isEvolutionTimeline && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onToggleSection(subsection.id);
                                    }}
                                    className="flex-shrink-0 p-2 hover:bg-slate-100 transition-colors"
                                    aria-label={expandedSections.has(subsection.id) ? "Collapse subsection" : "Expand subsection"}
                                  >
                                    {expandedSections.has(subsection.id) ? (
                                      <ChevronDown className="h-3.5 w-3.5 text-slate-600" />
                                    ) : (
                                      <ChevronRight className="h-3.5 w-3.5 text-slate-600" />
                                    )}
                                  </button>
                                )}
                                <button
                                  onClick={() => onSectionClick(subsection.id)}
                                  onMouseEnter={() => {
                                    onSectionMouseEnter?.(subsection.id);
                                    if (isEvolutionTimeline) {
                                      onEvolutionTimelineMouseEnter?.();
                                    }
                                  }}
                                  onMouseLeave={() => {
                                    onSectionMouseLeave?.();
                                    if (isEvolutionTimeline) {
                                      onEvolutionTimelineMouseLeave?.();
                                    }
                                  }}
                                  className={`flex-1 ${isEvolutionTimeline ? 'pl-2' : 'pl-1'} pr-3 ${isEvolutionTimeline ? 'py-2' : 'py-2.5'} flex items-center justify-between text-left hover:bg-slate-50/50 transition-all ${
                                    activeSection === subsection.id ? 'bg-blue-50/70' : ''
                                  }`}
                                >
                                  <span className={`text-xs font-bold ${subsection.color} truncate tracking-tight`}>
                                    {subsection.title}
                                  </span>
                                  <Badge 
                                    variant="outline" 
                                    className={`text-xs ml-auto flex-shrink-0 font-semibold ${
                                      isEvolutionTimeline 
                                        ? 'bg-white/70 border-slate-200' 
                                        : 'bg-white border-slate-300'
                                    }`}
                                  >
                                    {subsection.items.length}
                                  </Badge>
                                </button>
                              </div>
                              
                              {/* Subsection items - always show for evolution timeline */}
                              {isSubsectionExpanded && (
                                <div className={isEvolutionTimeline 
                                  ? "items-masonry-grid bg-slate-50/20" 
                                  : "items-masonry-grid bg-slate-50/30"
                                }>
                                  {subsection.items.map((item, itemIdx) => {
                                    const isCurrentlyAnimating = 
                                      isAnimating && 
                                      activeSection === subsection.id && 
                                      animatingNodes[currentAnimationIndex] === item.nodeId;
                                    const itemNode = nodes.find(n => n.id === item.nodeId) || null;
                                    
                                    // For evolution timeline, show connection between all items across subsections
                                    const isLastItemInSubsection = itemIdx === subsection.items.length - 1;
                                    const isLastSubsection = subsectionIdx === section.subsections!.length - 1;
                                    const showConnection = isEvolutionTimeline 
                                      ? !(isLastItemInSubsection && isLastSubsection) // Show connection except for very last item
                                      : itemIdx < subsection.items.length - 1 && subsection.id.includes('evolution');
                                    
                                    return (
                                      <ItemCard
                                        key={item.id}
                                        item={item}
                                        node={itemNode}
                                        isAnimating={isCurrentlyAnimating}
                                        isSelected={selectedNodeId === item.nodeId}
                                        onItemClick={() => onItemDetailClick(item.nodeId, item)}
                                        onMouseEnter={() => {
                                          // For evolution timeline, only trigger sequential highlight, not individual hover
                                          if (isEvolutionTimeline) {
                                            onEvolutionTimelineMouseEnter?.();
                                          } else {
                                            onItemMouseEnter?.(item.nodeId);
                                          }
                                        }}
                                        onMouseLeave={() => {
                                          // For evolution timeline, only stop sequential highlight, not individual hover
                                          if (isEvolutionTimeline) {
                                            onEvolutionTimelineMouseLeave?.();
                                          } else {
                                            onItemMouseLeave?.();
                                          }
                                        }}
                                        showConnection={showConnection}
                                        index={itemIdx}
                                      />
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      /* Render regular section items */
                      <div className="items-masonry-grid">
                        {section.items.map((item, itemIdx) => {
                          const isCurrentlyAnimating = 
                            isAnimating && 
                            activeSection === section.id && 
                            animatingNodes[currentAnimationIndex] === item.nodeId;
                          const itemNode = nodes.find(n => n.id === item.nodeId) || null;
                          const showConnection = itemIdx < section.items.length - 1 && section.id.includes('evolution');
                          
                          return (
                            <ItemCard
                              key={item.id}
                              item={item}
                              node={itemNode}
                              isAnimating={isCurrentlyAnimating}
                              isSelected={selectedNodeId === item.nodeId}
                              onItemClick={() => onItemDetailClick(item.nodeId, item)}
                                onMouseEnter={() => onItemMouseEnter?.(item.nodeId)}
                                onMouseLeave={() => onItemMouseLeave?.()}
                              showConnection={showConnection}
                              index={itemIdx}
                            />
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        
        {/* Animation info */}
        {isAnimating && activeSection && (
          <div className="mt-6 p-4 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-xl border-2 border-blue-300 shadow-lg spring-expand">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-blue-500 rounded-lg shadow-md pulse-indicator">
                <Play className="h-4 w-4 text-white" />
              </div>
              <span className="text-sm font-bold text-blue-900 tracking-tight">
                Auto-touring {navSections.find(s => s.id === activeSection)?.title}
              </span>
            </div>
            <div className="flex items-center justify-between bg-white/70 px-3 py-2 rounded-lg">
              <p className="text-xs font-semibold text-blue-800">
                Progress:
              </p>
              <Badge className="bg-blue-500 text-white font-bold">
                {currentAnimationIndex + 1} / {animatingNodes.length}
              </Badge>
            </div>
          </div>
        )}
        
        {/* Footer help text */}
        {isExpanded && (
          <div className="mt-6 pt-4 border-t-2 border-slate-200">
            <p className="text-xs text-slate-600 text-center font-medium bg-slate-50 px-4 py-3 rounded-lg">
              Expanded to full width • Scroll away to collapse
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
