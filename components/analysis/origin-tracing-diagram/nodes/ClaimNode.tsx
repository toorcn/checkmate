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
    partially_true: {
      bg: 'bg-gradient-to-br from-yellow-50 via-amber-50 to-orange-50',
      border: 'border-yellow-300',
      text: 'text-yellow-900',
      iconColor: 'text-yellow-600',
      badge: 'bg-yellow-100 text-yellow-800 border-yellow-300'
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
      border: 'border-border',
      text: 'text-foreground',
      iconColor: 'text-muted-foreground',
      badge: 'bg-muted text-foreground border-border'
    },
    satire: {
      bg: 'bg-gradient-to-br from-violet-50 via-purple-50 to-fuchsia-50',
      border: 'border-violet-300',
      text: 'text-violet-900',
      iconColor: 'text-violet-600',
      badge: 'bg-violet-100 text-violet-800 border-violet-300'
    },
    outdated: {
      bg: 'bg-gradient-to-br from-gray-50 via-slate-50 to-zinc-50',
      border: 'border-gray-300',
      text: 'text-gray-900',
      iconColor: 'text-gray-600',
      badge: 'bg-gray-100 text-gray-800 border-gray-300'
    },
    exaggerated: {
      bg: 'bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50',
      border: 'border-orange-300',
      text: 'text-orange-900',
      iconColor: 'text-orange-600',
      badge: 'bg-orange-100 text-orange-800 border-orange-300'
    },
    opinion: {
      bg: 'bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50',
      border: 'border-blue-300',
      text: 'text-blue-900',
      iconColor: 'text-blue-600',
      badge: 'bg-blue-100 text-blue-800 border-blue-300'
    },
    rumor: {
      bg: 'bg-gradient-to-br from-gray-50 via-slate-50 to-zinc-50',
      border: 'border-gray-300',
      text: 'text-gray-900',
      iconColor: 'text-gray-600',
      badge: 'bg-gray-100 text-gray-800 border-gray-300'
    },
    conspiracy: {
      bg: 'bg-gradient-to-br from-red-50 via-rose-50 to-pink-50',
      border: 'border-red-300',
      text: 'text-red-900',
      iconColor: 'text-red-600',
      badge: 'bg-red-100 text-red-800 border-red-300'
    },
    debunked: {
      bg: 'bg-gradient-to-br from-red-50 via-rose-50 to-pink-50',
      border: 'border-red-300',
      text: 'text-red-900',
      iconColor: 'text-red-600',
      badge: 'bg-red-100 text-red-800 border-red-300'
    },
  };

  const verdictIcons = {
    verified: CheckCircle,
    partially_true: AlertTriangle,
    misleading: AlertTriangle,
    false: XCircle,
    unverified: HelpCircle,
    satire: HelpCircle,
    outdated: HelpCircle,
    exaggerated: AlertTriangle,
    opinion: HelpCircle,
    rumor: HelpCircle,
    conspiracy: XCircle,
    debunked: XCircle,
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

