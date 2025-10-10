'use client';

import React, { useEffect, useRef } from 'react';
import { Node } from '@xyflow/react';
import { Badge } from '../../../ui/badge';
import { X, ExternalLink } from 'lucide-react';
import { getCredibilityColor } from '../utils/navigationUtils';

interface DetailOverlayProps {
  node: Node;
  item: {
    label: string;
    icon: React.ReactNode;
  };
  onClose: () => void;
}

export const DetailOverlay = React.memo(({ node, item, onClose }: DetailOverlayProps) => {
  const overlayRef = useRef<HTMLDivElement>(null);
  const credibility = node?.data.credibility !== undefined ? Number(node.data.credibility) : null;
  const colors = credibility !== null ? getCredibilityColor(credibility) : null;

  // Get metadata from node
  const getMetadata = () => {
    const meta: Array<{ label: string; value: string }> = [];
    if (node?.data.source) meta.push({ label: 'Source', value: String(node.data.source) });
    if (node?.data.platform) meta.push({ label: 'Platform', value: String(node.data.platform) });
    if (node?.data.date) meta.push({ label: 'Date', value: String(node.data.date) });
    if (node?.data.reach) meta.push({ label: 'Reach', value: String(node.data.reach) });
    if (node?.data.type) meta.push({ label: 'Type', value: String(node.data.type) });
    return meta;
  };

  const metadata = getMetadata();

  // Get full description
  const getDescription = () => {
    if (node.type === 'beliefDriver' && node.data.description) {
      return String(node.data.description);
    }
    if ((node.type === 'origin' || node.type === 'evolution' || node.type === 'propagation') && node.data.label) {
      return String(node.data.label);
    }
    if (node.type === 'source' && node.data.label) {
      return String(node.data.label);
    }
    if (node.type === 'claim' && node.data.label) {
      return String(node.data.label);
    }
    return item.label;
  };

  // ESC key handler
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (overlayRef.current && !overlayRef.current.contains(e.target as HTMLElement)) {
        onClose();
      }
    };
    // Add slight delay to prevent immediate close on the same click that opened it
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 100);
    
    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  return (
    <div
      ref={overlayRef}
      className="detail-overlay-container absolute left-0 right-0 w-full z-50 animate-slide-up-fade"
      style={{
        bottom: '16px',
        marginLeft: '16px',
        marginRight: '16px',
        width: 'calc(100% - 32px)',
        maxHeight: 'min(240px, 35vh)',
      }}
    >
      <div
        className={`relative bg-card/95 backdrop-blur-xl rounded-2xl shadow-2xl border-2 ${colors?.border || 'border-border'} overflow-hidden`}
        style={{
          borderTopWidth: '4px',
          boxShadow: `0 -10px 40px rgba(0, 0, 0, 0.15), 0 0 0 1px ${colors?.border ? 'rgba(59, 130, 246, 0.1)' : 'rgba(203, 213, 225, 0.5)'}`,
        }}
      >
        {/* Compact Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/50">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {/* Color-coded circle */}
            <div
              className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                colors ? `${colors.gradient} bg-gradient-to-br` : 'bg-muted'
              } border-2 ${colors?.border || 'border-border'} shadow-sm`}
            >
              <div className="opacity-80 scale-75">{item.icon}</div>
            </div>

            {/* Title & Credibility inline */}
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <h3 className="text-sm font-bold text-foreground leading-tight truncate">
                {item.label}
              </h3>
              {credibility !== null && (
                <Badge className={`${colors?.badge || 'bg-muted text-foreground'} font-bold text-xs flex-shrink-0`}>
                  {credibility}%
                </Badge>
              )}
              {node?.data.date ? (
                <span className="text-xs text-muted-foreground font-medium flex-shrink-0">
                  {String(node.data.date)}
                </span>
              ) : null}
            </div>
          </div>

          {/* Close button */}
          <button
            onClick={onClose}
            className="flex-shrink-0 ml-2 p-1 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            aria-label="Close details"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Compact horizontal scrollable content */}
        <div className="overflow-y-auto max-h-[180px] px-4 py-3 space-y-3">
          {/* Description - Most important, shown first */}
          <div>
            <div className={`text-sm text-foreground leading-relaxed bg-gradient-to-br ${colors?.gradient || 'from-muted to-muted/50'} p-3 rounded-lg`}>
              {getDescription()}
            </div>
          </div>

          {/* Horizontal info row - Metadata + Impact side by side */}
          <div className="flex gap-3">
            {/* Metadata compact */}
            {metadata.length > 0 && (
              <div className="flex-1">
                <div className="grid grid-cols-2 gap-2 bg-muted p-3 rounded-lg">
                  {metadata.map((meta, idx) => (
                    <div key={idx} className="space-y-0.5">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        {meta.label}
                      </p>
                      <p className="text-xs font-medium text-foreground truncate">
                        {meta.value}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Impact compact */}
            {node.data.impact && typeof node.data.impact === 'string' ? (
              <div className="flex-1">
                <div className="text-xs text-foreground leading-relaxed bg-muted/80 p-3 rounded-lg h-full">
                  <p className="font-bold text-foreground mb-1 text-xs">Impact</p>
                  {String(node.data.impact)}
                </div>
              </div>
            ) : null}
          </div>

          {/* Action buttons - horizontal row */}
          <div className="flex gap-2">
            {/* View Source Button */}
            {node.data.url && typeof node.data.url === 'string' ? (
              <a
                href={node.data.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex items-center justify-center gap-2 flex-1 text-xs ${colors?.text || 'text-primary'} hover:text-primary font-semibold transition-all bg-muted hover:bg-muted/80 px-3 py-2 rounded-lg border ${colors?.border || 'border-border'} hover:shadow-md`}
                onClick={(e) => e.stopPropagation()}
              >
                <ExternalLink className="h-3.5 w-3.5" />
                View Source
              </a>
            ) : null}

            {/* References count button */}
            {node.data.references && Array.isArray(node.data.references) && node.data.references.length > 0 ? (
              <div className="flex items-center gap-1 px-3 py-2 text-xs font-semibold text-muted-foreground bg-muted rounded-lg border border-border">
                <span>{node.data.references.length} {node.data.references.length === 1 ? 'Reference' : 'References'}</span>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
});

DetailOverlay.displayName = 'DetailOverlay';
