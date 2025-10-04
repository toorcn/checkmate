'use client';

import React from 'react';
import { Node } from '@xyflow/react';
import { ChevronDown, ChevronRight, Play, ExternalLink } from 'lucide-react';
import { Badge } from '../../../ui/badge';
import { NavSection } from '../../../../types/origin-tracing';

interface NavigationSidebarProps {
  navSections: NavSection[];
  expandedSections: Set<string>;
  activeSection: string | null;
  animatingNodes: string[];
  currentAnimationIndex: number;
  isAnimating: boolean;
  focusedNodeId: string | null;
  nodes: Node[];
  isFullscreen: boolean;
  sidebarWidth: number;
  onToggleSection: (sectionId: string) => void;
  onSectionClick: (sectionId: string) => void;
  onItemClick: (sectionId: string, nodeId: string) => void;
}

export function NavigationSidebar({
  navSections,
  expandedSections,
  activeSection,
  animatingNodes,
  currentAnimationIndex,
  isAnimating,
  focusedNodeId,
  nodes,
  isFullscreen,
  sidebarWidth,
  onToggleSection,
  onSectionClick,
  onItemClick,
}: NavigationSidebarProps) {
  return (
    <div 
      className={isFullscreen ? "fullscreen-sidebar overflow-y-auto" : "border-l border-slate-200 bg-gradient-to-b from-white to-slate-50 overflow-y-auto"}
      style={{ width: `${sidebarWidth}%` }}
    >
      <div className="p-5">
        <div className="mb-5 pb-4 border-b border-slate-200">
          <h3 className="font-bold text-base mb-1 text-slate-900 tracking-tight">
            Navigation
          </h3>
          <p className="text-xs text-slate-600 font-medium">
            Explore the claim journey
          </p>
        </div>
        
        {/* Navigation sections */}
        <div className="space-y-3">
          {navSections.map((section) => {
            // Calculate total items for parent section
            const totalItems = section.subsections 
              ? section.subsections.reduce((sum, sub) => sum + sub.items.length, 0)
              : section.items.length;
            
            return (
              <div key={section.id} className="border-2 border-slate-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all bg-white">
                {/* Section header */}
                <div className="flex items-center bg-gradient-to-r from-slate-50 to-white">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleSection(section.id);
                    }}
                    className="flex-shrink-0 p-3 hover:bg-slate-100 transition-colors rounded-l-xl"
                    aria-label={expandedSections.has(section.id) ? "Collapse section" : "Expand section"}
                  >
                    {expandedSections.has(section.id) ? (
                      <ChevronDown className="h-4 w-4 text-slate-700" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-slate-700" />
                    )}
                  </button>
                  <button
                    onClick={() => onSectionClick(section.id)}
                    className={`flex-1 px-3 py-3 flex items-center justify-between text-left hover:bg-slate-50 transition-all ${
                      activeSection === section.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                    }`}
                  >
                    <span className={`text-sm font-bold ${section.color} truncate tracking-tight`}>
                      {section.title}
                    </span>
                    <Badge variant="outline" className="text-xs ml-auto flex-shrink-0 font-semibold bg-slate-100 border-slate-300">
                      {totalItems}
                    </Badge>
                  </button>
                </div>
                
                {/* Section content */}
                {expandedSections.has(section.id) && (
                  <div className="border-t-2 border-slate-200 bg-gradient-to-b from-slate-50 to-white">
                    {/* Render subsections if they exist */}
                    {section.subsections ? (
                      <div className="space-y-0">
                        {section.subsections.map((subsection) => (
                          <div key={subsection.id} className="border-b-2 border-slate-200 last:border-b-0">
                            {/* Subsection header */}
                            <div className="flex items-center bg-gradient-to-r from-slate-100/50 to-white">
                              <div className="w-4 border-l-2 border-slate-300 ml-3" />
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onToggleSection(subsection.id);
                                }}
                                className="flex-shrink-0 p-2.5 hover:bg-slate-100 transition-colors"
                                aria-label={expandedSections.has(subsection.id) ? "Collapse subsection" : "Expand subsection"}
                              >
                                {expandedSections.has(subsection.id) ? (
                                  <ChevronDown className="h-3.5 w-3.5 text-slate-600" />
                                ) : (
                                  <ChevronRight className="h-3.5 w-3.5 text-slate-600" />
                                )}
                              </button>
                              <button
                                onClick={() => onSectionClick(subsection.id)}
                                className={`flex-1 px-3 py-2.5 flex items-center justify-between text-left hover:bg-slate-50/50 transition-all ${
                                  activeSection === subsection.id ? 'bg-blue-50/70' : ''
                                }`}
                              >
                                <span className={`text-xs font-bold ${subsection.color} truncate tracking-tight`}>
                                  {subsection.title}
                                </span>
                                <Badge variant="outline" className="text-xs ml-auto flex-shrink-0 font-semibold bg-white border-slate-300">
                                  {subsection.items.length}
                                </Badge>
                              </button>
                            </div>
                            
                            {/* Subsection items */}
                            {expandedSections.has(subsection.id) && (
                              <div className="bg-slate-50/30">
                                {subsection.items.map((item) => {
                                  const isCurrentlyAnimating = 
                                    isAnimating && 
                                    activeSection === subsection.id && 
                                    animatingNodes[currentAnimationIndex] === item.nodeId;
                                  const isFocused = focusedNodeId === item.nodeId;
                                  const focusedNode = isFocused ? nodes.find(n => n.id === item.nodeId) : null;
                                  
                                  return (
                                    <div key={item.id} className="border-b border-slate-200 last:border-b-0">
                                      <div className="flex">
                                        <div className="w-8 border-l-2 border-slate-300 ml-3 flex-shrink-0" />
                                        <button
                                          onClick={() => onItemClick(subsection.id, item.nodeId)}
                                          className={`flex-1 px-4 py-3 flex items-start gap-3 text-left hover:bg-white transition-all group ${
                                            isCurrentlyAnimating ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-l-blue-500 shadow-inner' : ''
                                          } ${isFocused ? 'bg-slate-50' : ''}`}
                                        >
                                          <div className="flex-shrink-0 mt-0.5 opacity-75 group-hover:opacity-100 transition-opacity">
                                            {item.icon}
                                          </div>
                                          <div className="flex-1 min-w-0">
                                            <p className={`text-xs leading-relaxed font-medium ${
                                              isCurrentlyAnimating ? 'font-bold text-blue-900' : 'text-slate-700'
                                            }`}>
                                              {item.label}
                                            </p>
                                          </div>
                                          {isCurrentlyAnimating && (
                                            <div className="flex-shrink-0">
                                              <div className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-pulse shadow-lg shadow-blue-500/50" />
                                            </div>
                                          )}
                                        </button>
                                      </div>
                                      
                                      {/* Expanded description when focused */}
                                      {isFocused && focusedNode && (
                                        <div className="ml-11 px-4 py-4 bg-gradient-to-br from-blue-50/90 via-indigo-50/90 to-purple-50/90 border-t-2 border-blue-300 animate-in slide-in-from-top duration-300 shadow-inner">
                                          <div className="space-y-3">
                                            {/* Description/Content */}
                                            <div className="text-xs text-slate-800 leading-relaxed font-medium bg-white/60 p-3 rounded-lg">
                                              {focusedNode.type === 'beliefDriver' ? String(focusedNode.data.description || '') : null}
                                              {(focusedNode.type === 'origin' || focusedNode.type === 'evolution' || focusedNode.type === 'propagation') 
                                                ? String(focusedNode.data.label || '') : null}
                                              {focusedNode.type === 'source' ? String(focusedNode.data.label || '') : null}
                                              {focusedNode.type === 'claim' ? String(focusedNode.data.label || '') : null}
                                            </div>
                                            
                                            {/* Impact */}
                                            {focusedNode.data.impact && typeof focusedNode.data.impact === 'string' ? (
                                              <div className="pt-2 border-t border-blue-300">
                                                <p className="text-xs text-slate-700 bg-white/60 p-3 rounded-lg">
                                                  <span className="font-bold text-slate-900">Impact:</span> {focusedNode.data.impact}
                                                </p>
                                              </div>
                                            ) : null}
                                            
                                            {/* Credibility */}
                                            {focusedNode.data.credibility !== undefined ? (
                                              <div className="pt-2 border-t border-blue-300 flex items-center justify-between bg-white/60 p-3 rounded-lg">
                                                <span className="text-xs font-bold text-slate-900">Credibility:</span>
                                                <Badge variant={Number(focusedNode.data.credibility) >= 80 ? 'default' : 'secondary'} className="text-xs font-bold shadow-sm">
                                                  {String(focusedNode.data.credibility)}%
                                                </Badge>
                                              </div>
                                            ) : null}
                                            
                                            {/* URL Link */}
                                            {(focusedNode.data.url && typeof focusedNode.data.url === 'string') ? (
                                              <div className="pt-2 border-t border-blue-300">
                                                <a
                                                  href={focusedNode.data.url}
                                                  target="_blank"
                                                  rel="noopener noreferrer"
                                                  className="inline-flex items-center gap-2 text-xs text-blue-700 hover:text-blue-900 font-bold transition-colors bg-white/80 px-4 py-2 rounded-lg hover:shadow-md w-full justify-center"
                                                >
                                                  <ExternalLink className="h-3.5 w-3.5" />
                                                  View Source
                                                </a>
                                              </div>
                                            ) : null}
                                            
                                            {/* References */}
                                            {(focusedNode.data.references && Array.isArray(focusedNode.data.references) && focusedNode.data.references.length > 0) ? (
                                              <div className="pt-2 border-t border-blue-300">
                                                <p className="text-xs font-bold text-slate-900 mb-2">References:</p>
                                                <div className="space-y-2">
                                                  {focusedNode.data.references.slice(0, 3).map((ref: any, idx: number) => (
                                                    <a
                                                      key={idx}
                                                      href={ref.url}
                                                      target="_blank"
                                                      rel="noopener noreferrer"
                                                      className="block text-xs text-blue-700 hover:text-blue-900 truncate font-medium bg-white/80 px-3 py-2 rounded-lg hover:shadow-md transition-all"
                                                    >
                                                      • {ref.title}
                                                    </a>
                                                  ))}
                                                </div>
                                              </div>
                                            ) : null}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      /* Render regular section items */
                      <div>
                        {section.items.map((item) => {
                          const isCurrentlyAnimating = 
                            isAnimating && 
                            activeSection === section.id && 
                            animatingNodes[currentAnimationIndex] === item.nodeId;
                          const isFocused = focusedNodeId === item.nodeId;
                          const focusedNode = isFocused ? nodes.find(n => n.id === item.nodeId) : null;
                          
                          return (
                            <div key={item.id} className="border-b border-slate-200 last:border-b-0">
                              <button
                                onClick={() => onItemClick(section.id, item.nodeId)}
                                className={`w-full px-4 py-3 flex items-start gap-3 text-left hover:bg-white transition-all group ${
                                  isCurrentlyAnimating ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-l-blue-500 shadow-inner' : ''
                                } ${isFocused ? 'bg-slate-50' : ''}`}
                              >
                                <div className="flex-shrink-0 mt-0.5 opacity-75 group-hover:opacity-100 transition-opacity">
                                  {item.icon}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className={`text-xs leading-relaxed font-medium ${
                                    isCurrentlyAnimating ? 'font-bold text-blue-900' : 'text-slate-700'
                                  }`}>
                                    {item.label}
                                  </p>
                                </div>
                                {isCurrentlyAnimating && (
                                  <div className="flex-shrink-0">
                                    <div className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-pulse shadow-lg shadow-blue-500/50" />
                                  </div>
                                )}
                              </button>
                              
                              {/* Expanded description when focused */}
                              {isFocused && focusedNode && (
                                <div className="px-4 py-4 bg-gradient-to-br from-blue-50/90 via-indigo-50/90 to-purple-50/90 border-t-2 border-blue-300 animate-in slide-in-from-top duration-300 shadow-inner">
                                  <div className="space-y-3">
                                    {/* Description/Content */}
                                    <div className="text-xs text-slate-800 leading-relaxed font-medium bg-white/60 p-3 rounded-lg">
                                      {focusedNode.type === 'beliefDriver' ? String(focusedNode.data.description || '') : null}
                                      {(focusedNode.type === 'origin' || focusedNode.type === 'evolution' || focusedNode.type === 'propagation') 
                                        ? String(focusedNode.data.label || '') : null}
                                      {focusedNode.type === 'source' ? String(focusedNode.data.label || '') : null}
                                      {focusedNode.type === 'claim' ? String(focusedNode.data.label || '') : null}
                                    </div>
                                    
                                    {/* Impact */}
                                    {focusedNode.data.impact && typeof focusedNode.data.impact === 'string' ? (
                                      <div className="pt-2 border-t border-blue-300">
                                        <p className="text-xs text-slate-700 bg-white/60 p-3 rounded-lg">
                                          <span className="font-bold text-slate-900">Impact:</span> {focusedNode.data.impact}
                                        </p>
                                      </div>
                                    ) : null}
                                    
                                    {/* Credibility */}
                                    {focusedNode.data.credibility !== undefined ? (
                                      <div className="pt-2 border-t border-blue-300 flex items-center justify-between bg-white/60 p-3 rounded-lg">
                                        <span className="text-xs font-bold text-slate-900">Credibility:</span>
                                        <Badge variant={Number(focusedNode.data.credibility) >= 80 ? 'default' : 'secondary'} className="text-xs font-bold shadow-sm">
                                          {String(focusedNode.data.credibility)}%
                                        </Badge>
                                      </div>
                                    ) : null}
                                    
                                    {/* URL Link */}
                                    {(focusedNode.data.url && typeof focusedNode.data.url === 'string') ? (
                                      <div className="pt-2 border-t border-blue-300">
                                        <a
                                          href={focusedNode.data.url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="inline-flex items-center gap-2 text-xs text-blue-700 hover:text-blue-900 font-bold transition-colors bg-white/80 px-4 py-2 rounded-lg hover:shadow-md w-full justify-center"
                                        >
                                          <ExternalLink className="h-3.5 w-3.5" />
                                          View Source
                                        </a>
                                      </div>
                                    ) : null}
                                    
                                    {/* References */}
                                    {(focusedNode.data.references && Array.isArray(focusedNode.data.references) && focusedNode.data.references.length > 0) ? (
                                      <div className="pt-2 border-t border-blue-300">
                                        <p className="text-xs font-bold text-slate-900 mb-2">References:</p>
                                        <div className="space-y-2">
                                          {focusedNode.data.references.slice(0, 3).map((ref: any, idx: number) => (
                                            <a
                                              key={idx}
                                              href={ref.url}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="block text-xs text-blue-700 hover:text-blue-900 truncate font-medium bg-white/80 px-3 py-2 rounded-lg hover:shadow-md transition-all"
                                            >
                                              • {ref.title}
                                            </a>
                                          ))}
                                        </div>
                                      </div>
                                    ) : null}
                                  </div>
                                </div>
                              )}
                            </div>
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
          <div className="mt-5 p-4 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-xl border-2 border-blue-300 shadow-lg">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-blue-500 rounded-lg shadow-md">
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
        
        {/* Additional info in fullscreen */}
        {isFullscreen && (
          <div className="mt-5 pt-4 border-t-2 border-slate-200">
            <p className="text-xs text-slate-600 text-center font-medium bg-slate-50 px-4 py-3 rounded-lg">
              Press <kbd className="px-2 py-1 bg-white border border-slate-300 rounded text-slate-800 font-mono text-xs shadow-sm">ESC</kbd> or click Exit Fullscreen to return
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

