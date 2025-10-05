'use client';

import React, { useRef, useEffect } from 'react';
import { Node } from '@xyflow/react';
import { Badge } from '../../../ui/badge';
import { ExternalLink, ArrowRight, ChevronDown } from 'lucide-react';
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
  isFocused: boolean;
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
  isFocused,
  onItemClick,
  onMouseEnter,
  onMouseLeave,
  showConnection = false,
  index,
}: ItemCardProps) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const credibility = node?.data.credibility !== undefined ? Number(node.data.credibility) : null;
  const colors = credibility !== null ? getCredibilityColor(credibility) : null;
  
  // Auto-scroll to card when it becomes focused/expanded
  useEffect(() => {
    if (isFocused && cardRef.current) {
      // Delay to allow expansion animation to complete (matches spring-expand timing)
      const scrollTimer = setTimeout(() => {
        if (!cardRef.current) return;
        
        // Get the parent scrollable container
        const scrollContainer = cardRef.current.closest('.overflow-y-auto');
        if (!scrollContainer) {
          // Fallback to standard scrollIntoView
          cardRef.current.scrollIntoView({
            behavior: 'smooth',
            block: 'nearest',
          });
          return;
        }
        
        // Calculate positions
        const cardRect = cardRef.current.getBoundingClientRect();
        const containerRect = scrollContainer.getBoundingClientRect();
        
        // Check if the bottom of the card is below the visible area
        const cardBottom = cardRect.bottom;
        const containerBottom = containerRect.bottom;
        
        if (cardBottom > containerBottom || cardRect.top < containerRect.top) {
          // Scroll to show the entire card with some padding
          cardRef.current.scrollIntoView({
            behavior: 'smooth',
            block: 'nearest',
          });
        }
      }, 300); // Wait for spring-expand animation (500ms) to mostly complete
      
      return () => clearTimeout(scrollTimer);
    }
  }, [isFocused]);
  
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
        className={`w-full text-left transition-all duration-300 border-2 p-4 group relative overflow-hidden ${
          isAnimating 
            ? `${colors?.gradient ? `bg-gradient-to-br ${colors.gradient}` : 'bg-gradient-to-br from-blue-50 to-indigo-50'} ${colors?.border || 'border-blue-400'} shadow-lg scale-105 rounded-xl` 
            : isFocused
            ? `bg-white ${colors?.border || 'border-blue-400'} shadow-xl ${isFocused ? 'rounded-t-xl' : 'rounded-xl'}`
            : 'bg-white/80 border-slate-200 hover:border-slate-300 hover:shadow-lg hover:-translate-y-1 rounded-xl'
        }`}
      >
        {/* Animated pulse indicator for active item */}
        {isAnimating && (
          <div className="absolute top-2 right-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full pulse-indicator shadow-lg shadow-blue-500/50" />
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
        {showConnection && !isFocused && (
          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium pt-2 border-t border-slate-200">
            <ArrowRight className="w-3 h-3" />
            <span>Evolved to next</span>
          </div>
        )}

        {/* Expand indicator - subtle visual cue */}
        {!isFocused && (
          <div className="flex items-center justify-center gap-2 mt-3 pt-3 border-t border-slate-200/60 text-slate-400 group-hover:text-blue-500 transition-colors">
            <ChevronDown className="w-4 h-4" />
          </div>
        )}
      </button>

      {/* Expanded details - integrated within card container */}
      {isFocused && node && (
        <div className={`px-4 pb-4 pt-1 spring-expand bg-white border-2 ${colors?.border || 'border-blue-400'} border-t-0 rounded-b-xl shadow-xl`}>
          {/* Divider */}
          <div className={`w-full h-0.5 bg-gradient-to-r ${colors?.gradient || 'from-blue-300 via-indigo-300 to-purple-300'} mb-4 mt-3`} />
          
          <div className="space-y-3">
            {/* Full Description */}
            <div className="text-sm text-slate-800 leading-relaxed">
              <p className="font-bold text-slate-900 mb-2 flex items-center gap-2">
                <span className={`w-1 h-5 bg-gradient-to-b ${colors?.gradient || 'from-blue-500 to-indigo-500'} rounded-full`} />
                Full Details
              </p>
              <div className="text-slate-700 bg-slate-50/80 p-3 rounded-lg">
                {node.type === 'beliefDriver' && node.data.description ? (
                  <span>{String(node.data.description)}</span>
                ) : null}
                {(node.type === 'origin' || node.type === 'evolution' || node.type === 'propagation') && node.data.label ? (
                  <span>{String(node.data.label)}</span>
                ) : null}
                {node.type === 'source' && node.data.label ? (
                  <span>{String(node.data.label)}</span>
                ) : null}
                {node.type === 'claim' && node.data.label ? (
                  <span>{String(node.data.label)}</span>
                ) : null}
              </div>
            </div>

            {/* Impact */}
            {node.data.impact && typeof node.data.impact === 'string' ? (
              <div className="text-sm text-slate-800 leading-relaxed">
                <p className="font-bold text-slate-900 mb-2 flex items-center gap-2">
                  <span className="w-1 h-5 bg-gradient-to-b from-amber-500 to-orange-500 rounded-full" />
                  Impact
                </p>
                <div className="text-slate-700 bg-amber-50/80 p-3 rounded-lg">
                  {String(node.data.impact)}
                </div>
              </div>
            ) : null}

            {/* URL Link */}
            {node.data.url && typeof node.data.url === 'string' ? (
              <div className="pt-2">
                <a
                  href={node.data.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`inline-flex items-center gap-2 text-sm ${colors?.text || 'text-blue-700'} hover:text-blue-900 font-semibold transition-all bg-slate-50 hover:bg-slate-100 px-4 py-2.5 rounded-lg border-2 border-slate-200 hover:border-slate-300 w-full justify-center`}
                  onClick={(e) => e.stopPropagation()}
                >
                  <ExternalLink className="h-4 w-4" />
                  View Source
                </a>
              </div>
            ) : null}

            {/* References */}
            {node.data.references && Array.isArray(node.data.references) && node.data.references.length > 0 ? (
              <div className="text-sm">
                <p className="font-bold text-slate-900 mb-2 flex items-center gap-2">
                  <span className="w-1 h-5 bg-gradient-to-b from-green-500 to-emerald-500 rounded-full" />
                  References
                </p>
                <div className="space-y-2">
                  {node.data.references.slice(0, 3).map((ref: any, idx: number) => (
                    <a
                      key={idx}
                      href={ref.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`flex items-start gap-2 text-sm ${colors?.text || 'text-blue-700'} hover:text-blue-900 font-medium bg-slate-50 hover:bg-slate-100 p-3 rounded-lg border border-slate-200 hover:border-slate-300 transition-all`}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <ExternalLink className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                      <span className="flex-1">{ref.title}</span>
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
});

ItemCard.displayName = 'ItemCard';

