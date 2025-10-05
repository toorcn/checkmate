'use client';

import React from 'react';
import { Node } from '@xyflow/react';
import { Badge } from '../../../ui/badge';
import { ShieldCheck, AlertTriangle, XCircle, HelpCircle } from 'lucide-react';
import { getVerdictColor } from '../utils/navigationUtils';

interface CurrentClaimHeroProps {
  claimNode: Node | null;
  verdict: string;
  totalSources?: number;
}

export const CurrentClaimHero = React.memo(({ claimNode, verdict, totalSources = 0 }: CurrentClaimHeroProps) => {
  const colors = getVerdictColor(verdict);
  
  const getVerdictIcon = () => {
    switch (verdict.toLowerCase()) {
      case 'verified':
      case 'true':
        return <ShieldCheck className="h-6 w-6 text-emerald-600" />;
      case 'misleading':
      case 'satire':
        return <AlertTriangle className="h-6 w-6 text-yellow-600" />;
      case 'false':
        return <XCircle className="h-6 w-6 text-red-600" />;
      default:
        return <HelpCircle className="h-6 w-6 text-blue-600" />;
    }
  };

  const getVerdictLabel = () => {
    return verdict.charAt(0).toUpperCase() + verdict.slice(1);
  };

  if (!claimNode) {
    return (
      <div className="mb-6 p-6 bg-gradient-to-br from-slate-50 to-slate-100 backdrop-blur-xl border-2 border-slate-200 rounded-2xl shadow-xl">
        <div className="text-center text-slate-600 text-sm">
          Current claim information unavailable
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`mb-6 p-6 bg-gradient-to-br ${colors.gradient} backdrop-blur-xl border-2 ${colors.border} rounded-2xl shadow-2xl transition-all duration-500 hover:shadow-3xl hover:scale-[1.02] relative overflow-hidden group`}
      style={{
        minHeight: '150px',
        backgroundImage: 'linear-gradient(135deg, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0.6) 100%)',
      }}
    >
      {/* Animated border glow */}
      <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none hero-glow-border" />
      
      <div className="relative z-10">
        {/* Header with icon and verdict */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/80 rounded-xl shadow-md">
              {getVerdictIcon()}
            </div>
            <div>
              <h3 className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                Current Claim
              </h3>
              <Badge className={`mt-1 ${colors.badge} font-bold text-xs shadow-sm`}>
                {getVerdictLabel()}
              </Badge>
            </div>
          </div>
        </div>

        {/* Claim content */}
        <div className="mb-4">
          <p className={`text-sm font-bold ${colors.text} leading-relaxed line-clamp-3`}>
            {claimNode.data.label ? String(claimNode.data.label) : 'No claim text available'}
          </p>
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-4 pt-3 border-t-2 border-white/50">
          {claimNode.data.credibility !== undefined ? (
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-600">Credibility:</span>
              <Badge variant="outline" className="bg-white/80 font-bold text-xs">
                {Number(claimNode.data.credibility)}%
              </Badge>
            </div>
          ) : null}
          {totalSources > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-600">Sources:</span>
              <Badge variant="outline" className="bg-white/80 font-bold text-xs">
                {totalSources}
              </Badge>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

CurrentClaimHero.displayName = 'CurrentClaimHero';


