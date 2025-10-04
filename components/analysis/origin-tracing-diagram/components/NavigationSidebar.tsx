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
      className={isFullscreen ? "fullscreen-sidebar overflow-y-auto" : "border-l bg-white overflow-y-auto"}
      style={{ width: `${sidebarWidth}%` }}
    >
      <div className="p-4">
        <h3 className="font-semibold text-sm mb-4 text-gray-900">
          Navigation
        </h3>
        
        {/* Navigation sections */}
        <div className="space-y-2">
          {navSections.map((section) => (
            <div key={section.id} className="border rounded-lg overflow-hidden">
              {/* Section header */}
              <div className="flex items-center">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleSection(section.id);
                  }}
                  className="flex-shrink-0 p-3 hover:bg-gray-100 transition-colors"
                  aria-label={expandedSections.has(section.id) ? "Collapse section" : "Expand section"}
                >
                  {expandedSections.has(section.id) ? (
                    <ChevronDown className="h-3 w-3" />
                  ) : (
                    <ChevronRight className="h-3 w-3" />
                  )}
                </button>
                <button
                  onClick={() => onSectionClick(section.id)}
                  className={`flex-1 px-3 py-2 flex items-center justify-between text-left hover:bg-gray-50 transition-colors ${
                    activeSection === section.id ? 'bg-blue-50' : ''
                  }`}
                >
                  <span className={`text-sm font-medium ${section.color} truncate`}>
                    {section.title}
                  </span>
                  <Badge variant="outline" className="text-xs ml-auto flex-shrink-0">
                    {section.items.length}
                  </Badge>
                </button>
              </div>
              
              {/* Section items */}
              {expandedSections.has(section.id) && (
                <div className="border-t bg-gray-50">
                  {section.items.map((item) => {
                    const isCurrentlyAnimating = 
                      isAnimating && 
                      activeSection === section.id && 
                      animatingNodes[currentAnimationIndex] === item.nodeId;
                    const isFocused = focusedNodeId === item.nodeId;
                    const focusedNode = isFocused ? nodes.find(n => n.id === item.nodeId) : null;
                    
                    return (
                      <div key={item.id} className="border-b last:border-b-0">
                        <button
                          onClick={() => onItemClick(section.id, item.nodeId)}
                          className={`w-full px-3 py-2 flex items-start gap-2 text-left hover:bg-white transition-colors ${
                            isCurrentlyAnimating ? 'bg-blue-100 border-l-4 border-l-blue-500' : ''
                          }`}
                        >
                          <div className="flex-shrink-0 mt-0.5 opacity-70">
                            {item.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-xs leading-relaxed ${
                              isCurrentlyAnimating ? 'font-semibold text-blue-900' : 'text-gray-700'
                            }`}>
                              {item.label}
                            </p>
                          </div>
                          {isCurrentlyAnimating && (
                            <div className="flex-shrink-0">
                              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                            </div>
                          )}
                        </button>
                        
                        {/* Expanded description when focused */}
                        {isFocused && focusedNode && (
                          <div className="px-3 py-3 bg-gradient-to-br from-blue-50 to-indigo-50 border-t border-blue-200 animate-in slide-in-from-top duration-300">
                            <div className="space-y-2">
                              {/* Description/Content */}
                              <div className="text-xs text-gray-800 leading-relaxed">
                                {focusedNode.type === 'beliefDriver' ? String(focusedNode.data.description || '') : null}
                                {(focusedNode.type === 'origin' || focusedNode.type === 'evolution' || focusedNode.type === 'propagation') 
                                  ? String(focusedNode.data.label || '') : null}
                                {focusedNode.type === 'source' ? String(focusedNode.data.label || '') : null}
                                {focusedNode.type === 'claim' ? String(focusedNode.data.label || '') : null}
                              </div>
                              
                              {/* Impact */}
                              {focusedNode.data.impact && typeof focusedNode.data.impact === 'string' ? (
                                <div className="pt-2 border-t border-blue-200">
                                  <p className="text-xs text-gray-600">
                                    <span className="font-semibold">Impact:</span> {focusedNode.data.impact}
                                  </p>
                                </div>
                              ) : null}
                              
                              {/* Credibility */}
                              {focusedNode.data.credibility !== undefined ? (
                                <div className="pt-2 border-t border-blue-200 flex items-center justify-between">
                                  <span className="text-xs font-semibold text-gray-600">Credibility:</span>
                                  <Badge variant={Number(focusedNode.data.credibility) >= 80 ? 'default' : 'secondary'} className="text-xs">
                                    {String(focusedNode.data.credibility)}%
                                  </Badge>
                                </div>
                              ) : null}
                              
                              {/* URL Link */}
                              {(focusedNode.data.url && typeof focusedNode.data.url === 'string') ? (
                                <div className="pt-2 border-t border-blue-200">
                                  <a
                                    href={focusedNode.data.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium"
                                  >
                                    <ExternalLink className="h-3 w-3" />
                                    View Source
                                  </a>
                                </div>
                              ) : null}
                              
                              {/* References */}
                              {(focusedNode.data.references && Array.isArray(focusedNode.data.references) && focusedNode.data.references.length > 0) ? (
                                <div className="pt-2 border-t border-blue-200">
                                  <p className="text-xs font-semibold text-gray-600 mb-1">References:</p>
                                  <div className="space-y-1">
                                    {focusedNode.data.references.slice(0, 3).map((ref: any, idx: number) => (
                                      <a
                                        key={idx}
                                        href={ref.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="block text-xs text-blue-600 hover:text-blue-800 truncate"
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
        
        {/* Animation info */}
        {isAnimating && activeSection && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center gap-2 mb-2">
              <Play className="h-3 w-3 text-blue-600" />
              <span className="text-xs font-medium text-blue-900">
                Auto-touring {navSections.find(s => s.id === activeSection)?.title}
              </span>
            </div>
            <p className="text-xs text-blue-700">
              {currentAnimationIndex + 1} of {animatingNodes.length}
            </p>
          </div>
        )}
        
        {/* Additional info in fullscreen */}
        {isFullscreen && (
          <div className="mt-4 pt-4 border-t">
            <p className="text-xs text-gray-500 text-center">
              Press ESC or click Exit Fullscreen to return
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

