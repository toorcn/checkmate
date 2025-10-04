'use client';

import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { ExternalLink } from 'lucide-react';
import { Badge } from '../../../ui/badge';
import { NodeData } from '../../../../types/origin-tracing';
import { getPlatformIcon } from '../../../../lib/analysis/origin-tracing-icons';
import { formatMultilineText, formatNodeText } from '../../../../lib/analysis/origin-tracing-utils';

export function SourceNode({ data }: { data: NodeData }) {
  return (
    <div className="px-5 py-4 bg-emerald-50 border-2 border-emerald-200 rounded-xl shadow-lg min-w-[220px] max-w-[320px]">
      {/* All-direction handles */}
      <Handle type="target" position={Position.Top} id="top" />
      <Handle type="source" position={Position.Bottom} id="bottom" />
      <Handle type="target" position={Position.Left} id="left" />
      <Handle type="source" position={Position.Right} id="right" />
      
      <div className="flex items-center gap-3 mb-3">
        <div className="flex-shrink-0">
          {getPlatformIcon(data.sourceName || data.label)}
        </div>
        <div className="flex-1">
          <div className="font-semibold text-emerald-900 text-sm mb-1">
            {data.sourceName ? formatNodeText(data.sourceName, 30) : 'Fact-Check Source'}
          </div>
          <Badge variant="outline" className="text-xs bg-emerald-100 text-emerald-800">
            {data.credibility}% credible
          </Badge>
        </div>
      </div>
      <div className="text-sm text-emerald-800 mb-3 leading-relaxed break-words">
        {formatMultilineText(data.label, 2)}
      </div>
      {data.url && (
        <a
          href={data.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-xs text-emerald-700 hover:text-emerald-900 underline font-medium break-all"
        >
          View Source <ExternalLink className="h-3 w-3" />
        </a>
      )}
    </div>
  );
}

