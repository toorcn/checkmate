'use client';

import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { NodeData } from '../../../../types/origin-tracing';
import { getBiasIcon } from '../../../../lib/analysis/origin-tracing-icons';
import { formatMultilineText, formatNodeText } from '../../../../lib/analysis/origin-tracing-utils';

export function BeliefDriverNode({ data }: { data: NodeData }) {
  return (
    <div className="px-5 py-4 bg-violet-50 border-2 border-violet-200 rounded-xl shadow-lg min-w-[220px] max-w-[360px]">
      {/* All-direction handles */}
      <Handle type="target" position={Position.Top} id="top" />
      <Handle type="source" position={Position.Bottom} id="bottom" />
      <Handle type="target" position={Position.Left} id="left" />
      <Handle type="source" position={Position.Right} id="right" />
      
      <div className="flex items-center gap-3 mb-3">
        <div className="flex-shrink-0">
          {getBiasIcon(data.name || '')}
        </div>
        <div className="font-semibold text-violet-900 text-sm">Why People Believe</div>
      </div>
      <div className="text-sm text-violet-800 font-medium mb-2 break-words">
        {formatNodeText(data.name, 60)}
      </div>
      <div className="text-xs text-violet-700 leading-relaxed mb-2 break-words">
        {formatMultilineText(data.description, 3)}
      </div>
      {Array.isArray(data.references) && data.references.length > 0 && (
        <div className="mt-2 space-y-1">
          {data.references.slice(0, 2).map((ref, idx) => (
            <a
              key={idx}
              href={ref.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block text-[11px] text-violet-800 underline break-all"
              title={ref.title}
            >
              {formatNodeText(ref.title, 50)}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

