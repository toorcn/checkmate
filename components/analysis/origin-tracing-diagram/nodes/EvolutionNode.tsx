'use client';

import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { NodeData } from '../../../../types/origin-tracing';
import { getPlatformIcon } from '../../../../lib/analysis/origin-tracing-icons';
import { formatMultilineText, formatNodeText } from '../../../../lib/analysis/origin-tracing-utils';

export function EvolutionNode({ data }: { data: NodeData }) {
  return (
    <div className="px-5 py-4 bg-purple-50 border-2 border-purple-200 rounded-xl shadow-lg min-w-[220px] max-w-[300px]">
      {/* All-direction handles */}
      <Handle type="target" position={Position.Top} id="top" />
      <Handle type="source" position={Position.Bottom} id="bottom" />
      <Handle type="target" position={Position.Left} id="left" />
      <Handle type="source" position={Position.Right} id="right" />
      
      <div className="flex items-center gap-3 mb-3">
        <div className="flex-shrink-0">
          {getPlatformIcon(data.platform || data.label)}
        </div>
        <div className="font-semibold text-purple-900 text-sm">
          {formatNodeText(data.platform || 'Evolution', 50)}
        </div>
      </div>
      <div className="text-sm text-purple-800 leading-relaxed mb-2 break-words">
        {formatMultilineText(data.label, 2)}
      </div>
      {data.impact && (
        <div className="text-xs text-purple-600 italic break-words">
          Impact: {formatNodeText(data.impact, 80)}
        </div>
      )}
    </div>
  );
}

