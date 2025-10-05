'use client';

import React, { useEffect, useRef } from 'react';
import { Node } from '@xyflow/react';
import { Badge } from '../../../ui/badge';
import { ArrowRight, Eye } from 'lucide-react';
import { getCredibilityColor } from '../utils/navigationUtils';

interface ItemCardProps {
  item: {
    id: string;
    label: string;
    icon: React.ReactNode;
    nodeId: string;
  };
  node: Node | null;
  isAnimating: boolean;
  isSelected: boolean;
  onItemClick: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  showConnection?: boolean;
  index: number;
}

export const ItemCard = React.memo(({
  item,
  node,
  isAnimating,
  isSelected,
  onItemClick,
  onMouseEnter,
  onMouseLeave,
  showConnection = false,
  index,
}: ItemCardProps) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const credibility = node?.data.credibility !== undefined ? Number(node.data.credibility) : null;
  const colors = credibility !== null ? getCredibilityColor(credibility) : null;
  
  // Scroll into view when selected
  useEffect(() => {
    if (isSelected && cardRef.current && !isAnimating) {
      cardRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'nearest',
      });
    }
  }, [isSelected, isAnimating]);
  
  // Get credibility tier label
  const getCredibilityTier = () => {
    if (credibility === null) return 'Unknown';
    if (credibility >= 80) return 'High';
    if (credibility >= 50) return 'Medium';
    if (credibility >= 30) return 'Low';
    return 'Very Low';
  };

  // Extract metadata from node
  const getMetadata = () => {
    const meta: string[] = [];
    if (node?.data.source) meta.push(String(node.data.source));
    if (node?.data.platform) meta.push(String(node.data.platform));
    if (node?.data.reach) meta.push(`${String(node.data.reach)} reach`);
    if (node?.data.date) meta.push(String(node.data.date));
    if (node?.data.type) meta.push(String(node.data.type));
    return meta.slice(0, 3); // Max 3 items
  };

  const metadata = getMetadata();

  return (
    <div
      ref={cardRef}
      className="item-masonry-card stagger-item"
      style={{ animationDelay: `${index * 0.05}s` }}
    >
      <button
        onClick={onItemClick}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        className={`w-full text-left transition-all duration-300 rounded-xl border-2 p-4 group relative overflow-hidden ${
          isAnimating 
            ? `${colors?.gradient ? `bg-gradient-to-br ${colors.gradient}` : 'bg-gradient-to-br from-blue-50 to-indigo-50'} ${colors?.border || 'border-blue-400'} shadow-lg scale-105` 
            : isSelected
            ? `bg-blue-50/80 ${colors?.border || 'border-blue-500'} shadow-lg ring-2 ring-blue-400 ring-offset-1`
            : 'bg-white/80 border-slate-200 hover:border-slate-300 hover:shadow-lg hover:-translate-y-1'
        }`}
      >
        {/* Animated pulse indicator for active item */}
        {isAnimating && (
          <div className="absolute top-2 right-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full pulse-indicator shadow-lg shadow-blue-500/50" />
          </div>
        )}
        
        {/* Selection indicator */}
        {isSelected && !isAnimating && (
          <div className="absolute top-2 right-2">
            <div className="flex items-center gap-1 bg-blue-500 text-white px-2 py-1 rounded-full shadow-lg">
              <Eye className="w-3 h-3" />
              <span className="text-xs font-bold">Viewing</span>
            </div>
          </div>
        )}

        {/* Header: Icon circle + Title */}
        <div className="flex items-start gap-3 mb-3">
          {/* Color-coded credibility circle */}
          <div 
            className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
              colors ? `${colors.gradient} bg-gradient-to-br` : 'bg-slate-100'
            } border-2 ${colors?.border || 'border-slate-300'} shadow-sm transition-transform group-hover:scale-110`}
          >
            <div className="opacity-80">
              {item.icon}
            </div>
          </div>

          {/* Title */}
          <div className="flex-1 min-w-0">
            <h4 className={`text-sm font-bold leading-tight mb-1 ${
              isAnimating ? colors?.text || 'text-blue-900' : 'text-slate-900'
            } line-clamp-2 group-hover:text-blue-700 transition-colors`}>
              {item.label}
            </h4>
            {node?.data.date ? (
              <p className="text-xs text-slate-500 font-medium">
                {String(node.data.date)}
              </p>
            ) : null}
          </div>
        </div>

        {/* Description preview (2 lines) */}
        {node && (
          <div className="mb-3">
            <p className="text-xs text-slate-700 leading-relaxed line-clamp-2">
              {node.type === 'beliefDriver' ? (node.data.description ? String(node.data.description) : item.label) : 
               node.type === 'source' ? (node.data.label ? String(node.data.label) : item.label) :
               (node.data.label ? String(node.data.label) : item.label)}
            </p>
          </div>
        )}

        {/* Prominent Credibility Bar */}
        {credibility !== null && (
          <div className="mb-3 bg-slate-100 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-700">Credibility</span>
              <Badge className={`text-xs font-bold ${colors?.badge || 'bg-slate-200 text-slate-800'}`}>
                {credibility}%
              </Badge>
            </div>
            <div className="relative h-2 bg-slate-200 rounded-full overflow-hidden">
              <div 
                className={`absolute inset-y-0 left-0 rounded-full transition-all duration-500 ${
                  colors ? `bg-gradient-to-r ${colors.gradient}` : 'bg-slate-400'
                }`}
                style={{ width: `${credibility}%` }}
              />
            </div>
            <div className="flex items-center justify-between mt-1">
              <span className={`text-xs font-semibold ${colors?.text || 'text-slate-600'}`}>
                {getCredibilityTier()}
              </span>
            </div>
          </div>
        )}

        {/* Metadata bullets */}
        {metadata.length > 0 && (
          <div className="space-y-1 mb-3">
            {metadata.map((meta, idx) => (
              <div key={idx} className="flex items-center gap-2 text-xs text-slate-600">
                <div className="w-1 h-1 rounded-full bg-slate-400" />
                <span className="truncate">{meta}</span>
              </div>
            ))}
          </div>
        )}

        {/* Connection indicator */}
        {showConnection && (
          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium pt-2 border-t border-slate-200">
            <ArrowRight className="w-3 h-3" />
            <span>Evolved to next</span>
          </div>
        )}

        {/* Click hint */}
        <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute bottom-2 right-2">
          <span className="text-xs text-blue-600 font-semibold">
            Click for details
          </span>
        </div>
      </button>
    </div>
  );
});

ItemCard.displayName = 'ItemCard';