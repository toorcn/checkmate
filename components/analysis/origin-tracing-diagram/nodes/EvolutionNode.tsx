'use client';

import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { NodeData } from '../../../../types/origin-tracing';
import { getPlatformIcon } from '../../../../lib/analysis/origin-tracing-icons';
import { formatMultilineText, formatNodeText } from '../../../../lib/analysis/origin-tracing-utils';

export function EvolutionNode({ data }: { data: NodeData }) {
  return (
    <div className="relative px-6 py-5 bg-gradient-to-br from-purple-50 via-violet-50 to-fuchsia-50 border-2 border-purple-300 rounded-2xl shadow-lg min-w-[220px] max-w-[300px] transition-all duration-300 backdrop-blur-sm">
      {/* All-direction handles */}
      <Handle type="target" position={Position.Top} id="top" style={{ opacity: 0 }} />
      <Handle type="source" position={Position.Bottom} id="bottom" style={{ opacity: 0 }} />
      <Handle type="target" position={Position.Left} id="left" style={{ opacity: 0 }} />
      <Handle type="source" position={Position.Right} id="right" style={{ opacity: 0 }} />
      
      {/* Corner accent */}
      <div className="absolute bottom-0 right-0 w-14 h-14 bg-white/40 rounded-tl-full -z-10" />
      
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-white/70 rounded-xl shadow-sm flex-shrink-0">
          {getPlatformIcon(data.platform || data.label)}
        </div>
        <div className="font-bold text-purple-900 text-sm tracking-tight">
          {formatNodeText(data.platform || 'Evolution', 50)}
        </div>
      </div>
      <div className="text-sm text-purple-900/90 leading-relaxed mb-2 break-words font-medium">
        {formatMultilineText(data.label, 2)}
      </div>
      {data.impact && (
        <div className="mt-3 pt-3 border-t border-purple-200 text-xs text-purple-700 font-medium break-words bg-white/40 px-3 py-2 rounded-lg">
          <span className="font-semibold">Impact:</span> {formatNodeText(data.impact, 80)}
        </div>
      )}
    </div>
  );
}

