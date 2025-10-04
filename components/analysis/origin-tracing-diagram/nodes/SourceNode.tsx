'use client';

import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { ExternalLink } from 'lucide-react';
import { Badge } from '../../../ui/badge';
import { NodeData } from '../../../../types/origin-tracing';
import { getPlatformIcon } from '../../../../lib/analysis/origin-tracing-icons';
import { formatMultilineText, formatNodeText } from '../../../../lib/analysis/origin-tracing-utils';

export function SourceNode({ data }: { data: NodeData }) {
  const credibilityColor = data.credibility >= 80 ? 'emerald' : data.credibility >= 60 ? 'teal' : 'slate';
  
  return (
    <div className={`relative px-6 py-5 bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 border-2 border-emerald-300 rounded-2xl shadow-lg min-w-[220px] max-w-[320px] transition-all duration-300 backdrop-blur-sm`}>
      {/* All-direction handles */}
      <Handle type="target" position={Position.Top} id="top" style={{ opacity: 0 }} />
      <Handle type="source" position={Position.Bottom} id="bottom" style={{ opacity: 0 }} />
      <Handle type="target" position={Position.Left} id="left" style={{ opacity: 0 }} />
      <Handle type="source" position={Position.Right} id="right" style={{ opacity: 0 }} />
      
      {/* Corner accent */}
      <div className="absolute top-0 right-0 w-16 h-16 bg-white/40 rounded-bl-full -z-10" />
      
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-white/70 rounded-xl shadow-sm flex-shrink-0">
          {getPlatformIcon(data.sourceName || data.label)}
        </div>
        <div className="flex-1">
          <div className="font-bold text-emerald-900 text-sm mb-2 tracking-tight">
            {data.sourceName ? formatNodeText(data.sourceName, 30) : 'Fact-Check Source'}
          </div>
          <Badge 
            variant="outline" 
            className={`text-xs font-semibold bg-${credibilityColor}-100 text-${credibilityColor}-800 border-${credibilityColor}-300 shadow-sm`}
          >
            {data.credibility}% credible
          </Badge>
        </div>
      </div>
      <div className="text-sm text-emerald-900/90 mb-4 leading-relaxed break-words font-medium">
        {formatMultilineText(data.label, 2)}
      </div>
      {data.url && (
        <a
          href={data.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-xs text-emerald-700 hover:text-emerald-900 font-semibold transition-colors break-all bg-white/60 px-3 py-2 rounded-lg hover:bg-white/80"
        >
          View Source <ExternalLink className="h-3.5 w-3.5" />
        </a>
      )}
    </div>
  );
}

