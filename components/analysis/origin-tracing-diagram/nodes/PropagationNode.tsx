'use client';

import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { NodeData } from '../../../../types/origin-tracing';
import { getPlatformIcon } from '../../../../lib/analysis/origin-tracing-icons';
import { formatMultilineText } from '../../../../lib/analysis/origin-tracing-utils';

export function PropagationNode({ data }: { data: NodeData }) {
  return (
    <div className="px-5 py-4 bg-orange-50 border-2 border-orange-200 rounded-xl shadow-lg min-w-[200px] max-w-[280px]">
      {/* All-direction handles */}
      <Handle type="target" position={Position.Top} id="top" />
      <Handle type="source" position={Position.Bottom} id="bottom" />
      <Handle type="target" position={Position.Left} id="left" />
      <Handle type="source" position={Position.Right} id="right" />
      
      <div className="flex items-center gap-3 mb-3">
        <div className="flex-shrink-0">
          {getPlatformIcon(data.platform || data.label)}
        </div>
        <div className="font-semibold text-orange-900 text-sm">Propagation</div>
      </div>
      <div className="text-sm text-orange-800 leading-relaxed break-words">
        {formatMultilineText(data.label, 2)}
      </div>
    </div>
  );
}

