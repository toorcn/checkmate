'use client';

import React from 'react';
import { Badge } from '../../../ui/badge';
import { AlertCircle } from 'lucide-react';
import { getCredibilityColor } from '../utils/navigationUtils';

interface SectionPreviewProps {
  totalItems: number;
  avgCredibility: number;
  hasAlerts: boolean;
  sectionType: 'evolution' | 'belief' | 'source';
}

export const SectionPreview = React.memo(({ 
  totalItems, 
  avgCredibility, 
  hasAlerts,
  sectionType 
}: SectionPreviewProps) => {
  const colors = getCredibilityColor(avgCredibility);

  // Render credibility bar based on section type
  const renderCredibilityIndicator = () => {
    if (avgCredibility === 0) return null;

    return (
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden max-w-[60px]">
          <div 
            className={`h-full bg-gradient-to-r ${colors.gradient} transition-all duration-500`}
            style={{ width: `${avgCredibility}%` }}
          />
        </div>
        <span className={`text-xs font-bold ${colors.text}`}>
          {avgCredibility}%
        </span>
      </div>
    );
  };

  return (
    <div className="flex items-center gap-3 ml-auto">
      {/* Alert indicator */}
      {hasAlerts && (
        <div className="flex items-center gap-1 text-amber-600" title="Contains alerts">
          <AlertCircle className="h-3.5 w-3.5" />
        </div>
      )}

      {/* Credibility indicator */}
      {avgCredibility > 0 && renderCredibilityIndicator()}

      {/* Item count badge */}
      <Badge 
        variant="outline" 
        className="text-xs font-semibold bg-white/80 border-slate-300 shadow-sm"
      >
        {totalItems}
      </Badge>
    </div>
  );
});

SectionPreview.displayName = 'SectionPreview';


