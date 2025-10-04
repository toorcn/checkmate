'use client';

import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { NodeData } from '../../../../types/origin-tracing';
import { getBiasIcon } from '../../../../lib/analysis/origin-tracing-icons';
import { formatMultilineText, formatNodeText } from '../../../../lib/analysis/origin-tracing-utils';

export function BeliefDriverNode({ data }: { data: NodeData }) {
  return (
    <div className="relative px-6 py-5 bg-gradient-to-br from-violet-50 via-purple-50 to-indigo-50 border-2 border-violet-300 rounded-2xl shadow-lg min-w-[220px] max-w-[360px] transition-all duration-300 backdrop-blur-sm">
      {/* All-direction handles */}
      <Handle type="target" position={Position.Top} id="top" />
      <Handle type="source" position={Position.Bottom} id="bottom" />
      <Handle type="target" position={Position.Left} id="left" />
      <Handle type="source" position={Position.Right} id="right" />
      
      {/* Corner accent */}
      <div className="absolute bottom-0 left-0 w-16 h-16 bg-white/40 rounded-tr-full -z-10" />
      
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-white/70 rounded-xl shadow-sm flex-shrink-0">
          {getBiasIcon(data.name || '')}
        </div>
        <div className="font-bold text-violet-900 text-sm tracking-tight">Why People Believe</div>
      </div>
      <div className="text-sm text-violet-900 font-bold mb-3 break-words">
        {formatNodeText(data.name, 60)}
      </div>
      <div className="text-xs text-violet-800/90 leading-relaxed mb-3 break-words font-medium">
        {formatMultilineText(data.description, 3)}
      </div>
      {Array.isArray(data.references) && data.references.length > 0 && (
        <div className="mt-4 pt-4 border-t border-violet-200 space-y-2">
          {data.references.slice(0, 2).map((ref, idx) => (
            <a
              key={idx}
              href={ref.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block text-[11px] text-violet-700 hover:text-violet-900 font-semibold transition-colors break-all bg-white/60 px-3 py-2 rounded-lg hover:bg-white/80"
              title={ref.title}
            >
              → {formatNodeText(ref.title, 50)}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

