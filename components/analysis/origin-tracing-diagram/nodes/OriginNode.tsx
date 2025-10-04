'use client';

import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { NodeData } from '../../../../types/origin-tracing';
import { getPlatformIcon } from '../../../../lib/analysis/origin-tracing-icons';
import { formatMultilineText } from '../../../../lib/analysis/origin-tracing-utils';

export function OriginNode({ data }: { data: NodeData }) {
  return (
    <div className="relative px-6 py-5 bg-gradient-to-br from-sky-50 via-blue-50 to-indigo-50 border-2 border-sky-300 rounded-2xl shadow-lg min-w-[220px] max-w-[320px] transition-all duration-300 backdrop-blur-sm">
      {/* All-direction handles */}
      <Handle type="target" position={Position.Top} id="top" style={{ opacity: 0 }} />
      <Handle type="source" position={Position.Bottom} id="bottom" style={{ opacity: 0 }} />
      <Handle type="target" position={Position.Left} id="left" style={{ opacity: 0 }} />
      <Handle type="source" position={Position.Right} id="right" style={{ opacity: 0 }} />
      
      {/* Corner accent */}
      <div className="absolute top-0 left-0 w-16 h-16 bg-white/40 rounded-br-full -z-10" />
      
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-white/70 rounded-xl shadow-sm flex-shrink-0">
          {getPlatformIcon(data.label)}
        </div>
        <div className="font-bold text-sky-900 text-sm tracking-tight">Original Source</div>
      </div>
      <div className="text-sm text-sky-900/90 leading-relaxed break-words font-medium">
        {formatMultilineText(data.label, 2)}
      </div>
    </div>
  );
}

