'use client';

import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { CheckCircle, AlertTriangle, XCircle, HelpCircle, Shield } from 'lucide-react';
import { Badge } from '../../../ui/badge';
import { NodeData } from '../../../../types/origin-tracing';
import { formatMultilineText } from '../../../../lib/analysis/origin-tracing-utils';

export function ClaimNode({ data }: { data: NodeData }) {
  const verdictColors = {
    verified: 'bg-green-50 border-green-200 text-green-900',
    misleading: 'bg-yellow-50 border-yellow-200 text-yellow-900',
    false: 'bg-red-50 border-red-200 text-red-900',
    unverified: 'bg-gray-50 border-gray-200 text-gray-900',
    satire: 'bg-purple-50 border-purple-200 text-purple-900',
  };

  const verdictIcons = {
    verified: CheckCircle,
    misleading: AlertTriangle,
    false: XCircle,
    unverified: HelpCircle,
    satire: HelpCircle,
  };

  const Icon = verdictIcons[data.verdict as keyof typeof verdictIcons] || HelpCircle;

  return (
    <div className={`px-6 py-5 border-2 rounded-xl shadow-xl min-w-[280px] max-w-[400px] ${verdictColors[data.verdict as keyof typeof verdictColors] || verdictColors.unverified}`}>
      {/* All-direction handles for the central claim node */}
      <Handle type="target" position={Position.Top} id="top" />
      <Handle type="source" position={Position.Bottom} id="bottom" />
      <Handle type="target" position={Position.Left} id="left" />
      <Handle type="source" position={Position.Right} id="right" />
      
      <div className="flex items-center gap-3 font-semibold mb-3">
        <Icon className="h-5 w-5" />
        <span className="text-base">Current Claim</span>
      </div>
      <div className="text-sm mb-3 leading-relaxed break-words">
        {formatMultilineText(data.label, 3)}
      </div>
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="text-xs font-medium">
          {data.verdict}
        </Badge>
        <Shield className="h-3 w-3 opacity-60" />
      </div>
    </div>
  );
}

