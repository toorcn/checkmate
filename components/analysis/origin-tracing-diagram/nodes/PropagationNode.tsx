'use client';

import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { NodeData } from '../../../../types/origin-tracing';
import { getPlatformIcon } from '../../../../lib/analysis/origin-tracing-icons';
import { formatMultilineText } from '../../../../lib/analysis/origin-tracing-utils';

export function PropagationNode({ data }: { data: NodeData }) {
  return (
    <div className="relative px-6 py-5 bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 border-2 border-orange-300 rounded-2xl shadow-lg min-w-[200px] max-w-[280px] transition-all duration-300 backdrop-blur-sm">
      {/* All-direction handles */}
      <Handle type="target" position={Position.Top} id="top" />
      <Handle type="source" position={Position.Bottom} id="bottom" />
      <Handle type="target" position={Position.Left} id="left" />
      <Handle type="source" position={Position.Right} id="right" />
      
      {/* Corner accent */}
      <div className="absolute top-0 right-0 w-14 h-14 bg-white/40 rounded-bl-full -z-10" />
      
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-white/70 rounded-xl shadow-sm flex-shrink-0">
          {getPlatformIcon(data.platform || data.label)}
        </div>
        <div className="font-bold text-orange-900 text-sm tracking-tight">Propagation</div>
      </div>
      <div className="text-sm text-orange-900/90 leading-relaxed break-words font-medium">
        {formatMultilineText(data.label, 2)}
      </div>
    </div>
  );
}

