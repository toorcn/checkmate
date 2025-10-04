'use client';

import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { CheckCircle, AlertTriangle, XCircle, HelpCircle, Shield } from 'lucide-react';
import { Badge } from '../../../ui/badge';
import { NodeData } from '../../../../types/origin-tracing';
import { formatMultilineText } from '../../../../lib/analysis/origin-tracing-utils';

export function ClaimNode({ data }: { data: NodeData }) {
  const verdictStyles = {
    verified: {
      bg: 'bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50',
      border: 'border-emerald-300',
      text: 'text-emerald-900',
      iconColor: 'text-emerald-600',
      badge: 'bg-emerald-100 text-emerald-800 border-emerald-300'
    },
    misleading: {
      bg: 'bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50',
      border: 'border-amber-300',
      text: 'text-amber-900',
      iconColor: 'text-amber-600',
      badge: 'bg-amber-100 text-amber-800 border-amber-300'
    },
    false: {
      bg: 'bg-gradient-to-br from-rose-50 via-red-50 to-pink-50',
      border: 'border-rose-300',
      text: 'text-rose-900',
      iconColor: 'text-rose-600',
      badge: 'bg-rose-100 text-rose-800 border-rose-300'
    },
    unverified: {
      bg: 'bg-gradient-to-br from-slate-50 via-gray-50 to-zinc-50',
      border: 'border-slate-300',
      text: 'text-slate-900',
      iconColor: 'text-slate-600',
      badge: 'bg-slate-100 text-slate-800 border-slate-300'
    },
    satire: {
      bg: 'bg-gradient-to-br from-violet-50 via-purple-50 to-fuchsia-50',
      border: 'border-violet-300',
      text: 'text-violet-900',
      iconColor: 'text-violet-600',
      badge: 'bg-violet-100 text-violet-800 border-violet-300'
    },
  };

  const verdictIcons = {
    verified: CheckCircle,
    misleading: AlertTriangle,
    false: XCircle,
    unverified: HelpCircle,
    satire: HelpCircle,
  };

  const Icon = verdictIcons[data.verdict as keyof typeof verdictIcons] || HelpCircle;
  const styles = verdictStyles[data.verdict as keyof typeof verdictStyles] || verdictStyles.unverified;

  return (
    <div className={`relative px-7 py-6 border-2 rounded-2xl shadow-2xl min-w-[280px] max-w-[400px] backdrop-blur-sm transition-all duration-300 ${styles.bg} ${styles.border} ${styles.text}`}>
      {/* All-direction handles for the central claim node */}
      <Handle type="target" position={Position.Top} id="top" style={{ opacity: 0 }} />
      <Handle type="source" position={Position.Bottom} id="bottom" style={{ opacity: 0 }} />
      <Handle type="target" position={Position.Left} id="left" style={{ opacity: 0 }} />
      <Handle type="source" position={Position.Right} id="right" style={{ opacity: 0 }} />
      
      {/* Corner accent */}
      <div className="absolute top-0 right-0 w-20 h-20 bg-white/30 rounded-bl-full -z-10" />
      
      <div className="flex items-center gap-3 font-bold mb-4">
        <div className={`p-1.5 rounded-lg bg-white/60 ${styles.iconColor}`}>
          <Icon className="h-5 w-5" />
        </div>
        <span className="text-base tracking-tight">Current Claim</span>
      </div>
      <div className="text-sm mb-4 leading-relaxed break-words font-medium">
        {formatMultilineText(data.label, 3)}
      </div>
      <div className="flex items-center gap-2 pt-3 border-t border-current/10">
        <Badge variant="outline" className={`text-xs font-semibold uppercase tracking-wide ${styles.badge}`}>
          {data.verdict}
        </Badge>
        <Shield className="h-3.5 w-3.5 opacity-50" />
      </div>
    </div>
  );
}

